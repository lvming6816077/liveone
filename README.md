# liveone

基于WebRTC的HTML5一对一视频聊天项目，掘金文章地址：[传送门](https://juejin.cn/user/3368559356680215)。


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

![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4eeb2dca74564262839ed2ea4710c833~tplv-k3u1fbpfcp-watermark.image)

1. 对于Vue端主要实现的是视频的预览功能和一些来电或者响应相关的CSS3动画。
2. 对于Node.js端主要实现的是实时的信息通信(socket.io的room相关API)，包括了识别对方的信令信息和用户的一些基本头像昵称信息的通信。
3. 整体的WebRTC协议的逻辑都是安装上文中所讲解的代码方式来体现。


#### 各位同学也欢迎提PR，共同维护好此项目，祝大家学习愉快！



