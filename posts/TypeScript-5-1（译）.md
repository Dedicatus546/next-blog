---
title: TypeScript 5.1（译）
tags:
  - TypeScript
  - JavaScript
categories:
  - 翻译
key: 1685956307date: 2023-06-05 17:11:47
updated: 2023-06-05 17:19:23
---



# 前言

原文地址：[Announcing TypeScript 5.1](https://devblogs.microsoft.com/typescript/announcing-typescript-5-1/)

<!-- more -->

# 正文

今天我们激动地宣布：Typescript 5.1 正式发布。

如果你还不熟悉 TypeScript 的话，可以简单地理解为， TypeScript 是一门建立在 JavaScript 上的语言，TypeScript 通过添加类型语法来进行类型检查。类型为程序描述了一些细节，然后 TypeScript 在编译之前根据这些类型进行检查以捕获可能的拼写错误，逻辑 BUG 等等。 TypeScript 还能根据这些类型来提供编辑器工具，比如代码完成，代码重构等等。实际上，如果你使用像 VS 或者 VS Code 这样的编辑器， TypeScript 已经提供了这种体验。你可以阅读关于 TypeScript 的文档 [https://typescriptlang.org](https://typescriptlang.org) 来了解更多信息。

为了开始使用 TypeScript ，可以通过 [NuGet](https://www.nuget.org/packages/Microsoft.TypeScript.MSBuild) 获取，或者通过执行如下的 npm 命令：

```cmd
npm install -D typescript
```

以下是 TypeScript 5.1 新增的功能列表！

- 更简单地隐式返回 `undefined` 的函数
- Getter 和 Setter 的类型不再相关联
- 解耦 JSX 元素和 JSX 标签之间的类型检查
- JSX 属性支持命名空间
- 模块解析会参考 `typeRoots` 字段
- JSX 标签支持链接游标
- JSDoc 的 `@param` 支持片段补全
- 其他优化
- 破坏性变更

## 比 Beta 和 RC 版本多哪些新东西？

在 Beta 版本的时候，由于调整了提案的行为，所以我们修正了一些在装饰器中初始化钩子的行为。我们也修改了 `isolatedModules` 下的构建行为，确保脚本文件不会被重写成模块。这也意味着 `transpileModule` 接口 API 的使用也会确保脚本不被解释为模块，因为它假定使用了 `isolatedModules` 选项。

在 RC 版本的时候，我们稍微对内部进行了重构，移动了一些声明到现存的其他文件中；但是，我们相信这些操作仍然需要改进，因此，目前你可能无法在大多数的编辑器中看见这些变更。你只能通过使用 TypeScript 的夜间版本来选择加入。我们预计在 TypeScript 5.2 或者在未来通过一个 TypeScript 5.1 的补丁来重新引入这些重构项。

## 更简单地隐式返回 `undefined` 的函数

在 JavaScript 中，如果一个函数在执行过程没有返回一个 `return` 语句，那么它返回的值就是 `undefined` 。

```typescript
function foo() {
  // 没有返回
}

// x = undefined
let x = foo();
```

然而，在先前的 TypeScript 版本中，唯一可以没有返回语句的函数是 `void` 函数和返回 `any` 的函数。这意味着即使你明确地说明 “这个函数返回了 `undefined` ” ，你也被迫至少需要一个返回语句。

```typescript
// ✅ 正确 - 这里推断 f1 返回了 void
function f1() {
  // 没有返回语句
}

// ✅ 正确 - void 不需要一个返回语句
function f2(): void {
  // 没有返回语句
}

// ✅ 正确 - any 不需要一个返回语句
function f3(): any {
  // 没有返回语句
}

// ❌ 错误
// 一个类型既不是 void 和 any 的函数必须返回一个语句
function f4(): undefined {
  // 没有返回语句
}
```

如果有些 API 期望一个返回 `undefined` 的函数的话，这可能会令人痛苦。你至少需要一个明确返回 `undefined` 的函数或者带有一个返回语句和明确注解的函数。

```typescript
declare function takesFunction(f: () => undefined): undefined;

// ❌ 错误!
// () => void 类型的参数不能分配给类型 () => undefined 的参数
takesFunction(() => {
  // no returns
});

// ❌ 错误!
// 一个类型既不是 void 也不是 any 的函数必须返回一个值。
takesFunction((): undefined => {
  // 没有返回
});

// ❌ 错误!
// () => void 类型的参数不能分配给类型 () => undefined 的参数
takesFunction(() => {
  return;
});

// ✅ 正常工作
takesFunction(() => {
  return undefined;
});

// ✅ 正常工作
takesFunction((): undefined => {
  return;
});
```

这个行为令人泄气并且沮丧，特别是当调用一个不受控制的函数时。理解推断成 `void` 和 `undefined` 间的相互作用，一个返回 `undefined` 的函数是否需要一个返回 `return` 语句等等情况都令人分心。

现在， TypeScript 5.1 现在允许一个返回 `undefined` 的函数无需存在返回语句。

```typescript
// ✅ 在 TypeScript 5.1 上正常工作
function f4(): undefined {
  // 没有返回
}

// ✅ 在 TypeScript 5.1 上正常工作
takesFunction((): undefined => {
  // 没有返回
});
```

其次，如果一个函数没有返回表达式并且传递给一些期望一个返回 `undefined` 的函数的时候， TypeScript 会推断那个函数的返回类型为 `undefined` 。

```typescript
// ✅ 在 TypeScript 5.1 上正常工作
takesFunction(function f() {
  //                 ^ 返回类型为 undefined

  // 没有返回
});

// ✅ 在 TypeScript 5.1 上正常工作
takesFunction(function f() {
  //                 ^ 返回类型为 undefined

  return;
});
```

为了解决另一个相似的痛点，在 TypeScript 的 `--noImplicitReturns` 选项下，只返回 `undefined` 的函数现在会有一个相似的例外情况，在这个情况下不是每个单独的代码路径都需要以一个显式的返回语句来结束。

```typescript
// ✅ 在 TypeScript 5.1 开启 --noImplicitReturns 上正常工作
function f(): undefined {
  if (Math.random()) {
    // 进行一些操作
    return;
  }
}
```

更多的信息可以阅读原始的 [issue](https://github.com/microsoft/TypeScript/issues/36288) 和实现的 [PR](https://github.com/microsoft/TypeScript/pull/53607) 。

## Getter 和 Setter 的类型不再相关联

从 TypeScript 4.3 开始，可以为一对 get/set 访问器指定两个不同的类型。

```typescript
interface Serializer {
  set value(v: string | number | boolean);

  get value(): string;
}

declare let box: Serializer;

// 允许写入一个 boolean 值
box.value = true;

// 以 string 类型读取
console.log(box.value.toUpperCase());
```

最初我们需要 get 访问器的类型必须要 set 访问器类型的一个子类型。这意味如下的写法

```javascript
box.value = box.value;
```

应该总是合法的。

然而，有许多存在和提议的 API 需要在它们的 get/set 访问器中拥有完全无关的类型。比如，考虑一个非常普遍的例子， 在 DOM 中的 `style` 属性和 `CSSStyleRule` 接口。每一个样式规则有一个样式属性，即 `CSSStyleDeclaration` 。然而，如果你尝试写入这个属性，那么只有字符串才能正常地工作！

TypeScript 5.1 现在允许 get/set 访问器属性拥有完全无关的类型，前提是它们具有显式的类型注解。虽然这个版本的 TypeScript 还没有改变这些内置接口的类型，但现在可以以如下的方式定义 `CSSStyleRule` 。

```typescript
interface CSSStyleRule {
  // ...

  /** 总是以一个 CSSStyleDeclaration 类型读取 */
  get style(): CSSStyleDeclaration;

  /** 只能写入一个 string 类型 */
  set style(newValue: string);

  // ...
}
```

这也允许类似 set 访问器只需要合法的值，但是指定 get 访问器在未被初始化情况下可能返回 `undefined` 的情况。

```typescript
class SafeBox {
  #value: string | undefined;

  // 只接收 string 类型
  set value(newValue: string) {

  }

  // 必须对值进行 undefined 检查
  get value(): string | undefined {
    return this.#value;
  }
}
```

实际上，这类似于在开启 `--exactOptionalProperties` 下如何对可选属性进行检查的情况。

可以在这个 [PR](https://github.com/microsoft/TypeScript/pull/53417) 查看更多的信息。

## 解耦 JSX 元素和 JSX 标签之间的类型检查

在 TypeScript 中使用 JSX 的一个痛点是每个 JSX 元素的标签都需要类型。这个版本的 TypeScript 对 JSX 库提供了更准确描述，即“ JSX 组件可以返回什么内容”。对很多人来说，这具体是指能够使用在 React 中异步服务端组件（ asynchronous server component ）。

在一些上下文和背景中，一个 JSX 元素可能是如下之一：

```tsx
// 一个自闭和的标签
<Foo/>

// 一个带有开标签和闭标签的正常的标签
<Bar></Bar>
```

当对 `<Foo />` 和  `<Bar></Bar>` 进行类型检查时， TypeScript 总是寻找一个名叫 `JSX` 的命名空间，然后从中寻找一个名叫 `Element` 的类型，换句话说，就是寻找 `JSX.Element` 的类型。

但是为了检查 `Foo` 和 `Bar` 自身是否是合法的标签名称， TypeScript 会粗略地获取 `Foo` 或 `Bar` 返回或构造的类型，然后检查是否兼容 `JSX.Element` （或者如果标签的类型是可构造的话，和另一个名叫 `JSX.ElementClass` 的类型进行兼容性检查）。

这里的限制意味着如果组件返回或者“渲染”了一个比 `JSX.Element` 更广泛的类型，那么组件无法被使用。比如，一个 JSX 库可能能接受返回 `string` 或者 `Promise` 的组件。

作为一个更具体的例子，未来 React 的版本提议有限的支持返回 `Promise` 的组件。但现存的 TypeScript 版本无法在没有彻底放宽 `JSX.Element` 的类型下表达这一点。

```typescript
import * as React
  from "react";

async function Foo() {
  return <div></div>;
}

let element = <Foo / >;
//             ~~~
// Foo 无法作为一个 JSX 组件使用
// 返回的 Promise<Element> 不是一个合法的 JSX 元素
```

为了给库提供一种方式来表示上面的情况， TypeScript 5.1 现在会寻找一个名叫 `JSX.ElementType` 的类型。 `ElementType` 精确指定了在 JSX 元素中使用什么类型的标签是合法的。所以现在它的类型定义看起来如下：

```typescript
namespace JSX {
  export type ElementType =
  // 所有合法的小写标签
    keyof IntrinsicAttributes
  // 函数组件
  (props: any) => Element
  // 类组件
  new (props: any) => ElementClass;

  export interface IntrinsictAttributes extends /*...*/ {}

  export type Element = /*...*/;
  export type ClassElement = /*...*/;
}
```

感谢 [Sebastian Silbermann](https://github.com/eps1lon) 贡献了这一[变更](https://github.com/microsoft/TypeScript/pull/51328)。

## JSX 属性支持命名空间

TypeScript 现在支持在 JSX 中使用命名空间属性。

```tsx
import * as React from "react";

// 两个都是等价的
const x = <Foo a:b="hello" />;
const y = <Foo a : b = "hello" />;

interface FooProps {
  "a:b": string;
}

function Foo(props: FooProps) {
  return <div>{props["a:b"]}</div>;
}
```

当命名空间的标签的第一部分为小写的时候，它看起来和 `JSX.IntrinsicAttributes` 相似。

```tsx
namespace JSX {
  interface IntrinsicElements {
    ["a:b"]: {
      prop: string
    };
  }
}

// 代码中
let x = <a:b prop="hello!" />;
```

感谢 [Oleksandr Tarasiuk](https://github.com/a-tarasyuk) 的[贡献](https://github.com/microsoft/TypeScript/pull/53799)。

## 模块解析会参考 `typeRoots` 字段

当 TypeScript 指定的模块查找路径无法解析一个路径的时候，现在它会解析相关包指定的 `typeRoots` 字段。

更多细节查看这个 [PR](https://github.com/microsoft/TypeScript/pull/51715) 。

## JSX 标签支持链接游标

TypeScript 现在支持链接编辑 JSX 标签名称。链接编辑（有时称为“镜像游标”）允许编辑器在同一时间自动编辑多个位置。

![](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2023/04/linkedEditingJsx-5.1-1.gif)

这个新的特性可以在 TypeScript 和 JavaScript 中使用，可以在 VS Code 预览版中开启。在 VS Code 中，你可以在设置界面中编辑 `Editor: Linked Editing` 选项。

![](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2023/04/linkedEditing-5.1-vscode-ui-1.png)

或者在 JSON 设置文件中配置 `editor.linkedEditing` ：

```json
{
  // ...
  "editor.linkedEditing": true
}
```

这个特性也在 Visual Studio 17.7 Preview 1 中支持。

你可以在[这里](https://github.com/microsoft/TypeScript/pull/53284)查看连接编辑的相关实现。

## JSDoc 的 `@param` 支持片段补全

在 TypeScript 和 JavaScript 文件中， TypeScript 现在提供了对 `@param` 标签的片段补全。当你使用 JavaScript 来记录代码或者添加 JSDoc 类型的时候，这可以帮助减少一些输入以及文字间的跳转。

![](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2023/04/paramTagSnippets-5-1-1.gif)

可以在 [Github](https://github.com/microsoft/TypeScript/pull/53260) 上查看这个新特性是如何实现的。

## 其他优化

### 避免安装不必要的类型

TypeScript 5.1 现在在已知不包含对外部类型参数引用的情况下会避免执行类型安装。这 减少许多不必要的计算，在 `material-ui` 的文档[目录](https://github.com/mui/material-ui/tree/b0351248fb396001a30330daac86d0e0794a0c1d/docs)中减少了 50% 的类型检查时间。

可以在 [Github](https://github.com/microsoft/TypeScript/pull/53246) 上查看涉及这个的变更。

### 联合字面类型检查的负面情况

当对一个联合类型的一部分的类型进行检查时， TypeScript 首先会对源码使用内部的类型标识符进行快速查找。如果查找失败， TypeScript 会对联合类型中的每种类型进行兼容性检查。

当关联一个字面类型和一个包含纯字面类型的联合类型的时候， TypeScript 现在可以避免完全遍历联合类型。这个假设是安全的，因为 TypeScript 总是保留/缓存了字面类型，尽管在处理关联“新鲜”字面类型的时候存在一些边缘情况。

这个[优化](https://github.com/microsoft/TypeScript/pull/53192)能够减少在这个 [issue](https://github.com/microsoft/TypeScript/issues/53191) 的代码的类型检查的时间，从 45 秒减少到 0.4 秒。

译者注：关于这里的“新鲜”字面类型（ "fresh" literal types ），可以在这个[链接](https://basarat.gitbook.io/typescript/type-system/freshness)查看相关解释。

### 减少 JSDoc 解析带来的对扫描器的调用次数

在老版本的 TypeScript 中，解析一个 JSDoc 的注释会使用扫描器和分词器来把注释分成细粒度的单词再把这些内容拼起来。这有助于规范化注释文本，以便把多个空格折叠成一个空格。但是它相当地“健谈”，即解析器和扫描器会经常地来回跳转，这会增加 JSDoc 解析的开销。

TypeScript 5.1 移动了很多关于把 JSDoc 注释分成扫描器和分词器的逻辑。扫描器现在会直接给解析器返回更多的内容，以便需要的时候使用。

这些变更降低了一些 10 Mb 的大多是散文格式的注释的 JavaScript 大约一半的解析时间。一个更加真实的例子是，性能套件 [xstate](https://github.com/statelyai/xstate) 的快照减少了 300 毫秒的解析时间，能够更快地加载以及分析。

## 破坏性变更

### ES2020 以及使用 Node.js 14.17 作为最小的运行时要求。

TypeScript 5.1 现在包含了 ECMAScript 2020 引入的功能。因此， TypeScript 至少运行再一个相当现代的运行时上。对于大多数用户来说，这意味着 TypeScript 现在只能运行在 Node.js 14.17 及其之后的版本上了。

如果你尝试在比如 Node 10 或者 Node 12 的老版本的 Node.js 上使用时，你可能在执行 `tsc.js` 或者 `tsserver.js` 时会看到如下的一个错误：

```text
node_modules/typescript/lib/tsserver.js:2406
  for (let i = startIndex ?? 0; i < array.length; i++) {
                           ^
 
SyntaxError: Unexpected token '?'
    at wrapSafe (internal/modules/cjs/loader.js:915:16)
    at Module._compile (internal/modules/cjs/loader.js:963:27)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)
    at Module.load (internal/modules/cjs/loader.js:863:32)
    at Function.Module._load (internal/modules/cjs/loader.js:708:14)
    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:60:12)
    at internal/main/run_main_module.js:17:47
```

另外，如果你尝试安装 TypeScript ，你会从 npm 那儿得到如下的错误信息：

```text
npm WARN EBADENGINE Unsupported engine {
npm WARN EBADENGINE   package: 'typescript@5.1.3',
npm WARN EBADENGINE   required: { node: '>=14.17' },
npm WARN EBADENGINE   current: { node: 'v12.22.12', npm: '8.19.2' }
npm WARN EBADENGINE }
```

或者是 yarn ：

```text
error typescript@5.1.3: The engine "node" is incompatible with this module. Expected version ">=14.17". Got "12.22.12"
error Found incompatible module.
```

[在此](https://github.com/microsoft/TypeScript/pull/53291)查看此变更的更多信息。

先前，当在 tsconfig.json 中指定 `typeRoots` 选项但是所有的 `typeRoots` 文件夹都解析失败时， TypeScript 会仍然继续搜索父目录，在每个父目录的 `node_modules/@types` 文件夹中尝试解析这个包。

这个行为会导致过多的查找，在 TypeScript 5.1 中已被禁止。因此，基于 tsconfig.json 的 `type` 选项或者 `/// <reference >` 指令你可能会开始看到如下的错误。

```text
error TS2688: Cannot find type definition file for 'node'.
error TS2688: Cannot find type definition file for 'mocha'.
error TS2688: Cannot find type definition file for 'jasmine'.
error TS2688: Cannot find type definition file for 'chai-http'.
error TS2688: Cannot find type definition file for 'webpack-env"'.
```

解决方法通常是给 `typeRoots` 属性添加指定的 `node_modules/@types` 的入口。

```json
{
  "compilerOptions": {
    "types": [
      "node",
      "mocha"
    ],
    "typeRoots": [
      // Keep whatever you had around before.
      "./some-custom-types/",
      // You might need your local 'node_modules/@types'.
      "./node_modules/@types",
      // You might also need to specify a shared 'node_modules/@types'
      // if you're using a "monorepo" layout.
      "../../node_modules/@types"
    ]
  }
}
```

更多的信息可以查看原始的 [issue](https://github.com/microsoft/TypeScript/pull/51715) 。

## 下一步

我们的团队已经开始努力开发 TypeScript 5.2 了。你可以查看 TypeScript 5.2 的[迭代计划](https://github.com/microsoft/TypeScript/issues/54298)的具体细节。除了计划的工作项之外，迭代计划还说明了发布时间，你也可以在你自己的计划中使用。体验新特性的最好的方式是使用 TypeScript 的“夜间”版本和它的编辑体验。

不用基于回退到先前的版本！我们希望你可以享受 Typescript 5.1 ，让你享受编码带来的乐趣。