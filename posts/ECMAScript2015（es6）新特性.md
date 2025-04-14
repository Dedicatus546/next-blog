---
title: ECMAScript2015（es6）新特性
key: 1597583389
date: 2020-08-16 21:09:49
updated: 2024-12-26 15:57:35
tags:
  - JavaScript
categories:
  - 笔记
---


# 前言

ECMAScript2015（es6）新特性

<!-- more -->

# 正文

## `let`和`const`

在还没有`es6`的时候，定义变量都是用关键字`var`来进行定义。

`var`定义的变量是基于**函数作用域**的，变量会进行提升。

```javascript
function fn() {
  {
    var a = 0;
  }
  console.log(a);
}
fn();
```

运行之后输出了`0`，上面这段代码和下面这段等价。

```javascript
function fn() {
  var a;
  {
    a = 0;
  }
  console.log(a);
}
fn();
```

而如果使用了`let`和`const`来定义变量的话。

上面的代码就会报错，因为这两个关键字定义的变量是基于**块级作用域**的，变量不会提升。

```javascript
function fn() {
  {
    let a = 0;
  }
  console.log(a);
}
fn(); // 报错
```

上面变量`a`的作用域就只有在离他最近的一对大括号里面，而外层其实是没有定义的，所以报错。

```javascript
function fn() {
  let a = 1;
  {
    let a = 0;
  }
  console.log(a);
}
fn(); // 输出1
```

内层的定义不会影响到外层，他们的作用域是不同的。

```javascript
function fn() {
  let a = 1;
  {
    var a = 0;
  }
  console.log(a);
}
fn(); // 报错
```

上面这段代码报错的原因是变量大括号内由`var`定义的`a`提升到函数的最顶端了。

但是外层已经有`let`进行定义了，导致了变量的重复定义。

上面的代码可以等效为下面这段：

```javascript
function fn() {
  var a;
  let a = 1; // 重复定义
  {
    a = 0;
  }
  console.log(a);
}
fn(); // 报错
```

这也叫做暂时性死区（temporal dead zone，简称 TDZ），在同一个作用域中，`let`和`const`定义的变量之前都不能使用这个变量。

对于`var`和`let`，也有另一个有趣的现象，这个现象出现在循环中。

```javascript
var fn = [];

for (var i = 0; i < 3; i++) {
  fn[i] = function () {
    console.log(i);
  };
}

fn[2](); //输出3
```

上面的代码从我们人的角度看应该输出`2`的。

输出`3`的原因就是变量`i`的作用域不是在`for`循环内的，而是在`for`循环外。

这样函数内部输出的就是最外层同一个变量`i`了。

如果使用了`let`，那么这个奇怪的现象就会消失。

```javascript
const fn = [];

for (let i = 0; i < 3; i++) {
  fn[i] = function () {
    console.log(i);
  };
}

fn[2](); //输出2
```

使用了`let`，是的每次循环内的`i`都是不同的作用域，也就是每次循环都会生成一个新的`i`。

当然如果不使用`let`，也可以通过闭包来解决这个问题。

```javascript
var fn = [];

for (var i = 0; i < 3; i++) {
  fn[i] = (function (i) {
    return function () {
      console.log(i);
    };
  })(i);
}

fn[2](); //输出2
```

通过创建一个立即执行函数来创建一个新的作用域。

从而保证函数内部输出的`i`不会是`for`外部的`i`。

之前刚开始接触`js`的时候，被这种情况给坑过。

场景就是对一组按钮进行点击事件的绑定，绑定的内部逻辑需要用到当前按钮的索引。

```javascript
let buttons = document.getElementsByClassName("...");

for (var i = 0; i < buttons.length; i++) {
  buttons[i].onClick = function () {
    // 使用i变量
    // 比如：
    console.log(i);
  };
}
```

上面的例子无论哪个按钮，点击获取的`i`都会是`buttons`的长度（因为在`i === buttons.length`的时候跳出了循环）。

当然现在基本上都用`let`和`const`来定义变量进行使用了。

只要遵循先定义，再使用的话，就基本不会出现类似的情况了。

`let`和`const`的区别就是`let`定义的变量可以被重新赋值，而`const`不行。

```javascript
const a = 1;
a = 2; // 报错
```

如果`const`定义的是一个对象的话，那么是可以改变对象内部的属性值的。

但是不能重新赋予一个新的对象。

简单点理解就是变量指向对象的地址是不能改变的。

```javascript
const a = {
  val: 1,
};

a.val = 2; // 可以
a = {
  val: 2,
}; // 报错
```

## class

之前如果想要`new`一个对象的话，一般是通过编写一个函数，再在函数的原型式挂载方法来实现。

