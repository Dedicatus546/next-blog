---
title: Vue Router 路由解析原理浅析
tags:
  - Vue Router
  - Vue
categories:
  - 编程
key: 1664101472date: 2022-09-25 18:24:32
updated: 2023-02-13 18:28:45
---




# 前言

最近被问到 `Vue Router` 的路由匹配的一些问题

所以这次写写在 `Vue Router@3` 和 `Vue Router@4` 中的路由匹配算法

<!-- more -->

# 正文

`Vue Router` 是 `Vue` 的官方的路由库

对于 `Vue2` 配套的版本是 `Vue Router@3` ，而 `Vue3` 配套的版本则是 `Vue Router@4`

不管是哪个版本，`Vue Router` 对于路由的解析的本质都是一样的，那就是把 `path` 参数解析成一个正则对象

在 `Vue Router@3` 中，使用了 `path-to-regexp` 这个库来将 `path` 转成 `regexp`

这点我们可以从官方文档得知 [Vue Router@3 基础/动态路由匹配/高级匹配模式](https://v3.router.vuejs.org/zh/guide/essentials/dynamic-matching.html#%E9%AB%98%E7%BA%A7%E5%8C%B9%E9%85%8D%E6%A8%A1%E5%BC%8F)

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/18/202209181114812.avif)

而在 `Vue Router@4` 中，使用了自己的匹配算法，文档上提示是“灵感来源于 `express` ” [Vue Router@4 基础/动态路由匹配/高级匹配模式](https://router.vuejs.org/zh/guide/essentials/dynamic-matching.html#%E9%AB%98%E7%BA%A7%E5%8C%B9%E9%85%8D%E6%A8%A1%E5%BC%8F)

`express` 是一个 `node` 上的简单的 `web` 框架，可以快速的搭建一个 `web` 服务器，它的路由导航支持复杂的匹配模式

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/18/202209181333128.avif)

所以我们会从 `Vue Router` 这两种匹配方式来查看它们之间的区别

## Vue Router@3 匹配算法 path-to-regexp

该库提供了字符串转正则的能力，目前用于 `Vue Router@3` 的版本，仓库地址： [pillarjs / path-to-regexp](https://github.com/pillarjs/path-to-regexp/tree/master)

它的源码构成非常简单，就一个文件，在 `src` 下的 `index.ts`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/22/202209222243732.avif)

对于源代码，其实主要就是三个函数

- `lexer`
- `parse`
- `tokensToRegexp`

### lexer

在源码中，对于一个 `path` ，最先我们需要给他转成 `LexToken` 类型，该类型定义如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/22/202209222245951.avif)

其中 `type` 为该 `LexToken` 类型， `index` 为起始索引， `value` 为对应的值

`lexer` 函数会去遍历 `path` ，对于每个字符或者字符串，都有其对应的 `type`

```typescript
function lexer(str: string): LexToken[] {
  const tokens: LexToken[] = [];
  let i = 0;

  while (i < str.length) {
    const char = str[i];

    // 修饰符，这里只匹配路径参数后附带的修饰符，() 内的正则的 *+? 不会走这里的逻辑，会走下面判断正则的逻辑
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }

    // 转义字符，对于某些字符，可能会和解析产生冲突，所以需要通过 \\ 来表明之后的字符是转义过后的，不要去解析
    // 比如对于带参数的路径，/foo?a=1 如果直接传入，报错，必须传入为 /foo\\?a=1
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }

    // 自定义前后缀起始
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }

    // 自定义前后缀结束
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }

    // 路径参数解析
    if (char === ":") {
      // ...
      
      tokens.push({ type: "NAME", index: i, value: name });
      continue;
    }

    // 正则
    if (char === "(") {
      // ...
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      continue;
    }

    // 其他字符
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }

  // 结束
  tokens.push({ type: "END", index: i, value: "" });

  return tokens;
}
```

对于修饰符，我们可以用以下例子（这里我自行打包导出了 `lexer` 这个函数，源文件是没有导出这个函数的

```javascript
console.log(lexer("?"));
console.log(lexer("\\?"));
```

执行之后得到如下结果

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/22/202209222352537.avif)

对于修饰符来说，它是有功能的，参数数量可以使用 `?` 来表示 `0` 或 `1` 个

比如 `/:foo?` 代表 `foo` 这个参数可以是有，也可以是没有

而对于转义字符，它就只是一个单纯的字符而已，只是为了防止被当成修饰符

