---
title: TypeScript 5.8（译）
tags:
  - TypeScript
  - JavaScript
categories:
  - 编程
date: 2025-03-03 22:45:58
updated: 2025-03-04 14:54:58
key: 1741013159
---



# 前言

原文地址：[Announcing TypeScript 5.8](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/)

<!-- more -->

# 正文

## 细粒化检测返回表达式的分支

考虑一段如下的代码：

```typescript
declare const untypedCache: Map<any, any>;

function getUrlObject(urlString: string): URL {
  return untypedCache.has(urlString) ? untypedCache.get(urlString) : urlString;
}
```

这段代码的意图是如果缓存中存在的话，从缓存中取 URL 对象，如果缓存中不存在，则创建一个新的对象。然而这里有一个 bug ：我们实际上忘记根据输入构建一个新的 URL 对象。不幸的是， TypeScript 通常不会捕获这类错误。

当 TypeScript 检查条件表达式，比如 `cond ? trueBranch : falseBranch` ，它的类型被视为两个分支类型的联合类型。换句话说，它会计算 `trueBranch` 和 `falseBranch` 的类型，然后将它们合并为一个联合类型。在这种情况下，类型 `untypedCache.get(urlString)` 的类型是 `any` ，而 `urlString` 的类型为 `string` 。这正是原因所在，因为 `any` 很容易感染和它产生关系的其他类型。联合类型 `any | string` 可以简化为 `any` ，所以在 TypeScript 开始检查 `return` 语句的表达式是否和预期返回的 `URL` 类型兼容之前，类型系统就已经丢失了可以捕获此代码错误的任何信息了。

在 TypeScript 5.8 中，类型系统将 `return` 语句中直接返回的条件表达式的语句视为特殊情况，每个条件分支都会和函数返回类型的声明（如果存在的话）进行比较，这样类型系统就可以捕获上面例子中的 bug 了。

```typescript
declare const untypedCache: Map<any, any>;

function getUrlObject(urlString: string): URL {
  return untypedCache.has(urlString) ? untypedCache.get(urlString) : urlString;
  //  ~~~~~~~~~
  // error! Type 'string' is not assignable to type 'URL'.
  // 错误！'string' 类型无法分配个 'URL' 类型
}
```

