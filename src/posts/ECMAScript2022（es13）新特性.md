---
title: ECMAScript2022（es13）新特性
date: 2024-12-27 23:26:53
updated: 2024-12-27 23:26:53
tags:
  - JavaScript
categories:
  - 笔记
key: 1734011336
---


# 前言

ECMAScript2022（es13）新特性。

<!-- more -->

# 正文

## 顶层 await

在 esm 模块内，在顶层 await 特性出来前，如果一个模块的导出依赖异步操作的话，处理起来就会比较复杂，比如如果我们需要导出一个 `db` 对象，即连接一个数据库后导出，我们可能会写：

```javascript
// db.mjs
// 第三方引入的创建 db 实例的异步函数
import { createDB } from "db-lib";

export let db = undefined;

export let initDBPromise = new Promise(async (resolve, reject) => {
  db = await createDB();
  resolve();
});
```

然后我们在需要的地方，都得引入 `initDBPromise` 来确保引入的 `db` 不为 `undefined` ，如下：

```javascript
// a.mjs
import { db, initDBPromise } from "db.mjs";

initDBPromise.then(() => {
  // 使用 db 。
});
```

又或者直接导出一个 Promise ，resolve 的结果为 `db` 对象，如下：

```javascript
// db.mjs
// 第三方引入的创建 db 实例的异步函数
import { createDB } from "db-lib";

export let resolveDBPromise = new Promise(async (resolve, reject) => {
  resolve(await createDB());
});
```

然后使用的时候如下：

```javascript
// b.mjs
import { resolveDBPromise } from "db.mjs";

resolveDBPromise.then((db) => {
  // 使用 db 。
});
```

虽然能够完成需求，但这会导致一些问题：

- 开发者必须了解库作者导出的对象是否可能是异步产生的，是否有对应的 Promise 导出来确保对象已初始化。这会加重理解负担。
- 开发者很有可能忘记调用导出的 Promise 来获取已初始化的对象，但代码可能仍然能正常工作，比如正式环境中异步操作可能比开发环境中要慢得多，导致某些某些开发环境中能执行的代码在正式环境中出现了异常。
- 如果一个模块 A 依赖了另一个异步导出的模块 B ，那么意味着 A 模块中依赖 B 模块的导出都得成为异步导出，这进一步加重了编写和理解负担。

所以引入了顶层 await 这个特性。可以理解为上面的写 Promise 的步骤，模块系统帮你实现了。在模块的顶部就可以直接 await 某个 promise 。例子如下：

```javascript
// db.mjs
// 第三方引入的创建 db 实例的异步函数
import { createDB } from "db-lib";

export const db = await createDB();
```

然后在其他文件中使用：

```javascript
// c.mjs
import { db } from "db.mjs";

// 使用 db
```

这里要注意，如果一个模块具有顶层 await ，那么所有依赖它的模块都得等到它阻塞结束后再执行。ESM 的 import 本质上就是一种执行的过程，只有执行完成了，才能确定导出的东西，所以依赖具有顶层 await 的模块都会被阻塞。

