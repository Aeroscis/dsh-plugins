# 宿主升级时怎么过一遍

宿主（DSH）升级后，几个插件要判断「接口有没有变、版本范围还收不收得下」。只跑一条命令，只看退出码。

```sh
node scripts/compat-all.mjs
```

- `--json`：机器可读
- `--quiet`：只在有问题时输出（给定时任务用）
- `--also <路径>`：补一个还没挂成子模块的仓库，例如 `--also ..\dsh-taskoutsource`

## 退出码即结论

| 退出码 | 含义 | 处理 |
|---|---|---|
| 0 | 全部 UNCHANGED | 什么都不用做；只在宿主版本号变了时回一句「宿主已升级到 X，接口未变」 |
| 10 | DRIFT：接口表面变了 | 逐仓库看差异行，判断是改名、挪服务，还是只是版本号变化；改代码或只推进参照 |
| 20 | OUT-OF-RANGE：宿主会拒载 | 最高优先级。改 `engines.dsh` 与 `@deepseek-ai/*` 的 peer 范围 |
| 30 | 无法判定 | 宿主路径不对、产物不完整或缺解析器，不要当成通过 |

## 改完一个仓库要做的验证

在**那个插件仓库里**：

```sh
node scripts/compat-probe.mjs
node test/compat-rules.test.mjs
node scripts/compat-probe.mjs --write-baseline   # 确认无误后再推进参照记录
```

然后按两段式提交：插件仓库 commit + push，再回主仓库提交指针。

## 已知误报与语义

- 宿主把客户端产物压成单行、字符串改用反引号时，旧探针会齐报 DRIFT；接口其实没变，先看是不是这个原因。
- 判定走 `includePrerelease: true`。按默认 semver 语义读 `^0.2.1-0` 会不会收下 `0.2.2-rc.x`，结论正好相反。
- 只改包版本号、接口未变的差异不计入 DRIFT，输出里会单独说明。

当前每个仓库的参照记录在它自己的 `dsh-baseline.json`，不在这个仓库里。
