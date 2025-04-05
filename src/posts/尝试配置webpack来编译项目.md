---
title: 尝试配置webpack来编译项目
key: 1606288149date: 2020-11-25 15:09:09
updated: 2023-02-13 18:28:45
tags:
  - webpack
  - JavaScript
categories:
  - 编程
---


尝试配置webpack来编译项目

<!-- more -->

主要是之前的两个项目，后台管理那个用的`react-cli`，官网那个用的`vue-cli`，基本不用写到和`webpack`有关的配置。

（官网那个写了点，不过是在`vue.config.js`文件内进行编写的，文件内其实也有属性可以直接编写原生的`webpack`配置）。

本文主要简单写写`webpack`的一些常用的配置...，当然，这也是我第一次直接使用`webpack`来编译项目。

# 正文

> [webpack 英文官网](https://webpack.js.org/)

> [webpack 中文官网](https://www.webpackjs.com/)

可以选择直接在官网学习，英语 ok 的直接英文文档，像我这种英语半吊子的，两者结合着看，不懂翻一下，顺便学下英语...

不过还是强烈建议英文文档，中文文档有些地方更新不及时好像...

`webpack`可以理解为一个打包器，可以把分散在不同位置的资源（`js`，`css`，`jpg`，`ts`等等）`bundle`成一个输出的文件，首页的图很好地表明了`webpack`的作用。

![](https://i.loli.net/2020/11/25/zsxLIgkJSYojhZX.png)

即使是顶破天的技术，归根结底基本是要编译成`js`，`html`，`css`以及其他的静态资源（`static assets`），因为浏览器就只认这个欸...

目前 webpack 的版本在 5（2020 年 10 月 10 号发布的），下面的链接为关于新版`webpack`的一些描述。

> [Webpack 5 release (2020-10-10)](https://webpack.js.org/blog/2020-10-10-webpack-5-release/)

似乎写的有点偏，ok，不多 bb，直接上代码就完事。

首先，需要建一个`node`的项目，使用`yarn init`来创建（其实就是初始化个`package.json`文件）。

创建完差不多是下面这样的（`index.js`文件是我自己添加的，现在是一个空的文件）。

![](https://i.loli.net/2020/11/25/3Ss1vg7LDIq5xu4.png)

现在我们全局装下`webpack`，使用`yarn global add webpack`就可以安装最新版的`webpack`了。

可以用`webpack -v`看下版本，如果第一次装的话，`webpack`还会提示你安装`webpack-cli`，按照提示安装就可以了。

![](https://i.loli.net/2020/11/25/DLU47gWtMroTlGP.png)

接下来就正式开始编写代码了。

我们现在`index.js`写个简单的`console.log`输出。

![](https://i.loli.net/2020/11/25/xh8iRrynG3DS25K.png)

接下来编写`webpack`的核心配置代码`webpack.config.js`。

在编写配置代码之前，我们需要简单的理解 webpack 中的两个配置属性。

## `entry`

> An entry point indicates which module `webpack` should use to begin building out its internal dependency graph. `webpack` will figure out which other modules and libraries that entry point depends on (directly and indirectly).  
By default its value is `./src/index.js`, but you can specify a different (or multiple entry points) by setting an entry property in the webpack configuration. ------ [entry - webpack](https://webpack.js.org/concepts/#entry)

一个入口节点表明`webpack`应该以哪个模块来开始建立它内部的依赖网，`webpack`会弄清楚入口节点依赖了哪些库或者模块（直接依赖或者间接依赖）
默认情况下的值为`./src/index.js`（也就是当前文件夹下的`src`目录下的`index.js`文件），但你也可以在`webpack`配置中通过设置 entry 属性来指定一个不同的（或者多个）入口点。

简单点讲就是指定入口的文件，`webpack`就从这个文件开始，把这个文件依赖的其他文件打包进来，而其他文件可能又依赖了其他的文件，那么就会递归这个过程。

## `output`

> The output property tells `webpack` where to emit the bundles it creates and how to name these files. It defaults to `./dist/main.js` for the main output file and to the `./dist` folder for any other generated file. ------ [output - webpack](https://webpack.js.org/concepts/#output)

output 属性告诉`webpack`在哪输出它创建的打包文件以及如何对这些文件命名。默认值为`./dist/main.js`为主要的输出文件，`./dist`文件夹存放其他任何生成的文件。

结合上面这两个，可以写出一个简单的`webpack.config.js`文件。

```javascript
const path = require("path");

module.exports = {
  // 入口
  entry: "./index.js",
  output: {
    // 生成文件存放的文件夹
    path: path.resolve(__dirname, "dist"),
    // 主要输出的js文件
    filename: "bundle.js",
  },
};
```

然后我们可以在`package.json`的`script`下新增一条命令。

```json
{
  // ...其他的配置
  "scripts": {
    "build": "webpack -c webpack.config.js"
  }
}
```

然后通过`yarn build`来执行这条命令。

![](https://i.loli.net/2020/11/25/dGQyzHqAuBpCFV3.png)

可以发现打包成功了，没有出现什么错误，并且多了一个`dist`文件夹，里面有一个`bundle.js`。

![](https://i.loli.net/2020/11/25/MJa45x9TvrP6bIB.png)

生成的`bundle.js`内容如下：

```javascript
console.log("Hello World!");
```

`webpack`在默认情况下是`production`（生产）模式，这个模式是由配置中的`mode`指定的。

可以查看该页面 [mode - webpack](https://webpack.js.org/configuration/mode/)。

可以修改配置文件为。

```javascript
const path = require("path");

module.exports = {
  mode: "development",
  // 入口
  entry: "./index.js",
  output: {
    // 生成文件存放的文件夹
    path: path.resolve(__dirname, "dist"),
    // 主要输出的js文件
    filename: "bundle.js",
  },
};
```

输出如下

```javascript
/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is not neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => {
  // webpackBootstrap
  /*!******************!*\
  !*** ./index.js ***!
  \******************/
  /*! unknown exports (runtime-defined) */
  /*! runtime requirements:  */
  eval(
    'console.log("Hello World!");\r\n\n\n//# sourceURL=webpack://webpack-test/./index.js?'
  );
  /******/
})();
```

可以发现`eval`中出现了`"console.log("Hello World!");`这句代码，这句代码对应了我们`index.js`的内容。

在顶部的多行注释中，提到了`The "eval" devtool has been used (maybe by default in mode: "development").`，也就是在开发环境下会使用`eval`这个开发工具。

在开发环境下`webpack`会默认启动一些配置，如下（这个表格可以在上面`mode`的网址里面找到，对应也有生产`mode`下默认的配置）。

```diff
// webpack.development.config.js
module.exports = {
+ mode: 'development'
- devtool: 'eval',
- cache: true,
- performance: {
-   hints: false
- },
- output: {
-   pathinfo: true
- },
- optimization: {
-   moduleIds: 'named',
-   chunkIds: 'named',
-   mangleExports: false,
-   nodeEnv: 'development',
-   flagIncludedChunks: false,
-   occurrenceOrder: false,
-   concatenateModules: false,
-   splitChunks: {
-     hidePathInfo: false,
-     minSize: 10000,
-     maxAsyncRequests: Infinity,
-     maxInitialRequests: Infinity,
-   },
-   emitOnErrors: true,
-   checkWasmTypes: false,
-   minimize: false,
-   removeAvailableModules: false
- },
- plugins: [
-   new webpack.DefinePlugin({ "process.env.NODE_ENV": JSON.stringify("development") }),
- ]
}
```

回到生产环境下的打包，可以发现生成的文件非常的简单，简答地让人怀疑是不是没打包...，为了看出打包的效果，可以稍稍写多点代码。

```javascript
console.log("Hello World!");

const el = document.getElementById("app");

el.onclick = function () {
  const array = [1, 3, 4, 2, 1, 4];
  array.sort();
  console.log(array);
};

let a = 1;

let b = 2;

console.log(a + b);
```

打包之后如下

```javascript
console.log("Hello World!"),
  (document.getElementById("app").onclick = function () {
    const o = [1, 3, 4, 2, 1, 4];
    o.sort(), console.log(o);
  }),
  console.log(3);
```

可以发现缩进和没必要的空格全部没有了，并且也优化了变量，像`el`就被省略了，由于变量`a`和`b`都没被使用，输出直接生成了一个静态的语句`console.log(3)`，省略了这两个变量。

除了`js`文件，`webpack`也支持导入其他的文件。

```javascript
// 导入样式
import style from "./css/style.css";
// ...其他代码
```

当然这样子直接编译是会报错的。

![](https://i.loli.net/2020/11/25/rEvu5yFk4C2LQNz.png)

可以看到错误信息中有一句`Module parse failed`，也就是模块解析错误。

下一句是`You may need an appropriate loader to handler this file type ...`，也就是提示我们需要一个适合的`loader`来处理这个文件。

那么就要了解`webpack`中的`loader`了。

## `loader`

> `webpack` enables use of loaders to preprocess files. This allows you to bundle any static resource way beyond JavaScript.

`webpack`使用各种 loader 来预处理文件，这允许你在`JavaScript`上打包任何静态的资源。

所以我们需要一个 loader 来处理`css`文件，使得`css`文件转成 js 能够理解的代码。

这个 loader 就是`css-loader`。

先通过`yarn add css-loader -D`来安装`css-loader`开发依赖，`-D`安装在开发依赖里面。

![](https://i.loli.net/2020/11/25/OqyPCBw3SgWzR2U.png)

修改`webpack`的配置文件。

```javascript
const path = require("path");

module.exports = {
  mode: "development",
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        // 验证规则，这里就是取到css文件，i（ignore）标志不区分大小写
        test: /\.css/i,
        // 对这些css文件使用css-loader预处理，这里是一个数组，也就是可以使用多个loader
        use: ["css-loader"],
      },
    ],
  },
};
```

然后我们输出`style`这个变量看看是什么样子。

```javascript
import style from "./css/style.css";

console.log(style);
```

我们在`dist`目录下创建一个`html`文件来引用这个`js`文件，然后看看控制台的输出。

![](https://i.loli.net/2020/11/25/PXd1cqVglY6eQKp.png)

可以看到导出了一个数组，也可以理解为`css`文件转换成了下面的`js`文件。

```javascript
const o = [["./css/style.css", ".text {↵  font-size: 18px;↵}", ""]];

o.i = function (modules, mediaQuery, dedup) {
  // ...
};

o.toString = function () {
  // ...
};

export default o;
```

在使用 Vue 的时候，可能会发现开发环境下每个组件的样式会通过`style`标签来插入到`DOM`中，这就使用到了另一个`loader` - `style-loader`。

可以安装这个`loader`，运行`yarn add style-loader -D`。

然后修改配置文件如下：

```javascript
const path = require("path");

module.exports = {
  mode: "development",
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        // 验证规则，这里就是取到css文件，i（ignore）标志不区分大小写
        test: /\.css/i,
        // 对这些css文件使用css-loader预处理，这里是一个数组，也就是可以使用多个loader
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};
```

然后我们运行打包，打开网页会发现在`head`中插入了对应的样式，并且`style`变量为一个空的对象。

![](https://i.loli.net/2020/11/26/AHoTnwLSY2GIuyO.png)

![](https://i.loli.net/2020/11/26/FycMgfjRqCkGTuV.png)

这里可能有疑问的就是`loader`的执行顺序问题。

官方在[Loader - Using Loader - Configuration](https://webpack.js.org/concepts/loaders/#configuration)一节的文档中明确指出，`loader`是从右往左进行执行的。

> Loaders are evaluated/executed from right to left (or from bottom to top).

在[Loader Features](https://webpack.js.org/concepts/loaders/#loader-features)一节指出了`loader`的特性。

每个`loader`也有自己的配置，在`use`中，我们可以以一个对象来表示一个`loader`。

```javascript
const path = require("path");

module.exports = {
  // ...
  module: {
    rules: [
      {
        // 验证规则，这里就是取到css文件，i（ignore）标志不区分大小写
        test: /\.css/i,
        // 对这些css文件使用css-loader预处理，这里是一个数组，也就是可以使用多个loader
        use: [{ loader: "style-loader" }, { loader: "css-loader" }],
      },
    ],
  },
};
```

像`style-loader`，除了通过`style`标签注入之外，也有其他的一些注入方式。

`style-loader`的仓库地址[webpack-contrib/style-loader](https://github.com/webpack-contrib/style-loader)

在`README`中，也为我们写明了这些配置。

![](https://i.loli.net/2020/11/26/1ifwxKroYpAatuz.png)

其中`injectType`为配置注入的方式。

![](https://i.loli.net/2020/11/26/4zjdsZp2oKnuN8e.png)

可以通过每个`loader`对象的`options`来配置，这里使用了`singletonStyleTag`，也就是只插入一个单独的`style`标签。

```javascript
const path = require("path");

module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.css/i,
        use: [
          {
            loader: "style-loader",
            options: {
              injectType: "singletonStyleTag",
            },
          },
          { loader: "css-loader" },
        ],
      },
    ],
  },
};
```

然后写另一个 css 文件

```javascript
import style from "./css/style.css";
import another from "./css/another.css";

console.log(style);
console.log(another);
```

然后打包，打开浏览器，发现`head`中只有一个`style`标签了。

![](https://i.loli.net/2020/11/26/geRVMri9ytvdm5U.png)

如果不加情况下（默认为`styleTag`），那么会是两个`style`标签，如下：

![](https://i.loli.net/2020/11/26/MbOrActZhipkS1E.png)

到现在为止看起来很不错，webpack 发挥了他的功能，也就是**打包**。

不过还有一点不够智能，我们希望`html`文件也可以自动的生成，那就非常完美了，我们只需在开启一个本地的服务器来绑定`dist`这个目录，然后每一次打包之后就可以直接打开浏览器就可以看到结果。

这就需要用到`webpack`的另一个配置`plugin`（插件）了

## `plugin`

[Plugins - webpack](https://webpack.js.org/concepts/#plugins)

> While loaders are used to transform certain types of modules, plugins can be leveraged to perform a wider range of tasks like bundle optimization, asset management and injection of environment variables.

loader 用于转化某些模块的类型，而 plugin 被用来执行一些更广泛的任务，比如打包优化，资源管理以及环境变量的注入。

可以简单理解为`plugin`的功能更加的强大，可以完成一些做不到的事情，而`loader`主要的功能就是转换文件类型。

像为了可以自动生成一个`HTML`文件，可以使用`HtmlWebpackPlugin`。

插件也要安装对应的`npm`包，执行`yarn add html-webpack-plugin -D`来安装插件。

然后修改配置文件，新增`plugins`属性。

```javascript
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  // ...
  plugins: [new HtmlWebpackPlugin()],
};
```

不过这样子编译的话会出现错误，原因应该是插件需要用到项目的`webpack`，而不能使用全局的`webpack`。

![](https://i.loli.net/2020/11/26/mtnzJy9APc8RG6g.png)

这里解决办法可以装个项目的`webpack`依赖，`yarn add webpack -D`。

或者链接下全局的`webpack`，`yarn link webpack -D`。

这里我使用的是后面的方法。

注意，在执行`yarn link webpack -D`，需要在`webpack`的包下面执行`yarn link`来注册`webpack`。

![](https://i.loli.net/2020/11/26/uRQ2dWvBKnXU1HY.png)

接着我们删除`dist`文件夹，然后打包。

![](https://i.loli.net/2020/11/26/A4Kamzi5xtIEDfH.png)

发现打包成功了，而且也自动生成了`HTML`文件，并且引用了生成的`bundle.js`。
