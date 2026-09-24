// 首屏加载完成后再注入装饰性脚本，避免阻塞首屏渲染
(function () {
    var scripts = [
        '/js/anime.js',
        '/js/fireworks.js',
        '/js/fishes.js',
        '/js/duration.js'
    ];

    function load() {
        scripts.forEach(function (src) {
            var s = document.createElement('script');
            s.src = src;
            s.async = false; // 保持插入顺序执行（fireworks 依赖 anime）
            document.body.appendChild(s);
        });
    }

    if (document.readyState === 'complete') {
        load();
    } else {
        window.addEventListener('load', load);
    }
})();
