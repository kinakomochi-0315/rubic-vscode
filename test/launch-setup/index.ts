import { runTestsInCurrentDirectory } from "../runSuite";

/**
 * launch設定用テストだけを実行する。
 */
export function run(): Promise<void> {
    return runTestsInCurrentDirectory(__dirname);
}
