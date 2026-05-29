import { runTestsInCurrentDirectory } from "./runSuite";

/**
 * 現行VS CodeのExtension Hostが呼び出すテスト実行入口。
 */
export function run(): Promise<void> {
    return runTestsInCurrentDirectory(__dirname);
}
