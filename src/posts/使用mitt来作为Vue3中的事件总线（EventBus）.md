---
title: 使用mitt来作为Vue3中的事件总线（EventBus）
key: 1644846252date: 2022-02-14 21:44:12
updated: 2023-02-13 18:28:44
tags:
  - JavaScript
  - Vue
  - EventBus
  - mitt
categories:
  - 编程
---


# 前言

使用 `mitt` 来作为 `Vue3` 中的事件总线（`EventBus`）

<!-- more -->

# 正文

在 `Vue2` 中，我们习惯使用 `new Vue()` 来创建一个 `Vue` 实例

只使用这个实例来调用 `$on` 或者 `$off` 来添加或者删除事件回调，使用 `$emit` 来调用改事件的所有回调

这样就可以在不同组件之间进行数据传递

```js
// emitter.js
import Vue from "vue";

export const emitter = new Vue();
```

```js
// main.js
import { emitter } from "./emitter.js";

Vue.prototype.$emitter = emitter;
```

使用 `emitter`

```js
// component-1
export default {
  methods: {
    send() {
      this.$emitter.$emit("eventName", "data");
    },
  },
};
```

```js
// component-2
export default {
  methods: {
    callback(data) {
      // 打印 'data'
      console.log(data);
    },
  },
  mounted() {
    this.$emitter.$on("eventName", this.callback);
  },
  beforeDestroy() {
    this.$emitter.$off("eventName", this.callback);
  },
};
```

在 `Vue3` 中，官方已经不推荐使用 `new Vue()` 来构造事件总线了

而推荐使用 `mitt` 或者 `tiny-emitter` 库来进行替代

> [事件总线 - 事件 API | Vue.js](https://v3.cn.vuejs.org/guide/migration/events-api.html#%E4%BA%8B%E4%BB%B6%E6%80%BB%E7%BA%BF)

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/02/14/202202142228285.avif)

这两个类库的实现都是差不多的

## mitt

> [mitt - Github](https://github.com/developit/mitt)

使用 `TS` 编写，有完整的类型推断

支持 `*` 作为事件名

`*` 作为事件名即任何 `emit` 都会触发这些事件回调

源码如下（删除部分 `TS` 类型代码）

```typescript
export default function mitt<Events extends Record<EventType, unknown>>(
  all?: EventHandlerMap<Events>
): Emitter<Events> {
  all = all || new Map();

  return {
    // 存放 eventName -> handler[]
    all,

    on<Key extends keyof Events>(type: Key, handler: GenericEventHandler) {
      // 从 all 这个 map 中拿到对应名字的回调列表
      const handlers: Array<GenericEventHandler> | undefined = all!.get(type);

      // 加入，特殊处理第一次加入的情况
      if (handlers) {
        handlers.push(handler);
      } else {
        all!.set(type, [handler] as EventHandlerList<Events[keyof Events]>);
      }
    },

    off<Key extends keyof Events>(type: Key, handler?: GenericEventHandler) {
      const handlers: Array<GenericEventHandler> | undefined = all!.get(type);
      if (handlers) {
        // 找到 handler 然后从数组中删除
        if (handler) {
          handlers.splice(handlers.indexOf(handler) >>> 0, 1);
        } else {
          // 不传 handler 则删除该事件名的全部回调
          all!.set(type, []);
        }
      }
    },

    emit<Key extends keyof Events>(type: Key, evt?: Events[Key]) {
      let handlers = all!.get(type);
      if (handlers) {
        (handlers as EventHandlerList<Events[keyof Events]>)
          .slice()
          .map((handler) => {
            // 执行
            handler(evt!);
          });
      }

      // 处理 * 事件名的情况
      handlers = all!.get("*");
      if (handlers) {
        (handlers as WildCardEventHandlerList<Events>)
          .slice()
          .map((handler) => {
            // 作为 * 的回调，会在第一个参数传入触发它的事件名，和具名事件的回调存在一定区别
            handler(type, evt!);
          });
      }
    },
  };
}
```

## tiny-emitter

> [tiny-emitter - Github](https://github.com/scottcorgan/tiny-emitter)

有 `index.d.ts` 文件，不过源码使用 `js` 编写

不支持 `*` 作为事件名，不过封装了 `once` 方法

源码如下：

```js
// 构造函数
function E() {}

// 覆盖原型对象，挂载公共方法
E.prototype = {
  on: function (name, callback, ctx) {
    // 使用实例上的 `e` 属性来保存 eventName -> handler[]
    var e = this.e || (this.e = {});

    (e[name] || (e[name] = [])).push({
      fn: callback,
      ctx: ctx,
    });

    // 返回 this ， 这样可以链式调用
    return this;
  },

  once: function (name, callback, ctx) {
    var self = this;
    // 二次封装 callback
    // 使得被 emit 之后顺便 off 掉这个回调，这样就只执行一次
    function listener() {
      self.off(name, listener);
      callback.apply(ctx, arguments);
    }

    // 把原 callback 挂载到 _  属性上，在 off 的时候可以正确地判断
    listener._ = callback;
    return this.on(name, listener, ctx);
  },

  emit: function (name) {
    // 提取需要传递的数据
    var data = [].slice.call(arguments, 1);
    // 获取该事件名的回调的列表
    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
    var i = 0;
    var len = evtArr.length;

    for (i; i < len; i++) {
      // 调用
      evtArr[i].fn.apply(evtArr[i].ctx, data);
    }

    return this;
  },

  off: function (name, callback) {
    var e = this.e || (this.e = {});
    var evts = e[name];
    var liveEvents = [];

    if (evts && callback) {
      for (var i = 0, len = evts.length; i < len; i++) {
        // 由于 once 二次封装了 callback
        // 这样如果在事件未被 emit 之前调用 off 的话，虽然传给 off 的 callback 和 传给 once 的 callback 一样
        // 但是无法 off 掉， 所以要加另一个判断 evts[i].fn._ !== callback 来判断是否相同
        // 因为 once 把原 callback 挂载在了二次封装 callback 的 `_` 属性上
        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
          liveEvents.push(evts[i]);
      }
    }

    // 如果 off 掉某个 callback 之后剩下的 callback 列表为空， 那么删除该 eventName 对应的 callback 列表
    // 否则则直接替换 callback 列表
    liveEvents.length ? (e[name] = liveEvents) : delete e[name];

    return this;
  },
};

module.exports = E;
module.exports.TinyEmitter = E;
```

# 后记

虽然事件总线简单易用，但是当代码复杂度上升到一定程度之后，过多的事件监听会让数据流变得晦涩难懂

官方并不鼓励使用全局的事件总线来进行组件间的通信

我们可以通过其他的方法来实现相同的效果

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/02/14/202202142231767.avif)

比如提到的

- `prop` 和 `emit` （父子组件通信）
- `provide` 和 `inject` （父传后代）
- `expose` 和 `ref` （子传父）
- 全局状态管理 `Vuex` 或者 `Pinia` （提取全局状态）
- `v-slot` 暴露变量（子传父）