比如 `/foo\\?a=1` 这里的 `?` 就只是表示一个单纯的字符而已，所以需要给它转义

在上面的代码中我们省略了一些逻辑，其中对于路径参数的解析为

```javascript
if (char === ":") {
  let name = "";
  let j = i + 1;

  while (j < str.length) {
    const code = str.charCodeAt(j);

    if (
      // `0-9`
      (code >= 48 && code <= 57) ||
      // `A-Z`
      (code >= 65 && code <= 90) ||
      // `a-z`
      (code >= 97 && code <= 122) ||
      // `_`
      code === 95
    ) {
      name += str[j++];
      continue;
    }

    break;
  }

  if (!name) throw new TypeError(`Missing parameter name at ${i}`);

  tokens.push({ type: "NAME", index: i, value: name });
  i = j;
  continue;
}
```

这段逻辑我觉得很简单，大家应该都能看懂，就是把 `:` 后面的 `[a-zA-z0-9_]` 的字符当成名字

比如我们输入 `/:pathName` ，那么解析如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/24/202209242218471.avif)

对于正则，解析的代码为

```javascript
if (char === "(") {
  let count = 1;
  let pattern = "";
  let j = i + 1;

  if (str[j] === "?") {
    throw new TypeError(`Pattern cannot start with "?" at ${j}`);
  }

  while (j < str.length) {
    if (str[j] === "\\") {
      pattern += str[j++] + str[j++];
      continue;
    }

    if (str[j] === ")") {
      count--;
      if (count === 0) {
        j++;
        break;
      }
    } else if (str[j] === "(") {
      count++;
      if (str[j + 1] !== "?") {
        throw new TypeError(`Capturing groups are not allowed at ${j}`);
      }
    }

    pattern += str[j++];
  }

  if (count) throw new TypeError(`Unbalanced pattern at ${i}`);
  if (!pattern) throw new TypeError(`Missing pattern at ${i}`);

  tokens.push({ type: "PATTERN", index: i, value: pattern });
  i = j;
  continue;
}
```

这个逻辑也比较简单，就是获取括号之间的内容，顺便做一些非法判断，比如如果写了括号，但是正则长度为 `0` 的话那么报错

以及正则如果以 `?` 开头，那么也报错

我们输入 `/([0-9]{0,3})` ，那么输出如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/24/202209242233254.avif)

对于 `{}` 这个匹配，现在我们只需要知道它做了个标记即可

经过上面的分析之后，我们就可以发现 `lexer` 只是标记分割类型而已，以及对类型本身进行一些简单的非法判断

对于某个类型的前后限制并没有判断，这是之后的 `parse` 函数的核心逻辑

### parse

这个步骤会根据 `lexer` 生成的 `LexToken` 列表来生成 `Token` 列表， `Token` 的类型如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/22/202209222252144.avif)

其中 `string` 很好理解，就是没有单纯的一个路径而已，和路径参数和正则都没有关系

而 `Key` 则是每个复杂路径的表示

`parse` 的精简代码如下

```typescript
export function parse(str: string, options: ParseOptions = {}): Token[] {
  const tokens = lexer(str);
  const { prefixes = "./" } = options;
  const defaultPattern = `[^${escapeString(options.delimiter || "/#?")}]+?`;
  const result: Token[] = [];
  let key = 0;
  let i = 0;
  let path = "";

  const tryConsume = (type: LexToken["type"]): string | undefined => {
    // ...
  };

  const mustConsume = (type: LexToken["type"]): string => {
    // ...
  };

  const consumeText = (): string => {
    // ...
  };

  while (i < tokens.length) {
    // ...
  }

  return result;
}
```

第一行，使用 `lexer(path)` 来获取 `LexToken` 列表，接下来就根据这个 `LexToken` 列表来生成 `Token` 列表

`prefixes` 表明了我们可以使用什么字符来分割路径，这里默认是 `.` 或者 `/` 

`defaultPattern` 表明默认的路径参数匹配的规则，没错，默认路径参数如果不写正则的话，它是会默认设置一个正则的

我们执行 `parse("/:foo")` ，结果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/25/202209250005653.avif)

这里默认的正则起始就是 `/[^/#?]+?/`

其中前面三个函数 `tryConsume` ， `mustConsume` ，`consumeText`

```typescript
const tryConsume = (type: LexToken["type"]): string | undefined => {
  if (i < tokens.length && tokens[i].type === type) return tokens[i++].value;
};
```

