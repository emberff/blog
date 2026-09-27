# 江上清风 · 博客操作手册（BLOG_GUIDE.md）

> 面向"未来的自己"：你熟悉这个博客，但一定会忘记细节。本文只写**可执行的东西**：
> 确切的命令、确切的输出、以及"看到什么才算对"。有疑问时先查本文，再动手。

**怎么用这份文档**

| 你的处境 | 直接跳到 |
| --- | --- |
| 忘了某条命令 / 目录在哪 / 版本多少 | 第 1 节 |
| 要写一篇新文章、发布上线 | 第 2 节（照做即可） |
| 遇到一个报错，想知道以前是否踩过 | 第 3 节（详细）+ 第 5 节（速查） |
| 忘了 front matter 怎么写、note 怎么用 | 第 4 节 |
| 想优化/重构博客本身 | 第 6 节 |
| **改了仓库结构/性能/版本，要不要记点什么** | **第 6.8 节 + 仓库根的 `AGENTS.md`（强制）** |

**目录**

- [1. 环境与目录总览](#1-环境与目录总览)
- [2. 博客编写流程](#2-博客编写流程本地编写--预览--审批--同步--部署--验证)
- [3. 历史踩坑与解决办法](#3-历史踩坑与解决办法)
- [4. 写作规范](#4-写作规范)
- [5. 常见问题速查（QA）](#5-常见问题速查qa)
- [6. 待完善与建议](#6-待完善与建议)

---

## 1. 环境与目录总览

### 1.1 两处工作副本

| | WSL 侧（**推荐日常使用**） | Windows 侧（历史/备份副本） |
| --- | --- | --- |
| 路径 | `/home/emberff/blog` | `C:\Users\15222\blog`（WSL 里是 `/mnt/c/Users/15222/blog`） |
| 文件系统 | 原生 ext4 | 9p 挂载（`drvfs`） |
| 状态 | 已 `git clone`，HEAD = `caf9977`，`npm ci` 装好 613 个包（`node_modules` 113 MB） | 也是 `caf9977`，但**安装有问题** |
| 用途 | 日常编写、预览、构建、部署 | 只当备份/留档，**不要**在这里调试 |

**为什么只推 WSL 侧**：`/mnt/c` 是 9p 挂载，bash 侧写入会被拒（第 3.1 条），`hexo g` 直接 `EACCES`；`hexo s` 还会在 9p 上做文件 watch 卡成 `Dsl` 不可中断状态（第 3.8 条）。同一套命令在 `/home/emberff/blog` 全部正常。两处副本并存只会带来"哪边是最新"的漂移（第 6 节）。

### 1.2 版本与身份（**已核实，不必再查**）

| 组件 | 版本 |
| --- | --- |
| Hexo | **8.1.2** |
| hexo-theme-fluid | **1.9.9** |
| hexo-renderer-marked | **7.0.1** |
| hexo-all-minifier | **0.5.7** |
| Node / npm | **v24.19.0**（nvm 管理）/ **11.17.0** |
| 全局 hexo-cli | 4.3.2，**不必需**——用 `npx hexo` / `npm run server` 才会用到仓库锁定的 hexo 8.1.2 |

```bash
# 前置条件（均已就绪，换机器时按此重设）
git config --global user.name  "Emberizaf"          # 必须全局：.deploy_git 不读仓库本地配置（第 3.2 条）
git config --global user.email "1522236760@qq.com"
ls -l ~/.ssh/id_rsa                                  # 应存在且权限 600
ssh -T git@github.com                                # 期望：Hi emberff! You've successfully authenticated...
gh auth status                                       # 期望：已登录 emberff
npm config get registry                              # 期望：https://registry.npmmirror.com
```

- 源码仓库：`git@github.com:emberff/blog.git`，分支 `main`，当前最新提交 **`caf9977`**（`chore: 移除页脚 ICP 与公安备案信息`）。
- 部署目标：`git@github.com:emberff/emberff.github.io.git`，分支 `main`（GitHub Pages source = `main` + `/`）。
- 站点线上地址：`https://emberff.github.io`。

### 1.3 目录结构速览

```
/home/emberff/blog
├── AGENTS.md                # ⚠️ agent 规则：改动必须回写本手册（harness 自动注入上下文，见第 6.8 节）
├── BLOG_GUIDE.md            # 本手册
├── _config.yml              # 站点主配置：url、theme: fluid、deploy: git、hexo-all-minifier
├── _config.fluid.yml        # 主题配置（约 1200 行）：navbar.menu、links.items、banner、footer.beian、custom_js
├── _config.landscape.yml    # 备用主题配置（空，未启用）
├── package.json             # 锁定 hexo 8.1.2；scripts: build / clean / deploy / publish / server
├── source/
│   ├── _posts/              # 19 篇文章（.md）
│   ├── links/index.md       # 友链页（layout: links）
│   ├── img/                 # 站点图片：default.webp(内页 banner) / avatar.png / fluid.png / favicon.png 等
│   ├── background/          # 仅剩 Spiraling Cityscape.jpg 与 arch.jpg（均未被本地引用，见 6.7）
│   ├── css/  js/  html/     # loader.js / deferred.js / loader.css / loader.html / sakana.html
│   └── README.md            # skip_render，不作为页面渲染
├── scripts/injects.js       # theme_inject：注入 source/html/loader.html 与 sakana.html
├── scaffolds/               # new 命令的模板：post.md / page.md / draft.md
├── themes/                  # 只有 .gitkeep——主题走 npm 装到 node_modules/hexo-theme-fluid
└── .agents/skills/hexo-theme-development/   # 主题开发规范技能文档（改主题前先读它，本文不复制其内容）
```

**改主题模板/变量/helper 时，先读技能文档** `.agents/skills/hexo-theme-development/SKILL.md`（含 `reference/api.md`、`variables.md`、`helpers.md`、`templates.md`、`i18n.md`、`testing.md` 与两个 examples）。本文不转载其内容，避免两处维护。

### 1.4 部署链路

```
[本地 WSL 工作副本 /home/emberff/blog]
        │  git add → git commit → git push origin main
        ▼
[源码仓库 emberff/blog (main)]  ← 版本管理 + 备份（public 仓库！见 4.5 红线）
        │  npx hexo clean && npx hexo generate   → public/（106 files）
        │  npx hexo deploy                        （hexo-deployer-git）
        ▼
[.deploy_git 临时仓库]  ──push──▶  [emberff/emberff.github.io (main)]
                                            │  GitHub Pages 构建（几十秒）
                                            ▼
                                 https://emberff.github.io
```

要点：`.deploy_git` 是 deployer 自己维护的**独立临时仓库**，本地分支是 `master`，跟踪远程 `main`；它**不继承博客仓库的本地 git 配置**，所以全局 `user.name/user.email` 是硬前置，否则静默不推送（第 3.2 条）。

---

## 2. 博客编写流程（本地编写 → 预览 → 审批 → 同步 → 部署 → 验证）

六步，**第 3 步是闸门：预览确认无误才允许推送**。前面几步错了成本是零，第 5 步泄出去就要靠回滚。

```bash
cd /home/emberff/blog          # 所有命令都在这里执行，不要用 /mnt/c
```

### 步骤 1：新建文章

**方式 A（推荐，自动填 title/date）**

```bash
npx hexo new "文章标题"
# 期望输出：INFO  Created: ~/blog/source/_posts/文章标题.md
```

文件名 = 标题（`_config.yml` 里 `new_post_name: :title.md`），permalink 就是 `/:year/:month/:day/:title/`，中文标题会变成百分号编码 URL —— 这是正常的，`curl` 验证时要编码。

**方式 B（直接建文件）**：在 `source/_posts/` 下新建 `标题.md`，手动写 front matter。适合已有草稿、或要精确控制文件名的情况。

`scaffolds/post.md` 就是 `hexo new` 用的骨架，当前内容：

```yaml
---
title: {{ title }}
date: {{ date }}
tags:
---
```

补 `excerpt` 和 `category` 靠手写（骨架里没有），规范见第 4 节。

### 步骤 2：本地预览

```bash
npm run server                 # = hexo server，默认 http://localhost:4000/
# 换端口（4001 已被别的进程占用，别用）：
npm run server -- -p 4011
# 只构建不预览：产物在 public/
npm run build
```

判断标准：

- 终端打印 `Hexo is running at http://localhost:4000/` **并且** `ss -tln | grep 4000` 能看到监听。只打印日志但端口不监听 = 卡死，见第 3.8 条。
- 首页 `http://localhost:4000/` → **200**；文章页 `http://localhost:4000/2026/09/24/一次证书续期排障记录/` → **200**；不存在的路径 → **404**。
- 进程状态应是 `Ssl`，不是 `/mnt/c` 上的 `D`/`Dsl`。

`hexo server` 带文件 watch，改完 `.md` 一般会自动重建，刷新即可，**不需要重启**。但偶发不重建（watch 漏事件、或你在改配置），这时 `Ctrl-C` 后重跑一次 `npm run server` 是最快的解法，别去研究 watch。

**只看构建是否通过（不预览）**：

```bash
npx hexo clean && npx hexo generate
# 期望：INFO  Files loaded in ... / INFO  Generated: ... / INFO  106 files generated in ...，无 FATAL
```

**改配置/主题/JS/CSS 后必须重启** server，watch 对 `_config*.yml` 的改动不完全可靠。

### 步骤 3：审批闸门（**不可跳过**）

在预览页面上把新文章从头到尾看一遍（标题、TOC、表格、mermaid、代码块、note 块、图片），确认无误再往下走。历史上跳过这一步的代价就是"已经部署了才发现排版坏了"。

判断标准（渲染层面的自查，视改动范围选做）：

```bash
grep -c "class=\"note" public/<路径>/index.html      # note 块数量是否符合预期
grep -c "<table"      public/<路径>/index.html       # 表格是否都在（含代码高亮表）
grep -o "mermaid"     public/<路径>/index.html | wc -l   # mermaid 是否被渲染出来
```

### 步骤 4：同步到 GitHub（源码仓库）

```bash
git status                      # 先看一眼：只应包含你这次改的 md/配置，不应有 .idea/*、db.json 之类噪声
git add source/_posts/新文章.md  # 显式 add，别用 git add -A（避免把 .idea 噪声带进去）
git commit -m "新增<标题>博客"
git push origin main
```

判断标准：`git log --oneline -1` 是刚写的提交；`git status` 干净；`git push` 后远程 sha 与本地一致：

```bash
git rev-parse HEAD
git ls-remote origin -h refs/heads/main | cut -f1     # 两个 sha 必须相同
```

`git push` 若**毫无输出并且远程 sha 没变**，是网络抖动（第 3.11 条），加 keepalive 重试：

```bash
GIT_SSH_COMMAND="ssh -o ConnectTimeout=15 -o ServerAliveInterval=10" git push -v origin main
```

### 步骤 5：部署

```bash
npx hexo clean && npx hexo generate && npx hexo deploy
```

- 期望看到 `INFO  106 files generated ...`，随后 `hexo-deployer-git` 打印类似 `[master xxxxxxx] Site updated: ...` 与 **`INFO  Deploy done: git`**，最后 push 成功。
- **警告**：`Deploy done: git` 可能骗人（`Everything up-to-date` + `Deploy done` 但实际没推上去）。不做全局 git 身份就会这样，判断真假必须看下一步。
- 网络不稳时按第 3.11 条包裹：

```bash
GIT_SSH_COMMAND="ssh -o ConnectTimeout=15 -o ServerAliveInterval=10" npx hexo deploy
```

### 步骤 6：线上验证（**必做，且要等**）

部署有延迟，Pages 构建需要**几十秒**（有时更久）。轮询到 `built`：

```bash
gh api repos/emberff/emberff.github.io/pages --jq .status      # 期望：built
```

再打新文章的 permalink（中文标题必须 URL 编码）：

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://emberff.github.io/2026/09/24/%E4%B8%80%E6%AC%A1%E8%AF%81%E4%B9%A6%E7%BB%AD%E6%9C%9F%E6%8E%92%E9%9A%9C%E8%AE%B0%E5%BD%95/"
# 期望：200
```

顺手确认部署仓库确实更新了：

```bash
gh api repos/emberff/emberff.github.io/commits/main --jq '.sha[0:7] + " " + .commit.message'
```

**判断标准**：`status=built` + permalink 返回 200 + 部署仓库出现新的 `Site updated: ...` 提交，三条都满足才算发布成功。只满足前两条而页面是旧内容 = 浏览器/Pages 缓存，硬刷新或刷新几次再判。

### 出错 / 回滚

| 阶段 | 症状 | 处理 |
| --- | --- | --- |
| 还没 commit | 文件改坏了 | `git checkout -- source/_posts/xxx.md`（丢弃改动，回到上次提交） |
| 已 commit，未 push | 想撤销这次提交 | `git reset --soft HEAD~1` 后重新改、重新 commit |
| 已 push 源码，未部署 | 源码错但线上还是旧的 | `git revert <sha>` + `git push origin main`（保留历史，别 force push） |
| 已部署，页面错 | 线上已经是错内容 | 修好文件 → 走完整步骤 4/5/6 重新生成再部署。**Pages 是覆盖式的**，重新 deploy 就会盖掉，不需要"先删除" |
| 部署仓库被搞乱 | 极端情况 | 重新 `npx hexo clean && npx hexo generate && npx hexo deploy` 全量覆盖 |

---

## 3. 历史踩坑与解决办法

### 状态标记的含义

| 标记 | 含义 | 处理方式 |
| --- | --- | --- |
| `✅ 已永久解决` | 已通过配置/操作固化，在当前设备**不会再犯**（已设全局 git 身份、已复制 SSH 密钥、已装 nvm 等） | 不用管，但**换机器时要重做固化动作**（第 1.2 节的前置条件块） |
| `⚠️ 环境相关，换环境会重现` | 本质是 WSL/Windows 交互或工具链/平台特性，换机器、换目录还会遇到 | 知道怎么绕、绕过去就行，不要试图"修好它" |
| `📝 写作规范类` | 不是 bug，是写博客必须遵守的约定 | 写文章时主动规避 |

### 3.0 状态索引（17 条）

| # | 现象 | 状态 |
| --- | --- | --- |
| 1 | `/mnt/c` 上 bash 写不了 → `hexo g` 报 `EACCES` | ⚠️ 环境相关 |
| 2 | `hexo d` 打印 `Deploy done` 但静默不推送（`Author identity unknown`） | ✅ 已永久解决 |
| 3 | WSL 无 `~/.ssh` → `ssh_askpass` / `Host key verification failed` | ✅ 已永久解决 |
| 4 | WSL 里 `node: command not found` | ✅ 已永久解决 |
| 5 | `{% note %}` 块内换行被压成空格 | 📝 写作规范类 |
| 6 | 表格单元格内嵌三反引号导致表格断裂 | 📝 写作规范类 |
| 7 | mermaid 标签含 `{}` `<>` `:` 渲染失败 | 📝 写作规范类 |
| 8 | `hexo s` 在 `/mnt/c` 上卡成 `Dsl`、端口不监听、杀不掉 | ⚠️ 环境相关 |
| 9 | PDF 提取：`fitz` 不可用；汉字变康熙部首乱码 | ⚠️ 环境相关 |
| 10 | fluid 1.9.9 字数统计/阅读时间口径变化（2.5k/21min → 7.2k/61min） | ✅ 已永久解决（固化为预期行为） |
| 11 | `git push` 无输出且实际未推送（网络抖动） | ⚠️ 环境相关 |
| 12 | `.idea/*` 在 WSL 侧显示 modified、Windows 侧干净 | ⚠️ 环境相关 |
| 13 | 端口 4001 已被占用 → `EADDRINUSE` | ⚠️ 环境相关 |
| 14 | `npm warn allow-scripts ...`（imagemin / hexo-util postinstall 未执行） | ⚠️ 环境相关（无害） |
| 15 | 首页加载慢的历史优化成果（改坏会退化） | ✅ 已永久解决（成果已落盘） |
| 16 | GitHub Pages TTFB 国内抖动 0.11–3.9s | ⚠️ 环境相关（平台限制） |
| 17 | `db.json` 体积无故增长 | ⚠️ 环境相关（无害，原因未定性） |

---

### 3.1 `/mnt/c` 上 bash 写操作 Permission denied → `hexo g` 报 `EACCES`

- **现象**：`cd /mnt/c/Users/15222/blog && npx hexo generate` 直接失败：

```
Error: EACCES: permission denied, open '/mnt/c/Users/15222/blog/public/local-search.xml'
Error: EACCES: permission denied, open '/mnt/c/Users/15222/blog/db.json'
```

  同一目录下连最基础的写操作也全挂（目录项虽然显示 `drwxrwxrwx`）：

```
touch: cannot touch 'db.json.test': Permission denied
bash: source/_posts/.writetest: Permission denied
rm: cannot remove '.wtest': Permission denied
```

- **原因**：两件事叠加。① `/mnt/c` 是 9p 挂载（`mount` 显示 `type 9p (... aname=drvfs;path=C:\;uid=1000 ...)`），在该会话里 bash 的写权限矩阵实测为：`/mnt/c`、`/mnt/d`、`/mnt/wsl`、`/home/emberff` 全 `read-only`，只有 `/tmp` `WRITABLE`；② DSH 会话运行在 `workspace-write` 沙箱下，限制的是写操作本身。注意矛盾点：**同一身份（`uid=1000(emberff)`）下 bash 写不了，但 DSH 的编辑工具写得了**——所以文章文件当时是成功落盘的（`git status` 里能看到新文件）。
- **解决**：
  1. **首选**：改用 WSL 原生目录 `/home/emberff/blog`，一切正常（现在就是这么做的）。
  2. 需要原地验证时，把工程复制到 `/tmp` 再构建（`node_modules` 用软链接省时间）：
     ```bash
     rm -rf /tmp/blogtest && mkdir -p /tmp/blogtest
     cp -r _config*.yml package*.json scaffolds scripts source /tmp/blogtest/
     ln -sfn /home/emberff/blog/node_modules /tmp/blogtest/node_modules
     cd /tmp/blogtest && npx hexo generate     # 期望 INFO 111 files generated（当时 18 篇的规模）
     ```
  3. 实在要写 Windows 副本，走 Windows 侧工具（`cmd.exe` 实测能写 `C:\`，且 `/mnt/d/Git/cmd/git.exe` 存在）：
     ```bash
     cmd.exe /c "chcp 65001 >nul && cd /d C:\Users\15222\blog && git.exe status"
     ```
     `chcp 65001` 是为了中文路径/输出不乱码。
- **自查**：`touch /mnt/c/Users/15222/blog/.wtest` —— 成功就是可写，`Permission denied` 就是 9p 阻挡，立刻改用 `/home/emberff/blog`。
- **状态**：⚠️ 环境相关，换环境会重现（任何 WSL + `/mnt/c` + 受限沙箱的组合都会）。
- **遗留物**：当时用 `cmd.exe` 写的探针文件 `C:\Users\15222\blog\.wtest`（8 B）没能删掉（`rm` 无权限），若在 Windows 副本里看到 `?? .wtest` 是无害残留，可在 Windows 资源管理器里直接删。

### 3.2 `hexo d` 静默不推送（`Author identity unknown`）

- **现象**：`hexo d` 复制完文件后打印 `Author identity unknown`，但仍输出 `Everything up-to-date` / `Deploy done: git`，看起来成功了，实际远程 sha 没变。

```
Author identity unknown
*** Please tell me who you are.
fatal: empty ident name (for <emberff@LAPTOP-LGFGVM74.localdomain>) not allowed
```

- **原因**：`hexo-deployer-git` 用的是独立的临时仓库 `.deploy_git`，它**不继承博客仓库的本地 git 配置**（当时身份只配在当前仓库、全局为空）。
- **解决**：设置**全局**身份（这是发布链路的硬前置）：
  ```bash
  git config --global user.name "Emberizaf"
  git config --global user.email "1522236760@qq.com"
  ```
  设完后重跑 `hexo d`，正常输出形如：
  ```
  [master 51529a3] Site updated: 2026-08-06 16:02:45
  INFO  Deploy done: git
  ```
- **自查**：`git config --global user.name` 非空；部署后 `git --git-dir=.deploy_git log --oneline -1` 有新提交，且 `gh api repos/emberff/emberff.github.io/commits/main --jq .sha` 变化。
- **状态**：✅ 已永久解决（全局身份已配好，`.deploy_git` 从此有作者信息）。换机器要重做。

### 3.3 WSL 里没有 `~/.ssh`

- **现象**：`git push origin main` 报：

```
ssh_askpass: exec(/usr/bin/ssh-askpass): No such file or directory
Host key verification failed.
fatal: Could not read from remote repository.
```

- **原因**：WSL 侧没有 `~/.ssh`，也没有 ssh-askpass 图形助手；密钥当时只在 Windows 侧 `C:\Users\15222\.ssh\`。
- **解决**：把密钥从 Windows 侧复制过来并收紧权限：
  ```bash
  mkdir -p ~/.ssh && chmod 700 ~/.ssh
  cp /mnt/c/Users/15222/.ssh/{id_rsa,id_rsa.pub,known_hosts,known_hosts.old} ~/.ssh/
  chmod 600 ~/.ssh/id_rsa
  ssh -o StrictHostKeyChecking=accept-new -T git@github.com
  ```
- **自查**：`ssh -T git@github.com` → `Hi emberff! You've successfully authenticated, but GitHub does not provide shell access.`；`ls -l ~/.ssh/id_rsa` 权限为 `-rw-------`。
- **状态**：✅ 已永久解决（`~/.ssh/id_rsa` 就绪，SSH 认证已通过）。

### 3.4 WSL 里 `node` 找不到

- **现象**：WSL 里执行 `node -v` → `/bin/bash: line 1: node: command not found`；而 `which npm` 却指向 `/mnt/c/Program Files/nodejs/npm`（继承了 Windows PATH）。Windows 的可执行文件在 WSL 里必须带 `.exe`：`node.exe -v` → `v22.20.0`。当时 Hexo 只装在 Windows 全局（`C:\Program Files\nodejs\` 里有 `hexo`/`hexo.cmd`/`hexo.ps1`）。
- **原因**：WSL 没有自己的 Node，只是 PATH 里混进了 Windows 的 Node 目录。
- **解决**：用 nvm 装 LTS：
  ```bash
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  nvm install --lts      # 装上 Node v24.19.0 + npm 11.17.0，default -> lts/*
  ```
  nvm 会把初始化写入 `~/.bashrc`。
- **自查**：`which node` → `/home/emberff/.nvm/versions/node/v24.19.0/bin/node`（优先级正确，不会误用 Windows Node）；`node -v` → `v24.19.0`。
- **状态**：✅ 已永久解决（nvm 已装，Node v24.19.0 / npm 11.17.0）。
- **备注**：全局 `hexo-cli` 4.3.2 存在但**不必需**，仓库里用 `npx hexo` / `npm run build` 就会走锁定的 hexo 8.1.2。

### 3.5 `{% note %}` 块内换行被压成空格

- **现象**：note 块里放代码块或列表，渲染后糊成一整行/一行散文。
- **原因**：Fluid 的 `node_modules/hexo-theme-fluid/scripts/tags/note.js` 里对内容做了 `.split('\n').join(' ')`：

```js
return `<div class="note note-${args.join(' ')}">
          ${hexo.render.renderSync({ text: content, engine: 'markdown' }).split('\n').join(' ')}
        </div>`;
```

- **解决**：note 块内**只写散文**（可以加粗、可以行内代码）；**代码块和列表一律移到 `{% endnote %}` 之外**。写了《一次证书续期排障记录》时因此改了 3 处。
- **自查**：`hexo generate` 后在 `public/<文章>/index.html` 里数 `class="note` 的块，打开页面看块内是否只剩一段连续文字。
- **状态**：📝 写作规范类。可用 class：`default`/`secondary`/`primary`/`success`/`danger`/`warning`/`info`（见主题 `post-tag.styl`；本站 `note_class: success`）。

### 3.6 表格单元格内嵌三反引号导致表格断裂

- **现象**：Markdown 表格渲染崩坏。原文如下（错误写法）：

```
| 8 | 脚本执行了却不写日志 | 文件首行是 Markdown 代码围栏 ``` ```bash ``` | `sed` 删除首尾围栏，用 `xxd` 确认文件头 |
```

- **原因**：单元格里出现三个反引号，被 Markdown 当成代码围栏开始/结束，表格结构被截断。
- **解决**：单元格里要用反引号包裹"反引号"时，**用双反引号**或改写行内描述：

```
| 8 | 脚本执行了却不写日志 | 文件首行混进了 Markdown 代码围栏 `` ```bash `` | `sed` 删除首尾围栏，用 `xxd` 确认文件头 |
```

- **自查**：`grep -c "<table" public/<文章>/index.html` 得到的表数量 = 手写的 Markdown 表 + 代码高亮表；页面滚动到该处看表格是否完整（当时验证：真实 Markdown 表 5 张 / 45 行全部正常）。
- **状态**：📝 写作规范类。

### 3.7 mermaid 节点标签含 `{}` `<>` `:` 导致渲染失败

- **现象**：mermaid 图不显示，报编译错误。触发原文：节点标签里写了 `Redis<br/>travel:memory:{userId}`。
- **原因**：`{userId}` 的花括号被 mermaid 解析为**菱形节点语法**，`<br/>`、`:` 在部分写法下也会干扰解析。
- **解决**：**所有含特殊字符（`{}`、`<>`、`:`）的节点标签一律用双引号包裹**，例如 `A["Redis<br/>travel:memory:{userId}"]`。
- **自查**：`hexo generate` 后 `grep -o "mermaid" public/<文章>/index.html | wc -l` 数量正常，且浏览器里图能画出来（渲染为 `<pre><code class=" mermaid">`）。
- **状态**：📝 写作规范类。

### 3.8 `hexo s` 在 `/mnt/c`（9p）上卡死

- **现象**：`hexo s -p 4000` 日志已打印 `Hexo is running at http://localhost:4000/`，但 10~15s 后 `curl` 返回 **HTTP 000**、`ss -tln` 显示 4000 **未监听**，进程状态是 **`Dsl`（不可中断睡眠）**。更糟的是 `pkill -f "hexo s"`、`pkill -9 -f hexo` 甚至 `hexo help server` 都会**挂住工具直到超时**（后台进程占着 shell 管道），最后要用 `kill -9 <pid>` 或 `fuser -k 4000/tcp` 才释放端口。
- **原因**：hexo server 在 9p 挂载目录上做文件 watch（chokidar/inotify）卡死，`D` 状态连 `SIGKILL` 都投递不进去。
- **解决**：**用 `/home/emberff/blog` 就不会遇到**（已实测：server 起来后首页 200、文章页 200、不存在路径 404，进程状态正常是 `Ssl`）。这就是 WSL 侧成为唯一推荐工作目录的直接原因。
- **自查**：`ss -tln | grep 4000` 有监听 + `curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/` 返回 `200`。若进程已在 `D`/`Dsl`，直接 `fuser -k <port>/tcp` 收场，别反复 `pkill`。
- **状态**：⚠️ 环境相关，换环境会重现（只要在 `/mnt/c` 上跑就会重现；在原生 ext4 上不会）。
- **顺带**：后台起 server 时要当成"会占住管道"的进程对待——用完必须显式 kill。

### 3.9 PDF 提取的两个坑（`fitz` 不可用 / 康熙部首乱码）

- **现象 A**：`python3 -c "import fitz"` → `ModuleNotFoundError: No module named 'fitz'`；`pdftotext` 也不存在（`which pdftotext` 退出码 1）。
- **现象 B**：用 pdfminer 提取出来的文本里，`自`/`用` 等字显示成 `⾃`（U+2F03）/`⽤` 这类怪字形，影响阅读和统计。
- **原因**：A 是环境里没装 PyMuPDF；B 是 PDF 内嵌字体把汉字映射到 **Unicode 康熙部首区（U+2E80–U+2FDF）**——那份 24 万字节的对话记录里含 **1,257** 个这类字符。
- **解决**：
  ```python
  from pdfminer.high_level import extract_text
  import unicodedata
  t = extract_text("xxx.pdf")
  t = unicodedata.normalize("NFKC", t)        # 关键一步，否则读到乱码字形
  open("/tmp/out.txt", "w", encoding="utf-8").write(t)
  ```
  提取时 stderr 会刷 `Could not get FontBBox from font descriptor because None cannot be parsed as 4 floats`，**可忽略**。读长文用 `awk 'NF'` 去空行后 `sed -n '1,400p'` 分段读。
- **自查**：NFKC 前后汉字数会明显变化（实测 12,761 → 14,007）；`grep -c $'\u2f03'` 归一化后应为 0。
- **状态**：⚠️ 环境相关，换环境会重现（任何 PDF 提取都可能遇到，处理套路固定）。

### 3.10 fluid 1.9.9 升级后字数统计/阅读时间变长

- **现象**：升级 hexo 7→8 / fluid 1.9.8→1.9.9 后，同一篇文章的统计从 **「2.5k 字 / 21 分钟」变成「7.2k 字 / 61 分钟」**。
- **原因**：fluid 1.9.9 重写了 `node_modules/hexo-theme-fluid/scripts/helpers/wordcount.js`——旧版按「CJK 字符数 + 英文单词数」计，新版直接 `stripHTML(post.origin || post.content).length`（**代码字符也算进去**）。A/B 实测同一 HTML `stripHTML` 后长度 OLD 7442 / NEW 7402，证明**内容没变，是算法变了**。
- **解决**：**不是 bug，别去修**。接受新口径即可。若真要恢复旧口径，只能改主题的 `wordcount.js`——那会引入本地补丁、升级主题时被覆盖，不划算。
- **自查**：`node -e "const w=require('hexo-theme-fluid/scripts/helpers/wordcount.js');console.log(w.toString().slice(0,200))"` 里能看到 `stripHTML`。更简单的自查：文章正文一个字没动，数字却变了 → 就是它。
- **状态**：✅ 已永久解决（固化为预期行为：主题版本锁在 1.9.9，统计口径不会再变；下次升级主题需重新评估）。

### 3.11 `git push` 偶发无输出且实际未推送

- **现象**：`timeout 120 git push origin main` 没有任何输出，远程 sha 未变（本地 ahead 1），像是什么都没发生。
- **原因**：网络抖动导致连接静默断掉。
- **解决**：加 SSH keepalive 重试；部署同理：
  ```bash
  GIT_SSH_COMMAND="ssh -o ConnectTimeout=15 -o ServerAliveInterval=10" timeout 180 git push -v origin main
  GIT_SSH_COMMAND="ssh -o ConnectTimeout=15 -o ServerAliveInterval=10" timeout 300 npx hexo deploy
  ```
- **自查**：`git ls-remote origin -h refs/heads/main | cut -f1` 与 `git rev-parse HEAD` 必须相同；`git status` 里不能还写 `ahead 1`。
- **状态**：⚠️ 环境相关，换环境会重现（网络问题）。

### 3.12 `.idea/*` 在 WSL 与 Windows 两侧状态不一致

- **现象**：同一仓库，WSL 侧 `git status` 显示 `.idea/*` 为 modified，Windows 侧是干净的。
- **原因**：`.idea/` 里的文件行尾（CRLF/LF）在不同 git（`core.autocrlf` 设置不同）下判定不同，属于行尾噪声，不是真实改动。
- **解决**：提交前 `git checkout -- .idea` 丢弃噪声（历史做法，两次都刻意没提交它）；长期解法见第 6 节（`.gitignore` 或 `.gitattributes`）。
- **自查**：`git diff --stat -- .idea` 如果只有行尾变化（`git diff --ignore-cr-at-eol -- .idea` 为空）就是噪声。
- **状态**：⚠️ 环境相关，换环境会重现（双 git 并存就会）。

### 3.13 端口 4001 被占用

- **现象**：`hexo server -p 4001` → `EADDRINUSE`。
- **原因**：4001 已被本机别的进程占用。
- **解决**：换端口，例如 `npm run server -- -p 4011`（**不要用 4001**）。
- **自查**：`ss -tlnp | grep <端口>`；`:4000` 是 hexo server 的默认端口，`4010`/`4011` 是历史验证过的可用端口。
- **状态**：⚠️ 环境相关，换环境会重现。

### 3.14 `npm warn allow-scripts ...`（imagemin / hexo-util 的 postinstall 未执行）

- **现象**：`npm ci` / `npm install` 打印 `npm warn allow-scripts 8 packages ...`（imagemin 系列二进制 gifsicle/jpegtran/mozjpeg/optipng/pngquant 的 postinstall 未执行）；历史上还有 `npm warn allow-scripts hexo-util@3.3.0 (postinstall: npm run build:highlight)`。
- **原因**：npm 新的安全策略默认阻塞依赖的 postinstall 脚本。
- **解决**：**无需处理**。已实测不影响 HTML/CSS/JS 压缩（构建输出里能看到 `Optimize HTML: index.html [30% saved]`），且本站 `_config.yml` 里 `image_minifier.enable: false`（图片单独处理）。`hexo-util` 那条也不影响构建（`dist/` 与 `highlight_alias.json` 随包发布）。
- **自查**：`npm run build` 后 grep `Optimize HTML` 有输出即正常。
- **状态**：⚠️ 环境相关（无害），换环境会重现（换 npm 版本/策略也会）。

### 3.15 首页性能优化的既有成果（改坏会退化）

这些改动已经落盘并上线，**不要重复优化，也不要无意改回去**：

| 项 | 现状 |
| --- | --- |
| `source/js/loader.js` | 已重写：去掉 `code.jquery.com` 外网依赖，改原生实现 + 3s 兜底超时 + 淡出 class（保留 loader 动画） |
| `source/js/deferred.js` | 新建：`window.load` 之后才动态注入 `anime.js / fireworks.js / fishes.js / duration.js` |
| `_config.fluid.yml` 的 `custom_js` | 从 5 个同步脚本收敛为 `loader.js` + `deferred.js` |
| `source/html/sakana.html` | 改走 `registry.npmmirror.com/sakana-widget/2.7.0/...`，去掉 `document.write`，onload 后 append |
| 首页/内页 banner | 首页走腾讯 COS `?imageMogr2/thumbnail/1600x/format/webp/quality/75`（550 KB JPEG → 289 KB WebP）；内页用 `source/img/default.webp`（400 KB PNG → 6 KB） |
| `hexo-all-minifier` | 已启用 `all_minifier` + html/css/js minifier，`image_minifier.enable: false` |
| `_config.yml` 的 `url` | 已从 `http://example.com` 修正为 `https://emberff.github.io`（影响 `og:url`） |
| 已删除 | `source/background/miles.mp4`(13.2 MB)、`spiderlogo.jpg`(3.36 MB)、`source/js/background.js`、`mouse-firework` 依赖、`hexo-static-cos`（从未生效）；2026-09-27 又删了 `source/background/` 下 4 个零引用图（见第 6.7 节） |

**效果**：`public/index.html` 36554 → 25877 B；`public/` 中 `code.jquery.com`、`fastly.jsdelivr` 引用数为 0，`document.write` 计数为 0。

- **自查**：`grep -rc "code.jquery.com" public/ | grep -v ":0"` 应为空；`ls -l public/index.html` 应在 26 KB 量级。
- **状态**：✅ 已永久解决（成果固化在仓库文件里，并有上面的自查方法）。
- **遗留**：~~`source/background/` 里未被引用的图片约 1.8 MB 仍在~~ → **2026-09-27 已清理，见第 6.7 节**（构建产物文件数随之从 110 降到 106）。

### 3.16 GitHub Pages TTFB 国内抖动

- **现象**：国内访问首页 TTFB 实测在 **0.11s ~ 3.9s** 之间大幅抖动。
- **原因**：GitHub Pages 的平台结构性限制（境外节点 + 无国内加速），不是博客配置问题。
- **解决**：无解于配置层。要彻底改善得自建 COS + CDN 或换服务器（历史上 `hexo-static-cos` 插件因 `_config.yml` 没有 `qcloudcos` 段而从未生效，已卸载）。
- **自查**：`curl -o /dev/null -s -w "TTFB %{time_starttransfer}s\n" https://emberff.github.io/`，多次采样看抖动区间。
- **状态**：⚠️ 环境相关，换环境会重现（平台限制）。

### 3.17 `db.json` 体积无故增长

- **现象**：一次会话中 `db.json` 在没有构建的情况下从 1,462,270 B 变成 1,650,589 B（mtime 也变了），当时未能解释。
- **原因**：**未定性**（可能与 hexo server 后台进程/被打断的构建有关）。
- **解决**：不用处理——`db.json` 在 `.gitignore` 里（连同 `public/`、`node_modules/`、`.deploy*/`），不参与提交，属 hexo 本地缓存。怀疑缓存坏了就 `npm run clean`。
- **自查**：`git check-ignore -v db.json` 应命中 `.gitignore`。
- **状态**：⚠️ 环境相关（无害），记录在案避免以后重复排查。

---

## 4. 写作规范

### 4.1 front matter

字段固定为 `title` / `excerpt` / `date` / `tags` / `category`（**`category` 是单数键**，值用行内数组）：

```yaml
---
title: 一次 Let's Encrypt 证书全量续期与自动续期排障记录
excerpt: 11 张证书集体过期、通配符证书的 manual 验证、自定义 Nginx 的 PID 陷阱，以及一个被 Markdown 代码围栏污染的续期脚本
date: 2026-09-24 13:30:00
tags: [Let's Encrypt, Certbot, Nginx, SSL, Linux]
category: [运维, 踩坑]
---
```

- `excerpt` 会渲染成页面 `<meta name="description">`，**必写**，一句话说清"这篇讲什么"。
- `tags` 用具体技术名词（`[Hexo, Fluid]`、`[Java]`、`[Agent, LangChain4j, SpringBoot]`）；`category` 用两级归属（`[运维, 踩坑]`、`[学习, Java]`、`[博客, 美化]`、`[工具, 踩坑]`）。
- **页面**（非文章）用 `layout:` 指定模板，例如 `source/links/index.md`：
  ```yaml
  ---
  title: 友链
  layout: links
  date: 2026-08-06 00:00:00
  ---
  ```
- 中文标题的 permalink 是百分号编码 URL（`/2026/09/24/一次证书续期排障记录/`），正常现象。

### 4.2 正文结构偏好

1. **开头用一个 note 块写"起因/本文讲什么"**，承接读者：
   ```markdown
   {% note %}
   起因只是一句"服务器上的自签证书过期了，怎么续期？"，结果越查越大：**11 张 Let's Encrypt 证书其实全都过期了**……
   {% endnote %}
   ```
2. **编号一级标题**：`# 一、背景与初始问题`、`# 二、转折：这根本不是自签证书` …… 结尾 `# 参考资料`。
3. **复盘顺序固定为 `起因 → 定位 → 解决 → 验证`**（排障类文章尤其如此）；二级标题用 `1.1` / `3.2` 编号。
4. **环境信息用表格**（系统/版本/命令矩阵）。
5. **大量对比表格**（方案 A/B、问题 → 影响 → 建议、踩坑清单汇总）。
6. **流程用 mermaid 画图**（标签记得加引号，见 3.7）。
7. **代码只给关键片段**，不贴全文；命令与关键输出用代码块。
8. 改动类文章要**前后量化对比**（如首页 36554 → 25877 B、400 × 6 KB）。
9. Git 演进章节**简化为表格**，纯配置/细微改动的提交可省略并注明省略原因；项目评估章节写"亮点 + 不足及改进建议"，建议用表格。

### 4.3 note 块可用 class

| 写法 | 用途 |
| --- | --- |
| `{% note %}` | 默认（本站渲染为 `note_class: success` 的颜色） |
| `{% note info %}` | 补充说明 |
| `{% note warning %}` | 注意/坑 |
| 另可用 | `success` / `danger` / `primary` / `secondary` |

**铁律**：note 块内只写散文，代码块和列表一律放到块外（第 3.5 条）。

### 4.4 提交信息风格

中文，动词开头，类型前缀按改动性质选：

```
新增一次证书续期排障记录博客
新增基于langchain的简单agent应用博客
chore: 移除页脚 ICP 与公安备案信息
chore: 升级 hexo@8.1.2 与 fluid@1.9.9，移除未启用的 hexo-static-cos
feat: 添加友链页 robotdaneelolivaw0-0 并启用导航菜单
perf: 优化首页加载速度
```

### 4.5 内容红线（**必须遵守**）

博客源码仓库 `emberff/blog` 是 **public** 仓库，写文章引用对话记录/日志时：

- **绝不**写入密钥、密码、token、私钥、证书私钥、API key、服务器公网 IP 之类信息。
- 引用自己的排障对话时，把命令输出里的敏感字段删掉或替换为占位符（`<REDACTED>`）。
- 发布前自查：
  ```bash
  grep -rniE "(password|passwd|api[_-]?key|secret|token|PRIVATE KEY|BEGIN RSA)" source/_posts/ | grep -v "占位"
  grep -rnE "([0-9]{1,3}\.){3}[0-9]{1,3}" source/_posts/    # 检查裸 IP
  ```
  命中不一定是问题（讲解用的示例值），但要逐条确认不是真值。
- 历史上出现过"用户在会话里贴出明文 sudo 密码"的情况——**这类内容绝不能进博客**。

---

## 5. 常见问题速查（QA）

### 症状 → 一句话解决

| 症状 | 解决 |
| --- | --- |
| `EACCES: permission denied, open '.../public/...'` | 你在 `/mnt/c` 上构建。换到 `/home/emberff/blog`（3.1） |
| `hexo d` 打印 `Deploy done` 但线上没变 | 检查 `git config --global user.name/user.email` 是否为空（3.2） |
| `Author identity unknown` / `empty ident name` | 同上：设全局 git 身份（3.2） |
| `ssh_askpass: ... No such file or directory` / `Host key verification failed.` | `~/.ssh` 不存在或权限不对：复制密钥 + `chmod 600`（3.3） |
| `node: command not found`（而 `which npm` 指向 `/mnt/c/...`） | WSL 没装 Node：`nvm install --lts`（3.4） |
| note 块里的代码/列表糊成一行 | 把代码块和列表移出 `{% note %}`（3.5） |
| 表格渲染崩坏 / 断裂 | 单元格里的三反引号改双反引号（3.6） |
| mermaid 图报编译错误 | 节点标签加双引号（3.7） |
| `hexo s` 打印了地址但访问是 000、进程 `Dsl`、`pkill` 挂住 | 在 `/mnt/c` 上跑 server 卡死。改用 WSL 目录；已卡死就 `fuser -k <port>/tcp`（3.8） |
| PDF 读出来是 `⾃`/`⽤` 这种怪字 | 提取后 `unicodedata.normalize("NFKC", t)`（3.9） |
| `import fitz` 失败 | 用 `pdfminer.high_level.extract_text`（3.9） |
| 文章字数从 2.5k 变 7.2k、阅读时间翻倍 | fluid 1.9.9 的口径变化，不是 bug，别修（3.10） |
| `git push` 无输出、远程 sha 没变 | `GIT_SSH_COMMAND="ssh -o ConnectTimeout=15 -o ServerAliveInterval=10" git push -v origin main`（3.11） |
| `git status` 里 `.idea/*` 老显示 modified | 行尾噪声：`git checkout -- .idea`（3.12） |
| `EADDRINUSE`（4001 等端口） | 换端口：`npm run server -- -p 4011`（3.13） |
| `npm warn allow-scripts ...` | 无害，忽略（3.14） |
| 首页变慢 / 又出现外网 CDN | 你改坏了 loader/deferred/sakana，回看 3.15 |
| 国内访问 TTFB 抖动大 | Pages 平台限制，配置层无解（3.16） |

### 高频操作：复制粘贴命令块

**A. 新建 + 本地预览**

```bash
cd /home/emberff/blog
npx hexo new "文章标题"
npm run server -- -p 4011        # 打开 http://localhost:4011/ 逐页确认
```

**B. 构建通过性检查**

```bash
cd /home/emberff/blog
npx hexo clean && npx hexo generate     # 期望：INFO  106 files generated，无 FATAL
```

**C. 审批通过 → 同步源码 → 部署 → 线上验证**

```bash
cd /home/emberff/blog

# 1) 提交并推送源码
git status
git add source/_posts/文章标题.md
git commit -m "新增文章标题博客"
GIT_SSH_COMMAND="ssh -o ConnectTimeout=15 -o ServerAliveInterval=10" git push -v origin main
git ls-remote origin -h refs/heads/main | cut -f1    # 应等于 git rev-parse HEAD

# 2) 构建并部署
npx hexo clean && npx hexo generate
GIT_SSH_COMMAND="ssh -o ConnectTimeout=15 -o ServerAliveInterval=10" npx hexo deploy

# 3) 等 Pages 构建完成
gh api repos/emberff/emberff.github.io/pages --jq .status      # 轮询到 built

# 4) 打新文章 permalink（中文需 URL 编码）
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://emberff.github.io/2026/09/24/%E4%B8%80%E6%AC%A1%E8%AF%81%E4%B9%A6%E7%BB%AD%E6%9C%9F%E6%8E%92%E9%9A%9C%E8%AE%B0%E5%BD%95/"
```

**D. 回滚**

```bash
git checkout -- source/_posts/文章标题.md   # 未 commit：丢弃改动
git reset --soft HEAD~1                    # 已 commit 未 push：撤回提交保留改动
git revert <sha> && git push origin main   # 已 push 未部署：反向提交
# 已部署错：修好文件后重走 C 的 2~4 步即可（Pages 覆盖式）
```

**E. 清理卡住的 server / 端口**

```bash
ss -tlnp | grep -E "400[0-9]|401[0-9]"
fuser -k 4011/tcp          # 比 pkill 可靠，pkill 在 D 状态进程上会挂住工具
```

**F. 环境自检（换机器时跑一遍）**

```bash
cd /home/emberff/blog
node -v && npm -v && npx hexo version | head -3
git config --global user.name && git config --global user.email
ssh -T git@github.com 2>&1 | head -1
gh auth status 2>&1 | head -3
```

---

## 6. 待完善与建议

### 6.1 `.idea/` 噪声：加 `.gitignore` 或 `.gitattributes`（推荐先做）

现状：`.idea/*` 在 WSL 侧反复显示 modified，每次提交都要 `git checkout -- .idea`（第 3.12 条）。两种最小做法：

- `.gitignore` 追加 `.idea/`（如果确定不共享 IDE 配置）——最省事；
- 或保留跟踪但加 `.gitattributes` 统一行尾，消除 CRLF/LF 判定差异：
  ```
  * text=auto eol=lf
  *.png binary
  *.jpg binary
  *.webp binary
  ```

### 6.2 两处工作副本容易漂移：只以 WSL 侧为准

现状：Windows 副本 `C:\Users\15222\blog` 已经落后过（历史上 GitHub 侧更新了，Windows 工作副本的 HEAD 还停在旧提交，新文章一直是未跟踪文件）。两处并存只会制造"哪边最新"的困惑。建议：

- **只以 `/home/emberff/blog` 为唯一可写工作副本**；
- Windows 侧当作**只读备份**（需要时 `git pull` 同步，或干脆删掉它的 `.git`，只留文件当留档）；
- 不要再用 `/mnt/c` 上的副本跑 hexo 或 git。

### 6.3 「清理 + 构建 + 部署」已固化为 `npm run publish`（2026-09-27 已完成）

**背景**：`package.json` 原本有 `build` / `clean` / `deploy` / `server` 四个脚本，但 `npm run deploy` **只是 `hexo deploy`**——它不会先 clean/generate，直接跑会把**旧的** `public/` 推上去，等于发布一个过期站点。

**已添加**（`package.json` 的 `scripts`）：

```json
"publish": "hexo clean && hexo generate && hexo deploy"
```

**以后部署用这一条**：

```bash
cd /home/emberff/blog
npm run publish          # = clean + generate + deploy，一步到位
```

- `npm run deploy` 仍然保留（只做 `hexo deploy`），但**正常情况下不要直接用它**。
- 状态：✅ 已完成。

### 6.4 给部署加前置检查

部署前至少确认三件事（**目前靠自觉，尚未脚本化**）：

1. `git status --porcelain` 干净（没有未提交的文章改动被漏掉）；
2. 本地 HEAD == `origin/main`（源码已 push，没出现"部署了新文章但源码仓库还是旧的"）；
3. `git config --global user.name` / `user.email` 非空（防第 3.2 条的静默失败）。

现成的一条命令：

```bash
cd /home/emberff/blog
git status --porcelain && git rev-parse HEAD origin/main && git config --global user.name && git config --global user.email
```

> 注意一个顺序陷阱：**改了 `package.json`（比如刚加 `publish`）会让自己处于"未提交"状态**，与第 1 条冲突。正确顺序是——先 `git add package.json && git commit && git push`，再 `npm run publish`。因为 `hexo deploy` 推的是 `public/` 产物、不是源码工作区，源码脏不影响部署本身；但"部署的版本 == 源码的版本"这个可追溯性要求它是干净的。

### 6.5 可选：GitHub Actions 自动部署

现状：仓库**没有** `.github/workflows/`（只有 `.github/dependabot.yml`）。加 Actions 可以让 push 源码后自动构建 + 部署，省掉本地 `hexo deploy`。

**但先想清楚**：这会改动现有流程（部署权从本地 `.deploy_git` 转移到 Actions，需要配置部署凭据/`GITHUB_TOKEN` 权限），并且和"本地预览 + 人工审批"的闸门不完全兼容（CI 一 push 就发布）。建议**保持现状**，除非确实需要异地发布。

### 6.6 首页性能遗留项

- ~~`source/background/` 里未被引用的图片被保留未删~~ → **已在 2026-09-27 清理完毕**，见下方 6.7。现在该目录只剩 `Spiraling Cityscape.jpg` 与 `arch.jpg` 两个文件（都**不是**被本地引用的，本地那两个文件名只是与 COS 远端对象同名，留作备份）。
- **⚠️ 首页 banner 依赖腾讯 COS 的图片处理参数（`imageMogr2`），改 URL 时别把查询参数丢掉**，否则会退回 550 KB 原图。这是本仓库最容易悄悄改坏的一处，改动 `_config.fluid.yml` 后请跑这条自查：

  ```bash
  cd /home/emberff/blog
  # ① 首页 banner 必须带 imageMogr2 参数（期望输出非空）
  grep -n 'banner_img:' _config.fluid.yml | sed -n '2p' | grep -o 'imageMogr2[^"]*'
  # ② 构建产物里也要带上（期望能 grep 到 imageMogr2）
  npx hexo generate >/dev/null 2>&1
  grep -o 'Spiraling[^)"]*' public/index.html
  # ③ 确认没退回原图：URL 里应同时有 format/webp 与 quality
  ```

  当前正确值（`_config.fluid.yml:541`）：
  `https://blog-1318796820.cos.ap-shanghai.myqcloud.com/Spiraling%20Cityscape.jpg?imageMogr2/thumbnail/1600x/format/webp/quality/75`
- GitHub Pages TTFB 抖动（0.11–3.9s，第 3.16 条）是平台限制，配置层无解；要彻底改善只能自建 COS + CDN 或换服务器。
- 主题升级（fluid 1.9.9 → 更新版本）前先读主题 changelog，并预期统计口径/静态资源可能再次变化（参考第 3.10 条的处理方式：先量化 A/B 对比，再决定是否接受）。

### 6.7 静态资源清理记录（2026-09-27 已完成）

**做了什么**：删除 `source/background/` 下 4 个零引用图片 —— `NotFound.png`、`girl.jpg`、`planet.jpg`、`simple.png`（共约 1.34 MB）。保留 `Spiraling Cityscape.jpg` 与 `arch.jpg`。

**为什么**：这些文件不会被复制到构建产物（`public/` 中零出现），也不被任何页面、主题或文章引用，纯粹是仓库负担。

**删除前的确认步骤（以后删静态资源照这个流程做）**：

```bash
cd /home/emberff/blog
# 1) 源侧零引用（排除 db.json —— 它内嵌所有文章正文，会产生假阳性）
grep -rIn --exclude-dir=node_modules --exclude-dir=public --exclude-dir=.git \
     --exclude=db.json --exclude=BLOG_GUIDE.md -E "background/(NotFound\.png|girl\.jpg|planet\.jpg|simple\.png)" .
# 期望：无输出
# 2) 主题侧无回退机制（Fluid 的 random-banner 只读主题自己的 source/img/random）
grep -rIn "background" node_modules/hexo-theme-fluid/scripts/ | grep -v highlight
# 3) 构建产物零引用
grep -rIl -E "(NotFound\.png|girl\.jpg|planet\.jpg|simple\.png)" public/
# 期望：无输出
```

**关键发现（容易误判）**：`_config.fluid.yml` 里出现的 `arch.jpg` 是**腾讯 COS 的远端 URL**（`post.banner_img`），`Spiraling Cityscape.jpg` 也是 COS URL（首页 banner）——**两者都不引用本地 `source/background/` 下的同名文件**。所以不能因为"配置里出现了 arch.jpg"就认为本地那个文件有用；判断依据必须是「路径形式 `background/xxx`」或「构建产物里出现」。

**验证结果（已完成，可复核）**：

```bash
npx hexo clean && npx hexo generate   # → 106 files generated，无 FATAL/ERROR/WARN
find public -type f | wc -l           # → 106（清理前 110，差值 = 4 个被删图片）
grep -rIl -E "(NotFound\.png|girl\.jpg|planet\.jpg|simple\.png)" public/   # → 零引用
```

**状态**：✅ 已完成。文件数从 **110 → 106** 是本次改动的预期结果，以后看到 106 属正常。

**回退方式**：删除的原件曾备份在 `/tmp/background-removed/`（`/tmp` 会被清理）。要恢复请从 git 历史取回：

```bash
git show HEAD~1:source/background/girl.jpg > source/background/girl.jpg   # 换成对应提交
```

### 6.8 手册维护要求（**强制**，与 `AGENTS.md` 同步）

本仓库根目录有 **`AGENTS.md`**，DSH 会自动把它注入 agent 的上下文（`AGENTS.md`/`CLAUDE.md` 从项目根 `.git` 标记向下逐级加载）。所以「改动要回写手册」这条要求是**机器可见的**，不依赖某个人记得。

**规则**：对仓库做「项目结构变更 / 性能优化 / 版本升级 / 配置或脚本改动」的，**必须在同一次工作中回写本手册**，且每条要写清：

| 要素 | 说明 |
|---|---|
| 做了什么 | 具体文件路径 + 关键命令/配置片段 |
| 为什么 | 一句话理由，避免以后被"优化"回去 |
| 完成状态 | 「已完成」/「部分完成（缺什么）」/「未做」，结论要可验证 |
| 怎么自查 | 一条能跑的命令或明确判断标准（`grep` 为空、文件数 N、HTTP 200） |
| 状态标记 | 沿用 `✅ 已永久解决` / `⚠️ 环境相关会重现` / `📝 写作规范类` |

**例外**：只写或只改**文章内容**（`source/_posts/*.md` 的正文、front matter、标签）不需要动手册——第 2、4 节已覆盖。但若写作过程中遇到手册没记过的新坑或新规范，要补进来。

**收尾自检清单**：

- [ ] 手册已更新，或本次改动确实属于"不改手册"的范畴
- [ ] 手册里的版本号 / 文件数（当前 **106**）/ 命令与实际一致
- [ ] 新增结论都附了可执行的自查方法
- [ ] `npx hexo clean && npx hexo generate` 通过，文件数变化可解释

> 为什么用 `AGENTS.md` 而不是只写在手册里：手册要人（或 agent）主动去读，而 `AGENTS.md` 由 harness 在每次会话开始时自动注入上下文，是唯一"不靠自觉"的落点。两者分工——`AGENTS.md` 负责**让规则被看见**，本手册负责**记录知识本身**。改规则时两处都要同步。

### 6.9 部署记录（2026-09-27：首次用 `npm run publish` 上线）

**做了什么**：新增 `npm run publish` 脚本（见 6.3）并**用它完成一次部署**，把 6.7 的图片清理同步到线上。

**执行序列**（可复用）：

```bash
cd /home/emberff/blog
# 1) 先让源码干净（改了 package.json 必须先进提交，见 6.4 的顺序陷阱）
git add package.json && git commit -m "chore: 新增 publish 脚本（clean + generate + deploy）"
GIT_SSH_COMMAND="ssh -o ConnectTimeout=15 -o ServerAliveInterval=10" git push origin main
# 2) 再构建并部署
GIT_SSH_COMMAND="ssh -o ConnectTimeout=15 -o ServerAliveInterval=10" npm run publish
```

**结果（可复核的值）**：

| 项 | 值 |
|---|---|
| 源码仓库 `emberff/blog` main | `caf9977` → `28c2586`（文档+清图）→ **`f30e0de`**（publish 脚本） |
| 部署仓库 `emberff.github.io` main | `f716644` → **`04bc084`**（`Site updated: 2026-09-27 15:53:51`） |
| Pages 构建 | `status: built` |
| 构建产物 | **106 files**（clean 后重新生成） |
| 被删图片 | `background/planet.jpg`、`background/NotFound.png` 等 → **HTTP 404**（已用不存在的文件名做 404 基准对照） |
| 保留的图片 | `background/Spiraling Cityscape.jpg` → **200**、`background/arch.jpg` → 200 |
| 首页 | **200** |

**过程中观察到的现象（不需要处理）**：部署刚完成时，被删图片的 URL 有**几十秒的 CDN 缓存窗口**仍返回 200（首测 `girl.jpg` 为 200，稍后复测为 404）。所以**不要部署完立刻用旧 URL 的 200 判断"没删掉"**，等 30 秒~1 分钟或换个不存在的文件名做对照。

**关键提醒**：`hexo deploy` 用 `-f` 强推 `.deploy_git`，部署仓库的历史是被覆盖式的单次提交（所以 `.deploy_git` 里只有 `04bc084` + `4d78551 First commit`），**不要指望在部署仓库里回溯历史**——历史只在源码仓库 `emberff/blog` 里。

---

*本文只描述操作与事实，不复制 `.agents/skills/hexo-theme-development/` 的内容；改主题相关代码时请直接读该技能文档。*
