---
title: Vue3.0尝鲜体验
key: 1591930416date: 2020-06-12 10:53:36
updated: 2023-02-13 18:28:43
tags:
  - JavaScript
  - Vue
categories:
  - 编程
---


`Vue3.0`尝鲜体验。

<!-- more -->

这次来体验下`Vue3.0`。

首先我们去`vue3.0`的`github`仓库：

> [vue-next](https://github.com/vuejs/vue-next)

# 区别

最近也在看`Vue3.0`中关于`reactivity`包的源码，感觉挺新奇的。

`Vue2`对属性改变的监听用的是`Object.defineProperty`，需要遍历每个对象的每个属性。

而`Vue3`用的是`Proxy`，监听的为整个对象，而且对数组的支持更好了。

最最最重要的是`Vue3`完全由`TypeScript`开发，而且也支持通过`TypeScript`来编写组件，相当的香。

在`Vue2`的时候，整个项目完全使用了`JavaScript`进行编写，为了能够支持静态类型检查，而引入了`flowjs`，不使用`TypeScript`的原因是重构成本过高，而`flowjs`可以平滑的引入的项目中。

不过随着`TypeScript`的发展，`VSCode`的出现，以及`ECMAScript`规范的不断更新，`Vue3`就基本完全使用`TypeScript`来编写了。

想当初使用`React`也是因为支持`TypeScript`（复杂`TypeScript`用法我也不会 🤣，只能写写基本类型定义这个样子。

# 编译 Vue-next 项目生成库文件

电脑必须有`node`的环境，如果不知道有没有的可以在`cmd`输入`node -v`来查看。

先把项目给克隆到本地，我们的目的就是用过构建这个项目来生成一个`Vue.js`的`js`库，然后使用它。

- `git clone https://github.com/vuejs/vue-next.git`

然后我们就在本地有了一份`Vue-next`的源码。

![](https://i.loli.net/2020/04/23/HXRDImixUVLZnCN.png)

`IDE`推荐用`idea`或者`VSCode`，使用起来非常舒服。

在控制台输入以下命令：

- `yarn`

此命令用于安装依赖，注意是在文件夹的内部使用，如果没有安装`yarn`，可以使用`npm install`来执行。

接着我们可以看看`package.json`里面的`script`命令。

![](https://i.loli.net/2020/04/23/MBp8Lzfma7i1r5P.png)

发现有挺多的，但是我们只要运行第一条命令即可，`dev`命令会在`package/vue/dist`下生成`vue.global.js`的文件，这个就是开发环境下的文件了。

- `yarn dev`

没有`yarn`的，运行`npm run dev`的效果是一样的。

这样就得到了一个可以通过`script`引入的库文件了。

# 新建项目来使用生成的库文件

新建一个文件夹，我这边的命名为`vue3`，我们的目的是搭建一个`node`的服务器来，然后通过`html`文件来引入`js`库来使用`Vue3`。

- 运行`npm init`来初始化项目；
- 把生成的库文件找个地方放起来，我这边是建了个`lib`的文件夹；
- 建个`html`文件夹来存放我们的 html 文件。

上面做完后，目录大致和下面一样：

![](https://i.loli.net/2020/04/23/41MGQiaWznsPXAK.png)

有`node_modules`文件夹是因为使用了一些依赖，下面讲。

接下来使用`Koa`来搭建一个静态的服务器。

先引入依赖：

- 运行`yarn add koa`或者`npm install koa`；
- 运行`yarn add koa-static`或者`npm install koa-static`。

`koa`是一个`node`平台的`web`框架，使用了`async`和`await`的语法，挺不错的。

但是我们基本用不到这些语法，因为我们主要是当作静态资源服务器，只要简单的配置就可以使用。

`koa-static`用于处理静态资源。

我们在项目的根目录下建立全局入口文件`index.js`。

```javascript
// 导入依赖
const Koa = require("koa");
const KoaStatic = require("koa-static");
const path = require("path");
// 新建一个app
const app = new Koa();
// 获取当前项目的路径并通koa-static生成一个中间件
const home = KoaStatic(path.join(__dirname));
// 使用中间件
app.use(home);
// 监听端口
app.listen(3030, (err) => {
  if (err) throw err;
  console.log("服务器已经运行");
});
```

接下来我们在 html 文件夹下面新建一个`vue.html`来使用`Vue3`：

```html
<!DOCTYPE html>
<html>
  <head>
    <title>vue</title>
  </head>
  <body>
    <div id="app"></div>
    <!-- 导入依赖 -->
    <script type="text/javascript" src="/lib/vue.global.js"></script>
    <!-- 编写想实验的代码 -->
    <script type="text/javascript">
      const { reactive } = Vue;
      const component = Vue.createApp({
        setup() {
          const data = reactive({
            msg: "Hello~ Vue3",
          });
          return {
            data,
          };
        },
        template: `<h1>{{data.msg}}</h1>`,
      }).mount("#app");
    </script>
  </body>
</html>
```

到此，静态服务器搭建完成。

- 运行 `node index.js`；
- 浏览器打开 `localhost:3030/html/vue.html`就可以看到我们的网页了。

![](https://i.loli.net/2020/04/23/GDrINQAWZzU7YJK.png)

然后我们在控制台可以输入`component.data.msg = &#39;Hello lwf&#39;`就可以观察到视图发生变化了。

![](https://i.loli.net/2020/04/23/UeMpwSDxZTQotlC.gif)

更多的`Api`可以看下面的网站。

> [Vue3 的 Api](https://vue-composition-api-rfc.netlify.app/api.html#template-refs)