`tryConsume` 的意思就是我们尝试获取当前指向的 `LexToken` ，如果符合传入的 `LexToken` 类型，返回对应的 `value` ，并且索引 `i` 指向下一个 `LexToken` ，不符合则不进行任何操作

```typescript
const mustConsume = (type: LexToken["type"]): string => {
  const value = tryConsume(type);
  if (value !== undefined) return value;
  const { type: nextType, index } = tokens[i];
  throw new TypeError(`Unexpected ${nextType} at ${index}, expected ${type}`);
};
```

`mustConsume` 意味着当前指向的 `LexToken` 必须是特定 `type` 的 `LexToken` ，否则报错

这个函数主要用于匹配之前我们说过的 `{}` 自定义前后缀的逻辑，以及判断 `END` 类型的 `LexToken`

```typescript
const consumeText = (): string => {
  let result = "";
  let value: string | undefined;
  while ((value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR"))) {
    result += value;
  }
  return result;
};
```

`consumeText` 则是尝试拼接当前一段连续的 `CHAR` 或者 `ESCAPED_CHAR` ，即一段普通的字符串

接下来就是遍历 `LexToken` 列表的逻辑，这里我们拆分成三个部分会比较容易理解

```typescript
while (i < tokens.length) {
  const char = tryConsume("CHAR");
  const name = tryConsume("NAME");
  const pattern = tryConsume("PATTERN");

  // 第一部分
  // 匹配可选的路径参数和可选的路径参数正则
  if (name || pattern) {
    // ... 
    continue;
  }

  // 第二部分
  // 匹配原始的字符或者转义过的字符
  const value = char || tryConsume("ESCAPED_CHAR");
  if (value) {
    path += value;
    continue;
  }
  
  if (path) {
    result.push(path);
    path = "";
  }

  // 第三部分
  // 匹配自定义前后缀
  const open = tryConsume("OPEN");
  if (open) {
    // ...
    continue;
  }

  // 匹配结束符号
  mustConsume("END");
}
```

对于第一部分，匹配的是可选的路径参数，以及可选的路径参数正则

没错，这两者都是可选的，也就是说，我们可以有如下的写法 

- `/:foo`
- `/(\\w+)`
- `/:foo(\\w+)`

这三者解析的结果如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/25/202209251109131.avif)

如果没写路径参数名，那么内部会赋予一个自增的索引，这个部分的代码如下

```typescript
if (name || pattern) {
  // 前缀
  let prefix = char || "";

  // 前缀必须是 . 或者 / ，否则被归到上一个 path 中
  if (prefixes.indexOf(prefix) === -1) {
    path += prefix;
    prefix = "";
  }

  // 推入上一个 path
  if (path) {
    result.push(path);
    path = "";
  }

  // 推入当前路径参数
  result.push({
    // 可选路径参数名
    // 非具名下使用自增的 key 来表示
    name: name || key++,
    prefix,
    suffix: "",
    // 可选路径参数正则
    pattern: pattern || defaultPattern,
    // 是否存在修饰符
    modifier: tryConsume("MODIFIER") || "",
  });
  continue;
}
```

可以从上面看到，单是这一个大的 `if` 内就插入了两个 `path`

其实主要是为了区别前缀这个东西，对于 `/foo-:bar` 这种， `/foo-` 并不能称为 `:bar` 的前缀，而是一个单独的路径而已，而 `:bar` 也成为了一个单独的路径，此时它的前缀为空

而对于 `/:bar` 这种，由于 `/` 为默认的可选的前缀之一，所以可以成为 `:bar` 的前缀 

```typescript
const value = char || tryConsume("ESCAPED_CHAR");
if (value) {
  path += value;
  continue;
}
if (path) {
  result.push(path);
  path = "";
}
```

第二部分就比较简单了，如果当前的 `LexToken` 是普通字符或者转义字符，那么直接累加到 `path` 上即可

注意，这里（第一个 `if` 内）并没有 `push` 操作，因为在 `LexToken` 中，每个普通字符都是一个 `CHAR` 类型的

只有当当前的 `LexToken` 不是 `CHAR` 或者 `ESCAPED_CHAR` 时，才会走到第二个 `if` ，把当前拼接的 `path` 放到结果数组中

