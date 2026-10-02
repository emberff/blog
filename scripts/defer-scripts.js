/**
 * 让外链脚本并行下载（2026-10-02 初版；同日两次扩展：加入 head 两脚本、内联脚本改为兜底推迟）
 *
 * 背景：fluid 主题把 11 个 <script src> 裸放在 body 末尾（无 defer/async），
 * 浏览器只能「下载一个 → 执行一个 → 再请求下一个」，实测这条串行链占 0.54s；
 * head 里的 utils.js / color-schema.js 同样是同步脚本，串行阻塞 HTML 解析
 * （实测顺畅 0.11s、链路抖动 0.67s）。两处合计约 0.6s 的串行成本
 * （见 docs/维护与优化.md 6.13 / 6.15）。加 defer 后它们并行下载，
 * 仍按文档顺序在 DOMContentLoaded 之前执行完，依赖链不受影响。
 *
 * ⚠️ 内联脚本必须**全部**推迟，这是踩过坑的地方：
 * body 里的内联脚本普遍是「初始化调用」，且普遍依赖 utils.js / plugins.js ——
 *   文章页实测有 7 个：Fluid.utils.createScript 加载 mermaid / tocbot / anchor-js / fancybox、
 *   Fluid.plugins.codeWidget / imageCaption / typing、NProgress.configure。
 * 这些外链脚本一旦 defer，内联脚本若仍立即执行就会报 undefined。
 * 后果不是"少个特效"：tocbot 那个 createScript 一报错，**文章页的 TOC 直接不生成**。
 * 首页没有这些内联脚本，所以只测首页发现不了 —— 每次改这里都必须**首页 + 文章页**都验。
 * 兜底做法：body 内所有内联脚本一律包进 DOMContentLoaded（已含该字样的跳过，保证幂等）；
 * **要连带属性的标签一起匹配**（`<script type="text/javascript">` 是实测漏网的一个）；
 * head 里的 `<script id="fluid-configs">` 不在处理范围内、也必须保持同步。
 * 规范保证 defer 脚本先于 DOMContentLoaded 回调执行，顺序依然正确。
 * sakana 那段也在其中：它自身判断 readyState 并监听 window.load，包一层无副作用。
 *
 * head 里只动 utils.js / color-schema.js：
 * 安全性来自 _config.fluid.yml 的 `custom_head` —— 那段 3 行内联脚本在 CSS 之前
 * 就把用户手动选择的配色写到了 <html> 上，所以 color-schema.js 不必再靠同步执行防闪白。
 * 两者都 defer 后仍按文档顺序执行，color-schema.js 依然能拿到 Fluid.utils；
 * 而且它执行时 DOM 已解析完（#color-toggle-icon / #highlight-css 都在），
 * 比原来同步执行时元素尚未解析、只能靠 waitElementLoaded 轮询更可靠。
 * head 里其余 script（`<script id="fluid-configs">` 是内联配置）不碰。
 *
 * 优先级 5，早于 preload-banner(6) / preconnect(7) / hexo-all-minifier(默认 10)，
 * 所以本过滤器最先跑、拿到的是未压缩的 HTML。
 */

const HEAD_DEFER = /\/js\/(?:utils|color-schema)\.js(?:\?|$)/;
const SCRIPT_TAG = /<script\s+src="([^"]+)"([^>]*?)\s*>\s*<\/script>/g;

function addDefer(html, want) {
  return html.replace(SCRIPT_TAG, function (whole, src, rest) {
    if (want && !want.test(src)) return whole;
    if (/\b(?:defer|async)\b/.test(rest)) return whole;
    return '<script defer src="' + src + '"' + rest + '></script>';
  });
}

hexo.extend.filter.register('after_render:html', function (html) {
  const split = html.indexOf('</head>');
  if (split === -1) return html;

  // head：只给 utils.js / color-schema.js 加 defer
  const head = addDefer(html.slice(0, split), HEAD_DEFER);

  // body：所有外链脚本都加
  let body = addDefer(html.slice(split));

  // body：所有内联脚本一律推迟到 DOMContentLoaded（见文件头注释里的原因）
  // 注意要连**带属性的**内联标签一起匹配：实测漏掉 `<script type="text/javascript">`
  // 会让文章页的 Fluid.utils.loadComments 报 undefined。带 src 的外链标签不动。
  body = body.replace(/<script([^>]*)>([\s\S]*?)<\/script>/g, function (whole, attrs, code) {
    if (/\bsrc\s*=/.test(attrs)) return whole;
    if (/DOMContentLoaded/.test(code)) return whole;
    return '<script' + attrs + ">document.addEventListener('DOMContentLoaded',function(){" +
      code + "});</script>";
  });

  return head + body;
}, 5);
