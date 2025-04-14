---
title: JavaScript中的apply和call
key: 1591929953date: 2020-06-12 10:45:53
updated: 2023-02-13 18:28:44
tags:
 - JavaScript
categories:
 - 编程
---


# 前言

也再学学这两个函数吧，万一以后面试问到了呢？

<!-- more -->

# 正文

这两个函数的作用主要是以另一个上下文允许函数，并且可以传递参数。

挂载在`Function.prototype`

## `Function.prototype.apply`

有两个参数

* `context` 指定函数执行的上下文，传入`undefined`和`null`会指定全局对象，基本类型会被包装。
* `args` 参数数组

可以返回任意的值，取决于改变上下文函数的返回值。

```javascript
var obj = {
  a:1,
  getA:function(){
    return this.a;
  }
}

console.log(obj.getA());  // 打印1

var ctxObj = {
  a:100
};

console.log(obj.getA.apply(ctxObj,[])); // 打印100
```

## 手写一个apply函数

以apply2来命名我们的实现，挂载在`Function.prototype`上

```javascript
Function.prototype.apply2 = function(){
	// ...
}
```

首先我们需要处理入参的问题，这里可以直接标明参数，也可以不标明参数
因为JavaScript函数内有一个内置对象`arguments`，储存着全部的入参，是一个类似数组的对象。
这里直接标明入参即可，因为参数是固定的。只有两个

```javascript
Function.prototype.apply2 = function(context,args){
	// ...
}
```

现在先不管参数，先解决如何以`context`为上下文呢？

这时候聪明的同学肯定想到了

```javascript
Function.prototype.apply2 = function(context,args){
  this.apply(context);
  // ...
}
```

也没那么难嘛（叉腰）

哈哈哈哈，上面只是一个玩笑，
那么如何才能以改上下文呢，
其实很简单，只要把函数挂载在`context`上，再以`context.fn`的形式调用，就可以使用`context`为上下文调用函数了。

```javascript
Function.prototype.apply2 = function(context,args){
  // 函数内部的this就是指向我们需要更改上下文的函数。
  context.fn = this;
  // 调用。
  context.fn();
}
```

ok，其实这个函数我们已经解决一大半的，现在我们来解决参数问题。
参数有一个很大的问题就是长度不一定。

肯定又有聪明的同学想到了，我可以用展开这个数组！

```javascript
Function.prototype.apply2 = function(context,args){
  // 函数内部的this就是指向我们需要更改上下文的函数。
  context.fn = this;
  // 展开参数数组并调用。
  var result = context.fn(...args);
  // 返回
  return result;
}
```

当然这并不是不可以，但是要注意，
有些浏览器并不支持解构和展开，比如我电脑上的ie11。（话说这东西真的卡，开个控制台给我闪退了…）

所以，正确的打开方式是使用`eval`函数来传参并运行。

```javascript
Function.prototype.apply2 = function(context,args){
  var argumentList = [];
  // 函数内部的this就是指向我们需要更改上下文的函数。
  context.fn = this;
  for(var i = 0; i < args.length; i++){
    argumentList.push(args[i]);
  }
  // 调用。
  var result = eval("context.fn(" + argumentList.join(",") + ")");
  // 返回
  return result;
}
```

这里重点就是通过数组的`join`方法拼接参数。

很多人以为到这里以为eval这么写应该就没什么大问题了，
只能说这波你在第一层，而用户在第五层。
如果我们的参数内存在对象的话，就会出现下面的情况。

```javascript
Function.prototype.apply2 = function(context,args){
  var argumentList = [];
  // 函数内部的this就是指向我们需要更改上下文的函数。
  context.fn = this;
  for(var i = 0; i < args.length; i++){
    argumentList.push(args[i]);
  }
  // 这里打印出来str
  var str = "context.fn(" + argumentList.join(",") + ")"
  console.log(str);
  // 调用。
  var result = eval(str);
  // 返回
  return result;
}

function fn(o) {
  return this.value + o.name;
}
var ctx = {
  value:24
}

fn.apply2(ctx,[{name:'lwf'}]);  // 打印了 context.fn([object Object]) 并且报错
```

当我们把对象和一个字符串相加时，会调用对象的`toString()`方法返回字符串来相加，
导致打印了`context.fn([object Object])`

如何避免这种情况，也就是我们不能直接的把值连接起来，而是应该把变量连接起来

