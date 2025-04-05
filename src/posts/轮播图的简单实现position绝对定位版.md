---
title: 轮播图的简单实现position绝对定位版
key: 1605266407date: 2020-11-13 19:20:07
updated: 2023-02-13 18:28:45
tags:
  - JavaScript
  - CSS
  - 轮播图
categories:
  - 编程
---


轮播图的简单实现`position`绝对定位版。

<!-- more -->

在之前的帖子中尝试以`HTML5`中的`flex`布局来实现轮播图。

当然，实现有几个问题：

- 由于基于整个`box`进行移动，比较难以实现单方向的无限下一张；
- 由于基于整个`box`进行移动，在切换某一张图时可能动画过快；
- 由于基于整个`box`进行移动，需要动态计算滑动的距离。

所以本篇实现以绝对定位以及上篇也使用到的`translate3d`来实现。

本篇实现参考了 B 站首页轮播图的实现（实现细节可能不一致，不过视觉上是一致的）。

使用的`HTML`结构和上一篇轮播图的`HTML`结构一样，如下：

```html
<div class="carousel">
  <div class="carousel__container">
    <div class="carousel__item green">A</div>
    <div class="carousel__item red">B</div>
    <div class="carousel__item green">C</div>
    <div class="carousel__item pink">D</div>
    <div class="carousel__item orange">E</div>
  </div>
</div>
<!--额外添加个按钮，这个按钮后面会用到，用来模拟下一张-->
<div style="display: flex;align-items: center;justify-content: center">
  <button id="btn">下一张</button>
</div>
```

本篇实现着重点为**无限下一张**的逻辑，对左右按钮以及下方小点的逻辑省略（最后会有总的实现代码）。

首先我们可以`F12`查看 B 站首页的轮播图的结构和样式切换。