es6 引入了`class`，类这个概念。

可以以传统的面向对象的方式来编写代码，但是本质上还是一种语法糖，`js`的继承实现还是基于**原型链**的。

```javascript
class Student {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
  say() {
    console.log(`I am a student named '${this.name}'whose id is ${this.id}.`);
  }
}

const student = new Student("10086", "Dedicatus545");
student.say(); // 输出  I am a student named 'Dedicatus545' whose id is 10086.
```

我们可以使用`babel`来看看对于低版本的浏览器，是如何进行编译的。

这里以`Student`这个类来进行进行`babel`编译。

在线的地址 [Babel 中文网 · Babel - 下一代 JavaScript 语法的编译器](https://www.babeljs.cn/repl#?browsers=&build=&builtIns=false&spec=false&loose=false&code_lz=MYGwhgzhAEDKAuBXAJgUwHb2gbwFDWmAHt0J4AnRYeI8gCgEtkAaadMAW1QEo8CD4ACwYQAdE2gBeaEwDc-fkJGj2XKW06p5BAL4KIYAJ51eCgsVJEQqUSCIBzOgAMAktE7voZFBiyrUyNAAJNhKYv460ADugkQQqDKBIsGhwmJMOqJO3Ap6OkA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=es2015%2Creact%2Cstage-2&prettier=false&targets=&version=7.11.1&externalPlugins=)

编译之后发现，对于不同的类都有几段相同的代码，代码如下：

```javascript
function _instanceof(left, right) {
  if (
    right != null &&
    typeof Symbol !== "undefined" &&
    right[Symbol.hasInstance]
  ) {
    return !!right[Symbol.hasInstance](left);
  } else {
    return left instanceof right;
  }
}

function _classCallCheck(instance, Constructor) {
  if (!_instanceof(instance, Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}
```

然后主体的代码为下面这段：

```javascript
var Student = /*#__PURE__*/ (function () {
  function Student(id, name) {
    _classCallCheck(this, Student);

    this.id = id;
    this.name = name;
  }

  _createClass(Student, [
    {
      key: "say",
      value: function say() {
        console.log(
          "I am a student named "
            .concat(this.name, " whose id is ")
            .concat(this.id, ".")
        );
      },
    },
  ]);

  return Student;
})();
```

主体代码通过一个立即执行函数来进行构造函数的初始化。

首先在`Student`的构造函数中调用了`_classCallCheck`函数，也就是每次`new`一个新的对象都会执行这个函数。

`_classCallCheck`通过`_instanceof`来判断是否抛出错误。

`_instanceof`可以简单理解为关键字`instanceof`，只不过以函数的形式进行表示，并且内部也尝试使用`Symbol.hasInstance`这个静态的函数来判断。

当然使用`instanceof`内部也是通过执行`Symbol.hasInstance`来判断的，但是`instanceof`可以兼容更低的版本。

因为`Symbol`也是 es6 才提出来的。

MDN 上显示，ie 现在完全不支持`Symbol`。

![](https://i.loli.net/2020/08/17/71XSgvL4hcZGFwj.png)

而`instanceof`在`ie5`以上就支持了。

![](https://i.loli.net/2020/08/17/65IHEYGdmxg2qCJ.png)

感觉微软都要放弃`ie`了，即使是`ie11`，感觉用的人也越来越少了，新版`edge`的内核还是用的谷歌的内核，以后兼容应该会越来越容易吧。

回到`Student`构造函数，通过上面的分析可以总结出来，也就是不能通过直接调用`Student`函数，不然会报错。

```javascript
new Student(); // 可以
Student(); // 报错 Cannot call a class as a function
```

因为此时的函数内部的`this`指向的不是一个`Student`的实例对象。

既然不是`Student`的实例对象，那么就`this instanceof Student`一定返回`false`，而`false`情况就会触发函数`_classCallCheck`抛出错误。

接下来就是通过`_createClass`来挂载方法了。

挂载的方法分为原型上挂载和静态挂载，也就是对象方法和类方法。

可以简单地写个静态方法测试下。

![](https://i.loli.net/2020/08/17/wMVEDqpNZkGKjmh.png)

`_createClass`传入构造器，对象方法描述符数组，类方法描述符数组，然后通过`_defineProperties`来完成挂载。

## `extend`和`super`

`es6`的`class`也支持`extend`和`super`关键字。

```javascript
class People {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
}

class Student extends People {
  constructor(id, name, age) {
    super(id, name);
    this.age = age;
  }
}
```

同样，我们可以看看这段代码，经过`babel`编译成兼容`es5`的代码是怎么样的。

公共函数部分

```javascript
function _typeof(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj &&
        typeof Symbol === "function" &&
        obj.constructor === Symbol &&
        obj !== Symbol.prototype
        ? "symbol"
        : typeof obj;
    };
  }
  return _typeof(obj);
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: { value: subClass, writable: true, configurable: true },
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf =
    Object.setPrototypeOf ||
    function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
  return _setPrototypeOf(o, p);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();
  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
      result;
    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;
      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }
    return _possibleConstructorReturn(this, result);
  };
}

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }
  return _assertThisInitialized(self);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }
  return self;
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;
  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf
    ? Object.getPrototypeOf
    : function _getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
      };
  return _getPrototypeOf(o);
}

function _instanceof(left, right) {
  if (
    right != null &&
    typeof Symbol !== "undefined" &&
    right[Symbol.hasInstance]
  ) {
    return !!right[Symbol.hasInstance](left);
  } else {
    return left instanceof right;
  }
}

function _classCallCheck(instance, Constructor) {
  if (!_instanceof(instance, Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
```

其中`_classCallCheck`和`_instanceof`之前讲过了（这里由于没有编写方法，所以没有`_createClass`和`_defineProperties`这两个函数）。

`_getPrototypeOf`和`_setPrototypeOf`和`_typeof`都是简单的进行兼容处理而已。

剩下的有`_inherits`，`_createSuper`，`_possibleConstructorReturn`，`_assertThisInitialized`以及`_isNativeReflectConstruct`这几个函数。

可以先看两个类经过编译后是什么样子的。

```javascript
var People = function People(id, name) {
  _classCallCheck(this, People);

  this.id = id;
  this.name = name;
};

var Student = /*#__PURE__*/ (function (_People) {
  _inherits(Student, _People);

  var _super = _createSuper(Student);

  function Student(id, name, age) {
    var _this;

    _classCallCheck(this, Student);

    _this = _super.call(this, id, name);
    _this.age = age;
    return _this;
  }

  return Student;
})(People);
```

先调用了`_inherits`，传入了两个构造函数。

然后在`_inherits`函数中有下面这段代码。

```javascript
subClass.prototype = Object.create(superClass && superClass.prototype, {
  constructor: { value: subClass, writable: true, configurable: true },
});
```

没错，这就是之前在继承那一篇帖子说过的原型式继承，不必通过`new`来创建父类的对象，而是只需要一个指向父类原型的对象即可。

然后紧接着下面这句：

```javascript
if (superClass) _setPrototypeOf(subClass, superClass);
```

这句使得父类的静态方法也能够通过子类进行调用了，因为函数本质上也是一个对象。

接下来执行了`_createSuper`。

先通过`_isNativeReflectConstruct`判断当前环境下能否使用`Reflect`。

然后返回了一个`_createSuperInternal`函数。

内部先获取了父类构造器，然后以当前的上下文来执行这个构造器，这对应我们之前在继承中说到的借用构造方法，把父类上绑定的属性绑定在子类上。

```javascript
result = Reflect.construct(Super, arguments, NewTarget);
result = Super.apply(this, arguments);
```

最后返回了`_possibleConstructorReturn`，这个函数目的是检查构造函数是否返回了某些东西。

如果父类的构造器已经返回了一个函数或者对象的时候，那么直接返回这个函数或者对象，如果不是，那就要检查`this`。

也就是执行`_assertThisInitialized`这个函数。

如果`this` 为 `void 0`（`void 0`为`undefined`），抛出错误`"this hasn't been initialised - super() hasn't been called"`。

这个报错的意思就是子类没有调用`super`初始化父类。

需要指出，子类继承父类，必须在子类构造函数的开头调用`super`，不然报错。

![](https://i.loli.net/2020/08/17/jXmDAcINzfV7sCS.png)

那么，`babel`是如何做到这一点的呢，把`super`去掉再编译之后。

```javascript
var Student = /*#__PURE__*/ (function (_People) {
  _inherits(Student, _People);

  var _super = _createSuper(Student);

  function Student(id, name, age) {
    var _this;

    _classCallCheck(this, Student);

    _this.age = age;
    return _possibleConstructorReturn(_this);
  }

  return Student;
})(People);
```

发现少了一句：

```javascript
_this = _super.call(this, id, name);
```

并且结尾`return _this`变成`return _possibleConstructorReturn(_this)`。

此时就很明朗了，没有调用`super`，此时的`_this`都不是一个对象，传入`_possibleConstructorReturn`

由于没有第二个参数，从而判断了`self`，`self`此时明显就是`undefined`，所以报错了。

## arrow function （箭头函数）

箭头函数解决了`this`变量的绑定问题。

之前，使用到`this`的地方要格外的小心，比如下面`setTimeout`的回调函数。

```javascript
let o = {
  val: 1,
  say() {
    setTimeout(function () {
      console.log(this.val);
    }, 1000);
  },
};
```

此时的打印的输出为`undefined`，因为传进`setTimeout`参数的函数中的`this`已经不指向`o`了。

在没出现箭头函数的时候，可以使用变量`self`指向`this`来保持函数内`this`的指向。

```javascript
let o = {
  val: 1,
  say() {
    let self = this;
    setTimeout(function () {
      console.log(self.val); //输出1
    }, 1000);
  },
};
```

或者可以通过`bind`来绑定函数的上下文。

```javascript
let o = {
  val: 1,
  say() {
    setTimeout(
      function () {
        console.log(this.val); //输出1
      }.bind(this),
      1000
    );
  },
};
```

如果使用箭头函数那么问题就会消失。

```javascript
let o = {
  val: 1,
  say() {
    setTimeout(() => {
      console.log(this.val); // 输出1
    }, 1000);
  },
};
```

箭头函数可以让代码更加简介易读。

```javascript
const array = [1, 2, 3];
array.map((v) => v + 1); // 如果只需简单的处理，只要写成一行，默认就是返回值了。
```

## default（函数参数默认值）

之前如果想要设置函数的默认参数，一般是使用`||`。

```javascript
function fn(a, b) {
  a = a || 1;
  b = b || true;
  console.log(a);
  console.log(b);
}
```

这么做的问题就是如果传入了假值就会使用到默认值，但是不符合实际的逻辑。

```javascript
fn(0, false); // a 为 1， b 为 true
```

现在只需要在参数列表顺便指定默认值即可，并且符合实际逻辑。

```javascript
function fn(a = 1, b = true) {
  console.log(a);
  console.log(b);
}

fn(0, false); // a = 0 , b = false
fn(); // a = 1 , b = true
```

## rest arguments（剩余参数）

之前如果想对函数参数进行分割，一般使用函数内部变量`arguments`配合数组`slice`方法。

```javascript
function fn() {
  var sliceFn = Array.prototype.slice;
  var firstArg = sliceFn.call(arguments, 0, 1)[0];
  var restArgs = sliceFn.call(arguments, 1);
  console.log(firstArg);
  console.log(restArgs);
}

fn(1, 2, 3, 4, 5); // 输出 1 [2, 3, 4, 5]
```

现在只需要使用`...`展开符号即可分割参数数组。

```javascript
function fn(firstArg, ...restArgs) {
  console.log(firstArg);
  console.log(restArgs);
}

fn(1, 2, 3, 4, 5); // 输出 1 [2, 3, 4, 5]
```

## destructuring（解构）

```javascript
const array = [1, 2, 3];
const [first, second] = array; // first 为 1， second 为 2
```

```javascript
const array = [1, 2, 3];
const [first, , second] = array; // 中间隔开了一个元素，first 为 1， second 为 3
```

配合展开符号使用：

```javascript
const array = [1, 2, 3];
const [first, ...rest] = array; // first 为 1， rest 为 [2, 3]
```

## Enhanced object literals（增强的对象字面量）

之前如果想往对象的属性赋值的话，一个是以 `属性名:属性名对应值的变量`。

在属性名和变量名一样的情况下写起来非常的繁琐。

```javascript
const a = { val: 1 };
const b = { age: 22 };

const val = a.val;
const age = b.age;
const c = {
  val: val, // 重复的变量名
  age: age, // 重复的变量名
};
```

而现在就可以省略相同名字的字段了。

```javascript
const a = { val: 1 };
const b = { age: 22 };

const val = a.val;
const age = b.age;
const c = {
  val, // 省略了，表示属性名是val且值为变量名为val的值
  age,
};
```

## Set 和 Map

`es6`内置了两个经典的数据结构。
`Set`可以看成没有重复元素的数组。
`Map`可以看成元素是键值对的数组。

之前可以用字面对象来模拟`Map`，但是键只能是数字或者字符串，而`es6`的`Map`没有这个限制了。

```javascript
var map = { a: 1, 2: 3, true: 1 }; // 这里的true也是字符串，不要被迷惑了
```

```javascript
var map = new Map();
var key = { a: 1 };
var val = { b: 2 };
map.set(key, val); //  对象作为键
console.log(map.get(key)); //  输出 {b: 2}
```

## 其他

`es6`还要很多新特性，比如

- `Promise`
- `Proxy`
- `Reflect`
- `Symbol`
- 模板字符串
- 模块化`import`和`export`
- `...`

这些都可以在 阮一峰写的[ECMAScript 6 入门](https://es6.ruanyifeng.com/#docs/string) 上查看
