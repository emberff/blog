---
title: Hexo Fluid背景固定以及添加加载动画
excerpt: 修改博客背景固定 添加加载动画
date: 2024-10-04 20:17:18
tags: [Hexo, Fluid]
category: [博客, 美化]
---
# 背景固定
参考了[清山](https://qingshaner.com/Hexo%20Fluid%E4%B8%BB%E9%A2%98%E8%83%8C%E6%99%AF%E5%9B%BA%E5%AE%9A(ES6%E6%94%B9%E5%86%99%E7%89%88)%E4%B8%8E%E6%AF%9B%E7%8E%BB%E7%92%83%E5%BA%95%E9%A1%B5/#%E8%83%8C%E6%99%AF%E5%85%A8%E5%B1%8F%E5%9B%BA%E5%AE%9A)的博客
1. 添加 `background.js` 文件
```
document
  .querySelector('#web_bg')
  .setAttribute('style', `background-image: ${document.querySelector('.banner').style.background.split(' ')[0]};position: fixed;width: 100%;height: 100%;z-index: -1;background-size: cover;`);

document
  .querySelector("#banner")
  .setAttribute('style', 'background-image: url()')

document
  .querySelector("#banner .mask")
  .setAttribute('style', 'background-color:rgba(0,0,0,0)')
```
2. 在 `hexo` 中注入html
   在 `Fluid`主题下由两种方式,一种是 `Hexo` 注入, 另一种方式是 `Fluid` 提供的注入方式, 注入方式是在博客文件根目录下新建一个 `scripts` 目录,在其中建立一个 `js` 文件, 详细可见 [Fluid官方文档](https://hexo.fluid-dev.com/docs/advance/#hexo-%E6%B3%A8%E5%85%A5%E4%BB%A3%E7%A0%81)
```
hexo.extend.injector.register("body_begin", `<div id="web_bg"></div>`);
hexo.extend.injector.register("body_end",`<script src="${siteRoot}js/backgroundize.js"></script>`);
```

# 添加加载动画
我选择的加载动画是在 [codepen.io](codepen.io) 中找的[彩虹动画](https://codepen.io/jackrugile/pen/JddmaX/)
当然,此处直接拿到的 `html` 与 `css` 都是不能**直接使用**的,还需要对样式进行处理,完整的代码如下: 
- 在 `html` 之上添加一个容器 `loader-container` 以包裹全部的样式:
```
<div id="loader-container"> 
    <div id="loader" class="loader"></div>
    <div class="loader-inner">
        <div class="loader-line-wrap">
            <div class="loader-line"></div>
        </div>
        <div class="loader-line-wrap">
            <div class="loader-line"></div>
        </div>
        <div class="loader-line-wrap">
            <div class="loader-line"></div>
        </div>
        <div class="loader-line-wrap">
            <div class="loader-line"></div>
        </div>
        <div class="loader-line-wrap">
            <div class="loader-line"></div>
        </div>
    </div>
</div>
```
- 在 `css` 中添加 `loader-container` 的样式,并确保所有动画均在最上层:
```
#loader-container {
   position: fixed; /* 或 absolute，根据需求 */
   top: 0;
   left: 0;
   right: 0;
   bottom: 0;
   z-index: 99999; /* 确保在最上层 */
   display: flex;
   justify-content: center;
   align-items: center;
   background: rgba(0, 0, 0, 0.7); /* 可选：添加背景以增加可见性 */
}

.loader,
.loader-inner,
.loader-line-wrap,
.loader-line {
    position: absolute; /* 或 fixed，根据需要选择 */
    z-index: 99999; /* 确保在最上层 */
}

.loader {
   background: #000;
   background: radial-gradient(#222, #000);
   bottom: 0;
   left: 0;
   overflow: hidden;
   position: fixed;
   right: 0;
   top: 0;
   z-index: 99999;
}

.loader-inner {
   bottom: 0;
   height: 60px;
   left: 0;
   margin: auto;
   position: absolute;
   right: 0;
   top: 0;
   width: 100px;
}

.loader-line-wrap {
   animation: 
     spin 2000ms cubic-bezier(.175, .885, .32, 1.275) infinite
  ;
   box-sizing: border-box;
   height: 50px;
   left: 0;
   overflow: hidden;
   position: absolute;
   top: 0;
   transform-origin: 50% 100%;
   width: 100px;
}
.loader-line {
   border: 4px solid transparent;
   border-radius: 100%;
   box-sizing: border-box;
   height: 100px;
   left: 0;
   margin: 0 auto;
   position: absolute;
   right: 0;
   top: 0;
   width: 100px;
}
.loader-line-wrap:nth-child(1) { animation-delay: -50ms; }
.loader-line-wrap:nth-child(2) { animation-delay: -100ms; }
.loader-line-wrap:nth-child(3) { animation-delay: -150ms; }
.loader-line-wrap:nth-child(4) { animation-delay: -200ms; }
.loader-line-wrap:nth-child(5) { animation-delay: -250ms; }

.loader-line-wrap:nth-child(1) .loader-line {
   border-color: hsl(0, 80%, 60%);
   height: 90px;
   width: 90px;
   top: 7px;
}
.loader-line-wrap:nth-child(2) .loader-line {
   border-color: hsl(60, 80%, 60%);
   height: 76px;
   width: 76px;
   top: 14px;
}
.loader-line-wrap:nth-child(3) .loader-line {
   border-color: hsl(120, 80%, 60%);
   height: 62px;
   width: 62px;
   top: 21px;
}
.loader-line-wrap:nth-child(4) .loader-line {
   border-color: hsl(180, 80%, 60%);
   height: 48px;
   width: 48px;
   top: 28px;
}
.loader-line-wrap:nth-child(5) .loader-line {
   border-color: hsl(240, 80%, 60%);
   height: 34px;
   width: 34px;
   top: 35px;
}

@keyframes spin {
   0%, 15% {
     transform: rotate(0);
  }
  100% {
     transform: rotate(360deg);
  }
}
```


将加载动画的 `html` 文件和 `css` 文件在本地建立对应的文件并引入
   `html` 以注入方式加载到 Fluid 中:
```
hexo.extend.filter.register('theme_inject', function(injects) {

  // 页面加载动画  
  injects.bodyBegin.file('loader', 'source/html/loader.html');

  });
```
- 编写 `loader.js`, 使用 `jquery` 方式使网页加载完成后动画消失
```
function loadScript(url, callback) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    script.onload = function() {
        callback();
    };

    document.head.appendChild(script);
}

// 加载 jQuery
loadScript('https://code.jquery.com/jquery-3.6.0.min.js', function() {
    $(function(){
        $("#loader-container").fadeOut(560);
    });
});

```
最后在 `_config.fluid.yml` 中引入 `loader.css` 和 `loader.js` 并执行 hexo 三联就完成加载动画的添加了

# 参考资料
[清山博客Fluid主题背景固定与毛玻璃底页](https://qingshaner.com/Hexo%20Fluid%E4%B8%BB%E9%A2%98%E8%83%8C%E6%99%AF%E5%9B%BA%E5%AE%9A(ES6%E6%94%B9%E5%86%99%E7%89%88)%E4%B8%8E%E6%AF%9B%E7%8E%BB%E7%92%83%E5%BA%95%E9%A1%B5/#%E8%83%8C%E6%99%AF%E5%85%A8%E5%B1%8F%E5%9B%BA%E5%AE%9A)
[Fluid官方文档 注入代码](https://hexo.fluid-dev.com/docs/advance/#hexo-%E6%B3%A8%E5%85%A5%E4%BB%A3%E7%A0%81)
[CSDN 为你的网站加上Loading等待加载效果吧 | Loading页面加载添加教程](https://blog.csdn.net/m0_66047725/article/details/129896812)
[codepen.io](codepen.io)