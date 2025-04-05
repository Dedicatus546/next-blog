---
title: 在 uniapp 中使用绘制地图线路
tags:
  - uniapp
  - vue3
categories:
  - 编程
key: 1720592990date: 2024-07-10 14:29:50
updated: 2024-07-10 14:29:50
---

# 前言

在 uniapp 中使用绘制地图线路。

<!-- more -->

好久没写东西了，刚好最近由于项目需要接触了一下 uniapp ，做一个卖东西的简单的小程序，其中某个功能是要绘制从发货地到目的地的路线给用户看的功能，所以借此机会了解了下在 uniapp 中关于地图的一些使用。

# 正文

## uniapp

uniapp 是一个跨平台的方案，能够编写一份代码，打包到很多平台，比如 h5 ，各个小程序，APP 。

它的核心是使用到了 vue （2 和 3 都可以），所以对 web 开发人员很友好，web 的特性意味着能够快速地根据原型图编写代码。

在[官网](https://uniapp.dcloud.net.cn/quickstart-cli.html)中，我们可以通过多种方式来创建 uniapp 项目，这里需要注意，使用 uniapp 并不一定需要 hbuilder 来开发。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710063901284.avif)

这里我选择了最后一个，也就是 vite + vue3 的，不过因为网络原因一直失败，所以直接从给的 [gitee](https://gitee.com/dcloud/uni-preset-vue/repository/archive/vite-ts.zip) 上下载了项目的代码

安装完依赖后，我们就完成了架子的初始化。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710064300292.avif)

这里的 peerDep 似乎没有处理好，不过我们可以不管，vue 小版本的更新问题不大。

接下来我们可以直接执行 `pnpm run dev:h5` 来开启 h5 的预览，也就是常见的 web 模式。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710065232982.avif)

对于 uniapp 的项目目录结构，这里不做讲述，我们主要修改的地方就是 `src/pages/index/index.vue` 文件，也就是上面显示的 UI 对应的文件。

## 显示地图

在 uniapp 中，为我们提供了一个 [map](https://uniapp.dcloud.net.cn/component/map.html) 组件，它可以直接渲染地图出来，很方便，编写如下代码：

```html
<template>
  <map></map>
</template>

<script setup lang="ts"></script>
```

刷新页面发现提示我们缺少了什么 key 。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710072359012.avif)

在 h5 中，map 组件支持三种类型的地图

| 地图服务商	  | App	          | H5	     | 微信小程序 |
|---------|---------------|---------|-------|
| 高德	     | √	            | 3.6.0+  |       |
| Google	 | 3.4+ 仅nvue页面	 | 3.2.10+ |       |
| 腾讯		    |               | 	√      | √     |

因为我们用的已经是 4 版本的 uniapp 了，所以三种都是支持的，只需配置一下供应商的 key 即可。

这里我们以腾讯地图为例，首先需要去腾讯位置服务官网：[腾讯位置服务](https://lbs.qq.com) 。注册步骤省略，用 qq 注册按要求下一步即可。

接着我们打开控制台的应用管理的我的应用。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710074441112.avif)

点击右上角的创建应用，按要求填写。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710074537332.avif)

接着通过应用来创建 key ，点击创建 key ，按要求填写，这里要注意勾上 webServiceAPI ，后面我们会用到。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710074902109.avif)

创建完成后，我们复制一下生成的 key 。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710075036533.avif)

然后在 src/manifest.json 中的 h5 平台上，配置一下 key 。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710075240459.avif)

接着回到页面，我们就能看到地图渲染出来了。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710075342069.avif)

不过看起来样式有点不对，而且没有显示地图的内容，样式的原因是 uniapp 给 map 组件设置了默认的宽高。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710075510558.avif)

所以这里我们要写样式来覆盖。

```html
<template>
  <map style="width: 100%; height: 100%"></map>
</template>

<script setup lang="ts"></script>

<style>
uni-page-body {
  height: 100%;
}
</style>
```

地图上没有内容，是因为我们没有设置经纬度，腾讯位置服务提供了一个[坐标拾取器](https://lbs.qq.com/getPoint)可以将地点转为坐标。

这里我们拾取了一个地址。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710080947024.avif)

然后根据 uniapp 的 map 的文档设置一下经度和纬度

```html
<template>
  <map
    style="width: 100%; height: 100%"
    :longitude="116.409001"
    :latitude="39.907464"
  ></map>
</template>

<script setup lang="ts"></script>

<style>
uni-page-body {
  height: 100%;
}
</style>
```

在页面上我们就可以看到地图正确的展示出来了。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710081356553.avif)

## 绘制路线

显示完地图之后，接下来我们需要绘制线路，在 map 文档中，有一个 `polyline` 的属性正好可以实现这一需求。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710091230567.avif)

