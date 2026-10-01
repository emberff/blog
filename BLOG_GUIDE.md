# 江上清风 · 博客操作手册

> **这是入口，不是全文。** 只放每次都要用的东西：环境、版本、索引、铁律。
> 具体操作与历史踩坑按第 0 节的地图**按需**读 `docs/` 三册——写文章时不必读排障史，排障时不必读部署记录。

## 0. 我要做什么 → 读哪一份

| 我要做的事 | 读哪里 | 规模 |
| --- | --- | --- |
| 写一篇新文章、预览、发布上线 | [`docs/写作与发布.md`](docs/写作与发布.md) | 约 310 行 |
| 遇到一个报错，想知道以前是否踩过 | 先看本页下面的「症状速查」；需要原因分析再进 [`docs/踩坑库.md`](docs/踩坑库.md) | 约 335 行 |
| 改仓库本身：项目结构 / 性能 / 配置 / 版本 | [`docs/维护与优化.md`](docs/维护与优化.md) | 约 235 行 |
| 忘了某条命令 / 版本号 / 目录在哪 | 本页第 1 节 | — |
| **改了仓库，要不要记点什么** | 本页「改动必须回写手册」 | — |

**章节编号沿用原手册**（`1`–`6`），只是分布到了四个文件里，所以仓库里任何「见第 3.15 条」「§6.6」的引用**仍然直接有效**：

| 原章节 | 现在在哪 |
| --- | --- |
| §1 环境与目录总览 | 本页 |
| §2 博客编写流程 | [`docs/写作与发布.md`](docs/写作与发布.md) |
| §3 历史踩坑（3.0–3.19） | [`docs/踩坑库.md`](docs/踩坑库.md) |
| §4 写作规范 | [`docs/写作与发布.md`](docs/写作与发布.md) |
| §5 常见问题速查 | 症状表在本页，命令块在 [`docs/写作与发布.md`](docs/写作与发布.md) |
| §6 待完善与建议 | [`docs/维护与优化.md`](docs/维护与优化.md)（6.8 在本页） |

---

## 1. 环境与目录总览

### 1.1 工作副本：动手前先拉取

`git@github.com:emberff/blog.git` 是**唯一真相源**。本机可能同时存在多份克隆，它们**没有主副之分**——哪一份都能用，只要动手前拉取最新：

```bash
cd <你正在用的那份副本>
git pull --ff-only origin main     # 落后就先追平，避免基于旧版本改动
git log -1 --oneline               # 确认与 origin/main 是同一个 sha
```

| 副本 | 路径 | 文件系统 | 说明 |
| --- | --- | --- | --- |
| WSL 侧 | `/home/emberff/blog` | 原生 ext4 | 已 `npm ci`（613 个包），`hexo g` / `hexo s` 均正常 |
| Windows 侧 | `C:\Users\15222\blog` | NTFS（WSL 里是 `/mnt/c/Users/15222/blog`） | 在 Windows 原生环境里操作正常（实测 `hexo generate` 通过；产出文件数随文章数变化，不写死，见 6.8） |

> **从 WSL 操作 `/mnt/c` 的限制是 9p 文件系统造成的，不是"这一侧不能改"**：在那里 `hexo g` 报 `EACCES`（第 3.1 条）、`hexo s` 会卡成 `Dsl`（第 3.8 条）；换 Windows 原生侧（PowerShell / cmd / IDE）或 WSL 原生目录都不受影响。
>
> **`node_modules` 不随 `git pull` 更新**（它被 git 忽略）：`package.json` 变动后要重跑 `npm install`，否则构建产物会不完整——例如缺 `hexo-all-minifier` 时首页压缩失效（`public/index.html` 36913 B vs 25877 B）。
>
> **Windows 侧 `git pull` 报 `couldn't create signal pipe`**：那是 DSH 受限沙箱禁止命名管道、MSYS 的 `ssh.exe` 起不来，与仓库无关——改用 HTTPS 拉取即可（第 3.19 条）。

### 1.2 版本与身份（**已核实，不必再查**）

