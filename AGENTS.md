# 会话约定

这是几个 DSH 插件的主工作区。插件源码在 `plugins/<name>` 的子模块里，各自是独立仓库、独立 npm 包、独立集市条目。

## 布局

- 插件目录必须是 `plugins/`、`packages/`、`apps/` 的直接子目录——集市校验只从这三处读 `dsh.bundle`。
- 主仓库只放工作区、共享文档、跨仓库脚本，不放插件源码。
- 每个包没有 `dependencies` / `devDependencies`，构建产物（`index.js`、`client.js`、`lib/*.js`）入库，checkout 完就能跑。

## 提交

- **两段式**：先改子模块、在子模块里 commit + push，再回主仓库 commit 指针并 push。漏第二段会让另一台机器静默回退到旧代码。
- 分支：`develop` 开发；`main` 只接收从 `develop` 合并过来的提交；tag 只在 `main` 上打。
- **未经明确指示不要打 tag。** 用户说「发版」才发，同族插件都适用。

## 发版

- 一律 `npm stage publish` 送审 + 维护者 2FA 批准。Trusted Publisher 是 stage-only（两项权限留空），直接 `npm publish` 会被拒。
- 发布后 1–2 分钟内 `npm view` 可能 404 或返回 `0.0.0-stage` 占位文档，别急着判失败。
- 沙箱下 `npm run check` 的 `npm pack --dry-run` 写不了默认 cache 会报错，用 `--cache .\.npm-cache`，验完删掉。

## 宿主兼容

- `engines.dsh` 与 `@deepseek-ai/*` 的 peer 写同一范围，不写死精确版本。
- 宿主判兼容用 `includePrerelease: true`；按默认 semver 语义读会得出相反结论。
- 检查走 `node scripts/compat-all.mjs`：退出码 30 无法判定 > 20 会被拒载 > 10 接口变了 > 0 不变。
- 探针适配新宿主时，注意宿主客户端产物被压成单行、字符串改用反引号，会让旧探针误报 DRIFT。

## 文档

- 工程文档按朴素准确的中文写，不写比喻式黑话。
- 跨插件的经验写进 `docs/`；只属于某个插件的写它自己的 README / CHANGELOG。
- `.dsh/memory` 是机器本地的，不随 git 走；要跨机器保留的结论必须落到 `docs/` 或 `AGENTS.md`。
