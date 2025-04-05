---
title: >-
  记一次使用篡改猴脚本获取 DNF 游戏活动奖励
tags:
  - 篡改猴
  - tampermonkey
  - 地下城与勇士
  - 勇士的意志
categories:
  - 编程
date: 2025-01-03 16:10:11
updated: 2025-01-03 16:10:11
key: 1735891812
---


# 前言

记一次使用篡改猴脚本获取 DNF 游戏活动奖励。

<!-- more -->

最近也是回来重新玩 DNF 了，但是回归什么都没有，没有黑钻，没有契约，太难受了，搜活动的时候发现有个看漫画拿星星的活动，即 [《勇士的意志》第 2 季-地下城与勇士：创新世纪-DNF-官方网站-腾讯游戏 ](https://dnf.qq.com/cp/a20231211comic/index.html) 。里面有个点漫画得星星的部分，如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/01/03/20250103143402348.avif)

得到星星后就可以在下面奖励换黑钻了。

不过得一个个点，太麻烦了，所以本文会通过篡改猴脚本来自动获取星星。

# 正文

## 安装篡改猴

先进入篡改猴的官网：[Tampermonkey](https://tampermonkey.net/) 。

然后下载篡改猴的扩展，这里可以去扩展商店下载或者直接下载 crx 文件然后加载。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/01/03/20250103143623653.avif)

注意默认情况下是 Chrome 的版本的，如果使用 Edge 或者火狐的要在 tab 那里切换到对应的页面：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/01/03/20250103143846064.avif)

~~当然我还是推荐 Chrome 的。~~

## 安装脚本

脚本我已经放在 Github 上了。

[Dedicatus546/dnf-comic-start-script](https://github.com/Dedicatus546/dnf-comic-start-script)

进入上面的仓库后点击 `index.js` ，即可进入脚本内容页面：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/01/03/20250103144543197.avif)

然后点击右上角的篡改猴点击新建脚本，点击图中红色框住的部分的按钮复制代码：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/01/03/20250103144447833.avif)

然后在新建脚本的页面粘贴拷贝的脚本：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/01/03/20250103144923665.avif)

然后 ctrl + s 保存，会出现下面这个页面：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/01/03/20250103145057124.avif)

## 页面操作

重新打开（或者刷新）活动页面，如果安装正确，左上角会出现脚本增加的额外的 UI ：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/01/03/20250103145239507.avif)

等待页面加载完成后就可以点击开始获取星星，然后会有相关的信息显示出来：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/01/03/20250103145432265.avif)

在操作完成后页面会自动刷新，脚本操作的时候尽量不要操作页面，防止出现意外的情况。

每个话对应的星星只能获取一次，所以上图中的星星为已领取该奖励。

## 源码解析

接下来我们稍微解析一下脚本的实现原理，如果是单纯做活动的用户，后面的东西就不用看了。

首先在话数这里我们直接 F12 ，可以发现是一个 `a` 标签，除了 `href` 还有 `onclick` 点击函数：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/01/03/20250103145818522.avif)

这里 `href` 会跳转到腾讯动漫的站点，重点是这里的 `onclick` 绑定的 `amsCommon.lotteryStar(1)` ，由于是直接在 html 中编写调用代码，那么 `amsCommon` 应该是全局的一个对象，直接在控制台输出看下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/01/03/20250103150231165.avif)

从这些暴露的函数来看，八九不离十应该是整个页面的活动逻辑。

