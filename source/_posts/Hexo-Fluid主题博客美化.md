---
title: Hexo+Fluid主题博客美化
excerpt: 在博客中添加 建站时间 一言 恶搞标题
date: 2024-10-02 10:07:41
tags: [Hexo, Fluid]
category: [博客, 美化]
---
{% note %}
搭建完了博客,第一步当然是对博客进行美化.简单记录一下我对自己博客的美化过程
{% endnote %}

# 准备工作
对于博客配置的修改,若无特殊说明均在 `_config.fluid.yml` 文件内
对于资源的修改,均在博客**根目录**下 `source` 目录中,而不是 `fluid` 主题内部的 `source`
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410021033228.png)

在根据 Fluid 配置文件的说明,在 `custom_js` 和 `custom_css` 中的文件路径相对 `source` 目录，如 `/js/custom.js` 对应存放目录 `source/js/custom.js` ,因此在 `source` 目录内添加 `js` 和 `css` 两个目录,按照如图所示的格式在配置文件中引入
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410022221494.png)

# 页脚添加建站时间
在 `js` 目录下新建 `duration.js` 文件 
```
var startDate = new Date("2024-09-26T12:00:00"); // 使用 ISO 格式的日期,在此处修改你网站的建立时间
function createTime() {
    var now = new Date();
    var elapsed = now - startDate;

    var days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    var hours = Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

    // 格式化为两位数
    hours = String(hours).padStart(2, '0');
    minutes = String(minutes).padStart(2, '0');
    seconds = String(seconds).padStart(2, '0');

    document.getElementById("timeDate").innerHTML = "本站已在夹缝中生存 " + days + " 天 "; // 在这里修改你的建站时间文本
    document.getElementById("times").innerHTML = hours + " 小时 " + minutes + " 分 " + seconds + " 秒";
}

// 每 250 毫秒更新一次
setInterval(createTime, 250);
```
在配置文件的 `footer` 处添加下面的内容:
```
    <!-- 博客上线天数 -->
    <div>
      <span id="timeDate">载入天数...</span>
      <span id="times">载入时分秒...</span>
      <script src="/js/duration.js"></script>
    </div>
```
然后就编译运行就可以看到效果了
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410022233001.png)

# 添加一言功能
如果时想在页脚添加,参照[一言官方文档](https://developer.hitokoto.cn/sentence/demo.html)给出的示例,只需要直接在 `footer` 下添加以下内容
```
    <div class="statistics">
      <a href="https://developer.hitokoto.cn/" id="hitokoto_text"><span id="hitokoto"></span></a>
      <script src="https://v1.hitokoto.cn/?c=h&c=i&c=k&encode=js&select=%23hitokoto" defer></script>
    </div>
```
当然,也可以用一言替代博客Slogan(首页标题文字)的随机语句,这在 [Fluid的官方文档](https://hexo.fluid-dev.com/docs/guide/#slogan-%E6%89%93%E5%AD%97%E6%9C%BA)中有给出示例,仅需将 `api` 条目下的 `false` 改为 `true` 即可

# 标签恶搞
在离开页面时标签页显示崩溃或其他文本的恶搞功能,直接照搬 [Asteri5m](https://asteri5m.icu/archives/0c8538e7-5b5f-4897-8e8b-0cff84320473)博客中给出的代码
在 `custom_js` 中引入以下 `js` 代码文件
```
// 浏览器搞笑标题
var OriginTitle = document.title;
var titleTime;
document.addEventListener('visibilitychange', function() {
	if (document.hidden) {
		$('[rel="icon"]').attr('href', "/funny.ico");
		document.title = '╭(°A°`)╮ 页面崩溃啦 ~';
		clearTimeout(titleTime);
	} else {
		$('[rel="icon"]').attr('href', "/img/newtubiao.png");
		document.title = '(ฅ>ω<*ฅ) 噫又好啦 ~' + OriginTitle;
		titleTime = setTimeout(function() {
			document.title = OriginTitle;
		}, 2000);
	}
});
```

# 参考资料
- Fluid官方文档 [https://hexo.fluid-dev.com/docs/guide/](https://hexo.fluid-dev.com/docs/guide/)
- Asteri5m博客 [https://asteri5m.icu/archives/0c8538e7-5b5f-4897-8e8b-0cff84320473](https://asteri5m.icu/archives/0c8538e7-5b5f-4897-8e8b-0cff84320473)
- 一言开发者中心 [https://developer.hitokoto.cn/sentence/](https://developer.hitokoto.cn/sentence/)