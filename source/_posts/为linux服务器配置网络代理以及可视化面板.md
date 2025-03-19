---
title: 为linux服务器配置网络代理以及可视化面板
excerpt: 在服务器使用 clash 以及添加 Dashboard
date: 2024-10-06 19:19:39
tags: [Linux, Clash]
category: [工具]
---
{% note %}
国内服务器要使用 `github` 克隆项目时实在太慢了! 还有等了半天结果克隆失败的情况,实在是恶心人, 因此决定用 clash 为服务器添加一个代理
{% endnote %}
# 服务器启动 Clash
参照 [clash-for-linux-backup](https://github.com/Elegycloud/clash-for-linux-backup?tab=readme-ov-file) 项目的教程, 第一步是克隆项目.
找一个国内的镜像源进行克隆, 这里我用的是githubfast
```
git clone https://githubfast.com/Elegycloud/clash-for-linux-backup.git
```
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410061935377.png)
配置 `clash` 订阅地址, 在  `CLASH_URL` 处填入订阅地址, `CLASH_SECRET` 为在 `Dashboard` 的登陆密码,若不填则随机生成
```
vim clash-for-linux-backup/.env
```
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410061940755.png)
为项目中的脚本添加可执行权限
```
cd clash-for-linux-backup
chmod +x start.sh shutdown.sh restart.sh 
```
启动脚本, 保存生成的 `Secret`
```
./start.sh
```
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410061945784.png)
启用代理
```
source /etc/profile.d/clash.sh
proxy_on
```
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410061948952.png)
检查服务端口
```
netstat -tln | grep -E '9090|789.'
```
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410061949015.png)
检测环境变量
```
env | grep -E 'http_proxy|https_proxy'
```
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410061950973.png)
均无问题则启动成功!

# 修改配置以及关闭代理
## 修改配置
在 `conf/config.yaml` 修改配置, 完成后需要执行项目下 `restart.sh` 的脚本
## 关闭代理
在项目目录下执行 `shutdown.sh` 脚本, 并刷新环境
```
./shutdown.sh
proxy_off
```
# Clash Dashboard
首先要在云服务器厂商的服务器控制台将 **`9090` 端口放开**
接下来就可以在浏览器中访问服务器的 `Clash Dashboard` 了,地址为 `http://<ip>:9090/ui`
在 `API Base URL` 中填入 `http://<ip>:9090`,在 `Secret(optional)` 一栏中输入启动成功后输出的 `Secret`, 然后点击 `ADD`, 然后就进入 `Dashboard` 界面了
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410062028254.png)
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410062032340.png)
其余的相关操作可以参考 [yacd](https://github.com/haishanh/yacd?tab=readme-ov-file)

# 参考资料
- [clash-for-linux-backup](https://github.com/Elegycloud/clash-for-linux-backup)
- [yacd](https://github.com/haishanh/yacd?tab=readme-ov-file)
