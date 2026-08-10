---
title: opencode会话"丢失"的恢复与本地存储机制
excerpt: 断网+重启后会话消失?其实它一直安安静静躺在本地SQLite里
date: 2026-08-10 13:20:36
tags: [opencode, SQLite, 会话恢复, AI]
category: [工具, 踩坑]
---
{% note %}
昨天跟 opencode 进行了一场长达 6 个小时的对话（种子下载相关），最后一轮因为**网卡故障断网**卡住了，于是我直接关闭 opencode、关机重启。再次打开后那个会话**从列表里消失了**——当时心里一凉，以为 842 条消息全没了。最终排查发现：**会话根本没有丢，它一直安安静静躺在本地 SQLite 数据库里。** 本文按"起因 → 原因 → 解决方法"复盘整个过程。
{% endnote %}

# 起因

1. 昨天使用 opencode 进行一场长对话，主题是"种子下载是否依赖迅雷、能否自编应用"，会话前后持续约 **6.5 小时、共 842 条消息**（使用 deepseek-v4-flash）。
2. 对话进行到最后一轮时，**网卡故障导致突然无法联网**，模型在 tool-call 循环中卡住，最后一条 assistant 消息迟迟无法完成。
3. 以为只是网络问题，直接**关闭了 opencode，然后关机重启设备**。
4. 重启后再次打开 opencode，那个会话**从会话列表中消失了**。

{% note info %}
这里有个容易忽视的点：**断网本身不丢数据**，真正让人误判的是"关闭程序 + 重启"之后列表里找不到它了。
{% endnote %}

# 原因

## opencode 的本地存储机制

opencode 的会话**全部存储在本地 SQLite 数据库中**，默认路径：

```
~/.local/share/opencode/opencode.db
```

数据库采用 **WAL 模式**，核心表结构如下：

| 表 | 作用 |
| --- | --- |
| `session` | 会话元数据（标题、目录、模型、token、时间戳等） |
| `message` | 每条消息一条记录 |
| `part` | 消息的具体内容（文本、工具调用结果等），挂在 `message_id` 下 |
| `todo` | 会话内的任务清单 |
| `session_input` / `session_message` | 输入与事件序列（当前版本未实际写入） |

```sql
CREATE TABLE `message` (
  `id` text PRIMARY KEY,
  `session_id` text NOT NULL,
  `time_created` integer NOT NULL,
  `time_updated` integer NOT NULL,
  `data` text NOT NULL
);
```

关键点在于：**消息是"边聊边写"的**——assistant 消息在发起时就创建记录，内容以 part 的形式随流式输出逐步写入。因此：

- 即使某一轮因断网中止，**之前所有轮次早已落盘**；
- 被中止的那一轮，只会留下一条**空的 assistant 消息**（`MessageAbortedError / Aborted`），其余数据完好无损。

本例中断的会话 `ses_01a51c6a6ffeEGmEqyDdwr7O4n`：**842 条消息、3113 个 part，`PRAGMA integrity_check` 结果为 `ok`**，只有最后一轮 assistant 消息无 parts 无 finish。

## 为什么看起来"消失"了

会话数据一直都在，**"消失"只是界面层面的错觉**：

1. opencode TUI 的会话列表是**按项目（工作目录）过滤**的；
2. 如果在**不同的目录**下启动 opencode，就看不到属于其他目录的会话；
3. 断网时最后一轮没有正常完成，也容易让人误以为"整个会话坏了"。

{% note warning %}
排查顺序很重要：**先怀疑"列表过滤"，不要急着怀疑"数据被删"。** 数据库自检 `integrity_check = ok` 就能排除损坏。
{% endnote %}

# 解决方法

## 1. 定位会话 ID

系统里可能没有 `sqlite3` 命令，可以用 Node 内置的 `node:sqlite` 模块查询（Node 22+）：

```js
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync(process.env.HOME + "/.local/share/opencode/opencode.db", { readOnly: true });

// 按更新时间列出最近会话
db.prepare(
  "SELECT id, title, time_updated, directory FROM session ORDER BY time_updated DESC"
).all().forEach(r => console.log(new Date(r.time_updated).toLocaleString(), r.id, r.title));

// 统计每个会话的消息数，定位"有大量消息"的那个
db.prepare(
  `SELECT s.id, COUNT(m.id) n FROM session s
   LEFT JOIN message m ON m.session_id = s.id
   GROUP BY s.id ORDER BY s.time_updated DESC`
).all().forEach(r => console.log(r.n, r.id));

// 查看会话第一条消息，确认是不是目标会话
db.prepare(
  "SELECT data FROM part WHERE session_id = ? ORDER BY time_created LIMIT 1"
).get(sessionId);
```

## 2. 恢复/重新打开会话

确认 ID 后即可直接恢复：

```bash
# 在会话所属的工作目录下，指定会话 ID 继续
opencode -s ses_01a51c6a6ffeEGmEqyDdwr7O4n

# 或直接续接最近一次会话
opencode --continue
```

也可以先在 TUI 里按 `L` 打开会话列表，**确认当前所在目录与目标会话的工作目录一致**，一般就能看到它。

## 3. 备份与迁移

```bash
# 导出为 JSON
opencode export ses_01a51c6a6ffeEGmEqyDdwr7O4n

# 从 JSON 导入
opencode import <file>
```

# 总结

| 阶段 | 要点 |
| --- | --- |
| 起因 | 断网导致最后一轮中止，随后关闭程序并重启 |
| 原因 | 会话本地存储在 SQLite（WAL）中，按消息实时落盘；列表按工作目录过滤导致"看起来消失" |
| 解决 | 查询 DB 定位 ID → `opencode -s <id>` / `--continue` 恢复；`export`/`import` 备份迁移 |

**经验教训：**

1. opencode 会话数据默认全量本地保存，断网、强杀、重启都不会丢失已完成轮次；
2. 遇到"会话消失"，先检查**是否在不同目录启动**，再用 `integrity_check` 排除数据损坏；
3. 重要的长对话，养成 `opencode export` 的习惯；
4. 最后一轮若因网络中断，恢复后模型无感知（最后一条 assistant 消息为空），直接补一句让它继续即可。
