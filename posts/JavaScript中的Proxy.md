---
title: JavaScript中的Proxy  
key: 1591927786date: 2020-06-12 10:09:46  
updated: 2023-02-13 18:28:44
tags:
 - JavaScript
categories:
 - 编程
---


# 前言

这个和之前的Reflect有一定的关系，也是Vue3实现的一个很重要的API，学学学。

<!-- more -->

# Proxy

顾名思义，就是一个代理对象，通过一组配置函数来拦截操作从而使得以源对象得以被扩展。

`Proxy`是一个构造函数

由两个参数

* `obj` 需要代理的对象
* `handler` 一组由特定的处理函数组成的对象，如果没有指定，则会使用源对象的默认行为。

```javascript
var o = {};

var proxy = new Proxy(o,{});
```
在Reflect上的方法，Proxy都可以拦截，具体包括

* `getPrototypeOf`
* `setPrototypeOf`
* `isExtensible`
* `preventExtensible`
* `getOwnPropertyDescriptor`
* `defineProperty`
* `has`
* `get`
* `set`
* `deleteProperty`
* `ownKeys`
* `apply`
* `construct`

## getPrototypeOf()

读取代理对象的原型时，这个方法就会调用

有一个参数

* `obj` 源对象

该函数必须返回一个对象或者`null`

```javascript
var o = {};

var prototype = {
	name:"prototype"
};

var proxy = new Proxy(o,{
    getPrototypeOf(target){
        return prototype;
    }
});

console.log(Reflect.getPrototypeOf(proxy) === prototype);	// 打印true
```

可以触发该函数的操作包括

* `Object.getPrototypeOf`
* `Reflect.getPrototypeOf`
* `__proto__`
* `Object.prototype.isPrototypeOf`
* `instanceof`

```javascript
var proxy = new Proxy({},{
    getPrototypeOf(target){
        console.log("调用了");
        return Reflect.getPrototypeOf(target);
    }
});

// 打印了5次"调用了"
Object.getPrototypeOf(proxy);
Reflect.getPrototypeOf(proxy);
proxy.__proto__;
Object.prototype.isPrototypeOf(proxy);
proxy instanceof Object;
```

## setPrototypeOf()

设置代理对象的原型时，这个方法就会调用。

有两个参数

* `obj` 源对象
* `prototype` 将设置的原型对象

该函数在设置prototype成功返回true，失败返回false

```javascript
var proxy = new Proxy({},{
    setPrototypeOf(obj,prototype){
        console.log("设置了prototype");
        return Reflect.setPrototypeOf(obj,prototype);
    }
});

Reflect.setPrototypeOf(proxy,{});
```

可以触发该函数的操作包括

* `Reflect.setProtytpeOf`
* `Object.setPrototypeOf`

## isExtensible()

查询代理对象是否可以扩展时，这个方法就会调用。

有一个参数

* `obj` 源对象

返回值必须为一个boolean值或者可以转为Boolean的值。

```javascript
var proxy = new Proxy({},{
    isExtensible(obj){
        console.log("查询了是否能够扩展");
        return Reflect.isExtensible(obj);
    }
});

Reflect.isExtensible(proxy);
```

可以触发该函数的操作包括

* `Reflect.isExtensible`
* `Object.isExtensible`

## preventExtensions()

禁止代理对象扩展时，这个方法就会调用。

有一个参数

* `obj` 源对象

返回值必须为一个boolean值或者可以转为boolean的值。

```javascript
var proxy = new Proxy({},{
    preventExtensions(obj){
        console.log("禁止了扩展");
        return Reflect.preventExtensions(obj);
    }
});

Reflect.preventExtensions(proxy);
```

可以触发该函数的操作包括

* `Reflect.preventExtensions`
* `Object.preventExtensions`

## getOwnPropertyDescriptor()

获取对象属性的属性描述符时，这个方法会调用。

有两个参数

* `obj` 源对象
* `propertyKey` 需要获取属性描述符的属性名

返回值必须为一个对象或者`undefined`

```javascript
var proxy = new Proxy({
    name:"lwf"
},{
    getOwnPropertyDescriptor(obj,propertyKey){
        console.log("获取了属性描述符");
        return Reflect.getOwnPropertyDescriptor(obj,propertyKey);
    }
});

Reflect.getOwnPropertyDescriptor(proxy,"name");		// 打印
```

可以触发该函数的操作包括

* `Reflect.getOwnPropertyDescriptor`
* `Object.getOwnPropertyDescriptor`

## defineProperty()

在定义代理对象的属性时，这个方法会调用。

有三个参数

* `obj` 源对象
* `propertyKey` 将设置的属性名
* `descriptor` 将设置属性的属性描述符

返回值必须为一个boolean值或者可以转为boolean的值。

```javascript
var proxy = new Proxy({},{
    defineProperty(obj,propertyKey,descriptor){
        console.log("设置了对象的属性");
        return Reflect.defineProperty(obj,propertyKey,descriptor);
    }
});

Reflect.defineProperty(proxy,"name",{
    value:"lwf"
});		// 打印

console.log(proxy.name);
```

可以触发该函数的操作包括

