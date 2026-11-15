# 各插件的构建形态

DSH 加载的是 profile 里 `link:` 指向的那个目录里的**产物文件**，不是 git 里的源码。所以每个插件「产物是否入库」决定了两件事：新克隆能不能直接跑，以及改完源码要不要重建再提交。

| 插件 | 入口 / 产物 | 产物入库 | 构建 | 依赖 |
|---|---|---|---|---|
| dsh-workspace-manager | `index.js` + `client.js` + `lib/*.js` | 是 | 无构建步骤，源码即产物 | 无 |
| dsh-temptask | `lib/index.js` + `client/client.js` | 是（16 个文件） | `npm run build`（tsc）；`prepare` 钩子会在安装时自动构建，拿不到 tsc 就跳过 | typescript（仅构建用） |
| dsh-run-deck | `lib/index.js` + `client/client.js` | **否**（`/lib/`、`client/client.js` 都在 `.gitignore`） | 必须 `npm install && npm run build`；`prepack` 只校验 `files` 白名单，不构建 | typescript（仅构建用） |
| dsh-task-orchestrator（原 dsh-taskoutsource） | 仅 `client.js`，包名 `@local/…` | 是 | 无 | 无 |

## 由此产生的规矩

- **新机器 / 新克隆**：workspace-manager、temptask、task-orchestrator checkout 完即可被加载；run-deck 必须先 `npm install && npm run build`，否则 `main` 指向的 `lib/index.js` 不存在。
- **改源码**：workspace-manager 直接改；temptask、run-deck 改 `src/` 后要重建。temptask 的产物要一起提交，run-deck 的产物不入库、只在本机生效。
- **DSH 实际加载哪一份**：看 profile 的 `link:`。仓库里改了、这台的 `link:` 还指着别的工作副本，就会「改了没生效」。切换工作副本后要重启 DSH（宿主装载路径变了）。
- **发版**：`npm publish` 打的是当前目录的产物。run-deck 发布前必须先 `npm run build`，否则包里缺 `lib/`。
