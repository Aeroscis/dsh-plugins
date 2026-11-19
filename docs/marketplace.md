# 集市条目格式

条目在 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 的 `data/plugins/`，一个插件一个 YAML 文件，文件名由仓库和子路径推导。

## 普通条目（一个插件一个仓库）

```yaml
url: https://github.com/Aeroscis/dsh-workspace-manager
name: Aeroscis/dsh-workspace-manager
category: ui
description:
  en: 'One line, ends with a period.'
  zh: '一句话描述，以句号结尾。'
icon: https://raw.githubusercontent.com/Aeroscis/dsh-workspace-manager/main/assets/icon-180.png
```

文件名：`Aeroscis__dsh-workspace-manager.yml`。

## monorepo 子包条目（多个插件一个仓库）

```yaml
url: https://github.com/Aeroscis/dsh-plugins/tree/main/plugins/dsh-workspace-manager
name: Aeroscis/dsh-plugins#dsh-workspace-manager
category: ui
```

文件名：`Aeroscis__dsh-plugins--plugins-dsh-workspace-manager.yml`（子路径的 `/` 换成 `-`）。

硬约束：

- 子包目录只能是 `plugins/`、`packages/`、`apps/` 之一——集市校验从这三处读 `dsh.bundle`。
- `screenshots.json` 放在子包目录里（`package.json` 旁边），路径相对该文件，不能以 `/` 开头、不能含 `..`。
- `icon` 若是绝对 URL，必须是 GitHub 托管（`raw.githubusercontent.com` 等），并指向子目录里的文件。
- 新仓库创建要满 1 天（CI 自动检查）。**没有提交数门槛**——贡献指南原话：历史长短反映开发习惯而非质量。
- 一个 PR 最多 3 条；同一个仓库的多个子包要拆成两个 PR。
- 定期扫描会标记「仓库消失 / 已归档 / 长期停更」的条目并移除，所以老仓库不能靠归档保住条目。
- 已发布 npm 包的 `repository` 必须指回条目里的仓库（monorepo 时 `repository.url` 指仓库、`directory` 指子包），映射自动采集，条目里不要手写 `npm:` 字段。
- 更新自己条目时只改自己那一条，README 由脚本生成，不要手改。

## 当前状态

三个插件各有独立仓库条目，均已合并进 `main`：

| 插件 | category | 条目 |
| --- | --- | --- |
| workspace-manager | `ui` | `data/plugins/Aeroscis__dsh-workspace-manager.yml` |
| temptask | `session` | `data/plugins/Aeroscis__dsh-temptask.yml` |
| run-deck | `dev` | `data/plugins/Aeroscis__dsh-run-deck.yml` |

run-deck 那条经 PR [#16670](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/16670)
于 2026-11-18 16:53 UTC **直接合并，没有任何修改要求**（0 评论 / 0 评审 / 0 标签，`category` 与
中英描述均按提交原样保留）。时间线：14:36 UTC 提交 → 约 22 分钟 CI 全绿 → 约 2 小时 17 分后合并。

是否重指到主仓库子目录，等主仓库定型后再决定，重指本身不改 npm 版本。

## 合并后怎么验证条目真的上线了

三处都要看，不是只看 PR 变绿：

1. **条目文件在 main**：`raw.githubusercontent.com/.../main/data/plugins/<file>.yml`，内容与提交一致；
2. **生成的 README 有那一行**：`README.md`（英文）与 `README.zh.md`（中文）各一条，由他们的脚本生成；
3. **市场站点目录**：<https://awesome-dsh-plugin.github.io/awesome-dsh-plugin/catalog.json>
   的 `items[]` 里有该条目，字段含 `cat` / `added` / `npm: 1` / `cmd` / `href`。
   详情页形如 `/p/<owner>/<repo>/`。`npm: 1` 表示市场认到 npm 包，安装走预构建、免 `allowBuilds`。

`data/added-dates.json` 只有 600 多条、按 URL 索引，**不是全集**，查不到条目不代表没收录——
真正的权威是 `catalog.json`。

## 条目与代码要一致

市场评审会拿条目里的描述逐句核对代码，**夸大是打回的主要原因**。写 run-deck 那条时就踩到一次：
初稿写了「run / stop / rerun」，但 `rerun` 只存在于 `/run-deck` 命令与 tool 里，按钮条上点不了，
于是改成「点一下跑、再点停」。写条目时每个动词都要能在界面上按出来，别把宿主 API 的能力算进条目。
