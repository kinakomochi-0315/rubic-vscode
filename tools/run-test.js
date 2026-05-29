const path = require("path");
const rootDir = path.normalize(path.join(__dirname, ".."));
const { runTests } = require("@vscode/test-electron");
let tests = process.argv.slice(2);
let failed = 0;

async function run(test) {
    let [ testName, wsName ] = test.split("@", 2);
    if (wsName == null) {
        wsName = testName;
    }
    let testRoot = path.join(rootDir, "out", "test", testName);
    let workspace = path.join(rootDir, "test", "workspace", wsName);
    console.log("#".repeat(100));
    console.log(`# [${test}] Started at ${new Date().toString()}`);
    console.log("");
    try {
        // 現行のVS Code Extension Hostを起動し、対象ワークスペースでテストを実行する。
        await runTests({
            extensionDevelopmentPath: rootDir,
            extensionTestsPath: testRoot,
            launchArgs: [workspace]
        });
        console.log(`# [${test}] Finished at ${new Date().toString()} (result=0)`);
    } catch (error) {
        console.log(`# [${test}] Finished at ${new Date().toString()} (result=1)`);
        console.error(`# Error: ${error && error.stack || error}`);
        ++failed;
    }
    console.log("");
}

tests.reduce((promise, test) => {
    return promise.then(() => run(test));
}, Promise.resolve())
.then(() => {
    if (failed > 0) {
        process.exitCode = 1;
    }
}, (error) => {
    console.error(error && error.stack || error);
    process.exitCode = 1;
});