![](https://i.loli.net/2020/11/13/MAIDco5UxLh8OT4.gif)

从右侧的样式上可以看到，每个轮播框都是绝对定位的，然后通过样式来切换，样式主要是`transform:translate3d(x, y, z)`。

从图中几次`style`切换可以看出，初始定位都是全部放在右侧，当前第一张放在可视窗口内。

我们先编写下相应的`css`：

```css
.carousel {
  position: relative;
  width: 500px;
  height: 300px;
  margin: 30px auto;
  background-color: #ffdde3;
  overflow: hidden;
}

.carousel__container {
  width: 100%;
  height: 100%;
}

.carousel__item {
  /*使用绝对定位*/
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
```

`HTML`如下：

```html
<div class="carousel">
  <div class="carousel__container">
    <div
      class="carousel__item green"
      style="transform: translate3d(0px, 0px, 0px); transition: all 0.55s ease 0s;"
    >
      A
    </div>
    <div
      class="carousel__item red"
      style="transform: translate3d(500px, 0px, 0px); transition: all 0.55s ease 0s;"
    >
      B
    </div>
    <div
      class="carousel__item green"
      style="transform: translate3d(500px, 0px, 0px); transition: none 0s ease 0s;"
    >
      C
    </div>
    <div
      class="carousel__item pink"
      style="transform: translate3d(500px, 0px, 0px); transition: none 0s ease 0s;"
    >
      D
    </div>
    <div
      class="carousel__item orange"
      style="transform: translate3d(500px, 0px, 0px); transition: none 0s ease 0s;"
    >
      E
    </div>
  </div>
</div>
<!--额外添加个按钮-->
<div style="display: flex;align-items: center;justify-content: center">
  <button id="btn">下一张</button>
</div>
```

效果如下：

![](https://i.loli.net/2020/11/13/5W18wizqIYU2fMg.gif)

现在如果进行一轮轮播，那么需要以下的步骤：

- 当前的轮播往中心往左移（离开可视窗口）；
- 下一张轮播从右侧往中心移动（进入可视窗口）。

我们通过按钮来实现上面这个下一张的逻辑。

```javascript
const eles = document.getElementsByClassName("carousel__item");
// 当前轮播的索引
let curIdx = 0;
document.getElementById("btn").onclick = function () {
  // 设置动画的过渡时间
  eles[curIdx].style.setProperty("transition", "all 0.5s");
  // 中心往左移动（离开可视窗口）
  eles[curIdx].style.setProperty("transform", "translate3d(-500px,0,0)");

  curIdx++;

  // 设置动画的过渡时间
  eles[curIdx].style.setProperty("transition", "all 0.5s");
  // 从右往左移动（进入可视窗口）
  eles[curIdx].style.setProperty("transform", "translate3d(0,0,0)");
};
```

效果如下：

![](https://i.loli.net/2020/11/13/IPNZlKEkVTwO6MU.gif)

可以看到效果基本出来了。

但是有个问题，上面的实现中没有对`curIdx`进行合法性判断（也就是要小于轮播数量的长度）。

如果一直下一张那么会报错，如下：

![](https://i.loli.net/2020/11/13/yh3LO28vA6o4l5f.gif)

所以要在最后一张时，重新回到第一张。

```javascript
const eles = document.getElementsByClassName("carousel__item");
let curIdx = 0;
document.getElementById("btn").onclick = function () {
  // 设置动画的过渡时间
  eles[curIdx].style.setProperty("transition", "all 0.5s");
  // 中心往左移动（离开可视窗口）
  eles[curIdx].style.setProperty("transform", "translate3d(-500px,0,0)");

  curIdx++;

  // 合法性判断
  if (curIdx === eles.length) {
    curIdx = 0;
  }

  // 设置动画的过渡时间
  eles[curIdx].style.setProperty("transition", "all 0.5s");
  // 从右往左移动（进入可视窗口）
  eles[curIdx].style.setProperty("transform", "translate3d(0,0,0)");
};
```

逻辑上应该没问题，但是实际是有问题的，如下：

![](https://i.loli.net/2020/11/13/koyVxNLfACXZYTF.gif)

发现第一轮没问题，但是第二次循环到 A 图的时候，就发现它从左边往中间移动了。

原因就是当前轮播图离开可视窗口之后，它就一直在左侧不可见区域了，而不是在右侧不可见区域了，如下：

![](https://i.loli.net/2020/11/13/hHaPGAkfJCspzBg.png)

所以需要补充的逻辑就是：在当前轮播图离开可视窗口之前，如果左侧不可见区域还有轮播图，那么把它放到右侧不可见区域。

我们可以用一个变量来保存左侧不可见区域轮播图的索引。

```javascript
let eles = document.getElementsByClassName("carousel__item");
let curIdx = 0;
// 对于刚打开页面的轮播图，此时左侧不可见区域没有，所以设置为-1
let recoveryIdx = -1;

document.getElementById("btn").onclick = function () {
  // 判断，如果-1表示刚启动轮播图，不用重新放到右侧
  if (recoveryIdx !== -1) {
    // 注意这里把过渡关了，这样移动到右侧就不会有动画
    eles[recoveryIdx].style.setProperty("transition", "none");
    eles[recoveryIdx].style.setProperty(
      "transform",
      `translate3d(500px, 0, 0)`
    );
  }

  // 下一次要重新放到右侧的轮播图索引就是当前索引，它会在下一次被放到右侧。
  recoveryIdx = curIdx;

  // 当前轮播图离开
  eles[curIdx].style.setProperty("transition", "all 0.55s");
  eles[curIdx].style.setProperty("transform", `translate3d(-500px, 0, 0)`);

  // 另一种重新计算索引的方式，和上面的一样
  curIdx = (curIdx + 1) % eles.length;

  // 下一张轮播图进入
  eles[curIdx].style.setProperty("transition", "all 0.55s");
  eles[curIdx].style.setProperty("transform", `translate3d(0, 0, 0)`);
};
```

![](https://i.loli.net/2020/11/13/whTgSk89j4iJxyo.gif)

看起来真不错~

**但是**，还是有问题...

回到我们的轮播逻辑，每次操作需要改变三张图片的样式：

- 原来就在左侧的，重新放到右侧；
- 当前位于可见区域的，离开进入左侧不可见区域；
- 当前位于右侧不可见区域的，进入可见区域。

所以轮播的数量必须不小于`3`张，如果是`2`张，那么上面的逻辑就不成立，如下：

![](https://i.loli.net/2020/11/14/G2QBebHdw6Xfo5E.gif)

如果是`1`张，那么轮播图直接不会动了，如下：

![](https://i.loli.net/2020/11/14/hcQXP47V5LlDHrR.gif)

当然，一张图不轮播也没啥大问题，但是`2`张的时候应该是`B`后面跟着`A`（从右侧出来）。

对于每次操作，可以看作是一组绑定的操作，也就是每次必须控制三个节点（三个节点不同）。比较复杂，很容易写漏逻辑。

回归初心，我们要的效果就是下一张从右进入可视窗口，可视窗口的这张往左离开。

那么是否可以每次就控制两个节点来实现这个效果呢？

答案是可以的，之前需要控制三个节点的原因是需要提前把对应的节点搬到右侧（无动画），然后在本次渲染时进行动画过渡。

这得结合浏览器的渲染原理，浏览器会在两个宏任务之间渲染页面，所以我们完全可以先把节点先挪到对应位置，然后在下个宏任务中进行动画操作，如下：

```html
<div class="carousel">
  <div class="carousel__container">
    <div
      class="carousel__item"
      style="transform: translate3d(0px, 0px, 0px); transition: all 0.55s ease 0s;"
    >
      <img src="../images/img1.jpg" alt="" />
    </div>
    <div
      class="carousel__item"
      style="transform: translate3d(500px, 0px, 0px); transition: all 0.55s ease 0s;"
    >
      <img src="../images/img2.jpg" alt="" />
    </div>
  </div>
</div>
```

PS：HTML 结构上换成图片展示了。

```javascript
const eles = document.getElementsByClassName("carousel__item");
const len = eles.length;
let curIdx = 0;

document.getElementById("btn").onclick = function () {
  // 保存离开轮播图的索引
  let last = curIdx;
  // 计算下一张轮播图索引
  curIdx = (curIdx + 1) % len;

  // 先把当前这张放右边
  eles[curIdx].style.setProperty("transition", "none");
  eles[curIdx].style.setProperty("transform", "translate3d(500px, 0, 0)");

  // 浏览器会在当前宏任务执行完毕把下一张轮播图渲染到右侧
  // 下一个宏任务，进行动画的过渡
  // 此时下一张已经在右侧了，直接设置样式进行动画过渡
  setTimeout(() => {
    // 上一张离开
    eles[last].style.setProperty("transition", "all 0.55s");
    eles[last].style.setProperty("transform", `translate3d(-500px, 0, 0)`);

    // 当前这张进入
    eles[curIdx].style.setProperty("transition", "all 0.55s");
    eles[curIdx].style.setProperty("transform", "translate3d(0, 0, 0)");
  }, 0);
};
```

效果如下：

![](https://s3.ax1x.com/2020/11/16/DAtf6P.gif)

这种情况下，对于一张图片的话：

- 如果不需要实现轮播，那么最简单，在下一张的逻辑前进行长度判断即可；
- 如果需要实现轮播，那么可以补一张重复的在它的后面，然后要处理小圆点的逻辑前进行长度判断即可。

效果如下（补一张的效果）：

![](https://s3.ax1x.com/2020/11/16/DAN3ct.gif)

到现在，核心逻辑基本上就结束了，下面是一个完全实现的代码段，包括了左右按钮和小圆点逻辑。

HTML 结构简单，用 js 来生成结构。

```html
<div id="myCarousel"></div>
```

css 结构和之前没啥不同。

```css
.carousel {
  position: relative;
  width: 500px;
  height: 350px;
  margin: 30px auto;
  background-color: #ffdde3;
  overflow: hidden;
}

.carousel__container {
  height: 100%;
}

.carousel__item {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.carousel__item > img {
  display: block;
  width: 100%;
  height: 100%;
}

.carousel__trigger__left,
.carousel__trigger__right {
  position: absolute;
  bottom: 0;
  top: 0;
  margin: auto 0;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: rgba(204, 204, 204, 0.5);
  cursor: pointer;
}

.carousel__trigger__left {
  left: 0;
}

.carousel__trigger__right {
  right: 0;
}

.carousel__trigger__points {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  margin: 0 auto;
  padding: 0;
}

.carousel__trigger__point__item {
  width: 10px;
  height: 10px;
  background-color: rgba(204, 204, 204, 0.5);
  border-radius: 50%;
  margin: 0 10px;
  cursor: pointer;
}

.carousel__trigger__point__item.active {
  background-color: yellow;
}

.carousel__trigger__point__item:hover {
  background-color: yellow;
}
```

`js`代码如下：

```javascript
function createCarousel(urls, config) {
  // 创建整个dom树，返回之后需要用到的部分
  function createDom(urls) {
    function createElement(tag, classList) {
      const el = document.createElement(tag);
      if (!Array.isArray(classList)) {
        classList = [classList];
      }
      el.classList.add(...classList);
      return el;
    }

    const carousel = createElement("div", "carousel");
    const carouselContainer = createElement("div", "carousel__container");
    const carouselTriggerContainer = createElement("div", "carousel__trigger");
    const carouselTriggerLeft = createElement("div", "carousel__trigger__left");
    const carouselTriggerRight = createElement(
      "div",
      "carousel__trigger__right"
    );
    const carouselTriggerPointContainer = createElement(
      "div",
      "carousel__trigger__points"
    );
    carousel.append(carouselContainer);
    carousel.append(carouselTriggerContainer);
    carouselTriggerContainer.append(carouselTriggerLeft);
    carouselTriggerContainer.append(carouselTriggerRight);
    carouselTriggerContainer.append(carouselTriggerPointContainer);

    // 这里表示最少2张
    const len = Math.max(2, urls.length);

    const carouselItemList = [];
    const carouselPointList = [];

    for (let i = 0; i < len; i++) {
      const item = createElement("div", "carousel__item");
      const img = createElement("img");
      // 如果是1张，那么取余就是两种一样的。
      img.src = urls[i % urls.length];
      item.append(img);
      carouselContainer.append(item);
      carouselItemList.push(item);
    }

    for (let i = 0; i < urls.length; i++) {
      const item = createElement("div", "carousel__trigger__point__item");
      carouselPointList.push(item);
      carouselTriggerPointContainer.append(item);
    }

    return {
      // 整个轮播图的root
      carousel,
      // 轮播项目的dom节点数组
      carouselItemList,
      // 左按钮
      carouselTriggerLeft,
      // 右按钮
      carouselTriggerRight,
      // 小点dom节点数组
      carouselPointList,
    };
  }

  // 设置索引对应的样式，没有动画过渡的
  function setPos(idx, mode) {
    dom.carouselItemList[idx].style.setProperty("transition", "none");
    dom.carouselItemList[idx].style.setProperty(
      "transform",
      `translate3d(${mode === "LEFT" ? -100 : 100}%, 0, 0)`
    );
  }

  // 设置索引对应的样式，有动画过渡
  function go(idx, pos) {
    dom.carouselItemList[idx].style.setProperty("transition", "all 0.55s");
    dom.carouselItemList[idx].style.setProperty(
      "transform",
      `translate3d(${pos}%, 0, 0)`
    );
  }

  // 一个动画函数，先设置到对应位置，然后在渲染之后立即进行动画过渡
  function animate(__curIdx, __nextIdx, dir) {
    // 右向左
    if (dir === "RIGHT_TO_LEFT") {
      setPos(__nextIdx, "RIGHT");
      setTimeout(() => {
        go(__curIdx, -100);
        go(__nextIdx, 0);
      });
    } else {
      setPos(__nextIdx, "LEFT");
      setTimeout(() => {
        go(__curIdx, 100);
        go(__nextIdx, 0);
      });
    }
    // 设置小圆点样式，如果只有一张就不改样式了，没意义
    if (realLen !== 1) {
      dom.carouselPointList[__curIdx].classList.remove("active");
      dom.carouselPointList[__nextIdx].classList.add("active");
    }
  }

  const {
    mount: root = document.getElementsByTagName("body")[0],
    defaultIdx = 0,
  } = config;
  let dom = createDom(urls);
  let curIdx = defaultIdx;
  const len = dom.carouselItemList.length;
  const realLen = dom.carouselPointList.length;

  // 向左切换
  function __triggerLeft() {
    let last = curIdx;
    // 计算当前的左边的一张
    curIdx = (len + curIdx - 1) % len;
    animate(last, curIdx, "LEFT_TO_RIGHT");
  }

  // 向右切换
  function __triggerRight() {
    let last = curIdx;
    // 计算当前的右边的一张
    curIdx = (curIdx + 1) % len;
    animate(last, curIdx, "RIGHT_TO_LEFT");
  }

  // 小点切换
  function __triggerPoint(index) {
    return function () {
      if (realLen === 1 || index === curIdx) {
        return;
      }
      let last = curIdx;
      curIdx = index;
      animate(last, curIdx, last < curIdx ? "RIGHT_TO_LEFT" : "LEFT_TO_RIGHT");
    };
  }

  // 事件绑定
  dom.carouselTriggerLeft.addEventListener("click", __triggerLeft);
  dom.carouselTriggerRight.addEventListener("click", __triggerRight);
  const events = {};
  dom.carouselPointList.forEach((pointEl, index) => {
    pointEl.addEventListener("click", (events[index] = __triggerPoint(index)));
  });

  // 初始化样式，主要是对当前的索引进行样式设定
  function init() {
    dom.carouselItemList.forEach((item, index) => {
      if (index !== curIdx) {
        setPos(index, 500);
      }
    });
    dom.carouselPointList[curIdx].classList.add("active");
  }

  // 初始化
  init();
  // 挂载
  root.append(dom.carousel);

  return {
    // 返回一个对象，销毁这个轮播图，主要是解除事件监听
    destroy: function () {
      dom.carouselTriggerLeft.removeEventListener("click", __triggerLeft);
      dom.carouselTriggerRight.removeEventListener("click", __triggerRight);
      dom.carouselPointList.forEach((pointEl, index) => {
        pointEl.removeEventListener("click", events[index]);
      });
      dom = null;
    },
  };
}
```

## 2 张以上的`demo`

`js`代码

```javascript
const carousel = createCarousel(
  [
    "../images/img1.jpg",
    "../images/img2.jpg",
    "../images/img3.jpg",
    "../images/img4.jpg",
  ],
  {
    mount: document.getElementById("myCarousel"),
    defaultIdx: 0,
  }
);
```

效果如下：

![](https://s3.ax1x.com/2020/11/16/DE3IsO.gif)

## 1 张的`demo`

`js`代码

```javascript
const carousel = createCarousel(["../images/img1.jpg"], {
  mount: document.getElementById("myCarousel"),
  defaultIdx: 0,
});
```

![](https://s3.ax1x.com/2020/11/16/DE89eg.gif)

# 后记

还有点不足就是没有实现定时器的部分，就交给看到帖子的你啦~

思路就是监听`mouseenter`和`mouseleave`来设置和清除定时器。

定时器就是右边按钮的逻辑。

在返回的销毁函数中销毁即可。

`demo`如下：

![](https://s3.ax1x.com/2020/11/17/DE0224.gif)
