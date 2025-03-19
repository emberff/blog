---
title: Fluid主题添加Subtitle颜色渐变效果和鼠标点击特效
excerpt: 博客Slogan颜色渐变 鼠标点击特效
date: 2024-10-03 14:06:36
tags: [Hexo, Fluid]
category: [博客, 美化]
---
# Slogan 颜色渐变
{% note %}
在 `Fluid` 主题下,每个页面都有一个 `Slogan` 标题, 虽然 `Fluid` 本身提供了打字机特效,但白色的字体太过单薄,不适合我这种喜欢花里胡哨的人.
{% endnote %}

要为 `Slogan`  添加颜色,其实就是编写一个 `css` 对原本的样式进行替换.在[emoryhuang](https://emoryhuang.cn/blog/1729600336.html#%E5%A4%B4%E9%83%A8%E6%89%93%E5%AD%97%E6%9C%BA%E9%A2%9C%E8%89%B2%E6%95%88%E6%9E%9C%E6%B8%90%E5%8F%98)的博客中有对此进行修改的css,然而在这个css中只对`subtitle`的样式进行了修改,而没有为开启打字机后的游标进行修改.在 `hexo-them-fluid` 的 `css`中全局搜索 `#subtitle` ,我们可以找到下面的样式
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410031425808.png)
因此,只需要在博主提供的基础上再额外添加对于 `.typerd-cursor` 的样式修改即可
```
/* 打字机效果渐变 -bynote.cn*/

#subtitle {
    background: linear-gradient(-45deg, #ee7752, #ce3e75, #23a6d5, #23d5ab);
    background-size: 400% 400%;
    -webkit-animation: Gradient 10s ease infinite;
    -moz-animation: Gradient 10s ease infinite;
    animation: Gradient 10s ease infinite;
    -o-user-select: none;
    -ms-user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
}

#subtitle:before {
    background-color: rgba(0, 0, 0, 0);
}

/* 以下为对游标样式的修改*/
.typed-cursor {
    background: linear-gradient(-45deg, #ee7752, #ce3e75, #23a6d5, #23d5ab);
    background-size: 400% 400%;
    -webkit-animation: Gradient 10s ease infinite;
    -moz-animation: Gradient 10s ease infinite;
    animation: Gradient 10s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: inline-block; /* 确保能够正确显示背景 */
    margin-left: 5px; /* 可选：增加与文本的间距 */
    user-select: none; /* 禁止文本选择 */
}

```
效果如下图
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410031431252.png)