```typescript
// 尝试匹配自定义前缀开始，这里为匹配左大括号 {
const open = tryConsume("OPEN");
if (open) {
  // 获取前缀
  const prefix = consumeText();
  // 获取路径参数名，可选
  const name = tryConsume("NAME") || "";
  // 获取路径参数正则，可选
  const pattern = tryConsume("PATTERN") || "";
  // 获取后缀
  const suffix = consumeText();

  // 必须匹配右大括号 } 来作为结束标志
  mustConsume("CLOSE");

  result.push({
    name: name || (pattern ? key++ : ""),
    pattern: name && !pattern ? defaultPattern : pattern,
    prefix,
    suffix,
    modifier: tryConsume("MODIFIER") || "",
  });
  continue;
}
```

前面第二部分我们分析了当前的 `LexToken` 不是 `CHAR` 或者 `ESCAPED_CHAR` 

那么当走到第三部分时，`LexToken` 的类型只能为 `OPEN` 或者 `END` 了

在 `if` 内的逻辑其实和第一个部分是差不多的，只不过多了前后缀的解析

对于 `/{bar:foo-baz}` 这样的路径，前后缀分别为 `bar` 和 `-baz` ，注意这里我们用 `-` 来表示后缀的开始

因为在 `lexer` 函数中我们说过，路径参数名会匹配 `[0-9a-zA-z_]` 的字符

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/25/202209251149997.avif)

如果你想说，不行，`-` 这个太丑了，不要这个，那么此时其实我们可以插入一个正则，这样就能正确的解析了，即 `/{bar:foo(.*)baz}`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/25/202209251151921.avif)

### tokensToRegexp

当我们得到 `Token` 列表之后， `tokensToRegexp` 就会把 `Token` 列表转为一个正则表达式

这里我们先关注这个函数的第三个参数，这是一个配置参数，控制一些变量，如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/25/202209251350857.avif)

- `sensitive` 为 `true` ，表示区分大小写，内部使用正则的 `i` 标志
- `strict` 为 `true` ，表示不允许可选的尾随分隔符，即 `/foo` 生成的正则无法匹配 `/foo/` 路径
- `start` 和 `end` 为 `true` ，表示生成的正则限定了路径的开始和结束，内部使用正则的 `^` 和 `$`
- `delimiter` ，指定具名参数的分隔符，默认为 `/` ，`?` 和 `#`
- `endsWith` 指定自定义的结束字符，优先级比 `end = true` 要高，内部使用正向先行断言，即 `(?=endsWith)`
- `encode` ，指定字符串在插入正则前的需要做的处理，默认为 `x => x` ，即直接返回本身
- `prefixes` ，指定自定义的前缀列表，默认为 `.` 和 `/` 这点我们在 `parse` 中见过相关的逻辑了

接下来我们来看源码，主要的逻辑就是一个遍历 `Token` 列表

```typescript
export function tokensToRegexp(
  tokens: Token[],
  keys?: Key[],
  options: TokensToRegexpOptions = {}
) {
  const {
    strict = false,
    start = true,
    end = true,
    encode = (x: string) => x,
    delimiter = "/#?",
    endsWith = "",
  } = options;
  const endsWithRe = `[${escapeString(endsWith)}]|$`;
  const delimiterRe = `[${escapeString(delimiter)}]`;
  let route = start ? "^" : "";
  
  for (const token of tokens) {
    // ... 核心逻辑
  }

  // 末尾处理
  if (end) {
    // ...
  } else {
    // ...
  }
  return new RegExp(route, flags(options));
}
```

这里 `for` 内部就是生成 `route` 字符串的核心逻辑，然后最后使用 `new RegExp(route, flags(options))` 来生成一个正则并返回

