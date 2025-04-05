---
title: TypeScript 5.6（译）
tags:
  - TypeScript
  - JavaScript
categories:
  - 编程
date: 2024-09-11 18:33:01
updated: 2024-09-13 11:57:46
key: 1726050781
---



# 前言

原文地址：[Announcing TypeScript 5.6](https://devblogs.microsoft.com/typescript/announcing-typescript-5-6/)

<!-- more -->

# 正文

## 禁止空值和真值检查

你可能写过一个忘记调用 `.test(...)` 的正则表达式：

```javascript
if (/0x[0-9a-f]/) {
  // 这个代码块总是会执行到
  // ...
}
```

又或者偶然间将 `>=` （大于或等于操作符）写成了 `=>` （这会创建一个箭头函数）：

```javascript
if (x => 0) {
  // 这个代码块总是会执行到
  // ...
}
```

又或者你可能尝试过使用 `??` 来指定一个默认值，但是混淆了诸如 `<` 比较操作符和 `??` 操作符的优先级：

```javascript
function isValid(value: string | number, options: any, strictness: "strict" | "loose") {
  if (strictness === "loose") {
    value = +value
  }
  return value < options.max ?? 100;
  // 这里会被解析成 (value < options.max) ?? 100
}
```

又或者在一个复杂的表达式中放错括号的位置：

```javascript
if (
  isValid(primaryValue, "strict") || isValid(secondaryValue, "strict") ||
  isValid(primaryValue, "loose" || isValid(secondaryValue, "loose"))
) {
  //                           ^^^^ 👀 是否少了一个 ')'?
}
```

这些例子都没有遵循作者的意图，但他们都是合法的 JavaScript 代码。先前的 TypeScript 会静默地接受这些例子。

但通过一个小实验，我们发现许许多多的 bug 都是由上文标记为可疑的例子所造成的。在 TypeScript 5.6 中，当编译器从语法上发现一个真值检查和空检查时，它会报错，这种检查总是会以特定的方式进行评估。所以在上面的例子中，你会开始看到如下错误：

```javascript
if (/0x[0-9a-f]/) {
//  ~~~~~~~~~~~~
// error: This kind of expression is always truthy.
}

if (x => 0) {
//  ~~~~~~
// error: This kind of expression is always truthy.
}

function isValid(value: string | number, options: any, strictness: "strict" | "loose") {
  if (strictness === "loose") {
    value = +value
  }
  return value < options.max ?? 100;
  //     ~~~~~~~~~~~~~~~~~~~
  // error: Right operand of ?? is unreachable because the left operand is never nullish.
}

if (
  isValid(primaryValue, "strict") || isValid(secondaryValue, "strict") ||
  isValid(primaryValue, "loose" || isValid(secondaryValue, "loose"))
) {
  //                    ~~~~~~~
  // error: This kind of expression is always truthy.
}
```

可以通过开启 ESLint 的 `no-constant-binary-expression` 来达到相似的结果，你也可以在他们的[博客帖子](https://eslint.org/blog/2022/07/interesting-bugs-caught-by-no-constant-binary-expression/)中查看相关的成果。 TypeScript 执行的新的检查不会和 ESLint 的规则完美的重叠，我们相信在 TypeScript 自身中内置这些检查具有很大的价值。

注意某些表达式仍然会被允许，即使他们总是为真值或者空值。具体来说是 `true` ， `false` ， `0` 和 `1` ，这些值仍然会被允许，比如如下的代码：

```javascript
while (true) {
  doStuff();

  if (something()) {
    break;
  }

  doOtherStuff();
}
```

下面这段代码非常惯用并且是有用的：

```javascript
if (true || inDebuggingOrDevelopmentEnvironment()) {
  // ...
}
```

这段代码对迭代代码或者调试代码都非常有用。

如果你好奇它的实现或者它捕获的 bug 类型，可以查看这个实现了该特性的 [PR](https://github.com/microsoft/TypeScript/pull/59217) 。

## 帮助迭代的函数

JavaScript 有一个可迭代（就是我们可以通过调用 `[Symbol.iterator]()` 来得到一个迭代器从而进行迭代）和迭代器（就是有一个 `next` 方法，当我们在迭代的时候，调用这个方法就可以尝试取得下一个值）的概念。总之，通常情况下，当你将它们放在一个 for-of 循环中，或者通过 `[...spread]` 展开它们到一个新数组的时候你并不会去思考这些概念。但 TypeScript 确实会通过 `Iterable` 和 `Iterator` 类型（甚至是 `IterableIterator` ，即可迭代的迭代器）来对这些概念进行建模。这些类型描述了让对象可用于像 for-of 结构所需的最小成员集合。

`Iterable` （和 `IterableIterator`）很棒，因为它们可以被用在 JavaScript 的各种地方，但一些人发现它们自身缺少了像 `Array` 的 `map` 、 `filter` 、以及某种原因的 `reduce` 方法。这也是为什么最近 ECMAScript 提出了一个相关的提案来将 `Array` 上的许多方法加到大多数由 JavaScript 生成的 `IterableIterator` 对象上。

例如，每个生成器产生的对象会有一个 `map` 和一个 `take` 方法。

```javascript
function* positiveIntegers() {
  let i = 1;
  while (true) {
    yield i;
    i++;
  }
}

const evenNumbers = positiveIntegers().map(x => x * 2);

// Output:
//    2
//    4
//    6
//    8
//   10
for (const value of evenNumbers.take(5)) {
  console.log(value);
}
```

这对 `Map` 和 `Set` 上的 `keys` 、 `values` 和 `entries` 方法也是一样的。

```javascript
function invertKeysAndValues<K, V>(map: Map<K, V>): Map<V, K> {
  return new Map(
    map.entries().map(([k, v]) => [v, k])
  );
}
```

你也可以继承 `Iterator` 对象：

```typescript
/**
 * 一个提供无限的 0 的流
 */
class Zeroes extends Iterator<number> {
  next() {
    return { value: 0, done: false } as const;
  }
}

const zeroes = new Zeroes();

// 将流转化为无限的 1 
const ones = zeroes.map(x => x + 1);
```

你可以使用 `Iterator.from` 将任何已经存在的 `Iterable` 和 `Iterator` 改写为这种类型。

```javascript
Iterator.from(...).filter(someFunction);
```

只要在一个较新的 JavaScript 运行时上，这些新方法就可以正常工作，你也对这些新的 `Iterator` 对象可以使用垫片。

现在，我们需要谈一谈命名。

前面我们提到 TypeScript 有 `Iterable` 和 `Iterator` 两个类型，然而，就如我们提到的那样，这些行为有点像“协议”，以此来确保某些操作可以正常工作。这意味着在 TypeScript 中，不是所有的 `Iterable` 和 `Iterator` 对象都有那些我们在上面提到的方法。

但仍然会有一个新的运行时的值，名为 `Iterator` 。你可以引用 `Iterator` ，以及 `Iterator.prototype` ，将其作为 JavaScript 中实际的值。这有点别扭，因为 TypeScript 已经用 `Iterator` 定义了自身用于纯粹地类型检查。所以由于这个不幸命名冲突， TypeScript 需要引入一个另外的类型来描述这些原生或者说内置的可迭代的迭代器。

TypeScript 5.6 引入了一个新的类型，名为 `IteratorObject` 。它的定义如下：

```typescript
interface IteratorObject<T, TReturn = unknown, TNext = unknown> extends Iterator<T, TReturn, TNext> {
  [Symbol.iterator](): IteratorObject<T, TReturn, TNext>;
}
```

许多内置的集合和方法由 `IteratorObject` 生成其子类型（比如 `ArrayIterator` 、 `SetIterator` 、 `MapIterator` 等等），`lib.d.ts` 中的 JavaScript 核心和 DOM 类型，以及 `@types/node` ，都已经更新了这些新的类型。

类似地，为了保持对等性，我们增加一个 `AsyncIteratorObject` 类型。 `AsyncIterator` 还未在 JavaScript 的运行时中存在，它让 `AsyncIterable` 对象拥有同样的方法，但它已在一个活动的[提案](https://github.com/tc39/proposal-async-iterator-helpers)中了，所以这个类型是为了它而提前准备的。

感谢 [Kevin Gibbons](https://github.com/bakkot) 贡献了这些类型，同时他也是该[提案](https://github.com/tc39/proposal-iterator-helpers)额度共同作者之一。

## 严格的内置迭代器检查（ --strictBuiltinIteratorReturn 选项）

当你在一个 `Iterator<T, TReturn>` 上调用 `next()` 方法时，它会返回一个带有 `value` 和 `done` 属性的对象，这个对象由 `IteratorResult` 类型建模。

```typescript
type IteratorResult<T, TReturn = any> = IteratorYieldResult<T> | IteratorReturnResult<TReturn>;

interface IteratorYieldResult<TYield> {
  done?: false;
  value: TYield;
}

interface IteratorReturnResult<TReturn> {
  done: true;
  value: TReturn;
}
```

这里的命名受到生成器函数工作方式的启发。生成器函数可以 `yield` 值，以及 `return` 一个最终的值，但两者之间的类型可以是不相关的。

```javascript
function abc123() {
  yield "a";
  yield "b";
  yield "c";
  return 123;
}

const iter = abc123();

iter.next(); // { value: "a", done: false }
iter.next(); // { value: "b", done: false }
iter.next(); // { value: "c", done: false }
iter.next(); // { value: 123, done: true }
```

对于新的 `IteratorObject` 类型，在安全实现它时我们遇到一些困难。同时，由于 `TReturn` 为 `any` （默认情况下）`IteratorResult` 在过去都是不安全的。比如，假设我们有一个 `IteratorResult<string, any>` 类型。如果我们最终拿到这个类型的值时，我们会得到一个 `string | any` 类型，也就是 `any` 类型。

```typescript
function* uppercase(iter: Iterator<string, any>) {
  while (true) {
    const { value, done } = iter.next();
    yield value.toUppercase(); // 忘记第一时间检查 done 并且 写错了 toUpperCase 方法

    if (done) {
      return;
    }
  }
}
```

现如今对于每个 `Iterator` 来说，在不引入破坏性变更的情况下想要修复这个问题很难，但我们至少可以通过创建大多数的 `IteratorObjects` 来修复它。

TypeScript 5.6 引入了一个新的固有的类型，名为 `BuiltinIteratorReturn` 以及一个新的 `--strict` 模式的标志 `--strictBuiltinIteratorReturn` 。 每当 `IteratorObject` 用在诸如 `lib.d.ts` 这些位置的时候，它们总是会为 `TReturn` 使用 `BuiltinIteratorReturn` 类型（你也会更频繁地看到更多具体的类型，比如： `MapIterator` 、 `ArrayIterator` 、 `SetIterator` ）。 

```typescript
interface MapIterator<T> extends IteratorObject<T, BuiltinIteratorReturn, unknown> {
  [Symbol.iterator](): MapIterator<T>;
}

// ...

interface Map<K, V> {
  // ...

  /**
   * Returns an iterable of key, value pairs for every entry in the map.
   */
  entries(): MapIterator<[K, V]>;

  /**
   * Returns an iterable of keys in the map
   */
  keys(): MapIterator<K>;

  /**
   * Returns an iterable of values in the map
   */
  values(): MapIterator<V>;
}
```

默认情况下 `BuiltinIteratorReturn` 为 `any` ，但当开启 `--strictBuiltinIteratorReturn` 后（或者通过 `--strict`），它就为 `undefined` 。在这个新模式下面，如果我们使用 `BuiltinIteratorReturn` ，之前的例子在现在就会正确地报错：

```typescript
function* uppercase(iter: Iterator<string, BuiltinIteratorReturn>) {
  while (true) {
    const { value, done } = iter.next();
    yield value.toUppercase();
    //    ~~~~~ ~~~~~~~~~~~
    // error! ┃      ┃
    //        ┃      ┗━ Property 'toUppercase' does not exist on type 'string'. Did you mean 'toUpperCase'?
    //        ┃
    //        ┗━ 'value' is possibly 'undefined'.

    if (done) {
      return;
    }
  }
}
```

通常情况下你会在 `lib.d.ts` 文件中的各处看到配对的 `BuiltinIteratorReturn` 和 `IteratorObject` 。一般来说，我们建议在你的代码中尽可能地明确 `TReturn` 的类型。

更多信息，你可以在该 [PR](https://github.com/microsoft/TypeScript/pull/58243) 中阅读该特性。

## 支持随意的模块标识符

JavaScript 允许模块导出绑定到无效的标识符名称，比如字符串字面量：

```typescript
const banana = "🍌";

export { banana as "🍌" };
```

同样，它允许模块使用这些随意的名称来导入，将它们绑定到合法的标识符上：

```typescript
import { "🍌" as banana } from "./foo"

function eat(food: string) {
  console.log("Eating", food);
};

eat(banana);
```

这似乎很花里胡哨，但它与其他语言在互操作性上有作用（通常通过 JavaScript 或者 WebAssembly 的边界代码），因为其他的语言可能对合法的标识符集合存在不同的规则。它也对生成代码的工作有帮助，比如 esbuild 的 [inject](https://esbuild.github.io/api/#inject) 特性。

TypeScript 5.6 现在允许在代码中使用这些随意的模块标识符。感谢 [Evan Wallace](https://github.com/evanw) 的[贡献](https://github.com/microsoft/TypeScript/pull/58640)。

## --noUncheckedSideEffectImports 选项

在 JavaScript 中，可能存在导入一个没有实际导入任何值的模块的场景：

```typescript
import "some-module";
```

这个导入通常称为副作用导入，因为它们提供的有用的行为只有执行一些副作用（比如注册一个全局变量，或者为一个原型 `prototype` 添加一个垫片）。

在 TypeScript 中，这个语法是一个怪癖：如果导入可以解析为一个有效的源文件的话， TypeScript 会加载和检查这个文件，相反，如果源文件无法被找到，那么 TypeScript 会静默地忽略这个导入 。

这是一个奇怪的行为，但它是部分来源于 JavaScript 生态系统中的建模模式。比如，这个语法会在捆绑器中用于特殊的加载器来加载 CSS 或其他资源。捆绑器可能会配置为一种你可以通过编写类似如下的代码来引入具体的 `.css` 文件的方式：

```typescript
import "./button-component.css";

export function Button() {
  // ...
}
```

这种方式仍然掩盖了副作用导入的潜在拼写错误。这也是为什么 TypeScript 5.6 引入了一个新的名为 `--noUncheckedSideEffectImports` 的编译选项来捕获这些情况。当开启 `--noUncheckedSideEffectImports` ， TypeScript 现在如果无法找到副作用导入的源文件的话将会报错。

```typescript
import "oops-this-module-does-not-exist";
//     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// error: Cannot find module 'oops-this-module-does-not-exist' or its corresponding type declarations.
```

当开启这个选项时，一些正常运行的代码可能现在就会得到一个错误，就如同上面提到的 CSS 的例子。为了解决这个问题，那些只需为资源编写副作用导入的用户可以通过通配符来编写一个范围模块声明，从而得到更好地体验。这个声明可以写在一个全局的文件，就如同下面代码所示：

```typescript
// ./src/globals.d.ts

// Recognize all CSS files as module imports.
declare module "*.css" {}
```

事实上，在你的项目里可能早已存在这样一个文件。比如，只需一些诸如 `vite init` 的命令会创建一个相似的 `vite-env.d.ts` 文件。

虽然这个选项在目前是默认关闭的，但我们鼓励用户去尝试使用它。

更多的信息，可以查看相关的[实现](https://github.com/microsoft/TypeScript/pull/58941)。

## --noCheck 选项

TypeScript 5.6 引入了一个新的编译选项 `--noCheck` ，它允许对所有的输入文件跳过类型。这避免了对生成文件进行必要的任何语义分析所带来的不必要的类型检查。

一种实现该功能的设想是从类型检查中分离 JavaScript 文件的生成过程，这样这两个过程就能单独的阶段执行。比如，当迭代代码的时候，你可以执行 `tsc --noCheck` ，接着执行 `tsc --noEmit` 来执行彻底地类型检查。你也可以并行地执行两个任务，即使是在 `--watch` 模式下，不过需要注意，如果你真的需要在同一时间执行话，你可能需要指定一个单独的 `--tsBuildInfoFile` 路径。

`--noCheck` 对以类似方式来生成声明文件的过程也很有用。在一个符合 `--isolatedDeclarations` 的项目上指定了 `--noCheck` ， TypeScript 可以在没有通过类型检查的情况下快速地生成声明文件。生成的声明文件纯粹地依赖于快速的语法转换。

注意在指定了 `--noCheck` 但是没有使用 `--isolatedDeclarations` 的情况下， TypeScript 会仍然执行尽可能多的必要的类型检查来生成 `.d.ts` 文件。从这个意义上说， `--noCheck` 更像是一个误称，然而，该过程比完整的类型检查更加惰性，只会计算未注解声明的类型。这个速度比一个全量的类型检查更快。

`noCheck` 也可以作为 TypeScript 的 API 的一个标准选项。在内部， `transpileModule` 和 `transpileDeclaration` 早已使用 `noCheck` 来加快处理速度（至少从 TypeScript 5.5 就是这样了）。现在任何的构建工具都应该可以利用这个选项，采取各种自定义策略来协调和加速构建过程。

更多的信息，查看 TypeScript 5.5 中内部启动的 noCheck 选项完成的[工作](https://github.com/microsoft/TypeScript/pull/58364)，以及使它可在命令行上公开访问的相关[工作](https://github.com/microsoft/TypeScript/pull/58839)。

## 允许 --build 过程中出现错误

TypeScript 中的项目引用的概念允许你将代码库组织成多个项目以及为每个项目创建依赖。执行带有 `--build` 模式的 TypeScript 编译器（简称 `tsc -b` ）是构建跨项目以及计算那些项目和文件需要编译的内置的实际执行方式。

先前，使用 `--build` 模式会假设开启 `--noEmitOnError` 选项，这样在遇到任何错误的时候会立即停止构建。这意味着如果任何“上游”的项目出现构建错误，那么“下游”项目将永远无法检查和构建。理论上，这是一个非常合理（ cromulent ，来自美国动画片《[辛普森一家](https://zh.wikipedia.org/wiki/%E8%BE%9B%E6%99%AE%E6%A3%AE%E4%B8%80%E5%AE%B6)》（The Simpsons），在剧中被刻意发明出来，意为“合适的”或“可接受的”，来自 ChatGPT 解释）的方法，如果一个项目出现错误，那么它的依赖不一定处在一致的状态。

现实中，这种有点死板的方式使得类似升级的过程变得痛苦。比如；如果项目 b 依赖了项目 a ，更熟悉项目 b 的人在他们的依赖升级之前无法主动地升级他们的代码。他们在第一步升级项目 A 就被阻碍了。

从 TypeScript 5.6 开始，即使在依赖的构建过程中出现错误 `--build` 模式会继续构建项目。在发现错误时，这些错误会被全部记录下来，然后尽最大努力输出文件，但是构建流程则会在特定的项目上继续完成。

如果你想要在项目一出错的情况下停止构建，你可以使用新的标志，名为 `--stopOnBuildErrors` 。这对在 CI 环境中执行的构建，或者迭代一个重依赖其他项目的项目来说很有帮助。

需要注意的是，为了实现这个功能， TypeScript 现在总是会为任何带有 `--build` （即使未指定 `--incremental` 或者 `--composite` ）的项目输出一个 `.tsbuildinfo` 文件。这是为了跟踪 `--build` 的调用情况以及接下来需要执行哪些工作的状态。

可以在这个 [PR](https://github.com/microsoft/TypeScript/pull/58838) 下阅读有关的变更。

## 编辑器中的区域优先诊断

当询问 TypeScript 的语言服务对一个文件的诊断（比如错误，建议，以及弃用）时，它通常需要检查整个文件。大部分情况下这很棒，但在极其巨大的文件下会造成延迟。这会令人沮丧因为修复一个拼写错误应该是一个快速的操作才对，但是在一个足够大的文件中却花费了数秒。

为了解决它， TypeScript 5.6 引入了一个新的特性，名为区域优先诊断（region-prioritized diagnostics）或者区域优先检查（ region-prioritized checking）。编辑器现在也可以提供给定文件的相关区域，而不是只请求诊断一组文件，这通常是用户当前文件的可见区域。 TypeScript 语言服务就可以选择提供两组诊断集：一种是对区域，另一种是对完整的文件。这允许编辑操作可以在大文件中更快地响应，这样你就不用等待那些红色错误消失了。

对于一些特定的成员，在我们的 [checker.ts](https://github.com/microsoft/TypeScript/blob/7319968e90600102892a79142fb804bcbe384160/src/compiler/checker.ts) 测试中，一个完全的语义诊断响应需要耗时 3300 毫秒。相比之下，基于区域响应的诊断的响应只需耗时 143 毫秒。虽然剩余的整个文件的响应花费了大约 3200 毫秒，但这对快速编辑来说已经是巨大的差距了。

这个特性也包含了相当一部分的工作，包括让整个诊断报告的使用体验更加一致。由于我们的类型检查器会利用缓存来避免额外工作的方式，同个类型间的连续的检查会有不同的（通常更短）错误信息。从技术上来说，即使是在这个特性之前，惰性的无序检查会造成程序在编辑器的两个位置报告不同的诊断，但我们不想加剧这个问题。随着最近工作的进行，我们已经解决了许多关于这些错误不一致性的问题。

目前，这个功能可以在 VSCode 中使用 TypeScript 5.6 之后的版本来获取。

更多细节的信息，请查看此 [PR](https://github.com/microsoft/TypeScript/pull/57842) 。

## 细粒度的提交字符

TypeScript 的语言服务现在为每个完成项提供它自身的提交字符。提交字符是具体的字符，当键入的时候，会自动完成当前建议的完成项。

这意味着随着时间推移当你键入某些字符时，你的编辑器现在会更加频繁地提交当前建议的完成项。比如，有如下的代码：

```typescript
declare let food: {
    eat(): any;
}

let f = (foo/**/
```

如果光标在 `/**/` 上，我们无法清楚地知道我们编写的代码是像 `let f = (food.eat())` 又或者是 `let f = (foo, bar) => foo + bar` 。你可以想象下编辑器能够根据我们接下来键入的字符来执行不同的自动完成。举个例子，如果我们键入了 `.` 字符，我们可能想要编辑器自动以变量 `food` 来完成，但如果我们键入的是 `,` 字符，我们可能是在编写一个箭头函数的参数。

不幸的是，先前 TypeScript 只是通知编辑器当前文本可能定义一个新的参数名称，以至于没有提交字符是安全的，所以输入一个 `.` 不会做任何事，即使这件事是“明显”的，即编辑器应该用 `food` 单词来进行自动完成。

TypeScript 现在会为每个完成项明确地列出哪些字符可以安全地提交。虽然这不会立即改变你的日常使用经验，但是支持这些提交字符地编辑器可以随着时间的推移看到行为上的改进。为了马上观察到这些改进，你可以在 VSCode [预览版](https://code.visualstudio.com/insiders/)中使用 TypeScript 的 [nightly](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next) 扩展。在上述代码中输入一个 `.` 就会以 `food` 进行自动完成了。

更多的信息，查看这个添加了提交字符的 [PR](https://github.com/microsoft/TypeScript/pull/59339) ，以及根据上下文来对提交字符进行调整的 [PR](https://github.com/microsoft/TypeScript/pull/59523) 。

## 自动导入的排除规则

TypeScript 的语言服务现在允许指定一个正则列表来过滤掉某些说明符的自动导入建议。比如，如果你想要排除一个包的所有“深”导入，比如 `lodash` ，你可以 VSCode 中配置如下的偏好：

```json
{
  "typescript.preferences.autoImportSpecifierExcludeRegexes": [
    "^lodash/.*$"
  ]
}
```

或者另一种情况，你想要禁止从包入口进行导入：

```json
{
  "typescript.preferences.autoImportSpecifierExcludeRegexes": [
    "^lodash$"
  ]
}
```

使用如下的设置可以避免 `node:` 导入：

```json
{
  "typescript.preferences.autoImportSpecifierExcludeRegexes": [
    "^node:"
  ]
}
```

为了指定某些正则的标志位，比如 `i` 或者 `u` ，你需要用斜杠包住正则表达式。当使用斜杠包住后，你需要转义其他内部的斜杠：

```json
{
  "typescript.preferences.autoImportSpecifierExcludeRegexes": [
    "^./lib/internal",        // 无需转义
    "/^.\\/lib\\/internal/",  // 需要转义 - 注意开头和结尾的斜杠
    "/^.\\/lib\\/internal/i"  // 需要转义 - 我们需要斜杠从而指定 i 标志
  ]
}
```

可以为 JavaScript 配置同样的设置，即 `javascript.preferences.autoImportSpecifierExcludeRegexes` 。

注意这个选项可能与 `typescript.preferences.autoImportFileExcludePatterns` 会有一些重叠，但它们之间是存在差异。对于已经存在的 `autoImportFileExcludePatterns` ，它会接收一个 glob 规则的列表来排除文件路径。这可能对一些场景来说更加简单，比如你想要避免具体文件或文件夹的自动导入，但这种程度远远不够。比如，如果你使用 `@types/node` 包，这个包中同一个文件声明了 `fs` 和 `node:fs` ，所以我们无法使用 `autoImportExcludePatterns` 来过滤掉其中的一个。

新的 `autoImportSpecifierExcludeRegexes` 配置是具体于模块说明符的（即我们编写的导入语句的具体的字符串），所以我们可以编写一个规则来排除 `fs` 或者 `node:fs` 而不排除另外一个。更重要的是，我们可以编写规则来强制自动导入使用不同的说明符样式（比如使用 `./foo/bar.js` 而不是 `#foo/bar.js` ）。

更多的信息，可以查看这个 [PR](https://github.com/microsoft/TypeScript/pull/59543) 。

## 需要注意的行为变更

### lib.d.ts 

详情请查看[此处](https://github.com/microsoft/TypeScript/issues/58764)。

### 总是生成 .tsbuildinfo 文件

即使构建依赖过程存在错误，开启 `--build` 情况下也能够继续构建项目，为了在命令行种支持 `--noCheck` ， TypeScript 现在总是会为任何在 `--build` 下执行的项目生成一个 `.tsbuildinfo` 文件。无论 `--incremental` 是否打开都会执行这种情况。可以在此 [PR](https://github.com/microsoft/TypeScript/pull/58626) 查看相关信息。

### 尊重 node_modules 中的文件扩展名和 package.json 文件 

在 Node.js 支持 ECMAScript 模块的 v12 版本之前，对 TypeScript 来说从没有一种方式来知道在 `node_modules` 中找到的 `.d.ts` 文件对应的 JavaScript 文件是否是以 CommonJS 或者 ECMAScript 模块编写的。当绝大多数的 npm 包只使用 CommonJS 时，这问题不大，如果 TypeScript 对该文件发出疑问， 那么就只会假设所有内容的行为都是 CommonJS 。不幸的是，如果这个假设是错的那么会允许不安全的导入：

```typescript
Copy
// node_modules/dep/index.d.ts
export declare function doSomething(): void;

// index.ts
// 如果 dep 是 CommonJS 模块则 OK 
// 如果 dep 是 ECMAScript 模块则不 OK ，即使是在捆绑器中
import dep from "dep";
dep.doSomething();
```

在实践中，这不会频繁地出现。但是这些年随着 Node.js 开始支持 ECMAScript 模块， npm 上共享的 ESM 包的数量开始增长。幸运地是， Node.js 也引入了机制来帮助 TypeScript 区分一个文件是 ECMAScript 模块还是 CommonJS 模块，也就是 `.mjs` 和 `.cjs` 文件扩展名，以及 package.json 中的 `type` 字段。 TypeScript 4.7 添加了对这些标志的支持，同样也包括 `.mts` 和 `.cts` 文件。然而， TypeScript 只能在 `--module node16` 和 `--module nodenext` 下才能读取到这些标志，所以上面例子中不安全的导入对任何使用 `--module esnext` 和 `--moduleResolution bundler` 来说仍然是一个问题。

为了解决它， TypeScript 5.6 收集了模块的格式信息，用这些信息来解决诸如上面例子提到的所有 `module` 模式带来的歧义（除去 `amd` 、 `umd` 和 `system` ）。特定格式的文件扩展（ `.mts` 和 `.cts` ） 在任何地方都能被良好地解析， `node_modules` 内的依赖的 packages.json 的 `type` 字段也会被考虑到，无论 `module` 是否设置。先前，从技术上说可以将 CommonJS 输出生成到 `.mjs` 文件中，反之亦然。

```typescript
// main.mts
export default "oops";

// $ tsc --module commonjs main.mts
// main.mjs
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = "oops";
```

现在， `.mts` 文件就不会输出为 CommonJS 了，同样 `.cts` 文件也不会输出为 ESM 了。

注意 TypeScript 5.5 的预发行版本提供了大部分的行为（此 [PR](https://github.com/microsoft/TypeScript/pull/57896) 查看更多实现细节），但在 5.6 这个行为只会对 `node_modules` 生效。

更多细节查看此 [PR](https://github.com/microsoft/TypeScript/pull/58825) 。

### 计算属性上正确的 override 检查

先前，标记了 `override` 的计算属性不会正确地检查基类成员的存在性。同样，如果你使用 `noImplicitOverride` ，并且忘记对一个计算属性添加一个 `override` 修饰符，那么程序不会报错。

TypeScript 5.6 现在会正确地检查计算属性的这两种情况。

```typescript
const foo = Symbol("foo");
const bar = Symbol("bar");

class Base {
  [bar]() {}
}

class Derived extends Base {
    override [foo]() {}
//           ~~~~~
// error: This member cannot have an 'override' modifier because it is not declared in the base class 'Base'.

    [bar]() {}
//  ~~~~~
// error under noImplicitOverride: This member must have an 'override' modifier because it overrides a member in the base class 'Base'.
}
```

感谢 [Oleksandr Tarasiuk](https://github.com/a-tarasyuk) 修复了这个问题，相关的 [PR](https://github.com/microsoft/TypeScript/pull/57146) 。