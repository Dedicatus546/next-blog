---
title: 记一次 Safari 下调用 navigator.mediaDevices.getDisplayMedia 获取录屏失败问题
tags:
  - Safari
  - getDisplayMedia
  - 录屏
categories:
  - 编程
key: 1689230471date: 2023-07-13 14:41:11
updated: 2023-07-15 11:58:55
---



# 前言

记一次 Safari 下调用 navigator.mediaDevices.getDisplayMedia 获取录屏失败问题。

<!-- more -->

公司的连麦系统在 Safari 的测试下出现无法开启录屏推流的问题，而在 Chrome 下完全正常。

然后 boss 叫我看看这个问题是什么原因。

# 正文

在 Safari 上调用失败的时候，会出现 `getDisplayMedia must be called from a user gesture handler.` 这个错误。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/13/202307131430368.avif)

二话不说咱就是直接一个面向谷歌编程，搜索这个错误。

一下子就在 StackOverflow 上找到了相关的一些帖子。

[Safari getDisplayMedia must be called from a user gesture handler](https://stackoverflow.com/questions/62929138/safari-getdisplaymedia-must-be-called-from-a-user-gesture-handler)

大致的意思就是说，在用户进行了手势操作之后才能调用 `getDisplayMedia` 方法。

即 Safari 无法通过类似 `onload` 的事件，或者 Vue 里面的 `onMounted` 钩子来直接调用这个方法。

```javascript
document.addEventListener("load", function () {
  navigator.mediaDevices.getDisplayMedia().then(() => {}, error => {
    // 报错
    // getDisplayMedia must be called from a user gesture handler.
  });
});
```

所以我们得通过一个按钮来触发这个操作，但是我转念一想，我们的系统是在点击按钮之后才进行 `getDisplayMedia` 调用的啊。

而网上的帖子基本上都是在说需要通过交互来触发，这时候就陷入了尴尬的境地。

于是我想了另一个的办法，我写了一个测试的函数，这个函数就是直接调用 `navigator.mediaDevices.getDisplayMedia` 。

然后在点击切换成录屏之后的逻辑中的各个位置执行一次这个函数。

测试函数长如下的样子，因为我们的项目用的 Vue ，所以下面用 Vue 的写法。

```html
<template>
  // ...
</template>

<script>
export default {
  data() {
    return {
      // ...
    }
  },
  methods: {
    async testMethod(position) {
      await navigator.mediaDevices.getDisplayMedia().then(() => {
        console.log("success, position: ", position);
      }, error => {
        console.error("error: ", error);
      })
    }
  }
}
</script>
```

然后在主逻辑中的各个位置加上这个方法的调用：

```html
<template>
  // ...
</template>

<script>
export default {
  data() {
    return {
      // ...
    }
  },
  methods: {
    testMethod(position) {
      // ...
    },
    mainMethod() {
      await this.testMethod(1);
      // 一些操作
      await this.testMethod(2);
      // 一些操作
      await this.testMethod(3);
      // 真正调用 navigator.mediaDevices.getDisplayMedia 的地方
    }
  }
}
</script>
```

执行之后我发现，只有第一个 `testMethod` 能执行成功，第二个开始就出现上面说到的错误了。

我又把 `this.testMethod(1)` 去掉，然后执行，发现第二个能执行成功了，但第三个就失败了。

所以这里可以排除是源代码的问题（因为我们代码里面引入了 owt.js ，有些操作还是在这个库内部执行的）。

到这里虽然得出不是代码写法的问题，但是报错依然没有解决。

然后我又在 Google 上找啊找，然后我就发现了在腾讯的 QCloud 的 [sdk](https://web.sdk.qcloud.com/trtc/webrtc/doc/zh-cn/tutorial-16-basic-screencast.html) 文档里面找到了原因。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/13/202307131042440.avif)

原来用户手势还有个 1s 的限制，在参考那里贴了一个[页面](https://bugs.webkit.org/show_bug.cgi?id=198040)，这个页面是用来提交浏览器 bug 的。

在 bug 的评论中，我们可以看到下面这一段。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/13/202307131045449.avif)

至此我们确定了 1s 限制的准确性。

为了确认这个特性是存在的，我写了一个小 demo 来测试。

demo 的内容也很简单，就是两个按钮，一个立即获取录屏，一个在 1.5s 后获取录屏。

```html
<script setup lang="ts">
const immediate = async () => {
  openDisplayMedia();
};

const delay = async () => {
  await new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 1500);
  });
  openDisplayMedia();
};

const openDisplayMedia = async () => {
  await navigator.mediaDevices
    .getDisplayMedia({
      video: true,
      audio: true,
    })
    .then(
      () => {
        console.log("success");
      },
      (err) => {
        console.log("err", err);
      }
    );
};
</script>

<template>
  <div>
    <button @click="immediate">立即打开录屏</button>
    <button @click="delay">延迟一秒录屏</button>
  </div>
</template>
```

经过测试我们发现确实在延迟了 1.5s 后无法成功调用 `getDisplayMedia` 。而在 Chrome 上是没有这个限制的，并且 Chrome 也不需要手势操作就能拉起录屏选项。

（Chrome 你真的太温柔了！）

回到系统的代码中，在实际的代码中，我们是有一些操作是可能会造成时间消耗的，由于使用 await 来同步操作，可能就会造成调用时长超过 1s 导致的调用失败。

于是我想了两个方法。

- 延迟这些 await 的操作，使用 `setTimeout` 放到下一个宏任务中，尽可能快地执行到 `getDisplayMedia` 函数。
- 提前调用 `getDisplayMedia` 方法，再执行相关的操作。
- 在调用 `getDisplayMedia` 之前弹出一个确认框，类似重新生成一个 1s 范围，这样子确保 1s 内能调用到 `getDisplayMedia` 方法。

由于一些操作是需要确保顺序性的，所以第一个方法排除了。

本来是想使用第二种方法的，但是项目使用 owt.js 的内置 API 来调用 `getDisplayMedia` 方法的，本着不修改依赖库源码的原则也放弃了。

于是我使用了第三个方法，为了最大程度减少对原代码流程的修改，我们这里使用了一个简单地 hack ，代码如下：

```html
<script setup lang="ts">
import { ref } from "vue";

const usePromise = () => {
  let resolve: Function;
  const promise = new Promise((_resolve, reject) => {
    resolve = _resolve;
  });
  return [promise, resolve!];
};

let resolve: any;

const showOverlay = ref(false);

const delay = async () => {
  // 模拟一段耗时的异步操作
  await new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 1500);
  });
  const [promise, r] = usePromise();
  resolve = r;
  showOverlay.value = true;
  await promise;
  openDisplayMedia();
};

const openDisplayMedia = () => {
  navigator.mediaDevices
    .getDisplayMedia({
      video: true,
      audio: true,
    })
    .then(
      () => {
        console.log("success");
      },
      (err) => {
        console.log("err", err);
      }
    );
};
</script>

<template>
  <div>
    <button @click="delay">延迟一秒录屏</button>
    <div
      v-show="showOverlay"
      style="
        position: fixed;
        inset: 0;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      "
      @click="
        resolve?.();
        showOverlay = false;
      "
    >
      点击
    </div>
  </div>
</template>
```

上面的代码中，核心就是下面这段

```javascript
const [promise, r] = usePromise();
resolve = r;
showOverlay.value = true;
await promise;
```

这段逻辑可以无缝植入到原有的逻辑中，并且无需更改任何的流程，只是在写法上有点奇葩...

这样在 Safari 上就能成功在延迟 1s 后调用方法了，不过这样的交互个人而言还是有点丑...

同时，这也解释了前面我们所说的为什么只有一个 `testMethod` 能执行成功的问题。

当我们执行 `getDisplayMedia` 时，接口返回了一个 Promise ，此时我们需要去选择特定的窗口，这个过程很多时候都会超过 1s ，所以就导致了后面的 `testMethod` 调用失败了。

# 后记

最后这个解决的方法并没有合并到代码中，因为我们的系统就是只支持 Chrome 的。并且测试也只是在 Chrome 上测试的。

所以我也不明白为什么客户要在 Safari 上测试...

就算这个 bug 修复了， Safari 依然用不了，因为 Safari 上调用 `navigator.mediaDevices.enumerateDevices` 拿不到 `videooutput` 类型的设备...

果然浏览器还是 Chrome 好，它真的太强大了，太让人省心了~

Safari ? 真不熟！