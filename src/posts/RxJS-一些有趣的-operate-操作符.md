---
title: RxJS 一些有趣的 operate 操作符
key: 1655361668date: 2022-06-16 14:41:08
updated: 2023-02-13 18:28:45
tags:
- RxJavaScript
- JavaScript
categories:
- 编程
---


# 前言

`RxJS` 一些有趣的 `operate` 操作符

<!-- more -->

之前我们写了关于 `RxJS` 中的几个概念，`Observable`, `Subject`, `pipe`, `Scheduler` 等

而 `RxJS` 之所以很方便，很大程度上取决于它封装好的一些 `operate` 操作符

前文的 `pipe` 管道也属于操作符的一种

# 正文

`RxJS` 中，个人理解其实就是两大类的操作符，一类是创建类操作符，一类就是管道类

不过文档中给它分类的更加详细

> There are operators for different purposes, and they may be categorized as: **creation, transformation, filtering, joining, multicasting, error handling, utility, etc**. In the following list you will find all the operators organized in categories.

## 创建类操作符

在 `RxJS` 中，创建类的操作符其实不多，有几个比较常见的

### fromEvent

`fromEvent` 使得我们能够进行 `dom` 元素事件的绑定

```javascript
import { fromEvent } from "rxjs";

// 给 window 绑定点击事件
fromEvent(window, "click").subscribe((e) => console.log(e));
```

这样子每次我们点击就可以输出一次值，该值为事件 `event` 对象

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/16/202206161508772.avif)

如果我们想要解绑该事件

我们可以调用返回的 `Subscription` 的 `unsubscribe` 方法

```javascript
import { fromEvent } from "rxjs";

const subscription = fromEvent(window, "click").subscribe((e) => console.log(e));

// 解绑
subscription.unsubscribe();
```

### interval

`setInterval` 的一个包装，使得我们可以启用一个定时器

```javascript
import { interval } from "rxjs";

// 每 1s 执行一次
interval(1000).subscribe((val) => console.log(val));
```

每次会输出该次对应的索引（从 `0` 开始）

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/16/202206161517604.avif)

取消该定时器，同样调用 `Subscription` 的 `unsubscribe` 方法

```javascript
import { interval } from "rxjs";

const subscription = interval(1000).subscribe((val) => console.log(val));

// 取消定时器
subscription.unsubscribe();
```

### of

把传入的每个值都经过 `Observable` 发送出来

```javascript
import { of } from "rxjs";

of(1, 2, 3, 4).subscribe((val) => console.log(val));
```

传入 `1, 2, 3, 4` ，那么输出就是 `1, 2, 3, 4` 了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/16/202206161533362.avif)

### range

生成一个序列，然后经由 `Observable` 发送出来

```javascript
import { range } from "rxjs";

range(2, 5).subscribe((val) => console.log(val));
```

注意，这里的参数不是起始和结束，而是起始和个数

即输出不是 `2, 3, 4, 5` 而是 `2, 3, 4, 5, 6`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/16/202206161547041.avif)

### generate

能够像 `for` 那样生成值

```javascript
import { generate } from "rxjs";

generate({
  initialState: 1,
  condition: (v) => v < 5,
  iterate: (v) => v + 1,
}).subscribe((val) => console.log(val));
```

上面的代码表示初始值为 `1`， 结束条件为值小于 `5` ， 然后每次都会自增 `1`

和下面的代码等价

```javascript
new Observable((subscriber) => {
  for (let i = 1; i < 5; i++) {
    subscriber.next(i);
  }
}).subscribe((val) => console.log(val));
```

这样子我们就能从 `1` 输出到 `4`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/16/202206161617122.avif)

### merge

合并多个 `Observable` 为单个 `Observable` ，然后一一输出对应的值

```javascript
import { fromEvent, interval, map, merge } from "rxjs";

const click$ = fromEvent(window, "click");
const interval$ = interval(1000).pipe(map((val) => `定时器：${val}`));

merge(click$, interval$).subscribe((val) => console.log(val));
```

经过 `merge` 之后，新的 `Observable` 会在每次点击和间隔 `1s` 输出一次对应的值

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/16/202206161642324.avif)

### forkJoin

