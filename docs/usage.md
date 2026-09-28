# 开拍 Skills 使用指南

本仓库提供技能指令和随包参考文档。实际媒体处理由 `meitu-kaipai-cli` 调用开拍服务完成，需要网络连接、开拍登录和对应服务权益。

## 环境准备

推荐使用 Node.js 24 LTS 和 npm。当前验证使用的 `skills` CLI 1.7.0 要求 Node.js 22.20.0 或更高版本；开拍 CLI 声明的最低版本为 Node.js 20.3.0。统一使用 Node.js 24 可满足两者要求。

处理本地视频需要可从终端调用的 `ffprobe`（FFmpeg 提供）。可先检查：

```bash
node --version
npm --version
ffprobe -version
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

```bash
npm install -g meitu-kaipai-cli@0.1.8
kaipai --version
kaipai --help
kaipai auth login
kaipai auth status --check
```

当前技能的目标 CLI 版本为 `0.1.8`，声明兼容范围为 `>=0.1.8 <0.2.0`。安装后版本应为 `0.1.8`；连接检查显示 `connected` 且退出成功后，才能提交媒体处理任务。

登录时使用 CLI 返回的授权页面。无需在对话或仓库中提供 Token、Cookie 或 API Key。Windows PowerShell 可使用 `kaipai.cmd`。

## 提供素材并使用

向 AI 助手提供可读取的本地文件或远程素材 URL，以及处理目标。远程素材会先下载为本地原文件，再通过 CLI 上传处理。动态字幕使用单个视频；智能混剪支持 1–10 个图片、视频或混合素材，分析后会展示方案并等待确认。

运行所需的具体参数、素材限制与异常恢复说明位于各技能的 `references/`，由 AI 助手按需读取。

## 更新

在安装技能的环境运行：

```bash
npx skills update
```

该命令更新技能文件。CLI 是独立 npm 包，按技能文档要求的版本单独安装或升级。

## 常见问题

- **没有发现技能：**先运行 `npx skills add meitu/kaipai-skills --list`，应列出 7 个技能；检查 GitHub 网络访问是否正常。
- **找不到 `kaipai`：**确认已安装 CLI，并让 AI 助手使用能够访问 npm 全局命令目录的终端环境。
- **尚未登录：**运行 `kaipai auth login`，完成后重新检查连接状态。
- **无法读取远程视频或图片：**自行下载原文件，再向 AI 助手提供本地文件路径。
- **本地视频检查失败：**核对视频格式、可读性及 `ffprobe` 是否可用。

当前分发验证覆盖技能结构、引用资源、CLI 入口和安装发现；具体服务处理结果以实际任务返回为准。
