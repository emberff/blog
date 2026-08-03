hexo.extend.filter.register('theme_inject', function(injects) {

  // 页面加载动画  
  injects.bodyBegin.file('loader', 'source/html/loader.html');

  // 看板娘
  injects.footer.file('sakana', 'source/html/sakana.html');

  });

// hexo.extend.injector.register("body_begin", `<div id="web_bg"></div>`);
// hexo.extend.injector.register("body_end",`<script src="/js/background.js"></script>`);