// 页面加载动画：仅依赖原生 JS，不做任何跨域脚本请求
(function () {
    function hideLoader() {
        var el = document.getElementById('loader-container');
        if (el) {
            el.classList.add('loader-hidden');
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        hideLoader();
    } else {
        document.addEventListener('DOMContentLoaded', hideLoader);
        window.addEventListener('load', hideLoader);
    }

    // 兜底：无论资源是否加载完成，3s 后强制隐藏
    setTimeout(hideLoader, 3000);
})();
