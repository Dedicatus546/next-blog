---
title: TypeScript 5.2（译）
tags:
  - TypeScript
  - JavaScript
categories:
  - 翻译
key: 1696905097date: 2023-10-10 10:31:37
updated: 2023-10-10 10:31:37
---


# 前言

原文地址：[Announcing TypeScript 5.2](https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/)

<!-- more -->

# 正文

今天我们激动地宣布：Typescript 5.2 正式发布。

如果你还不熟悉 TypeScript 的话，可以简单地理解为， TypeScript 是一门建立在 JavaScript 上的语言，TypeScript 通过添加类型语法来进行类型检查。TypeScript 提供的类型描述了程序的一些细节，然后在 TypeScript 编译之前根据这些类型进行检查以捕获可能的拼写错误，逻辑 BUG 等等。 TypeScript 还能根据这些类型来提供编辑器工具，比如代码完成，代码重构等等。实际上，如果你使用像 VS 或者 VS Code 这样的编辑器， TypeScript 已经提供了这种体验。你可以阅读关于 TypeScript 的文档 [https://typescriptlang.org](https://typescriptlang.org) 来了解更多信息。

为了开始使用 TypeScript ，可以通过 [NuGet](https://www.nuget.org/packages/Microsoft.TypeScript.MSBuild) 获取，或者通过执行如下的 npm 命令：

```cmd
npm install -D typescript
```

以下是 TypeScript 5.2 新增的功能列表！

- [ using 声明和显示的资源管理](#using-声明和显示的资源管理)
- [装饰器元数据](#装饰器元数据)
- [具名和匿名的元组元素](#具名和匿名的元组元素)
- [为联合数组提供更简单的方法用例](#为联合数组提供更简单的方法用例)
- [数组复制方法](#数组复制方法)
- [ WeakMap 和 WeakSet 支持 symbol 作为键值](#weakmap-和-weakset-支持-symbol-作为键值)
- [仅类型导入支持文件扩展名](#仅类型导入支持文件扩展名)
- [对象成员支持自动添加分号](#对象成员支持自动添加分号)
- [内联变量操作重构](#内联变量操作重构)
- [可点击的嵌入参数提示](#可点击的嵌入参数提示)
- [优化正在进行中的类型兼容检查](#优化正在进行中的类型兼容检查)
- [破坏性变更和正确性修复](#破坏性变更和正确性修复)

## `using` 声明和显示的资源管理

TypeScript 5.2 为 ECMAScript 中即将到来的[显式资源管理](https://github.com/tc39/proposal-explicit-resource-management)特性提供了支持。我们可以探讨下该特性的一些动机以及去理解该特性给我们带来了什么。

在创建一个对象之后，需要去做一些“清理”的操作是很常见的。比如，你可能需要去关闭网络连接，删除临时的文件，或者只是释放一些内存。

我们可以假设有一个创建临时文件的函数，这个函数通过操作来读取和写入文件，然后关闭文件，删除它。

```javascript
import * as fs from "fs";

export function doSomeWork() {
  const path = ".some_temp_file";
  const file = fs.openSync(path, "w+");

  // 使用这个文件...

  // 关闭文件，然后删掉它
  fs.closeSync(file);
  fs.unlinkSync(path);
}
```

这个过程没什么问题，但如果我们想提前退出的话会发生什么？

```javascript
export function doSomeWork() {
  const path = ".some_temp_file";
  const file = fs.openSync(path, "w+");

  // 使用文件...
  if (someCondition()) {
    // 额外的工作...

    // 关闭文件然后删除它
    fs.closeSync(file);
    fs.unlinkSync(path);
    return;
  }

  // 关闭文件然后删除它
  fs.closeSync(file);
  fs.unlinkSync(path);
}
```

我们会发现一些容易忘记的重复的清理操作。并且我们也不能保证在抛出错误时也能关闭以及删除文件。这可以通过包裹 `try/finally` 块来解决。

```javascript
export function doSomeWork() {
  const path = ".some_temp_file";
  const file = fs.openSync(path, "w+");

  try {
      // 使用文件...

    if (someCondition()) {
      // 额外的工作...
      return;
    }
  }
  finally {
    // 关闭文件然后删除它
    fs.closeSync(file);
    fs.unlinkSync(path);
  }
}
```

虽然这样写程序的健壮性更好，但是它往代码中添加了一些“噪音”。如果我们开始在 `finally` 块中添加更多的清理逻辑，很容易被其他部分误伤。比如，阻止其他资源释放引发的异常。这就是[显式资源管理](https://github.com/tc39/proposal-explicit-resource-management)提案想要解决的问题。该提案的关键点是以一种主流的思想来支持资源清理，即我们尝试处理的清理工作。

因此，我们先添加了一个内置的名叫 `Symbol.dispose` 的 symbol 变量，然后我们创建一个带有 `Symbol.dispose` 方法的对象。方便起见， TypeScript 定义了一个新的全局类型 `Disposable` 来描述这种情况。

```typescript
class TempFile implements Disposable {
  #path: string;
  #handle: number;

  constructor(path: string) {
    this.#path = path;
    this.#handle = fs.openSync(path, "w+");
  }

  // 其他方法

  [Symbol.dispose]() {
    // 关闭文件然后删除 它
    fs.closeSync(this.#handle);
    fs.unlinkSync(this.#path);
  }
}
```

之后我们就可以调用这个方法了

```typescript
export function doSomeWork() {
  const file = new TempFile(".some_temp_file");

  try {
    // ...
  } finally {
    file[Symbol.dispose]();
  }
}
```

把清理操作移动到 `TempFile` 类自身中并没有给我们带来便利，我们基本上只是把清理操作从 `finally` 块中移动到特定的方法中，这一直都是可以实现的。但是这个方法有一个众所周知的“名字”，这意味着 JavaScript 可以在它的基础上构建其他的特性。

因此带来的第一个特性点为： `using` 声明。 `using` 是一个新的关键字，可以让我们定义新的固定绑定，有点类似 `const` ，不过该关键字的不同之处在于，通过 `using` 定义的变量会在它的作用域结束后调用它的 `Symbol.dispose` 方法。

所以我们可以简单地编写出如下的代码：

```typescript
export function doSomeWork() {
  using file = new TempFile(".some_temp_file");

  // 使用文件...

  if (someCondition()) {
    // 更多的操作...
    return;
  }
}
```

可以发现上面的代码中没有使用 `try/finally` 块，至少我们没有看见。从功能上讲，这正是 `using` 声明为我们做的事情，但我们无需去处理它。

你可能会觉得熟悉，比如 C# 中的 [using 声明](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/proposals/csharp-8.0/using)， Python 中的 [with 语句](https://docs.python.org/3/reference/compound_stmts.html#the-with-statement)，以及 Java 中的 [try-with-resource 声明](https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html)，这些和 JavaScript 的新 `using` 关键字类似，都提供了一种相似的显式的方式来执行一个作用域结束对象的“销毁”程序。

`using` 声明会在包含它们的作用域的最后或者在“提前返回”，比如一个返回语句或者错误抛出的时候执行清理。它们的销毁顺序也以类似栈的结构一样，遵循先进后出的方式。

```typescript
function loggy(id: string): Disposable {
  console.log(`Creating ${id}`);

  return {
    [Symbol.dispose]() {
      console.log(`Disposing ${id}`);
    }
  }
}

function func() {
  using a = loggy("a");
  using b = loggy("b");
  {
    using c = loggy("c");
    using d = loggy("d");
  }
  using e = loggy("e");
  return;

  // 不可达
  // 不会创建，也不会销毁
  using f = loggy("f");
}

func();
// Creating a
// Creating b
// Creating c
// Creating d
// Disposing d
// Disposing c
// Creating e
// Disposing e
// Disposing b
// Disposing a
```

`using` 声明支持异常抛出情况；如果一个错误被抛出，它会在销毁执行之后被再次抛出。另一方面，你的函数体可能按预期执行，但是 `Symbol.dispose` 函数抛出了异常，这种情况下，异常同样会被重新抛出。

但是如果两个逻辑，即一个在销毁之前，一个在销毁过程中的时候抛出了异常会发生什么？对于这些情况，引入 `SuppressedError` 类，它是 `Error` 的一个新的子类。它有一个 `suppressed` 属性，这个属性保存了最后一次抛出的错误，它还有一个 `error` 属性，保存了最近抛出的错误。

```javascript
class ErrorA extends Error {
  name = "ErrorA";
}
class ErrorB extends Error {
  name = "ErrorB";
}

function throwy(id: string) {
  return {
    [Symbol.dispose]() {
      throw new ErrorA(`Error from ${id}`);
    }
  };
}

function func() {
  using a = throwy("a");
  throw new ErrorB("oops!")
}

try {
  func();
}
catch (e: any) {
  console.log(e.name); // SuppressedError
  console.log(e.message); // An error was suppressed during disposal.

  console.log(e.error.name); // ErrorA
  console.log(e.error.message); // Error from a

  console.log(e.suppressed.name); // ErrorB
  console.log(e.suppressed.message); // oops!
}
```

你可能注意到了例子中使用的是同步的方法。然而，许多资源的销毁涉及异步操作，因此我们需要在继续执行其他代码之前等待这些操作完成。

这就是为什么定义了一个新的 `Symbol.asyncDispose` 函数，这就是我们展示的下一个特性点 —— `await using` 声明。它和 `using` 声明类似，但是关键的是它会查找需要 `await` 的销毁程序。它使用了一个不同的名为 `Symbol.asyncDispose` 方法，尽管它同样能使用 `Symbol.dispose` 来处理任何事情。方便起见， TypeScript 也引入了一个新的全局类型 `AsyncDisposable` ，用来描述任何带有一个异步销毁方法的对象。

```javascript
async function doWork() {
  // Do fake work for half a second.
  await new Promise(resolve => setTimeout(resolve, 500));
}

function loggy(id: string): AsyncDisposable {
  console.log(`Constructing ${id}`);
  return {
    async [Symbol.asyncDispose]() {
      console.log(`Disposing (async) ${id}`);
      await doWork();
    },
  }
}

async function func() {
  await using a = loggy("a");
  await using b = loggy("b");
  {
    await using c = loggy("c");
    await using d = loggy("d");
  }
  await using e = loggy("e");
  return;

  // 不可达
  // 不会创建，也不会销毁
  await using f = loggy("f");
}

func();
// Constructing a
// Constructing b
// Constructing c
// Constructing d
// Disposing (async) d
// Disposing (async) c
// Constructing e
// Disposing (async) e
// Disposing (async) b
// Disposing (async) a
```

通过 `Disposable` 和 `AsyncDisposable` 来定义类型可以让你的代码和其他销毁逻辑工作起来更简单。实际上，许多存在的类型都自然地存在一个 `dispose` 或者 `close` 方法。比如， VS Code 的接口甚至定义了它们自己的 [Disposable 接口](https://code.visualstudio.com/api/references/vscode-api#Disposable)。在浏览器中，或者诸如 Node.js ， Deno 以及 Bun 之类的运行时中，接口可能都会选择为存在清理方法的对象使用 `Symbol.dispose` 和 `Symbol.asyncDispos`e 。比如文件句柄，连接等等。

目前看来这些特性或许对类库很有帮助，但对你的场景来说可能有点重。如果你正在执行许多的临时清理操作，创建一个新的类型可能会引入过度抽象和关于最佳实践的问题。比如，说回之前 `TempFile` 的例子：

```typescript
class TempFile implements Disposable {
  #path: string;
  #handle: number;

  constructor(path: string) {
    this.#path = path;
    this.#handle = fs.openSync(path, "w+");
  }

  // 其他方法

  [Symbol.dispose]() {
    // 关闭文件然后删除它
    fs.closeSync(this.#handle);
    fs.unlinkSync(this.#path);
  }
}

export function doSomeWork() {
  using file = new TempFile(".some_temp_file");

  // 使用文件...

  if (someCondition()) {
      // 其他的操作...
      return;
  }
}
```

我们想要的只是记得去调用两个函数，但这样的写法是最佳的方式吗？我们应该在构造函数中调用 `openSync` 吗，还是说创建一个 `open` 方法，或者自己传入句柄，又或者我们应该为每个可能的需要执行的操作暴露一个方法？又或者我们只是需要把属性设置为公共的？

这也就是我们想说的第三个特性点， `DisposableStack` 和 `AsyncDisposableStack` 。这两个对象对于进行一次性清理以及任何数量的清理很有用。 `DisposableStack` 对象有几个方法来跟踪可销毁的对象，以及执行传入的函数来随意执行清理操作。我们也可以把它分配给 `using` 变量，因为它们自身也是可销毁的。所以我们可以把原始的例子写成：

```javascript
function doSomeWork() {
  const path = ".some_temp_file";
  const file = fs.openSync(path, "w+");

  using cleanup = new DisposableStack();
  cleanup.defer(() => {
    fs.closeSync(file);
    fs.unlinkSync(path);
  });

  // 使用文件...

  if (someCondition()) {
      // 其他的操作...
      return;
  }

  // ...
}
```

在上面， `defer` 方法接受一个回调，一旦开始处理清理过程，回调就会执行。通常， `defer` （以及 `DisposableStack` 的 `use` 和 `adopt` 等其他方法）应该在创建完资源之后立即调用。顾名思义， `DisposableStack` 像栈一样按照先进后出的顺序来处理跟踪的所有操作，因此在创建值之后立即延迟调用有助于避免奇怪的依赖问题。 `AsyncDisposableStack` 和 `DisposableStack` 类似，但可以跟踪异步的函数以及 `AsyncDisposable` 对象，并且它自身也是一个 `AsyncDisposable` 对象。

`defer` 方法在很多方面和 [Go](https://go.dev/tour/flowcontrol/12) ， [Swift](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/statements/#Defer-Statement) ， [Zig](https://ziglang.org/documentation/master/#defer) ， [Odin](https://odin-lang.org/docs/overview/#defer-statement) 等等的 `defer` 关键字类似，其中的约定应该相似。

由于这个特性是最近才有的，因此大多数的运行时本身并不支持它。要运行它，你需要以下的运行时垫片。

- `Symbol.dispose`
- `Symbol.asyncDispose`
- `DisposableStack`
- `AsyncDisposableStack`
- `SuppressedError`

然而，如果你只对 `using` 和 `await using` 感兴趣，那么你应该只需对内置的 symbol 对象添加垫片。像下面这样简单地处理应该适用于大部分例子

```javascript
Symbol.dispose ??= Symbol("Symbol.dispose");
Symbol.asyncDispose ??= Symbol("Symbol.asyncDispose");
```

你也需要把你的编译目标设置为 `es2022` 或者该版本以上，然后配置你的 lib 设置项，添加 `esnext` 或者 `esnext.disposable` 选项。

```json
{
  "compilerOptions": {
    "target": "es2022",
    "lib": ["es2022", "esnext.disposable", "dom"]
  }
}
```

有关该特性的更多信息，可以在该 [PR](https://github.com/microsoft/TypeScript/pull/54505) 中查看上查看

## 装饰器元数据

TypeScript 5.2 实现了即将到来的 ECMAScript 特性之一，[装饰器元数据](https://github.com/tc39/proposal-decorator-metadata)。

该特性的关键点是让任何附带了装饰器或者内部使用了装饰器的类更加简单地在去创建和使用元数据。

每当使用装饰器函数，现在它们都可以放问其上下文对象上的一个新的 `metadata` 属性。 `metadata` 属性只是保存了一个简单的对象。由于 JavaScript 可以让我们随意地添加属性，所以它可以被用作一个每个装饰器更新的字典。或者，由于每个 `metadata` 对象在类的每个修饰部分都是相同的，所以它可以当作一个 `Map` 的键。在类上或者类内的所有的装饰器执行之后，可以通过类的 `Symbol.metadata` 属性来获取这个对象。

```typescript
interface Context {
  name: string;
  metadata: Record;
}

function setMetadata(_target: any, context: Context) {
  context.metadata[context.name] = true;
}

class SomeClass {
  @setMetadata
  foo = 123;

  @setMetadata
  accessor bar = "hello!";

  @setMetadata
  baz() { }
}

const ourMetadata = SomeClass[Symbol.metadata];

console.log(JSON.stringify(ourMetadata));
// { "bar": true, "baz": true, "foo": true }
```

这对一些不同的场景很有用。许多用例可能会获取元数据，比如调试，序列化，或者通过装饰器来运行依赖注入。由于每个被装饰类都会生成元数据对象，框架可以在私底下把他们当作一个 `Map` 或者 `WeakMap` 的键，或者根据需要来附加一些属性。

举个例子，假设我们想要使用装饰器来跟踪在使用 `JSON.stringify` 的时哪个属性或者访问器是可序列化，代码如下：

```typescript
import { serialize, jsonify } from "./serializer";

class Person {
  firstName: string;
  lastName: string;

  @serialize
  age: number

  @serialize
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  toJSON() {
    return jsonify(this)
  }

  constructor(firstName: string, lastName: string, age: number) {
    // ...
  }
}
```

在上面的代码中，我么只希望 `age` 和 `fullName` 字段应该被序列化，因为它们使用了 `@serialize` 装饰器。我们定义了一个 `toJSON` 的方法来达到这个目的，但它只是调用了 `jsonify` 函数，他只会使用 `@serialize` 装饰的元数据信息。

下面的例子展示了 `./serialize.ts` 的可能的定义

```typescript
const serializables = Symbol();

type Context =
  | ClassAccessorDecoratorContext
  | ClassGetterDecoratorContext
  | ClassFieldDecoratorContext
  ;

export function serialize(_target: any, context: Context): void {
  if (context.static || context.private) {
    throw new Error("Can only serialize public instance members.")
  }
  if (typeof context.name === "symbol") {
    throw new Error("Cannot serialize symbol-named properties.");
  }

  const propNames = (context.metadata[serializables] as string[] | undefined) ??= [];
  propNames.push(context.name);
}

export function jsonify(instance: object): string {
  const metadata = instance.constructor[Symbol.metadata];
  const propNames = metadata?.[serializables] as string[] | undefined;
  if (!propNames) {
    throw new Error("No members marked with @serialize.");
  }

  const pairStrings = propNames.map(key => {
    const strKey = JSON.stringify(key);
    const strValue = JSON.stringify((instance as any)[key]);
    return `${strKey}: ${strValue}`;
  });

  return `{ ${pairStrings.join(", ")} }`;
}
```

该模块有一个本地的名为 `serializables` 的 symbol 变量，用于存储和取回被 `@serializable` 装饰的属性的名字。每当调用 `@serializable` 时，它就会在元数据对象中保存了一个包含这些属性的名的列表。当调用 `jsonify` 时，会从元数据对象中去除该属性名列表，并用于从实例上获取对应的值，最后序列化这些属性名以及对应的值。

从技术上说，使用一个 symbol 变量可以让其他人获取到这个数据。或者使用一个键为元数据对象的 `WeakMap` 来作为一个替代的方案。这可以让数据保持私有，并且在此情况下恰好使用更少地类型断言，但是在其他方面是相似的。

```typescript
const serializables = new WeakMap();

type Context =
  | ClassAccessorDecoratorContext
  | ClassGetterDecoratorContext
  | ClassFieldDecoratorContext
  ;

export function serialize(_target: any, context: Context): void {
  if (context.static || context.private) {
    throw new Error("Can only serialize public instance members.")
  }
  if (typeof context.name !== "string") {
    throw new Error("Can only serialize string properties.");
  }

  let propNames = serializables.get(context.metadata);
  if (propNames === undefined) {
    serializables.set(context.metadata, propNames = []);
  }
  propNames.push(context.name);
}

export function jsonify(instance: object): string {
  const metadata = instance.constructor[Symbol.metadata];
  const propNames = metadata && serializables.get(metadata);
  if (!propNames) {
    throw new Error("No members marked with @serialize.");
  }
  const pairStrings = propNames.map(key => {
    const strKey = JSON.stringify(key);
    const strValue = JSON.stringify((instance as any)[key]);
    return `${strKey}: ${strValue}`;
  });

  return `{ ${pairStrings.join(", ")} }`;
}
```

注意，这些实现没有处理子类和继承的情况。这留给你当作一个练习（你可能会发现一个更加简易的版本）。

由于这个特性还很新，许多运行时还没有原生地支持它。为了使用它，你需要为 `Symbol.metadata` 添加一个垫片。下面简单的实例可以应对大多数情况：

```typescript
Symbol.metadata ??= Symbol("Symbol.metadata");
```

你还需要把你的编译目标设置为 `es2022` 或者以上的版本，然后配置 lib 设置项，增加 `esnext` 或者 `esnext.decorators` 选项。

```json
{
  "compilerOptions": {
    "target": "es2022",
    "lib": ["es2022", "esnext.decorators", "dom"]
  }
}
```

感谢 [Oleksandr Tarasiuk](https://github.com/a-tarasyuk) 为 TypeScript 5.2 贡献了这个[装饰器元数据的实现](https://github.com/microsoft/TypeScript/pull/54657)

## 具名和匿名的元组元素

元组类型支持为每个元素使用可选的标签或者名称

```typescript
type Pair = [first: T, second: T];
```

这些标签不会更改你被允许的操作，它们只是为了更好的可读性以及更加便于工具。

然而， TypeScript 在先前有一条规则，即不允许元组混合和标记带有标签和不带标签的元素。换句话说，要么元组中的所有元素没有标签，要么元组中的所有元素都有一个标签。

```typescript
// ✅ 正确 - 不包含标签
type Pair1 = [T, T];

// ✅ 正确 - 都包含了标签
type Pair2 = [first: T, second: T];

// ❌ 先前版本报错
type Pair3 = [first: T, T];
//                         ~
// 元组元素要么都有名字，要么都没有名字
```

对于剩余的元素来说这是很恼人，我们需要强制添加一个标签，比如 `rest` 或者 `tail` 。

```typescript
// ❌ 先前版本报错
type TwoOrMore_A = [first: T, second: T, ...T[]];
//                                          ~~~~~~
// 元组元素要么都有名字，要么都没有名字

// ✅
type TwoOrMore_B = [first: T, second: T, rest: ...T[]];
```

这也意味着必须在类型系统内部强制执行这个限制，否则 TypeScript 会丢失这些标签。

```typescript
type HasLabels = [a: string, b: string];
type HasNoLabels = [number, number];
type Merged = [...HasNoLabels, ...HasLabels];
//   ^ [number, number, string, string]
//
//     在合并的时候丢失了 'a' 和 'b' 标签
```

在 TypeScript 5.2 要么都有要么都没有这个在元组上的限制被解除了。 TypeScript 现在可以在一个没有标签的元组中展开元组时保留展开元组的标签。

感谢 [Josh Goldberg](https://github.com/JoshuaKGoldberg) 和 [Mateusz Burzyński](https://github.com/Andarist) 合作解除了这个[限制](https://github.com/microsoft/TypeScript/pull/53356)。

## 为联合数组提供更简单的方法用例

在先前的版本的 TypeScript 中，调用联合数组类型的数组的方法可能会让人抓狂。

```typescript
declare let array: string[] | number[];

array.filter(x => !!x);
//    ~~~~~~ error!
// This expression is not callable.
//   Each member of the union type '...' has signatures,
//   but none of those signatures are compatible
//   with each other.
```

在上面的例子中， TypeScript 会尝试观察是否每个 filter 的版本能够兼容到 `string[]` 和 `number[]` 。在没有关联两者的策略下， TypeScript 会摊开双手说：我无法使它工作。

在 TypeScript 5.2 中，在放弃这些情况之前，并集数组类型的数组会被当作一个特殊的情况。每个成员元素类型会生成一个新的类型，然后在这个类型上执行方法。

拿上面的例子来说， `string[] | number[]` 会被转化为 `(string | number)[]` （或者 `Array<string | number>` ），然后在这个类型上执行 `filter` 方法。有一点需要注意的是， `filter` 方法会生成一个 `Array<string | number>` 类型而不是 `string[] | number[]` 。对于新产生的值来说，这样出错的风险比较小。

这意味着许多像 `filter` ， `find` ， `some` ， `every` 以及 `reduce` 方法在先前在联合数组类型的数组上不可调用的情况下都会变得可以调用。

你可以在这个 [PR](https://github.com/microsoft/TypeScript/pull/53489) 找到更多的实现细节。

## 数组复制方法

TypeScript 5.2 包括了 ECMAScript 关于“[通过拷贝改变数组](https://github.com/tc39/proposal-change-array-by-copy)”提案中添加的方法的定义。

虽然 JavaScript 的数组已经有一些很有用的方法，比如 `sort()` ， `splice()` 以及 `reverse()` ，但是这些方法会原地更新数组自身。通常，我们都是希望创建一个完全分离的数组，这样不会影响到原数组。为了实现它，你可以先使用 `slice()` 方法或者数组的展开方式来获得一个数组的拷贝副本，然后执行相关的操作。比如，你可以通过 `myArray.slice().reverse()` 来获取一个翻转的数组副本。

还有一种常见的情况，创建一个拷贝，但其实内部只有一个元素改变了，有很多种方式可以实现它，但最明显的一种方式需要多个语句：

```typescript
const copy = myArray.slice();
copy[someIndex] = updatedValue;
doSomething(copy);
```

或者下面这种意图不明显的方式：

```typescript
doSomething(myArray.map((value, index) => index === someIndex ? updatedValue : value));
```

对于这个相当常见的操作而言这两种方式都太麻烦了。这也就是为什么 JavaScript 添加了 4 个新的方式来执行对应相同的操作而不改变原始的数组，这四个方法为 `toSorted` ， `toSpliced` ， `toReversed` 以及 `with` 。前 3 个方法与其对应原地更新的方法执行相同的操作，但是会返回一个新的数组。 `with` 也会返回一个新的数组，但是只会更新一个元素（如同上面讨论的那样）

| 可变                                             | 拷贝                                                |
|------------------------------------------------|---------------------------------------------------|
| `myArray.reverse()`                            | `myArray.toReversed()`                            |
| `myArray.sort((a, b) => ...)`                  | `myArray.toSorted((a, b) => ...)`                 |
| `myArray.splice(start, deleteCount, ...items)` | `myArray.toSpliced(start, deleteCount, ...items)` |
| `myArray[index] = updatedValue`                | `myArray.with(index, updatedValue)`               |

注意拷贝版本的方法会始终创建一个新的数组，与可变版本的行为不一致。

这些方法不仅可在普通数组中使用，而且也能在类似 `Int32Array` ， `Unit8Array` 之类的 TypedArray 类型数组中使用。

感谢 [Carter Snook](https://github.com/sno2) 更新了这些声明[文件](https://github.com/microsoft/TypeScript/pull/51367)。

## `WeakMap` 和 `WeakSet` 支持 symbol 作为键值

symbol 变量现在可以在 `WeakMap` 和 `WeakSet` 中作为键，对应了 ECMAScript 自身添加的[特性](https://github.com/tc39/proposal-symbols-as-weakmap-keys)。


```typescript
const myWeakMap = new WeakMap();

const key = Symbol();
const someObject = { /*...*/ };

// 正常工作 ✅
myWeakMap.set(key, someObject);
myWeakMap.has(key);
```

[Leo Elmecker-Plakolm](https://github.com/leoelm) 代表 [Bloomberg](https://www.bloomberg.com/company/) 提供了这个[更新](https://github.com/microsoft/TypeScript/pull/54195)，由衷感谢他。

## 仅类型导入支持文件扩展名

TypeScript 现在支持在仅导入类型的导入语句中同时包括声明和文件扩展名。无论是否启用了 `allowImportingTsExtensions` 

这意味着现在你可以使用 `.ts` ， `.mts` ， `.cts` 以及 `.tsx` 文件扩展来编写 `import type` 语句。

```typescript
import type { JustAType } from "./justTypes.ts";

export function f(param: JustAType) {
  // ...
}
```

这也意味着在 TypeScript 和 JavaScript 中使用 JSDoc 通过 `import()` 导入的类型，也能使用这些扩展名。

```typescript
/**
 * @param {import("./justTypes.ts").JustAType} param
 */
export function f(param) {
  // ...
}
```

有关更多的细节，请查看这个 [PR](https://github.com/microsoft/TypeScript/pull/54746) 。

## 对象成员支持自动添加分号

当给一个对象添加新的属性的时候，很容易忘记添加分号。在以前，如果你忘记添加分号，然后使用自动完成功能的话， TypeScript 会困惑地给出糟糕的，不相关的自动完成的结果。

TypeScript 5.2 现在可以优雅地对缺少分号的对象成员进行自动完成。但是如果你只是跳过语法错误的话，还是会自动插入缺少的逗号。

![](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2023/06/comma-completions-5-2-beta.gif)

## 内联变量操作重构

TypeScript 5.2 现在重构了内联变量操作，该变量的所有使用的地方都会被内联。

![](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2023/06/inline-variable-5-2-beta.gif)

使用“内联变量”重构操作会消除该变量然后使用该变量的初始值来替换所有使用该变量的地方。注意这可能会造成在不同时机执行带来的初始值副作用的问题，副作用的次数却决于变量使用的次数。

更多的细节，查看实现的 [PR](https://github.com/microsoft/TypeScript/pull/54281) 。

## 可点击的嵌入参数提示

嵌入提示可以让我们一眼就了解相关的信息，即使它不存在我们的代码中，比如参数的名字，推断的类型等等。在 TypeScript 5.2 中，嵌入提示可以交互。比如，在 VS Code Insiders 中，现在你可以点击嵌入提示来跳转到相应参数的声明位置。

![](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2023/08/clickable-inlay-hints-5-2.gif)

更多的信息，你可以在这个 [PR](https://github.com/microsoft/TypeScript/pull/54734) 下粗略浏览该特性的实现。

## 优化正在进行中的类型兼容检查

由于 TypeScript 是一个结构化的类型系统，有时候类型就需要以成员的方式进行比较，然而，递归的类型会带来一些问题，比如：

```typescript
interface A {
  value: A;
  other: string;
}

interface B {
  value: B;
  other: number;
}
```

当检查类型 `A` 是否兼容类型 `B` 的时候， TypeScript 最终会检查 `A` 和 `B` 的 `value` 属性的类型是否兼容。在这种情况下，类型系统需要停止检查该成员，然后去检查其他的成员。为了实现它，类型系统不得不跟踪任何两个类型相关的时机。

先前的 TypeScript 已经通过堆结构来保存了类型对，然后通过迭代来确定这些类型是否相关。当堆比较浅时，没有什么问题，但当堆很深的时候，[问题](https://accidentallyquadratic.tumblr.com/)就来了。

在 TypeScript 5.2 中，使用一个简单的 `Set` 来协助跟踪这些信息。这种方式将使用 drizzle 库的报告测试用例花费的时间减少 33% 以上。

```text
Benchmark 1: old
  Time (mean ± σ):      3.115 s ±  0.067 s    [User: 4.403 s, System: 0.124 s]
  Range (min … max):    3.018 s …  3.196 s    10 runs

Benchmark 2: new
  Time (mean ± σ):      2.072 s ±  0.050 s    [User: 3.355 s, System: 0.135 s]
  Range (min … max):    1.985 s …  2.150 s    10 runs

Summary
  'new' ran
    1.50 ± 0.05 times faster than 'old'
```

在这个 [PR](https://github.com/microsoft/TypeScript/pull/55224) 查看更多的变更。

## 破坏性变更和正确性修复

TypeScript 尽力不引入不必要的破坏性变更，然而，我们必须偶尔进行修正和改进，以便更好地进行代码分析。

### lib.d.ts 变更

为 DOM 生成的类型可能对你的代码库会有影响。更多相关的信息请查看 [DOM 在 TypeScript 5.2 中的更新](https://github.com/microsoft/TypeScript/pull/54725)。

### labeledElementDeclarations 包含 undefined 元素。

为了支持混合使用带标签和不带标签的元素， TypeScript 的接口做了细微的改变。 `TupleType` 的 `labeledElementDeclarations` 属性的每个不带标签的元素的位置都可能为 `undefined` 。

```diff
  interface TupleType {
-   labeledElementDeclarations?: readonly (NamedTupleMember | ParameterDeclaration)[];
+   labeledElementDeclarations?: readonly (NamedTupleMember | ParameterDeclaration | undefined)[];
  }
```

### module 和 moduleResolution 选项必须在最近的 Node.js 设置下匹配

`--module` 和 `--moduleResolution` 选项都支持 `node16` 和 `nodenext` 值。这些实际上有效的“现代 Node.js ”的设置应该被用在最近的 Node.js 项目中。我们发现当这两个选项在是否使用 Node.js 的相关设置上出现不一致时，项目实际上是配置错误的。

在 TypeScript 5.2 中，当使用 `node16` 或则 `nodenext` 作为 `--module` 和 `--moduleResolution` 选项的值之一时， TypeScript 现在要求彼此要有相似的 Node.js 相关的设置。在设置出现分歧的情况下，你可能会收到以下的错误信息。

```text
Option 'moduleResolution' must be set to 'NodeNext' (or left unspecified) when option 'module' is set to 'NodeNext'.
```

或者

```text
Option 'module' must be set to 'Node16' when option 'moduleResolution' is set to 'Node16'.
```

所以例如 `--module esnext --moduleResolution node16` 这样的写法会报错，但你可能最好使用单独的 `--module nodenext` ，或者 `--module esnext --moduleResolution bundler` 。

在这个 [PR](https://github.com/microsoft/TypeScript/pull/54567) 了解更多的信息。

### 对合并的符号进行一致性的导出检查

当两个声明合并的时候，它们必须就是否一起导出达成一致。由于存在 bug ， TypeScript 错失了环境上下文中的特定情况，比如处于声明文件或者 `declare module` 块中。比如，下面的例子中，声明 `replaceInFile` 为一个导出的函数，然后声明为一个未导出的命名空间，这种情况不会报错。

```typescript
declare module 'replace-in-file' {
  export function replaceInFile(config: unknown): Promise;
  export {};

  namespace replaceInFile {
    export function sync(config: unknown): unknown[];
  }
}
```

在环境模块中，添加一个 `export { ... }` 或者一个类似 `export default ...` 的相似的构造会隐式地更改是否自动导出所有声明。 TypeScript 现在能更一致地识别到这些令人疑惑的语义，然后根据 `replaceInFile` 的所有声明必须和它们的修饰符达成一致的事实发出错误，这个错误内容如下：

```text
Individual declarations in merged declaration 'replaceInFile' must be all exported or all local.
```

更多的信息，在此 [PR](https://github.com/microsoft/TypeScript/pull/54659) 查看更改。

### 模块总是生成命名空间

TypeScript 的命名空间实际上是始于 `module` 关键字的，因为看起来 ECMAScript 最终可能会出于同样的目的来使用它。最初，这称之为“内部模块”，但它最终未进入 JavaScript 中。

很多年前（自从 2015 年 TypeScript 1.5 开始）， TypeScript 就支持 `namespace` 关键字来避免混淆。为了进一步推进这种方式，当生成声明文件的时候， TypeScript 5.2 总是会生成 `namespace` 关键字，代码看起来如下：

```typescript
module foo {
  export function f() {}
}
```

会生成如下的声明文件：

```typescript
declare namespace foo {
  function f(): void;
}
```

虽然这会不兼容非常非常多旧版本的 TypeScript ，但是我们认为这个影响是有限的。

注意，环境模块的声明如下所示：

```typescript
// UNAFFECTED
declare module "some-module-path" {
  // ...
}
```

这种方式不受影响。

这项[工作](https://github.com/microsoft/TypeScript/pull/54134)由 [Chi Leung](https://github.com/CC972) 代表 Bloomberg 提供。

# 后记

感觉最有意思的更新就是 using 关键字了，这个还是 ECMAScript 提供的特性， TypeScript 做了类型支持。

以及数组的拷贝版本的 API ，以前做一些不想更改原数组的操作都是要先 .slice() 来获取一个浅的副本再进行操作，现在可以说就是官方帮你实现了，可以写更少的代码了😂

其他的点大部分都是一些 UX 的点以及一些小更新了。

