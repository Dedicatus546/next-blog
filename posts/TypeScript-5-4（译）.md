---
title: TypeScript 5.4（译）
tags:
  - TypeScript
  - JavaScript
categories:
  - 翻译
key: 1710229861date: 2024-03-12 15:51:01
updated: 2024-03-12 15:51:01
---

# 前言

原文地址：[Announcing TypeScript 5.4](https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/)

<!-- more -->

# 正文

今天我们激动地宣布：Typescript 5.4 正式发布。

如果你还不熟悉 TypeScript 的话，可以简单地理解为， TypeScript 是一门建立在 JavaScript 上的语言，它可以定义和描述类型。通过编写类型我们可以解释代码的意图，使用其他的工具来检查代码从而捕获程序错误，比如拼写错误， `null` 和 `undefined` 问题等等。类型也加强了 VS 和 VSCode 中的诸如自动完成，代码导航和重构的功能。实际上，如果你在这两个编辑器中编写过 JavaScript ，那么其实你是一直在使用 TypeScript 的。

为了开始使用 TypeScript ，可以通过 [NuGet](https://www.nuget.org/packages/Microsoft.TypeScript.MSBuild) 获取，或者通过执行如下的 npm 命令：

```cmd
npm install -D typescript
```

以下是 TypeScript 5.4 新增的功能列表！

- [在闭包中保留上次分配类型的收窄范围](#在闭包中保留上次分配类型的收窄范围)
- [NoInfer 工具类型](#noinfer-工具类型)
- [Object.groupBy 和 Map.groupBy](#objectgroupby-和-mapgroupby)
- [支持在 moduleResolution 为 bundler 和 --module 为 preserve 下的 required() 调用](#支持在-moduleresolution-为-bundler-和---module-为-preserve-下的-required-调用)
- [检查导入属性和断言](#检查导入属性和断言)
- [新增对添加丢失参数的快速修复](#新增对添加丢失参数的快速修复)
- [自动导入支持子路径导入](#自动导入支持子路径导入)
- [即将到来的 TypeScript 5.0 废弃项](#即将到来的-typescript-50-废弃项)
- [显著的行为变更](#显著的行为变更)

## 在闭包中保留上次分配类型的收窄范围

TypeScript 通常可以执行一个基于变量的检查来推断一个具体的类型。这个过程被称为类型收窄。

```javascript
function uppercaseStrings(x: string | number) {
    if (typeof x === "string") {
        // TypeScript 明白这里的 x 是一个 string 类型
        return x.toUpperCase();
    }
}
```

一个常见的痛点是，这些收窄的类型无法保留到函数闭包中。

```javascript
function getUrls(url: string | URL, names: string[]) {
    if (typeof url === "string") {
        url = new URL(url);
    }

    return names.map(name => {
        url.searchParams.set("name", name)
        //  ~~~~~~~~~~~~
        // 错误！
        // string | URL 类型上不存在 searchParams 属性。

        return url.toString();
    });
}
```

在上面的例子中， TypeScript 会判定，在回调中把 url 变量当成实际上的 URL 对象是不安全的，因为它可以在其他地方被修改。然而，在这个实例中，箭头函数总是在对 url 赋值之后才创建，并且也是最后一个对 url 赋值的。

TypeScript 5.4 利用这一点来让类型收窄变得更加智能一些。当在一个非[提升](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting)的函数中使用参数和 let 定义的变量，类型检查器会寻找最后一次分配变量的位置。如果只找到了一个，那么 TypeScript 会安全地把类型收窄到包含该变量的函数的外部。这意味着上面的例子现在可以正常工作了。

注意如果变量在一个嵌套的函数中的任意位置赋值，那么类型的收窄将不会生效。这是因为无法确定该函数接下来是否会被调用。

```javascript
function printValueLater(value: string | undefined) {
    if (value === undefined) {
        value = "missing!";
    }

    setTimeout(() => {
        // 修改 value 变量
        // 虽然这个方式不影响它的类型，但是这会使闭包中的类型改进失效。
        value = value;
    }, 500);

    setTimeout(() => {
        console.log(value.toUpperCase());
        //          ~~~~~
        // 错误！ value 可能为 undefined 类型。
    }, 1000);
}
```

这个特性可以使得很多的典型的 JavaScript 代码更易于表示。你可以在 [Github](https://github.com/microsoft/TypeScript/pull/56908) 上阅读更多的信息。

## NoInfer 工具类型

当调用一个泛型函数时， TypeScript 能够根据任何传入的内容来推断类型参数。

```javascript
function doSomething<T>(arg: T) {
    // ...
}


// 我们可以显式地指定 T 为 string 类型
doSomething<string>("hello!");

// 我们也可以让 T 自动推断
doSomething("hello!");
```

然而，问题是并不总是能够清晰地知道要推断地最佳类型。这可能会导致 TypeScript 拒绝合法的调用，接受有问题的调用，或者只是在捕获一个 bug 时报告更加糟糕的错误信息。

比如，想象一下有个 `createStreetLight` 函数，它接受一个颜色数组 `colors` ，以及一个可选的默认颜色 `defaultColor` 。

```typescript
function createStreetLight<C extends string>(colors: C[], defaultColor?: C) {
    // ...
}

createStreetLight(["red", "yellow", "green"], "red");
```

当我们传入一个没有包含在 `colors` 数组内的默认颜色时会发生什么？在这个函数中， `colors` 参数应该是一个事实的来源，用来描述可以传给 `defaultColor` 的内容。

```typescript
// 哎呀！这不符合预期，但确实允许的！
createStreetLight(["red", "yellow", "green"], "blue");
```

在上面的调用中，类型推断确定 `"blue"` 与 `"red"` 、 `"yellow"` 、 `"green"` 一样，都是合法的类型。所以 TypeScript 不会拒绝这个调用，而是推断 `C` 类型为 `"red" | "yellow" | "green" | "blue"` 。你可以会对这个推断感到震惊。

当前处理该问题的一种方式是添加一个被现有类型参数限制的单独的类型参数。

```typescript
function createStreetLight<C extends string, D extends C>(colors: C[], defaultColor?: D) {
}

createStreetLight(["red", "yellow", "green"], "blue");
//                                            ~~~~~~
// 错误！
// blue 类型无法分配给 "red" | "yellow" | "green" | "undefined" 类型
```

这种方式有效，但有那么一点别扭，因为 `D` 可能不会在 `createStreetLight` 的签名的其他任何地方被使用到。虽然在这种情况下看起来还行，但是在签名中使用一个只是用一次的类型参数通常会产生异味代码。

这也就是为什么 TypeScript 5.4 引入了一个新的 `NoInfer<T>` 工具类型。将一个类型放在 `NoInfer` 中会给 TypeScript 传递一个信号，这个信号的意思是不要去挖掘并匹配内部的类型来寻找类型推导的候选者。

我们可以使用 `NoInfer` 重写下 `createStreetLight` 这个例子：

```typescript
function createStreetLight<C extends string>(colors: C[], defaultColor?: NoInfer<C>) {
    // ...
}

createStreetLight(["red", "yellow", "green"], "blue");
//                                            ~~~~~~
// 错误！
// blue 类型无法分配给 "red" | "yellow" | "green" | "undefined" 类型
```

将 `defaultColor` 的类型排除在类型推导之外意味着 `"blue"` 永远不会成为推导候选者，这样类型检查工具就可以拒绝掉它。

你可以在这个 [PR](https://github.com/microsoft/TypeScript/pull/56794) 上查看具体的变更，以及 [Mateusz Burzyński](https://github.com/Andarist) 提供的[初版实现](https://github.com/microsoft/TypeScript/pull/52968)。

## Object.groupBy 和 Map.groupBy

TypeScript 5.4 添加了 JavaScript 的两个新静态方法 `Object.groupBy` 和 `Map.groupBy` 的定义。

`Object.groupBy` 接收一个可迭代对象，以及一个函数，这个函数决定用什么来分组。函数需要用一个键来区分不同的组，然后 `Object.groupBy` 就会使用这个键来创建一个对象，对象的每个键都映射一个包含源数组元素的数组。

所以下面的代码：

```typescript
const array = [0, 1, 2, 3, 4, 5];

const myObj = Object.groupBy(array, (num, index) => {
    return num % 2 === 0 ? "even": "odd";
});
```

基本上等同于如下：

```typescript
const myObj = {
    even: [0, 2, 4],
    odd: [1, 3, 5],
};
```

`Map.groupBy` 也类似，但是它产生了一个 Map 对象而不是一个普通的对象。如果你需要保证是 Map 类型，或者使用的 API 需要传入 Map 类型，或者你需要使用任何类型的键来分组，而不仅仅只是只能作为 JavaScript 属性名的键。

```typescript
const myObj = Map.groupBy(array, (num, index) => {
    return num % 2 === 0 ? "even" : "odd";
});
```

跟前面一样，你可以以相等的方式创建一个 myObj 对象。

```typescript
const myObj = new Map();

myObj.set("even", [0, 2, 4]);
myObj.set("odd", [1, 3, 5]);
```

注意上面 `Object.groupBy` 的例子，产生的对象的所有属性都是可选的。

```typescript
interface EvenOdds {
    even?: number[];
    odd?: number[];
}

const myObj: EvenOdds = Object.groupBy(...);

myObj.even;
//    ~~~~
// 在 strictNullChecks 下访问该属性是错误的。
```

这是因为无法确保所有的键都是由分组产生的。

而且注意这两个方法只能在 `target` 设置为 `next` 或者调整了 `lib` 设置的情况下才能访问。我们预计它们最终能够在 ES2024 标准中落地。

感谢 [Kevin Gibbons](https://github.com/bakkot) [添加了](https://github.com/microsoft/TypeScript/pull/56805)这两个分组方法的声明定义。

## 支持在 moduleResolution 为 bundler 和 --module 为 preserve 下的 required() 调用

在 TypeScript 中有一个值为 `bundler` 的 `moduleResolution` 选项，这个值的意思是用现代捆绑的方式来确定导入路径引用哪个文件进行建模。它的一个限制是必须和 `--module esnext` 配合，即也就无法使用 `import ... = require(...)` 的语法。

```typescript
// 先前的版本会报错
import myModule = require("module/path");
```

如果你计划只编写标准的 ECMAScript 导入的话这似乎不是一个大问题，但当一个包使用[条件导出](https://nodejs.org/api/packages.html#conditional-exports)的时候会有一些不同。

在 TypeScript 5.4 中，在 `module` 设置为新的名为 `preserve` 的值之后 `required()` 现在可以在导入语句中使用了。
 
`--module preserve` 和 `--moduleResolution bundler` ，这两者可以更准确地模拟 Bun 等捆绑器和运行时所允许的功能，以及如何执行模块查找。实际上，当指定 `--module preserve` 时， `--moduleResolution` 就会显式地指定为 `bundler` （以及 `--esModuleInterop` 和 `--resolveJsonModule` 选项）

```json
{
    "compilerOptions": {
        "module": "preserve",
        // ^ also implies:
        // "moduleResolution": "bundler",
        // "esModuleInterop": true,
        // "resolveJsonModule": true,

        // ...
    }
}
```

在 `--module preserve` 下， ECMAScript 导入总是会原样输出，而 `import ... = require() `则会输出为一个 `require` 调用（虽然在实践中你可能不会使用 TypeScript 来生成代码，因为你可能会在你的代码中使用捆绑器）。无论包含文件的扩展名如何，都是成立的。所以这段代码：

```typescript
import * as foo from "some-package/foo";
import bar = require("some-package/bar");
```

的输出看起来应该是如下：

```typescript
import * as foo from "some-package/foo";
var bar = require("some-package/bar");
```

这也意味着你选择的语法将指导条件导出的匹配方式。所以在上面的例子中，如果某些包的 `package.json` 长如下这样：

```json
{
  "name": "some-package",
  "version": "0.0.1",
  "exports": {
    "./foo": {
        "import": "./esm/foo-from-import.mjs",
        "require": "./cjs/foo-from-require.cjs"
    },
    "./bar": {
        "import": "./esm/bar-from-import.mjs",
        "require": "./cjs/bar-from-require.cjs"
    }
  }
}
```

TypeScript 会把这些路径解析为 `[...]/some-package/esm/foo-from-import.mjs` 和 `[...]/some-package/cjs/bar-from-require.cjs` 。

更多的信息可以阅读[新设置](https://github.com/microsoft/TypeScript/pull/56785)的部分。

## 检查导入属性和断言

导入属性和导入断言现在会根据全局的 `ImportAttributes` 类型进行检查。这意味着运行时现在可以更加准确描述导入属性。

```typescript
// In some global file.
interface ImportAttributes {
    type: "json";
}

// 在一些其他的模块中
import * as ns from "foo" with { type: "not-json" };
//                                     ~~~~~~~~~~
// error!
//
// Type '{ type: "not-json"; }' is not assignable to type 'ImportAttributes'.
//  Types of property 'type' are incompatible.
//    Type '"not-json"' is not assignable to type '"json"'.
```

[在此](https://github.com/microsoft/TypeScript/pull/56034)查看更多信息。

## 新增对添加丢失参数的快速修复

TypeScript 现在有一个为那些有太多参数的函数添加新参数的一个快速修复。

![](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2024/01/add-missing-params-5-4-beta-before.png)

![](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2024/01/add-missing-params-5-4-beta-after.png)

当对一些存在的函数一个个编写参数的时候会让人感到麻烦，而这个快速修复就很有用。

[Oleksandr Tarasiuk](https://github.com/a-tarasyuk) 提供了这个[快速修复](https://github.com/microsoft/TypeScript/pull/56411) 。

## 自动导入支持子路径导入

在 Node 中， `package.json` 文件支持通过 `imports` 字段的名为子路径导入的特性。这是一种在包内部重新映射路径到其他模块的方式。从概念上讲，这和路径映射相当相似，某些模块捆绑器和加载器支持这个特性（ TypeScript 通过一个 `paths` 字段来支持它）。唯一的区别就是子路径导入总是必须以一个 # 作为开头。

TypeScript 的自动导入特性在先前并不考虑 `imports` 字段内的路径，用户需要在 `tsconfig.json` 文件中手动定义 `paths` 字段。而现在 TypeScript 的自动导入支持子路径导入了。

感谢 [Emma Hamilton](https://github.com/emmatown) 提供该[特性](https://github.com/microsoft/TypeScript/pull/55015)。

## 即将到来的 TypeScript 5.0 废弃项

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
- 项目引用中的 prepend
- 操作系统特定的隐式 newLine

为了继续使用这些特性，开发者使用的 TypeScript 5.0 和者其他最近的版本，必须指定一个名为 `ignoreDeprecations` 的新选项，它的值要设为 5.0 。

但是 TypeScript 5.4 会成为最后的一个版本，这些版本将继续正常运行这些特性，而 TypeScript 5.5（大约在 2024年6月）对这些特性则会硬性报错，使用这些特性的代码就需要进行迁移。

更多的信息，可以在 Github 上阅读这个[计划](https://github.com/microsoft/TypeScript/issues/51909)，这个计划包含了如何最好地调整代码库的建议。

## 显著的行为变更

本节强调了一部分值得注意的变更，开发者应该确认以及理解这些变更，将他们作为升级的一部分。有些时候会强调废弃，移除或者新的限制。它也包括功能改进的错误修复，但这也可能引入新的错误进而影响到已存在的构建。

### lib.d.ts 变更

DOM 生成的类型在你的代码库中可能对你的类型检查存在影响。更多的信息，可以查看 TypeScript 5.4 中 DOM 更新的[部分](https://github.com/microsoft/TypeScript/pull/57027)。

### 更加准确地条件类型约束

下面的代码中，在 `foo` 函数内不在允许第二个变量定义。

```typescript
type IsArray<T> = T extends any[] ? true : false;

function foo<U extends object>(x: IsArray<U>) {
    let first: true = x;    // 错误
    let second: false = x;  // 错误, 但先前版本不报错
}
```

之前，当 TypeScript 检查 `second` 变量的初始化时，它需要去判断 `IsArray<U>` 是否能够分配给 `false` 类型。当 `IsArray<U>` 无法以任何方式兼容时， TypeScript 会转去查看类型的约束，对于一个条件类型比如 `T extends Foo ? TrueBranch : FalseBranch` 来说，这里的 `T` 是泛型，类型系统会查看 `T` 的约束，把 `T` 替代为自身，然后决定是走真分支还是假分支。

但这个行为是不准确的，因为它过于激进了。尽管假如 `T` 的约束无法分配给 `Foo` ，这也不意味着它不会被实例化。所以，在无法证明 `T` 从不或者总是继承自 `Foo` 的情况下，更正确的行为是为条件类型约束生成联合类型。

TypeScript 5.4 采用了这个更准确的行为，在实践中意味着你可能会开始发现某些条件类型实例不再兼容它的分支。

可以[在此](https://github.com/microsoft/TypeScript/pull/56004)阅读更多的信息。

### 更加积极地减少类型变量和原始类型之间的交集

TypeScript 现在积极地减少类型变量和原始类型之间的交集，这取决于类型变量的约束如何与这些原语重叠。

```typescript
declare function intersect<T, U>(x: T, y: U): T & U;

function foo<T extends "abc" | "def">(x: T, str: string, num: number) {
    
    // a 之前为 T & string ，而现在只有 T
    let a = intersect(x, str);

    // a 之前为 T & number ，而现在只有 never
    let b = intersect(x, num)

    // c 之前为 (T & "abc") | (T & "def") ，而现在只有 T
    let c = Math.random() < 0.5 ?
        intersect(x, "abc") :
        intersect(x, "def");
}
```

[在此](https://github.com/microsoft/TypeScript/pull/56515)查看更多的信息。

### 通过模板字符串插值来改进检查

TypeScript 现在会更准确地检查字符串是否可以分配给一个模板字符类型的一个展位槽。

```typescript
function a<T extends {id: string}>() {
    let x: `-${keyof T & string}`;
    
    // 过去会报错，现在不会。
    x = "-id";
}
```

这个行为是更加理想的，但可能对使用类似条件类型的代码造成破坏，这些规则都很容易发现。

[在此](https://github.com/microsoft/TypeScript/pull/56598)查看更多的细节。

### 当局部变量和仅类型导入冲突时报错

先前，如果导入的 `Something` 只引用一个类型的话， TypeScript 会在开启 `isolatedModules` 的情况下允许如下的代码：

```typescript
import { Something } from "./some/path";

let Something = 123;
```

然而，即使代码保证在运行时会失败，单文件编译器假设删除导入是否“安全”也是是不安全的。在 TypeScript 5.4 中，这样的代码会抛出如下的一个错误：

```text
Import 'Something' conflicts with local value, so must be declared with a type-only import when 'isolatedModules' is enabled.
```

修复的方法是，给局部变量重命名，或者就如同错误状态所示，添加 `type` 修饰符到导入语句中：

```typescript
import type { Something } from "./some/path";

// 或者

import { type Something } from "./some/path";
```

[在此](https://github.com/microsoft/TypeScript/pull/56354)查看更多信息。

### 新的枚举可分配限制

当两个枚举定义相同的名称以及枚举成员名称，它们在先前总会被认为是兼容的。但是，当 TypeScript 知晓这个值时，它会静默地允许它们有不同值。

当读取到它们时，TypeScript 5.4 通过要求值相同来收紧这个限制。

```typescript
namespace First {
    export enum SomeEnum {
        A = 0,
        B = 1,
    }
}

namespace Second {
    export enum SomeEnum {
        A = 0,
        B = 2,
    }
}

function foo(x: First.SomeEnum, y: Second.SomeEnum) {
    // 过去两者兼容，现在则相反
    // TypeScript 会抛出如下错误
    //
    //  Each declaration of 'SomeEnum.B' differs in its value, where '1' was expected but '2' was given.
    x = y;
    y = x;
}
```

另外，当某个枚举成员没有静态的已知值时会有新的限制。在这些情况下，其他枚举必须至少是隐式的数字（比如，它没有静态解析的初始值），或者是显式的数字（即 TypeScript 可以解析该值为某些数字）。实际上说，这意味着字符串枚举成员仅与相同值的其他字符串枚举兼容。

````typescript
namespace First {
    export declare enum SomeEnum {
        A,
        B,
    }
}

namespace Second {
    export declare enum SomeEnum {
        A,
        B = "some known string",
    }
}

function foo(x: First.SomeEnum, y: Second.SomeEnum) {
    // 过去两者兼容，现在则相反
    // TypeScript 会抛出如下错误:
    //
    //  One value of 'SomeEnum.B' is the string '"some known string"', and the other is assumed to be an unknown numeric value.
    x = y;
    y = x;
}
````

更多的信息，可以查看这个 [PR](https://github.com/microsoft/TypeScript/pull/55924) 。

### 枚举成员的名称限制

TypeScript 不再允许枚举成员使用诸如 `Infinity` 、 `-Infinity` 或者 `NaN` 作为名称。

```typescript
// 下面的三个都会报错，错误如下：
//
//  An enum member cannot have a numeric name.
enum E {
    Infinity = 0,
    "-Infinity" = 1,
    NaN = 2,
}
```

[在此](https://github.com/microsoft/TypeScript/pull/56161)查看更多信息。

### 对 any 类型的剩余元素保留更好的映射类型

先前，将带有 `any` 的映射类型传入一个元组中会创建一个 `any` 的元素类型。这个情况不受欢迎，现在它已被修复了。

```typescript
Promise.all(["", ...([] as any)])
    .then((result) => {
        const head = result[0];       // 5.3 版本: any, 5.4 版本: string
        const tail = result.slice(1); // 5.3 版本: any, 5.4 版本: any[]
    });
```

更多的信息，可以查看这个[修复](https://github.com/microsoft/TypeScript/pull/57031)以及该行为变更的后续[讨论](https://github.com/microsoft/TypeScript/issues/57389)以及进一步的[调整](https://github.com/microsoft/TypeScript/issues/57389)。

### 输出变更

虽然本身不是一个破坏性的变更，但是开发者可能隐式地依赖 TypeScript 的 JavaScript 或者定义文件的输出。以下是显著的变更：

- [隐藏时更频繁地保留类型参数的名称](https://github.com/microsoft/TypeScript/pull/55820)
- [把异步函数复杂的参数列表移动到生成器的主体中](https://github.com/microsoft/TypeScript/pull/56296)
- [在函数定义文件中不删除绑定别名](https://github.com/microsoft/TypeScript/pull/57020)
- [在 importTypeNode 中，导入属性应该经历相同的输出阶段](https://github.com/microsoft/TypeScript/pull/56395)
