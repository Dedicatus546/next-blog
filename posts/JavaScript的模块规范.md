---
title: JavaScript的模块规范
key: 1628332555date: 2021-08-07 18:35:55
updated: 2023-02-13 18:28:45
tags:
  - JavaScript
  - 模块
categories:
  - 笔记
---


`JavaScript`的模块规范

<!-- more -->

主要有以下几种规范：

- `AMD`
- `CMD`
- `CommonJS`
- `UMD`
- `ES6 module`

# AMD（Asynchronous Module Definition）

实现库：

[RequireJS](https://requirejs.org/)

> RequireJS is a JavaScript file and module loader. It is optimized for in-browser use, but it can be used in other JavaScript environments, like Rhino and Node. Using a modular script loader like RequireJS will improve the speed and quality of your code.

`RequireJS`是一个`JavaScript`文件和模块的加载器，为浏览器的使用做了优化，但是也可以在其他的`JavaScript`环境中使用，比如`Rhino`和`Node`。使用像`RequireJS`一样的模块化的脚本加载器能够提高代码的加载速度和质量。

直接在浏览器引入即可使用，或者下载到项目中，`CDN`地址：[https://cdn.bootcdn.net/ajax/libs/require.js/2.3.6/require.js](https://cdn.bootcdn.net/ajax/libs/require.js/2.3.6/require.js)。

使用`http-server`跑一个简易的`http`服务器，项目目录如下：

![](https://z3.ax1x.com/2021/08/08/flN4bR.png)

定义一个`util`模块。

```javascript
define(function () {
  function add(a, b) {
    return a + b;
  }

  function cut(a, b) {
    return a - b;
  }

  return {
    add,
    cut,
  };
});
```

编写`index.html`：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>模块化</title>
  </head>
  <body>
    <div>RequireJS</div>
    <script src="script/require.js" data-main="script/main.js"></script>
  </body>
</html>
```

通过`data-main`我们可以指定当`RequireJS`加载完毕之后执行的第一个`js`文件，一般叫这个文件为入口文件（`Entry Point`）。

编写`main.js`文件：

```javascript
require(["util"], function (util) {
  console.log(util);
  console.log(util.add(1, 2));
});
```

`require`函数第一个参数指定需要的依赖数组，第二个参数以回调函数的形式，当指定的依赖加载完毕时，运行回调函数。

这里指定了`util`模块，那么回调函数的第一个参数就为`util`模块返回的对象。

![](https://z3.ax1x.com/2021/08/08/flUoLj.png)

`AMD`的特点是依赖前置，即回调函数一定在模块**执行**完毕之后才会执行，即使某些模块在代码中存在不使用到的情况，比如：

```javascript
// 假定存在module1和module2模块
require(["module1", "module2"], function (m1, m2) {
  let isUseM2 = true;
  // 一些计算
  // 现在isUseM2可能不是true了
  if (isUseM2) {
    m2.func(); // 使用m2的某个功能
  }
});
```

同时`AMD`定义的模块都是异步加载的，以上面的例子，我们可以通过控制台查看`DOM`情况，发现`RequireJS`插入了两个`script`标签来加载相应的模块，这两个`script`都添加了`async`属性，也就不会阻塞到`DOM`的渲染了。

![](https://z3.ax1x.com/2021/08/08/fla7cD.png)

引入和加载模块的工作交给了`RequireJS`，没有必要手写进`index.html`文件中，只需以`RequireJS`定义的模式向`RequireJS`表明需要的模块即可，即通过`require`函数的第一个参数来指定模块。

# CMD（Common Module Definition）

实现库：

[SeaJS](seajs.github.io/seajs/)

PS：文档页可能打不开，可以把项目拉到本地，打开`doc/index.html`即可查看文档。`git`地址`https://github.com/seajs/seajs.git`。

![](https://z3.ax1x.com/2021/08/08/flwOYt.png)

文档首页：

![](https://z3.ax1x.com/2021/08/08/flwz6S.png)

`SeaJS`是由国内开源的项目，由腾讯，阿里共同维护，不过现在基本没人维护了，最近一次`push`已经是`3`年前了（和`RequireJS`一样）。

和`RequireJS`一样，可以使用`CDN`也可以下载到本地引入，[https://cdn.bootcdn.net/ajax/libs/seajs/2.3.0/sea.js](https://cdn.bootcdn.net/ajax/libs/seajs/2.3.0/sea.js)

在`SeaJS 2.1`版本删除了对`data-main`的支持，现在使用`seajs.use`来代替`data-main`来启动主模块。

`html`修改如下：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>模块化</title>
  </head>
  <body>
    <div>SeaJS</div>
    <script src="script/sea.js"></script>
    <script>
      // 加载主模块main.js
      seajs.use("./script/main.js");
    </script>
  </body>
</html>
```

使用`define`函数来定义模块`util`：

```javascript
define(function (require, exports, module) {
  function add(a, b) {
    return a + b;
  }

  function cut(a, b) {
    return a - b;
  }

  return {
    add,
    cut,
  };
});
```

在`main`模块中使用`util`模块：

```javascript
define(function (require, exports, module) {
  const util = require("util.js");
  console.log(util);
  console.log(util.add(1, 2));
});
```

然后就可以看到如下的效果图：

![](https://z3.ax1x.com/2021/08/08/flvuKP.png)

可以看出`CMD`的理念是依赖后置，或者说依赖就近，即无需提前**执行**完当前模块需要的全部依赖模块的逻辑即可执行本模块的函数，模块只在需要的时候才被执行对应的函数然后`require`进来，即用即返，这里是一个同步执行的概念。

比如之前在`RequireJS`中的例子，在`SeaJS`中为如下：

```javascript
// 假定存在module1和module2模块
define(function (require) {
  let isUseM2 = true;
  // 一些计算
  // 现在isUseM2可能不是true了
  if (isUseM2) {
    // 这里才执行module2的模块的逻辑
    const m2 = require("module2");
    m2.func(); // 使用m2的某个功能
  } else {
    // 这里不会加载module2
  }
});
```

# CommonJS

`CommonJS`是服务端（`NodeJS`）所使用的一套规范，它使用同步加载机制来加载模块。

由于在服务端运行，`CommonJS`在引入和执行都是同步的，这和`AMD`和`CMD`有着本质的不同的，后两者在引入阶段都是异步的。`AMD`在执行阶段是异步的，而`CMD`为同步的。引入可以理需要执行的解为使用`HTTP`来获取一个`js`文件，而执行可以理解为模块本身所逻辑。比如上面例子中`util`模块，在模块的函数中需要定义`add`函数和`cut`函数，这为模块的执行阶段。

`CommonJS`其实和`CMD`都是相似的，`CommonJS`也定义每个文件为一个模块，每个模块可以通过`require`来引入需要的依赖，通过`module.exports`或者`exports`来返回模块需要暴露给第三方的接口。

可以将`util.js`改造为如下：

```javascript
// util.js
function add(a, b) {
  return a + b;
}

function cut(a, b) {
  return a - b;
}

// 暴露给外界的API
module.exports = {
  add,
  cut,
};
```

在`main`中使用`util`模块：

```javascript
const util = require("./util");
console.log(util.add(1, 2));
```

由于`CommonJS`只能在`Node`中运行，所以需要使用`Node`来启动`main.js`，启动之后就可以看到如下的效果：

![](https://z3.ax1x.com/2021/08/08/f1AYuQ.png)

# UMD（Universal Module Definition）

`UMD`为通用模块定义规范，让产出的代码兼容不同的模块规范。

比如如下代码（取自`webpack`中`output.library.type`为`umd`的打包代码片段）：

```javascript
(function webpackUniversalModuleDefinition(root, factory) {
  if (typeof exports === "object" && typeof module === "object") {
    // commonjs2
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    // amd
    define([], factory);
  } else if (typeof exports === "object") {
    // commonjs
    exports["MyLibrary"] = factory();
  } else {
    // 挂载到全局
    root["MyLibrary"] = factory();
  }
})(global, function () {
  // 逻辑
});
```

# ES6 module

`es6`实现了模块功能，主要通过两个关键字`import`和`export`。

修改`util.js`文件为如下：

```javascript
export function add(a, b) {
  return a + b;
}

export function cut(a, b) {
  return a - b;
}
```

修改`main.js`为如下：

```javascript
import { add } from "./util.js";

console.log(add);
console.log(add(1, 2));
```

然后需要在`index.html`中通过`script`的`type=module`来引入`main.js`：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>模块化</title>
  </head>
  <body>
    <div>es6 module</div>
    <!-- type="module" -->
    <script src="/script/main.js" type="module"></script>
  </body>
</html>
```

然后访问浏览器，效果如下：

![](https://z3.ax1x.com/2021/08/09/f1WWPU.png)

# `CommonJS`和`ES6 Module`区别

看起来`es6`的模块代码写起来和`CommonJS`差不多，但是他们有着本质的区别。

- `CommonJS`模块输出的是一个值的拷贝，`ES6 Module`模块输出的是值的引用；
- `CommonJS`模块是运行时加载，`ES6 Module`是编译时输出接口；
- `CommonJS`是单个值导出，`ES6 Module`可以导出多个；
- `CommonJS`是动态语法可以写在判断里，`ES6 Module`静态语法只能写在顶层；
- `CommonJS`的`this`是当前模块，`ES6 Module`的`this`是`undefined`；

以上的分点来自这：[CommonJS 和 ES6 module 的区别是什么呢？](https://www.zhihu.com/question/62791509/answer/1535800470)

第一点可以用一个小例子来说明。

```javascript
// CommonJS 模块 util.js
let count = 1;

function addOne() {
  count++;
}

function getCount() {
  return count;
}

module.exports = {
  count,
  addOne,
  getCount,
};
```

当我们引入这个模块使用`addOne`进行`count`自增时，导出的`count`并不会发生改变。

```javascript
// CommonJS 模块 test.js
const { count, addOne, getCount } = require("./util.js");
// 导出的count为1
console.log(count);
// 给count自增
addOne();
// 还是为1
console.log(count);
// 内部的值变为了2
console.log(getCount());
```

输出如下：

![](https://z3.ax1x.com/2021/08/14/fyAvgx.png)

其实不难解释，当我们在最后通过`module.exports`导出时，有一个赋值的过程。

```javascript
module.exports = {
  count: count,
  // ...
};
```

这时候导出的`count`就和内部的`count`不是一个指向了。

如果使用`ES6 Module`：

```javascript
// ES6 Module 模块 util.mjs
export let count = 1;

export function addOne() {
  count++;
}

export function getCount() {
  return count;
}
```

```javascript
// ES6 Module 模块 test.mjs
import { count, addOne, getCount } from "./util.js";
// 导出的count为1
console.log(count);
// 给count自增
addOne();
// 变为2
console.log(count);
// 内部的值也变为了2
console.log(getCount());
```

效果如下：

![](https://z3.ax1x.com/2021/08/14/fyVO6x.png)

能够使用`CommonJS`写出类似`ES6 Module`的效果吗，当然是可以的，只需要以引用的方式使用`count`即可。

```javascript
// CommonJS 模块 util.js
function addOne() {
  exports.count++;
}

function getCount() {
  return exports.count;
}

module.exports = {
  count: 1,
  addOne,
  getCount,
};
```

效果就和`ES6`的一样了。

第二点和第四点一起解释可能会更容易理解，`CommonJS`是`Node`上的模块化，其实现的原理是构建一个`Module`对象，通过给代码文本包装到一个函数中，使得我们能够使用`module.exports`、`exports`这些变量，即：

```javascript
function module(exports, require, module, __filename, __dirname) {
  // 文件里的代码都会以字符串的形式拼接到这里。
}
```

而`ES6 Module`不是使用函数封装的方式进行模块化，而是直接从语法层面提供了模块化的功能。

即`ES6 Module`会在程序开始前先根据模块关系查找到所有模块，将所有模块实例都创建好。

这也可以从第四点看出来，由于`CommonJS`可以动态的引入，所以只要你想，完全可以在一个模块的任何地方使用`require`引入相应的模块。

而`ES6 Module`则不行，因为运行前需要分析引入情况所，所以只能将有的`import`写在代码的开头。这也是`Tree-Shaking`（摇树）优化的原理。

第三点可以理解为`CommonJS`本质就是导出一个对象，这个对象为`module.exports`或者`exports`，这两者都指向了一个初始的空对象。

而`ES6 Module`仅仅只是对需要导出的对象做标记而已，即使用`export`去标明需要导出的变量。

如果在运行中使用了未导出的属性，`CommonJS`会在运行时可能会报错，而`ES6 Module`在分析阶段就会直接报错了。