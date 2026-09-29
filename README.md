# 开拍 Skills

开拍的 7 个媒体处理技能，供支持 Agent Skills 的 AI 助手使用：图片与视频画质修复、文字与水印消除、视频去字幕、动态字幕和智能混剪。

## 安装

使用 Node.js 24 LTS，在需要使用技能的项目目录执行：

```bash
npx skills add meitu/kaipai-skills --skill '*' -y
```

列出技能，或仅安装一个技能：

```bash
npx skills add meitu/kaipai-skills --list
npx skills add meitu/kaipai-skills --skill kaipai-image-repair
```

技能通过开拍 CLI 调用服务。首次使用时会检查 CLI，缺失时自动安装当前技能声明的版本，已有兼容版本则直接复用。需要提前手动准备时执行：

```bash
npm install -g --include=optional meitu-kaipai-cli@0.1.11
kaipai auth login
kaipai auth status --check
```

安装技能文件本身不会执行 CLI 安装；首次使用由随包脚本准备 CLI，登录仍需完成开拍授权。`ffprobe` 随 CLI 的 npm 依赖提供，无需单独安装。详细步骤见[使用指南](docs/usage.md)。

## 技能列表

| 技能 | 用途 |
| --- | --- |
| [kaipai-image-repair](skills/kaipai-image-repair/SKILL.md) | 修复模糊、低清图片，增强清晰度与细节 |
| [kaipai-image-remove-watermark](skills/kaipai-image-remove-watermark/SKILL.md) | 消除图片文字及文字水印 |
| [kaipai-video-repair](skills/kaipai-video-repair/SKILL.md) | 提升视频清晰度并改善噪点 |
| [kaipai-video-remove-subtitle](skills/kaipai-video-remove-subtitle/SKILL.md) | 消除视频内嵌字幕 |
| [kaipai-video-remove-watermark](skills/kaipai-video-remove-watermark/SKILL.md) | 消除视频水印 |
| [dynamic-caption](skills/dynamic-caption/SKILL.md) | 根据语音或字幕时间轴制作动态字幕 |
| [smart-montage](skills/smart-montage/SKILL.md) | 将 1–20 个图片、视频或混合素材剪辑成片 |

## 使用与反馈

安装后，在 AI 助手中提供素材和处理需求，例如：“修复这张模糊照片”或“把这些旅行素材剪成一条 Vlog”。智能混剪会先展示方案，确认后生成。

- [环境准备与常见问题](docs/usage.md)
- [反馈问题](https://github.com/meitu/kaipai-skills/issues)
- [Agent Skills 格式规范](https://agentskills.io/specification)
