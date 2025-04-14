---
title: 记一次 rollup 打包代码缺失问题
key: 1650183859date: 2022-04-17 16:24:19
updated: 2023-02-13 18:28:45
tags:
- rollup
- JavaScript
categories:
- 编程
---


# 前言

记一次 `rollup` 打包代码缺失问题

<!-- more -->

# 正文

起因是公司使用了一个名为 `@elastic/apm-rum-core` 的库

该库的作用可以理解为上报用户的操作，比如点击了什么按钮，发起了什么请求等等

>
官方的文档：[Introduction | APM Real User Monitoring JavaScript Agent Reference [5.x] | Elastic](https://www.elastic.co/guide/en/apm/agent/rum-js/current/intro.html)

在源码中，有这么一个 `patchAll` 函数

```javascript
import {patchXMLHttpRequest} from './xhr-patch';
import {patchFetch} from './fetch-patch';
import {patchHistory} from './history-patch';
import {patchEventTarget} from './event-target-patch';
import EventHandler from '../event-handler';
import {HISTORY, FETCH, XMLHTTPREQUEST, EVENT_TARGET} from '../constants';

var patchEventHandler = new EventHandler();
var alreadyPatched = false;

function patchAll() {
  if (!alreadyPatched) {
    alreadyPatched = true;
    patchXMLHttpRequest(function (event, task) {
      patchEventHandler.send(XMLHTTPREQUEST, [event, task]);
    });
    patchFetch(function (event, task) {
      patchEventHandler.send(FETCH, [event, task]);
    });
    patchHistory(function (event, task) {
      patchEventHandler.send(HISTORY, [event, task]);
    });
    patchEventTarget(function (event, task) {
      patchEventHandler.send(EVENT_TARGET, [event, task]);
    });
  }

  return patchEventHandler;
}

export {patchAll, patchEventHandler};
```

其中这个方法使用了 `patchEventTarget` 来包装 `addEventListener` 和 `removeEventListener` 这两个方法

但是很奇怪的是在开发环境下代码没有问题，但是打包之后事件监听的包装效果就不存在了

后面分析打包后的代码发现是 `patchEventTarget` 这个函数被删除了

```javascript
function patchAll() {
  if (!alreadyPatched) {
    alreadyPatched = true;
    patchXMLHttpRequest(function (event, task) {
      patchEventHandler.send(XMLHTTPREQUEST, [event, task]);
    });
    patchFetch(function (event, task) {
      patchEventHandler.send(FETCH, [event, task]);
    });
    patchHistory(function (event, task) {
      patchEventHandler.send(HISTORY, [event, task]);
    });
    // patchEventTarget 函数消失
  }

  return patchEventHandler;
}
```

所以建了一个 `demo` 最小化复现这个现象

[Dedicatus546 / rollup-build-demo](https://github.com/Dedicatus546/rollup-build-demo)

在关闭 `treeshake` 之后，该现象消失，但是很明显即使开启 `treeshake` 功能， `patchEventTarget` 也不应该被优化掉的

另一个很有意思的是如果我们在 `patchAll` 源码中加入一个 `console.log` 来引用 `patchEventTarget` ，那么代码就能正常地打包

```javascript
// ...

function patchAll() {
  if (!alreadyPatched) {
    alreadyPatched = true;
    patchXMLHttpRequest(function (event, task) {
      patchEventHandler.send(XMLHTTPREQUEST, [event, task]);
    });
    patchFetch(function (event, task) {
      patchEventHandler.send(FETCH, [event, task]);
    });
    patchHistory(function (event, task) {
      patchEventHandler.send(HISTORY, [event, task]);
    });
    patchEventTarget(function (event, task) {
      patchEventHandler.send(EVENT_TARGET, [event, task]);
    });
    // 加入一个 console
    console.log(patchEventTarget)
  }

  return patchEventHandler;
}

export {patchAll, patchEventHandler};
```

或者在 `patchEventTarget` 函数内加入一个随意的 `console.log` ，也能正常地打包

```javascript
// ...

export function patchEventTarget(callback) {
  if (!window.EventTarget) {
    return;
  }

  // 加入一个 console
  console.log('hello world!');

  var proto = window.EventTarget.prototype;
  var nativeAddEventListener = proto[ADD_EVENT_LISTENER_STR];
  var nativeRemoveEventListener = proto[REMOVE_EVENT_LISTENER_STR];

  function findTaskIndex(existingTasks, eventType, listenerFn, capture) {
    // ...
  }

  function isCapture(options) {
    // ...
  }

  function createListenerWrapper(target, eventType, listenerFn, options) {
    // ...
  }

  function getWrappingFn(target, eventType, listenerFn, options) {
    // ...
  }

  proto[ADD_EVENT_LISTENER_STR] = function (eventType, listenerFn, optionsOrCapture) {
    // ...
  };

  proto[REMOVE_EVENT_LISTENER_STR] = function (eventType, listenerFn, optionsOrCapture) {
    // ...
  };
}
```

# 后记

已经给 `vite` 提了一个 `issue` 了，不过其实应该给 `rollup` 提 `issue` 的

[some code disappeared when build project](https://github.com/vitejs/vite/issues/7541)

趁着写这篇帖子，也给 `rollup` 提了个 `issue`

[som code in @elastic/apm-rum-core disappear when build](https://github.com/rollup/rollup/issues/4468)