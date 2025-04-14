---
title: RxJS 使用之 pipe 管道
key: 1652854506date: 2022-05-18 14:15:06
updated: 2023-02-13 18:28:45
tags:
- RxJavaScript
- JavaScript
categories:
- 编程
---


# 前言

之前我们写了 `RxJS` 的基本的使用方法

接下来写一写 `RxJS` 的，我个人觉得最重要的，也是最核心的一个概念：**管道**

<!-- more -->

# 正文

如果把 `Observable` 、 `Observer` 比喻成一部房子的地基

那么 `pipe` 就是建在地基上的房子，展现在大家的眼前

`RxJS` 封装了许多不同的 `pipe` ，组合这些函数，使得房子可以变化出不同的样子

## 使用 pipe

在新建 `Observable` 对象之后，我们可以调用 `.pipe(p1(), p2(), ... , pN())` 来组合各式各样的管道

```javascript
import { Observable } from "rxjs";

const observable = new Observable((subscriber) => {
  for (let i = 0; i < 10; i++) {
    subscriber.next(i);
  }
  subscriber.complete();
});

const newObservable = observable.pipe();

newObservable.subscribe((val) => {
  console.log(val);
});
```

需要注意的时，`pipe` 函数返回了一个 `Observable` 对象

如果管道为空，即调用了 `pipe()` ，那么返回的 `Observable` 就等于原对象，即 `newObservable === observable`

如果管道不为空，比如调用 `pipe(map(x => x * 2))` ，那么返回的 `Observable` 就不等于原来的原来的 `Observable` 对象

在内部实现中，我们发现 `pipe` 依赖于 `pipeFromArray`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/18/202205181445089.avif)

从调用上，可以发现 `pipeFromArray` 是一个返回函数的函数

看下它的实现

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/18/202205181450978.avif)

在参数为 `0` 个时返回了 `identity` 这个函数

而 `identity` 的实现就是返回自身

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/18/202205181452872.avif)

所以当参数为 `0` 个时， `pipe` 的实现等价于如下：

```ts
class Observable<T> implements Subscribable<T> {
  // ... 其他方法
  
  pipe(...operations: OperatorFunction<any, any>[]): Observable<any> {
    function identity<T>(x: T): T {
        return x;
    }

    return identity(this);
  }
}
```

## 常见的 pipe 函数

### map

`map` 很像 `js` 中数组的 `map` ，都是对原值映射成新值的一个函数

```javascript
import { map, Observable } from "rxjs";

const observable = new Observable((subscriber) => {
  for (let i = 0; i < 3; i++) {
    subscriber.next(i);
  }
  subscriber.complete();
});

observable.pipe(map((x) => x + 1)).subscribe((val) => console.log(val));
```

以上例子会输出 `0 2 4`，即对 `0 1 2` 的每一个数字都乘以 `2`

### filter

与数组的 `filter` 方法同理

```javascript
import { filter, Observable } from "rxjs";

const observable = new Observable((subscriber) => {
  for (let i = 0; i < 3; i++) {
    subscriber.next(i);
  }
  subscriber.complete();
});

observable
  .pipe(filter((x) => x % 2 === 0))
  .subscribe((val) => console.log(val));
```

以上就会输出 `0 2` ，即过滤了不是偶数的数字，在原输出 `0 1 2` 中非偶数的数字为 `1`

### tap

`tap` 和调用 `subscribe` 方法很相像，都是传入一个 `Observer` 对象，但是 `tap` 可以在 `pipe` 的各个阶段织入，获取当时对应的值

而 `subscribe` 只能获取 `pipe` 处理完之后的值，比如：

```javascript
import { filter, map, Observable, tap } from "rxjs";

const observable = new Observable((subscriber) => {
  // 输出 0 - 9
  for (let i = 0; i < 10; i++) {
    subscriber.next(i);
  }
  subscriber.complete();
});

observable
  .pipe(
    // 过滤出偶数
    filter((x) => x % 2 === 0),
    // 看看当前的数据
    tap((val) => console.log("tap1: ", val)),
    // 每个偶数乘以2
    map((x) => x * 2),
    // 看看当前的数据
    tap((val) => console.log("tap2: ", val))
  )
  .subscribe();
```

运行上面的例子，会打印出

```text
tap1:  0
tap2:  0
tap1:  2
tap2:  4
tap1:  4
tap2:  8
tap1:  6
tap2:  12
tap1:  8
tap2:  16
```

这里需要注意的时，我们必须调用 `subscribe` ，管道内的函数才会被执行

一般情况下，`tap` 都是被用来 `debugger` 程序的，就像上面的例子，由于组合了许多 `pipe` 函数

但是我们需要定位是在哪个 `pipe` 函数出了问题，那么这时就可以在这个 `pipe` 前后加一个 `tap` 来打印值

