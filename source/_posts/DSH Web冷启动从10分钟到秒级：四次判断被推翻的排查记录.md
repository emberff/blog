---
title: DSH Web 冷启动从10分钟到秒级：四次判断被推翻的排查记录
excerpt: 一个只在「冷启动」出现、刷新就消失的卡顿，把排查带偏了三次。从浏览器连接池、服务端 IO、到 CPU 预热，全都不是根因——真正的元凶是 Node 原生插件里一句获取 glibc 版本号用的 process.report.getReport()，在 WSL2 上同步做了反向 DNS 查询。最后所有补丁都被卸载，只留下一个环境变量。
date: 2026-11-11 13:10:00
tags: [DSH, Node.js, WSL2, 性能优化, 排查, AI辅助编写]
category: [运维, 踩坑]
---
{% note %}
`dsh web` 启动后要等十分钟才能用。奇怪的是，**刷新页面就正常了**——这个不对称后来成了最有价值的线索，但当时它只是让我更困惑。

排查过程里我被数据推翻了四次：先认定是插件轮询抢连接，再怀疑服务端 IO，然后觉得是 CPU 预热，最后才发现是 `process.report.getReport()` 在 WSL2 上把本地网卡的 PTR 查询卡到了超时。根因修好后，之前打的两个补丁**全都不需要了**，现在是一行 `NODE_OPTIONS` 解决问题。

本文记录完整的排查链路、每一次错误判断的依据，以及最后为什么敢于把补丁全部删掉。
{% endnote %}

# 一、问题：十分钟，且只在冷启动

现象很朴素：敲下 `dsh web`，终端很快打印出 URL，浏览器也能打开页面，但**所有功能都显示"加载中"**，输入框不能打字，侧栏空白，要等很久（体感十分钟级）才逐渐可用。

第一条关键信息来自对比：

| 场景 | 体感 |
|---|---|
| 重启 dsh 后**第一次**打开 | 10 分钟级 |
| 之后**刷新**页面 | 秒级 |

**刷新正常、冷启动慢。** 这个特征排除了大量可能——比如 bundle 体积、首屏渲染、接口本身慢——因为那些在刷新时同样会慢。

# 二、第一轮：HAR 把矛头指向插件轮询

## 2.1 `blocked` 字段说明了一切

抓了一份完整 HAR，按耗时排序后看到异常：

```
+0.00s  st=0  blocked=57567ms  /dsh-whale/last-turn.json
+1.01s  st=0  blocked=56655ms  /dsh-whale/wait.json
+2.03s  st=0  blocked=55598ms  /dsh-whale/last-turn.json
```

`status=0` 且 `blocked` 拉满，意思是**请求还排在浏览器队列里，根本没发出去**。

更关键的是，被阻塞的不只是这两个接口：

| 请求 | blocked |
|---|---|
| `/dsh-claude-style/assets/*.svg` | 52 134 ms |
| `/dsh-ide-git/api/summary` | 50 532 ms |
| `/api/messageFeedback/list` | 46 656 ms |
| `/api/notes/list` | 45 736 ms |

**全是 45–52 秒。** 这说明浏览器对同一 origin 的 6 个 HTTP/1.1 连接槽被占满了。

## 2.2 定位到 `dsh-whale-widget`

请求分布显示，这个插件在**每秒发 2 个请求**：

```js
setInterval(function () { pollLastTurn(); pollWaitState() }, 1000)
```

它的功能是监听「任务结束」和「等待用户交互」来播放提示音——一个低频事件，却实现成了 1 Hz 轮询。

问题不在频率本身（2 req/s 对本地服务不算多），而在**启动时机**：这行 `setInterval` 在脚本加载时立即执行，不等页面就绪，于是和首屏的关键请求同时抢连接。

## 2.3 第一次修复与它的天花板

禁用插件后，冷启动从 10 分钟降到 **1–2 分钟**。有效，但远不够。

