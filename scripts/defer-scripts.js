/**
 * 让 body 里的外链脚本并行下载（2026-10-02）
 *
 * 背景：fluid 主题把 11 个 <script src> 裸放在 body 末尾（无 defer/async），
 * 浏览器只能「下载一个 → 执行一个 → 再请求下一个」，实测这条串行链占 0.5s
 * （见 docs/维护与优化.md 6.13）。加 defer 后 11 个脚本并行下载，
 * 仍按文档顺序在 DOMContentLoaded 之前执行完，依赖链不受影响。
 *
 * 配套处理两个内联脚本：它们夹在外链脚本中间且依赖前者
 * （NProgress.configure 依赖 nprogress.min.js；Fluid.plugins.typing 依赖
 * plugins.js + typed.js）。内联脚本不受 defer 影响、解析到就立即执行，
 * 不推迟就会在依赖之前跑而报 undefined，所以一并包进 DOMContentLoaded。
 * 规范保证 defer 脚本先于 DOMContentLoaded 回调执行，顺序依然正确。
 *
 * 不动的部分：
 * - head 里的 utils.js / color-schema.js 保持同步 —— color-schema.js 必须在
 *   首次绘制前定好配色，defer 会闪白屏（收益也只有 0.17s）。
 * - sakana 那段内联脚本自身用 window.load + readyState 判断，无需处理。
 *
 * 优先级 5 < hexo-all-minifier 的默认 10，所以本过滤器先跑、拿到未压缩的
 * HTML，压缩器再压最终结果。
 */

const DEPENDENT_INLINE = /NProgress\.configure|Fluid\.plugins\.typing/;

hexo.extend.filter.register('after_render:html', function (html) {
  const split = html.indexOf('</head>');
  if (split === -1) return html;

  const head = html.slice(0, split);
  let body = html.slice(split);

  // 1) 外链脚本加 defer（已有 defer/async 的跳过，避免重复）
  body = body.replace(/<script\s+src="([^"]+)"([^>]*?)\s*>\s*<\/script>/g,
    function (whole, src, rest) {
      if (/\b(?:defer|async)\b/.test(rest)) return whole;
      return '<script defer src="' + src + '"' + rest + '></script>';
    });

  // 2) 依赖上面脚本的内联脚本推迟到 DOMContentLoaded
  body = body.replace(/<script>([\s\S]*?)<\/script>/g, function (whole, code) {
    if (!DEPENDENT_INLINE.test(code)) return whole;
    return "<script>document.addEventListener('DOMContentLoaded',function(){" +
      code + "});</script>";
  });

  return head + body;
}, 5);
