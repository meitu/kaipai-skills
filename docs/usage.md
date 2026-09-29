# 开拍 Skills 使用指南

本仓库提供技能指令、随包参考文档和 CLI 准备脚本。实际媒体处理由 `meitu-kaipai-cli` 调用开拍服务完成，需要网络连接、开拍登录和对应服务权益。

## 环境准备

推荐使用 Node.js 24 LTS 和 npm。开拍 CLI 声明的最低版本为 Node.js 20.3.0；技能安装工具的要求以实际安装版本为准。

CLI 内部的视频校验使用 npm 随包分发的 `ffprobe`，无需单独安装 FFmpeg 或将 `ffprobe` 加入 PATH。安装 CLI 时保留 optional dependencies。可先检查 Node.js 和 npm：

```bash
node --version
npm --version
```

## 安装技能

在目标项目中运行并按提示选择技能与 AI 助手：

```bash
npx skills add meitu/kaipai-skills
```

仅安装图片画质修复到 Codex：

```bash
npx skills add meitu/kaipai-skills --skill kaipai-image-repair --agent codex
```

安装全部 7 个技能到 Codex：

```bash
npx skills add meitu/kaipai-skills --skill '*' --agent codex
```

以上默认为项目内安装；需要用户级安装时追加 `--global`。

## 安装与连接开拍 CLI

首次使用技能时，AI 助手会调用该技能目录下的 `scripts/ensure-cli.mjs`：已有兼容 CLI 时直接复用；找不到 CLI 时，使用当前 npm registry 和全局安装目录安装 `meitu-kaipai-cli@0.1.11`，随后验证版本和帮助入口。安装技能文件本身不运行该脚本。

当前技能的目标 CLI 版本为 `0.1.11`，声明兼容范围为 `>=0.1.11 <0.2.0`。已有不兼容版本时，脚本会停止并说明冲突，不会自动覆盖。若需要提前手动安装或已决定升级旧版本，可执行：

```bash
npm install -g --include=optional meitu-kaipai-cli@0.1.11
kaipai --version
kaipai --help
kaipai auth login
kaipai auth status --check
```

手动按上方命令安装后版本应为 `0.1.11`；连接检查显示 `connected` 且退出成功后，才能提交媒体处理任务。安装失败、权限拒绝或目标版本不存在时，根据实际错误处理；准备脚本不会改 registry、使用 sudo 或循环重试。明确禁止安装或仅允许项目内安装时，告知 AI 助手该限制。

登录时使用 CLI 返回的授权页面。无需在对话或仓库中提供 Token、Cookie 或 API Key。Windows PowerShell 可使用 `kaipai.cmd`。

## 提供素材并使用

向 AI 助手提供本地文件或远程素材 URL，以及处理目标。远程素材会先下载为本地原文件，再通过 CLI 上传处理。动态字幕使用单个视频；智能混剪每次分析支持 1–20 个图片、视频或混合素材（合计），分析后会展示方案并等待确认。

素材、目标和授权齐全后，技能直接调用 CLI，由 CLI 检查输入；不会额外执行独立预检或提前截断、分批处理素材。若 CLI 返回输入或数量错误，再按实际错误修正；只有明确要求“仅检查输入”时才运行独立预检。

运行所需的具体参数、素材限制与异常恢复说明位于各技能的 `references/`，由 AI 助手按需读取。安装和复制时保留完整 Skill 目录，包括 `SKILL.md`、`references/` 和 `scripts/`。

## 更新

在安装技能的环境运行：

```bash
npx skills update
```

该命令更新技能文件及随包资源。CLI 是独立 npm 包，后续使用时由准备脚本核对：兼容版本复用，缺失时安装，不兼容版本需明确升级方案后处理。

## 常见问题

- **没有发现技能：**先运行 `npx skills add meitu/kaipai-skills --list`，应列出 7 个技能；检查 GitHub 网络访问是否正常。
- **找不到 `kaipai`：**先让 AI 助手运行随包准备脚本；脚本也会检查 npm 全局安装目录，并返回实际可用入口。手动运行命令时，确保 npm 全局命令目录在 PATH 中。
- **尚未登录：**运行 `kaipai auth login`，完成后重新检查连接状态。
- **无法读取远程视频或图片：**自行下载原文件，再向 AI 助手提供本地文件路径。
- **本地视频检查失败：**根据 CLI 的具体错误核对素材或依赖；若缺少随包 `ffprobe`，检查是否跳过了 optional dependencies，并按上方命令重新安装。

当前分发验证覆盖技能结构、引用资源、CLI 入口和安装发现；具体服务处理结果以实际任务返回为准。