| 组件 | 版本 |
| --- | --- |
| Hexo | **8.1.2** |
| hexo-theme-fluid | **1.9.9** |
| hexo-renderer-marked | **7.0.1** |
| hexo-all-minifier | **0.5.7** |
| Node / npm | **v24.19.0**（nvm 管理）/ **11.17.0** —— WSL 侧实测；Windows 侧为 v22.20.0 / npm 10.9.3，同样能跑 hexo 8.1.2 |
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

- 源码仓库：`git@github.com:emberff/blog.git`，分支 `main`，当前最新提交 **`122496b`**（`docs: 记录 2026-09-29 部署`）。
- 部署目标：`git@github.com:emberff/emberff.github.io.git`，分支 `main`（GitHub Pages source = `main` + `/`）。
- 站点线上地址：`https://emberff.github.io`。

### 1.3 目录结构速览

```
/home/emberff/blog
├── AGENTS.md                # ⚠️ agent 规则：改动必须回写手册（harness 自动注入上下文，见本页末节）
├── BLOG_GUIDE.md            # 本手册（入口，只放高频内容与索引）
├── docs/                    # 手册分册：写作与发布.md / 踩坑库.md / 维护与优化.md
├── _config.yml              # 站点主配置：url、theme: fluid、deploy: git、hexo-all-minifier
├── _config.fluid.yml        # 主题配置（约 1200 行）：navbar.menu、links.items、banner、footer.beian、custom_js
├── _config.landscape.yml    # 备用主题配置（空，未启用）
├── package.json             # 锁定 hexo 8.1.2；scripts: build / clean / deploy / publish / server
├── source/
│   ├── _posts/              # 20 篇文章（.md）
│   ├── links/index.md       # 友链页（layout: links）
│   ├── about/index.md       # 关于页（layout: about）
│   ├── img/                 # 站点图片只有 default.webp（内页 banner）；
│   │                        #   avatar.png / fluid.png / loading.gif / police_beian.png
│   │                        #   来自主题自带的 source/img/，构建时合并进 public/img/
│   ├── background/          # 仅剩 Spiraling Cityscape.jpg 与 arch.jpg（均未被本地引用，见 6.7）
│   ├── css/  js/  html/     # loader.js / deferred.js / loader.css / loader.html / sakana.html
│   └── README.md            # skip_render，不作为页面渲染
├── scripts/injects.js       # theme_inject：注入 source/html/loader.html 与 sakana.html
├── scaffolds/               # new 命令的模板：post.md / page.md / draft.md
├── themes/                  # 只有 .gitkeep——主题走 npm 装到 node_modules/hexo-theme-fluid
└── .agents/skills/hexo-theme-development/   # 主题开发规范技能文档（改主题前先读它）
```

**改主题模板/变量/helper 时，先读技能文档** `.agents/skills/hexo-theme-development/SKILL.md`（含 `reference/` 七篇：api / basics / helpers / i18n / templates / testing / variables，与 `examples/` 两篇）。本文不转载其内容，避免两处维护。

### 1.4 部署链路

```
[本地工作副本]
        │  git add → git commit → git push origin main
        ▼
[源码仓库 emberff/blog (main)]  ← 版本管理 + 备份（public 仓库！见 4.5 红线）
        │  npx hexo clean && npx hexo generate   → public/（文件数随文章数变化，见 6.8）
        │  npx hexo deploy                        （hexo-deployer-git）
        ▼
[.deploy_git 临时仓库]  ──push──▶  [emberff/emberff.github.io (main)]
                                            │  GitHub Pages 构建（几十秒）
                                            ▼
                                 https://emberff.github.io
```

要点：`.deploy_git` 是 deployer 自己维护的**独立临时仓库**，本地分支是 `master`，跟踪远程 `main`；它**不继承博客仓库的本地 git 配置**，所以全局 `user.name/user.email` 是硬前置，否则静默不推送（第 3.2 条）。

---

## 症状速查（报错 → 一句话 → 详见）