```typescript
for (const token of tokens) {
  if (typeof token === "string") {
    // 如果是简单字符串，那么直接转义拼接即可
    route += escapeString(encode(token));
  } else {
    // 得到前后缀
    const prefix = escapeString(encode(token.prefix));
    const suffix = escapeString(encode(token.suffix));

    // 存在路径参数正则情况下
    if (token.pattern) {
      if (keys) keys.push(token);
      // 存在前缀或者后缀
      if (prefix || suffix) {
        
        // + 表示 1 个或多个
        // * 表示 0 个或多个
        // ? 表示 0 个 或 1 个
        if (token.modifier === "+" || token.modifier === "*") {
          const mod = token.modifier === "*" ? "?" : "";
          // 这里比较巧妙，使用了 * 和 ? 来模拟 + 和 * 的情况
          // 比如对于 /{foo-:bar-baz}* ， 用 (-bazfoo-:bar)* 来重复中间的部分
          route += `(?:${prefix}((?:${token.pattern})(?:${suffix}${prefix}(?:${token.pattern}))*)${suffix})${mod}`;
        } else {
          // 对于 ? 的情况，只需直接在末尾加上 ? 即可
          route += `(?:${prefix}(${token.pattern})${suffix})${token.modifier}`;
        }
      } else {
        // 不存在前后缀，只需简单的添加修饰符即可
        if (token.modifier === "+" || token.modifier === "*") {
          route += `((?:${token.pattern})${token.modifier})`;
        } else {
          route += `(${token.pattern})${token.modifier}`;
        }
      }
    } 
    // 不存在路径参数正则情况下，直接生成即可
    else {
      route += `(?:${prefix}${suffix})${token.modifier}`;
    }
  }
}

// 如果设置了末尾检测
if (end) {
  // 非严格模式下， 需要先加上 `[\/#\?]?` 再加上 $ 或者设置的结尾字符串
  if (!strict) route += `${delimiterRe}?`;

  route += !options.endsWith ? "$" : `(?=${endsWithRe})`;
} else {
  // 没有设置末尾检测
  // 找到最后一个 Token
  const endToken = tokens[tokens.length - 1];
  
  // 末尾 Token 是否存在分隔符
  const isEndDelimited =
    typeof endToken === "string"
      ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1
      : endToken === undefined;

  // 非严格模式下可匹配可选的尾随分隔符
  if (!strict) {
    route += `(?:${delimiterRe}(?=${endsWithRe}))?`;
  }

  // 末尾 Token 不存在分隔符，使用正向先行断言确保结尾有分隔符以及配置的特定尾随符
  if (!isEndDelimited) {
    route += `(?=${delimiterRe}|${endsWithRe})`;
  }
}
```

## Vue Router@4 匹配算法

`Vue Router@4` 使用了自己写的一套路径转正则的算法，并且加入了路径的 `Rank` 分排行

上面我们说过这个灵感来自 `express` ，那么 `express` 使用了什么算法呢？翻开 `express` 的 `package.json` ，其实使用的就是上面我们说过的 `path-to-regexp`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/25/202209251739397.avif)

不过 `express` 使用的是 `0.1.x` 的版本，那个版本只导出了 `pathToRegexp` 这个函数，而且实现上和目前的最新版本也有区别，这里就不展开了，有兴趣的可以去看看

在 `Vue Router@3` 中，对路径的匹配基于编写的顺序，即传入 `routes` 的数组内元素的顺序，它会按照顺序一个个匹配，如果匹配成功，那么直接返回对应的组件

当路由少的时候可能还行，但是一旦路由规则多了起来，有时候很容易出现写了路由没生效的情况了

而 `Vue Router@4` 引入了路径 `Rank` 分这一个特性，对于每个 `path` 路径，它都有一个 `Rank` 分，越详细越复杂的路径的 `Rank` 分就越高

即使你把这个复杂的路径写在了 `Rank` 分低于该路径的路径后面，也能够正确的进行匹配

对于路径转正则，其实 `Vue-Router@3` 和 `Vue-Router@4` 从方法上看并没有差很多，都是先转成 `Token` ，然后再根据 `Token` 来生成正则，所以这里我们就不展开了

这里主要讲讲 `Vue-Router@4` 的 `Rank` 分计算，源码中定义了一些得分规则

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/25/202209251802242.avif)

从图中可以看出，根路径得分 `90` 分，路径参数得分 `20` 分，以及一些比较低的参数的得分

通过这些得分，内部就能排序这些规则，从而以从得分高到得分低的顺序进行匹配

官方也给出了一个可以在线编写路由的测试网站，[点我直达](https://paths.esm.dev/?p=AAMsIPQgYAEL9lNgQAECUgPgDIFiDgCg#)

这里我们使用一个例子，即 `/:name(abc)` 和 `/:path`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/25/202209251812214.avif)

可以看出两者的得分是有区别的，指定了路径参数正则的路由得分要高，在右侧会比较 `Rank` 分从高到低排序

此时测试 `/abc` 那么 `/:name(abc)` 将会匹配 ，而 `path` 会被忽略，即使把它写在了 `/:name(abc)` 的前面

# 后记

是谁问的我这个问题呢，又或者说没人问过我这个问题

还要学习的东西还有很多，加油吧~