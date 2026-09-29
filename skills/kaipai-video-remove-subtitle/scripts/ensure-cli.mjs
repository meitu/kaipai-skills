import { spawnSync } from "node:child_process";
import { accessSync, constants, existsSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Keep these values aligned with every consuming Skill's cli metadata.
export const cliDependency = Object.freeze({
  package: "meitu-kaipai-cli",
  bin: "kaipai",
  testedVersion: "0.1.11",
  compatibleRange: ">=0.1.11 <0.2.0",
});

function fail(code, message) {
  throw Object.assign(new Error(message), { code });
}

export function isCompatible(version) {
  // This dependency has a single stable interval, not an arbitrary semver expression.
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:\+[\w.-]+)?$/.exec(version);
  return Boolean(match && Number(match[1]) === 0 && Number(match[2]) === 1 && Number(match[3]) >= 11);
}

export function findExecutable(name, env = process.env, platform = process.platform) {
  const paths = env[Object.keys(env).find((key) => key.toUpperCase() === "PATH") ?? "PATH"] ?? "";
  const names = platform === "win32" ? [`${name}.cmd`, `${name}.exe`] : [name];
  for (const directory of paths.split(platform === "win32" ? ";" : ":")) {
    // Do not execute a relative/current-directory entry from PATH.
    if (!path.isAbsolute(directory)) continue;
    for (const filename of names) {
      const candidate = path.join(directory, filename);
      try {
        accessSync(candidate, platform === "win32" ? constants.F_OK : constants.X_OK);
        if (statSync(candidate).isFile()) return candidate;
      } catch { /* Try the next PATH entry. */ }
    }
  }
  return undefined;
}

export function commandEntry(executable, kind, platform = process.platform) {
  if (platform !== "win32" || !executable.toLowerCase().endsWith(".cmd")) {
    return { command: executable, args: [] };
  }
  // Invoke npm's Node entry directly: .cmd needs a shell, which is unnecessary here.
  const directory = path.dirname(realpathSync(executable));
  const relative = kind === "npm" ? "npm/bin/npm-cli.js" : "meitu-kaipai-cli/bin/kaipai.js";
  const candidates = [path.join(directory, "node_modules", relative)];
  if (path.basename(directory) === ".bin") candidates.push(path.join(directory, "..", relative));
  const script = candidates.find((candidate) => existsSync(candidate));
  if (!script) fail("UNSUPPORTED_LAUNCHER", `无法定位 ${executable} 对应的 Node 入口；请检查 npm 安装布局。`);
  return { command: process.execPath, args: [script] };
}

export function ensureCli({
  cliPath,
  env = process.env,
  platform = process.platform,
  nodeVersion = process.versions.node,
  run = spawnSync,
  log = (message) => process.stderr.write(`${message}\n`),
} = {}) {
  const [major, minor] = nodeVersion.split(".").map(Number);
  if (major < 20 || (major === 20 && minor < 3)) {
    fail("NODE_VERSION", "CLI 需要 Node.js 20.3+；请先准备兼容的 Node.js。脚本不会安装 Node.js。");
  }
  const invoke = (entry, args, timeout = 15000) => run(entry.command, [...entry.args, ...args], {
    env, encoding: "utf8", shell: false, timeout, maxBuffer: 4 * 1024 * 1024,
  });
  const succeeded = (result) => !result.error && !result.signal && result.status === 0;
  const details = (result) => String(result.error?.message || result.stderr || result.stdout || `退出码 ${result.status}`).trim();
  const inspect = (executable, status) => {
    const entry = commandEntry(executable, "kaipai", platform);
    const result = invoke(entry, ["--version"]);
    if (!succeeded(result)) fail("CLI_UNUSABLE", `CLI 无法运行：${executable}；${details(result)}`);
    const version = result.stdout.trim();
    if (!isCompatible(version)) {
      fail("CLI_INCOMPATIBLE", `现有 CLI 版本 ${version} 不符合 ${cliDependency.compatibleRange}：${executable}。请明确升级／替换方案后再运行；不会自动覆盖。`);
    }
    const help = invoke(entry, ["--help"]);
    if (!succeeded(help)) fail("CLI_UNUSABLE", `CLI help 检查失败：${details(help)}`);
    return { ok: true, status, version, entry };
  };

  if (cliPath) {
    if (!path.isAbsolute(cliPath) || !existsSync(cliPath)) fail("CLI_PATH", "--cli 必须指定已存在的 CLI 绝对路径。");
    return inspect(cliPath, "ready");
  }
  const existing = findExecutable(cliDependency.bin, env, platform);
  if (existing) return inspect(existing, "ready");

  const npmPath = findExecutable("npm", env, platform);
  if (!npmPath) fail("NPM_MISSING", "未找到 npm；请先准备 Node.js 和 npm，再运行本脚本。");
  const npm = commandEntry(npmPath, "npm", platform);
  const npmVersion = invoke(npm, ["--version"]);
  if (!succeeded(npmVersion)) fail("NPM_UNUSABLE", `npm 无法运行：${details(npmVersion)}`);
  const prefixResult = invoke(npm, ["prefix", "--global"]);
  if (!succeeded(prefixResult)) fail("NPM_PREFIX", `无法获取 npm 全局目录：${details(prefixResult)}`);
  const prefix = prefixResult.stdout.trim();
  if (!path.isAbsolute(prefix)) fail("NPM_PREFIX", "npm 返回的全局目录不是绝对路径。");
  const globalCli = path.join(prefix, ...(platform === "win32" ? ["kaipai.cmd"] : ["bin", "kaipai"]));
  // A previous install may be usable even when the global bin directory is not on PATH.
  if (existsSync(globalCli)) return inspect(globalCli, "ready");

  const packageSpec = `${cliDependency.package}@${cliDependency.testedVersion}`;
  log(`未找到 CLI，正在全局安装 ${packageSpec}（使用当前 npm registry 和 prefix）。`);
  const installed = invoke(npm, ["install", "--global", "--include=optional", packageSpec, "--no-fund", "--no-audit"], 180000);
  if (!succeeded(installed)) {
    const reason = details(installed);
    const code = /EACCES|EPERM/.test(reason) ? "INSTALL_PERMISSION"
      : /E404|ETARGET/.test(reason) ? "PACKAGE_UNAVAILABLE" : "INSTALL_FAILED";
    fail(code, `全局安装失败：${reason}。不会使用 sudo、改 registry 或自动重试。`);
  }
  if (!existsSync(globalCli)) fail("CLI_NOT_FOUND", `npm 安装完成，但未找到 ${globalCli}；请检查 npm prefix 和 bin-links 配置。`);
  return inspect(globalCli, "installed");
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length === 1 && args[0] === "--help") {
      console.log("用法：node ensure-cli.mjs [--cli <已有 CLI 的绝对路径>]\n默认检查并在缺失时全局安装 CLI；--cli 只验证指定入口，不安装。成功输出 JSON entry，后续通过参数数组调用。");
    } else {
      if (args.length && !(args.length === 2 && args[0] === "--cli")) fail("ARGUMENTS", "只接受 --help 或 --cli <已有 CLI 的绝对路径>。");
      console.log(JSON.stringify(ensureCli({ cliPath: args[1] })));
    }
  } catch (error) {
    console.log(JSON.stringify({ ok: false, code: error.code ?? "BOOTSTRAP_FAILED", message: error.message }));
    process.exitCode = 1;
  }
}