一句话能解决的直接用；需要原因与排查过程，去 [`docs/踩坑库.md`](docs/踩坑库.md) 找对应条目。

| 症状 | 一句话解决 | 详见 |
| --- | --- | --- |
| `EACCES: permission denied, open '.../public/...'` | 你在 WSL 里对 `/mnt/c` 构建（9p 限制）。换 WSL 原生目录，或在 Windows 原生侧构建 | [3.1](docs/踩坑库.md) |
| `hexo d` 打印 `Deploy done` 但线上没变 | 检查 `git config --global user.name/user.email` 是否为空 | [3.2](docs/踩坑库.md) |
| `Author identity unknown` / `empty ident name` | 同上：设全局 git 身份 | [3.2](docs/踩坑库.md) |
| `ssh_askpass: ... No such file or directory` / `Host key verification failed.` | `~/.ssh` 不存在或权限不对：复制密钥 + `chmod 600` | [3.3](docs/踩坑库.md) |
| `node: command not found`（而 `which npm` 指向 `/mnt/c/...`） | WSL 没装 Node：`nvm install --lts` | [3.4](docs/踩坑库.md) |
| note 块里的代码/列表糊成一行 | 把代码块和列表移出 `{% note %}` | [3.5](docs/踩坑库.md) |
| 表格渲染崩坏 / 断裂 | 单元格里的三反引号改双反引号 | [3.6](docs/踩坑库.md) |
| mermaid 图报编译错误 | 节点标签加双引号 | [3.7](docs/踩坑库.md) |
| `hexo s` 打印了地址但访问是 000、进程 `Dsl`、`pkill` 挂住 | 在 WSL 里对 `/mnt/c` 跑 server 会卡死（9p 文件 watch）。换 WSL 原生目录或 Windows 原生侧都行；已卡死就 `fuser -k <port>/tcp` | [3.8](docs/踩坑库.md) |
| PDF 读出来是 `⾃`/`⽤` 这种怪字 | 提取后 `unicodedata.normalize("NFKC", t)` | [3.9](docs/踩坑库.md) |
| `import fitz` 失败 | 用 `pdfminer.high_level.extract_text` | [3.9](docs/踩坑库.md) |
| 文章字数从 2.5k 变 7.2k、阅读时间翻倍 | fluid 1.9.9 的口径变化，不是 bug，别修 | [3.10](docs/踩坑库.md) |
| `git push` 无输出、远程 sha 没变 | `GIT_SSH_COMMAND="ssh -o ConnectTimeout=15 -o ServerAliveInterval=10" git push -v origin main` | [3.11](docs/踩坑库.md) |
| `git status` 里 `.idea/*` 老显示 modified | 行尾噪声：`git checkout -- .idea` | [3.12](docs/踩坑库.md) |
| `EADDRINUSE`（4001 等端口） | 换端口：`npm run server -- -p 4011` | [3.13](docs/踩坑库.md) |
| `npm warn allow-scripts ...` | 无害，忽略 | [3.14](docs/踩坑库.md) |
| 首页变慢 / 又出现外网 CDN | 你改坏了 loader/deferred/sakana，回看该条 | [3.15](docs/踩坑库.md) |
| 国内访问 TTFB 抖动大 | Pages 平台限制，配置层无解 | [3.16](docs/踩坑库.md) |
| `db.json` 体积无故增长 | 无害，它在 `.gitignore` 里；怀疑缓存坏了就 `npm run clean` | [3.17](docs/踩坑库.md) |
| 从 Windows 侧跑 `wsl.exe` 时 `node: command not found` | 非交互 shell 不读 `.bashrc`，先 `source ~/.nvm/nvm.sh` | [3.18](docs/踩坑库.md) |
| `git pull` 报 `couldn't create signal pipe` | origin 走 SSH，受限沙箱禁止命名管道。改用 HTTPS 拉取 | [3.19](docs/踩坑库.md) |

---

## 改动必须回写手册（**强制**，与 `AGENTS.md` 同步）

