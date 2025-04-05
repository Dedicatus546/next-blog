---
title: >-
  记录使用 electron 的一次经历
tags:
  - electron
  - vue
  - react
  - vuetify
  - ant-design-vue
categories:
  - 编程
date: 2024-11-06 18:26:39
updated: 2024-11-28 15:11:03
key: 1732777863
---


# 前言

记录使用 electron 的一次经历。

<!-- more -->

已经快一个月没有写帖子了，时间过的好快，转眼就又到年末了。

一号才从老家回到广州，歇了差不多一个月，这段时间也是用 electron + vue 开发了一个桌面软件。

项目 github 地址：[jm-desktop](https://github.com/Dedicatus546/jm-desktop)

这篇帖子就记录下这一个月的过程。

# 正文

## 前期准备

首先，在编写之前，分析了接口加密以及图片编码的原理，这部分在下面两篇帖子中。

- [记一次分析某漫接口密钥](https://prohibitorum.top/202da2aab6d1)
- [记一次分析某漫的图片](https://prohibitorum.top/d5936495bfca)

## 技术选型

Web 菜鸡，什么 Qt 、 winui 都不会，只能用 electron 来做套壳应用，这对我来说上手最快，并且可以快速实现需要的功能。

最开始的时候选择了 electron + react + ant-design ，写到一半发现 hold 不住 react ，写的太别扭了，果断换成了 electron + vue + ant-design-vue ，再写到一半发现 ant-design-vue 写出来像一个后台管理系统，并且社区维护不积极，果断转到 vuetify 上。

所以最后的技术栈就是 electron + vue ，组件库选择了 vuetify 。以及一些杂七杂八的库。

## 需求

对于一个第三方的漫画 APP ，核心的功能我觉得就两个，一个是搜索、一个是浏览，细分下来就是：

- 搜索页
- 漫画详情页
- 漫画阅读页

其他都是甜头，比如什么首页，每周推荐，评论，甚至登录（除非需要登录才能查看）等等。

所以当时基本上是先实现这些核心的模块。

## 相关资源

### 项目模板

使用 electron + vue ，自己搭环境就太慢了（~~并不是我不会~~），直接使用下面这个模板。

项目地址： [electron-vite-vue](https://github.com/electron-vite/electron-vite-vue)

electron-vite 这个组织开源了多个项目，包括和 vue 或者 react 集成的模板，以及开箱即用的 vite 插件，省去了自己搭建目录，对于我这个体量的项目完全够用了。

使用 electron-vite-vue 还有一个好处就是 electron 主进程的代码直接可以使用 TypeScript ，太棒了。

### 组件库

这里选用了 [vuetify](https://vuetifyjs.com/zh-Hans/getting-started/installation/#section-5b8988c5) ，它是一个基于 material 的组件库，组件全面（不过 material 感觉和国内的审美水土不服，看多了国内的 app ，再看谷歌系的总感觉到了另一个次元）。

配合 [unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components) 插件完成自动导入，省略很多 import 语句 。

```javascript
// vite.config.ts
import { Vuetify3Resolver } from "unplugin-vue-components/resolvers";
import component from "unplugin-vue-components/vite";


export default defineConfig({
  // ...
  plugins: [
    // ...
    component({
      resolvers: [Vuetify3Resolver()],
    }),
  ],
});
```

启动之后会生成 `components.d.ts` 文件，注意要将它加入到 TypeScript 中，这样可以得到模板中的类型提示。

```json
// tsconfig.json
{
  // ...
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.vue",
    "electron",
    "auto-imports.d.ts",
    "components.d.ts"
  ],
}
```

PS：之前在使用 ant-design-vue 的时候，发现了一个 bug ，但是提交到了 issue 上还没修（虽然我也不确定到底是 bug 还是特性），果然还是得有官方的团队的组件库才比较可信...

这里贴上 issue 地址：[the args of notification.useNotification does not work](https://github.com/vueComponent/ant-design-vue/issues/7875) 。

也不知道要多久才能处理这个 issue ...

### 原子 css

这里使用了 [unocss](https://unocss.dev/guide/) 来生成 css 类，主要是使用一些工具类，使用较多的是 flex 相关的。

首先要在 vite 中添加 unocss 插件。

```javascript
// vite.config.ts
import unocss from "unocss/vite";

export default defineConfig({
  // ...
  plugins: [
    // ...
    unocss(),
  ],
});
```

然后额外创建一个 `uno.config.ts` 文件。

```javascript
// uno.config.ts
import { defineConfig, presetWind } from "unocss";

export default defineConfig({
  presets: [presetWind()],
  rules: [
    [
      "app-region-drag",
      {
        "-webkit-app-region": "drag",
      },
    ],
    [
      "app-region-nodrag",
      {
        "-webkit-app-region": "no-drag",
      },
    ],
  ],
});
```

这里我们配置了 tailwind 规则，以及多生成了两个类，主要是来快速处理头部部分是否能够拖动的情况。

最后在 `main.ts` 中导入 `uno.css` 即可

```javascript
// src/main.ts
import "virtual:uno.css";

// ...
```

### 接口请求

以往基本上都是用 axios 的，这次用了 [alova](https://alova.js.org/zh-CN/) ，它附带的功能更多，而且内置了 useRequest 、 usePagination 的组合式 api ，大大减少了很多样板代码，很棒，以及提供了接口缓存，这样子在某些接口上开启缓存，可以减少接口调用次数，切换页面的体验上升很多。

alova 和 axios 在某种情况下还是很像的，都是创建一个请求实例，用这个实例来发起 Get 、Post 等请求。

```typescript
// src/apis/http.ts
import { xhrRequestAdapter } from "@alova/adapter-xhr";
import { createAlova } from "alova";
import vueHook from "alova/vue";

const http = createAlova({
  statesHook: vueHook,
  requestAdapter: xhrRequestAdapter(),
  baseURL: "/api",
  beforeRequest(method) {
    // ...
  },
  responded: {
    async onSuccess(response, method) {
      // ...
    },
  },
});
```

这里 `onSuccess` 就和 axios 中的拦截器差不多， `beforeRequest` 在请求前添加一些全局的请求头，注意这里使用了 `xhrRequestAdapter` ，即基于 XMLHttpRequest 封装的适配器，由于 fetch 适配器不支持获取上传下载进度，而功能里面有下载漫画，所以需要使用 `xhrRequestAdapter` 。 `vueHook` 则让 alova 能够在 setup 中使用组合式的 api ，这里用的最多的就是 `useRequest` 和 `usePagination` ，特别是 `usePagination` 相当的方便，很多的列表页都只要一个 `usePagination` 就能拿到大部分的状态。

接着我们只需要编写相应的业务请求即可，比如：

```typescript
// src/apis/ajax.ts
export const loginApi = (username: string, password: string) => {
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);
  return http.Post<
    RespWrapper<{
      uid: number;
      username: string;
      email: string;
      avatar: string;
      jCoin: number;
      level: [number, string];
      currentExp: number;
      nextLevelExp: number;
      collectCount: number;
      maxCollectCount: number;
    }>,
    RespWrapper<{
      uid: string;
      username: string;
      email: string;
      emailverified: string;
      photo: string;
      fname: string;
      gender: string;
      message: string;
      coin: number;
      album_favorites: number;
      s: string;
      level_name: string;
      level: number;
      nextLevelExp: number;
      exp: string;
      expPercent: number;
      badges: unknown[];
      album_favorites_max: number;
      ad_free: boolean;
      ad_free_before: unknown;
      charge: string;
      jar: string;
    }>
  >("login", formData, {
    transform(res) {
      return {
        code: res.code,
        data: {
          uid: Number.parseInt(res.data.uid),
          username: res.data.username,
          email: res.data.email,
          avatar: res.data.photo,
          jCoin: res.data.coin,
          level: [res.data.level, res.data.level_name],
          currentExp: Number.parseInt(res.data.exp),
          nextLevelExp: res.data.nextLevelExp,
          collectCount: res.data.album_favorites,
          maxCollectCount: res.data.album_favorites_max,
        },
      };
    },
  });
};
```

这里有两个注意的点

一个是封装的时候不要添加 async ，即 `loginApi` 不要加 async ，不然 setup 内传入 `useRequest` 和 `usePagination` 会提示类型错误，原因是 `http.Post` 返回的是一个 `Method` 类型，它是一个类 Promise 而不是 Promise ，如果我们直接调用 `loginApi('username', 'password')` 是不会发起请求的，只有 `loginApi('username', 'password').then()` 才会。

另一个是 `http.Post` 的两个泛型分别是转换后类型以及转换前类型，如果接口需要进行数据转化的话，填写这两个类型可以在 `transform` 内获得良好的类型提示，如果不需要转化则直接编写第一个泛型即可。

在 setup 中，使用 `usePagination` 可以获取绝大部分的状态：

```html
<script setup lang="ts">
import { usePagination } from "alova/client";
import { getComicListApi } from "@/apis";

const { 
  total,        // 总条数
  page,         // 当前页码
  pageSize,     // 每页大小
  pageCount,    // 有多少页
  data,         // 列表数据
  send,         // 发起请求函数
  loading       // 加载状态
} = usePagination(
  (page) =>
    getComicListApi({
      page,
      content: formState.content,
      order: formState.order,
    }),
  {
    // 默认起始页和页大小
    initialPage: 1,
    initialPageSize: 80,
    // 这里 data 和 total 就是返回 data 和 total 所拿到的值
    data: (res) => res.data.content,
    total: (res) => res.data.total,
    // 这里可以设置额外的参数，这样 formState.order 变化时会直接重新发起请求
    watchingStates: [() => formState.order],
  },
);
</script>
```

### 主进程的 ioc

既然是自己写的项目，那就得玩玩一些平时用不上的东西。

所以这次我在项目里面使用了微软的依赖注入库 [tsyringe](https://github.com/microsoft/tsyringe) 。

这是一个轻量的 IOC 库，用法也很简单，和 spring 很相似。

首先我们要在 `tsconfig.json` 内开启装饰器支持。

```json
{
  // ...
  "compilerOptions": {
    // ...
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
  }
}
```

接着我们还要安装一个 `reflect-metadata` ，它是一个对 Reflect 的一个扩展，可以让对象存储元数据，在入口处直接导入即可。

```typescript
// electron/main.ts
import "reflect-metadata";

// ...
```

接着我们给模块加上 `@singleton` 装饰器

```typescript
import { singleton } from "tsyringe";

@singleton()
export class PathService {
  // ...
}
```

这里使用 `singleton` 而不是 `injectable` 的原因是 `injectable` 每次注入都会生成一个新的对象，而 `singleton` 只会有一个对象。

要注意这样只是注册了这个类，如果我们直接运行容器内是不会有这个类的实例的，如果想要让类初始化实例，则需要调用另一个 API 。

```typescript
// electron/main.ts
import { container } from "tsyringe";
import { PathService } from "./modules/path";

// 初始化
const instance = container.resolve(PathService);
```

所以整个 electron 侧的逻辑就是在 `electron/modules` 下编写模块，然后在 `electron/main.ts` 调用 win 模块来初始化整个应用，不过这里目前还有一些问题，就是某些模块并不会和 win 模块存在依赖关系，通常只会通过 ipcMain 来监听一些事件然后处理，这里用的一个方法是注入但不使用

```typescript
import { inject, singleton } from "tsyringe";
import { DbService } from "../db";

@singleton()
export class WinService {
  //...

  constructor(
    // @ts-expect-error inject dbService
    @inject(DbService) private dbService: DbService,
  ) {
    // ...
  }
}
```

这里要加这个注释，不然 TypeScript 会报错。

或许这里改成扫描 `electron/modules` 下的模块并且直接 `container.resolve` 会更好？🤔

### better-sqlite3

在编写下载功能的时候，需要一个轻量的数据库，这里选用了 sqlite 。

这里提一嘴这个是可能在开发或者打包会报错，提示 node（或其他） 版本不正确问题。

这时需要使用执行 `electron-builder install-app-deps` 来讲依赖重新编译为当前环境的版本

可以在 `package.json` 添加 `postinstall` 来让 `pnpm i` 完成后触发

```json
{
  // ...
  "scripts": {
    // ...
    "postinstall": "electron-builder install-app-deps"
  },
}
```

### 快速引入字体

这里可以使用 [Fontsource](https://github.com/fontsource/fontsource) 。

这个仓库收录了开源可商用的字体，可以在[此处](https://fontsource.org/?query=roboto)搜索相应的字体。

导入也非常简单，安装对应的字体文件，然后导入即可。

```bash
pnpm install @fontsource/roboto
```

引入：

```typescript
// src/main.ts

import "@fontsource/roboto";
```

然后在需要的地方使用即可。

```css
body {
  font-family: 'Roboto', sans-serif;
}
```

### Express 代理接口

在生产环境下，应用会在主进程启动一个 Express 实例，来代理相关的接口。

```typescript
// 核心代码
const app = Express();

app.use(
  "/api",
  createProxyMiddleware({
    target: config.target,
    changeOrigin: true,
    secure: false,
    pathRewrite: {
      "^/api": "",
    },
  }),
);
```

由于接口在大陆并不总是能使用，所以我们需要为这个代理启用一个“梯子”

做法就是配置它的 `agnet` 属性。

先安装 `https-proxy-agent` ，表明我们想代理一个 https 域名（这里要根据需要选择 `http-proxy-agent` 或者 `https-proxy-agent` ）。

使用很简单，如下：

```typescript
import { HttpsProxyAgent } from "https-proxy-agent";

// 核心代码
const app = Express();

app.use(
  "/api",
  createProxyMiddleware({
    target: config.target,
    agent: new HttpsProxyAgent("http://localhost:10809")
    changeOrigin: true,
    secure: false,
    pathRewrite: {
      "^/api": "",
    },
  }),
);
```

这里的 `http://localhost:10809` 就是代理服务的域名，由于我们使用的是 [v2rayN](https://github.com/2dust/v2rayN) ，所以这里默认就是 `http://localhost:10809` 。

至于代理的这些信息，就通过渲染进程的用户填写后拿到。

### 渲染进程使用代理

除了 Express ，在渲染进程中我们需要访问第三方的图片，在网络不好的时候，我们希望使用代理进行加速，这里需要导入 electron 的 `session` ，然后使用 [setProxy](https://www.electronjs.org/docs/latest/api/structures/proxy-config) 这个方法。

```javascript
import {
  // ...
  session,
} from "electron";

session.defaultSession.setProxy({
  // 默认就为 fixed_servers 
  // 需要设置 proxyRules 才能生效
  mode: "fixed_servers",
  proxyRules: "http://localhost:10809",
});
```

这样设置之后渲染进程的请求就会走这个代理。

### 缩放

electron 提供给了我们一个 `win.webContents.setZoomFactor(zoomFactor)` 来设置缩放因子

但是要注意，这个功能默认是关闭的，直接调用这个方法是没法改变的，这里需要先调用 `win.webContents.setVisualZoomLevelLimits(1, 3)` 后再调用 `win.webContents.setZoomFactor(zoomFactor)` 才能成功缩放，这里当时卡了很久...

```typescript
// 必须先调用 setVisualZoomLevelLimits 解除缩放限制
win.webContents.setVisualZoomLevelLimits(1, 3).then(() => {
  win.webContents.setZoomFactor(zoomFactor);
});
```

### 记录用户窗口位置

核心的 API 是 `win.getBounds()` 可以获取窗口当前的位置和大小，我们只需在退出前将信息保存在本地，然后下次启动前读取这个信息设置位置和大小即可。

```typescript
// 保存
const rect = win.getBounds();
writeToLocal(rect);


// 读取
const rect = getFromLocal('bounds');
const win = (this.win = new BrowserWindow({
  // ...
  x: rect.x,
  y: rect.y,
  width: rect.width,
  height: rect.height,
}));
```

### 使用工作流

因为仓库是在 github 上开源的，所以可以使用工作流来帮我们打多个环境的包。

在本项目中，有两个工作流，一个是监听 tag 推送然后根据 tag 打包，一个是手动触发的最新打包。

监听 tag 只需要如下配置：

```yml
on:
  push:
    tags:
      - 'v*.*.*'  # 只在版本标签推送时触发
```

这里我们使用 `npm version major|minor|patch` 命令来更新版本，这个命令会生成一个提交，在这个提交上面标上一个 tag 。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/11/12/20241112213139986.avif)

接着我们 `git push && git push origin v1.9.0` 来把这个 tag 提交到远程就可以触发上面的工作流了。

手动触发的则需要使用如下配置

```yml
on:
  workflow_dispatch:
```

这样在 Actions 页面就有一个按钮可以启动工作流了。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/11/12/20241112213514897.avif)

一般使用工作流的时候，基本上是在 linux 上跑的，但是 electron 的打包是需要在对应系统上打对应系统的包的，即 linux 只能打 linux 的包，而 windows 只能打 windows 的包，所以我们需要配置一下，让工作流跑两个环境，核心就是下面这个配置。

```yml
jobs:
  build:
    name: Build ${{ matrix.os }}
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
```

这样子就会有两个任务在跑。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/11/12/20241112213813927.avif)

然后某些步骤如果需要指定只在某个环境跑，可以在步骤上用一个 if 语法，比如如果要缓存 pnpm 的包的话，在 window 上的路径和 linux 上的路径不一样，所以需要两个 step 。

```yml
jobs:
  build:
    name: Build ${{ matrix.os }}
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]

    steps:
      - name: Cache Linux pnpm
        # 只在 linux 上执行这个步骤
        if: matrix.os == 'ubuntu-latest'
        uses: actions/cache@v4
        with:
          path: ~/.local/share/pnpm/store
          key: pnpm-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            pnpm-${{ runner.os }}-
      
      - name: Cache Windows pnpm
        # 只在 windows 上执行这个步骤
        if: matrix.os == 'windows-latest'
        uses: actions/cache@v4
        with:
          path: D:\.pnpm-store
          key: pnpm-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            pnpm-${{ runner.os }}-
```

最后，如果是基于 tag 的推送的，可以借助 electron-builder 自动提交到 release 上。

```yml
jobs:
  build:
    name: Build ${{ matrix.os }}
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]

    steps:
      # ...
      - name: Build Electron App
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
        run: pnpm run build
```

这里记得要注入 `GH_TOKEN` ，这样才能推送成功，`pnpm run build` 实际上运行了 `vite build && electron-builder --publish always` 这里自动推送就是 `--publish always` 起作用。

而如果是基于最新的打包，则需要指定 `--publish` 为 `never` ，然后借助工作流 Artifacts 暂存文件，将打包后的文件上传到这里即可，这里需要使用 `actions/upload-artifact` 。

```yml
jobs:
  build:
    name: Build ${{ matrix.os }}
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]

    steps:
      # ...
      - name: Upload Linux Artifacts
        if: matrix.os == 'ubuntu-latest'
        uses: actions/upload-artifact@v4
        with:
          # 通过 github.sha 来区分文件
          name: linux-release-assets-${{ github.sha }}
          path: release/*/jm-desktop-Linux-*.zip
  
      - name: Upload Windows Artifacts
        if: matrix.os == 'windows-latest'
        uses: actions/upload-artifact@v4
        with:
          # 通过 github.sha 来区分文件
          name: windows-release-assets-${{ github.sha }}
          path: release/*/jm-desktop-Windows-*.zip
```

# 后记

虽然启动慢了点，但是功能上还是相当完整的，自己还是非常开心能够完成这个项目。

~~虽然在不起眼的地方有很多 bug 。~~

~~在修了在修了，新建 fix 分支。~~