合并多个 `Observable` 为单个 `Observable` ，收集每个 `Observable` 完成前的一个值，然后输出

```javascript
import { forkJoin, fromEvent, interval, map, take } from "rxjs";

const click$ = fromEvent(window, "click").pipe(take(2));
const interval$ = interval(1000).pipe(
  map((val) => `定时器：${val}`),
  take(3)
);

forkJoin([click$, interval$]).subscribe((val) => console.log(val));
```

在点击两次且等待超过三秒之后，会输出一个数组，这个数组包含二者的值

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/16/202206161700658.avif)

### concat

合并多个 `Observable` 为单个 `Observable` ，和 `merge` 不同的是，`concat` 会在第一个 `Observable` 完成之后再订阅第二个 `Observable` ，以此类推

```javascript
import { concat, fromEvent, interval, map, take } from "rxjs";

const click$ = fromEvent(window, "click").pipe(take(2));
const interval$ = interval(1000).pipe(
  map((val) => `定时器：${val}`),
  take(3)
);

concat(click$, interval$).subscribe((val) => console.log(val));
```

这里我们必须点击两次之后，定时器才会启动，如果点击事件不使用 `take(2)` 限定次数的话，那么定时器永远不会开始

因为点击事件永远无法完成

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/16/202206161717782.avif)

### race

合并多个 `Observable` 为单个 `Observable` ，只会输出一个发出值的 `Observable`

```javascript
import { fromEvent, interval, map, race, take } from "rxjs";

const click$ = fromEvent(window, "click").pipe(take(2));
const interval$ = interval(1000).pipe(
  map((val) => `定时器：${val}`),
  take(3)
);

race(click$, interval$).subscribe((val) => console.log(val));
```

此时如果立马进行点击，那么定时器就不会输出，如果等到定时器输出第一个值，那么点击事件就不会生效

定时器“赢”

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/16/202206161730994.avif)

点击事件“赢”

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/16/202206161731297.avif)

### zip

合并多个 `Observable` 为单个 `Observable` ，每个 `Observable` 发出的每个值会组成一个数组作为新的值发出

```javascript
import { fromEvent, interval, map, take, zip } from "rxjs";

const click$ = fromEvent(window, "click").pipe(take(2));
const interval$ = interval(1000).pipe(
  map((val) => `定时器：${val}`),
  take(3)
);

zip(click$, interval$).subscribe((val) => console.log(val));
```

每个点击和每次定时器执行作为值发送出去，新值数量由这些 `Observable` 发出的值的最少的个数来确定

在这里点击事件只会发生两次，所以新的 `Observable` 只会发出两个值

定时器的第三个值无法被匹配，故不会发送到新的 `Observable` 对象中

一旦某个传入的 `Observable` 完成，其他传入的 `Observable` 会被 `unsubscribe` ，所以不用担心资源释放问题

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/16/202206161741888.avif)

### combineLatest

合并多个 `Observable` 为单个 `Observable` ，与 `zip` 类似，但是 `combineLatest` 会取最近的一次值组成一个新值然后发出

```javascript
import { combineLatest, fromEvent, interval, map, take, zip } from "rxjs";

const click$ = fromEvent(window, "click").pipe(take(2));
const interval$ = interval(1000).pipe(
  map((val) => `定时器：${val}`),
  take(3)
);

combineLatest([click$, interval$]).subscribe((val) => console.log(val));
```

这里假如我们等三秒之后在点击，那么输出的值是 `[event, '定时器：2']`

而 `zip` 这里会输出 `[event, '定时器：0']`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/16/202206161757529.avif)

除了上面这些常用的， `RxJS` 还封装了 `ajax` ，不过前端一般都是用 `axios` 来进行 `http` 请求

所以感觉用处不大

还有一些比较少见的创建操作符，比如 `defer`, `timer`, `iif` 等，都不难，看一下文档一下子就懂了

## 管道操作符

在之前的文章 {% post_link RxJS-使用之-pipe-管道 RxJS 使用之 pipe 管道 %} 中，我们已经列举了一些常见的管道操作符了

比如 `map`, `filter`, `first`, `last` 等

这些一般都比较容易理解

现在我们来列举一些高级一点的管道

### takeUntil

