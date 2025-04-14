---
title: browserslist 学习
tags:
  - browserslist
categories:
  - 编程
key: 1675241276date: 2023-02-01 16:47:56
updated: 2023-02-17 18:03:31
---


# 前言

> The config to share target browsers and Node.js versions between different front-end tools

一个能在不同前端工具中共享目标浏览器和 `node` 版本的配置

<!-- more -->

很多时候我们打包一个项目很多时候都交给三大框架的 `cli` 工具

`vue-cli`，`create-react-app` 以及 `angular-cli`，使用三大框架的时候大部分情况下我们都无需在意兼容问题

框架本身就依赖了一些新的特性，比如 `Vue3` 的响应式核心 `Proxy`

又或者是像 `vite` 这样的工具，暴露了一个 `build.target` 可以让我们设置 `ECMA` 版本

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/01/31/202301311628611.avif)

当然我们在这里也是可以设置浏览器的版本的，不过我基本用不到这个选项，一般都是直接设置成 `es2015` 的

而这个所谓的浏览器版本指定，就是这个帖子要写的内容

# 正文

我们都知道 `js` 有一套标准，即 `ECMAScript` ，每年 `ECMA` 都会发布一些新的特性

然后浏览器厂商就会开始跟进，在各自的浏览器上实现

比如 `ES2022（ES13）` 新增的一些新特性

- 顶层 `await`
- 类私有变量（`#` 修饰）
- 类的静态执行块

落实到浏览器上，我们可以通过 [Can i use](https://caniuse.com/) 查询对应特性的兼容情况

比如我们查询 `top await` ，兼容如下图

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/01/31/202301311642398.avif)

可以看到兼容性还是相当不错的，当然 `IE` 就完全不支持了，毕竟已经被微软判“死刑”了，距离刑期（2023.02.14）也不远了

无论是什么特性，最终落实的都是浏览器厂商，而且浏览器不止 `js` 而已， `css` 也包含其中

而 `browserslist` 的本质为指定一组浏览器的版本，而不是宏观上标准的版本

像 `babel` `postcss` 都可以依赖 `browserslist` 来对代码进行构建

`browserslist` 的仓库地址 [browserslist / browserslist](https://github.com/browserslist/browserslist)

`browserslist` 支持很多的配置形式

比如最常见的就是在 `package.json` 中配置 `browserslist` 字段

```json5
{
  "name": "browserslist-learn",
  "version": "0.0.1",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
  },
  "dependencies": {},
  "browserslist": [
    // ...
    "defaults"
  ]
}
```

或者在项目根目录下创建一个 `.browserslistrc` 的配置文件

```text
# ...相关配置

defaults
```

可以看到我们这里配了个字符串 `defaults` ，这个是一个配置的简化形式

它真正的值为 `> 0.5%, last 2 versions, Firefox ESR, not dead`

这里有几个书写形式，`> 0.5%` ， `last n version` ， `Firefox XX` 以及 `not dead`

## 查询

### not dead

这里的 `not` 是一个修饰词，主要需要理解的是 `dead` 的语义

`dead` 的意思是包含已经一年没有官方更新过的浏览器，目前来说，这些浏览器包括 `IE11` ， 移动端 `IE11`，黑莓浏览器 `10` 和 `7` 的版本，三星浏览器 `4` 的版本，移动端欧朋浏览器的 `12.1` 版本以及所有版本的百度浏览器

而加了修饰词 `not` 之后，意思就是取反

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011008158.avif)

### > 0.5%

这里的大于号也是一个修饰符，主要理解后面的百分数的语义

`0.5%` 的意思是某个版本的浏览器在全球市场上所占的份额，这个我们可以在 [browsersl.ist](https://browsersl.ist/) 上查询

比如我们查询大于 `10%` 的份额的所有浏览器，这里写成 `> 10%` 即可

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011020822.avif)

可以看到只有两个版本的浏览器符合，一个是安卓的 `Chrome 109` 版本（占比 `41.5%` ），一个是 `PC` 上的 `Chrome 108` 版本（占比 `16.8%` ），合起来占比 `58.4%`

除了 `>` ，我们也可用其他比较符号，比如 `>=` ， `<` ， `<=` 

比如再查询一个 `<= 10%` 的浏览器

![截图仅包含部分](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011027269.avif)

### last n versions

这里的 `n` 为一个数字，表示包含从当前最新版本开始往后计数 `n` 个版本的浏览器

比如 `last 1 versions` ，那么意思就是包含浏览器的最新版本

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011044988.avif)

当然也可以指定某个型号的浏览器，比如 `last 1 chrome versions` 就只有 `Chrome` 的最新版本了

### Firefox ESR

这里的意思是指定火狐最新的 Extended Support Release (ESR) 版本

当然这里是一种比较特殊的写法，通常情况下，我们可能会写成 `Firefox >= n` 这种形式

或者 `Firefox n` 直接指定特定的版本，或者范围版本查询 `Firefox n1-n2`

比如我们查询 `Firefox >= 100`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011102571.avif)

指定版本查询 `Firefox 100`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011103627.avif)

指定版本范围 `Firefox 100-105`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011104849.avif)

当然，这并不是说只能查询火狐，我们查询 `Chrome` 的话只要把前面名称换掉即可

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011107480.avif)

## 组合

