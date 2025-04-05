---
title: JavaScript中的Reflect
key: 1591927076date: 2020-06-12 09:57:56
updated: 2023-02-13 18:28:44
tags:
 - JavaScript
categories:
 - 编程
---


# 前言

新API，得学学。

<!-- more -->

# Reflect

ES5（ES2015）的新API，看了看MDN的文档，对Reflect的描述

> 与大多数全局对象不同，`Reflect`不是一个构造函数。你不能将其与一个`new`运算符一起使用，或者将`Reflect`对象作为一个函数来调用。`Reflect`的所有属性和方法都是静态的（就像Math对象）。`Reflect`对象提供以下静态函数，它们具有与处理器对象方法相同的名称。这些方法中的一些与`Object`上的对应方法相同。

兼容性的话，在MDN上看ie是完全不兼容的，其他浏览器的兼容情况都非常不错。~~就算不兼容也要学。~~

## Reflect.apply()

类似`Function.prototype.apply()`

有三个参数

* `fn` 目标函数
* `context` 函数执行的上下文
* `arguments` 传入fn函数的参数数组（类数组）

返回值为运行绑定了`context`之后函数的返回值

```javascript
function getName() {
	console.log(this.name);
}

var o = {
	name:'lwf'
}

Reflect.apply(getName, o, []);
```

当参数为空的时候，也要传入一个空的数组（或者类数组），不然报错：

`CreateListFromArrayLike called on non-object`

当上下文无效的时候，会使用全局的对象，NodeJS中为gloabl，浏览器中为window。

## Reflect.construct()

相当于用new操作符来新建对象

有三个参数

* `fn` 目标构造函数
* `arguments` 传入构造函数的参数数组（类数组）
* `pFn` 构造函数（可选）

通过`fn`和`arguments`初始化的原型为pFn的原型对象（如果有的情况下）的对象。

```javascript
function Person(){
	this.name = 'lwf';
}

var p1 = Reflect.construct(Person,[]);

var p2 = new Person();	// 与上面等效
```

这里的`pFn`是一个构造函数，用于指定新创建对象的原型为该构造函数的原型对象。

```javascript
function Person(){
	console.log('person');
}

function People(){
	console.log('people');
}

// 在People上挂say方法
People.prototype.say = function(){
	console.log('people function');
}

var p1 = Reflect.construct(Person,[],People);

p1.say();	// 可以访问say方法

console.log(p1.__proto__ === People.prototype);	// 打印true
```

注意此时对象p1的构造函数已经不是`Person`了，而是`People`，因为js通过挂载在prototype上的constructor属性来判断对象的类型。也就是说，现在p1这个对象用`instanceof`判断，`Person`为false，而`People`为true。

```javascript
// ...

console.log(p1 instanceof Person);	// 打印false
console.log(p1 instanceof People);	// 打印true
```

在`Reflect.construct`这个方法之前，可以用`Object.create`和`Function.prototype.apply`来类似等效的创建对象。

```javascript
// 省略Person和People构造函数

var o = Object.create(People.prototype);		// 以People的原型为原型创建一个对象

Person.apply(o,[]);		// 以这个对象对上下文调用Person函数。
```

在MDN上说到一点这两种方式的不同，即在构造函数内部`new.target`属性的取值

对于`new.target`的取值，可以用下面这段代码验证其指向了构造函数。

```javascript
function Person(){
	console.log(new.target === Person.prototype.constructor);
}

new Person();	// 打印true，证明new.target指向了构造函数
```

对于通过`Object.create`和`Function.prototype.apply`创建的对象，由于没有通过`new`创建，内部的`new.target`的值会是`undefined`。

```javascript
function Person(){
	console.log(new.target);
}

function People(){}

var o = Object.create(People.prototype);

Person.apply(o,[]);	// 打印 undefined
```

而通过`Reflect.construct`来创建的话，`new.target`会自动指定到构造函数。（如果指定了`pFn`，那指向`pFn`，如果没指定，则指向默认，即为`fn`）

