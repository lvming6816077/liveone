# liveone

基于WebRTC的HTML5一对一视频聊天项目，掘金文章地址：[传送门](https://juejin.cn/post/6900832429339213837)。


## 项目技术栈

前端采用Vue3.0，Vite。

后端采用Node.js，Express，Socket.io。


## 启动项目


1. vue前端项目源码:

    安装依赖：

    ```bash

    npm install
    ```

    本地dev启动：

    ```bash
    npm run dev
    ```

    本地打包build：

    ```bash
    npm run build
    ```


2. server文件夹是后端项目源码:

    安装依赖：

    ```bash

    npm install
    ```

    本地启动：

    ```bash

    node server.js
    ```


## 代码逻辑

![](https://qiniu.nihaoshijie.com.cn/%E6%9C%AA%E5%91%BD%E5%90%8D%E7%BB%98%E5%9B%BE.png)

1. 对于Vue端主要实现的是视频的预览功能和一些来电或者响应相关的CSS3动画。
2. 对于Node.js端主要实现的是实时的信息通信(socket.io的room相关API)，包括了识别对方的信令信息和用户的一些基本头像昵称信息的通信。
3. 整体的WebRTC协议的逻辑都是安装上文中所讲解的代码方式来体现。


#### 各位同学也欢迎提PR，共同维护好此项目，祝大家学习愉快！