上面就是比较常见的版本号的书写方式了，还有一些比较少见的方式，这里就不写了，完整的可以查看仓库的 [README](https://github.com/browserslist/browserslist#full-list)

除了查询， `browserslist` 还提供了一种查询组合操作，主要其实就三个， `or` ， `and` 和 `not`

其中 `or` 为取并集， `and` 为取交集，而 `not` 取补集

其中 `or` 可以用逗号 `,` 来代替

前面我们说过的 `> 0.5%, last 2 versions, Firefox ESR, not dead` ，等价于 `> 0.5% or last 2 versions or Firefox ESR or not dead`

<style>
.tb_img { display: block; max-width: 150px; margin-top: 0; margin-bottom: 0 !important; }
</style>

| 操作类型       | 图解                                                                                                        | 例子                                                                                                                         |
|------------|-----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| `or` / `,` | <img class="tb_img" src="https://fastly.jsdelivr.net/gh/browserslist/browserslist/img/union.svg"/>        | `> .5% or last 2 versions` <br />`> .5%, last 2 versions`                                                                  |
| `and`      | <img class="tb_img" src="https://fastly.jsdelivr.net/gh/browserslist/browserslist/img/intersection.svg"/> | `> .5% and last 2 versions`                                                                                                |
| `not`      | <img class="tb_img" src="https://fastly.jsdelivr.net/gh/browserslist/browserslist/img/complement.svg"/>   | 下面三个等价: <br > `> .5% and not last 2 versions` <br >`> .5% or not last 2 versions` <br > `> .5%, not last 2 versions` <br > |

PS：表格来自官方 `README` 文档

这里面比较奇特的就是 `not` 和 `or`/`and` 连用了，注意我们无法直接以 `not` 直接开头来查询，这在语法上是错误的

![红色的英文提示了必须在 not dead 前放上其他查询](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011419218.avif)

和 `or`/`and` 此时只表示[相对补集（点击跳转到百度百科）](https://baike.baidu.com/item/%E7%9B%B8%E5%AF%B9%E8%A1%A5%E9%9B%86/942337?fromtitle=%E7%BB%9D%E5%AF%B9%E8%A1%A5%E9%9B%86&fromid=942400&fr=aladdin)的意思

比如我们现在写 `Chrome 100-102, not Chrome 100` 此时结果为 `Chrome 101-102`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011434693.avif)

在 `package.json` 中配置 `browserslist` 字段时，可以用字符串，也可以用数组，数组每一项的连接为 `or` 

为了明确我们的项目所设定的浏览器版本范围，我们可以使用 `npx browserslist` 命令

比如我们在 `package.json` 的 `browserslist` 字段加入如下值

```json
{
  "browserslist": [
    "Chrome 100",
    "Chrome 101"
  ]
}
```

然后我们执行 `npx browserslist` ，得到如下结果

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011452067.avif)

如果我们改为

```json
{
  "browserslist": [
    "Chrome 100-101",
    "not Chrome 101"
  ]
}
```

此时就只有 `Chrome 100` 了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011453140.avif)

## 应用

### Babel

对于 `Babel` 来说， `browserslist` 可以帮助 `Babel` 生成相对应的 `polyfill`

这里我们以 `Promise.resolve` 为例，支持 `Promise.resolve` 的最低 `Chrome` 版本为 `32` ，我们就设置为 `32`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302012245086.avif)

我们在 `package.json` 中设置 `browserslist` 属性为如下

```json
{
  "browserslist": [
    "Chrome 32"
  ]
}
```

然后我们配置下 `Rollup` 的配置文件 `rollup.config.js` ，添加 `Babel` 相关的依赖

```js
import { defineConfig } from "rollup";
import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default defineConfig({
  input: "src/main.js",
  output: {
    file: "dist/bundle.js",
    format: "cjs",
  },
  plugins: [
    babel({
      babelHelpers: "runtime",
      extensions: ["js"],
      exclude: ["node_modules/**"],
      presets: ["@babel/env"],
      plugins: [
        // 自动添加垫片的关键
        [
          "@babel/transform-runtime",
          {
            corejs: 3,
          },
        ],
      ],
    }),
    resolve({
      browser: true,
    }),
    commonjs(),
  ],
});
```

然后我们在 `src/main.js` 中写下如下代码

```js
Promise.resolve().then(() => {
  console.log("resolve");
});
```

执行 `npx rollup --config rollup.config.js`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011514275.avif)

可以看到打包后的内容并没有什么变化

然后我们把版本降低一下，降为 `Chrome 31` ，再次打包

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011521531.avif)

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011522445.avif)

发现此时添加了 `Promise` 的垫片

### Autoprefixer

除了 `Babel` ，`CSS` 中的 `PostCSS` 中的 `Autoprefixer` 插件也会根据相应的浏览器添加相关的前缀，这个也是非常常用的插件，省去了我们去写一些 `CSS` 前缀的工作量

这里我们用 `CSS` 的 `Flex` 布局来做测试，在 `Chrome 21-28` 下，`Flex` 需要 `-webkit-` 前缀

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011618691.avif)

而 `28` 以上就不用了

我们在 `package.json` 中设置 `browserslist` 属性为如下

```json
{
  "browserslist": [
    "Chrome 29"
  ]
}
```

我们配置下 `rollup.config.js`

```js
import { defineConfig } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import postcss from "rollup-plugin-postcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  input: "src/main.js",
  output: {
    file: "dist/bundle.js",
    format: "cjs",
  },
  plugins: [
    postcss({
      plugins: [autoprefixer()],
    }),
    resolve({
      browser: true,
    }),
    commonjs(),
  ],
});
```

然后我们写个 `src/main.css` 文件

```css
.flex {
  display: flex;
}
```

然后我们在 `src/main.js` 里面引用这个 `CSS`

```js
import "./main.css";
```

然后打包

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011635341.avif)

发现生成的 `CSS` 并没有前缀，我们改成 `Chrome 28`， 再打包

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/01/202302011642119.avif)

发现添加上了 `-webkit-` 前缀

# 后记

`browserslist` 平时可能见得不多，因为很多时候都被 `cli` 给默认处理好了

现在就能看懂了，并且也能试着配置一些浏览器版本了，也算是扩展了自己的知识面吧...