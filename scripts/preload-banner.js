/**
 * 首页 banner 图 preload（2026-10-02）
 *
 * 背景：首页 banner 是 `#banner` 的 inline style 背景图（见 _config.fluid.yml:541），
 * 浏览器把它当低优先级资源，实测要等到 0.72s（链路顺畅）/ 1.84s（抖动）才发起请求，
 * 而 HTML 在 0.51s / 0.81s 就已经拿到了 —— 白等 0.2~1.0 秒。
 * 加上 <link rel="preload" as="image"> 后，浏览器一解析到 head 就开始下载它。
 *
 * 只注入首页（data.path === 'index.html'）：文章页/列表页的 banner 是另外的图
 * （post.banner_img / default.webp），给它们注入首页这张会白下 242 KB。
 *
 * 跨域注意：banner 在腾讯 COS 上，是跨域资源。**不要加 crossorigin**——
 * 加了会走 CORS 模式，而 COS 没返回对应响应头时浏览器会下载两次。
 * 纯 <img>/背景图用途的 preload 不需要 CORS。
 *
 * 优先级 6：排在 defer-scripts.js（5）之后、hexo-all-minifier（10）之前，
 * 此时 HTML 尚未压缩。
 *
 * ⚠️ 注入位置必须在 <head> 最前面（紧跟 <meta charset>），**不能挂在 </head> 前**：
 * head 里的 utils.js / color-schema.js 是同步脚本，会阻塞 HTML 解析，
 * 挂在它们后面等于要等 0.6~1.8s 才被发现——那就完全失去了 preload 的意义。
 * （实测印证：banner 原本发起于 0.72s，恰好是 color-schema.js 执行完的时刻。）
 */

hexo.extend.filter.register('after_render:html', function (html, data) {
  if (!data || data.path !== 'index.html') return html;

  var indexConf = (hexo.theme.config || {}).index || {};
  var img = indexConf.banner_img;
  if (!img) return html;

  var tag = '<link rel="preload" as="image" href="' + img + '">';

  // 插到 <meta charset> 之后：最早能被发现，又不破坏 charset 必须靠前的约定
  var charset = html.match(/<meta charset="[^"]*">/i);
  var pos;
  if (charset) {
    pos = html.indexOf(charset[0]) + charset[0].length;
  } else {
    var headOpen = html.indexOf('<head>');
    if (headOpen === -1) return html;
    pos = headOpen + '<head>'.length;
  }

  return html.slice(0, pos) + tag + html.slice(pos);
}, 6);
