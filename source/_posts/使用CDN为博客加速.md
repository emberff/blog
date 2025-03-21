---
title: 使用CDN为博客加速
excerpt: 为博客添加CDN加速
date: 2024-11-11 20:35:25
tags: [Hexo, Fluid]
category: [博客, 优化]
---

{% note %}
博客加载速度实在是慢的离谱, 慢的时候每次打开都要炸裂的等上半分钟!
查了一下解决方案是使用CDN提速
{% endnote %}

毅然决然的购买了腾讯云的CDN流量包...

# 什么是CDN

`CDN`（Content Delivery Network，内容分发网络）是一种分布式的服务器系统，通过在全球各地的服务器上缓存内容，将用户请求的内容（如图片、视频、网页等）从最近的服务器快速地传送给用户。这种网络结构提高了网站和应用的加载速度，减轻了源服务器的负载压力，并提升了内容在全球范围内的可用性和稳定性。

以上都是我问 `ChatGPT` 的废话, 它的作用原理为:
- 缓存内容：CDN 在多个地理位置部署缓存服务器，将静态资源（如图片、视频、CSS、JS 文件）预先存储在离用户较近的服务器上。

- 智能调度：当用户请求资源时，CDN 自动选择距离用户最近的缓存服务器，缩短数据传输的路径，减少加载延迟。

- 源站回源：如果缓存服务器上没有用户请求的资源（例如内容更新或缓存过期），CDN 会回源至源站获取最新内容，然后缓存到边缘服务器供下次请求使用。

简单地用两个词形容就是 `缓存` 以及 `调度`。缓存自不必多说, 调度可以从下面的图中更直观的感受:
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202411112048118.png)


# 使用腾讯云CDN
域名配置正常填写, 加速域名就是博客的域名
![域名配置](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202411112108009.png)

下面的源站配置中, 如果网站开启了 `HTTPS` 那么回源协议也要使用 `HTTPS`, 源站地址填写服务器的 `ip` 地址, 完成后点击下一步进入配置

- 源站：指运行业务的网站服务器，是需要分发的内容的来源。源站可用来处理和响应用户请求，当节点没有缓存用户请求的内容时，节点会返回源站获取资源数据，然后放到自己的缓存中，再返回给用户。（和计算机组成原理中的 Cache 技术原理一样）
- 回源：比如用户访问的内容在结点里没有（或者过期），节点就得去源站拉取内容，这个过程就叫回源。
![源站配置](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202411112110872.png)

接下来的配置对于我这种懒狗当然是直接用推荐配置然后跳过~~ 当然, 在防止费用超额那一块最好是设置一下, 防止有人攻击的:
![防止费用超额](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202411112140966.png)
![封顶用量限制](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202411112140537.png)
接下来按照给出的指示, 在域名解析处将原本的 `A` 类型记录( 域名解析为 `ip` ) 改为 给出的 `CNAME` 类型的记录 ( 域名解析为域名 )
![配置域名解析](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202411112142481.png)
完成后在[站长工具](https://ping.chinaz.com/)中检测一波速: 飞一般的感觉!!
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202411112151543.png)

# 刷新缓存
说到缓存, 离不开缓存的刷新以及删除的问题, 腾讯云的 `CDN` 服务提供了两种方式。
- 第一种是设置缓存刷新时间后定期自动刷新
- 第二种是手动刷新缓存
## 自动刷新缓存
自动刷新缓存的配置在域名管理的缓存配置处进行修改:
![自动刷新缓存配置](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202411121240226.png)
## 手动刷新缓存
如果发布文章后希望马上在网站中看到更新的内容就需要手动刷新, 手动刷新在菜单的刷新预热处:
![刷新预热](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202411121251291.png)
在 `目录刷新` 下的文本框内输入博客的根域名进行刷新。

# 参考资料
[https://www.cnblogs.com/PeterJXL/p/18298920](https://www.cnblogs.com/PeterJXL/p/18298920)
[https://blog.lanweihong.com/posts/43806/](https://blog.lanweihong.com/posts/43806/)