接着，我们再在坐标拾取器上选另一个点。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710091418057.avif)

然后写下如下的代码：

```html
<template>
  <map
    style="width: 100%; height: 100%"
    :longitude="116.409001"
    :latitude="39.907464"
    :polyline="[
      {
        points: [
          {
            longitude: 116.409001,
            latitude: 39.907464,
          },
          {
            longitude: 116.404967,
            latitude: 39.901743,
          },
        ],
        color: '#ff0',
        width: 5,
      },
    ]"
  ></map>
</template>

<script setup lang="ts"></script>

<style>
uni-page-body {
  height: 100%;
}
</style>
```

然后就可以看到两点之间确实绘制了一条**直线**出来。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710091651058.avif)

这时候你可能会想说：不对啊哥们，哪有这样的路线的，这么近的距离难道我坐飞机？？？

没错，这样子实际上是不符合我们原本的要求的，这就要引出我们之前注册的腾讯位置服务了。

在腾讯位置服务中，提供了一种路线规划的接口，通过传递起始点和结束点，接口就会返回若干的坐标，然后我们将每个坐标依次连线，这样的路线才符合实际的情况。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710092117144.avif)

这里有很多种类型的规划，比如驾车，步行，公交，骑行等等，每个类型都提供了对应的接口。

这里我们就以[驾车](https://lbs.qq.com/service/webService/webServiceGuide/route/webServiceRoute#2)为例子

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710092412539.avif)

接口最重要的其实就是三个，一个是 key ，其他两个是起始点经纬度和结束点经纬度，所以我们很容易地拼接出这个请求

```text
https://apis.map.qq.com/ws/direction/v1/driving/?from=39.907464,116.409001&to=39.901743,116.404967&key=[你的key]
```

由于是 get 请求，我们可以直接访问

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710092746724.avif)

可以发现返回了一连串的经纬度，不过似乎不是常见的格式，这在文档中有解释：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710093006398.avif)

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710093036432.avif)

至此，我们就可以编写完整的代码了。

```html
<script setup lang="ts">
import { reactive } from "vue";
import { onLoad } from "@dcloudio/uni-app";

const state = reactive({
  longitude: 116.409001,
  latitude: 39.907464,
  polyline: [
    {
      points: [],
      color: "#ff0",
      width: 5,
    },
  ],
});

onLoad(async () => {
  // 由于接口存在跨域问题，所以需要在 vite.config.ts 中配置下 server.proxy
  // {
  //   "^/map-api": {
  //     target: "https://apis.map.qq.com",
  //     changeOrigin: true,
  //     secure: false,
  //     rewrite(path) {
  //       return path.replace("/map-api", "");
  //     },
  //   },
  // }
  const res = (
    await uni.request({
      url: "/map-api/ws/direction/v1/driving/",
      data: {
        from: "39.907464,116.409001",
        to: "39.901743,116.404967",
        // 填入你的 key
        key: "[你的key]",
      },
      method: "GET",
    })
  ).data as any;
  if (res.status === 0) {
    const route = res.result.routes[0];
    const { polyline } = route;
    for (let i = 2; i < polyline.length; i++) {
      polyline[i] = polyline[i - 2] + polyline[i] / 1000000;
    }
    const points = [] as any;
    for (let i = 0; i < polyline.length; i += 2) {
      points.push({
        latitude: polyline[i],
        longitude: polyline[i + 1],
      });
    }
    state.polyline[0].points = points;
  }
});
</script>

<template>
  <map
    style="width: 100%; height: 100%"
    :longitude="state.longitude"
    :latitude="state.latitude"
    :polyline="state.polyline"
  ></map>
</template>

<style>
uni-page-body {
  height: 100%;
}
</style>
```

最后我们就能看到路线正确地被绘制出来了，而不是傻傻地两点连成一线。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710093757530.avif)

如果发现接口无法使用，那么很有可能是你没有为 key 配置额度。

首先我们进入腾讯位置服务的仪表盘，点击配额管理的账户额度，然后点击驾车路线规划的配额分配

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710094518352.avif)

然后选中你创建的 key ，分配下额度和并发量。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/10/20240710094634536.avif)

提交之后稍等一会儿再刷新，接口应该就可以访问了。

# 后记

说实话我对 uniapp 还是喜欢不起来，这次使用 uniapp 而不是原生微信小程序开发的原因是客户那边不确定只需要微信小程序，有可能要上其他的小程序。

所以权衡再三，选择了 uniapp ，毕竟可以打包到不同的小程序，节省了熟悉各种小程序的规范的时间。

有时候也会想，不喜欢是一回事，用不用就是另外一回事了。