---
title: TypeScript 5.3（译）
tags:
  - TypeScript
  - JavaScript
categories:
  - 翻译
key: 1702454483date: 2023-12-13 16:01:23
updated: 2023-12-13 16:01:23
---

# 前言

原文地址：[Announcing TypeScript 5.3](https://devblogs.microsoft.com/typescript/announcing-typescript-5-3/)

<!-- more -->

# 正文

今天我们激动地宣布：Typescript 5.3 正式发布。

如果你还不熟悉 TypeScript 的话，可以简单地理解为， TypeScript 是一门建立在 JavaScript 上的语言，TypeScript 通过添加类型语法来进行类型检查。TypeScript 提供的类型描述了程序的一些细节，然后在 TypeScript 编译之前根据这些类型进行检查以捕获可能的拼写错误，逻辑 BUG 等等。 TypeScript 还能根据这些类型来提供编辑器工具，比如代码完成，代码重构等等。实际上，如果你使用像 VS 或者 VS Code 这样的编辑器， TypeScript 已经提供了这种体验。你可以阅读关于 TypeScript 的文档 [https://typescriptlang.org](https://typescriptlang.org) 来了解更多信息。

为了开始使用 TypeScript ，可以通过 [NuGet](https://www.nuget.org/packages/Microsoft.TypeScript.MSBuild) 获取，或者通过执行如下的 npm 命令：

```cmd
npm install -D typescript
```

以下是 TypeScript 5.3 新增的功能列表！

- [导入属性](#导入属性)
- [在导入类型中稳定支持 resolution-mode 属性](#在导入类型中稳定支持-resolution-mode-属性)
- [resolution-mode 支持所有的模块模式](#resolution-mode-支持所有的模块模式)
- [switch (true) 下进行类型缩限](#switch-true-下进行类型缩限)
- [与布尔类型比较时进行类型缩限](#与布尔类型比较时进行类型缩限)
- [通过 Symbol.hasInstance 对 instanceof 操作进行类型缩限](#通过-symbolhasinstance-对-instanceof-操作进行类型缩限)
- [在实例字段上检测超类的属性可访问性](#在实例字段上检测超类的属性可访问性)
- [可交互的嵌入类型提示](#可交互的嵌入类型提示)
- [设置为类型首选的自动导入](#设置为类型首选的自动导入)
- [通过跳过 JSDoc 解析进行优化](#通过跳过-jsdoc-解析进行优化)
- [通过比较未标准化的焦点进行优化](#通过比较未标准化的交集进行优化)
- [整合 tsserverlibrary.js 和 typescript.js](#整合-tsserverlibraryjs-和-typescriptjs)
- [破坏性变更和正确性修复](#破坏性变更和正确性修复)

## 导入属性

TypeScript5.3 支持最近更新的[导入属性（ import attribute ）](https://github.com/tc39/proposal-import-attributes)提案。

导入属性的一个用例是在运行时的时候为一个的模块提供预期的格式信息。

```typescript
// 我们只想让这个导入被解释为 JSON ，
// 而不是一个带有 .json 扩展名的，可执行的或者说恶意的 JavaScript 文件。
import obj from "./something.json" with { type: "json" };
```

这些属性自身不会被 TypeScript 检查，因为它们是特定于主机的，它们会被简单地保留下来，这样浏览器和运行时可以处理它们（可能也会报错）。

```typescript
// TypeScript 认为下面的代码没问题。
// 但你的浏览器呢？可能就不这么认为了。
import * as foo from "./foo.js" with { type: "fluffy bunny" };
```

动态导入也可以通过第二个参数来使用导入属性。

```typescript
const obj = await import("./something.json", {
    with: { type: "json" }
});
```

第二个参数预期的类型由一个名为 `ImportCallOptions` 的类型定义，默认情况下只接受一个 `with` 属性。

请注意导入属性是由一个早期的在 TypeScript 4.5 实现的[导入断言（ import assertion ）](https://devblogs.microsoft.com/typescript/announcing-typescript-4-5/#import-assertions)提案演化而来的。它们间最显著的区别就是前者使用 `with` 关键词，后者使用 `assert` 关键词。但不太明显的区别是，现在运行时可以自由地根据属性来指示导入路径的解析和解释，而导入断言只能在加载完一个模块之后断言模块的特征。

随着时间推移，TypeScript 会在未来废弃旧的导入断言的语法，进而采用来自提案的导入属性的语法。现存的使用 `assert` 关键字的代码应该迁移到 `with` 关键字。新的需要使用导入属性的代码应该只使用 `with` 关键字。

感谢 [Oleksandr Tarasiuk](https://github.com/a-tarasyuk) 实现了[这个提案](https://github.com/microsoft/TypeScript/pull/54242) ，同时也赞赏 [Wenlu Wang](https://github.com/Kingwl) 实现的[导入断言](https://github.com/microsoft/TypeScript/pull/40698) 。

## 在导入类型中稳定支持 resolution-mode 属性

在 TypeScript 4.7 中，添加了对 `/// <reference type="...">` 中 `resolution-mode` 属性的支持，它可以用来控制一个说明符是通过 `import` 还是 `require` 解析。

```typescript
/// <reference types="pkg" resolution-mode="require" />

// 或者

/// <reference types="pkg" resolution-mode="import" />
```

我们也为导入断言添加了一个相应的字段用来针对只导入类型的情况，然而，它只在 TypeScript 的夜间版本中支持。究其原因，本质上导入断言并不是为了指示模块解析。所以这个特性只在夜间模式中实验性地发布，用来获得更多的反馈。

但鉴于导入属性可以指示解析了，并且我们也观察到了许多合理的用例， TypeScript 5.3 现在支持了 `import type` 的 `resolution-mode` 属性。

```typescript
// Resolve `pkg` as if we were importing with a `require()`
import type { TypeFromRequire } from "pkg" with {
    "resolution-mode": "require"
};

// Resolve `pkg` as if we were importing with an `import`
import type { TypeFromImport } from "pkg" with {
    "resolution-mode": "import"
};

export interface MergedType extends TypeFromRequire, TypeFromImport {}
```

这些导入属性同样可以用于 `import()` 。

```typescript
export type TypeFromRequire =
    import("pkg", { with: { "resolution-mode": "require" } }).TypeFromRequire;

export type TypeFromImport =
    import("pkg", { with: { "resolution-mode": "import" } }).TypeFromImport;

export interface MergedType extends TypeFromRequire, TypeFromImport {}
```

更多的信息，可以查看这个 [PR](https://github.com/microsoft/TypeScript/pull/55725) 。

## resolution-mode 支持所有的模块模式

在之前， `resolution-mode` 只允许在 `moduleResolution` 选项为 `node16` 和 `nodenext` 下使用。为了让模块查找，特别是类型模块的查找更加容易， `resolution-mode` 现在可以在所有其他的 `moduleResolution` 选项下正常工作，比如 `bundler` ，`node10` ，甚至在 `classic` 下也不会报错。

更多的信息，可以查看这个 [PR](https://github.com/microsoft/TypeScript/pull/55725) 。

## switch (true) 下进行类型缩限

TypeScript 5.3 现在可以基于条件对一个 `switch (true)` 表达式内的每一个条件进行类型缩限。

```typescript
function f(x: unknown) {
    switch (true) {
        case typeof x === "string":
            // x 在这里是一个 string 类型
            console.log(x.toUpperCase());

        case Array.isArray(x):
            // x 在这里是一个 string 或者 any[]
            console.log(x.length);

        default:
          // x 在这里为 unknown 。
          // ...
    }
}
```

这个特性最初由 [Mateusz Burzyński](https://github.com/Andarist) 提交，在此感谢该贡献的作者。

## 与布尔类型比较时进行类型缩限

偶尔你可能会在一个条件中使用 `true` 或者 `false` 来进行直接的对比。通常这是不必要的比较，但你可能更喜欢它，可能是作为一种代码风格，又或者为了避免某些关于 JavaScript 真值问题。无论出于什么原因，先前的 TypeScript 在无法对此类判断执行类型缩限。

TypeScript 5.3 修复了这个问题，现在在进行类型缩限时能理解这些表达式。

```typescript
interface A {
    a: string;
}

interface B {
    b: string;
}

type MyType = A | B;

function isA(x: MyType): x is A {
    return "a" in x;
}

function someFn(x: MyType) {
    if (isA(x) === true) {
        console.log(x.a); // works!
    }
}
```

感谢 [Mateusz Burzyński](https://github.com/Andarist) 提供了实现了这个特性的 [PR](https://github.com/microsoft/TypeScript/pull/53681) 。

## 通过 Symbol.hasInstance 对 instanceof 操作进行类型缩限

JavaScript 中一个有点深奥的特性是可以重写 `instanceof` 操作符的行为。为了实现它， `instanceof` 操作符右边的值需要一个具体的名叫 `Symbol.hasInstance` 的方法。

```typescript
class Weirdo {
    static [Symbol.hasInstance](testedValue) {
        // 还能这样？
        return testedValue === undefined;
    }
}

// false
console.log(new Thing() instanceof Weirdo);

// true
console.log(undefined instanceof Weirdo);
```

为了更好地模拟 `instanceof` 的行为， TypeScript 现在会检查是否存在 `[Symbol.hasInstance]` 方法，并且这个方法是否为一个类型断言函数，如果是的话，在 `instanceof` 操作符左边的待测试的值会正确地通过类型断言进行缩限。

```typescript
interface PointLike {
    x: number;
    y: number;
}

class Point implements PointLike {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    distanceFromOrigin() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    static [Symbol.hasInstance](val: unknown): val is PointLike {
        return !!val && typeof val === "object" &&
            "x" in val && "y" in val &&
            typeof val.x === "number" &&
            typeof val.y === "number";
    }
}


function f(value: unknown) {
    if (value instanceof Point) {
        // 可以访问 x 和 y ，正确
        value.x;
        value.y;
        
        // 无法访问 distanceFromOrigin ，因为我们把 value 缩限为 PointLike 而不是 Point
        value.distanceFromOrigin();
    }
}
```

如同示例所示， `Point` 定义了自己的 `[Symbol.hasInstance]` 方法。它实际上充当了另外一个类型 `PointLike` 的自定义类型验证守卫。在函数 `f` 中，我们能够把 `value` 通过 `instanceof` 缩限到 `PointLike` ，而不是 `Point` 。这意味着我们可以访问属性 `x` 和 属性 `y` ，但不可以访问 `distanceFromOrigin` 方法。

更多的信息，可以查看这个 [PR](https://github.com/microsoft/TypeScript/pull/55052) 。

## 在实例字段上检测超类的属性可访问性

在 JavaScript 中，可以通过 `super` 关键字访问基类中的定义的属性或方法。

```typescript
class Base {
    someMethod() {
        console.log("Base method called!");
    }
}

class Derived extends Base {
    someMethod() {
        console.log("Derived method called!");
        super.someMethod();
    }
}

new Derived().someMethod();
// 打印:
//   Derived method called!
//   Base method called!
```

如果使用 `this.someMethod()` 这样的编写方式可能会存在歧义，因为他可能执行的是一个重写的方法。这是一个微妙的区别，而且如果声明根本没被覆盖，由于两者（使用 `super` 或者使用 `this`）通常可以互换，因此这种情况会变得更加的微妙。

```typescript
class Base {
    someMethod() {
        console.log("someMethod called!");
    }
}

class Derived extends Base {
    someOtherMethod() {
        // 两者行为相同
        this.someMethod();
        super.someMethod();
    }
}

new Derived().someOtherMethod();
// 打印:
//   someMethod called!
//   someMethod called!
```

交替使用带来的问题是 `super` 只能获取原型上的定义的成员，而不是实例上的属性。这意味着如果你编写了 `super.someMethod()` ，但 `someMethod` 被定义为一个字段，你就会收到一个运行时错误！

```typescript
class Base {
    // 译者注：这里 someMethod 是一个实例属性，而非原型属性
    // 即 someMethod 并不会挂在到原型上，而是每个实例都会有一个不同 someMethod ，它的 this 指向自身
    someMethod = () => {
        console.log("someMethod called!");
    }
}

class Derived extends Base {
    someOtherMethod() {
        super.someMethod();
    }
}

new Derived().someOtherMethod();
// 💥
// 报错，因为 super.someMethod 为 underfined 。
```

TypeScript 5.3 现在会更仔细地检查 `super` 属性的访问和方法调用是否存在对应的类字段。如果是的话，现在会得到一个类型检查错误。

感谢 [Jack Works](https://github.com/Jack-Works) 贡献了这个[类型检查](https://github.com/microsoft/TypeScript/pull/54056) 。 

## 可交互的嵌入类型提示

TypeScript 嵌入提示现在支持跳转类型的定义，这样就可以更随意的浏览代码了。

![](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2023/10/clickable-inlay-hints-for-types-5-3-beta.gif)

更多信息请查看这个[实现](https://github.com/microsoft/TypeScript/pull/55141)。

## 设置为类型首选的自动导入

先前当 TypeScript 在类型位置生成一些自动导入的时候，会根据你的设置添加一个 `type` 修饰符。比如，当你对下面的 `Person` 使用自动导入的时候：

```typescript
export let p: Person
```

TypeScript 的编辑体验会使用如下的形式来导入 `Person` ：

```typescript
import { Person } from "./types";

export let p: Person
```

如果设置了 `verbatimModuleSyntax` ，那么会添加 `type` 修饰符：

```typescript
import { type Person } from "./types";

export let p: Person
```

然而，可能你的代码库中无法使用某些选项，或者你只是偏好尽可能的 `type` 的显示导入。

经过最近的修改， TypeScript 现在让该特性成为特定的 VSCode 编辑器选项，你可以在 `TypeScript > Preferences: Prefer Type Only Auto Imports` 的视图中，或者 JSON 配置文件中的 `typescript.preferences.preferTypeOnlyAutoImports` 选项来启用它。

## 通过跳过 JSDoc 解析进行优化

当通过 `tsc` 来执行 TypeScript 时，编译器现在会避免解析 JSDoc 。这会减少自身解析的时间，而且减少由于存储注释带来的内存使用以及垃圾收集所花费的时间。总而言之，你会在 `--watch` 模式下观察到稍快的编译速度以及更快的反应。

具体的变更可以在[这里](https://github.com/microsoft/TypeScript/pull/52921)查看。

因为不是所有 TypeScript 使用的工具都存储 JSDoc （比如： typeScript-eslint 和 Prettier ），这个解析策略已经作为 API 本身的一部分出现。这能够让这些工具获得与 TypeScript 编译器相同的内存和速度提升。新增了对解析注释的策略的新的选项 `JSDocParsingMode` 。更多的信息可以在查看这个 [PR](https://github.com/microsoft/TypeScript/pull/55739) 。

## 通过比较未标准化的交集进行优化

在 TypeScript 中，并集和交集始终遵守一个特定的形式，即交集不能包含并集类型。这意味着当我们在一个并集上创建一个交集，比如 `A & (B | C)` ，那么交集会被标准化为 `(A & B) | (A & C)` 。尽管如此，在某些情况下，类型系统会出于显示的目的而保留原始的形式。

事实证明原始的类型可以被用在一些类型间的巧妙的快速路径比较。

比如，我们假设有 `SomeType & (Type1 | Type2 | ... | Type99999NINE)` 这样的一个类型，我们想要观察它是否可以分配个 `SomeType` 。回想一下，我们不是真的有一个原始的交集类型，我们有的时一个并集类型，它看起来就如同 `(SomeType & Type1) | (SomeType & Type2) | ... | (SomeType & Type99999NINE)` 。 当检查一个并集是否可以分配给目标类型时，我们必须检查并集的每个成员是否可以分配给目标类型，这样会非常的慢。

在 TypeScript 5.3 中，我们顺带使用了这些隐藏起来的原始交集形式。当我们需要和类型比较时，就可以快速的检查是否目标是否存在于原始交集的任何组成部分。

更多的信息，可以查看这个 [PR](https://github.com/microsoft/TypeScript/pull/55851) 。

## 整合 tsserverlibrary.js 和 typescript.js

TypeScript 自身包含两个库文件： `tsserverlibrary.js` 和 `typescript.js` 。某些 API 只在 `tsserverlibrary.js` 存在（比如 `ProjectService` ）。这可能对一些使用者来说有用。尽管如此，这两个文件是不是相同的打包文件，但在源代码中它们有许多的重叠，重复的代码。更重要的是，由于自动导入或者是肌肉记忆，持续使用其中的一种会带来挑战性，因为很容易意外加载两个模块，而且代码可能无法在相同 API 的不同实例下恰当地工作。即使可以正常工作，加载第二个打包文件也会增加资源的使用。

因此，我们决定整合这两个文件。 `typescript.js` 现在包含了 `tsserverlibrary.js` ， `tsserverlibraray.js` 现在只是简单地从 `typescript.js` 中重新导出而已。比较整合前后，我们可以观察到如下的包体积情况：

|          | Before    | After     | Diff      | Diff (percent) |
|----------|-----------|-----------|-----------|----------------|
| Packed   | 6.90 MiB  | 5.48 MiB  | -1.42 MiB | -20.61%        |
| Unpacked | 38.74 MiB | 30.41 MiB | -8.33 MiB | -21.50%        |

|                          | Before     | After       | Diff         | Diff (percent) |
|--------------------------|------------|-------------|--------------|----------------|
| lib/tsserverlibrary.d.ts | 570.95 KiB | 865.00 B	   | -570.10 KiB	 | -99.85%        |
| lib/tsserverlibrary.js   | 8.57 MiB   | 1012.00 B	  | -8.57 MiB	   | -99.99%        |
| lib/typescript.d.ts      | 396.27 KiB | 570.95 KiB	 | +174.68 KiB	 | +44.08%        |
| lib/typescript.js        | 7.95 MiB   | 8.57 MiB    | +637.53 KiB  | +7.84%         |

换句话说，包体积减少了 20.5% 以上。

更多的信息，可以查看这个 [PR](https://github.com/microsoft/TypeScript/pull/55273) 。

## 破坏性变更和正确性修复

### lib.d.ts 变更

DOM 生成的类型可能对你的代码库会有影响。更多相关的信息请查看 [DOM 在 TypeScript 5.3 中的更新](https://github.com/microsoft/TypeScript/pull/55798)。

### 检查 super 实例上属性的可访问性

当通过 `super` 引用声明时，TypeScript 5.3 现在会进行检测。如果访问的属性是一个类字段那么会发出一个错误。这可以防止运行时可能发生的错误。

更多的信息，可以查看这个 [PR](https://github.com/microsoft/TypeScript/pull/54056) 。

## 后记

5.3 的新特性比较的“普通”，像导入属性我是基本用不到，不过也不排除只是我用不到而已😂

其中比较吸引我眼球的是这个超类属性可访问性检测。我是刚明白类中的箭头函数是非原型属性的，不过仔细想也是，如果是原型属性，那么就和箭头函数 this 的固定指向产生矛盾了。
