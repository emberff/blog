hexo.extend.filter.register('theme_inject', function(injects) {

  // 页面加载动画  
  injects.bodyBegin.file('loader', 'source/html/loader.html');

  injects.head.file('aplayer', 'source/_inject/Aplayer.ejs');

  // 看板娘
  injects.footer.file('sakana', 'source/html/sakana.html');

  });

  // 樱花飘落
  hexo.extend.injector.register('body_end', '<script type="text/javascript" src="/js/sakura.js"></script>', 'home');

  

// hexo.extend.injector.register("body_begin", `<div id="web_bg"></div>`);
// hexo.extend.injector.register("body_end",`<script src="/js/background.js"></script>`);