同时 `tap` 也是一个执行副作用的地方，对于管道函数，它最好是纯函数，即相同的输入一定会有相同的输出，比如上面的 `map` ， `filter`

`tap` 提供了一个“逃生舱”，使得程序可以在特定的 `pipe` 位置执行一些副作用（比如发起网络请求，或者修改全局的某些变量），但是不会影响整个 `pipe` 的执行结果

### max 和 min

统计最大值和最小值

```javascript
import { max, min, Observable } from "rxjs";

const observable = new Observable((subscriber) => {
  // 输出 0 - 9
  for (let i = 0; i < 10; i++) {
    subscriber.next(i);
  }
  subscriber.complete();
});

observable.pipe(max()).subscribe((val) => console.log("max: ", val));

observable.pipe(min()).subscribe((val) => console.log("min: ", val));
```

### take 和 skip

`take` 接受一个数字，表示只取前几个值

`skip` 接受一个数字，表示跳过前几个值，和 `take` 相反

```javascript
import { Observable, skip, take } from "rxjs";

const observable = new Observable((subscriber) => {
  // 输出 0 - 9
  for (let i = 0; i < 10; i++) {
    subscriber.next(i);
  }
  subscriber.complete();
});

observable.pipe(take(3)).subscribe((val) => console.log(val));

observable.pipe(skip(6)).subscribe((val) => console.log(val));
```

以上会输出 `0 1 2` 以及 `6 7 8 9` 

### `first` 和 `last`

`first` 就是 `take(1)` ，即取第一个元素

而 `last` 就是取最后一个元素

```javascript
import { first, last, Observable } from "rxjs";

const observable = new Observable((subscriber) => {
  // 输出 0 - 9
  for (let i = 0; i < 10; i++) {
    subscriber.next(i);
  }
  subscriber.complete();
});

observable.pipe(first()).subscribe((val) => console.log(val));

observable.pipe(last()).subscribe((val) => console.log(val));
```

以上例子输出 `0` 和 `9`

当然，也可以对这个值进行限制，比如我们像找第一个大于 `5` 的值，可以往 `first` 里面传入一个验证函数

这样就可以拿到第一个使得验证函数为 `true` 的值了

```javascript
import { first, Observable } from "rxjs";

const observable = new Observable((subscriber) => {
  // 输出 0 - 9
  for (let i = 0; i < 10; i++) {
    subscriber.next(i);
  }
  subscriber.complete();
});

observable.pipe(first((x) => x > 5)).subscribe((val) => console.log(val));
```

以上例子输出 `6`

### debounceTime 和 throttleTime

防抖和节流函数 `RxJS` 也给我们封装好了

传入时间即可实现对应的功能

防抖例子

```javascript
import { debounceTime, Observable } from "rxjs";

const observable = new Observable((subscriber) => {
  let i = 0;
  const timer = setInterval(() => {
    subscriber.next(++i);
    if (i === 5) {
      subscriber.complete();
    }
  }, 500);

  return () => {
    clearInterval(timer);
  };
});

const subscription = observable.pipe(debounceTime(1000)).subscribe({
  next: (val) => console.log(val),
  complete: () => console.log("complete") && subscription.unsubscribe(),
});
```

以上例子只输出 `5` ，当输出 `1` 的时候，在等待 `1s` 之后才会输出，而等待 `500ms` 之后又输出了 `2` ，此时 `1` 就不该输出了，重新对 `2` 进行计时，数字 `3` ， `4` 同理

节流例子

```javascript
import { Observable, throttleTime } from "rxjs";

const observable = new Observable((subscriber) => {
  let i = 0;
  const timer = setInterval(() => {
    subscriber.next(++i);
    if (i === 5) {
      subscriber.complete();
    }
  }, 300);

  return () => {
    clearInterval(timer);
  };
});

const subscription = observable.pipe(throttleTime(1000)).subscribe({
  next: (val) => console.log(val),
  complete: () => console.log("complete") && subscription.unsubscribe(),
});
```

以上例子输出 `1 5` ，节流使得一段时间内只拿到一个值，忽略这段时间产生的其他值

在例子中，不使用节流的话，输出为 `1(0) 2(300) 3(600) 4(900) 5(1200)`

在 `1000ms` 内只拿到一个值，所以拿到了 `1` 和 `5`

当然，这是针对 `throttleTime` 的默认 `ThrottleConfig` 参数（`{ leading: true, trailing: false }`）的情况下，即先拿值再计时

如果 `ThrottleConfig` 参数改成 `{ leading: false, trailing: true }` 的话，那么输出就是 `4` 和 `5` 了

## 创建自定义 pipe 函数

上面我们讲了很多官方的提供的 `pipe` 函数，但有时我们需要的功能官方提供的函数无法实现