文件的地址为 [ams.js](https://dnf.qq.com/cp/a20231211comic/js/ams.js) 。

直接把 `lotteryStar` 函数的源码贴上来。这个源码没混淆还加了一些注释，还是挺方便理解的。

```javascript
var amsCommon = {
  // ...

  // 观看漫画，领取星星
  lotteryStar: function (index) {
    var sData = {
      index: index,
    };
    var successCallback = function (res) {
      var starNum = $("#starNum").text();
      starNum = starNum * 1 + 1;
      $("#starNum").text(starNum);
      // $('#comicLinkBtn_' + index).find('a').removeAttr('onclick');
      amsCommon.showMsgDia("恭喜您，获得1个星星");
    };
    var failCallback = function (res) {
      if (res.iRet == 100001) {
        // $('#comicLinkBtn_' + index).find('a').removeAttr('onclick');
        return;
      }
      amsCommon.handleFail(res);
    };
    this.submitFlow("0a571a", false, sData, successCallback, failCallback);
  },
};
```

可以看到在成功回调 `successCallback` 中提示了获得星星，最后是调用了 `submitFlow` ，源码如下：

```javascript
var amsCommon = {
  // ...

  submitFlow: function (
    token,
    showLoading,
    sData,
    successCallback,
    failCallback
  ) {
    var flow = {
      actId: "603984",
      token: token,
      loading: showLoading,
      sData: sData,
      success: function (res) {
        if (typeof successCallback == "function") {
          successCallback(res);
        }
      },
      fail: function (res) {
        if (typeof failCallback == "function") {
          failCallback(res);
        } else {
          amsCommon.handleFail(res);
        }
      },
    };
    Milo.emit(flow);
  },
};
```

可以看到出现了 Milo ，这里的 Milo 应该是腾讯开源的一个库，不过好像只是内部使用的，[Milo](https://tgideas.qq.com/milo/index.shtml) 。

这里可以不用管 Milo ，从上面两个源码就基本上可以看出， `submitFlow` 是一个基础的接口，然后 `lotteryStar` 传入了 `0a571a` 这个 token ，这个 token 就是对应点漫画获取星星的。

我们可以尝试直接在控制台输入 `amsCommon.lotteryStar(1)` 这段代码为领取第一话的星星，如果没领过的话会直接弹出一个方框提示获取星星成功，这是很重要的结果，这意味着这个结果不依赖腾讯动漫那边的数据，也就是说不用看漫画领取星星这个逻辑是可行的。

执行完后，可以在网络一栏看到发送的接口，在启动器可以看到调用流程：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/01/03/20250103151817815.avif)

调用的结果也是提示已领取星星了：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/01/03/20250103152110107.avif)

ok，有了上面的理论之后，实际的代码就很好写了，首先是获取当前已更新的漫画，这里有两种思路

- 分析 UI 结构，待更新的节点是没有 a 标签的。
- 分析 `amsCommon` 代码，里面有话数的全局数据。

待更新的节点没有 `a` 标签，如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/01/03/20250103152557250.avif)

由于这个特性，我们可以写出如下的代码获取所有已更新的话数

```javascript
const indexList = [
  // li 节点数组
  Array.from(document.querySelector("#comicList_1").childNodes),
  Array.from(document.querySelector("#comicList_2").childNodes),
  Array.from(document.querySelector("#comicList_3").childNodes),
  Array.from(document.querySelector("#comicList_4").childNodes),
]
  // 打平
  .flat()
  // 过滤没有 a 标签的项
  .filter(
    (el) =>
      el.childNodes.length === 1 &&
      el.childNodes[0].tagName.toLowerCase() === "a"
  )
  // 根据 li 的 id 得到索引
  // 比如第一话的 li 的 id 为 comicLinkBtn_1 ，按 _ 分割取第二个元素即可
  .map((el) => Number.parseInt(el.id.split("_")[1]));
// 领取
// .forEach((id) => amsCommon.lotteryStar(id));
```

放到控制台输出一下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/01/03/20250103153647032.avif)

看起来没什么问题。

如果细看 `amsCommon` 的代码的话，会发现页面上的 `li` 也是它负责渲染的，源码如下：

