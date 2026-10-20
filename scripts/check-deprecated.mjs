// 扫描 tsconfig 范围内的源码，发现使用了标记 @deprecated 的 API 就以非零状态退出。
// tsc 只把它当作编辑器提示（建议级诊断），不会报错，所以单独用语言服务检查。
import ts from "typescript";

const root = process.cwd();
const configPath = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
if (!configPath) throw new Error("找不到 tsconfig.json");

const config = ts.getParsedCommandLineOfConfigFile(
  configPath,
  {},
  {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
    },
  },
);

const DEPRECATED_CODES = new Set([6385, 6387]);

const service = ts.createLanguageService({
  getScriptFileNames: () => config.fileNames,
  getScriptVersion: () => "0",
  getScriptSnapshot: (file) => {
    const text = ts.sys.readFile(file);
    return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
  },
  getCurrentDirectory: () => root,
  getCompilationSettings: () => config.options,
  getDefaultLibFileName: ts.getDefaultLibFilePath,
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
});

const findings = [];
for (const file of config.fileNames) {
  for (const diagnostic of service.getSuggestionDiagnostics(file)) {
    if (!DEPRECATED_CODES.has(diagnostic.code) || !diagnostic.file) continue;
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
      diagnostic.start ?? 0,
    );
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    findings.push(
      `${file.replace(`${root}/`, "")}:${line + 1}:${character + 1} ${message}`,
    );
  }
}

if (findings.length > 0) {
  console.error(`发现 ${findings.length} 处已弃用 API 的使用：\n${findings.join("\n")}`);
  process.exit(1);
}
console.log("未发现已弃用 API 的使用。");