```javascript
function Person(){
	console.log(new.target);
}

function People(){
	console.log('people');
}

Reflect.construct(Person,[],People);		// 打印People构造函数
Reflect.construct(Person,[]);
```

## Relfect.defineProperty()

在一个对象上定义属性，类似`Object.defineProperty`

有三个参数

* `obj` 目标对象
* `propertyKey` 定义或者修改的属性名
* `attributes` 定义或修改的属性的描述

对于`attributes`参数，为一个对象，这个对象可选的键有以下：

* `configurable` 属性是否可以改变和删除，默认为`false`
* `enumerable` 属性是否可以被枚举，默认为`false`
* `value` 属性对应的值，默认为`undefined`
* `writable` 属性是否可写，默认为`false`
* `get` 属性的`getter`函数，默认为`undefined`
* `set` 属性的`setter`函数，默认为`undefined`

对于这个对象，MDN上有详细的解释，这里就不作详细的展开。

> [Object.defineProperty() - JavaScript | MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)

```javascript
var o = {};

Reflect.defineProperty(o,"name",{
	configurable:true,
	enumerable:true,
	value:"lwf",
	writable:true
});

console.log(o.name);		// 打印"lwf"

Reflect.defineProperty(o,"age",{
	configurable:true,
	enumerable:true,
	get:function() {
		return 18;
	},
	set:function(value){
		console.log(value);
	}
});

console.log(o.age);		// 调用getter，打印18

o.age = 20;				// 调用setter，打印了20

console.log(o.age);		// 调用getter，依然打印18
```

和`Object.defineProperty`方法唯一不同就是`Object.defineProperty`成功定义属性之后会返回传入的对象，失败则会报错。而`Reflect.defineProperty`会返回boolean值。

```javascript
var o = {};

var res = Object.defineProperty(o,"name",{
	configurable:false,		// 属性描述符不能被修改了
	enumerable:true,
	value:"lwf",
	writable:true
});

console.log(o === res);		// 打印true

res = Reflect.defineProperty(o,"name",{
	configurable:true		// 尝试改变属性描述符
});

console.log(res)			// 打印false

try{	
	res = Object.defineProperty(o,"name",{
		configurable:true		// 尝试改变属性描述符
	});
}catch(e){
	console.log("出错" + e);		// 打印TypeError: Cannot redefine property: name
}
```

## Reflect.deleteProperty()

类似`delete`操作符

有两个参数

* `obj` 目标对象
* `propertyKey` 要删除的属性名

```javascript
var o = {
	name:"lwf"
};

var res = Reflect.deleteProperty(o,"name");

console.log(o.name);		// 打印undefined
console.log(res)			// 打印true
```

与`delete`操作符不同的是，`Reflect.deleteProperty`为一个函数，返回boolean，表面是否删除成功。

## Reflect.get()

类似`obj[propertyKey]`，但是却是通过函数调用来获取属性值。

有三个参数

* `obj` 目标对象
* `propertyKey` 需要获取的属性名称
* `context` 如果该属性指定了getter，则调用getter时以这个参数为上下文

返回值为该对象的属性名对应的值。

```javascript
var o = {};
var context = {
	val:"context"
}

Reflect.defineProperty(o,"name",{
	get:function(){
		return this.val;
	}
});

var res = Reflect.get(o,"name",context);

console.log(res);	// 打印"context"
```

## Reflect.getOwnPropertyDescriptor()

类似`Object.getOwnPropertyDescriptor`。

有两个参数

* `obj` 目标对象
* `propertyKey`    需要获取属性描述符的属性名称

```javascript
var o = {};

Reflect.defineProperty(o,"name",{
	configurable:true,
	enumerable:true,
	value:"lwf",
	writable:true
});

var res = Reflect.getOwnPropertyDescriptor(o,"name");

console.log(res);	// 打印{ value: 'lwf', writable: true, enumerable: true, configurable: true }
```

