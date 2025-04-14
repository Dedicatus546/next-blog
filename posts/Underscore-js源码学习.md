---
title: Underscore.js源码学习  
key: 1591935227date: 2020-06-12 12:13:47  
updated: 2023-02-13 18:28:45
tags:
 - JavaScript
 - Vue
categories:
 - 编程
---


# 前言

Vue的源码看的头大…

先看看Underscore的吧…

这个还看得懂。

<!-- more -->

# Underscore.js
> Underscore.js is a utility-belt library for JavaScript that provides support for the usual functional suspects (each, map, reduce, filter…) without extending any core JavaScript objects.

一个提供常用函数，比如`forEach`，`map`，`filter`等，支持低版本的浏览器

> github地址 [underscore.js](https://github.com/jashkenas/underscore)

这次来学学一些关于数组的函数

## `forEach`

内置的`forEach`的语法

```typescript
[].forEach(function(v, i ,a) {
  // 函数内容
}, window/*指定函数运行的上下文*/)
```

在Underscore中为

```typescript
_.forEach([], function(v, i, a) {
  // 函数内容
}, window/*指定函数运行的上下文*/)
```

源代码如下

```typescript
export function each(obj, iteratee, context) {
  iteratee = optimizeCb(iteratee, context);
  var i, length;
  if (isArrayLike(obj)) {
    for (i = 0, length = obj.length; i < length; i++) {
      iteratee(obj[i], i, obj);
    }
  } else {
    var _keys = keys(obj);
    for (i = 0, length = _keys.length; i < length; i++) {
      iteratee(obj[_keys[i]], _keys[i], obj);
    }
  }
  return obj;
}
```

流程其实很清晰

* `optimizeCb` 先是对传进来的函数和上下文进行处理
* `isArrayLike` 判断传进来的对象是数组，直接用索引取值来执行函数
* 不是数组，视作为一个对象，获取键名，通过键名取值来执行函数

接下来看下`optimizeCb`这个函数

```typescript
function optimizeCb(func, context, argCount) {
  if (context === void 0) return func;
  switch (argCount == null ? 3 : argCount) {
    case 1: return function(value) {
      return func.call(context, value);
    };
    // The 2-argument case is omitted because we’re not using it.
    case 3: return function(value, index, collection) {
      return func.call(context, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(context, accumulator, value, index, collection);
    };
  }
  return function() {
    return func.apply(context, arguments);
  };
}
```

这里函数根据参数`argCount`来决定返回函数的参数个数。

`switch`语句中`argCount`默认为3，也就是数组的函数方法中最常见的回调函数的参数，即`item,index,array`这种格式。

接下来是`isArrayLike(obj)`这个函数

```typescript
var isArrayLike = createSizePropertyCheck(getLength);
```

这里使用了`getLength`这个变量和`createSizePropertyCheck`这个函数。

```typescript
var getLength = shallowProperty('length');

function createSizePropertyCheck(getSizeProperty) {
  return function(collection) {
    var sizeProperty = getSizeProperty(collection);
    return typeof sizeProperty == 'number' && sizeProperty >= 0 && sizeProperty <= MAX_ARRAY_INDEX;
  }
}
```

例子

```typescript
getLength([1, 2, 3]); // 输出3（数组的长度）
```

又使用了`shallowProperty`

```typescript
function shallowProperty(key) {
  return function(obj) {
    return obj == null ? void 0 : obj[key];
  };
}
```

`shallowProperty`这个函数也不复杂，就是对对象取属性值的操作，接收一个属性名，返回一个函数，这个函数接收一个对象，返回对应属性名的属性值。

`createSizePropertyCheck` 使用了我们创建的`getLength`出来的函数。这个函数又返回一个函数，用来检查传进来的参数的`length`属性值，这里返回的判断为`typeof sizeProperty == &#39;number&#39; &amp;&amp; sizeProperty &gt;= 0 &amp;&amp; sizeProperty &lt;= MAX_ARRAY_INDEX`，这里前两个判断还是挺好理解的，一个是判断类型是不是为`number`，一个判断长度是不是大于等于0，至于最后一个判断，`MAX_ARRAY_INDEX`这个变量对于的值为`Math.pow(2, 53) - 1`，这个值为JavaScript最大的整型数字，可以通过`Number.MAX_SAFE_INTEGER`来查看。但是我自己试了下，new不出来这么大的数组，可能是一种折中的解决方案吧。

回到`each`函数，只差最后一个`keys`函数了

```typescript
function keys(obj) {
  if (!isObject(obj)) return [];
  if (nativeKeys) return nativeKeys(obj);
  var _keys = [];
  for (var key in obj) if (_has(obj, key)) _keys.push(key);
  // Ahem, IE < 9.
  if (hasEnumBug) collectNonEnumProps(obj, _keys);
  return _keys;
}
```

这里使用了`isObject(obj)`函数，`nativeKeys(obj)`函数 `_has`函数，`hasEnumBug`变量和`collectNonEnumProps(obj, keys)`函数

`isObject`

```typescript
export function isObject(obj) {
  var type = typeof obj;
  return type === 'function' || type === 'object' && !!obj;
}
```

判断入参是否为一个对象，判断了对象`typeof`后的值。

除了`type === &#39;object&#39;`这个标准的判断之外，`!!obj`条件把`null`值给排除，`type === &#39;function&#39;`把函数也给归到对象里面。

`nativeKeys`

```typescript
var nativeKeys = Object.keys;
```

这里为使用原生的方法，如果存在的话。

`_has`

```typescript
var ObjProto = Object.prototype;
var hasOwnProperty = ObjProto.hasOwnProperty;
function _has(obj, path) {
  return obj != null && hasOwnProperty.call(obj, path);
}
```

这里是使用了原生的`hasOwnProperty`方法

`hasEnumBug`

```typescript
// Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
  'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];
```

这里在源代码中有注释，翻译过来大概是在IE9以下的版本某些属性名不能被`for-in`遍历（这里的某些属性名在`nonEnumerableProps`定义了），会忽略这个操作。

我在IE11上用IE5的打开一个脚本测试发现可以遍历出属性，不知道是不是用的IE11的问题。

这句话可能说的比较含糊，根据他这个语句，我觉得意思应该是重写了某些属性，但是该属性依然不可枚举这样的bug。

`collectNonEnumProps`

```typescript
function collectNonEnumProps(obj, _keys) {
  var nonEnumIdx = nonEnumerableProps.length;
  var constructor = obj.constructor;
  // 取原型
  var proto = isFunction(constructor) && constructor.prototype || ObjProto;

  // Constructor is a special case.
  // constructor构造器特殊处理，这里不是很懂...
  var prop = 'constructor';
  if (_has(obj, prop) && !contains(_keys, prop)) _keys.push(prop);

  while (nonEnumIdx--) {
    prop = nonEnumerableProps[nonEnumIdx];
    // 属性在整个原型链中，但是对象和原型所拥有的不是同一个。
    if (prop in obj && obj[prop] !== proto[prop] && !contains(_keys, prop)) {
      _keys.push(prop);
    }
  }
}
```

这个方法就是对尝试对丢失的属性进行查找并添加到属性名的数组中。

ok，把函数搞清楚之后，步骤就清晰了，对于`keys`方法

* 判断不是对象，不是返回一个空的数组
* 判断原生的`keys`方法可用，使用原生的方法
* 原生的`keys`方法不可以，使用`for-in`遍历并存到数组中。
* 存在IE遗失属性的bug，就尝试寻找丢失的属性名。

对于`each`，基本上就是这样，最后返回了数组本身，方便链式调用。

## `map`

内置的`map`的语法

```typescript
[].map(function(v, i ,a) {
  // 函数内容
}, window/*指定上下文*/)
```

在Underscore中为

```typescript
_.map([], function(v, i, a) {
  // 函数内容
}, window/*指定上下文*/)
```

它的源码如下

```typescript
export function map(obj, iteratee, context) {
  iteratee = cb(iteratee, context);
  var _keys = !isArrayLike(obj) && keys(obj),
      length = (_keys || obj).length,
      results = Array(length);
  for (var index = 0; index < length; index++) {
    var currentKey = _keys ? _keys[index] : index;
    results[index] = iteratee(obj[currentKey], currentKey, obj);
  }
  return results;
}
```

经过`each`中大部分函数的学习之后，看之后的函数就会简单很多了，

首先通过`cb`函数来处理回调函数和上下文，这个`cb`和之前的`optimizeCb`不同

`cb`

```typescript
// The function we actually call internally. It invokes _.iteratee if
// overridden, otherwise baseIteratee.
function cb(value, context, argCount) {
  if (_.iteratee !== iteratee) return _.iteratee(value, context);
  return baseIteratee(value, context, argCount);
}
```

这里的注释说明了一般情况下会使用内部的`baseIteratee`来处理回调函数和上下文，如果用户自己指定了`iteratee`，就使用用户自己定义的。

`baseIteratee`

```typescript
// Keep the identity function around for default iteratees.
function identity(value) {
  return value;
}

function baseIteratee(value, context, argCount) {
  if (value == null) return identity;
  if (isFunction(value)) return optimizeCb(value, context, argCount);
  if (isObject(value) && !isArray(value)) return matcher(value);
  return property(value);
}
```

这里的`baseIteratee`主要对回调进行处理，默认的`identity`回调，这样子在主函数，也就是`map`函数的内部就不用去判断回调函数是否为空了。

这里前两个返回还是挺好理解的，重要的是后面两个返回，一个是在是对象但不是数组的情况下的`matcher`函数和最后返回的`property`函数

`matcher`

```typescript
function matcher(attrs) {
  attrs = extendOwn({}, attrs);
  return function(obj) {
    return isMatch(obj, attrs);
  };
}
```

这里又用到了`extendOwn`和`isMatch`函数

`extendOwn`

```typescript
export var extendOwn = createAssigner(keys);
function createAssigner(keysFunc, defaults) {
  return function(obj) {
    var length = arguments.length;
    if (defaults) obj = Object(obj);
    if (length < 2 || obj == null) return obj;
    for (var index = 1; index < length; index++) {
      var source = arguments[index],
          _keys = keysFunc(source),
          l = _keys.length;
      for (var i = 0; i < l; i++) {
        var key = _keys[i];
        if (!defaults || obj[key] === void 0) obj[key] = source[key];
      }
    }
    return obj;
  };
}
```

例子

```typescript
extendOwn({}, {a: 1}, {b: 2}); // 输出{a: 1, b: 2}
```

`createAssigner`接收一个获取keys的函数，返回了一个函数，这个函数的作用就是把第二个之后的参数都合并到第一个参数中，并返回第一个参数。

`isMatch`

```typescript
export function isMatch(object, attrs) {
  var _keys = keys(attrs), length = _keys.length;
  if (object == null) return !length;
  var obj = Object(object);
  for (var i = 0; i < length; i++) {
    var key = _keys[i];
    if (attrs[key] !== obj[key] || !(key in obj)) return false;
  }
  return true;
}
```

`isMatch`就是判断传进的对象是否和`attr`中全部的属性名相等。

例子

```typescript
isMatch({a: 1}, {a: 1}); // 输出true
isMatch({a: 1}, {a: 1, b: 2}); // 输出false
```

最后一个返回就是`property`函数了

`property`

```typescript
export function property(path) {
  if (!isArray(path)) {
    return shallowProperty(path);
  }
  return function(obj) {
    return deepGet(obj, path);
  };
}
```

`shallowProperty`之前说过了就是取对象的属性值的，所以只要看`deepGet`函数就行

`deepGet`

```typescript
function deepGet(obj, path) {
  var length = path.length;
  for (var i = 0; i < length; i++) {
    if (obj == null) return void 0;
    obj = obj[path[i]];
  }
  return length ? obj : void 0;
}
```

这里传进来的`path`就是一个数组，通过迭代来取得层级属性的值。

例子

```typescript
deepGet({a: {b: 1}}, ['a', 'b']) // 输出1
```

回到`map`函数中

接着`var _keys = !isArrayLike(obj) &amp;&amp; keys(obj)`

当传入的是对象的是否，`!isArrayLike(obj)`会是`true`，就会执行`keys`函数来返回`obj`的属性名数组，根据`&amp;&amp;`这个操作符，会返回后面的值，也就是`obj`的属性名数组。

然后`length = (_keys || obj).length`，如果前一步确定是对象了，就会获取`_keys`数组的长度，否则就是正常的获取`obj`数组的长度

接着便是很简单的遍历调用并存储结果，最后返回这个结果。

## `filter`

内置的`filter`的语法

```typescript
[].filter(function(v, i ,a) {
  // 函数内容
}, window/*指定上下文*/)
```

在Underscore中为

```typescript
_.filter([], function(v, i ,a) {
  // 函数内容
}, window/*指定上下文*/)
```

它的源代码为

```typescript
export function filter(obj, predicate, context) {
  var results = [];
  predicate = cb(predicate, context);
  each(obj, function(value, index, list) {
    if (predicate(value, index, list)) results.push(value);
  });
  return results;
}
```

还是先通过`cb`来处理回调和上下文。

然后可以看到，内部使用了`each`函数来遍历，在函数体内执行传进来的判定函数`predicate`来验证是否加入结果集中。

## `find`

内置的`find`的语法

```typescript
[].find(function(v, i ,a) {
  // 函数内容
}, window/*指定上下文*/)
```

在Underscore中

```typescript
_.find([], function(v, i ,a) {
  // 函数内容
}, window/*指定上下文*/)
```

它的源代码为

```typescript
export function find(obj, predicate, context) {
  var keyFinder = isArrayLike(obj) ? findIndex : findKey;
  var key = keyFinder(obj, predicate, context);
  if (key !== void 0 && key !== -1) return obj[key];
}
```

主要的实现在`findIndex`和`findKey`中，一个是寻找数组索引，一个是寻找对象的键。

`findIndex`

```typescript
export var findIndex = createPredicateIndexFinder(1);
function createPredicateIndexFinder(dir) {
  return function(array, predicate, context) {
    predicate = cb(predicate, context);
    var length = getLength(array);
    var index = dir > 0 ? 0 : length - 1;
    for (; index >= 0 && index < length; index += dir) {
      if (predicate(array[index], index, array)) return index;
    }
    return -1;
  };
}
```

通过`createPredicateIndexFinder`来创建回调函数

首先是`cb`处理上下文，然后`getLength`获取数组长度，然后通过入参`dir`来确定遍历的方向，然后就是遍历来找到第一个确定的索引，找不到就返回`-1`.

这里要注意的一点是循环体中的`index += dir`，这里传入`1`就是正向查找，传入`-1`就是反向查找，也可以看到源码中也有一个`findLastIndex`

```typescript
export var findLastIndex = createPredicateIndexFinder(-1);
```

`findKey`

```typescript
export function findKey(obj, predicate, context) {
  predicate = cb(predicate, context);
  var _keys = keys(obj), key;
  for (var i = 0, length = _keys.length; i < length; i++) {
    key = _keys[i];
    if (predicate(obj[key], key, obj)) return key;
  }
}
```

老样子，还是`cb`处理上下文，之后用`keys`来获取对象的所有的键，然后就是简单的遍历了。

函数默认就是返回`undefined`，`findKey`没找到返回`undefined`，`void 0`返回的就是`undefined`，`findIndex`没找到就返回`-1`，所以最后判断是否找到了，找到了就通过`obj[property]`这种形式返回。如果没找到，没有返回，函数默认的返回就是`undefined`。

## `reduce` && `reduceRight`

内置的`reduce`语法

```typescript
[].reduce(function(pre, cur, i, a) {
  // 函数内容
}, {} /*初始值*/ )
```

在Underscore中为

```typescript
_.reduce([], function(pre, cur, i ,a) {
  // 函数内容
}, {} /*初始值*/, window/*指定上下文*/)
```

这里可能有人没怎么使用过这个函数，对这个函数的作用不是特别清楚。MDN上对`reduce`的解释为

> reduce() 方法对数组中的每个元素执行一个由您提供的reducer函数(升序执行)，将其结果汇总为单个返回值。

可以举个例子

```typescript
[1, 2, 3, 4].reduce(function(pre, cur, i ,a) {
  return pre + cur;
}, 0);  // 输出 10，即对数组的项进行累加
```

这个函数的四个参数分别为：

* `pre` 累加器
* `cur` 当前值
* `i` 当前值在数组内的索引
* `a` 原数组

当传入第二个参数作为起始值时，会从第一个元素开始遍历，也就是第一次遍历时，`pre = 0`，`cur = 1`
而如果不传入第二个参数，则函数第一项会作为起始值，跳过第一项，从第二项开始遍历，也就是第一次遍历时，`pre = 1`，`cur = 2`

它的源码为

```typescript
export var reduce = createReduce(1);
```

这里主要的实现是通过`createReduce`这个函数，所以找到这个函数

```typescript
function createReduce(dir) {
  // Wrap code that reassigns argument variables in a separate function than
  // the one that accesses `arguments.length` to avoid a perf hit. (#1991)
  var reducer = function(obj, iteratee, memo, initial) {
    var _keys = !isArrayLike(obj) && keys(obj),
        length = (_keys || obj).length,
        index = dir > 0 ? 0 : length - 1;
    if (!initial) {
      memo = obj[_keys ? _keys[index] : index];
      index += dir;
    }
    for (; index >= 0 && index < length; index += dir) {
      var currentKey = _keys ? _keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  return function(obj, iteratee, memo, context) {
    var initial = arguments.length >= 3;
    return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
  };
}
```

这个函数内部又定义了一个`reducer`函数，返回了一个函数，返回的函数中调用了这个`reducer`（并且通过`optimizeCb`做了上下文绑定）。

`reducer`做的事情其实很简单，就是根据`dir`和`initial`变量来确定整个运行过程。

其中`dir`控制了遍历的方向。

```typescript
index = dir > 0 ? 0 : length - 1;
```

而`initial`控制了是否设置第一个索引值作为默认值。

```typescript
// 无初始值
if (!initial) {
  // memo设为第一个值
  memo = obj[_keys ? _keys[index] : index];
  // 跳过该索引
  index += dir;
}
```

`createReduce`返回的函数中，使用了函数内部的变量`arguments`的`length`属性来确定用户是否传入了memo变量。

```typescript
var initial = arguments.length >= 3; // 小于3，没有传入memo初始值，initial为false，反之为true
```

通过`createReduce`，也可以生成一个从右往左的`reduce`，也就是`reduceRight`

```typescript
export var reduceRight = createReduce(-1);
```

# 后记

感觉Underscore中大量使用了返回函数的形式来组织代码，看起来跳来跳去的，得耐心下来读。

暂时就写这么多，学一学一些基本的`Polyfill`也是相当不错的。后续应该会接着更新~