```javascript
var amsCommon = {
  // ...

  //初始化漫画更新进度
  initComicProgress: function () {
    if (pageName == "indexm") {
      var html_1 = "",
        html_2 = "",
        html_3 = "",
        html_4 = "",
        html_5 = "";
      $.each(DNF_2023COMIC_DATA, function (i, item) {
        var html = "";
        var index = i + 1;
        if (item.updateStatus > 0 && item.comicUrl != "") {
          // html = '<li id="comicLinkBtn_' + index + '"><a href="' + item.comicUrl + '" onclick="amsCommon.lotteryStar(' + index + ')"><span>第' + index + '话</span><span class="zt updated">已更新</span></a></li>';
          html =
            '<li id="comicLinkBtn_' +
            index +
            '"><a href="javascript:;" onclick="amsCommon.lotteryStar(' +
            index +
            ");amsCommon.jumpComicPage('" +
            item.comicUrl +
            "')\"><span>第" +
            index +
            '话</span><span class="zt updated">已更新</span></a></li>';
        } else {
          html =
            '<li id="comicLinkBtn_' +
            index +
            '"><span>第' +
            index +
            '话</span><span class="zt">待更新</span></li>';
        }
        if (i < 20) {
          html_1 += html;
        } else if (i < 40) {
          html_2 += html;
        } else if (i < 60) {
          html_3 += html;
        } else if (i < 80) {
          html_4 += html;
        } else {
          html_5 += html;
        }
      });
      $("#comicList_1").html(html_1);
      $("#comicList_2").html(html_2);
      $("#comicList_3").html(html_3);
      $("#comicList_4").html(html_4);
      $("#comicList_5").html(html_5);
    } else {
      var html_1 = "",
        html_2 = "",
        html_3 = "",
        html_4 = "";
      $.each(DNF_2023COMIC_DATA, function (i, item) {
        var html = "";
        var index = i + 1;
        if (item.updateStatus > 0 && item.comicUrl != "") {
          html =
            '<li id="comicLinkBtn_' +
            index +
            '"><a href="' +
            item.comicUrl +
            '" onclick="amsCommon.lotteryStar(' +
            index +
            ')" target="_blank"><span>第' +
            index +
            '话</span><span class="zt updated">已更新</span></a></li>';
        } else {
          html =
            '<li id="comicLinkBtn_' +
            index +
            '"><span>第' +
            index +
            '话</span><span class="zt">待更新</span></li>';
        }
        if (i < 30) {
          html_1 += html;
        } else if (i < 60) {
          html_2 += html;
        } else if (i < 90) {
          html_3 += html;
        } else {
          html_4 += html;
        }
      });
      $("#comicList_1").html(html_1);
      $("#comicList_2").html(html_2);
      $("#comicList_3").html(html_3);
      $("#comicList_4").html(html_4);
    }
  },
};
```

可以看到这里引用了 `DNF_2023COMIC_DATA` 这个全局数据，在控制台打印下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/01/03/20250103154136689.avif)

可以看到是漫画的数据，其中 `updateStatus` 为 `1` 时为已更新，为 `0` 时为未更新，那么代码就更简单了，如下：

```javascript
DNF_2023COMIC_DATA
  // 过滤已更新漫画
  .filter((item) => item.updateStatus === "1")
  // 提取 id
  .map((item) => Number.parseInt(item.id));
// 领取
// .forEach((id) => amsCommon.lotteryStar(id));
```

核心的代码就是这样了，当然如果这样直接执行很有可能会报频繁请求，所以真实的脚本中加了一些 `delay` 来防止请求过于频繁，比如一个简单的 `delay` 实现：

```javascript
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
```

这里再贴一个控制台版本的，直接 F12 拷贝到控制台执行即可，不用安装篡改猴：

```javascript
(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  for (const id of DNF_2023COMIC_DATA.filter(
    (item) => item.updateStatus === "1"
  ).map((item) => Number.parseInt(item.id))) {
    amsCommon.lotteryStar(id);
    await delay(1500);
  }
})();
```

# 后记

上次玩还是巴老师的版本，自定义玩不动，这阵子玩自定义几乎一直送了，不过还是带了一套神未知的工作服，愉快地单机游戏，马上也是要到 115 了，一想到修武器的地图要没了我就心痛，一次修武器 16 万金币...
