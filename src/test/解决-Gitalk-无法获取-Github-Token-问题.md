---
title: 解决 Gitalk 无法获取 Github Token 问题
key: 1658799213
date: 2022-07-26 09:33:33
updated: 2023-10-10 14:09:13
tags:
  - Gitalk
  - Github API
  - Hexo
  - Vercel
  - JavaScript
  - Nodejs
categories:
  - 编程
top: 1
---

# 前言

记一次 `Hexo Next` 主题下 `Gitalk` 无法获取 `Github Token` 问题

<!-- more -->

目前博客采用的 `Gitalk` 来作为帖子的评论系统

其原理是通过帖子名来生成一个唯一 `id` ，用这个在 `Github` 仓库下开一个 `issue` ，这个 `issue` 就成为帖子的评论仓库了

由于要操作到 `Github` 仓库，所以是需要借助 `Github` 的开放 `API` 来完成的

其中有一步需要获取一个 `access_token` ，操蛋的是，这个 `API` 是不支持跨域访问的

`https://github.com/login/oauth/access_token`

所幸 `Gitalk` 使用了亚马逊的云服务代理里这个接口 

`https://cors-anywhere.azm.workers.dev/https://github.com/login/oauth/access_token`

看起来没问题了，更操蛋的又来了，这个地址被墙了，意味着现在没法代理接口了，要么自己买服务器代理接口，要么科学上网

科学上网不现实，你不能指望大家开着飞机来看你的帖子

所以只能在自己写代理服务器上做文章了

作为一个抠门抠到家的码农，要我花钱，你这是要我的命🤯

果断百度 “免费 `VPS`” 

一看搜索结果...

额，还是算了，免费的就是最贵的...

正在我思来想去如何解决的时候，我想起了之前 `fork` 的一个网易云 `API` 项目，这个项目部署在了一个公共的服务上，好像还是免费的

我就直接冲进我的仓库列表中进行一个地毯式地查找

没错，就是它，`Vercel`

# 正文

本文会通过两个方面来讲述整个过程

- 代理 `https://github.com/login/oauth/access_token` 这个接口
- 部署到 `Vercel` 上

## 代理 `Github` 接口

作为一个切图仔，不对，前端工程师，首选 `JS` 来作为编写语言，毫无疑问，使用 `Node` 来作为代理服务器

这里使用的技术栈为 `Koa` ，以及它的一些中间件，比如 `Koa-Router`， `Koa-BodyParser`，`Koa-Cors`，以及一个请求库，当然是我们的老朋友 `axios` 

然后，我们就可以写出一个整体的框架

```javascript
const Koa = require('koa');
const KoaCors = require('@koa/cors');
const KoaRouter = require('@koa/router');
const KoaBodyParser = require('koa-bodyparser');
const axios = require('axios');

const app = new Koa();
const router = new KoaRouter();

router.post('/github_access_token', async (ctx, next) => {
  // TODO
  await next();
});

router.get('/', async (ctx, next) => {
  ctx.body = 'a cors proxy server!';
  await next();
})

app.use(KoaCors());
app.use(KoaBodyParser());
app.use(router.routes()).use(router.allowedMethods());

app.listen(9999, () => {
  console.log('cors-server success!');
});
```

这里面最重要的就是 `post` 那个请求了

我们可以查看亚马逊代理的请求头 

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/26/202207261426831.avif)

发现它是 `content-type` 是 `json` 的，那么就简单了，直接 `axios` 发送然后把请求体带上即可

```javascript
router.post('/github_access_token', async (ctx, next) => {
  const reqBody = ctx.request.body;
  const res = await axios.post('https://github.com/login/oauth/access_token', reqBody);
  ctx.body = res.data;
  await next();
});
```

当然，上面的代码是有问题的，官方的接口返回的是一串类似 `URL` 参数的东西，如下

```text
access_token=****************&scope=public_repo&token_type=bearer
```

而亚马逊的代理会把它转成 `json` 格式返回，所以这里我们也需要转成 `json` 格式

这个转化我们使用 `URLSearchParams` 来完成，非常简单