于是打了个补丁，把调度方式改掉：

| 改动 | 目的 |
|---|---|
| 等 `window.load` 后再启动（8 秒兜底） | 避开首屏竞争 |
| `setTimeout` 链串行，上次完成才排下次 | 不堆积 |
| `document.hidden` 时跳过，回前台补一次 | 不浪费 |

补丁后 `blocked` 峰值降到 342 ms。**但冷启动依然要等 1–2 分钟。**

结论：whale 是问题之一，但不是全部。

# 三、第二轮：怀疑服务端，全部排除

既然浏览器侧已经清了，下一步查宿主是不是启动太慢。

我把能想到的重活都实测了一遍：

| 假设 | 实测 | 结论 |
|---|---|---|
| `session_projcache` 全量读盘（606 文件 / 59 MB） | **506 ms** | ❌ 排除 |
| 330 个官方包 `import` | **3.2 s** | ❌ 排除 |
| 601 个 session 文件 stat + 读首行 | **60 ms + 157 ms** | ❌ 排除 |
| 宿主响应 `GET /` | **3 ms** | ❌ 排除 |
| `api.deepseek.com/models` 延迟 | **0.1–0.17 s** | ❌ 排除 |
| `dsh-update-checker` 扫 203 个插件查 npm | 4.3 s（且页面加载后才跑） | ❌ 不是主因 |

**这些加在一起不到 5 秒，解释不了分钟级。**

我甚至怀疑过 `dsh-pocket` 的隧道自动恢复（它去连一条可能失效的 SSH 隧道），让用户卸载验证——**依然慢**。

# 四、第三轮：CPU profile 抓到了真凶

排除了所有"正常"的慢，只能用 profiler 看它到底在干什么。

```bash
node --cpu-prof --cpu-prof-dir=/tmp/dshprof \
  ~/.nvm/.../dsh/lib/bin.js web --no-open
```

采集到一份 48.97 秒的 profile：

```
profile 总时长   : 48.97 s
采样点           : 43005
第一热点         : getReport   30.08 s   (61.4 %)
第二热点         : (idle)       7.09 s
其余全部函数合计 :            11.81 s
```

**一个函数占了 61.4%。** 顺着父节点链往上追：

```
getReport                      node:internal/process/report
└ loadBinding                  node-addon-system/lib/flock.js
  └ tryLockExclusive
    └ acquire                  dsh-session-persistence-jsonl
      └ (root)
```

触发点是正常的：`dsh-session-persistence-jsonl` 在启动时获取会话锁。问题出在 `flock.js` 里这段：

```js
let filename = 'system.node';
if (platform === 'linux') {
    // Node's report types omit the libc field supplied by Linux reports.
    const report = process.report.getReport();
    filename = join(report.header.glibcVersionRuntime ? 'glibc' : 'musl', filename);
}
```

**为了读一个布尔值（当前是 glibc 还是 musl），生成了一整份诊断报告。**

## 4.1 第一次误判：以为是"遍历堆"

我当时的解释是：`getReport()` 要遍历整个堆、收集所有线程的 JS 栈，而 dsh 进程 RSS 730 MB、有 11 个线程，所以慢。

这个解释**方向就错了**，而且被自己的实验打脸：

| 受控实验 | `getReport()` |
|---|---|
| 纯净进程 | 4 ms |
| 堆占用 260 MB | 2 ms |
| 额外 500 个 fd | 2 ms |
| 2000 个活跃 timer | 8 ms |
| **4 个 worker 线程** | 47 ms |

堆再大、fd 再多，都只要毫秒级。**我根本复现不出 30 秒。**

# 五、真正的机制：同步反向 DNS