**凡是对本仓库做出「项目结构变更、性能优化、版本升级、配置/脚本改动」的，必须在同一次工作中把「做了什么、为什么、有没有做完、怎么自查」写进手册，不能只在对话里说明。**

因为这类知识只存在于会话里就会随会话丢失——下一次（可能换一个 agent、换一台机器）遇到同一个坑要从零再踩一遍。手册是这些知识的唯一落点，所以它不是可选项。

### 什么改动算「需要回写」

| 改动类型 | 典型例子 | 回写到 |
|---|---|---|
| 项目结构变更 | 新增/删除 `source/` 下的目录或静态资源、增删 `scripts/`、改 `.gitignore`、加 hook | [`docs/踩坑库.md`](docs/踩坑库.md) 新增或补充条目 + 本页 §1.3 目录结构 |
| 性能优化 | 改 loader/deferred、换 CDN、压图、开压缩插件 | [`docs/踩坑库.md`](docs/踩坑库.md) 3.15（或新条）+ [`docs/维护与优化.md`](docs/维护与优化.md) 遗留项 |
| 版本升级 | hexo / fluid / marked / 任一依赖升降级 | 本页 §1.2 版本表 + [`docs/踩坑库.md`](docs/踩坑库.md)（影响面，如 3.10 字数口径） |
| 配置改动 | `_config.yml`、`_config.fluid.yml`、`package.json` scripts | [`docs/写作与发布.md`](docs/写作与发布.md) 对应章节 + 本页症状速查 |
| 流程改动 | 部署方式、审批方式、命令变化 | [`docs/写作与发布.md`](docs/写作与发布.md) §2 流程 |

### 回写要求（每条都要有）

1. **做了什么**：具体文件路径 + 关键命令/配置片段。
2. **为什么**：一句话理由（避免以后被"优化"回去）。
3. **完成状态**：明确写「已完成」「部分完成（缺什么）」「未做」；结论要可验证。
4. **怎么自查**：一条能跑的验证命令或明确的判断标准（例如 `grep` 应为空、文件数应为 N、HTTP 应为 200）。
5. **状态标记**：沿用手册的三档 —— `✅ 已永久解决` / `⚠️ 环境相关会重现` / `📝 写作规范类`。

### 完成前自检

- [ ] 手册已更新（或本次改动确实属于"不改手册"的范畴：**只写/改一篇文章**：正文、front matter、标签）
- [ ] 手册里的**版本号 / 文件数 / 命令**与实际一致
      （**文件数不是固定值**：`106` 是 2026-09-27 清图后的基线，每新增一篇文章会连带多出文章页 + 标签页、新增一个标签多 1 个标签页 —— 2026-09-29 为 `111`，2026-10-02 补 `AI辅助编写` 标签后为 `112`。判断标准是"变化可解释"，不是"必须等于 106"）
- [ ] 新增结论都附了可执行的**自查方法**
- [ ] 若改动影响构建：`npx hexo clean && npx hexo generate` 通过且文件数变化可解释
- [ ] 但如果写作过程中**发现手册里没记过的新坑或新规范**，那就补进去
- [ ] 若改动了手册本身：本页与 `docs/` 三册之间的相互链接仍然有效（`grep -o "docs/[^)]*\.md" BLOG_GUIDE.md | sort -u` 逐个确认存在）

> 本仓库根目录有 **AGENTS.md**，DSH 会自动把它注入 agent 上下文（AGENTS.md/CLAUDE.md 从项目根 .git 标记向下逐级加载），所以「改动要回写手册」这条要求是机器可见的，不依赖某个人记得。
>
> 为什么用 `AGENTS.md` 而不是只写在手册里：手册要人（或 agent）主动去读，而 `AGENTS.md` 由 harness 在每次会话开始时自动注入上下文，是唯一"不靠自觉"的落点。两者分工——`AGENTS.md` 负责**让规则被看见**，本手册负责**记录知识本身**。改规则时两处都要同步。

---

*本文只描述操作与事实，不复制 `.agents/skills/hexo-theme-development/` 的内容；改主题相关代码时请直接读该技能文档。*
