---
title: TypeScript 5.7（译）
tags:
  - TypeScript
  - JavaScript
categories:
  - 编程
date: 2024-11-23 15:36:22
updated: 2024-11-28 15:07:45
key: 1732777665
---


# 前言

原文地址：[Announcing TypeScript 5.7](https://devblogs.microsoft.com/typescript/announcing-typescript-5-7/)

<!-- more -->

# 正文

## 检查从未初始化的变量

很长一段时间，当一个变量在所有先前的分支中未被初始化时， TypeScript 已经能够捕获这个问题。

```javascript
let result: number
if (someCondition()) {
  result = doSomeWork();
} else {
  let temporaryWork = doSomeWork();
  temporaryWork *= 2;
  // 忘记给 result 赋值
}

console.log(result); // 错误，变量 result 在赋值前使用
```

不幸的是，某些地方这种分析并不起作用。比如，如果在其他的函数中访问这个变量，类型系统就无法知道这个函数何时会被调用，反而会以“乐观”的观点认为变量会被初始化。

```javascript
function foo() {
  let result: number
  if (someCondition()) {
    result = doSomeWork();
  } else {
    let temporaryWork = doSomeWork();
    temporaryWork *= 2;
    // 忘记给 result 赋值
  }

  printResult();

  function printResult() {
    console.log(result); // 这里不会报错
  }
}
```

虽然 TypeScript 5.7 仍然对可能被初始化的变量保持宽容，但是类型系统已经能够对那些完全未被初始化的变量进行报错了。

```javascript
function foo() {
  let result: number
  
  // 做一些操作，但是忘记给 result 赋值

  function printResult() {
    console.log(result); // 错误，变量 result 在赋值前使用
  }
}
```

感谢 Github 用户 [Zzzen](https://github.com/Zzzen) 贡献了这个 [PR](https://github.com/microsoft/TypeScript/pull/55887) 。

## 重写相对路径

一些工具和运行时允许用户“就地”执行 TypeScript 代码，这意味着无需构建步骤来生成 JavaScript 代码。比如， ts-node，tsx，Deno 以及 Bun 都支持直接运行 `.ts` 文件。最近， Node 开始研究通过 `--experimental-strip-types` （很快会取消实验标记）和 `--experimental-transform-types` 标记来提供该特性支持。这是极其方便的，因为这允许我们无需关心去重新运行一个构建任务，从而进行更快地迭代。

不过，使用这些模式时需要知道一些复杂性。为了最大限度地兼容所有的这些工具，一个被就地导入的 TypeScript 文件**必须**在处于运行时时导入合适的 TypeScript 扩展名。比如，为了导入一个名为 `foo.ts` 的文件，我们必须在 Node 的实验性支持开启的情况下编写如下的代码：

```javascript
// main.ts

import * as foo from "./foo.ts"; // <- 这里需要导入 ./foo.ts 而不是 ./foo.js
```

通常情况下，如果我们这样做的话 TypeScript 会报告一个错误，因为 TypeScript 期待我们导入的是输出文件。由于一些工具确实允许 `.ts` 导入， TypeScript 在过去的一段时间内已经支持通过一个名为 `--allowImportingTsExtensions` 的选项来支持这种导入风格了。这看起来很好，但是如果我们需要的是生成的 `.js` 文件而不是 `.ts` 文件会发生什么情况？这对需要能够只分发 `.js` 文件的库作者来说是一个需求，但目前为止， TypeScript 已经避免重写任何路径。

为了支持这个设想，我们添加了一个新的编译器选项，名为 `--rewriteRelativeImportExtensions` 。当一个导入路径为相对路径（以 `./` 和 `../` 开头），并以一个 TypeScript 扩展名（`.ts` ， `.tsx` ， `.mts` ， `.cts` ），并且不是一个声明文件时，编译器会把该路径重写为对应的 JavaScript 扩展名（ `.js` ， `.jsx` ， `.mjs` ， .`cjs`）。

```javascript
// 开启 --rewriteRelativeImportExtensions

// 这些路径会被重写
import * as foo from "./foo.ts";
import * as bar from "../someFolder/bar.mts";


// 这些在任何情况下都不会被重写
import * as a from "./foo";
import * as b from "some-package/file.ts";
import * as c from "@some-scope/some-package/file.ts";
import * as d from "#/file.ts";
import * as e from "./file.js";
```

这允许我们编写可以就地运行的 TypeScript 代码，然后在准备好时将其编译成 JavaScript 。

现在，我们注意到 TypeScript 通常会避免重写路径，这是有一些原因的，不过最明显的原因是动态导入。如果一个开发者编写了如下的代码，处理 `import` 收到的路径并不是一件容易的事。实际上，我们不可能去覆盖任何项目依赖的 `import` 行为。

```javascript
function getPath() {
  if (Math.random() < 0.5) {
    return "./foo.ts";
  } else {
    return "./foo.js";
  }
}

let myImport = await import(getPath());
```

另一个问题是（就如上面所示）只有相对路径会被重写，这种重写是“天真地”。这意味着任何依赖 TypeScript 的 `baseUrl` 和 `paths` 的路径都不会被重写。

```json
{
  "compilerOptions": {
    "module": "nodenext",
    // ...
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

```javascript
// 不会被转化
import * as utilities from "@/utilities.ts";
```

任何通过 `package.json` 的 `exports` 和 `imports` 字段解析路径也不会。

```json
{
  "name": "my-package",
  "imports": {
    "#root/*": "./dist/*"
  }
}
```

```javascript
// 不会被转化
import * as utilities from "#root/utilities.ts";
```

因此，如果你使用了带有多个相互引用的包的工作区风格的项目布局，你可能需要使用带有 [scoped custom conditions](https://nodejs.org/api/packages.html#resolving-user-conditions) 的 [conditional exports](https://nodejs.org/api/packages.html#conditional-exports) 来使其正常工作：

```json
{
  "name": "my-package",
  "exports": {
    ".": {
      "@my-package/development": "./src/index.ts",
      "import": "./lib/index.js"
    },
    "./*": {
      "@my-package/development": "./src/*.ts",
      "import": "./lib/*.js"
    }
  }
}
```

任何时候只要你想导入 `.ts` 文件，你可以执行 `node --conditions=@my-package/development` 。

注意我们为条件 `@my-package/development` 使用的“命名空间”和“范围”。这是一个临时性的解决方案，可以避免可能使用 `development` 条件下的依赖产生的冲突。如每个人都在他们的包中使用 `development` ，那么解析一个 `.ts` 文件的解析过程不一定能正常工具。这个理念和 Colin McDonnell 的 [Live types in a TypeScript monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo#:~:text=custom%20conditions) 以及 [tshy’s guidance for loading from source](https://github.com/isaacs/tshy#loading-from-source) 文章所描述的相似。

更多关于这个特性运作的具体细节，可以阅读此处 [PR](https://github.com/microsoft/TypeScript/pull/59767) 。

## 支持 --target es2024 和 --lib es2024

TypeScript 5.7 现在支持 `--target es2024` 选项，这样用户就可以将目标切到 ECMAScript 2024 运行时。这个 target 主要是指定了 `--lib es2024` 选项，它包含了许多特性，比如 `SharedArrayBuffer` 和 `ArrayBuffer` ， `Object.groupBy` ， `Map.groupBy` ， `Promise.withResolvers` 等。 `Atomics.waitAsync` 也从 `--lib es2022` 移动到了 `--lib es2024` 。

注意作为变更的一部分的 `SharedArrayBuffer` 和 `ArrayBuffer` ，这两者现在有点不同。为了弥补差异以及保留底层的 buffer 类型，现在所有的 `TypedArrays` （比如 `Uint8Array` 以及其他）都是带泛型的。

```typescript
interface Uint8Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike> {
    // ...
}
```

每个 `TypedArray` 现在包含了一个名为 `TArrayBuffer` 的类型参数，尽管这个类型参数有一个默认的类型，即我们可以继续使用 `Int32Array` 而不用显式地使用 `Int32Array<ArrayBufferLike>` 。

如果你遇到了任何关于这个更新的问题，你可能需要更新 `@types/node` 包。

感谢 [Kenta Moriuchi](https://github.com/petamoriken) 贡献了绝大部分的[工作](https://github.com/microsoft/TypeScript/pull/58573)。

## 搜索祖先配置文件的项目所有权

当一个 TypeScript 文件由一个编辑器使用 TSServer 加载（比如 Visual Studio 或者 VS Code）时，编辑器将会尝试去寻找拥有该文件的相关的 `tsconfig.json` 文件。为了实现它，程序需要沿着编辑文件的位置从目录树一直往上查找任何名为 `tsconfig.json` 的文件。

先前，这个搜索会在找到第一个 `tsconfig.json` 文件的时候停止。然而，想象一下如下的项目结构：

```text
project/
├── src/
│   ├── foo.ts
│   ├── foo-test.ts
│   ├── tsconfig.json
│   └── tsconfig.test.json
└── tsconfig.json
```

这个结构中，我们的想法是 `src/tsconfig.json` 为项目的“主要”配置文件， `src/tsconfig.test.json` 为执行测试的配置文件。

```json
// src/tsconfig.json
{
  "compilerOptions": {
    "outDir": "../dist"
  },
  "exclude": ["**/*.test.ts"]
}
```

```json
// src/tsconfig.test.json
{
  "compilerOptions": {
    "outDir": "../dist/test"
  },
  "include": ["**/*.test.ts"],
  "references": [
    { "path": "./tsconfig.json" }
  ]
}
```

```json
// tsconfig.json
{
  // 这是一个工具区风格或者叫解决方案风格的 tsconfig 。
  // 它不指定任何的文件，而是只引用所有实际的项目。
  "files": [],
  "references": [
    { "path": "./src/tsconfig.json" },
    { "path": "./src/tsconfig.test.json" },
  ]
}
```

这里的问题是当编辑 `foo-test.ts` 时，编辑器会将 `project/src/tsconfig.json` 当做“拥有”该文件的配置文件，但是这却不是我们想要的。如果在此时就停止向上查找的话，这可能不能让人满意。先前避免这个问题的唯一的方式是将 `src/tsconfig.json` 重命名为类似 `src/tsconfig.src.json` 这样的命名，这样所有的文件就会匹配到顶层的引用了所有可能项目的 `tsconfig.json` 文件。

```json
project/
├── src/
│   ├── foo.ts
│   ├── foo-test.ts
│   ├── tsconfig.src.json
│   └── tsconfig.test.json
└── tsconfig.json
```

## 为组合项目的编辑提供更快地项目所有权检查。

想象一下有一个如下结构的巨大代码库：

```text
packages
├── graphics/
│   ├── tsconfig.json
│   └── src/
│       └── ...
├── sound/
│   ├── tsconfig.json
│   └── src/
│       └── ...
├── networking/
│   ├── tsconfig.json
│   └── src/
│       └── ...
├── input/
│   ├── tsconfig.json
│   └── src/
│       └── ...
└── app/
    ├── tsconfig.json
    ├── some-script.js
    └── src/
        └── ...
```

每个在 `packages` 下的文件夹都是一个单独的 TypeScript 项目， `app` 文件夹为主项目，它依赖所有其他的项目。

```json
// app/tsconfig.json
{
  "compilerOptions": {
    // ...
  },
  "include": ["src"],
  "references": [
    { "path": "../graphics/tsconfig.json" },
    { "path": "../sound/tsconfig.json" },
    { "path": "../networking/tsconfig.json" },
    { "path": "../input/tsconfig.json" }
  ]
}
```

现在请注意在 `app` 文件夹下有一个 `some-script.js` 的文件。当我们在编辑器中打开这个文件时，TypeScript 语言服务（它也可以处理 JavaScript 文件的编辑体验）不得不去弄清文件属于哪个项目，只有这样才能应用正确的设置。

在这种情况下，最近的 `tsconfig.json` 文件不包含 `some-script.js` 文件，但是 TypeScript 仍会去询问“ `app/tsconfig.json` 引用的项目是否有一个包含了 `some-script` 文件？”。为了实现它，先前 TypeScript 会一个接一个地加载每个项目，在找到一个包含 `some-script.js` 文件的项目后立即停止。即使 `some-script.js` 不包含在根文件集合中， TypeScript 仍会去解析项目内的所有文件，因为某些根文件集合可能仍然间接引用了 `some-script.js` 。

随着时间的推移我们发现这个行为在一些大型代码库中造成了极端且不可预测的行为。开发者打开了一些杂散的脚本文件，然后发现这些文件需要等待整个代码库加载。

万幸的是，被另一个项目（非工作区）引用的项目必须开启一个名为 `composite` 的标志，它强制执行一条规则，即必须预先知道所有的输入源文件。所以当探测一个 `composite` 项目时， TypeScript 5.7 将只检查该文件是否属于该项目的根文件集合。这可以避免这种常见的最坏的情况的行为。

更多信息可以查看该 [PR](https://github.com/microsoft/TypeScript/pull/59688) 。

## --module nodenext 下合法的 JSON 导入

当在 `--module nodenext` 下导入一个 `.json` 文件时， TypeScript 现在将会强制某些规则来防止运行时错误。

其一是任何 JSON 文件导入都需要包含一个 `type: "json"` 的导入属性。

```typescript
import myConfig from "./myConfig.json";
//                   ~~~~~~~~~~~~~~~~~
// ❌ --module nodenext 下导入 JSON 必须显式指定 type: "json"

import myConfig from "./myConfig.json" with { type: "json" };
//                                          ^^^^^^^^^^^^^^^^
// ✅ 正确
```

在这个验证规则的上层， TypeScript 将不会生成“命名”导出，一个 JSON 导入的内容只能通过默认属性来获取。

```typescript
// ✅ 正确:
import myConfigA from "./myConfig.json" with { type: "json" };
let version = myConfigA.version;

///////////

import * as myConfigB from "./myConfig.json" with { type: "json" };

// ❌ 错误:
let version = myConfig.version;

// ✅ 正确:
let version = myConfig.default.version;
```

更多变更请查看此 [PR](https://github.com/microsoft/TypeScript/pull/60019) 。

## 在 Node 中支持 V8 编译缓存

Node 22 支持了一个名为 [module.enableCompileCache()](https://github.com/nodejs/node/pull/54501) 的新 API 。这个 API 允许工作执行完第一次后在运行时重用一些已完成的解析和编译工作。

TypeScript 5.7 现在利用了此 API ，所以能更快地开始工作。在我们的某些测试中，我们发现在执行 `tsc --version` 时有大约 2.5 倍的速度提升。

```text
Benchmark 1: node ./built/local/_tsc.js --version (*without* caching)
  Time (mean ± σ):     122.2 ms ±   1.5 ms    [User: 101.7 ms, System: 13.0 ms]
  Range (min … max):   119.3 ms … 132.3 ms    200 runs
 
Benchmark 2: node ./built/local/tsc.js --version  (*with* caching)
  Time (mean ± σ):      48.4 ms ±   1.0 ms    [User: 34.0 ms, System: 11.1 ms]
  Range (min … max):    45.7 ms …  52.8 ms    200 runs
 
Summary
  node ./built/local/tsc.js --version ran
    2.52 ± 0.06 times faster than node ./built/local/_tsc.js --version
```

更多信息查看此 [PR](https://github.com/microsoft/TypeScript/pull/59720) 。

## 需要注意的行为变更

### lib.d.ts

详情请查看[此处](https://github.com/microsoft/TypeScript/pull/60061)。

### TypedArrays 现在是 ArrayBufferLike 的通用版本

在 ECMAScript 2024 中， `ShareArrayBuffer` 和 `ArrayBuffer` 的类型有略微不同。为了弥补差异以及保留底层的 `buffer` 类型，现在所有的 `TypedArrays` （比如 `Uint8Array` 以及其他）都是带泛型的。

```typescript
interface Uint8Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike> {
  // ...
}
```

每个 `TypedArray` 现在包含了一个名为 `TArrayBuffer` 的类型参数，尽管这个类型参数有一个默认的类型，即我们可以继续使用 `Int32Array` 而不用显式地使用 `Int32Array<ArrayBufferLike>` 。

如果你遇到了任何关于这个更新的问题，比如：

```text
error TS2322: Type 'Buffer' is not assignable to type 'Uint8Array<ArrayBufferLike>'.
error TS2345: Argument of type 'Buffer' is not assignable to parameter of type 'Uint8Array<ArrayBufferLike>'.
error TS2345: Argument of type 'ArrayBufferLike' is not assignable to parameter of type 'ArrayBuffer'.
error TS2345: Argument of type 'Buffer' is not assignable to parameter of type 'string | ArrayBufferView | Stream | Iterable<string | ArrayBufferView> | AsyncIterable<string | ArrayBufferView>'.
```

你可能需要更新 `@types/node` 包。

可以在此 [PR](https://github.com/microsoft/TypeScript/pull/59417) 上阅读关于该变更的具体内容。

### 为类中的非字面方法名创建索引签名

TypeScript 现在对类中的方法会有更加一致的行为，这也包括通过非字面的计算属性名称定义的方法。比如：

```typescript
declare const symbolMethodName: symbol;

export class A {
  [symbolMethodName]() { return 1 };
}
```

先前 TypeScript 只会以类似下面的方式展示这个类：

```typescript
export class A {
}
```

也就是说，从类型系统的角度看， `[symbolMethodName]` 对 `A` 的类型没有任何贡献。

TypeScript 5.7 现在会更有意义地展示 `[symbolMethodName]() {}` 方法，并生成一个所以签名。因此，上面提及的代码会被解释为类似如下的代码：

```typescript
export class A {
  [x: symbol]: () => number;
}
```

这个特性提供了与字面对象中的属性和方法一致的行为。

更多信息查看此 [PR](https://github.com/microsoft/TypeScript/pull/59860) 。

### 对返回 null 和 undefined 的函数上提示更多隐式 any 错误

当一个函数表达式通过一个泛型类型签名返回的类型进行上下文类型化时， TypeScript 现在会适当地在 `noImplicitAny` 下提供一个隐式 `any` 错误，但在 `strictNullChecks` 下则不会。

```typescript
declare var p: Promise<number>;
const p2 = p.catch(() => null);
//                 ~~~~~~~~~~
// error TS7011: Function expression, which lacks return-type annotation, implicitly has an 'any' return type.
// 缺乏返回类型注释的函数默认有一个隐式的 any 返回类型
```