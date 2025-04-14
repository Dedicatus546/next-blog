---
title: 轮播图的简单实现flex版
key: 1604389039date: 2020-11-03 15:37:19
updated: 2020-11-03 15:37:19
tags:
  - JavaScript
  - CSS
  - 轮播图
categories:
  - 编程
---

轮播图的简单实现`flex`版。

<!-- more -->

轮播图，一般就是几张图依次的滑动到当前盒子的可视窗口中。

这里需要使用到`overflow: hidden`来隐藏溢出的盒子。

以及使用`transform: translateX()`来做盒子的移动。

先来写写`HTML`的部分，使用原生的`js`来完成。

```html
<div class="carousel">
  <div class="carousel__container">
    <!-- 这里放图片的盒子 -->
  </div>
  <div class="carousel__trigger">
    <!-- 这里放左右按钮和下侧的小圆点 -->
  </div>
</div>
```

写一些简单的样式来看看：

```css
.carousel {
  position: relative;
  width: 500px;
  height: 300px;
  /* 设置下左右居中以及给个背景色，方便看 */
  margin: 30px auto;
  background-color: pink;
}

.carousel__container {
  width: 100%;
  height: 100%;
}
```

ok，现在我们可以在网页上看到一块粉色的画布了：

![](https://i.loli.net/2020/11/03/NIDkTQxJmXl95nO.png)

接着我们先不用`img`标签，先用不同背景色的`div`的盒子来填充`div.carousel__container`。

```html
<div class="carousel">
  <div class="carousel__container">
    <!-- 这里放图片的盒子 -->
    <div class="carousel__item red"></div>
    <div class="carousel__item green"></div>
    <div class="carousel__item blue"></div>
    <div class="carousel__item orange"></div>
  </div>
  <div class="carousel__trigger">
    <!-- 这里放左右按钮和下侧的小圆点 -->
  </div>
</div>
```

然后添加颜色的`class`类：

```css
.red {
  background-color: darkred;
}

.orange {
  background-color: darkorange;
}

.green {
  background-color: darkgreen;
}

.blue {
  background-color: darkblue;
}
```

![](https://i.loli.net/2020/11/03/EPBURzZ1Vvjtl48.png)

发现怎么都没显示。

![](https://pic2.zhimg.com/80/v2-8b30d73550d4b42f1c0b3dda3723dad4_720w.jpg?source=1940ef5c)

没错，盒子的`div`忘记设置高度了，给他补上。

```css
.carousel__item {
  height: 100%;
}
```

![](https://i.loli.net/2020/11/03/7Xs6kWwpyQoHqrI.png)

现在，高度也有了，但是 emmm，应该是横向摆放才对诶。

由于盒子是`div`，`div`默认`display`为`block`，块级元素自动占据一行，所以会从上往下排列。

为了使得从左向右排序，可以使用`display: flex`，然后设置`flex-wrap: no-wrap`，使得盒子即使在宽度不够的情况下不换行排放。

```css
.carousel__container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: nowrap;
}

.carousel__item {
  width: 100%;
}
```

![](https://i.loli.net/2020/11/03/uzx2ATnyg4lUdB5.png)

效果出来是出来了，但是四个盒子挤在父盒子里面了，我们希望挤出父盒子按一行排列。

这时候要在`div.carousel__item`设置`flex-shrink`缩放比例来让盒子不进行缩放，给它设置成`0`。

```css
.carousel__item {
  width: 100%;
  flex-shrink: 0;
}
```

![](https://i.loli.net/2020/11/03/ev9wqfpgnVKz7ma.gif)

没问题，四个颜色盒子都是和最外面的大盒子的宽度一样，撑开了父盒子。

接下来，在最外面的盒子上添加`overflow: hidden`，使得溢出的部分消失。

```css
.carousel {
  /*...其他样式*/

  overflow: hidden;
}
```

![](https://i.loli.net/2020/11/03/TjruDChVevIG9pX.png)

可以看到，在`red`后的`green`盒子已经被隐藏了。

我们可以先写点`transform`样式看是否还存在盒子。

```css
.carousel__container {
  /*...其他样式*/

  transform: translate3d(-50%, 0, 0);
}
```

![](https://i.loli.net/2020/11/03/YxVNyUrPk7nb4QS.png)

确实有一半的图片显示出来了，接下来无非就是使用`js`来控制`div.carousel__container`上`transform: translate3d`的第一个参数的值了。

ok，那先把`js`逻辑放一旁，先来设计左右两侧的按钮和下面的小点。

```html
<div class="carousel">
  <div class="carousel__container">
    <!-- 这里放图片的盒子 -->
    <div class="carousel__item red"></div>
    <div class="carousel__item green"></div>
    <div class="carousel__item blue"></div>
    <div class="carousel__item orange"></div>
  </div>
  <div class="carousel__trigger">
    <!--这里放左右按钮和下侧的小圆点-->
    <!--左侧按钮-->
    <span class="carousel__trigger__left"></span>
    <!--右侧按钮-->
    <span class="carousel__trigger__right"></span>
    <!--底部小圆点-->
    <ul class="carousel__trigger__points">
      <li class="carousel__trigger__point__item"></li>
      <li class="carousel__trigger__point__item"></li>
      <li class="carousel__trigger__point__item"></li>
      <li class="carousel__trigger__point__item"></li>
    </ul>
  </div>
</div>
```

注意，左右的按钮和下方的小点都是通过绝对定位来布局，所以`div.carousel`要加上`position: relative`。

再加上一些`css`

```css
.carousel__trigger__left,
.carousel__trigger__right {
  position: absolute;
  bottom: 0;
  top: 0;
  margin: auto 0;
  display: inline-block;
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
  list-style: none;
  padding: 0;
  display: flex;
  justify-content: center;
}

.carousel__trigger__point__item {
  width: 10px;
  height: 10px;
  background-color: rgba(204, 204, 204, 0.5);
  border-radius: 50%;
  margin: 0 10px;
  cursor: pointer;
}
```

![](https://i.loli.net/2020/11/03/2ND6PoVEe5nH8rv.png)

嗯，现在感觉有模有样了，当然，这里的样式可能有点丑，如果有按钮图标的话能好看很多。

当然好看不是重点。

接下来就可以编写`js`逻辑了。

首先我们先实现按钮点击事件切换图片。

```javascript
const leftBtn = document.getElementsByClassName("carousel__trigger__left")[0];
const rightBtn = document.getElementsByClassName("carousel__trigger__right")[0];
const container = document.getElementsByClassName("carousel__container")[0];
let curIndex = 0;
const len = 4;
leftBtn.addEventListener("click", () => {
  if (curIndex <= 0) {
    return;
  }
  curIndex--;
  container.style.setProperty(
    "transform",
    `translate3d(-${curIndex * 100}%,0,0)`
  );
});
rightBtn.addEventListener("click", () => {
  if (curIndex >= len) {
    return;
  }
  curIndex++;
  container.style.setProperty(
    "transform",
    `translate3d(-${curIndex * 100}%,0,0)`
  );
});
```

![](https://i.loli.net/2020/11/03/T5dPOjiC13SLGlw.gif)

逻辑基本没啥问题，但是没有动画效果。

这是因为没有设置`transition`，可以在`.carousel__container`上设置。

```css
.carousel__container {
  /*...其他样式*/

  transition: transform 1s linear;
}
```

![](https://i.loli.net/2020/11/03/WNGepEzOmKoyucf.gif)

现在就可以发现有动画效果了。

接下来就是给下面四个点设置点击事件。

```javascript
// 接着上面的js继续往下写
const points = document.getElementsByClassName(
  "carousel__trigger__point__item"
);
for (let i = 0; i < points.length; i++) {
  points[i].addEventListener("click", () => {
    curIndex = i;
    container.style.setProperty(
      "transform",
      `translate3d(-${curIndex * 100}%,0,0)`
    );
  });
}
```

![](https://i.loli.net/2020/11/03/QHRAh7J98n4uVjk.gif)

四个点也可以点击然后切换到相应的图片了。

现在还有一个比较重要的功能，就是自动轮播，也就是在鼠标不在这个轮播图中的时候，它会自动的跳到下一张或者上一张。

```javascript
let timer;
const carousel = document.getElementsByClassName("carousel")[0];
let dir = 1;
carousel.addEventListener("mouseenter", () => {
  if (timer) {
    clearInterval(timer);
  }
});

carousel.addEventListener("mouseleave", () => {
  timer = setInterval(() => {
    if (curIndex === 0) {
      dir = 1;
    } else if (curIndex === len - 1) {
      dir = -1;
    }
    if (dir === 1) {
      curIndex++;
    } else {
      curIndex--;
    }
    container.style.setProperty(
      "transform",
      `translate3d(-${curIndex * 100}%,0,0)`
    );
  }, 2000);
});
```

![](https://i.loli.net/2020/11/03/5zPMiVHN81wFZUI.gif)

注意这里使用的是`mouseenter`和`mouseleave`事件，而不是`mouseover`和`mouseout`，这是因为前两个事件只会捕获而不会冒泡。

冒泡会导致重复的事件调用，在进入内层时又会冒泡使得外层的绑定函数再一次被调用。

发现鼠标划入和划出都符合预期的逻辑，但是有一个问题。

就是逻辑上来讲，在刚进入页面时要自动轮播的，但是这里的设置定时器是在`mouseleave`事件里面设置的，导致了刚打开页面不会自动轮播。

所以我们要在页面启动就设置一次定时器，代码可以改为：

```javascript
let timer;
const carousel = document.getElementsByClassName("carousel")[0];
let dir = 1;
carousel.addEventListener("mouseenter", () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});
// 封装成一个timerCall函数
function timerCall() {
  if (curIndex === 0) {
    dir = 1;
  } else if (curIndex === len - 1) {
    dir = -1;
  }
  if (dir === 1) {
    curIndex++;
  } else {
    curIndex--;
  }
  container.style.setProperty(
    "transform",
    `translate3d(-${curIndex * 100}%,0,0)`
  );
}

carousel.addEventListener("mouseleave", () => {
  if (timer) {
    return;
  }
  setInterval(timerCall, 2000);
});
timer = setInterval(timerCall, 2000);
```

现在有点不完美的地方就是下面的小点应该在每一次的切换时有一个样式。

没关系，接下来我们开始来优化这个代码。

之前写的代码都是写死几个图片，这次使用类来写这个代码。

```javascript
class Carousel {
  // ... 这里写代码
}
```

来写构造器，我们需要一个字符串的数组，表示图片的地址。

还需要一个容器来放我们的通过`js`拼接的`html`代码。

```javascript
class Carousel {
  imgUrlArray;
  mountNode;

  __root;
  __render;
  __timer;
  __curIndex;
  __ms;
  __triggerLeftBtnElement;
  __triggerRightBtnElement;
  __triggerPointElements;
  __imgElements;
  __imgContainer;

  constructor(imgUrlArray, config) {
    // 传入一个数组，存放url或者其他，可以通过config的render来配置每一个位置的渲染
    if (!Array.isArray(imgUrlArray)) {
      console.warn("argument 'imgUrl' must be an Array");
      imgUrlArray = [];
    }
    this.imgUrlArray = imgUrlArray.slice();
    // config配置
    const {
      // 挂载的节点，传入一个dom对象
      mountNode,
      // 轮播的时间
      ms = 2000,
      // 渲染函数，默认直接渲染内容
      render = (v) => v,
    } = config;
    if (!mountNode) {
      throw new Error("argument 'root' in config must be exist");
    }
    this.mountNode = mountNode;
    this.__render = render;
    this.__curIndex = 0;
    this.__ms = ms;
    this.__dir = 1;
    // 创建整个轮播图的dom
    this.createRoot();
  }
}
```

通过之前的代码可以发现每次我们改变`curIndex`时，就需要去改变相应的样式，所以可以先把样式的变化抽成一个函数

```javascript
class Carousel {
  // 所有改变curIndex的逻辑都要放到fn里面
  callWithStyleUpdate(
    fn = noop,
    callbacks = {
      before: this.clearStyle,
      after: this.setStyle,
    }
  ) {
    const { before, after } = callbacks;
    // 清除样式
    before.call(this, this.__curIndex);
    // 执行逻辑，可能下一张，可能上一张，可能通过小点切换
    fn();
    // 赋予新的节点样式
    after.call(this, this.__curIndex);
  }

  // 清除改变前对应curIndex节点样式
  clearStyle(curIndex) {
    const { __triggerPointElements } = this;
    // 这里只要把小店的active删除即可，样式比较简单
    __triggerPointElements[curIndex].classList.remove("active");
  }

  // 设置改变后对应curIndex节点的样式
  setStyle(curIndex) {
    const { __triggerPointElements, __imgContainer } = this;
    // 整个container要便宜到新的位置
    __imgContainer.style.setProperty(
      "transform",
      `translate3d(-${curIndex * 100}%,0,0)`
    );
    // 给对应小点赋值上active
    __triggerPointElements[curIndex].classList.add("active");
  }
}
```

修改样式其实很多地方的逻辑都是一样的，没有必要在每个地方都写一样的代码，所以我个人把它抽成一个类似回调的调用。

这样如果以后新增了样式，那么只需要在`clearStyle`或者`setStyle`里面进行修改即可，有点装饰器模式的味道。

```javascript
class Carousel {
  createRoot() {
    // 给节点赋值class列表
    function setClass(node, classList) {
      if (!Array.isArray(classList)) {
        classList = [classList];
      }
      classList.forEach((className) => {
        node.classList.add(className);
      });
    }

    // 创建一个节点，然后赋值对应class
    function createElement(tag, classList) {
      const ele = document.createElement(tag);
      setClass(ele, classList);
      return ele;
    }

    // 创建根，也就是div.carousel，是整个轮播图的最外层容器
    this.__root = createElement("div", "carousel");
    const { __root: root, imgUrlArray } = this;

    // 依次是对应的节点
    const container = createElement("div", "carousel__container");
    const triggers = createElement("div", "carousel__trigger");
    const triggerLeft = createElement("div", "carousel__trigger__left");
    const triggerRight = createElement("div", "carousel__trigger__right");
    const triggerPointContainer = createElement(
      "ul",
      "carousel__trigger__points"
    );

    // 根据传入的数组来创建小点列表和轮播列表
    for (let i = 0; i < imgUrlArray.length; i++) {
      const div = createElement("div", "carousel__item");
      // 这里使用了传入的render函数来生成节点的内容
      const content = this.__render(imgUrlArray[i], i);
      div.innerHTML = content;
      container.append(div);
      triggerPointContainer.append(
        createElement("li", "carousel__trigger__point__item")
      );
    }

    // 插入对应父节点下面
    triggers.append(triggerLeft);
    triggers.append(triggerRight);
    triggers.append(triggerPointContainer);

    root.append(container);
    root.append(triggers);

    // 把常用的节点挂载到this上，方便之后调用
    this.__triggerPointElements = triggerPointContainer.children;
    this.__imgContainer = container;
    this.__imgElements = container.children;
    this.__triggerLeftBtnElement = triggerLeft;
    this.__triggerRightBtnElement = triggerRight;
  }
}
```

`createRoot`逻辑单一，就是创建整个轮播图的`dom`结构。

```javascript
class Carousel {
  // 给小点和左右按钮定义点击事件
  bindTriggerEvent() {
    const {
      __triggerLeftBtnElement,
      __triggerRightBtnElement,
      __triggerPointElements,
    } = this;
    __triggerLeftBtnElement.addEventListener("click", () => {
      // 如果已经是第一张，那么不能再继续上一张了，直接返回
      if (this.__curIndex === 0) {
        return;
      }
      this.callWithStyleUpdate(() => {
        this.__curIndex--;
      });
    });
    __triggerRightBtnElement.addEventListener("click", () => {
      // 如果是最后一张，那么不能再继续上一张，直接返回
      if (this.__curIndex === this.imgUrlArray.length - 1) {
        return;
      }
      this.callWithStyleUpdate(() => {
        this.__curIndex++;
      });
    });
    for (let i = 0; i < __triggerPointElements.length; i++) {
      __triggerPointElements[i].addEventListener("click", () => {
        this.callWithStyleUpdate(() => {
          this.__curIndex = i;
        });
      });
    }
  }
}
```

`bindTriggerEvent`用于绑定左右按钮和小点的事件，使得我们可以通过点击这些节点来切换到对应的轮播页。

```javascript
class Carousel {
  // 定时器的函数
  timerHandler() {
    this.callWithStyleUpdate(() => {
      if (this.__curIndex === 0) {
        // 第一张此时方向往右往左移动，最后一张为左往右移动
        this.__dir = 1;
      } else if (this.__curIndex === this.imgUrlArray.length - 1) {
        this.__dir = -1;
      }
      this.__curIndex += this.__dir;
    });
  }

  // 清除定时器
  clearTimer() {
    if (this.__timer) {
      clearInterval(this.__timer);
      this.__timer = null;
    }
  }

  // 启动定时器来使得可以自动轮播
  startTimer() {
    // 小于等于1张不用设置定时器
    if (this.imgUrlArray.length > 1) {
      // 鼠标进入根节点就清除定时器
      this.__root.addEventListener("mouseenter", this.clearTimer.bind(this));
      // 鼠标离开根节点就设置定时器
      this.__root.addEventListener("mouseleave", () => {
        this.clearTimer();
        this.__timer = setInterval(this.timerHandler.bind(this), this.__ms);
      });
      this.__timer = setInterval(this.timerHandler.bind(this), this.__ms);
    }
  }
}
```

这三个函数构成了定时器的逻辑。

```javascript
class Carousel {
  // 真正把轮播图挂载到节点上
  mount() {
    this.mountNode.append(this.__root);
    // 绑定左右按钮和下面小点切换的函数
    this.bindTriggerEvent();
    // 启动计时器
    this.startTimer();
    // 初始化样式
    this.callWithStyleUpdate();
  }

  // 销毁这个轮播图
  destroy() {
    this.clearTimer();
  }
}
```

基本上轮播图类就完成了，可以试下效果。

```javascript
// 测试代码
const carousel = new Carousel(["A", "B", "C"], {
  mountNode: document.querySelector("#app"),
  render: (item, index) => {
    return `
      <div style="height: 100%;display: flex;align-items: center;justify-content: center;font-size: 20px">
        ${item}
      </div>
     `;
  },
});
carousel.mount();
```

![](https://i.loli.net/2020/11/06/iaeTrsbvSn3kmYP.gif)

虽然完成了，但是还有很多可以优化的地方，比如这里的销毁只是把定时器给消除了。

但是对于单页面组件来说，通过`addEventListener`监听的函数也必须删除，所以监听的函数必须在`destroy`中使用`removeEventListener`解除。

由于篇幅的限制，本篇主要讲述我个人的轮播图的实现思路。

当然，使用整个盒子移动的实现可能不是特别的常见，我看很多的轮播图都是基于绝对定位来进行动画的切换，下篇可能会写写思路。

所以，当作一个小`demo`也未尝不可，自己实际写写也有助于理解嘛。