```javascript
router.post('/github_access_token', async (ctx, next) => {
  const reqBody = ctx.request.body;
  const res = await axios.post('https://github.com/login/oauth/access_token', reqBody);
  const params = new URLSearchParams(res.data);
  ctx.body = Array.from(params.entries()).reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {});
  await next();
});
```

这样子我们就完成了全部代码的编写，是不是很简单？

## 部署到 `Vercel` 上

这里我们需要在项目根目录下新建一个 `vercel.json` 配置文件，如下

```json
{
  "version": 2,
  "builds": [
    {
      "src": "./index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ]
}
```

当然，其实我没看过文档啥的，我是从那个网易云 `API` 项目上复制过来的

不过粗略猜测一下，`build` 的 `src` 应该是指定了入口函数，而 `routes` 制定了路由映射的规则

虽然我们项目启动的是 `9999` 端口，但是 `vercel` 部署统一都是 `443` 端口的（应该） ，内部再做转发

然后我们登录到 `vercel` ，[Dashboard - Vercel](https://vercel.com/dashboard) ，使用 `github` 账号登录即可

然后我们选择 `new Project`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/26/202207261440800.avif)

`import` 这个 `cors-server` 项目

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/26/202207261442420.avif)

不用任何设置，直接点 `deploy` 部署即可

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/26/202207261443714.avif)

稍等一会之后，我们就可以看到项目部署成功了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/26/202207261445218.avif)

我们访问 [`https://cors-server-ecru.vercel.app`](https://cors-server-ecru.vercel.app/) 就可以看到服务了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/26/202207261447909.avif)

然后我们修改 `Next` 主题下的配置文件，把 `_config.yml` 里的配置改成这个接口即可

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/26/202207261450438.avif)

提交到 `github` 上，然后即可成功使用 `github` 登录 `gitalk`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/26/202207261452907.avif)

可以看到 `Options` 预检请求成功，证明跨域没问题，`Post` 请求也成功返回

如果不想折腾，直接使用我这个下面这个地址替换亚马逊的地址即可

`https://cors-server-ecru.vercel.app/github_access_token`

当然，如果觉得不放心，完全可以 `fork` 我的项目，检查源代码啥的，然后自己部署到 `vercel`，几分钟的事

项目地址：[cors-server](https://github.com/Dedicatus546/cors-server)

喜欢可以点个 `star` 哦~

## 2022-8-26 vercel 使用自定义域名

经评论区提醒，`vercel` 的服务无法访问。

我去百度了一下，发现之前也有过这种情况，应该不是墙，只是 `DNS` 污染的间歇性抽风，目前已经找到解决办法。

只需把地址换成 `https://vercel.prohibitorum.top/github_access_token` 即可，服务还是 `vercel` 的。

如果你有自己的域名，那么可以按照如下来配置，首先打开的域名控制台，这里我是阿里云的域名，添加一条如下的规则。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208281106221.avif)

然后我们进入 `vercel` 的控制台，按照如下图，添加对应的域名，这里要和我们在域名控制台设置的一样。

我们在域名控制台添加了 `vercel.prohibitorum.top` 指向了 `76.223.126.88` ，这里我们就填 `vercel.prohibitorum.top` 即可。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208281112182.avif)

新建之后我们点击右侧的 `edit` 按钮，会出现如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208281114088.avif)

点击 `View DNS Records & More for XXX →` 这个链接，跳转到如下界面，然后添加一条 `CNAME` 规则，如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208281116569.avif)

这样就完成了，然后访问你设置的网址，如果出现了如下页面就是成功了。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208281117515.avif)

然后我们修改 `next` 主题下的配置即可，如下图所示，这里我用我的服务做示范：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208281121620.avif)

部署，然后就可以正常获取 `token` 了。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208281125915.avif)

话说 `github` 也是间歇性抽风，写个帖子是真的不容易，各种推送失败...

## 2022-10-22 使用 netlify 部署服务

评论区有朋友说 `vercel` 有点慢，想使用 `netlify` 来部署。

我也没用过 `netlify` ，不过既然都差不多，也就花了点时间搞了下，还行，可以部署。

和 `vercel` 不同的是，这里 `netlify` 好像不支持路由映射？即使通过函数启动了服务器，好像也没用，这个没搞懂。

