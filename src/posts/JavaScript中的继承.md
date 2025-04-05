---
title: JavaScript中的继承
key: 1594655360date: 2020-07-13 23:49:20
updated: 2023-02-13 18:28:44
tags:
  - JavaScript
  - 继承
categories:
  - 编程
---


`JavaScript`中的继承

<!-- more -->

# 继承

`JavaScript`的继承是基于原型链的。

通俗点讲就是每个对象都可以通过`__proto__`指向另一个对象。

在寻找对象的属性的时候，会依次的遍历原型链上的对象。

找到就返回。

所有的对象的原型链最后都会指向`Object.prototype`。

而`Object.prototype`的原型对象为空，可以通过`__proto__`看出来。

![](https://i.loli.net/2020/07/13/9xY625fTbPlFkXU.png)

所以所有的对象都可以使用挂载在`Object.prototype`的方法，前提是你不手贱把对象的原型置为`null`。

原型只能是对象或者`null`。

如果通过`Object.setPrototypeOf`设置成基本变量报错。

如果通过`__proto__`设置，不会报错，但是无效。

![](https://i.loli.net/2020/07/14/XoKQuUDfWEd5Mzx.png)

推荐使用之前说过的`Reflect.setPrototypeOf`来设置对象的原型。

因为它的返回更加的符合程序的逻辑，当然该报错的地方一样会报错。

设置成功`Reflect.setPrototypeOf`返回的是一个布尔值。

而`Object.setPrototypeOf`返回原对象。

![](https://s1.ax1x.com/2020/07/14/UNAyes.png)

好像讲偏了...

`JavaScript`中对于继承的多数方法，基本上都是和原型这一概念打交道。

在简单的继承体系中，即原型链，对于引用类型的值来说，他的子类共享同一份数据

导致了修改一个实例化对象的超类的数据，另一个实例化对象的对应数据都会发生变化。

```javascript
function Type() {
}

Type.prototype.say = function () {
  console.log("Hello");
};

Type.prototype.array = [1, 2, 3];

const t1 = new Type();
const t2 = new Type();

t1.array.push(4);

t2.say();
console.log(t2.array);
```

上述代码对于`t1`的修改影响到了`t2`，显然这不是我们想看到的

# 借用构造函数

这种方法也叫做**伪造对象**或者**经典继承**

借用构造，借用借用，借别人的构造函数来使用，便是这个方法的原理

```javascript
function SuperType() {
  this.nums = [1, 2, 3];
}

function SubType(name) {
  this.name = name;
  // 以子类的上下文获取父类上的属性和方法
  SuperType.call(this);
}

const s1 = new SubType("lwf");
const s2 = new SubType("lfw");

s1.nums.push(4);

console.log(s1.nums);
console.log(s2.nums);
```

上面这么写其实有一点问题。

如果父类构造函数中存在`name`字段的话，在子类中设置的就会被覆盖掉。

所以需要改变一下调用的顺序。

```javascript
function SubType(name) {
  // 以子类的上下文获取父类上的属性和方法
  SuperType.call(this);
  this.name = name;
}
```

如果单纯使用借用构造，那么函数就无法复用。

一般，如果想去定义一个类，都是在函数体内设置属性。

然后通过函数对象特有的`prototype`来挂载方法。

这样实例化的对象的方法都是指向一个函数，从而实现了复用。

而直接通过`this`挂载方法，则每次`new`对象都会产生新的函数。

```javascript
function Type(name) {
  this.name = name;
  this.go = function () {
    console.log("go go go");
  };
}

Type.prototype.say = function () {
  console.log(this.name);
};

const t1 = new Type("lwf");
const t2 = new Type("lfw");

console.log(t1.say === t2.say); // ---> true
console.log(t1.go === t2.go); // ---> false
```

仅仅使用借用构造，就必须把所有的方法直接挂载在`this`上。

因为借用构造无法获取父类原型上的方法和属性。

# 组合继承

组合继承也成为**伪经典继承**。

借鉴了借用构造和原型链各自的优势，组合起来。

借用构造的优势是解决了父类引用属性的共享问题。

原型链解决了函数的复用问题。

```javascript
function SuperType() {
  this.nums = [1, 2, 3];
}

SuperType.prototype.go = function () {
  console.log("go go go!");
};

function SubType(name) {
  SuperType.call(this);
  this.name = name;
}

SubType.prototype = new SuperType();
// constructor 属性会丢失，需要手动挂载上去
SubType.prototype.constructor = SubType;
// 接下来就可以愉快的在原型上挂载方法了
SubType.prototype.say = function () {
  console.log("Hello ?");
};

const s1 = new SubType("lwf");
const s2 = new SubType("fwl");

console.log(s1.nums === s2.nums); // --> false
console.log(s1.say === s2.say); // --> true
console.log(s1.go === s2.go); // --> true
```

这时候整条链条是这样的

`s1 --> SubType.prototype(SuperType实例化的对象) --> SuperType.prototype --> Object.prototype`

这时候`instanceof`和`isPrototypeOf`都能够符合预期正常地工作

```javascript
console.log(s1 instanceof SubType); // --> true
console.log(s1 instanceof SuperType); // --> true
console.log(SuperType.prototype.isPrototypeOf(s1)); // --> true
console.log(SubType.prototype.isPrototypeOf(s1)); // --> true
```

# 原型式继承

因为`JavaScript`是一门很灵活的语言。

很多时候对象的结构可以很容易的改变。

```javascript
const o = {};
o.name = "lwf"; // 新增一个属性
delete o.name; // 删除一个属性
```

原型式继承不创建自定义的类型，而是通过原型链来生成匿名子类，从而生成子对象。

```javascript
function object(o) {
  function F() {}
  F.prototype = o;
  return new F();
}
```

函数内部定义临时函数`F`。

改变`F`的原型对象（`prototype`）。

通过`F`生成新的对象并返回。

在内置的函数中`Object.create`和这个函数的行为一致。

区别是`Object.create`第二个参数可以传入属性描述符对象。

```javascript
const o = Object.create(
  {},
  {
    name: {
      value: "lwf",
    },
  }
);

console.log(o.name); // --> lwf
```

# 寄生式继承

寄生式继承可以说是在原型式继承的基础上而来的。

寄生式继承封装了由原型式继承创建而来的对象。

```javascript
function create(o) {
  const _o = object(o); // 原型式继承
  _o.name = "lwf"; // 封装属性
  _o.say = function () {
    // 封装方法
    console.log("hello");
  };
  return _o; // 返回
}
```

很容易看出寄生式继承也无法复用函数，因为它是直接挂载在实例化对象上面的。

# 寄生组合式继承

寄生组合式继承对组合继承进行了优化。

在组合继承中，在子类的构造函数中调用了一次父类的构造函数`SuperType.call`。

而在设置原型链中，又调用了一次父类的构造函数`new SuperType`。

这样子类的原型上其实存在了和子类一样的属性。

```javascript
// ...

function SubType(name) {
  // 第一次
  SuperType.call(this);
  this.name = name;
}

// 第二次
SubType.prototype = new SuperType();

// ...
```

对于设置子类的原型，没有必要去实例化一个父类的对象。

我们只需要一个指向父类原型对象的对象即可。

而这部分就通过原型式来实现。

```javascript
function extend(superType, subType) {
  // 通过原型式生成对象
  const prototype = object(superType);
  // 修复constructor属性丢失
  prototype.constructor = subType;
  // 设置原型
  subType.prototype = prototype;
}
```

这样子就只在子类的构造函数中调用了一次父类的构造函数。

而且也可以复用方法，属性也不会出现在原型链中了。

# 后记

`JavaScript`中继承的最优解应该就是最后一种方式 - 寄生组合式继承。
