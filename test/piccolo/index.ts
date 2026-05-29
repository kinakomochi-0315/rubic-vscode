import { runTestsInCurrentDirectory } from "../runSuite";

/**
 * Piccolo用テストだけを実行する。
 */
export function run(): Promise<void> {
    return runTestsInCurrentDirectory(__dirname);
}
