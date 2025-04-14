---
title: JavaScript中的Generator函数
key: 1598364282date: 2020-08-25 22:04:42
updated: 2023-02-13 18:28:44
tags:
 - JavaScript  
categories:
 - 编程
---


# 前言

在学习`Async`的时候可以先学习`generator`函数

`generator`是ES6提出的一种特性，基于这个特性，可以去分段的执行函数

也就是函数执行到某一行，跳出之后可以重新进入到上次的状态

<!-- more -->

# Generator 

Generator 意思为生成器

在js中，Generator是一种特殊的函数

Generator的关键字为在`function`和括号之间加一个`*`号

以及在函数体内使用`yield`关键字

```javascript
function* fn() {
  yield 1;
}
```

简单点讲，生成器函数可以在`yield`的位置暂停执行，返回`yield`紧接着的表达式的值

运行一个Generator函数会返回一个生成器对象

通过调用`next`方法可以得到迭代器（Iterator）对象

可以通过`next`放方法获取下一个`yield`的值

```javascript
function* fn() {
  yield 1;
  yield 2;
  return 3;
}

const iterator = fn();
console.log(iterator.next());       // { value: 1, done: false }
console.log(iterator.next());       // { value: 2, done: false }
console.log(iterator.next());       // { value: 3, done: true }
```

通过执行函数得到一个生成器对象，这时候函数是还没有执行的

需要通过不断地调用`next`函数来进行执行

可以看出，`next`返回的对象`value`属性的值对应`yield`后面的表达式的值

而`done`则是表明此时迭代是否结束的标志

这也就是迭代器的结构

如果我们不写`return 3`，而是直接返回的话，就可以使用循环来判断是否到达了迭代的末尾

```javascript
function* fn() {
  yield 1;
  yield 2;
  return;
}

const iterator = fn();
let item = iterator.next();
while(!item.done){
  console.log(item.value);      // 以此输出 1 2
  item = iterator.next();
}
```

当然，我们可以给每次调用的`next`传入参数，传入的参数作为`yield`的返回值

```javascript
function* fn() {
  const r = yield 1;
  yield r;
  return;
}

const iter = fn();
console.log(iter.next('我是传入的参数'));      // { value: 1, done: false }
console.log(iter.next());                   // { value: '我是传入的参数', done: false }
console.log(iter.next());                   // { value: undefined, done: true }
```

`generator`有什么好处呢

比如我们现在需要一个函数来生成唯一id的话

不使用`generator`可以这么写

```javascript
let id = 0;
function getId() {
  id++;
  return id;
}

getId();        // 1
getId();        // 2
getId();        // 3
```

由于函数无法记忆状态，所以只能将变量放在全局

这样会造成变量污染

还可以使用闭包来改进上面的函数

```javascript
const getId = (function getId() {
  let id = 0;
  return function (){
    id++;
    return id;
  }
})();

getId();        // 1
getId();        // 2
getId();        // 3
```

如果使用`generator`，看起来会更加直观

```javascript
function* getId() {
  let id = 1;
  let ct = yield id;
  while(!ct) {
    id++;
    ct = yield id;
  }
}

const gen = getId();

gen.next();             // 1
gen.next();             // 2
gen.next();             // 3
gen.next(true);         // undefined 不想自增了，结束掉
```

在MDN上可以看到，除了`next`方法之外

`generator`对象还有`return`和`throw`

`return`函数用于直接结束生成器，即把生成器置于完成状态

```javascript
function* fn() {
  yield 1;
  yield 2;
  return;
}

const gen = fn();

gen.next();     // { value: 1, done: false }
gen.return();   // { value: undefined, done: true }
gen.next();     // { value: undefined, done: true }     生成器结束了，next也就是返回最后的结果，这个最后的结果可能是执行到结束的结果，也可能是调用return的结果
gen.return(3);   // { value: 3, done: true }            可以重复地调用return，根据参数返回对应的值
```

`throw`用于向生成器抛出一个异常

```javascript
function* fn() {
  try {
    yield 1;
    yield 2;
  } catch (e) {
    console.log(e);         // 输出给你一个大嘴巴子
  }
}

const gen = fn();

gen.next();     // 1;
gen.throw(new Error('给你一个大嘴巴子'));
```

`throw`返回的也是一个迭代器对象

如果此时生成器还能继续到达下一个`yield`的话

那么返回的就是下一个`yield`

如果不能到达，那么返回的迭代器对象里面的`done`为`true`

```javascript
function* fn() {
  try {
    yield 1;
    yield 2;
  } catch (e) {
    console.log(e);         // 输出给你一个大嘴巴子
  }
  yield 3;
}

const gen = fn();

gen.next();     // 1;
gen.throw(new Error('给你一个大嘴巴子'));   // 报错，返回了 { value: 3, done: false }
```

需要注意，ie不支持`generator`这个特性

![](https://i.loli.net/2020/08/26/LAEVikWCYTF8OcX.png)


# 后记

惆怅，许愿一个实习...