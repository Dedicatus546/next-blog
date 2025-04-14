---
title: JS如何解析URL的参数？
key: 1603001979date: 2020-10-18 14:19:39
updated: 2023-02-13 18:28:44
tags:
  - JavaScript
  - Vue
  - Vue-Router
categories:
  - 编程
---


`JavaScript`如何解析`URL`的参数？

<!-- more -->

# URL 解析

在`3.0`版本的`Router`中，有两个核心的函数来处理`URL`，如下：

- `parseURL` 预处理整个`URL`地址，然后把参数部分传给下面这个函数来处理；
- `parseQuery` 处理`URL`中的参数部分，返回一个对象。

可以自己把仓库拉下来，这样看起来更方便

> [`vuejs`/`vue-router-next`](https://github.com/vuejs/vue-router-next)

# parseURL

找到`src`下面的`location.ts`：

![](https://i.loli.net/2020/10/18/7hFPs2JvDrYE8fQ.png)

打开找到里面的`parseURL`：

![](https://i.loli.net/2020/10/18/lH3Mnu6A1x7CGZD.png)

完整的`ts`代码如下：

```typescript
export function parseURL(
  parseQuery: (search: string) => LocationQuery,
  location: string,
  currentLocation: string = "/"
): LocationNormalized {
  let path: string | undefined,
    query: LocationQuery = {},
    searchString = "",
    hash = "";

  // Could use URL and URLSearchParams but IE 11 doesn't support it
  const searchPos = location.indexOf("?");
  const hashPos = location.indexOf("#", searchPos > -1 ? searchPos : 0);

  if (searchPos > -1) {
    path = location.slice(0, searchPos);
    searchString = location.slice(
      searchPos + 1,
      hashPos > -1 ? hashPos : location.length
    );

    query = parseQuery(searchString);
  }

  if (hashPos > -1) {
    path = path || location.slice(0, hashPos);
    // keep the # character
    hash = location.slice(hashPos, location.length);
  }

  // no search and no query
  path = resolveRelativePath(path != null ? path : location, currentLocation);
  // empty path means a relative query or hash `?foo=f`, `#thing`

  return {
    fullPath: path + (searchString && "?") + searchString + hash,
    path,
    query,
    hash,
  };
}
```

由于只关注如何解析参数，所以这个函数有些地方忽略。

先看看参数：

- `parseQuery`一个解析参数的函数，也就是使得解析变成可配置的，下文的`parseQuery`为一个实现；
- `location`一个网址，比如这个帖子的地址：
  `http://localhost:4000/2020/10/18/JS%E5%A6%82%E4%BD%95%E8%A7%A3%E6%9E%90URL%E7%9A%84%E5%8F%82%E6%95%B0%EF%BC%9F/`

- `currentLocation`和解析过程无关，不用在意它的意思。

```javascript
const searchPos = location.indexOf("?");
const hashPos = location.indexOf("#", searchPos > -1 ? searchPos : 0);
```

先判断了网址`location`中`?`的索引以及`#`的索引，`#`的索引从`?`之后开始找。

`#`之后的字符（包括本身）都不应该作为地址查询参数的一部分。

比如`?id=1001&name=#lwf`，这里的地址查询参数应该只有`?id=1001&name=`，而不是`?id=1001&name=#lwf`。

```javascript
if (searchPos > -1) {
  path = location.slice(0, searchPos);
  searchString = location.slice(
    searchPos + 1,
    hashPos > -1 ? hashPos : location.length
  );

  query = parseQuery(searchString);
}
```

如果存在`?`，那么可能存在参数（因为可能就只有一个`?`存在，此时查询参数就为空）。

```javascript
path = location.slice(0, searchPos);
```

截取`?`前面的部分，和解析没什么关系，先不用管。

```javascript
searchString = location.slice(
  searchPos + 1,
  hashPos > -1 ? hashPos : location.length
);
```

把`?`（不包括本身，因为此时起始索引为`searchPos + 1`）和`#`（如果存在，不包括本身，不存在，截取到地址末尾）之间的字符串截取出来。

然后执行`parseQuery`函数，下面的过程和解析参数就没什么关系了，可以接着看`parseQuery`函数。

# parseQuery

找到`src`下面的`query.ts`：

![](https://i.loli.net/2020/10/18/bkmCGHqXW62PJrV.png)

然后打开找到里面的`parseQuery`函数，就是`URL`地址参数解析的核心函数。

![](https://i.loli.net/2020/10/18/uOsNxLbQVqAi684.png)

完整的`ts`代码如下：

```typescript
export function parseQuery(search: string): LocationQuery {
  const query: LocationQuery = {};
  // avoid creating an object with an empty key and empty value
  // because of split('&')
  if (search === "" || search === "?") return query;
  const hasLeadingIM = search[0] === "?";
  const searchParams = (hasLeadingIM ? search.slice(1) : search).split("&");
  for (let i = 0; i < searchParams.length; ++i) {
    const searchParam = searchParams[i];
    // allow the = character
    let eqPos = searchParam.indexOf("=");
    let key = decode(eqPos < 0 ? searchParam : searchParam.slice(0, eqPos));
    let value = eqPos < 0 ? null : decode(searchParam.slice(eqPos + 1));

    if (key in query) {
      // an extra variable for ts types
      let currentValue = query[key];
      if (!Array.isArray(currentValue)) {
        currentValue = query[key] = [currentValue];
      }
      currentValue.push(value);
    } else {
      query[key] = value;
    }
  }
  return query;
}
```

可以先看它的输入参数

- `search`需要解析的用于搜索字符串，比如`?id=1&name=lwf`这种的

返回的参数为类型为`LocationQuery`的一个对象，可以找到它的定义：

```typescript
export type LocationQuery = Record<
  string,
  LocationQueryValue | LocationQueryValue[]
>;

export type LocationQueryValue = string | null;
```

也就是返回一个普通的字面对象，不过属性的值为字符串或者`null`或者是这两者组成的数组

```javascript
if (search === "" || search === "?") return query;
```

首先判断了传入字符串的特殊情况，空字符串和单个问号不用继续运行下去，直接返回空的对象即可。

在这句话的上面有一行注释：

> avoid creating an object with an empty key and empty value because of
> split(\'&\')

意思是这个判断为了避免由于`split('&')`产生键名为空键值也为空的查询参数的情况，这是什么意思呢？

先不急，我们接着往下看。

```javascript
const hasLeadingIM = search[0] === "?";
const searchParams = (hasLeadingIM ? search.slice(1) : search).split("&");
```

判断了开头是否为`?`（内置方法有`startWith`也可以判断起始字符串）。

然后如果存在就去掉这个`?`，也就是执行`search.slice(1)`。

然后以`&`分割字符串，比如现在传入了`?id=1001&name=lwf&age=13`。

运行到这里`searchParams`的值为`['id=1001','name=lwf','age=13']`。

```javascript
for (let i = 0; i < searchParams.length; ++i) {
  // ...
}
```

接下来是对`searchParams`的一个循环：

```javascript
const searchParam = searchParams[i];
let eqPos = searchParam.indexOf("=");
```

`searchParam`变量没啥好说的，就是`searchParams`数组循环的当前值。

`eqPos`确定了每个字符串中`=`的位置，如果不存在，为`-1`，比如前面的`id=1001`，那么此时`eqPos`为`2`。

如果只想单纯判断目标字符串是否存在源字符串中，使用字符串的`includes`方法会更好（返回`true`或者`false`），这里使用`indexOf`是因为返回的索引之后要用到。

```javascript
let key = decode(eqPos < 0 ? searchParam : searchParam.slice(0, eqPos));
let value = eqPos < 0 ? null : decode(searchParam.slice(eqPos + 1));
```

`eqPos`小于`0`，也就是出现了某些没有值的属性名，比如`?id&name=lwf`，这里的`id`就没有对应的值。

如果`eqPos`大于`0`（即存在`=`），那么把字符串分割成两部分。。

- `searchParam.slice(0,eqPos)`分割了`key`的部分（`slice`的第二个参数为需要分割的末尾，开区间，也就是不包括这个索引）；
- `searchParam.slice(eqPos + 1)`分割了`value`的部分，（`slice`第二个参数默认字符串的长度，也就是截取到末尾）。

然后通过一个`decode`来对数据进行处理然后使用，`decode`函数如下：

```typescript
export function decode(text: string | number): string {
  try {
    return decodeURIComponent("" + text);
  } catch (err) {
    __DEV__ && warn(`Error decoding "${text}". Using original value`);
  }
  return "" + text;
}
```

`decodeURIComponent`是浏览器内置的一个函数，用于还原已经编码过的字符串。

比如` `（空格）会被编码成`%20`。

这个帖子的地址：`/2020/10/18/JS如何解析URL的参数？/`  
会被编码成：`/2020/10/18/JS%E5%A6%82%E4%BD%95%E8%A7%A3%E6%9E%90URL%E7%9A%84%E5%8F%82%E6%95%B0%EF%BC%9F/`。

`decodeURIComponent`函数作用就是还原成未编码前，`MDN`上有详细讲编码这块的：

> [decodeURIComponent() - MDN web docs](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent) > [encodeURIComponent() - MDN web docs](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)

`decode`尝试还原编码后的字符串，如果失败就返回原来的字符串。

那么在这两步之后，比如`'id=1001'`就会变成`key='id'`以及`value='1001'`。

而比如`'id'`这种，就会变成`key='id'`以及`value=null`。

当然，此时还会出现一种情况，就是`?=id&name=lwf`，此时`slice(0, 0)`返回了一个空字符串。

也就是此时变成`key=''`而`value='id'`，但是这没有关系，因为字面对象支持以空字符串作为属性名，如下图：

![](https://i.loli.net/2020/10/18/zBaEO3JmNsIHeAo.png)

```javascript
if (key in query) {
  // an extra variable for ts types
  let currentValue = query[key];
  if (!Array.isArray(currentValue)) {
    currentValue = query[key] = [currentValue];
  }
  currentValue.push(value);
} else {
  query[key] = value;
}
```

接下来是一个`if-else`语句，判断了当前的`key`在不在结果集`query`中。

为什么要检测，因为某些时候可能出现同名，但是不同值的情况。

比如`?id=1001&name=lwf&name=ghost`。

这时键名为`name`有两个值：`lwf`和`ghost`，处理办法就是以一个数组来存储结果集。

在键名存在的时候，通过判断来使得该键名对应的值转为数组然后把当前的值存进去。

```javascript
let currentValue = query[key];
if (!Array.isArray(currentValue)) {
  // 不是数组先转成一个数组
  currentValue = query[key] = [currentValue];
}
// 把当前值push进去
currentValue.push(value);
```

不过在应对相同键名相同键值时，会使得数组存入相同的值，感觉可以去提个`PR`了 🤣。

![](https://i.loli.net/2020/10/18/s7iE16HrhtKcXjZ.png)

```javascript
query[key] = value;
```

不存在相同键名情况下，直接以该值作为键值即可。

回到之前那个注释，产生键名为空键值也为空的查询参数是如何发生的呢？

如果`search`为`''`，那么在`split('&')`执行之后，结果为`['']`

接着`key`和`value`的产生，由于找不到`=`，`key`就为`''`，而`value`就为`null`，

返回的参数就变成了

```javascript
query = {
  "": null,
};
```

这是一个没有意义的参数对象，所以加了判断避免了这种情况

```javascript
return query;
```

最后就是返回构建出来的`query`对象

# 后记

总结起来有几个要点：

- 地址分割，`?`和`#`之间的字符串；
- `=`是否存在；
- 多`value`处理；
- 解码编码。