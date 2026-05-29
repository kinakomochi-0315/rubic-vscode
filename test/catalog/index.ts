import { runTestsInCurrentDirectory } from "../runSuite";

/**
 * catalog用テストだけを実行する。
 */
export function run(): Promise<void> {
    return runTestsInCurrentDirectory(__dirname);
}
