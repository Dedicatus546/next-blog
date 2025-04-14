---
title: TypeScript 5.5（译）
tags:
  - TypeScript
  - JavaScript
categories:
  - 翻译
key: 1721352600
date: 2024-07-19 09:30:00
updated: 2024-08-05 15:41:10
---


# 前言

原文地址：[Announcing TypeScript 5.5](https://devblogs.microsoft.com/typescript/announcing-typescript-5-5/)

<!-- more -->

# 正文

以下是 TypeScript 5.5 新增的功能列表！

## 推断类型谓词

TypeScript 的控制流分析可以很好的追踪变量在代码流程中的类型：

```typescript
interface Bird {
    commonName: string;
    scientificName: string;
    sing(): void;
}

// country names -> national bird.
// 并不是所有的国家都有国鸟（说的就是你，加拿大）
declare const nationalBirds: Map<string, Bird>;

function makeNationalBirdCall(country: string) {
  const bird = nationalBirds.get(country);  // bird 的类型为 Bird | undefined
  if (bird) {
    bird.sing();  // 在这个 if 内 bird 的类型为 Bird
  } else {
    // 而在这里 bird 为 undefined
  }
}
```

TypeScript 通过让你处理 `undefined` 的情况，来使你的代码更加的健壮。

然而在过去，这种类型细化很难应用到数组上。对于先前版本的 TypeScript 会抛出一个错误：

```typescript
function makeBirdCalls(countries: string[]) {
  // birds: (Bird | undefined)[]
  const birds = countries
    .map(country => nationalBirds.get(country))
    .filter(bird => bird !== undefined);

  for (const bird of birds) {
    bird.sing();  // 报错，这里 bird 可能为 undefined 。
  }
}
```

这段代码完美的很，我们已经把所有的 `undefined` 的值从列表中过滤出去了，但是 TypeScript 却无法识别到它。

而在 TypeScript 5.5 中，类型检查器就能很好地检查这段代码。

```typescript
function makeBirdCalls(countries: string[]) {
  // birds: Bird[]
  const birds = countries
    .map(country => nationalBirds.get(country))
    .filter(bird => bird !== undefined);

  for (const bird of birds) {
    bird.sing();  // 通过
  }
}
```

这里 `bird` 的类型更加精确。

能够正常工作的原因是 TypeScript 现在会将 `filter` 函数推断为一个类型谓词。通过将其抽成一个独立的函数可以更好地理解其中的原理。

```typescript
// function isBirdReal(bird: Bird | undefined): bird is Bird
function isBirdReal(bird: Bird | undefined) {
  return bird !== undefined;
}
```

`bird is Bird` 是一个类型谓词。这意味着如果函数返回 `true` ，那么传入的 `bird` 的类型就是 `Bird` （如果函数返回 `false` 那么 `bird` 就是 `undefined`） 。 `Array.prototype.filter` 的类型定义能够理解类型谓词，所以最终的结果就是你可以得到一个更加精确的类型，代码也能通过代码检查器的检查。

TypeScript 会在下面条件成立的时候将一个函数推断为类型谓词：

- 函数没有显式声明返回的类型或者类型谓词注释。
- 函数只有一个返回语句，没有隐式的返回。
- 函数没有修改入参。
- 函数返回一个用于细化入参类型的 `boolean` 表达式。

一般来说，这种推断会按照预期工作，比如如下的一些例子：

```typescript
// const isNumber: (x: unknown) => x is number
const isNumber = (x: unknown) => typeof x === 'number';

// const isNonNullish: <T>(x: T) => x is NonNullable<T>
const isNonNullish = <T,>(x: T) => x != null;
```

先前， TypeScript 只会推断这些函数返回了 `boolean` 。现在则会推断带有类型谓词的签名，比如 `x is number` 或者 `x is NonNullable<T>` 。

类型谓词有着“当且仅当”的语义，如果一个函数的返回为 `x is T` ，这意味着：

- 如果函数返回 `true` ，那么 `x` 的类型为 `T` 。
- 如果函数返回 `false`， 那么 `x` 的类型不为 `T` 。

如果你期望 TypeScript 为某个函数生成一个类型谓词而实际上却没有的时候，原因可能是违反了第二条规则，这很多时候是“真实性”检查所带来的。

```typescript
function getClassroomAverage(students: string[], allScores: Map<string, number>) {
  const studentScores = students
    .map(student => allScores.get(student))
    .filter(score => !!score);

  return studentScores.reduce((a, b) => a + b) / studentScores.length;
  //     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // 错误: 对象可能为 undefined 。
}
```

TypeScript 没有将 `score => !!score` 推断为一个类型谓词，确实如此，原因是：如果返回 `true` ，那么 `score` 的类型为 `number` ，但如果返回 `false` ，`score` 的类型可能为 `undefined` 或者数字 `0` 。毫无疑问这是一个 bug ，如果某些学生的测试成绩为 0 ，则这些学生会被过滤出去，进而导致计算的平均值变大。超过平均分的人少了，伤心的人就多了😭。

如同第一个例子一样，最好还是显式地过滤掉 `undefined` 的值。

```typescript
function getClassroomAverage(students: string[], allScores: Map<string, number>) {
  const studentScores = students
    .map(student => allScores.get(student))
    .filter(score => score !== undefined);

  return studentScores.reduce((a, b) => a + b) / studentScores.length;  // 通过
}
```

真实性检查对对象类型而言会推断为类型谓词，因为它们不存在歧义。请牢记函数必须返回一个 `boolean` 类型才可能推断为类型谓词， `x => !!x` 可能会推断为一个类型谓词，但 `x => x` 绝不会。

显式的类型谓词会照常工作。TypeScript 不会检查它是否会推断为相同的类型谓词。显式的类型谓词（“is”）并不比类型断言（“as”）安全。

如果 Typescript 推断了一个比你理解的更加精确的类型，那么这个特性可能会破坏原有的代码。

```typescript
// 先前, nums: (number | null)[]
// 现在, nums: number[]
const nums = [1, 2, 3, null, 5].filter(x => x !== null);

nums.push(null);  // 在 TS 5.4 中通过, 在 TS 5.5 中报错
```

使用一个显式的类型注解来告诉 TypeScript 真正的类型就可以修复这个问题：

```typescript
const nums: (number | null)[] = [1, 2, 3, null, 5].filter(x => x !== null);
nums.push(null);  // 在所有版本中都通过。
```

## 使用常量索引会进行控制流收缩

TypeScript 现在能够收缩形如 `obj[key]` 的表达式，只要 `obj` 和 `key` 是事实上的常量。

```typescript
function f1(obj: Record<string, unknown>, key: string) {
    if (typeof obj[key] === "string") {
        // 现在可以，先前会报错
        obj[key].toUpperCase();
    }
}
```

上面的例子中， `obj` 和 `key` 都是不曾改变的，所以 TypeScript 在 `typeof` 检查后能够收缩 `obj[key]` 的类型为 `string` 。

## JSDOC 新增 @import 标签

现在如果你想要在 JavaScript 文件中导入某些只用于类型检查的东西时，会很麻烦。 JavaScript 开发者无法简单地导入一个名为 `SomeType` 的类型，而这个类型在运行时中不存在。

```typescript
// ./some-module.d.ts
export interface SomeType {
    // ...
}

// ./index.js
import { SomeType } from "./some-module"; // 运行时错误

/**
 * @param {SomeType} myValue
 */
function doSomething(myValue) {
    // ...
}
```

`SomeType` 不会出现在运行时中，所以导入语句会报错。开发者可以改为使用命名空间导入。

```javascript
import * as someModule from "./some-module";

/**
 * @param {someModule.SomeType} myValue
 */
function doSomething(myValue) {
    // ...
}
```

但 `./some-module` 仍会在运行时被导入，这也是不理想的。

为了避免这种情况，开发者通常不得不在 JSDoc 注释中使用 `import(...)` 类型。

```javascript
/**
 * @param {import("./some-module").SomeType} myValue
 */
function doSomething(myValue) {
    // ...
}
```

如果你想要在多出地方复用相同的类型，你可以使用 `typedef` 来避免重复的导入。

```javascript
/**
 * @typedef {import("./some-module").SomeType} SomeType
 */

/**
 * @param {SomeType} myValue
 */
function doSomething(myValue) {
    // ...
}
```

这对于 `SomeType` 的使用有帮助，但会导致大量重复的导入，而且有点冗长。

这也是为什么 TypeScript 现在支持一个新的注释标签 `@import` ，它和 ECMAScript 的导入有相同的语法。

```javascript
/** @import { SomeType } from "some-module" */

/**
 * @param {SomeType} myValue
 */
function doSomething(myValue) {
    // ...
}
```

这里我们使用了命名导入，我们也可以将导入语句改为使用命名空间导入。

```javascript
/** @import * as someModule from "some-module" */

/**
 * @param {someModule.SomeType} myValue
 */
function doSomething(myValue) {
    // ...
}
```

由于这些语句只是 JSDoc 注释，所以它们完全不会影响运行时的行为。

## 正则表达式支持语法检查

直到现在， TypeScript 通常会跳过代码中大多数正则表达式。这是因为正则表达式在技术上具有可扩展的语法，而 TypeScript 从未将正则表达式编译为早期版本的 JavaScript 。所以，这意味着许多在正则表达式中常见的问题不会被发现，它们要么在运行时报错，要么则会静默失败。

但是 TypeScript 现在可以对正则表达式做一些基础的语法检查了。

```typescript
let myRegex = /@robot(\s+(please|immediately)))? do some task/;
//                                            ~
// 错误!
// Unexpected ')'. Did you mean to escape it with backslash?
```

这是一个简单的例子，但是 TypeScript 的检查能捕获许多常见的错误。实际上， TypeScript 的检查稍微超出了语法检查的范围。比如， TypeScript 现在可以捕获不存在的反向引用的问题。

```typescript
let myRegex = /@typedef \{import\((.+)\)\.([a-zA-Z_]+)\} \3/u;
//                                                        ~
// error!
// This backreference refers to a group that does not exist.
// There are only 2 capturing groups in this regular expression.
```

对具名捕获组也有相同的检查。

```typescript
let myRegex = /@typedef \{import\((?<importPath>.+)\)\.(?<importedEntity>[a-zA-Z_]+)\} \k<namedImport>/;
//                                                                                        ~~~~~~~~~~~
// error!
// There is no capturing group named 'namedImport' in this regular expression.
```

TypeScript 检查现在也能够意识到使用了某些比你设定的目标 ECMAScript 版本高的正则特性。比如，如果我们在 ES5 的目标中使用如上例子的具名捕获组特性，那么则会报错。

```typescript
let myRegex = /@typedef \{import\((?<importPath>.+)\)\.(?<importedEntity>[a-zA-Z_]+)\} \k<importedEntity>/;
//                                  ~~~~~~~~~~~~         ~~~~~~~~~~~~~~~~
// error!
// Named capturing groups are only available when targeting 'ES2018' or later.
```

对于正则表达式的标志也是如此。

请注意 TypeScript 的正则表达式检查仅支持正则表达式字面量。如果你通过调用 `new RegExp` 传入一个字符串字面量来生成正则， TypeScript 则不会检查这些传入的字符串。

## 支持新的 ECMAScript 为 Set 添加的方法

TypeScript 5.5 定义了 ECMAScript 中提议的 `Set` 的[新方法](https://github.com/tc39/proposal-set-methods)的类型。

这些方法中比如 `union` ， `intersection` ， `difference` 以及 `symmetricDifference` ，接受另一个的 Set 然后返回一个新的 Set 作为结果。其他的方法，比如 `isSubsetOf`， `isSupersetOf` 和 `isDisjointFrom` ，接受另一个 Set 然后返回一个 `boolean` 。所有的方法都不会修改自身。

下面是一个快速的例子，展示了如何使用这些方法以及它们的行为：

```typescript
let fruits = new Set(["apples", "bananas", "pears", "oranges"]);
let applesAndBananas = new Set(["apples", "bananas"]);
let applesAndOranges = new Set(["apples", "oranges"]);
let oranges = new Set(["oranges"]);
let emptySet = new Set();

////
// union 并集
////

// Set(4) {'apples', 'bananas', 'pears', 'oranges'}
console.log(fruits.union(oranges));

// Set(3) {'apples', 'bananas', 'oranges'}
console.log(applesAndBananas.union(oranges));

////
// intersection 交集
////

// Set(2) {'apples', 'bananas'}
console.log(fruits.intersection(applesAndBananas));

// Set(0) {}
console.log(applesAndBananas.intersection(oranges));

// Set(1) {'apples'}
console.log(applesAndBananas.intersection(applesAndOranges));

////
// difference 差集
////

// Set(3) {'apples', 'bananas', 'pears'}
console.log(fruits.difference(oranges));

// Set(2) {'pears', 'oranges'}
console.log(fruits.difference(applesAndBananas));

// Set(1) {'bananas'}
console.log(applesAndBananas.difference(applesAndOranges));

////
// symmetricDifference 余集
////

// Set(2) {'bananas', 'oranges'}
console.log(applesAndBananas.symmetricDifference(applesAndOranges)); // no apples

////
// isDisjointFrom 是否相交
////

// true
console.log(applesAndBananas.isDisjointFrom(oranges));

// false
console.log(applesAndBananas.isDisjointFrom(applesAndOranges));

// true
console.log(fruits.isDisjointFrom(emptySet));

// true
console.log(emptySet.isDisjointFrom(emptySet));

////
// isSubsetOf 是否为子集
////

// true
console.log(applesAndBananas.isSubsetOf(fruits));

// false
console.log(fruits.isSubsetOf(applesAndBananas));

// false
console.log(applesAndBananas.isSubsetOf(oranges));

// true
console.log(fruits.isSubsetOf(fruits));

// true
console.log(emptySet.isSubsetOf(fruits));

////
// isSupersetOf 是否为超集
////

// true
console.log(fruits.isSupersetOf(applesAndBananas));

// false
console.log(applesAndBananas.isSupersetOf(fruits));

// false
console.log(applesAndBananas.isSupersetOf(oranges));

// true
console.log(fruits.isSupersetOf(fruits));

// false
console.log(emptySet.isSupersetOf(fruits));
```

## 隔离的声明

声明文件（又名 `.d.ts` 文件）描述了存在库的和模块的 TypeScript 的形状。轻量的描述包括库的类型签名，排除了细节的实现，比如函数体。它们的发布是为了让 TypeScript 可以有效地检查您对库的使用情况，而不需要分析库本身。尽管可以手写声明文件，但如果你正在编写带有类型的代码，那么让使用 `-declaration` 标志让 TypeScript 从源文件自动生成它们会更安全，更简单。

TypeScript 编译器和它的接口总是负责生成声明文件，然而，某些情况下你可能想使用其他的工具，因为传统的构建流程无法扩展。

### 用例：更快的声明生成工具

想象一下如果你想要创建一个更快速的工具来生成声明文件，它可能作为发布服务和新的捆绑程序的一部分。尽管存在一个可以快速将 TypeScript 转为 JavaScript 的工具的蓬勃的生态系统，但是将 Typescript 转为声明文件却不是如此，原因是 TypeScript 的推理允许我们在不显式声明类型的情况下编写代码，这意味着声明的导出可能会很复杂。

考虑一个简单的例子，一个将导入的两个变量相加的函数。

```typescript
// util.ts
export let one = "1";
export let two = "2";

// add.ts
import { one, two } from "./util";
export function add() { return one + two; }
```

尽管我们想做的唯一的事情是生成 `add.d.ts` ，但是 TypeScript 需要读取另外导入的文件（ `util.ts` ） ，然后推断 `one` 和 `two` 的类型为字符串，接着计算连个字符串通过 `+` 操作符连接，即确定返回类型为 `string` 。

```typescript
// add.d.ts
export declare function add(): string;
```

虽然这种推理对开发者体验很重要，但者意味着生成声明文件的工具需要去复制类型检查其的部分内容，包括推理以及解析模块说明符来遵循导入的能力。

### 用例：并行生成声明以及并行检查

想象一下你有一个 monorepo 仓库，这个仓库包含了很多的项目，同时你有一个多核的 cpu ，你希望它可以帮你更快地检查代码。如果我们可以在同一时间通过在不同的核心上检查不同的项目，这很棒不是吗？

不幸的是我们无法自由地并行处理这些工作。原因是我们必须以依赖顺序来构建这些项目，因为每个项目都会检查它所依赖的声明文件。所以我们必须在第一时间构建这些依赖，生成声明文件。 TypeScript 项目引用特性以相同的方式工作，通过拓扑依赖顺序构建项目集。

举个例子，如果我们有两个项目，它们分别是 backend 和 frontend ，它们两个都引用了一个名为 core 的项目，直到 core 构建并已经生成相应的声明文件之后， TypeScript 才能开始检查 frontend 和 backend 的类型。

![](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2024/04/5-5-beta-isolated-declarations-deps.png)

在上述的“图”中，你可以发现存在一个瓶颈，虽然我们可以并行构建 frontend 和 backend ，但是在这这两者开始之前，我们首先得等待 core 完成构建。

我们应该如何改进上面的情况？如果有一个能快速地并行地为 core 生成这些声明文件的工具， TypeScript 就可以立马并行地检查 core ， frontend 和 backend 。

### 解决方法：显式类型

这些用例的共同要求是我们需要一个跨文件的类型检查器来生成声明文件。这对工具社区来说有很多的要求。

一个更复杂的例子是，如果我们想要为下面的代码生成一个声明文件...

```typescript
import { add } from "./add";

const x = add();

export function foo() {
    return x;
}
```

我们需要为 `foo` 生成一个签名，也就是需要查找 `foo` 的实现。 `foo` 只是返回了 `x` ，所以为了得到 `x` 的类型，需要查找 `add` 的实现，但是这可能需要查找 `add` 依赖项的实现等等。我们面对的是问题是，生成声明文件需要大量的逻辑来找出不同位置的类型，这些位置甚至可能不在本地。

尽管如此，对于那些寻求快速迭代以及完全并行构建的开发者来说，有另一种方式来思考这个问题。一个声明文件只需要模块公共 API 的类型，换句话讲也就是它导出东西的类型。有争议的是，如果开发者愿意显式地写出导出东西的类型的话，工具就可以在不需要查找模块的实现以及无需重新实现一个完整的类型检查器的条件下生成声明文件。

所以我们引入了 `--isolatedDeclarations` 选项。当一个模块在没有类型检查器的情况下无法可靠地转换的话 `--isolatedDeclarations` 就会报错。更通俗易懂地讲，如果你有一个没有对其导出充分注释的文件，那么 TypeScript 就会报错。

对于上面的例子这意味着我们会见到如下的错误：

```typescript
export function foo() {
//              ~~~
// error! Function must have an explicit
// return type annotation with --isolatedDeclarations.
    return x;
}
```

### 为什么需要错误？

原因是这意味着 TypeScript 可以

1. 提前告诉我们其他工具在生成声明文件时是否会出现问题。
2. 提供了一种快速修复的方式来帮助我们添加丢失的注释。

这个模式不要求在任何地方添加注释。对于非导出部分来说，它可以被忽略，因为它不会影响公共的 API 。比如，下面的代码不会报错：

```typescript
import { add } from "./add";

const x = add("1", "2"); // no error on 'x', it's not exported.

export function foo(): string {
    return x;
}
```

某些可以简单推断类型的表达式也不会报错：

```typescript
// No error on 'x'.
// It's trivial to calculate the type is 'number'
export let x = 10;

// No error on 'y'.
// We can get the type from the return expression.
export function y() {
    return 20;
}

// No error on 'z'.
// The type assertion makes it clear what the type is.
export function z() {
    return Math.max(x, y()) as number;
}
```

### 使用 isolatedDeclarations 

`isolatedDeclarations` 需要同时开启 `declaration` 或者 `composite` 标志。

注意 `isolatedDeclarations` 不会改变 TypeScript 的执行生成的行为，只是改变报错的行为。重要的是，与 `isolatedModules` 相似，在 TypeScript 中开启这个特性不会立即感受到这里讨论的优势。所以请保持耐心，期待在这个方面未来的发展。工具作者要牢记，我们也应该认识到在今天，不是所有的 TypeScript 声明生成文件可以被其他想要使用它作为指南的工具所复制。这就是我们正在积极努力改进的事情。

除此之外，独立的声明仍然是一个新特性，我们正在积极地改善用户体验。诸如在类中使用计算属性声明和对象字面量的场景，在 `isolatedDeclarations` 下将不再被支持。请密切关注，并随时向我们反馈。

我们还认为，应该根据具体情况来采用 `isolatedDeclarations` 。当使用 `isolatedDeclarations` ，可能会破坏开发过程中的人体工程学。因此，如果你没有覆盖到前面提到的两种场景，那么使用它可能就是错误的。另一方面， `isolatedDeclarations` 的作用已经发现了许多的优化和机会来解锁不同的并行构建策略。同时，如果你希望对此做出权衡，随着外部的工具变得越广泛可用，我们相信 isolatedDeclarations 可以成为强大的工具来加速你的构建过程。


## 配置文件中 ${configDir} 模板变量

在很多的代码库中重用一个共享的 tsconfig.json 文件是很常见的。这个文件作为其他文件的“基础”。这可以通过在 tsconfig.json 中的 `extends` 字段来实现。

```json
{
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
        "outDir": "./dist"
    }
}
```

其中一个问题是 tsconfig.json 文件中的所用路径都是相对于本身文件所处的位置。这意味着如果你有一个共享的 tsconfig.base.json 文件，这个文件用在多个项目中，相对路径在派生的项目中没有用处。例如，想象一下如下的 tsconfig.base.json 文件：

```json
{
    "compilerOptions": {
        "typeRoots": [
            "./node_modules/@types",
            "./custom-types"
        ],
        "outDir": "dist"
    }
}
```

如果作者的意图是要让每个 tsconfig.json 都继承这个文件，那么应该：

1. 输出到相对于派生的 tsconfig.json 的 dist 目录，以及
2. 有一个相对于派生的 tsconfig.json 的 custom-types 目录

这不会正常工作。 `typeRoots` 路径会相对于共享 tsconfig.base.json 文件的位置，而不是项目的位置来继承它。每个继承了共享文件的项目需要定义它自己的并且是相同的 `outDir` 和 `typeRoots` 。这令人懊恼，很难在项目间进行同步，虽然上面的例子使用 `typeRoots` ，但这对于 `paths` 和其他的属性来说都是常见的问题。

为了解决这个问题， TypeScript 5.5 引进了一个新的模板变量 `${configDir}` 。当在 tsconfig.json 或者 jsconfig.json 中的某些路径字段使用 `${configDir}` 时，这个变量会被替换对应编译中配置文件的目录。这以为这上面的 tsconfig.base.json 会被重写为：

```json
{
    "compilerOptions": {
        "typeRoots": [
            "${configDir}/node_modules/@types"
            "${configDir}/custom-types"
        ],
        "outDir": "${configDir}/dist"
    }
}
```

现在，当一个项目继承了这个文件，路径会被相对于派生的 tsconfig.json 文件，而不是共享的 tsconfig.base.json 文件。这使得在项目间共享配置文件和确保配置文件更轻便变得简单。

如果你想要生成一个可继承的 tsconfig.json 文件，可以考虑把 `./` 替换为 `${configDir}` 。

## 查询 package.json 的依赖来生成声明文件

先前， TypeScript 会经常报如下的错误：

```text
The inferred type of "X" cannot be named without a reference to "Y". This is likely not portable. A type annotation is necessary.
```

通常情况下这是由于 TypeScript 生成声明文件后发现自身位于从未在程序中显式导入的文件内容中。如果路径最终是相对的，那么对这样的文件生成一个导入可能是有风险的。尽管如此，对于在代码库中的 package.json 中 `dependencies` 字段显式声明的依赖（或者是 `peerDependencies` 以及 `optionalDependencies` ），在某些解析模式下生成这样一个导入会是安全的。所以在 TypeScript 5.5 中，我们更加放宽这种情况，所以许多错误的事件就不会出现了。

## 提升编辑器和 watch 模式可靠性

TypeScript 添加了一些新的功能或者说是修复了现有的一些逻辑，使得 `--watch` 模式下 TypeScript 编辑器集成更加可靠。这有望减少 TSServer 或者编辑器的重启次数。

### 正确地为编辑器刷新配置文件产生的错误

TypeScript 可以为 tsconfig.json 生成错误，然而，这些错误实际上是在加载项目时生成的，编辑器通常不会直接地为 tsconfig.json 文件请求这些错误。虽然这听起来像是一个技术细节，但这意味着当 tsconfig.json 的文件中所有发生的错误被修复时， TypeScript 不会发出一个空的错误集合，用户会持有旧的错误记录，除非他们重启编辑器。

TypeScript 5.5 现在会有意地发出事件来清除这些旧的错误。

### 更好地处理删除后的立即写入

一些工作会选择去删除文件然后从头创建新的文件，而不是重写它们，比如执行 `npm ci` 命令。

对这些工具来说虽然很高效，但是对 TypeScript 编辑器场景来说可能会存在问题，因为对一个文件移除监视可能会处置它自身以及相关的依赖。快速连续地删除然后创建文件可能会导致 TypeScript 销毁整个项目然后从头重新构建它。

TypeScript 5.5 现在会有一种更加细致的方法，通过保留已删除项目的部分内容，直到接受到新的创建事件发出。这应该能让诸如 `npm ci` 的操作在能更好地在 TypeScript 中工作。

### 解析失败保持对符号链接的追踪

当 TypeScript 无法解析一个模块的时候，它仍然会对任何失败的查找路径进行监视，以防之后有模块被添加进来。之前这对符号链接目录不生效，因为当在一个项目中构建而另一个项目不知情时，在它可能会在类似 monorepo 的场景中产生可靠性问题。这应该在 TypeScript 5.5 中被修复，意味着你不需要频繁地重启你的编辑器。

### 项目引用有助于自动导入功能

在项目参考设置中，自动导入不再需要对依赖项目进行至少一次明确地导入。相反，自动导入完成应该只在 tsconfig.json 中 `references` 字段列出的所有内容生效。

## 性能大小优化

### 单态化语言服务和公共 API 中的对象

在 TypeScript 5.0 中，我们确保 [Node](https://github.com/microsoft/TypeScript/pull/51682) 和 [Symbol](https://github.com/microsoft/TypeScript/pull/51880) 对象具有一组一致的属性以及一致的初始化顺序。这样做可以减少不同操作中的多态性，以便允许运行时更快地获取属性。

通过这个变更，我们见证了编译器令人赞叹的速度。然而，这些变更中的许多部分是在数据结构的内部的分配器上执行的。语言服务，以及 TypeScript 的公共 API ，为某些对象使用了不同的分配器，这让 TypeScript 编译器更加轻量，因为仅为语言服务的数据永远不会被编译器使用。

在 TypeScript 5.5 中，相同的单态化工作会由语言服务和公共 API 完成。这意味着你的编辑经验，以及任何使用 TypeScript API 的构建工具，会明显地变快。事实上，在我们的基准测试中，对于构建过程，当使用公共的 TypeScript API 分配器时，我们观察到了 5-8% 的速度提升，语言服务操作也获得了 10-20% 的速度提升。虽然这确实意味着内存的升高，但我们相信这个权衡是值得的，我们希望寻找到减少内存开销的方法。

### 单态化控制流节点

在 TypesScript 5.5 中， 控制流图的节点单态化以便它们可以保持一致的形状。这么做后，检查时间通常情况下会减少 1% 。

### 控制流图优化

在许多情况下，控制流分析会遍历那些不提供任何新信息的节点。我们观察到在某些节点的来路（或者说持有者）缺少任何提前中止或者影响的情况，这意味着这些节点总是可以被跳过。就如同上面所讲的一样， TypeScript 现在通过为控制流分析链接一个早期的没有提供有用信息的节点来构建控制流图，从而从中获得好处。这会产生一个更扁平的控制流图，遍历起来更加高效。这个优化产生了一定的好处，某些代码库的构建时间最多可以减少 2% 。

### 跳过 transpileModule 和 transpileDeclaration 的检查

TypeScript 的 `transpileModule` API 可以用来编译一个单独的 TypeScript 文件内容到 JavaScript 。相似地， `transpileDeclaration` API 可以用来从一个单独 TypeScript 文件生成一个声明文件。这些 API 的问题之一是在生成输出内容之前 TypeScript 内部会对文件的整个内容执行一个完整的类型检查。这对于收集某些接下来生成阶段使用的信息来说是有必要的。

在 TypeScript 5.5 中，我们发现了一种避免执行完整检查的方式，只需懒惰地收集某些必要的信息即可。 `transpileModule` 和 `transpileDeclaration` 都默认启用此功能。因此，与这些 API 集成的工具，比如使用了 `transpileOnly` 的 ts-loader 和 ts-jest ，可以观察到明显的速度提升。在我们的[测试](https://github.com/microsoft/TypeScript/pull/58364#issuecomment-2138580690)中，使用 `transpileModule` 的构建时间通常可以有两倍的速度提升。

### 减少 TypeScript 包大小

5.0 时 TypeScript 开始过渡到[模块化](https://devblogs.microsoft.com/typescript/typescripts-migration-to-modules/)。[通过让 tsserver.js 和 typingsInstaller.js 从一个公共的 API 库中导入而不是拥有各自独立的捆绑](https://github.com/microsoft/TypeScript/pull/55326)，我们已经显著减少了 TypeScript 总包的大小。

这让 TypeScript 在磁盘上的大小从 30.2 MB 减少到 20.4 MB 。打包后的大小从 5.5 MB 减少到 3.7 MB 。

### 声明生成中重用节点

作为启用 `isolatedDeclarations` 工作的一部分，我们实质上提升了当生成声明文件时 TypeScript 直接复制输入源代码的频率。比如，假设你写了如下代码：

```typescript
export const strBool: string | boolean = "hello";
export const boolStr: boolean | string = "world";
```

注意这两个联合类型是等效的，但是联合的顺序不同。当生成声明文件时， TypeScript 会有两种等效的输出可能性。

第一种是为每个类型提供一致的规范表示：

```typescript
export const strBool: string | boolean;
export const boolStr: string | boolean;
```

第二种是重用实际编写的类型注释：

```typescript
export const strBool: string | boolean;
export const boolStr: boolean | string;
```

第二种方法通常是优选，原因是：

- 许多等效的表示仍然编码了一些意图的等级，在声明文件中保留下来会更好。
- 产生一个新的类型表示会有些昂贵，所以避免此操作会更好。
- 用户编写的类型通常情况下比生成的类型表示更短。

在 5.5 中，我么极大地提升了 TypeScript 可以正确识别安全的地方以及正确回写输入文件中编写的类型的位置的数量。这些情况的大部分都有不可见的性能提升， TypeScript 会生成新的语法节点集，再将它们序列化为一个字符串。TypeScript 现在可以直接操作原始的语法节点，这开销更小以及运行更快。

### 缓存可识别联合的上下文类型

当 TypeScript 询问某个表达式，比如一个字面对象的上下文类型时，通常情况下会遇到一个联合类型。在这些情况下， TypeScript 尝试过滤掉基于已知的带有明确值的属性的联合的成员（比如判断式属性）。这项工作相当的昂贵，特别是如果你在一个对象中包含了许多的属性。在 TypeScript 5.5 中 ，[大部分的计算会被缓存一次，这样 TypeScript 就不需要对字面对象量的每个属性再去重新计算](https://github.com/microsoft/TypeScript/pull/58372)。执行此优化可以让 TypeScript 编译器自身编译的时间减少 250ms 。

## ECMA 模块中更简单的 API 用法。

以前，如果你在 Node.js 中编写一个 ECMA 模块的话，从 TypeScript 包中使用别名导入式不被允许的。

```typescript
import { createSourceFile } from "typescript"; // ❌ error

import * as ts from "typescript";
ts.createSourceFile // ❌ undefined???

ts.default.createSourceFile // ✅ works - but ugh!
```

这是因为 [cjs-module-lexer](https://github.com/nodejs/cjs-module-lexer) 不会识别出 TypeScript 生成 CommonJS 代码的模式。这个目前已被修复，用户现在可以在 Node.js 中从 TypeScript 的 npm 包中使用 ECMA 模块的别名导入。

```typescript
import { createSourceFile } from "typescript"; // ✅ works now!

import * as ts from "typescript";
ts.createSourceFile // ✅ works now!
```

## transpileDeclaration API

TypeScript 的 API 导出了一个名为 `transpileModule` 的函数。它是为了让编译一个单独的 TypeScript 文件内容的过程变得简单。由于它不会读取整个项目，所以需要注意，如果代码违反了 `isolatedModules` 选项下的任何错误的话，它可能不会尝试正确的输出。

在 TypeScript 5.5 ，我们添加了一个新的相似的 API —— `transpileDeclaration` 。这个 API 和 `transpileModule` 相似，但具体来说它的设计是为了对一些原始输入生成一个单独的声明文件。和 `transpileModule` 一样，它不会获取整个项目，同样也得注意：它只在 `isolatedDeclarations` 选项下对没有错误的输入代码生成准确的声明文件。

如果有需要的话，这个函数可以在 `isolatedDeclarations` 模式下的多个文件间并行生成声明。

## 需要注意的行为变更

### TypeScript 5.0 中废弃的不可用特性

TypeScript 5.0 废弃了以下的选项和行为：

- charset
- target: ES3
- importsNotUsedAsValues
- noImplicitUseStrict
- noStrictGenericChecks
- keyofStringsOnly
- suppressExcessPropertyErrors
- suppressImplicitAnyIndexErrors
- out
- preserveValueImports
- prepend in project references
- implicitly OS-specific newLine

为了继续使用如上废弃的配置项，使用 TypeScript 5.0 以及更新版本的开发者必须指定一个新的配置项 `ignoreDeprecations` ，将它的值设置为 `5.0` 。

在 TypeScript 5.5 中，这些选项不在有效果，为了提供一个平滑的升级路径，你可能仍然会在 tsconfig.json 中指定它们，但是在 TypeScript 6.0 中就会报错。

### lib.d.ts 变更

[TypeScript 5.5 中 DOM 的更新](https://github.com/microsoft/TypeScript/pull/58211)

### 更严格解析装饰器

由于TypeScript 最初引入了对装饰器的支持，提案中已收紧相关的语法。 TypeScript 现在对允许的形式会更严格。虽然不常见，但是现有的装饰器可能需要加上括号来避免错误。

```typescript
class DecoratorProvider {
    decorate(...args: any[]) { }
}

class D extends DecoratorProvider {
    m() {
        class C {
            @super.decorate // ❌ 错误
            method1() { }

            @(super.decorate) // ✅ 正确
            method2() { }
        }
    }
}
```

### undefined 不再是一个可定义的类型名称

TypeScript 总是禁止与内置类型冲突的类型别名：

```typescript
// Illegal
type null = any;
// Illegal
type number = any;
// Illegal
type object = any;
// Illegal
type any = any;
```

由于一个 bug ，这个逻辑对内置的 `undefined` 类型不生效。在 5.5 ，现在会正确地识别到并报错：

```typescript
// Now also illegal
type undefined = any;
```

对名为 `undefined` 的类型别名的裸引实际上从一开始就不会工作。你可以定义，但你无法当成一个非限定的类型名称来使用。

```typescript
export type undefined = string;
export const m: undefined = "";
//           ^
// Errors in 5.4 and earlier - the local definition of 'undefined' was not even consulted.
```

### 简化引用指令声明生成

当产生一个声明文件时， TypeScript 在相信需要该文件时会生成一个引用的指令。比如，所有的 Node.js 模块均在环境中声明，所以无法单独通过模块解析来加载。比如一个如下的文件：

```typescript
import path from "path";
export const myPath = path.parse(__filename);
```

会生成如下的声明文件：

```typescript
/// <reference types="node" />
import path from "path";
export declare const myPath: path.ParsedPath;
```

即使引用指令从未出现在源代码中。

相似地， TypeScript 也会在不相信引用指令需要成为输出的一部分的时候删掉它。比如，想象一下存在一个引用指令 jest 。但是，再想象一下引用指令对生成声明来说时不必要的。 TypeScript 会简单地移除它。所以如下的例子：

```typescript
/// <reference types="jest" />
import path from "path";
export const myPath = path.parse(__filename);
```

TypeScript 仍会生成：

```typescript
/// <reference types="node" />
import path from "path";
export declare const myPath: path.ParsedPath;
```

在对 `isolatedDeclarations` 部分中，我们明白了，对于任何一个尝试去实现一个没有类型检查或者没有使用超过一个文件上下文的声明生成器，这样的逻辑是站不住脚的。这个行为从用户角度看也难以理解。一个引用指令是否出现在生成的文件中似乎是不一致并且难以预测的，除非你确切地理解类型检查期间所发生的事情。为了防止 `isolatedDeclarations` 开启时生成不同的声明，我们明白我们的生成过程需要改变了。

通过[实验](https://github.com/microsoft/TypeScript/pull/57569)，我们发现几乎所有的 TypeScript 生成引用指令的情况都只是引入 node 或者 react 。基于期待下游用户通过 tsconfig.json 文件的 `types` 字段或者库导入引用这些类型的情况，所以不在生成这些引用指令不太可能影响任何人。需要注意的是，这已经是 `lib.d.ts` 的工具原理。当一个模块导出一个 `WeakMap` 时， TypeScript 不会生成一个 `lib="es2015"` 的引用，而是假设上游用户已经将其包含到他们的环境中。

库作者已经编写了相关的引用指令（非生成的），[进一步的实验](https://github.com/microsoft/TypeScript/pull/57656) 表明了几乎所有的指令都会被删除，从不会出现再输出文件中。许多保留下来的引用指令会造成破坏，以及它们可能不是有意被保留下来的。

通过这些结果，我们决定在 TypeScript 5.5 极大简化引用指令再声明文件中的生成。更加一致的策略会帮助库作者和使用者能更好地控制他们的声明文件。

引用指令不再生成。用户编写的引用指令不再被保留，除非加上一个新的 `preserve="true"` 的属性。具体来说，一个如下的输入文件：

```typescript
/// <reference types="some-lib" preserve="true" />
/// <reference types="jest" />
import path from "path";
export const myPath = path.parse(__filename);
```

会生成为：

```typescript
/// <reference types="some-lib" preserve="true" />
import path from "path";
export declare const myPath: path.ParsedPath;
```

添加 `preserve="true"` 可以向后兼容， TypeScript 会忽略不认识的属性。

这个变更也提升了性能。在我们的基准测试中，开启了生成功能的项目在生成阶段提升了 1-4% 。