* `Reflect.defineProperty`
* `Object.defineProperty`
* `proxyObj.propertyKey = value`

## has()

在检查属性是否存在对象中时，这个方法会调用。

有两个参数

* `obj` 源对象
* `propertyKey` 需要检查的属性名

返回值必须为一个boolean值或者可以转为boolean的值。

```javascript
var proxy = new Proxy({},{
    has(obj,propertyKey){
        console.log("检查了属性是否存在");
        return propertyKey in obj;
    }
});

"name" in proxy;	// 打印
```

可以触发该函数的操作包括

* `propertyKey in proxy`
* `propertyKey in Object.create(proxy)`
* `Reflect.has`
* `with`操作

## get()

在读取代理对象属性时，这个方法会调用。

有三个参数

* `obj` 源对象
* `propertyKey` 要获取的属性名
* `context` 要绑定到getter的上下文，默认为调用对象本身。

返回值可以为任何值。

```javascript
var proxy = new Proxy({},{
    get(obj,propertyKey,context){
        console.log("获取了属性值");
        return Reflect.get(obj,propertyKey,context);
    }
});

proxy.name;		// 打印
```

可以触发该函数的操作包括

* `proxy[propertyKey]`或者`proxy.propertyKey`
* `Object.create(proxy)[propertyKey]`或者`Object.create(proxy).propertyKey`
* `Reflect.get`

## set()

在设置代理对象属性值时，这个方法会调用。

有四个参数

* `obj` 源对象
* `propertyKey` 设置的属性名
* `value` 设置的属性值
* `context` 要绑定到setter的上下文，默认为调用对象本身。

**TIPS:**
对于`get`和`set`，其中`context`参数的传入通常是`proxy`对象本身，但是对于处于原型链上的`proxy`，传入的就不是`proxy`对象了，而是触发操作的那个对象，比如，`obj.propertykey = value`，`obj`不是代理对象，但是`obj`的原型链上存在代理对象`proxy`，那传入`context`参数的就是`obj`而不是`proxy`了。而对于通过`Reflect.set`操作触发，`context`参数就跟`set`函数指定的一样了。

返回值必须为一个boolean值或者可以转为boolean的值。

```javascript
var proxy = new Proxy({},{
    set(obj,propertyKey,value,context){
        console.log("调用了设置值");
        return Reflect.set(obj,propertyKey,value,context);
    }
});

proxy.name = "lwf";		// 打印
```

可以触发该函数的操作包括

* `proxy[propertyKey] = value`或者`proxy.propertyKey = value`
* `Object.create(proxy)[propertyKey] = value`或者`Object.create(proxy).propertyKey = value`
* `Reflect.set`

## deteleProperty()

在删除对象的属性时，这个方法会调用

有两个参数

* `obj` 源对象
* `propertyKey` 将删除的属性名

返回值必须为一个boolean值或者可以转为boolean的值。

```javascript
var proxy = new Proxy({},{
    deleteProperty(obj,propertyKey){
        console.log("删除了属性");
        return Reflect.deleteProperty(obj,propertyKey);
    }
});

delete proxy.name;	// 打印
```

可以触发该函数的操作包括

* `delete proxy[propertyKey]`或者`delete proxy.propertyKey`
* `Reflect.deleteProperty`

## ownKeys()

获取代理对象属性名组成的数组时，这个方法会调用

有一个参数

* `obj` 源对象

返回值必须为一个可枚举的对象。

```javascript
var proxy = new Proxy({},{
    ownKeys(obj){
        console.log("获取了属性名组成的数组");
        return Reflect.ownKeys(obj);
    }
});

Reflect.ownKeys(proxy);		// 打印
```

可以触发该函数的操作包括

* `Object.getOwnPropertyNames`
* `Object.getOwnPropertySymbols`
* `Reflect.ownKeys`
* `Object.keys`

## apply()

在对代理对象进行函数调用时，这个方法会调用

有一个参数

* `fn` 源函数
* `context` 执行函数的上下文
* `args` 参数的数组

返回值可以为任意值。

```javascript
function fn(msg){
    console.log(msg);
}

var proxy = new Proxy(fn,{
    apply(fn,context,args){
        console.log("执行了函数");
        return fn.apply(context,args);
    }
});

proxy("hello world");		// 打印
```

可以触发该函数的操作包括

* `proxy(arg1,arg2,...,argN)`
* `Function.prototype.apply`或者`Function.prototype.call`
* `Reflect.apply`

## construct()

以代理对象为构造器或者原型上存在代理对象的构造器生成对象时，这个方法会调用

有三个参数

* `obj` 源对象（可以被`new`）
* `args` 参数数组
* `newTarget` 被调用的构造函数

返回值必须为一个对象

```javascript
function fn(name){
    this.name = name;
}

var proxy = new Proxy(fn,{
    construct(obj,args,newTarget){
        console.log("构造了新对象");
        return Reflect.construct(obj,args);
    }
});

var p = new proxy("lwf");	// 打印

console.log(p.name);		// 打印 "lwf"
```

可以触发该函数的操作包括

* `new proxy(arg1,arg2,...,argN)`
* `Reflect.construct`

# 后记

~~学完感觉我能看懂vue3源码了~~。
