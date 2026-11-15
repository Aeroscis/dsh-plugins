# DSH 插件主仓库（骨架）

几个 DSH 插件的主工作区。插件源码仍然留在各自仓库里，这个仓库只承担三件事：**工作目录、共享文档、跨仓库脚本**。

> 这是演练骨架，还没有 GitHub remote。`plugins/` 下三个目录是从现有四个开发目录**本地克隆**后接成子模块的（当时 GitHub HTTPS 克隆被重置），所以内容和本机 `develop` 一致；现有四个开发目录一个都没动。
>
> 子模块的 `.gitmodules` URL 用 HTTPS（新机器无密钥也能拉），子模块自己的 `origin` 保留 SSH（推送照旧）。

## 目录

```
plugins/                     插件子模块，一个插件一个仓库
  dsh-workspace-manager/     @aeroscis/dsh-workspace-manager
  dsh-temptask/              @aeroscis/dsh-temptask
  dsh-run-deck/              @aeroscis/dsh-run-deck
  dsh-task-orchestrator/     @local/dsh-task-orchestrator（未发 npm，本地插件）
docs/                        跨插件的共享经验（随 git 走，这才是换机器能带走的通道）
scripts/compat-all.mjs       跨仓库的宿主兼容检查
AGENTS.md                    会话级约定
```

四个插件都是子模块，各自仓库独立；`dsh-task-orchestrator` 的包名还是 `@local/…`、没有 npm 发布，但代码在它自己的公开仓库里。有个还没搬进来的插件仓库，可以用 `--also` 从仓库外补：

```sh
node scripts/compat-all.mjs --also ..\某个别的插件仓库
```

## 日常

两段式提交，子模块里只改它自己：

```sh
git -C plugins/dsh-temptask add -A
git -C plugins/dsh-temptask commit -m "..."
git -C plugins/dsh-temptask push

git add plugins/dsh-temptask
git commit -m "chore: 推进 dsh-temptask"
git push
```

漏掉第二段，另一台机器 pull 到的是旧代码，而主仓库看起来是干净的。

更新：

```sh
git pull --recurse-submodules
# 或者：git pull && git submodule update --init --recursive
```

`git pull` 单独跑只会挪指针，不会更新子模块工作区——`git status` 会显示 `modified: plugins/xxx (new commits)`。

## 换机器

```sh
git clone --recurse-submodules <仓库地址>
```

然后手工补四件事（git 覆盖不到）：

1. 按 [docs/build-artifacts.md](docs/build-artifacts.md) 备产物：`dsh-run-deck` 必须 `npm install && npm run build`（`lib/`、`client/client.js` 不入库）；其余 checkout 完即可。
2. DSH profile 的 `~/.dsh/profiles/desktop/package.json` 里，三个 `link:` 指到新绝对路径，再 `pnpm install`。
3. 重启 DSH web（宿主路由只在进程启动时挂载；换了装载路径本来也要重启）。
4. 侧栏工作区记录用本插件「修改路径」重绑到新目录。

## 现状

- [x] 四个子模块都已挂上，`.gitmodules` 里 `branch = develop`
- [ ] `dsh-task-orchestrator` 补 npm 发布与 `.github`（当前 `@local/…`）
- [ ] 决定集市条目是否重指到 `tree/main/plugins/<name>`（格式见 `docs/marketplace.md`）
- [ ] 把现有四个开发目录换成这里的位置，并用本插件重绑工作区
- [ ] 把 `.dsh/memory` 里跨机器还有用的结论搬进 `docs/`
