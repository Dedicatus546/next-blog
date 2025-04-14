---
title: jQuery 入门使用
tags:
  - JavaScript
  - jQuery
categories:
  - 编程
key: 1687532698date: 2023-06-23 23:04:58
updated: 2023-06-23 23:04:58
---


# 前言

鲁迅说过：不会 jQuery 的前端工程师不是好工程师。

<!-- more -->

公司的很多项目都还在用 [jQuery](https://jquery.com/) 来作为主力的框架，配合 [RequireJS](https://requirejs.org/docs/start.html) 来做模块分割

# 正文

## ready

在 jQuery 中，有很多种方式来 `DOMContentLoaded` 或者 `load` 事件监听的效果

一般我们会把代码包裹在 `load` 或者 `DOMContentLoaded` 的回调中：

```javascript
document.addEventListener('load', function () {
  // 核心代码
})
```

包裹在其中的原因是因为这个回调会在文档加载完成后调用，这意味着我们可以放心的使用 dom 操作，而不会发生 dom 元素不存在的情况

在 jQuery 中，我们可以使用如下写法：

```javascript
jQuery(function() {
  // dom 准备完成
});

jQuery(document).ready(function (){
  // dom 准备完成
});

jQuery.ready.then(function() {
  // dom 准备完成
});
```

## 获取 dom 元素

在原生的 JavaScript 中，我们会使用 `document.getElementsByClassname` 、 `document.getElementById` 、 `document.getElementsByTagName` 来获取相应的 dom 元素

当然，我们也可以使用 `document.querySelector` 或者 `document.querySelectorAll` 来获取 dom 元素，这个相比上面三个的有点就是不用区分是标签，还是类名，还是 id ，但需要完整写出待查询的内容的类别。比如类名是由一个点开始，而 id 则是由一个哈希符号开始。

```javascript
document.addEventListener("load", function () {
  document.getElementById("id1");             // 查找 #id1 的元素
  document.getElementsByTagName("p");         // 查找 p 标签元素
  document.getElementsByClassName("class1");  // 查找 class1 类的元素
  
  document.querySelector("#id1");
  document.querySelector("p");
  document.querySelector(".class1");
});
```

在 jQuery 中，我们只需要直接将查询的内容传入 jQuery 函数即可

```javascript
jQuery(function() {
  jQuery("#id1");
  jQuery(".class1");
  jQuery("p");
})
```

通过 jQuery 函数返回之后，我们就得到了一个 jQuery 的对象， jQuery 封装了很多常用的方法供我们使用，大大减少了原生写法带来的代码量。

## 监听事件

在原生的 JavaScript 中，我们可以听过直接往 dom 元素上挂在 onXXX ，或者使用 `dom.addEventListener` 来绑定事件回调

```javascript
// onXXX 方式
document.onload = function () {
  
};

// addEventListener 方式
document.addEventListener('load', function () {
  
});
```

在 jQuery 中，提供了一个 `on` 方法来绑定事件回调

```javascript
jQuery(function () {
  // 给 p 标签绑定点击事件
  jQuery('p').on('click', function () {
    
  });
})
```

如果我们想模拟出发某些事件，我们可以使用 `trigger` 方法

```javascript
jQuery(function () {
  // 触发 click 事件
  jQuery('p').trigger('click');
});
```

在 3.3 版本之前，我们可以使用直接使用 `click` 方法来绑定和触发，不过在 3.3 版本开始就废弃了这个 api 了

```javascript
// 绑定
jQuery('p').click(function() {
  
});

// 触发
jQuery('p').click();
```

直接通过方法名来进行注册这种方式在 3.3 版本就被废弃了，比如 `resize` 或者 `scroll` 都已被废弃 

而 on 方式在 1.7 版本就有了，所以推荐一律使用 on 方法来注册事件回调。

除了直接监听，我们也可以使用广为人知的一种方式，那就是事件代理

事件代理的好处就是我们只需要对某个根节点进行监听，通过判断真正触发事件的元素来进行对应的操作

这不仅可以减少内存占用，而且可以动态监听新增的节点

假设我们现在有如下 dom

```html
<ul class="list">
  <li>1</li>
  <li>2</li>
  <li>3</li>
</ul>
```

在原生的 JavaScript 中，我们可以通过下面的代码实现事件代理

```javascript
const ulEl = document.querySelector("ul.list");
ulEl.addEventListener("click", (e) => {
  const target = e.target;
  if (target.tagName.toLowerCase() === "li") {
    console.log("click");
  }
});
```

在 jQuery 中，我们使用 `delegate` 或者是 `on` 来事件

其中 `delegate` 在 3.0 版本被废弃，而 `on` 是在 1.7 版本之后支持事件代理的写法

```javascript
// delegate 方式
jQuery("ul.list").delegate("li", "click", function () {
  console.log("click");
});

// on 方式
jQuery("ul.list").on("click", "li", function () {
  console.log("click");
})
```

这里建议统一使用 on ，方便理解。

## 文档增删

在原生 JavaScript 中，增删文档最常用的就是 `innerHTML` , `innerText` , `append` , `prepend` , `after` , `before` 这几个接口了

`append` , `prepend` 是相对自身的子元素位置进行插入，而 `after` , `before` 则是相对自身位置进行插入

假设现在有如下 dom

```html
<div class="parent">
  <div class="child1"></div>
  <div class="child2"></div>
</div>
```

此时如果我们想在 `.child1` 前增加一个 `.child0` 的 div ，那么可以进行如下操作

创建一个对应的 div

```javascript
const c0 = document.createElement("div");
c0.classList.add("child0");
c0.textContent = "child0";
```

使用 prepend 

```javascript
const parent = document.querySelector(".parent");
parent.prepend(c0);
```

或者使用 before

```javascript
const c1 = document.querySelector(".child1");
c1.before(c0);
```

在 JQuery 中，也提供了相似的 API ，即 `html` , `text` , `append` , `appendTo` , `prepend` , `prependTo` , `before` , `after` , `insertBefore` , `insertAfter` 。

这里面有几个以 To 结尾的方法，其实和它们对应的没有 To 后缀的方法是一样的功能，只不过“反转”了控制

假设现在有如下 dom

```html
<div class="container">
  <div class="item1"></div>
</div>
```

在 `.item1` 后面增加一个 `.item2` 的话，我们可以用 `append` 和 `appendTo` 两种方式来实现

```javascript
// append
jQuery(".container").append("<div class='item2'></div>");

// appendTo
jQuery("<div class='item2'></div>").appendTo(".container");
```

## ajax

原生的 JavaScript 提供了 `XMLHttpRequest` 对象来让我们发送请求，它的写法如下：

get 请求

```javascript
const xhr = new XMLHttpRequest();
xhr.addEventListener("readystatechange", () => {
  if (xhr.readyState === XMLHttpRequest.DONE) {
    if (xhr.status === 200) {
      // 请求成功
      console.log("结果：", JSON.parse(xhr.responseText));
    } else {
      // 请求失败
    }
  }
});
// 使用 apifox 的测试接口
const url = new URL("https://echo.apifox.com/get");
url.searchParams.set("id", "109");
url.searchParams.set("name", "lwf");
xhr.open("get", url.toString(), true);
xhr.send();
```

post 请求

```javascript
const xhr = new XMLHttpRequest();
xhr.addEventListener("readystatechange", () => {
  if (xhr.readyState === XMLHttpRequest.DONE) {
    if (xhr.status === 200) {
      // 请求成功
      console.log("结果：", JSON.parse(xhr.responseText));
    } else {
      // 请求失败
    }
  }
});
// 使用 apifox 的测试接口
const url = new URL("https://echo.apifox.com/post");
xhr.open("post", url.toString(), true);
xhr.setRequestHeader("content-type", "application/json");
const json = {
  id: 109,
  name: "lwf",
};
xhr.send(JSON.stringify(json));
```

在 jQuery 中，帮我们封装了 `XHRHttpRequest` 对象，通过 `jQuery.ajax` 来使用

get 请求

```javascript
jQuery.ajax({
  method: "get",
  data: {
    id: 109,
    name: "lwf",
  },
  url: "https://echo.apifox.com/get",
  success: function (data) {
    console.log("data: ", data);
  },
  error: function (e) {
    console.error(e);
  },
});
```

post 请求

```javascript
jQuery.ajax({
  method: "post",
  data: JSON.stringify({
    id: 109,
    name: "lwf",
  }),
  headers: {
    "content-type": "application/json",
  },
  url: "https://echo.apifox.com/post",
  success: function (data) {
    console.log("data: ", data);
  },
  error: function (e) {
    console.error(e);
  },
});
```

除了 jQuery.ajax ， jQuery 也导出了一些简写的 API ，即` jQuery.get` 和 `jQuery.post`

# 后记

我还是很不喜欢写原生 js 的，一方面旧项目的代码残破不堪，各种补丁，另一方面，以我的水平很难分离代码逻辑和 dom 操作，写起来实在是有点心力交瘁。

不过这都是工作嘛，工作讲究的就是一个完成任务，能跑就行。

不要跟我说什么 Vue 、 React 、 Angular 。老夫写项目就是 jQuery 一把梭，梭哈就完事。