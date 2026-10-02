/**
 * 预连接首屏用到的 3 个第三方域名（2026-10-02）
 *
 * 背景：首屏要跨 4 个域名（GitHub Pages、baomitu、alicdn、腾讯 COS），
 * 每个新域名都要付一次 DNS + TCP + TLS。实测这块在链路抖动时是主要成本之一
 * （见 docs/踩坑库.md 3.16：TLS 握手 0.05 → 1.72s）。
 * preconnect 让浏览器在解析到该标签时就提前把连接建好，等真正要请求资源时直接复用。
 *
 * 只列首屏真正会用的域名：
 * - lib.baomitu.com   ：bootstrap.min.css + jquery/bootstrap.js/typed/nprogress（6 个请求）
 * - at.alicdn.com     ：2 个 iconfont CSS + woff2 字体
 * - 腾讯 COS          ：首页 banner（已另有 preload，preconnect 让它连得更早）
 *
 * 刻意不加的：
 * - registry.npmmirror.com（sakana-widget）—— 它在 window.load 之后才加载，不占首屏
 * - icp.gov.moe / open-kounter —— 前者只是页脚链接（非资源），后者 web_analytics 未启用
 * - 域名不宜过多：每个 preconnect 都要占用连接与 CPU，3 个是合理量级
 *
 * 全站注入：所有页面都会用到 baomitu 与 alicdn（主题的 CSS/JS 来自它们），
 * COS 域名则在首页与文章页都会用到。
 *
 * ⚠️ 不要加 `crossorigin`：这三个域名上的资源都是经典 `<script>` / `<link rel=stylesheet>` /
 * CSS 背景图，走的是 no-cors 模式；`crossorigin` 属性会把预连接标成 CORS 模式，
 * 与实际请求的凭据模式不匹配，可能白建一条连接（那个属性是给字体、fetch 这类
 * 需要 CORS 的资源用的）。2026-10-02 第一版就误加了，已去掉。
 */

var ORIGINS = [
  'https://lib.baomitu.com',
  'https://at.alicdn.com',
  'https://blog-1318796820.cos.ap-shanghai.myqcloud.com'
];

hexo.extend.filter.register('after_render:html', function (html, data) {
  if (!data || !/\.html$/.test(data.path || '')) return html;

  var tags = ORIGINS.map(function (o) {
    return '<link rel="preconnect" href="' + o + '">';
  }).join('');

  // 与 preload-banner.js 同样放在 <meta charset> 之后：最早被发现，又不破坏 charset 靠前的约定
  var charset = html.match(/<meta charset="[^"]*">/i);
  var pos;
  if (charset) {
    pos = html.indexOf(charset[0]) + charset[0].length;
  } else {
    var headOpen = html.indexOf('<head>');
    if (headOpen === -1) return html;
    pos = headOpen + '<head>'.length;
  }

  return html.slice(0, pos) + tags + html.slice(pos);
}, 7);