在[提案](https://github.com/tc39/proposal-top-level-await)的页面，我们也能知道一些很有意思的点，比如：

关于 ESM 模块的执行顺序，如果不存在顶层 await 模块，那么模块的执行遵循后续遍历，即先遍历左子树，再遍历右子树，最后输出根，比如现在有如下的文件依赖：

```
c
|\
a b
```

这个图的意思是 c 文件 import 了 a 文件和 b 文件。

那么执行 c 文件，顺序为 a b c ，a 和 b 的顺序取决于你 import 的顺序，如果 b 的 import 在 a 前面，那么执行顺序就变成了 b a c 。

在加上顶层 await 后，其实这个顺序遍历顺序也是保持不变的，只是在遇到顶层 await 模块后会让出执行逻辑，比如下面这个文件依赖：

```
g
|\
| \
|  \
e   f（顶层 await 模块）
|\  |\
a b c d
```

在这个依赖图中，子树 e 是完全不受顶层 await 影响的，它完全和前面的一样，执行顺序为 a b e ，接着遍历 g 右子树，此时解析完成 c 和 d ，发现 f 是异步模块，那么需要让出执行权，但是 f 已经是 g 在导入顺序上的最后一个模块了，此时只需等待 f 完成即可，最后再遍历 g 本身。

如果 f 和 e 对调：

```
g
|\
| \
|  \
f   e
|\  |\
c d a b
```

那么执行到 f 阻塞之后，会交出执行权，这时子树 e 开始解析，输出 a b e ，接着等待 f 阻塞完成，最后遍历 g 自身。

在 [FAQ](https://github.com/tc39/proposal-top-level-await?tab=readme-ov-file#faq) 部分也讨论了其他一些方面，比如异步导入存在死锁问题，以及该特性的语义去糖化，还是相当有意思的，建议作为~~厕所读物~~。

## 类实例的属性声明

在 es13 之前，类的属性声明都在构造器中，如下：

```javascript
class A {
  constructor() {
    this.x = 1;
    this.y = 2;
  }
}
```

而 es13 支持直接在 class 的块内编写变量声明和赋值：

```javascript
class A {
  x = 1;
  y = 2;
}
```

## 类实例私有属性和方法

虽然 js 在 es6 引入了 class 特性，不过整体上依然不完整，比如在封装性的方面。

虽然类可以封装逻辑，但由于 js 的动态性，外部用户可以随意修改类上的属性，可能会导致执行出现异常，这是缺少私有属性导致的，所以 es13 引入了私有属性和方法，以 `#` 开头的变量都会被当作私有变量和私有方法，如下：

```javascript
class A {
  #a = 1;
  b = 2;

  #test() {
    console.log("#test");
  }
}
```

外部无法访问 `#a` 这个私有变量或者 `#test` 这个私有方法：

```javascript
const a = new A();

a.#a; // 报错
a.#test(); // 报错
```

内部可以使用 `this` 正常访问：

```javascript
class A {
  #a = 1;
  b = 2;

  #test() {
    console.log("#test");
  }

  test() {
    console.log(this.#a);
    this.#test();
  }
}
```

这里要注意 `#test` 和 `test` 是两个**名字不同**的属性，这意味着它们是能够共存的。

## 类静态属性和方法

es13 也增强了类的静态成员和方法的能力，类也可以定义私有静态属性和方法了：

```javascript
class A {
  static #a = 1;
  static #test() {
    console.log(this.#a);
  }

  test() {
    A.#test();
  }
}

const a = new A();
a.test(); // 输出 1
A.#a; // 报错
A.#test(); // 报错
```

## 类静态块

在类加强了静态属性和方法后，静态成员的初始化也进一步的加强，通过 static 块可以为静态成员进行复杂的初始化操作：

```javascript
// 复杂的操作
const complex = () => {};

class A {
  static #a;

  static {
    const c = complex();
    if (c) {
      this.#a = 1;
    } else {
      const d = c.property
      this.#a = d;
    }
  }
}
```

这里要注意 static 块的 `this` 指向的是类本身，而不是类的实例，你可以理解为 static 块内的 `this` 指向的就是 `A` ，而非 `A` 的实例，因为这是对静态数据的初始化，跟实例无关。

## 类私有属性 in 操作符

在前面的引入私有属性和方法的特性之后，就会发现，我很难用一个简介的方法来判断某个类是否含有某个私有字段，这时基于读取私有属性会报错的特性，可以写下如下的方法：

```javascript
class A {
  #a = 1;
  b = 2;

  #test() {
    console.log("#test");
  }

  // 读取私有属性的方法一定得在类内，类外读取私有属性都是语法错误的。
  static check(obj) {
    try {
      obj.#a;
      return true;
    } catch {
      return false;
    }
  }
}

A.check(new A()); // true
A.check({}); // false
```

虽然能解决问题，但看起来有点唐，所以 es13 还添加了一个 `in` 操作来检测私有属性，用法如下：

```javascript
class A {
  #a = 1;
  b = 2;

  #test() {
    console.log("#test");
  }

  // 读取私有属性的方法一定得在类内，类外读取私有属性都是语法错误的。
  static check(obj) {
    return #a in obj;
  }
}

A.check(new A()); // true
A.check({}); // false
```

## Array.prototype.at 和 String.prototype.at

这两个 `at` 函数其实就是方括号的函数形式，用法如下：

```javascript
const str = "你好";
str.at(0); // 输出 你 ，等效于 str[0]

const array = [1, 2, 3];
array.at(0); // 输出 1 ，等效于 array[0]
```

既然是等价的，那为什么还需要 `at` 函数呢，其实 `at` 函数还支持负数的调用形式，如果传入的值为负数，那么实际的引用为 `index + length` ，比如：

```javascript
const str = "你好，世界";
str.at(-1); // 输出 界 ，实际的索引位置为 str.length + (-1) = 4

const array = [1, 2, 3];
array.at(-2); // 输出 2 ，实际的索引位置为 array.length + (-2) = 1
```

## Object.hasOwn

`Object.prototype.hasOwnProperty.call` 的官方省略版...

不过这里可能有些小伙伴会疑惑，为什么要通过 `call` 调用，直接调用不行吗？

诶 🤓，这就要说到 js 的原型链的问题了，如果某个不知名的脚本在你的对象上多加了个 `hasOwnProperty` 函数，那就会出现：

```javascript
const a = Object.create({
  hasOwnProperty() {
    return true;
  },
});

a.hasOwnProperty("我有这个属性吗"); // 输出 true
```

所以 `Object.prototype.hasOwnProperty.call` 可以改变 `hasOwnProperty` 内的 `this` ，同时确保检测这件事的逻辑确实来源于 `Object.prototype.hasOwnProperty` ，不过为了防止运行时修改，大部分的框架都会提前保存一份 `Object.prototype.hasOwnProperty` 的引用，比如：

```javascript
const hasOwnProperty = Object.prototype.hasOwnProperty;
```

虽然其他先于该脚本加载的脚本仍有可能复写 `Object.prototype.hasOwnProperty` ，但算是防御等级最高的了。

## 正则 d 模式

es13 引入了正则的 `d` 模式，它的作用是对一些接口的返回值添加捕获的索引位置，属性名为 `indices` ，比如 `Regexp.prototype.exec` ， `String.prototype.match` 等，例子如下：

```javascript
const re1 = /a+(?<Z>z)?/d;
const s1 = "xaaaz";
const m1 = re1.exec(s1);
// 输出
// [
//   'aaaz',
//   'z',
//   index: 1,
//   input: 'xaaaz',
//   groups: [Object: null prototype] { Z: 'z' },
//   // 额外返回的 indices 属性，其中第 0 项为整体的匹配，第二项为捕获组的匹配，都是左闭右开的
//   indices: [
//     [ 1, 5 ],
//     [ 4, 5 ],
//     // 如果捕获组是具名的，那么结果会被添加在该属性中
//     groups: [Object: null prototype] { Z: [4, 5] }
//   ]
// ]
```

如果捕获组未被匹配，那么相应的位置会为 undefined ，例子如下：

```javascript
const re1 = /a+(?<Z>z)?/d;
const s1 = "xaaay";
const m1 = re1.exec(s1);
// 输出
// [
//   'aaa',
//   undefined,
//   index: 1,
//   input: 'xaaay',
//   groups: [Object: null prototype] { Z: undefined },
//   indices: [
//     [ 1, 4 ],
//     // 这里是 undefined
//     undefined,
//     // 具名捕获组的位置也为 undefined 
//     groups: [Object: null prototype] { Z: undefined }
//   ]
// ]
```