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
- 新仓库要满 1 天、提交 ≥10 才能过 CI。
- 一个 PR 最多 3 条；同一个仓库的多个子包要拆成两个 PR。
- 定期扫描会标记「仓库消失 / 已归档 / 长期停更」的条目并移除，所以老仓库不能靠归档保住条目。
- 已发布 npm 包的 `repository` 必须指回条目里的仓库（monorepo 时 `repository.url` 指仓库、`directory` 指子包），映射自动采集，条目里不要手写 `npm:` 字段。
- 更新自己条目时只改自己那一条，README 由脚本生成，不要手改。

## 当前状态

三个插件已经各有条目（workspace-manager、temptask；run-deck 的提交还没合进 main）。是否重指到主仓库子目录，等主仓库定型后再决定，重指本身不改 npm 版本。