传入一个 `Observable` ，在这个 `Observable` 完成时，源 `Observable` 则完成

```javascript
import { fromEvent, interval, map, take, takeUntil } from "rxjs";

const interval$ = interval(1000).pipe(
  map((val) => `定时器：${val}`),
  take(3)
);

const click$ = fromEvent(window, "click").pipe(takeUntil(interval$));

click$.subscribe((e) => console.log(e));
```

这里如果我们等 `3s` 之后再点击，那么点击事件不会生效，因为定时器已经完成了

在 `3s` 内的点击事件都是可以发出的

之前我们在 `Subject` 那一章讲过这个管道，在 `antd`（ `angular` 版本） 中非常常见

在需要对全局可观察对象订阅的地方，加上 `pipe(takeUntil(destroy$))` ，然后在 `ngOnDestroy` 钩子中完成 `destroy$` 即可比较优雅的管理这些订阅过程

### distinct

对于源 `Observable` 发送的一系列的值，会经过去重之后再发送出来

对于基本类型来说，使用起来非常简单

```javascript
import { distinct, of} from "rxjs";

of(1, 2, 3, 3, 4, 4)
  .pipe(distinct())
  .subscribe((val) => console.log(val));
```

这里源 `Observable` 发出 `1, 2, 3, 3, 4, 4`

经过去重之后会输出 `1, 2, 3, 4`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/17/202206171129866.avif)

对于引用类型，可以通过一个函数来提取唯一的部分进行比较，一般都是以对象的某个属性来去重，比如唯一 `id` 等

当然如果不传，那么就是按照引用的地址进行比较，即 `obj1 === obj2` 这种形式

```javascript
import { distinct, of } from "rxjs";

const s1 = {
  id: 1,
  name: "lwf",
};

const s2 = {
  id: 2,
  name: "lwx",
};

const s3 = {
  id: 2,
  name: "lwx",
};

of(s1, s2, s3)
  .pipe(
    // 这里用 id 作为唯一标识进行去重
    distinct((s) => s.id)
  )
  .subscribe((val) => console.log(val));
```

由于 `s2` 和 `s3` 的 `id` 是一样的，所以最终只会输出 `s1` 和 `s2`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/17/202206171140642.avif)

### distinctUntilChanged

这个就比较有意思了，从名字上看，也是去重，但是去重的模式不一样

这个管道的去重指和前一个值进行比较，如果相同，那么该值就不会被输出

```javascript
import { distinctUntilChanged, of } from "rxjs";

of(1, 1, 2, 1, 1, 2)
  .pipe(distinctUntilChanged())
  .subscribe((val) => console.log(val));
```

如果我们使用 `distinct` ，上面的代码输出为 `1, 2`

而 `distinctUntilChanged` 会输出 `1, 2, 1, 2`

当然这个管道也支持传入函数来确定唯一的值

比如，现在我们希望在窗口水平 `resize` 的时候进行一些操作，可以这么写

```javascript
import { distinctUntilChanged, fromEvent, map } from "rxjs";

fromEvent(window, "resize")
  .pipe(
    // 拿到每一次 resize 的窗口大小
    map(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    })),
    // 在 width 发生改变时
    distinctUntilChanged((pre, cur) => pre.width === cur.width)
  )
  .subscribe((val) => console.log("width change"));
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/20/202206201043177.gif)

当然，如果你想换成垂直 `resize` ，只要更改为 `distinctUntilChanged((pre, cur) => pre.height === cur.height)` 即可

可以想象一下如果我们不使用 `RxJS` 的话，这段逻辑写起来还是挺复杂的，而且免不得得产生一些局部变量（记录 `pre` 值）

### retry

在 `Observable` 发生错误的时候可以重新订阅

```javascript
import { Observable, retry } from "rxjs";

new Observable((subscriber) => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.error(new Error("error"));
})
  .pipe(retry(2))
  .subscribe({
    next(val) {
      console.log(val);
    },
    error(e) {
      console.error(e);
    },
  });