与`Object.getOwnPropertyDescriptor`唯一不同点在与如何如理`obj`参数为非对象的情况，如果参数`obj`不是对象，`Object.getOwnPropertyDescriptor`会强制将其转为对象，而`Reflect.getOwnPropertyDescriptor`会报`TypeError`错误。

## Reflect.getPrototypeOf()

类似与`Object.getPrototypeOf`

有一个参数

* `obj` 目标对象

返回给定对象`obj`的原型对象

和通过属性`__proto__`访问的对象时同一个

```javascript
var o = {};

var res = Reflect.getPrototypeOf(o);

console.log(res === o.__proto__);
```

## Reflect.has()

检测属性是否存在对象上（包括原型链）

与`in`操作符具有相同的效果

有两个参数

* `obj` 目标对象
* `propertyKey` 需要检测的属性名

返回boolean值，表示属性是否存在。

```javascript
var o = {
	name:"lwf"
};

var res = Reflect.has(o,"name");

console.log(res);	// 打印true
console.log("name" in o);	// 打印true 和上面的操作等价

res = Reflect.has(o,"toString");

console.log(res);	// 打印true
```

## Reflect.ownKeys()

返回对象的属性名组成的数组（属性的描述器配置必须是可枚举的）

有一个参数

* `obj` 目标对象

```javascript
var o = {
	propertyKey1:"p1",
	propertyKey2:"p2"
}

var res = Reflect.ownKeys(o);

console.log(res);	// 打印 ["propertyKey1","propertyKey2"]
```

## Reflect.preventExtensions()

阻止在一个对象上添加属性，即禁止扩展。

有一个参数

* `obj` 目标对象

返回值为boolean，表示阻止是否成功。

这里需要注意一点，创建出来的对象都是默认可以扩展的，也就是可以添加属性的。

```javascript
var o = {};

var res = Reflect.isExtensible(o);	

console.log(res);	// 打印true，表示其是可以扩展的。

res = Reflect.preventExtensible(o);

console.log(res);	// 打印true，表示阻止成功。

res = Reflect.defineProperty(o,"name",{
	value:"lwf"
});

console.log(res);	// 打印false，表示设置属性失败。
```

## Reflect.isExtensible()

判断一个对象是否能够新增属性

有一个参数

* `obj` 目标对象

返回值为boolean，表示该对象是否可以扩展（即是否可以添加属性）

```javascript
var o = {};

var res = Reflect.isExtensible(o);

console.log(res)	;	// 打印true，对象默认都是可以扩展的。

Reflect.preventExtensible(o);	// 禁用其扩展。

res = Reflect.isExtensible(o);

console.log(res);	// 打印false，该对象已经不可以扩展。
```

## Reflect.set()

往对象的属性上设置值

有四个参数

* `obj` 目标对象
* `propertyKey` 需要设置值的属性名
* `value` 设置的值
* `context` 如果该属性指定了setter，则调用setter时以这个参数为上下文（可选）

返回值为boolean，表示设置属性值是否成功

```javascript
var o = {
	name:"lwf"
};

var res = Reflect.set(o,"name","fwl");

console.log(res);	// 打印true
console.log(o.name)	// 打印"fwl"

var context = {
	val:"context"
}

Reflect.defineProperty(o,"p",{
	set:function(value){
		console.log(this.val);
	}
});

Reflect.set(o,"p","lwf",context);
```

## Reflect.setPrototypeOf()

设置对象的原型

有两个参数

* `obj` 目标对象
* `protoObj` 原型对象（可为`null`）

返回值为boolean，表示设置原型对象是否成功。

```javascript
var o = {};

var res = Reflect.setPrototypeOf(o,null);

console.log(res);	// 打印true

console.log(Reflect.getPrototypeOf(o));	// 打印null
```

# 后记

`Reflect`上的方法基本上在`Object`上都有相同名字的方法，主要是修改某些`Object`上方法的返回值，让其变得合理。`new`和`delete`等一些命令式操作都可以用函数的方式调用。