---
title: Hexo + Fluid博客搭建
excerpt: 使用Hexo搭建部署博客并使用Fluid主题 
date: 2024-10-01 16:11:24
tags: [Hexo, Fluid]
category: [博客, 优化]
---
{% note %}
作为一个学计算机的人,不做个人博客就像四大名著不看红楼梦……
简单的折腾几天也是终于把样子搭好了!下面简单记录一下搭建的过程.
{% endnote %}

# 1. hexo 的本地环境搭建
hexo本地环境需要`Nodejs`和`git`,`nodejs`作用是在本地编译,`git`是将编译完成的文件上传到仓库,由于我很早就完成了安装,且网上教程很多,此处不再赘述.


(1) 在需要的环境配置完成后,使用npm安装heox
```
npm install -g hexo-cli
```
(2) 在命令行中选择一个文件夹进行初始化.下面的命令会在当前目录中创建一个blog的文件夹,并在其中配置相关依赖
```
hexo init blog
```
(3) 进入文件夹并安装依赖
```
cd blog
npm i
```
等待安装完成后,blog中会出现如下文件:
![alt text]![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/20241001202737.png)

(4) 直接使用hexo提供的命令就能在本地看到博客的界面了
```
hexo server
```
![alt text]![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410012030784.png)

# 2. 在服务器部署(Debain)
> Debain的包管理工具为apt, 若使用的是其他Linux发行版,只要把安装的指令切换成对应发行版的包管理工具即可,流程是相同的
## (1) 在服务器的控制台中修改策略组,开放以下端口
22: 用于 git 的远程连接,在执行`hexo delpoy`部署时需要用到
80: http 连接使用的端口
443: https 连接使用的端口


## (2) 配置 Nginx
安装 nginx:
```
apt install nginx
```
启动 nginx
```
sudo systemctl start nginx
```

创建一个证书存储目录,并将证书相关文件将证书文件(`.pem`以及`.key`文件)添加进去:
```
mkdir /etc/nginx/conf.d/cert
```
先建立一个hexo工作目录,此目录为博客推送后实际存储的位置(根目录):
```
mkdir /var/www/hexo
```

![alt text]![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410012031287.png)

配置 nginx 路由
```
vi /etc/nginx/conf.d/blog.conf
```
输入以下内容:
其中`server_name`可填写域名,若无则填写服务器的公网ip
```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name blog.xxx.com; 

    # 强制重定向所有 HTTP 请求到 HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name blog.xxx.com;

    # 修改为正确的证书文件路径
    ssl_certificate /etc/nginx/conf.d/cert/blog.emb42.com_bundle.pem;
    ssl_certificate_key /etc/nginx/conf.d/cert/blog.emb42.com.key;

    ssl_session_cache shared:SSL:1m;
    ssl_session_timeout 5m;

    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
    ssl_protocols TLSv1.2 TLSv1.3;

    ssl_prefer_server_ciphers on;

    root /var/www/hexo; # 博客存储的根目录
    index index.html;  # 默认首页文件

    location / {
        try_files $uri $uri/ /index.html;  # 处理请求
    }
}
```
检查语法并重新加载 nginx
```
nginx -t
nginx -s reload
```

## (3) 安装 Nodejs
依次执行以下命令
```
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```
查看安装结果，打印对应版本号则安装成功
```
node -v
npm -v
```
## (4) Git服务器配置
### 修改git用户权限
安装 git:
```
apt install git 
```
添加 git 用户:
```
adduser git
```
修改用户权限:
```
chmod 740 /etc/sudoers
```
编辑`/etc/sudoers`,添加`git ALL=(ALL) ALL`,修改git用户权限:
```
vi /etc/sudoers
```
先按`i`进入编辑模式,添加语句
![alt text]![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410012031908.png)
按`esc`然后输入`:wq`保存退出.
设置 git 用户密码:
```
sudo passwd git
```
Linux中输入密码时是不显示`***`样式的,正常输入即可
### 配置 ssh 连接
> 目的是以后使用`hexo deploy`部署时不用每次都输入密码

切换至`git`用户,在`~`目录下创建.ssh文件夹
```
su git
cd ~
mkdir .ssh
cd .ssh
```

创建公钥,执行命令后无需输入,只要按回车即可
`.ssh`文件下会生成一个`authorized_keys`的文件
```
ssh-keygen
```
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410012032052.png)
修改其权限:
```
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```
将本地电脑上的公钥```id_rsa.pub```文件中的内容添加至```authorized_keys```中
后,在本地命令给中尝试与服务器进行 ssh 连接,无报错且成功显示服务器的bash则成功
```
ssh -v git@服务器ip
```
![alt text]![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410012032956.png)
### 创建服务器 Git 仓库


建立一个repo目录并初始化```blog.git```仓库
```
mkdir /var/repo 
git init --bare /var/repo/blog.git
```

创建并编辑 post-receice
```
vi /var/repo/blog.git/hooks/post-receive
```
添加以下内容,其功能为在blog.git接收到推送时强制将推送的内容部署到`/var/www/hexo`目录下:
(tips:也就是说如果推送了但网站没有更新,可以在服务器中手动执行此命令以部署):
```
git --work-tree=/var/www/hexo --git-dir=/var/repo/blog.git checkout -f
```
保存退出并添加可执行权限:
```
chmod +x /var/repo/blog.git/hooks/post-receive
```
为仓库添加权限
```
chown -R git:git /var/repo     #将仓库目录的所有权移交给git用户
chown -R git:git /var/www/hexo     #将hexo部署目录的所有权移交给git用户
```
# 3. 在本地配置服务器信息
打开bolg文件目录中的配置文件`config.yml`,在最下面的`deploy`中修改配置信息,其中`repo`若无域名则以ip替代,`:`后填写服务器下git目录的位置:
```
deploy:
  type: git
  repo: git@blog.xxx.com:/var/repo/blog.git
  branch: master
```
完成后用命令行在本地博客的根目录位置执行部署命令,应该能在服务器/var/www/hexo目录中看到相应的内容,并且访问服务器可以看到博客界面了
```
hexo d
```

# 4. 修改 Hexo 主题
## 安装Fluid主题
进入博客目录执行
```
npm install --save hexo-theme-fluid
```
然后在博客目录下创建 _config.fluid.yml，将Fluid主题的 _config.yml (opens new window)内容复制过去

## 指定主题
修改本地_config.yml中的配置:
```
theme: fluid  # 指定主题

language: zh-CN  # 指定语言，会影响主题显示的语言，按需修改
```
## 创建关于页
首次使用主题的「关于页」需要手动创建：
```
hexo new page about
```
创建成功后修改 /source/about/index.md，添加 layout 属性。

修改后的文件示例如下：
```
---
title: 标题
layout: about
---

这里写关于页的正文，支持 Markdown, HTML
```
完成后执行 hexo 命令本地检查是否切换成功:
```
hexo cl && hexo g && hexo s
```
主题成功切换后部署至服务器
```
hexo d
``` 
# 参考资料

- Fluid官方文档 [https://fluid-dev.github.io/hexo-fluid-docs/start/](https://fluid-dev.github.io/hexo-fluid-docs/start/)
- Hexo官方文档 [https://hexo.io/zh-cn/docs/#%E5%AE%89%E8%A3%85-Hexo](https://hexo.io/zh-cn/docs/#%E5%AE%89%E8%A3%85-Hexo)
- 博客部署教程 [https://developer.aliyun.com/article/815625](https://developer.aliyun.com/article/815625)