转机来自上游的一条讨论 —— [deepseek-ai/deepseek-harness#11441](https://github.com/deepseek-ai/deepseek-harness/discussions/11441)。里面另一位 WSL2 用户用 `strace` 抓到了完全不同的栈：

```
poll ← __res_context_send ← _nss_dns_gethostbyaddr_r ← getnameinfo
     ← uv_getnameinfo ← node::report::ReportEndpoint ← node::GetNodeReport
```

原来 `getReport()` 在生成报告时，会**对每个 socket 的本地/远端地址做一次同步的反向 DNS 查询**。

在 WSL2 上，查询本地局域网 IP 的 PTR 记录会卡到超时。我实测确认：

```
getent hosts 192.168.2.87   → 10.00 s     ← WSL 局域网 IP
getent hosts 127.0.0.1      →  0.00 s     ← loopback 正常
```

## 5.1 用 socket 复现

这解释了为什么我的受控实验测不出来——**纯净 Node 进程没有绑定非 loopback socket**。

加上 socket 后：

| 场景 | `getReport()` |
|---|---|
| 无 socket | **4 ms** |
| + 监听 socket 绑定 LAN IP | **10 033 ms** |
| + 再一个出站 socket 连 LAN IP | **50 051 ms** |
| `process.report.excludeNetwork = true` | **1 ms** |

**每多一个非 loopback 地址，就多约 10 秒。**

所以 30 秒 ≈ 3 个地址 × 10 秒。之前 profile 里看似"CPU 时间"的 30 秒，实际是**线程阻塞在同步网络调用上**——采样器抓到的是同一个栈帧，看起来像在算，其实在等。

> 这也纠正了我在 issue 初稿里的根因描述。写技术文档时，"profiler 显示热点"不等于"CPU 在计算"。

# 六、修复：从补丁到零侵入

## 6.1 补丁方案（能用，但要维护）

最初我改掉了 `flock.js`，用「先试 glibc、失败回退 musl」代替探测：

```js
const candidates = ['glibc', 'musl'];
let lastError;
for (const variant of candidates) {
    try { binding = require(join(bin, variant, 'system.node')); return binding; }
    catch (error) { lastError = error; }
}
```

实测从 30 080 ms 降到 **2–4 ms**。但这是改主程序包，`dsh update` 会覆盖，还得维护一套 `patches/` + `postinstall` 自动重放机制。

## 6.2 零侵入方案（最终采用）

Node 有一个官方 flag 正好治这个：

```bash
NODE_OPTIONS=--report-exclude-network
```

它让诊断报告跳过网络接口。

验证：

| 条件 | `excludeNetwork` | `getReport()` | `glibc` |
|---|---|---|---|
| 不设 flag | `false` | **10 033 ms** | 2.39 |
| 设 flag | `true` | **2 ms** | 2.39 |

**`glibcVersionRuntime` 依然是 2.39**，所以 addon 的选择逻辑完全不受影响。

落点放在启动脚本 `~/.local/bin/dsh`：

```bash
export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--report-exclude-network --max-old-space-size=2560"
```

注意这里保留了**追加**语义（`${NODE_OPTIONS:+$NODE_OPTIONS }`），因为原本就有 `--max-old-space-size=2560`——一个常见的坑是直接覆盖，把堆设置弄丢。

# 七、复原：把所有补丁都删了

根因修好后，我做了一件反直觉的事：**把 whale 的补丁也卸载了，看看会怎样。**

结果：**实测没有变慢，所有功能正常。**

## 7.1 为什么 whale 不需要修了

这时候才把因果关系理清：

**之前（flock 未修）：**

```
宿主卡在 getReport()  →  完全不响应 30–50 秒
        ↓
whale 仍在每秒发 2 个请求 → 30 秒内堆积 60 个
        ↓
浏览器 6 个连接槽被占满
        ↓
首屏 /api/* 排在它们后面 → blocked 57 秒
```

**现在（flock 已修）：**

```
宿主响应 2–3ms
        ↓
whale 每秒 2 个请求，每个 2–3ms 完成
        ↓
6 个连接槽占用率 < 0.1%
        ↓
完全没有排队
```

**`dsh-whale` 是放大器，`getReport()` 才是根因。**

修放大器只能把 57 秒降到 30 秒级；修根因能直接让放大器失效。

## 7.2 最终状态

| 项 | 状态 |
|---|---|
| `flock.js` | **原版**（未修改） |
| `dsh-whale-widget` | **原版**（补丁已卸载） |
| `patches/`、`scripts/`、`postinstall` | **已全部删除** |
| `NODE_OPTIONS=--report-exclude-network` | ✅ 唯一生效的修复 |

**净结果：零补丁运行。**

# 八、复盘：四次判断，三次错

| 轮次 | 判断 | 结果 |
|---|---|---|
| 1 | 插件轮询抢连接 | ✅ 部分对（是放大器，不是根因） |
| 2 | 服务端 IO / 启动太重 | ❌ 全错（实测 < 5 秒） |
| 3 | CPU 遍历堆和线程栈 | ❌ 方向错（是网络阻塞，不是计算） |
| 4 | 同步反向 DNS | ✅ 根因 |

几条值得记下来的经验：

**1. "刷新正常、冷启动慢"是最强的分诊信号**

这一条直接排除了 bundle、渲染、接口本身慢的所有可能。如果一开始就重视它，能省掉第二轮整轮排查。

**2. `blocked` 字段能区分"没发出去"和"发了没回"**

`status=0` + `blocked` 拉满 = 浏览器队列堵塞；`wait` 大 = 服务端处理慢。这两个方向完全不同，HAR 里能直接分开。

**3. profiler 的热点不等于 CPU 在算**

`getReport` 占 61.4%，我一度以为在遍历堆。实际是同步网络调用阻塞，采样器只是反复抓到同一个栈帧。**看到热点应该先问「它在等什么」，而不是「它在算什么」。**

**4. 修之前先找有没有官方开关**

改源码 + 维护补丁体系是个不小的负担。这次如果先查 Node 的 `--report-*` 系列 flag，可以直接跳过整个补丁阶段。

**5. 补丁的"有效性"可能是假象**

whale 补丁确实把 `blocked` 从 57 秒降到 342 ms，看起来非常成功。但那只是因为**它在同一个 HAR 里恰好赶上了宿主恢复的窗口**。真正修掉根因后，补丁就不再必要了。

---

## 附：上游情况

这个问题上游已有报告，**不需要再提 issue**：

- [#11441 \[Bug\] 20–90 s blackout after the first Web UI load: sync process.report.getReport() in the flock libc probe](https://github.com/deepseek-ai/deepseek-harness/discussions/11441)
- 更早的 [#6441](https://github.com/deepseek-ai/deepseek-harness/discussions/6441) 与 [#10682](https://github.com/deepseek-ai/deepseek-harness/discussions/10682)

**本文的最终修复正是参照 #11441 的「Suggested fix」完成的。** 那篇给了三个方案：

| 方案 | 做法 | 取舍 |
|---|---|---|
| 1 | 用 `existsSync` 检查 musl 的 loader 路径，替代 `getReport()` | 改动最小，但路径与架构绑定 |
| 2 | 先试 `glibc`、失败回退 `musl`，完全跳过探测 | 最可移植 |
| 3 | 保留 `getReport()`，但设 `process.report.excludeNetwork = true` | 兼容性最好 |

我一开始选的是**方案 2**（直接改 `flock.js`），效果等价，但要维护一套补丁重放机制；最终换成**方案 3 的运行时形式** —— Node 官方 flag `--report-exclude-network`，通过 `NODE_OPTIONS` 传入，零侵入。

截至本文写作时，`@deepseek-ai/node-addon-system` 仍是 `0.1.2`，上游尚未在包里落地修复。在那之前，`NODE_OPTIONS=--report-exclude-network` 是最省心的处理方式。
