import {
    CancellationToken,
    ConfigurationTarget,
    DebugConfiguration, DebugConfigurationProvider,
    ProviderResult,
    WorkspaceFolder,
    commands, window, workspace
} from "vscode";
import * as path from "path";
import { RubicDebugHook, RubicProcess } from "../processes/rubicProcess";
import * as nls from "vscode-nls";
import { CMD_SHOW_CATALOG } from "../catalog/catalogViewer";

const localize = nls.config(Object.assign({
    messageFormat: nls.MessageFormat.file
}, JSON.parse(process.env.VSCODE_NLS_CONFIG || "{}")))(__filename);
const { RUBIC_DEBUG_SERVER_PORT } = process.env;

function getWorkspaceRoot(folder?: WorkspaceFolder): string {
    if (folder != null) {
        return folder.uri.fsPath;
    }
    if (workspace.workspaceFolders != null && workspace.workspaceFolders.length > 0) {
        return workspace.workspaceFolders[0].uri.fsPath;
    }
    return "";
}

function getWorkspaceName(folder?: WorkspaceFolder): string {
    if (folder != null) {
        return folder.name;
    }
    if (workspace.workspaceFolders != null && workspace.workspaceFolders.length > 0) {
        return workspace.workspaceFolders[0].name;
    }
    return "";
}

/**
 * Substitute variables for VSCode
 * @param input Input string
 */
function substituteVariables(input: string, folder?: WorkspaceFolder): string {
    let editor = window.activeTextEditor;
    let fileName = (editor != null) ? editor.document.fileName : null;
    let workspaceRoot = getWorkspaceRoot(folder);
    return input.replace(/\$\{(\w+)\}/g, (match, name) => {
        switch (name) {
            case "workspaceRoot":
            case "workspaceFolder":
                return workspaceRoot;
            case "workspaceRootFolderName":
            case "workspaceFolderBasename":
                return getWorkspaceName(folder);
            case "file":
                if (fileName != null) {
                    return fileName;
                }
                break;
            case "relativeFile":
                if (fileName != null) {
                    return path.relative(workspaceRoot, fileName);
                }
                break;
            case "fileBasename":
                if (fileName != null) {
                    return path.basename(fileName);
                }
                break;
            case "fileBasenameNoExtension":
                if (fileName != null) {
                    return path.basename(fileName, ".*");
                }
                break;
            case "fileDirname":
                if (fileName != null) {
                    return path.dirname(fileName);
                }
                break;
            case "fileExtname":
                if (fileName != null) {
                    return path.extname(fileName);
                }
                break;
            default:
                return "${" + name + "}";
        }
        return "";
    });
}

/**
 * Debug configuration provider for "rubic" type debugger
 */
export class RubicDebugConfigProvider implements DebugConfigurationProvider {
    constructor(private _debugHooks: RubicDebugHook[]) {
    }

    resolveDebugConfiguration(folder: WorkspaceFolder | undefined, config: DebugConfiguration, token?: CancellationToken): ProviderResult<DebugConfiguration> {
        let { sketch, catalogData } = RubicProcess.self;
        if (!sketch.isHardwareFixed) {
            let openMsg = localize("open-catalog", "Open catalog");
            RubicProcess.self.showInformationMessage(
                localize("choose-cfg-before-debug", "Before debugging, choose your board and firmware from Rubic catalog"),
                openMsg
            )
            .then((choice) => {
                if (choice === openMsg) {
                    commands.executeCommand(CMD_SHOW_CATALOG);
                }
            });
            throw new Error(localize("hw-cfg-not-set", "Hardware configuration is not set"));
        }

        if (!config.type || !config.request || !config.name) {
            // launch.json is missing or empty
            const { debuggers } = RubicProcess.self.packageJson.contributes;
            const rubicDebugger = (<any[]>debuggers).find((debug) => debug.type === "rubic");
            const { initialConfigurations } = rubicDebugger;
            const initialConfig = Object.assign({}, initialConfigurations[0]);
            // 最新VS Codeでは初期設定を自動保存しないため、launch.jsonを明示的に更新する。
            return workspace.getConfiguration("launch", folder ? folder.uri : undefined)
            .update("configurations", [initialConfig], folder ? ConfigurationTarget.WorkspaceFolder : ConfigurationTarget.Workspace)
            .then(() => {
                RubicProcess.self.showInformationMessage(
                    localize("launch-json-created", "Debug configuration has been created. Open file which you want to run and start debug again")
                );
                return undefined;
            });
        }

        // Add private data to debug adapter process
        let { workspaceRoot, extensionRoot } = RubicProcess.self;
        config.__private = { workspaceRoot, extensionRoot };
        if (RUBIC_DEBUG_SERVER_PORT != null) {
            config.debugServer = RUBIC_DEBUG_SERVER_PORT;
        }

        // Merge boardData
        let repo = catalogData.getRepository(sketch.repositoryUuid);
        let release = catalogData.getRelease(sketch.repositoryUuid, sketch.releaseTag);
        let variation = catalogData.getVariation(sketch.repositoryUuid, sketch.releaseTag, sketch.variationPath);
        config.boardData = Object.assign(
            {},
            (repo ? repo.cache.boardData : null),
            (release ? release.cache.boardData : null),
            (variation ? variation.boardData : null),
            sketch.boardData,
            config.boardData
        );

        if ((this._debugHooks == null) || (config.request === "attach")) {
            return config;
        }

        // Substitute variables
        if (config.program != null) {
            // launch.jsonに残る旧${workspaceRoot}と現行${workspaceFolder}の両方を解決する。
            config.program = substituteVariables(config.program, folder);
        }

        // Invoke hooks
        return this._debugHooks.reduce((promise, hook) => {
            return promise
            .then((continueDebug) => {
                return hook.onDebugStart(config);
            });
        }, Promise.resolve(true))
        .then((continueDebug) => {
            if (continueDebug) {
                return config;
            }
            // Abort debugging
            return undefined;
        });
    }
}
