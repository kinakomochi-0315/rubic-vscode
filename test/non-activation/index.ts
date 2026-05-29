import { runTestsInCurrentDirectory } from "../runSuite";

/**
 * non-activation用テストだけを実行する。
 */
export function run(): Promise<void> {
    return runTestsInCurrentDirectory(__dirname);
}