```

在这里我们使用 `retry(2)` 表示如果源 `Observable` 发生了错误，那么重新订阅，最大次数为 `2` 次

也就是两次后，如果成功了，那无事发生，如果还是报错，那么错误就会通过 `error` 回调抛出

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/17/202206171652731.avif)

可以看到前两次的 `error` 并没有被抛出，只有最后一次的 `error` 被抛出

这个管道对于 `http` 请求还是挺有用的，直接就可以设置重拾次数

### elementAt

直接取某个索引的元素，很像 `js` 中通过 `[]` 取值

```javascript
import { elementAt, range } from "rxjs";

range(1, 5)
  .pipe(elementAt(2))
  .subscribe((val) => console.log(val));
```

取索引 `2` 的值，对于 `1, 2, 3, 4, 5` ，也就是数字 `3`

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/17/202206171724608.avif)

### single 

只有在匹配到一个值的时候才会输出，其他情况下，没有值匹配或者匹配了多个值，则会报错

```javascript
import { of, single } from "rxjs";

// 匹配成功
of(1, 2, 3, 4)
  .pipe(single((v) => v === 1))
  .subscribe((val) => console.log(val));

// 匹配多个
of(1, 2, 3, 4)
  .pipe(single((v) => v === 5))
  .subscribe((val) => console.log(val));

// 未匹配
of(1, 1, 3, 4)
  .pipe(single((v) => v === 1))
  .subscribe((val) => console.log(val));
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/17/202206171742679.avif)

### combineLatestAll, concatAll, mergeAll 

和 `combineLatest` 的效果一样，不过 `combineLatestAll` 作为管道主要用于高阶 `Observable` 

```javascript
import { fromEvent, map, interval, take, combineLatestAll } from "rxjs";

const clicks = fromEvent(window, "click");
const higherOrder = clicks.pipe(
  map(() => interval(0).pipe(take(2))),
  take(2)
);

higherOrder.pipe(combineLatestAll()).subscribe((x) => console.log(x));
```

这里每次点击产生一个定时器，每个定时器只输出两个值，只响应两次点击事件

意味着会有两个定时器，然后通过 `combineLatestAll` 结合两个定时器，完全可以看成如下代码

```javascript
import { combineLatest } from "rxjs";

combineLatest([interval(0).pipe(take(2)), interval(0).pipe(take(2))]).subscribe(
  (val) => console.log(val)
);
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/17/202206171800313.avif)

除了 `combineLatestAll` ，其他的一些创建类操作符也有其对应的管道操作符

- `concat` 对应 `concatAll`
- `merge` 对应 `mergeAll`

### exhaustAll

用于高阶 `Observable` ，当订阅第一个 `Observable` ，接下来在这个 `Observable` 完成前就订阅的 `Observable` 被抛弃

感觉很绕，我们可以写个例子

```javascript
import { fromEvent, interval, take, map, exhaustAll } from "rxjs";

fromEvent(document, "click")
  .pipe(
    map(() => interval(1000).pipe(take(3))),
    exhaustAll()
  )
  .subscribe((x) => console.log(x));
```

这里我们使用 `map` 让生成的 `Observable` 成为高阶的，然后使用 `exhaustAll`

当我们点击的时候，会输出 `0, 1, 2` ，如果在 `0, 1, 2` 输出还没完成的时候，继续点击，那么这个 `Observable` 是会被抛弃的

也就是只有等到 `0, 1, 2` 输出完成，我们再次点击，那么才会继续输出 `0, 1, 2`

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/20/202206201040103.gif)

### switchAll

用于高阶 `Observable` ，这个和 `exhaustAll` 相反，如果在前一个 `Observable` 还未完成时，得到了下一个 `Observable` 

那么当前订阅的 `Observable` 会被完成，然后去订阅这个新的 `Observable` 

```javascript
import { fromEvent, interval, take, map, tap, switchAll } from "rxjs";

fromEvent(document, "click")
  .pipe(
    map(() => interval(1000).pipe(take(3))),
    switchAll()
  )
  .subscribe((x) => console.log(x));
```

这个例子和 `exhaustAll` 的一样，只不过我们使用 `switchAll` 来合并 `Observable` 

在输出 `0, 1, 2` 输出未完成之前，继续点击的话，那么会重新输出 `0, 1, 2`

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/20/202206201057038.gif)

# 后记

`RxJS` 的系列基本就结束了，接下来学习 `Angular` ，在 `RxJS` 方面应该就问题不大了