```javascript
Function.prototype.apply2 = function(context,args){
  var argumentList = [];
  // 函数内部的this就是指向我们需要更改上下文的函数。
  context.fn = this;
  for(var i = 0; i < args.length; i++){
    // 把变量连接起来。
    argumentList.push("args[" + i + "]");
  }
  // 调用。
  var result = eval("context.fn(" + argumentList.join(",") + ")");
  // 返回
  return result;
}
```

现在，我们就写完了大部分的功能，也可以正确运行前面的例子了

```javascript
function fn(o) {
  return this.value + o.name;
}

var ctx = {
  value:24
}

fn.apply2(ctx,[{name:'lwf'}]);  // 打印24lwf
```

但是这时候用户很不乖，上下文传了个null或者undefined进来，完蛋，报错。

所以我们要检测传入参数的合法性。根据`MDN`上对于apply参数的定义

```javascript
Function.prototype.apply2 = function(context,args){
  // 校验上下文参数
  if(context === null || context === undefined){
    context = window;
  }else{
    context = Object(context);
  }
  // 检验参数数组
  args = args || [];
  // 拼接eval字符串的变量字符串数组
  var argumentList = [];
  // 函数内部的this就是指向我们需要更改上下文的函数。
  context.fn = this;
  for(var i = 0; i < args.length; i++){
    // 把变量连接起来。
    argumentList.push("args[" + i + "]");
  }
  // 调用
  var result = eval("context.fn(" + argumentList.join(",") + ")");
  // 返回
  return result;
}
```

至此，基本的步骤都已经完成，但是我们的上下文对象上多了一个fn的属性，我们要把它删除，
如果fn本来就有值的话该如何处理呢？

```javascript
Function.prototype.apply2 = function(context,args){
  // 校验上下文参数
  if(context === null || context === undefined){
    context = window;
  }else{
    context = Object(context);
  }
  // 检验参数数组
  args = args || [];
  // 拼接eval字符串的变量字符串数组
  var argumentList = [];
  // 函数内部的this就是指向我们需要更改上下文的函数。
  context.fn = this;
  for(var i = 0; i < args.length; i++){
    // 把变量连接起来。
    argumentList.push("args[" + i + "]");
  }
  // 调用
  var result = eval("context.fn(" + argumentList.join(",") + ")");
  // 把属性删了
  delete context.fn;
  // 返回
  return result;
}
```

解决的办法时找到一个一定没有被使用的属性进行挂载。

```javascript
Function.prototype.apply2 = function(context,args){
  // 校验上下文参数
  if(context === null || context === undefined){
    context = window;
  }else{
    context = Object(context);
  }
  // 检验参数数组
  args = args || [];
  // 拼接eval字符串的变量字符串数组
  var argumentList = [];
  var n = 0;
  while(context['fn' + n] !== undefined){
    n++;
  }
  // 函数内部的this就是指向我们需要更改上下文的函数。
  context['fn' + n] = this;
  for(var i = 0; i < args.length; i++){
    // 把变量连接起来。
    argumentList.push("args[" + i + "]");
  }
  // 调用
  var result = eval("context.fn" + n + "(" + argumentList.join(",") + ")");
  // 把属性删了
  delete context['fn' + n];
  // 返回
  return result;
}
```

至此，整个函数就已经完成了。

## `Function.prototype.call`

有n个参数，n&gt;=1

* `context` 指定函数执行的上下文
* `arg1,arg2,...,argN` 传入执行函数的参数。

```javascript
var obj = {
  a:1,
  getA:function(){
    return this.a;
  }
}

console.log(obj.getA());  // 打印1

var ctxObj = {
  a:100
};

console.log(obj.getA.call(ctxObj)); // 打印100
```

## 手写一个call函数

call和apply的实现其实差不多，只要修改下参数的组合方式即可。

```javascript
Function.prototype.call2 = function(){
  var context = arguments[0];
  // 校验上下文参数
  if(context === null || context === undefined){
    context = window;
  }else{
    context = Object(context);
  }
  // 拼接eval字符串的变量字符串数组
  var argumentList = [];
  var n = 0;
  while(context['fn' + n] !== undefined){
    n++;
  }
  // 函数内部的this就是指向我们需要更改上下文的函数。
  context['fn' + n] = this;
  for(var i = 1; i < arguments.length; i++){
    // 把变量连接起来。
    argumentList.push("arguments[" + i + "]");
  }
  // 调用
  var result = eval("context.fn" + n + "(" + argumentList.join(",") + ")");
  // 把属性删了
  delete context['fn' + n];
  // 返回
  return result;
}
```

# 后记

这首歌挺好听的~

<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width="330" height="86" src="//music.163.com/outchain/player?type=2&id=1436010135&auto=1&height=66"></iframe>