这时候就可以通过创建自定义 `pipe` 函数

在这之前，我们需要明白 `pipe` 函数究竟是个啥

这里我们以 `map` 的源码为例子

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/19/202205191736247.avif)

可以看到返回了执行 `operate` 函数，传入了一个函数参数，查看 `operate` 的源码

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/19/202205191737044.avif)

通过实现我们可以发现，管道的最外层就是一个传入上一个 `Observable` ，然后返回一个**新**的 `Observable` 的一个函数

可能由于类型看的会比较乱，我们把类型和错误捕获删了，只留下核心逻辑

```javascript
function operate(init) {
  return (source) => {
    return source.lift(function (liftedSource) {
        return init(liftedSource, this);
    });
  }
}
```

这里发现它调用了 `Observable` 的 `lift` 方法，源码如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/19/202205191756564.avif)

发现它创建了一个新的 `Observable` 对象，挂载了一些属性

可能到这里你会无法理解，发出“这个 `source` 属性是干嘛的，这个 `operator` 属性又是干嘛的”的疑问

但是不要急，我们发现这个方法它是 `deprecated` 的，这意味着它不被官方推荐使用

我们看下 `deprecated` 注释的内容

> Internal implementation detail, do not use directly. Will be made internal in v8. If you have implemented an operator using `lift`, it is recommended that you create an operator by simply returning `new Observable()` directly. See "Creating new operators from scratch" section here: https://rxjs.dev/guide/operators

翻译过来就是：这个一个内部实现，请不要直接使用，它会在版本 `8` 上转为内部（目前暴露在了 `Observable` 的属性上），如果你需要通过 `lift` 方法实现一个操作，推荐直接通过 `new Observable()` 返回一个新的对象

现在就好办了，直接返回一个新的 `Observable` 就完事了，于是乎我们可以写出下面的框架代码：

```javascript
const myPipe = () => {
  return (source) => {
    return new Observable((subscriber) => {
      // TODO 实现
    });
  }
}
```

回过头来，我们来看 `map` 的实现

```typescript
export function map<T, R>(project: (value: T, index: number) => R, thisArg?: any): OperatorFunction<T, R> {
  return operate((source, subscriber) => {
    let index = 0;
    source.subscribe(
      createOperatorSubscriber(subscriber, (value: T) => {
        // 这里这个 subscriber 可以理解为新 Observable 的构造函数里面的那个 subscriber 
        subscriber.next(project.call(thisArg, value, index++));
      })
    );
  });
}
```

通过对源 `Observable` 调用 `subscribe` ，传入了一个经过 `createOperatorSubscriber` 包装过后的 `Observer` （ `Subscriber` 是 `Observer` 的实现）

然后通过新的 `Observable` 的 `next` 来发送映射之后的值，即 `project.call(thisArg, value, index++)`

上面的代码可能比较晦涩，换成下面这样写，就非常容易理解了

```typescript
const myPipe = (mapFn, context) => {
  return (source) => {
    let index = 0;
    return new Observable((subscriber) => {
      source.subscribe({
        next(val) {
          // 订阅源的next，把值包装之后，通过新的 Observable next出去
          subscriber.next(mapFn.call(context, val, index++));
        },
        complete() {
          // 如果源完成了，那么新的 Observable 也应该完成
          subscriber.complete();
        },
        error(e) {
          // 如果源出现了错误，那么新的 Observable 同样也该传递一样的错误
          subscriber.error(e);
        }
      })
    });
  }
}
```

然后我们写个例子测试一下：

```javascript
import { Observable, map } from "rxjs";

const observable = new Observable((subscriber) => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete();
});

const myPipe = (mapFn, context) => {
  return (source) => {
    let index = 0;
    return new Observable((subscriber) => {
      source.subscribe({
        next(val) {
          // 订阅源的next，把值包装之后，通过新的 Observable next出去
          subscriber.next(mapFn.call(context, val, index++));
        },
        complete() {
          // 如果源完成了，那么新的 Observable 也应该完成
          subscriber.complete();
        },
        error(e) {
          // 如果源出现了错误，那么新的 Observable 同样也该传递一样的错误
          subscriber.error(e);
        },
      });
    });
  };
};

const subscription = observable
  .pipe(myPipe((x) => x * 2))
  .subscribe((val) => console.log(val));
```

输出如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/20/202205201442536.avif)

# 后记

当然，出了本文提到的 `pipe` ，`RxJS` 还内置了非常多的管道

可以点击 [RxJS Operators](https://rxjs.dev/guide/operators) 查看

全记住我觉得还是很难的，如果有需要自定义管道时，可以先翻一翻文档，如果有那就直接用，如果可以组合已有管道，那就不要自己再写了

在完全没有的情况下，再考虑自己写管道