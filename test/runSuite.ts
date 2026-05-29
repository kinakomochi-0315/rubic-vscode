import * as path from "path";
import * as Mocha from "mocha";
import * as glob from "glob";
import * as pify from "pify";

/**
 * 指定されたディレクトリ配下のMochaテストをVS Code Extension Host上で実行する。
 */
export function runTestsInCurrentDirectory(testsRoot: string): Promise<void> {
    const mocha = new Mocha({
        ui: "tdd",
        color: true
    });
    return (<Promise<string[]>>pify(glob)("**/*.test.js", { cwd: testsRoot }))
    .then((files) => {
        files.forEach((file) => {
            mocha.addFile(path.resolve(testsRoot, file));
        });
        return new Promise<void>((resolve, reject) => {
            mocha.run((failures) => {
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                } else {
                    resolve();
                }
            });
        });
    });
}