这个变更来源于这个 [PR](https://github.com/microsoft/TypeScript/pull/56941) ，它会作为 TypeScript 未来更广泛改进的一部分。

## 支持在 `--module nodenext` 下在 ESM 模块中调用 `require()`

多年来， Node 支持了 ESM 模块和 CommonJS 模块。不幸的是，两者之间的互操作性存在一些挑战。

- ESM 模块可以 `import` CommonJS 模块。
- CommonJS 模块无法 `require` ESM 模块。

换句话说，在 ESM 模块中使用 CommonJS 模块是可以的，但是反之则不行。这给那些想要提供 ESM 模块支持的库作者带来了很多挑战。这部分库作者要么双重发布（为 ESM 和 CommonJS 提供不同的入口点）他们的库，这不得不破坏用户在  CommonJS 使用下的兼容性，要么只能继续无期限地将库维持在 CommonJS 下。虽然双重发布可能听起来是个不错的折中方案，但是这个方案复杂且容易出错，还会使包大小增加大约一倍。

Node 22 放宽了这些限制，允许从 CommonJS 模块中调用 `require("esm")` 来导入 ESM 模块。 虽然 Node 仍然不允许在一个包含顶层 await 的 ESM 模块中调用 `require()` ， 但现在 CommonJS 模块可以引用了大多数 ESM 模块了。这为库作者提供了一个重要的机会，使得他们无需双重发布他们的包就可以提供 ESM 模块支持。

TypeScript 5.8 在 `--module nodenext` 下支持了这个行为。当 `--module nodenext` 开启时， TypeScript 不会对那些在 ESM 模块中的 `require()` 调用报错。

由于这个特性可能移植到低版本的 Node 中，所以目前通过 `--module nodeXXXX` 来开启这个行为的功能是不稳定的。但是，我们预测将来的 TypeScript 版本会能够在 node20 下稳定这个功能。同时，我们鼓励使用 Node22 及以上的用户使用 `--module nodenext` ， 而库作者和那些使用旧版本 Node 的用户应该继续使用 `--module node16` （或者打个次要更新补丁升级到 `--module node18` ）。

更多信息，可以查看这个 [PR]https://github.com/microsoft/TypeScript/pull/60761) 。

## `--module node18`

TypeScript 5.8 引入了稳定的 `--module node18` 的标志。这个标志为那些仍然使用 Node18 的用户提供了一个稳定的功能列表，不会包含 `--module nodenext` 下的一些行为，具体为：

- `node18` 下不允许 ESM 模块内使用 `require()` ，但 `nodenext` 允许。
- `node18` 下允许使用导入断言（已废弃，改为使用导入属性），但 `nodenext` 不允许。

在此查看相关的 [PR1](https://github.com/microsoft/TypeScript/pull/60722) 和 [PR2](https://github.com/microsoft/TypeScript/pull/60761) 。

## `--erasableSyntaxOnly`

最近， Node23.6 把直接运行 TypeScript 文件的实验支持的标志取消了，虽然在这个模式下只支持了某些结构。 Node 取消了 `--experimental-strip-types` 标志，这个标志要求任何 TypeScript 特有的语法不能存在运行时语义。换句话说，必须能够简单地擦除或者说“去掉”文件中的任何 TypeScript 特有的语法，从而留下一个合法的 JavaScript 文件。

这意味着如下的构造将不被支持：

- `enum` 定义
- 带有运行时代码的命名空间（ `namespace` ）和模块（ `module` ）
- 类内的参数属性
- 导入别名（ `import = ` ）

下面是一些例子：

```typescript
// ❌ error: A namespace with runtime code.
// 命名空间带有运行时代码
namespace container {
  foo.method();

  export type Bar = string;
}

// ❌ error: An `import =` alias
// 导入别名
import Bar = container.Bar;

class Point {
  // ❌ error: Parameter properties
  // 构造函数的参数属性
  constructor(public x: number, public y: number) {}
}

// ❌ error: An enum declaration.
// enum 定义
enum Direction {
  Up,
  Down,
  Left,
  Right,
}
```

类似的工具，比如 ts-blank-space 或者 Amaro （ Node 下潜在的类型去除库）也有相同的限制。这些工具在遇到那些不符合这些要求的代码时会提供有用的错误的信息，但实际上只有真正去尝试执行代码的话，才会发现代码无法正常工作。

这就是为什么 TypeScript 5.8 引入了 `--erasableSyntaxOnly` 的标志。当这个标志开启时， TypeScript 会对那些带有运行时行为的 TypeScript 特有的构造报错。

```typescript
class C {
  constructor(public x: number) { }
  //          ~~~~~~~~~~~~~~~~
  // error! This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
  // 错误！开启 erasableSyntaxOnly 后不允许改语法。
  }
}
```

通常，你会想要将这个标志和 `--verbatimModuleSyntax` 结合起来，以此确保模块包含了恰当的导入语法，并且不会省略导入。

更多信息查看此 [PR](https://github.com/microsoft/TypeScript/pull/61011) 。

## `--libReplacement`

在 TypeScript 4.5 ，引入了用自定文件替代默认 `lib` 文件的远景，它基于从一个名为 `@typescript/lib-*` 包中解析库文件。比如，你可以把 `dom` 库锁在一个特定的 [@types/web](https://www.npmjs.com/package/@types/web?activeTab=readme) 包版本，它的 `package.json` 看起来如下：

```json
{
  "devDependencies": {
    "@typescript/lib-dom": "npm:@types/web@0.0.199"
  }
}
```

当安装依赖的时候，由于存在 `@typescript/lib-dom` 包，当在设置中使用了 `dom` 时， TypeScript 会从该包中查找。

这是一个强大的特性，但也导致了一些额外的工作。即使你没有使用这个特性， TypeScript 仍然会执行这些查找，并且必须监听 `node_modules` 内的变更，防止一个 `lib` 开头的替换包出现但没有生效的问题。

TypeScript 5.8 引入了 `--libReplacement` 标志，它允许你关闭这个行为。如果你没有使用 `--libReplacement` ，那么现在你就可以通过 `--libReplacement false` 来禁用它。未来 `--libReplacement false` 可能会成为默认选项，所以如果当前依赖这些行为，则应该明确考虑通过 `--libReplacement true` 开启它。

更多信息查看 [PR](https://github.com/microsoft/TypeScript/issues/61023) 。

## 在声明文件中保存计算属性名称

为了让计算属性在声明文件中的输出更加可预测， TypeScript 5.8 会始终在类的计算属性名称中保存实体名称（裸变量或者类似 `a.b.c.d`）。

比如考虑如下代码：

```typescript
export let propName = "theAnswer";

export class MyClass {
  [propName] = 42;
  //  ~~~~~~~~~~
  // error!
  // A computed property name in a class property declaration must have a simple literal type or a 'unique symbol' type.
  // 类的计算属性必须有一个简单的字面类型或者一个 'unique symbol' 类型。
}
```

先前版本的 TypeScript 在为这个模块生成定义文件时会报错，声明文件会生成一个索引签名。

```typescript
export declare let propName: string;
export declare class MyClass {
  [x: string]: number;
}
```

在 TypeScript 5.8 中上面例子现在不会报错了，并且生成的声明文件会和你的代码相匹配：

```typescript
export declare let propName: string;
export declare class MyClass {
  [propName]: number;
}
```

注意这不会在类上创建静态命名的属性。你最终仍然得到一个像 `[x: string]: number` 的有效的索引签名，因此如果想要这么做的话，则需要使用 `unique symbol` 或者字面类型。

注意这段代码现在在 `--isolatedDeclarations` 标志下仍然是错误的。但我们预计，得益于这个变更，计算属性名称将可以合法地输出到声明中。

注意可能（不太可能）存在一个在 TypeScript 5.8 编译生成的声明文件无法兼容 TypeScript 5.7 及之前版本的情况。

更多信息，查看此 [PR]https://github.com/microsoft/TypeScript/pull/60052) 。

## 优化程序的加载和更新

TypeScript 5.8 引入了多个优化，缩短了构建程序的时间，并且也可以在 `--watch` 模式或者编辑器场景下的文件变更时更新程序。

首先，TypeScript 现在避免在执行路径标准化时的数组分配。通常，路径标准化会涉及将路径的每部分分段放入一个字符串数组中，基于相关段来规范结果路径，之后使用规范的分隔符再把它们拼到一起。对于那些有许多文件的项目，这个过程是一个巨大且重复的工作。 TypeScript 现在会避免分配数组，而是更多地通过索引直接对源路径进行操作。

另外，当出现不会改变项目的基础结构的编辑操作时， TypeScript 现在会避免重新验证提供给它的设置（比如 tsconfig.json 的文件内容）。这意味着，比如，简单的编辑可能不要求检查项目的输出路径是否和输入路径相冲突，它会使用上次检查的结果。这能让大项目内的编辑操作响应更快。

## 需要注意的行为变更

### lib.d.ts

详情请查看[此处](https://github.com/microsoft/TypeScript/pull/60985)。

#### `--module nodenext` 限制导入断言

导入断言是 ECMAScript 的一个提案，用来保证一个导入的某些属性（比如 “这个模块是 JSON ，它不是用来执行 JavaScript 代码的”）。这里还有一个[导入属性](https://github.com/tc39/proposal-import-attributes)的提案，作为过渡的一部分，从 使用 `assert` 关键字改为 `with` 关键字。

```typescript
// An import assertion ❌ - not future-compatible with most runtimes.
// 导热油迪亚比他不
import data from "./data.json" assert { type: "json" };

// An import attribute ✅ - the preferred way to import a JSON file.
// 导入属性
import data from "./data.json" with { type: "json" };
```

Node22 不再接受使用 `assert` 语法的导入断言。而当在 TypeScript 5.8 开启 `--module nodenext` 时， TypeScript 会在遇到导入断言时报错。

```typescript
import data from "./data.json" assert { type: "json" };
//                             ~~~~~~
// error! Import assertions have been replaced by import attributes. Use 'with' instead of 'assert'
```

更多信息查看此 [PR](https://github.com/microsoft/TypeScript/pull/60761) 。