# 鼠标点击特效
在 [Hexo&Fluid魔改笔记](https://asteri5m.icu/archives/0c8538e7-5b5f-4897-8e8b-0cff84320473) 博客中有提到如何添加三种鼠标的点击特效, 当然我最终选择的是这篇里没有提到的烟花爆炸特效.
参考 [https://www.cnblogs.com/songhaixing/p/13754821.html](https://www.cnblogs.com/songhaixing/p/13754821.html) ,在此篇博客中提供了爆炸特效的`js`代码, 当然直接引用提供的 `cdn` 也是没有问题的,但是原版的特效范围太大了, 比较影响观感且点击产生的圆只有红色一种颜色, 因此我选择在本地新建文件再引用的方式添加特效.
提供的两个文件中 [anime.min.js](https://files.cnblogs.com/files/songhaixing/anime.min.js) 是依赖库,不用做修改直接引用,
具体的动画参数均在 [fireworks.js](https://files.cnblogs.com/files/songhaixing/fireworks.js) 中.
修改参数的位置以及在下面的代码中均已在注释处标明. 对于点击处产生的空心圆颜色的修改是在产生粒子时,统计各个颜色产生粒子的数量然后将颜色改为数量最少的粒子对应的颜色. 
```

function updateCoords(e) {
  pointerX = (e.clientX || e.touches[0].clientX) - canvasEl.getBoundingClientRect().left,
  pointerY = e.clientY || e.touches[0].clientY - canvasEl.getBoundingClientRect().top;
}

function setParticuleDirection(e) {
  var t = anime.random(0, 360) * Math.PI / 180,
      a = anime.random(35, 130), // 粒子扩散范围调整
      n = [-1, 1][anime.random(0, 1)] * a;
  return {
      x: e.x + n * Math.cos(t),
      y: e.y + n * Math.sin(t)
  };
}

function createParticule(e, t) {
  var a = {};
  a.x = e;
  a.y = t;
  a.color = colors[anime.random(0, colors.length - 1)];
  a.radius = anime.random(11.2, 22.4); // 粒子效果圆半径
  a.endPos = setParticuleDirection(a);
  a.draw = function() {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, 2 * Math.PI, !0);
      ctx.fillStyle = a.color;
      ctx.fill();
  };
  return a;
}

function createCircle(e, t, particleColors) {
    var a = {};
    a.x = e;
    a.y = t;
    a.radius = 0.1;
    a.alpha = 0.5;
    a.lineWidth = 6;
  
    // 选择粒子颜色中数量最少的颜色
    var colorCounts = {};
    particleColors.forEach(color => {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
    });
  
    var minColor = Object.keys(colorCounts).reduce((a, b) => colorCounts[a] < colorCounts[b] ? a : b);
  
    a.draw = function() {
        ctx.globalAlpha = a.alpha;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, 2 * Math.PI, true);
        ctx.lineWidth = a.lineWidth;
        ctx.strokeStyle = minColor; // 使用数量最少的颜色
        ctx.stroke();
        ctx.globalAlpha = 1;
    };
    return a;
  }
  

function renderParticule(e) {
  for (var t = 0; t < e.animatables.length; t++)
      e.animatables[t].target.draw();
}

function animateParticules(e, t) {
  var particleColors = [];
  var n = [];
  for (var i = 0; i < numberOfParticules; i++) {
      var particule = createParticule(e, t);
      n.push(particule);
      particleColors.push(particule.color);
  }
  var a = createCircle(e, t, particleColors);
  
  anime.timeline().add({
      targets: n,
      x: function(e) {
          return e.endPos.x;
      },
      y: function(e) {
          return e.endPos.y;
      },
      radius: .1,
      duration: anime.random(1200, 1800),
      easing: "easeOutExpo",
      update: renderParticule
  }).add({
      targets: a,
      radius: anime.random(80, 160) * 0.5, // 空心圆半径
      lineWidth: 0,
      alpha: {
          value: 0,
          easing: "linear",
          duration: anime.random(600, 800)
      },
      duration: anime.random(1200, 1800),
      easing: "easeOutExpo",
      update: renderParticule,
      offset: 0
  });
}

function debounce(fn, delay) {
  var timer;
  return function () {
      var context = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
          fn.apply(context, args);
      }, delay);
  };
}

var canvasEl = document.querySelector(".fireworks");
if (canvasEl) {
  var ctx = canvasEl.getContext("2d"),
      numberOfParticules = 30,
      pointerX = 0,
      pointerY = 0,
      tap = "mousedown",
      colors = ["#FF1461", "#18FF92", "#5A87FF", "#FBF38C"],
      setCanvasSize = debounce(function() {
          canvasEl.width = 2 * window.innerWidth,
          canvasEl.height = 2 * window.innerHeight,
          canvasEl.style.width = window.innerWidth + "px",
          canvasEl.style.height = window.innerHeight + "px",
          canvasEl.getContext("2d").scale(2, 2);
      }, 500),
      render = anime({
          duration: 1 / 0,
          update: function() {
              ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
          }
      });

  document.addEventListener(tap, function(e) {
      if ("sidebar" !== e.target.id && "toggle-sidebar" !== e.target.id && "A" !== e.target.nodeName && "IMG" !== e.target.nodeName) {
          render.play();
          updateCoords(e);
          animateParticules(pointerX, pointerY);
      }
  }, !1),
  setCanvasSize(),
  window.addEventListener("resize", setCanvasSize, !1);
}
```
修改完代码后在配置文件的 `csutom_js` 中引入两个 `js` 文件, 然后在  `custom_html` 处引入画布:
```
<!-- 鼠标点击特效 -->
<canvas class="fireworks" style="position:fixed;left:0;top:0;z-index:99999999;pointer-events:none;"> </canvas>
```
效果如下
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410031640155.gif)

# 参考资料
- 打字机颜色渐变 [https://emoryhuang.cn/blog/1729600336.html#%E5%A4%B4%E9%83%A8%E6%89%93%E5%AD%97%E6%9C%BA%E9%A2%9C%E8%89%B2%E6%95%88%E6%9E%9C%E6%B8%90%E5%8F%98](https://emoryhuang.cn/blog/1729600336.html#%E5%A4%B4%E9%83%A8%E6%89%93%E5%AD%97%E6%9C%BA%E9%A2%9C%E8%89%B2%E6%95%88%E6%9E%9C%E6%B8%90%E5%8F%98)
- 🌟博客园鼠标点击爆炸烟花特效 [https://www.cnblogs.com/songhaixing/p/13754821.html](https://www.cnblogs.com/songhaixing/p/13754821.html)
