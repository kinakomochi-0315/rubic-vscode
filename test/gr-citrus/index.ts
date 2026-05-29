import { runTestsInCurrentDirectory } from "../runSuite";

/**
 * GR-CITRUS用テストだけを実行する。
 */
export function run(): Promise<void> {
    return runTestsInCurrentDirectory(__dirname);
}