不过这里用了另一种函数，`Edge Function` 边缘函数，它允许我们导出函数来拦截对应的请求。

所以，你可以看到我们在 `netlify.toml` 文件内放了写了如下的配置。

```toml
[build]
edge_functions = "edge_functions"

[[edge_functions]]
path = "/github_access_token"
function = "github_access_token"
```

`edge_functions = "edge_functions"` 指定了放边缘函数文件夹的路径。

下面的部分即当访问 `/github_access_token` 这个路径时，用 `edge_functions` 下的 `github_access_token` 文件来处理它。

```javascript
/**
 * @param {Request} request
 */
export default async function (request) {
  if (request.method === "OPTIONS") {
    // 预检请求
    const resp = new Response(null, {
      status: 204,
    });
    resp.headers.set("Access-Control-Allow-Origin", "*");
    resp.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    resp.headers.set("Access-Control-Allow-Headers", "Content-Type");
    resp.headers.set("Access-Control-Max-Age", `${86400 * 30}`);
    return resp;
  }
  if (request.method === "POST") {
    try {
      const reqBody = await request.text();
      console.log("request body: ", reqBody);
      const res = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        body: reqBody,
        headers: {
          "Content-type": "application/json",
        },
      });
      const text = await res.text();
      console.log("github api res: ", text);
      const params = new URLSearchParams(text);
      const resp = new Response(
        JSON.stringify(
          Array.from(params.entries()).reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
          }, {})
        ),
        {
          status: 200,
        }
      );
      resp.headers.set("Access-Control-Allow-Origin", "*");
      resp.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      resp.headers.set("Access-Control-Allow-Headers", "Content-Type");
      resp.headers.set("Access-Control-Max-Age", `${86400 * 30}`);
      return resp;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  return new Response("a cors proxy by netlify!");
}
```

目前代码已经更新，根目录下新增了 `edge_functions` 目录下的 `github_access_token.js` 文件。

当然，这里我们就没必要用三方库了，直接手撕。

对 `OPTIONS` ，`POST` ，其他方法分别处理即可。

部署的话，点击这里进入 [netlify](https://netlify.com) 。

注册的话我们直接用 `github` 登录就行了，方便导入相应的仓库。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/10/22/202210221427591.avif)

选择 `github` ，第一次进要跳转到 `github` 那边授权，照做就行了。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/10/22/202210221429287.avif)

选择 `cors-server` 仓库：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/10/22/202210221431460.avif)

配置默认即可，不需要填，直接点击 `deploy site` 。

如果成功了，那么就有如下画面：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/10/22/202210221433872.avif)

然后我们进入 `https://xxxx.netlify.app/github_access_token` ，如果出现如下的画面，那么就完成了（这里 `xxxx` 是 `netlify` 随机的一个前缀）。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/10/22/202210221435165.avif)

至于域名的话，我觉得没必要，因为目前来看，没有污染问题。

大家如果嫌麻烦，可以使用我的地址：`https://strong-caramel-969805.netlify.app/github_access_token` 即可。

不过我还是建议大家自行注册，因为每个账号是有免费的额度的。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/10/22/202210221441392.avif)

接口访问效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/10/22/202210221445817.avif)

## 2023-08-13 使用 Docker 部署服务

已支持 Docker 容器方式部署，不过这种方式适合你自己有服务器的情况，并且服务器要能正确代理原始的地址。

感谢 [@Jorbenzhu](https://github.com/jorben) 提供的 Dockerfile 文件。

镜像已经提交到 DockerHub ，可以使用以下命令来拉取镜像。

```
docker pull dedicatus545/github-cors-server:1.0.0
```

然后使用以下命令启动镜像

```
docker run -d --name cors-server -p8080:9999 dedicatus545/github-cors-server:1.0.0
```

这里容器内部是 9999 端口，绑定主机的 8080 端口，这里可以根据你的服务器端口占用情况进行动态修改。

# 后记

什么？你问我如果 `Github` 要是被墙了怎么办？

那就凉拌，转 `Gitee` 是不可能转 `Gitee` 的，这辈子都不可能转 `Gitee` 。

要是转了，我怕我的 `JavaScript` 标签有一天就变成 `J**aScript` 了。