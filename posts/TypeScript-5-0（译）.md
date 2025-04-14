---
title: TypeScript 5.0（译）
tags:
  - TypeScript
  - JavaScript
categories:
  - 翻译
key: 1685696755date: 2023-06-02 17:05:55
updated: 2023-06-02 17:05:55
---


# 前言

原文地址：[Announcing TypeScript 5.0](https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/)

<!-- more -->

# 正文

今天我们激动地宣布：Typescript 5.0 正式发布。

这个版本带来了许多的新特性，同时旨在让 TypeScript 更加轻量、简单，快速。我们实现了新的装饰器标准，添加了一些功能来更好地支持 ESM 模块下的 Node 项目和打包器项目，也为库的作者提供了新的方式来控制泛型推断，增强了 JSDoc 的功能性，简化了配置，同时也改进了许多其他地方。

如果你还不熟悉 TypeScript 的话，可以简单地理解为， TypeScript 是一门建立在 JavaScript 上的语言，通过添加类型语法来进行类型检查。类型检查可以帮助我们捕获常见的错误，大到逻辑错误，小到拼写错误。带有类型的 JavaScript 能够让我们构建更棒的工具，因为类型可以在你喜欢的编辑器中驱动代码完成，转到定义以及重构功能。实际上，如果你使用像 VS 或者 VS Code 这样的编辑器， TypeScript 早已提供了 JavaScript 体验。你可以阅读关于 TypeScript 的文档 [https://typescriptlang.org](https://typescriptlang.org) 来了解更多。

但如果你早已熟悉了 TypeScript ，不用担心， 5.0 版本不是一个破坏性的版本，你理解的任何知识仍然适用于 5.0 版本。虽然 TypeScript 5.0 包含了正确性的变更以及废弃了一些不常用的配置，但我们仍然相信许多的开发者能获得和之前版本一样的升级体验。

为了开始使用 TypeScript ，可以通过 [NuGet](https://www.nuget.org/packages/Microsoft.TypeScript.MSBuild) 获取，或者通过执行如下的 npm 命令

```cmd
npm install -D typescript
```

你可以按照[指示](https://code.visualstudio.com/docs/typescript/typescript-compiling#_using-the-workspace-version-of-typescript) 在 VS Code 中使用新版本的 TypeScript 。

下面是 TypeScript 5.0 的新特性列表

- 装饰器
- `const` 类型参数
- tsconfig.json 的 `extends` 支持多个配置文件
- 所有枚举都是联合枚举
- `--moduleResolution` 配置提供 `bundler` 值
- 自定义解析标志
- 新增 `verbatimModuleSyntax` 配置
- 支持 `export type *` 语法
- JSDoc 支持 `@satisfies`
- JSDoc 支持 `@overload`
- `--build` 下传递构建文件的特定标志
- 编辑器中忽略大小写的导入顺序
- 全面的 `switch/case` 完成功能
- 优化速度，内存，包大小
- 破坏性改变以及废弃项
- 下个版本计划？

## 对比 TypeScript 5.0 的 beta 版本和 RC 版本有什么新的地方？

自 beta 版本以来，TypeScript 5.0 有几个显著的改变。

一个新不同点是 TypeScript 允许在 `export` 或者 `export default` 前后使用[装饰器](https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#decorators)了。这个改变反映了 TC39 （ ECMAScript/JavaScript 的标准组织）内部的讨论和共识。

另一个不同点是 `moduleResolution` 配置的 `bundler` 值，当 `module` 设置为 `esnext` 时，这个选项才可以启用。这样做是为了确保输入文件内的 import 导入语句在打包器解析他们之前不被转化为 require 调用，无论打包器或者加载器是否遵循 TypeScript 的 `module` 配置。我们也在发行说明中提供了一些背景信息，建议大多数作者坚持使用 `node16` 或者 `nodenext` 。

虽然 TypeScript 5.0 Beta 版已经附带了这些功能，但我们并没有对编辑器内忽略大小写的导入顺序的场景进行记录。这部分关于开发体验的制定仍然还在讨论中，但是默认情况下， TypeScript 现在应该可以更好地与您的其他工具配合使用。

对比 RC 版本，一个最显著地改变是 TypeScript 5.0 在 package.json 内指定 12.20 为最小的 Node.js 版本。我们也发布了一篇关于在 TypeScript 5.0 迁移到 ESM 模块的文章，你可以[点击](https://devblogs.microsoft.com/typescript/typescripts-migration-to-modules/)跳转到该页面。

自从宣布 TypeScript 5.0 的 Beta 版本和 RC 版本以来，尽管阻力一直存在，我们还是调整了速度基准和包大小增量的具体数字。为了清晰起见，还调整了一些基准的名称，包大小的改进已经移至单独的图表中。

## 装饰器

装饰器是一个即将到来的 ECMAScript 特性，它允许我们以可重用的方式定制类以及它们的成员。

让我们思考如下代码：

```typescript
class Person {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}

const p = new Person("Ron");
p.greet();
```

`greet` 方法相当的简单，我们可以想象它的内部存在复杂的逻辑，比如可能存在一些异步的逻辑，可能是存在递归调用，可能有副作用等等。不管你想象的是哪种情况，我们假设你传入了一些 `console.log` 的语句调用来帮助调试 `greet` 函数。

```typescript
class Person {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  greet() {
    console.log("LOG: Entering method.");
    console.log(`Hello, my name is ${this.name}.`);
    console.log("LOG: Exiting method.")
  }
}
```

这个模式相当常见。如果有一种方式可以为每个方法做到这一点，那肯定非常棒。

这就是需要使用装饰器的地方。我们可以写一个叫 `loggedMethod` 的函数，它看起来像下面这个样子：

```typescript
function loggedMethod(originalMethod: any, _context: any) {

  function replacementMethod(this: any, ...args: any[]) {
    console.log("LOG: Entering method.")
    const result = originalMethod.call(this, ...args);
    console.log("LOG: Exiting method.")
    return result;
  }

  return replacementMethod;
}
```

所有这些 any 类型是在干什么？这是 anyScript 吗？

稍安勿躁，现在我们只是保持简单的代码，这样我们就可以专注于函数的功能。注意， `loggedMethod` 函数接收了原本的函数（ `originalMethod` ），然后返回了一个新的函数。

- 打印一个 Entering 信息。
- 执行原本函数，传入 this 和其他所有的参数。
- 打印一个 Exiting 信息。
- 返回原本函数返回的任何内容。

现在我们可以使用 `loggedMethod` 来装饰 `greet` 方法。

```typescript
class Person {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  @loggedMethod
  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}

const p = new Person("Ron");
p.greet();

// Output:
//
//   LOG: Entering method.
//   Hello, my name is Ron.
//   LOG: Exiting method.
```

我们只是在 `greet` 上使用了作为装饰器的 `loggedMethod` ，注意这里我们写成了 `@loggedMethod` 。当我们添加装饰器时， `loggedMethod` 会被执行，参数为目标方法 target 以及一个上下文对象。因为 `loggedMethod` 返回了一个新的方法，这个方法会代替 `greet` 这个原本的方法。

`loggedMethod` 的定义的第二个参数，目前我们还没提及到它。它被称为“上下文对象”，这个对象包含了一些关于被装饰的方法是如何声明之类的有用的信息，比如是否是私有成员，是否是静态成员，方法的名称。我们可以重写 `loggedMethod` ，利用这一特性打印出被装饰的方法的名称。

```typescript
function loggedMethod(originalMethod: any, context: ClassMethodDecoratorContext) {
  const methodName = String(context.name);

  function replacementMethod(this: any, ...args: any[]) {
    console.log(`LOG: Entering method '${methodName}'.`)
    const result = originalMethod.call(this, ...args);
    console.log(`LOG: Exiting method '${methodName}'.`)
    return result;
  }

  return replacementMethod;
}
```

现在我们使用了上下文参数，它是 `loggedMethod` 里面第一个比 any 和 any[] 还要严格的类型。 TypeScript 提供了一个名叫 `ClassMethodDecoratorContext` 的类型，这个类型描述了装饰的方法的上下文对象模型。

除了元数据，装饰器的上下文对象还有一个名叫 `addInitializer` 的方法，这个方法很有用。它提供了一种方式使我们能够在构造函数调用过程中注入逻辑（或者使用了 `static` 块来初始化类）。

比如，在 JavaScript 中，编写如下模式的代码很常见：

```typescript
class Person {
  name: string;

  constructor(name: string) {
    this.name = name;

    this.greet = this.greet.bind(this);
  }

  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}
```

或者， `greet` 方法可能会被定义成一个箭头函数的属性。

```typescript
class Person {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  greet = () => {
    console.log(`Hello, my name is ${this.name}.`);
  };
}
```

这段代码确保了如果 `greet` 作为一个独立的函数调用或者作为一个回调传入的时候 this 不会被重新绑定。

```typescript
const greet = new Person("Ron").greet;

// We don't want this to fail!
greet();
```

我们可以编写一个装饰器，通过使用 `addInitializer` 方法来在构造过程中调用 `bind` 。

```typescript
function bound(originalMethod: any, context: ClassMethodDecoratorContext) {
  const methodName = context.name;
  if (context.private) {
    throw new Error(`'bound' cannot decorate private properties like ${methodName as string}.`);
  }
  context.addInitializer(function () {
    this[methodName] = this[methodName].bind(this);
  });
}
```

`bound` 函数没有返回任何东西，所以当它装饰一个方法时，它会忽略装饰的方法，然后在任何属性被初始化前添加一段逻辑。

```typescript
class Person {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  @bound
  @loggedMethod
  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}

const p = new Person("Ron");
const greet = p.greet;

// Works!
greet();
```

注意这里我们堆叠使用了两个装饰器，` @bound` 和 `@loggedMethod` 。这些装饰器以“相反”的顺序执行，即 `@loggedMethod` 装饰了源方法 `greet` ，然后 `@bound` 装饰了 `@loggedMethod` 返回的结果。在这个例子中，这两者的顺序无关紧要，但如果你的装饰器存在副作用或者期望以某个顺序执行，那么装饰的顺序就很重要了。

还有值得注意的是，你可以把这样装饰器放在同一行，如果你喜欢这样的风格的话。

```typescript
class Person {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  @bound @loggedMethod greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}
```

一些不是很明显的点是，我们甚至可以创建一个返回装饰器函数的函数。这使得定制化最终的装饰器成为可能。如果我们想要的话，我们可以让 `loggedMethod` 返回一个装饰器函数，然后定制如何输出日志消息。

```typescript
function loggedMethod(headMessage = "LOG:") {
  return function actualDecorator(originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = String(context.name);

    function replacementMethod(this: any, ...args: any[]) {
      console.log(`${headMessage} Entering method '${methodName}'.`)
      const result = originalMethod.call(this, ...args);
      console.log(`${headMessage} Exiting method '${methodName}'.`)
      return result;
    }

    return replacementMethod;
  }
}
```

如果我们这样做，在作为一个装饰器使用之前必须先调用 `loggedMethod` 函数。我们可以传入一个任意的字符串来作为打印的控制台的日志消息的前缀。

```typescript
class Person {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  @loggedMethod("⚠️")
  greet() {
    console.log(`Hello, my name is ${this.name}.`);
  }
}

const p = new Person("Ron");
p.greet();

// Output:
//
//   ⚠️ Entering method 'greet'.
//   Hello, my name is Ron.
//   ⚠️ Exiting method 'greet'.
```

装饰器不仅仅可以使用在方法上！它们也可以用在属性/字段， getter / setter ，以及 auto-accessor 。甚至也可以对类自身进行装饰，比如子类化以及登记。

为了深入地理解装饰器，你可以阅读这篇文章 [Axel Rauschmayer’s extensive summary](https://2ality.com/2022/10/javascript-decorators.html) 。

涉及更改的更多信息，可以查看原始的 [PR](https://github.com/microsoft/TypeScript/pull/50820) 。

### 与实验性质遗留的装饰器的区别

如果你已经使用了一段时间的 TypeScript 了，你应该知道 TypeScript 已经在多年前就支持实验性质的装饰器了。虽然这些实验性质的装饰器相当有用，但是它模拟的是一个旧得多的装饰器提案，并且一直需要一个叫 `--experimentalDecorators` 的编译选项。在 TypeScript 中未开启该选项下任何尝试使用装饰器逻辑都会得到一个错误信息。

`--experimentalDecorators` 选项在可预见的将来会继续存在。但是，现在不使用这个选项，使用装饰器的代码也是符合语法的。在 `--experimentalDecorators` 选项之外，还会进行类型检查并以不同的方式生成文件。类型检查规则和构建策略是相当不同的，虽然可以通过编写装饰器来支持新旧装饰器的行为，但是任何现有的装饰器几乎不可能这样做。

新的装饰器提案与 `--emitDecoratorMetadata` 不兼容，它不支持装饰参数。未来的 ECMAScript 提案可能会减小这一差距。

最后一点：除了允许装饰器放在 `export` 关键字前面，装饰器提案现在提供了放在 `export` 或 `export default` 之后的选项。唯一的限制是不允许同时混用这两种形式。

```text
// ✅ 允许
@register export default class Foo {
  // ...
}

// ✅ 允许
export default @register class Bar {
  // ...
}

// ❌ error - 不允许同时在前后添加
@before export @after class Bar {
  // ...
}
```

### 编写类型清晰的装饰器

上面的 `loggedMethod` 和 `bound` 装饰器的例子有意地简化并且省略了许多关于类型的细节。

带有类型的装饰器相当的复杂。例如，一个类型正确版本的 `loggedMethod` 方法看起来如下：

```typescript
function loggedMethod<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = String(context.name);

  function replacementMethod(this: This, ...args: Args): Return {
    console.log(`LOG: Entering method '${methodName}'.`)
    const result = target.call(this, ...args);
    console.log(`LOG: Exiting method '${methodName}'.`)
    return result;
  }

  return replacementMethod;
}
```

我们必须分别模拟出 this 类型，参数类型，以及被装饰方法的返回类型，分别用类型参数 This ， Args 和 Return 来表示。

确切来说，装饰器的复杂程度取决于你想保证的内容。请记住，使用装饰器比编写装饰器更加频繁，所以一个类型正确的装饰器通常更可取，但这显然需要和可读性进行权衡，所以应该尽量让事情保持简单。

将来会有更多关于编写装饰器的文档，虽然现在关于这方面的文档较少，但是[这篇文章](https://2ality.com/2022/10/javascript-decorators.html) 有大量关于装饰器机制的细节。

## 不可变（const）类型参数

当推断一个对象的类型时， TypeScript 通常会选择一种通用的类型。比如，下面的例子，`name` 会被推断成 `string[]` ：

```typescript
type HasNames = {
  readonly names: string[]
};

function getNamesExactly<T extends HasNames>(arg: T): T["names"] {
  return arg.names;
}

// Inferred type: string[]
const names = getNamesExactly({names: ["Alice", "Bob", "Eve"]});
```

通常这样做的目的是在接下来的代码中可以改变这个变量。

但是，这取决于 `getNamesExactly` 的作用以及是如何被使用的，可能需要一个更加具体的类型。

到现在为止， API 作者通常不得不建议在某些地方添加 `as const` 来得到想要的推断：

```typescript
// 我们想要的类型:
//    readonly ["Alice", "Bob", "Eve"]
// 实际我们得到的类型:
//    string[]
const names1 = getNamesExactly({names: ["Alice", "Bob", "Eve"]});

// 我们想要的正确的类型:
//    readonly ["Alice", "Bob", "Eve"]
const names2 = getNamesExactly({names: ["Alice", "Bob", "Eve"]} as const);
```

这样做很麻烦并且容易忘记。在 TypeScript 5.0 ，你可以给一个类型参数定义添加一个 `const` 修饰符来使得推断在默认情况下就是类似只读的。

```typescript
type HasNames = {
  names: readonly string[]
};

function getNamesExactly<const T extends HasNames>(arg: T): T["names"] {
//                       ^^^^^
  return arg.names;
}

// 推断类型: readonly ["Alice", "Bob", "Eve"]
// 注意: 不需要在这里写 as const
const names = getNamesExactly({names: ["Alice", "Bob", "Eve"]});
```

注意 `const` 修饰符不会拒绝可变的值，并且也不需要不可变的约束。使用一个可变的类型约束可能会得到一个令人惊讶的结果，比如：

```typescript
declare function fnBad<const T extends string[]>(args: T): void;

// T 仍然是 string[] 因为 readonly ["a", "b", "c"] 不能分配给 string[]
fnBad(["a", "b", "c"]);
```

这里，类型 `T` 的推断候选是 `readonly ["a", "b", "c"]` ，一个 `readonly` 的数组无法用在一个需要可变性质的地方。在这种情况下，推断会退回到约束类型，数组会被识别为 `string[]` ，这样这个调用仍然能够顺利执行。

这个函数的一个更好的定义是使用 `readonly string[]` ：

```typescript
declare function fnGood<const T extends readonly string[]>(args: T): void;

// T 的类型为 readonly ["a", "b", "c"]
fnGood(["a", "b", "c"]);
```

类似地，请记住 `const` 修饰符只影响对象，数组和在调用中编写的原始表达式的推断，所以没有（或者不能）被 `as const` 修饰的参数在行为上不会有任何改变。

```typescript
declare function fnGood<const T extends readonly string[]>(args: T): void;

const arr = ["a", "b", "c"];

// T 仍然是 string[] ， const 修饰符在这里没有影响
fnGood(arr);
```

了解更多的细节可以查看这个 [PR](https://github.com/microsoft/TypeScript/pull/51865) 以及讨论激烈的 issues （ [30680](https://github.com/microsoft/TypeScript/issues/30680) 和 [41114](https://github.com/microsoft/TypeScript/issues/41114) ）。

## 支持 extends 字段配置多个配置文件

当管理多个项目的时候，有一个“基础”的配置文件供其他 tsconfig.json 文件继承是很有帮助的。这也是为什么 TypeScript 支持一个 `extends` 字段来复制其他文件的 `compilerOptions` 字段。

```json
// packages/front-end/src/tsconfig.json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "../lib"
    // ...
  }
}
```

然而，这里可能有一些想要继承多个配置文件的场景。比如，想象一下你正在使用一个 npm 上的 tsconfig.json 配置文件。如果你想要所有你的项目也使用 npm 上的 @tsconfig/strictest 包的配置，有一个简单的办法；建一个继承了 @tsconfig/strictest 的 tsconfig.base.json 的配置文件：

```json
// tsconfig.base.json
{
  "extends": "@tsconfig/strictest/tsconfig.json",
  "compilerOptions": {
    // ...
  }
}
```

这在一定程度上起到了作用。如果某些不想要使用 @tsconfig/strictest 的项目，这些项目必须手动禁用某些选项，或者创建一个独立的，不继承自 @tsconfig/strictest 的 tsconfig.base.json 文件版本，

为了在此处取得更多的灵活性， TypeScript 5.0 现在允许设置 `extends` 字段为多个入口。比如，在下面这个配置文件中：

```json
{
  "extends": [
    "a",
    "b",
    "c"
  ],
  "compilerOptions": {
    // ...
  }
}
```

这么写有点像直接继承 c ，而 c 继承 b ，b 继承 a ，如果某个字段“冲突”了，以后者为准。

所以在下面的例子中，在最后的 tsconfig.json 中 `strictNullChecks` 和 `noImplicitAny` 都会开启。

```json
// tsconfig1.json
{
  "compilerOptions": {
    "strictNullChecks": true
  }
}

// tsconfig2.json
{
  "compilerOptions": {
    "noImplicitAny": true
  }
}

// tsconfig.json
{
  "extends": [
    "./tsconfig1.json",
    "./tsconfig2.json"
  ],
  "files": [
    "./index.ts"
  ]
}
```

再举个例子，我们可以用下面的方式重写原来的例子。

```json
// packages/front-end/src/tsconfig.json
{
  "extends": [
    "@tsconfig/strictest/tsconfig.json",
    "../../../tsconfig.base.json"
  ],
  "compilerOptions": {
    "outDir": "../lib"
    // ...
  }
}
```

获取更多信息，可以查看这个 [PR](https://github.com/microsoft/TypeScript/pull/50403) 。

## 所有的枚举是联合枚举

最初 TypeScript 引入枚举的时候，它们只不过是一组有着相同类型的数字常量。

```typescript
enum E {
  Foo = 10,
  Bar = 20,
}
```

E.Foo 和 E.Bar 的唯一特别的地方就是可以分配给任何接收 E 类型的地方。除此之外，它们几乎只是数字而已。

```typescript
function takeValue(e: E) {
}

takeValue(E.Foo); // 执行正常
takeValue(123); // 错误!
```

直到 TypeScript 2.0 引入了枚举字面类型，枚举变得更特别了。枚举字面类型让每个枚举成员拥有它们自己的类型，而枚举自身的类型变成每一个成员类型的联合。这允许我们仅引用一个枚举类型的子集，以及收缩这些类型。

```typescript
// Color 类似一个 Red | Orange | Yellow | Green | Blue | Violet 的集合
enum Color {
  Red,
  Orange,
  Yellow,
  Green,
  Blue,
  /* Indigo */
  Violet
}

// 每一个枚举成员有它自己的类型，我么可以引用它们。
type PrimaryColor =
  Color.Red
  | Color.Green
  | Color.Blue;

function isPrimaryColor(c: Color): c is PrimaryColor {
  // 收缩字面类型可以捕获错误
  // 在这里 TypeScript 会报错
  // 因为最后使用比较的是 Color.Red 和 Color.Green
  // 我们打算使用 || 逻辑符号的，但是意外地写成了 && 逻辑符号
  return c === Color.Red && c === Color.Green && c === Color.Blue;
}
```

每个枚举成员拥有自己的类型带来一个问题是这些类型在某些方面和成员实际的值有关。在某些情况下是无法计算枚举成员的值地，比如，通过调用一个函数来初始化一个枚举成员。

```typescript
enum E {
  Blah = Math.random()
}
```

每当 TypeScript 遇到这些问题时，它会静默退回，使用旧版本的枚举策略。这意味着放弃了所有的联合和字面类型的优点。

TypeScript 5.0 通过为每一个计算成员创建一个唯一的类型来设法让所有的枚举成为联合枚举。这意味着现在所有的枚举可以收缩，枚举成员也能作为类型引用。

关于此改变的更多信息，可以阅读 Github 上的相关[细节](https://github.com/microsoft/TypeScript/pull/50528) 。

## --moduleResolution bundler

TypeScript 4.7 为 `--module` 和 `--moduleResolution` 设置引入了 `node16` 和 `nodenext` 选项。这些选项的目的是更好的在 Node.js 环境中模拟 ECMAScript 模块的精确查找规则。然而，这种模式有很多的限制，其他的工具不会真正强制地执行。

比如，在 Node.js 中的一个 ECMAScript 模块，任何有关的导入都需要包含文件的扩展名。

```typescript
// entry.mjs
import * as utils from "./utils";     // ❌ 错误 - 需要半酣文件扩展名

import * as utils from "./utils.mjs"; // ✅ 正常
```

在 Node 和浏览器中出现这种现象是有某些原因的。这种方式查找文件会更快并且在原始文件系统上能更好地工作。但对于许多使用打包器之类地工具的开发者来说， `node16` /` nodenext` 设置繁琐，因为打包器没有这些大多数的限制，在某些情况下，对使用打包器的用户来说 `node` 解析模式是更好的选择。

但在某些情况下，原始的 `node` 解析模式早已过时了。许多现代的打包器在 Node 环境中融合了 ECMAScript 模块和 CommonJS 模块的查找规则。比如，无扩展名导入只能在 CommonJS 中很好地工作，但当你浏览一个包的[导出条件](https://nodejs.org/api/packages.html#nested-conditions)时，它们更喜欢类似 ECMAScript 文件的导入条件。

为了模拟打包器的工作方式， TypeScript 现在引入了一个新的策略： `--moduleResolution bundler`

```json
{
  "compilerOptions": {
    "target": "esnext",
    "moduleResolution": "bundler"
  }
}
```

如果你使用了一个像 Vite 、 esbuild 、 swc 、 Webpack 、 Parcel 以及其他实现了混合查找策略的的现代打包器，新的 `bundler` 配置会很适合你。

另一方面，如果你编写了一个打算发布到 npm 上的库，使用 `bundler` 配置可能会给没有使用打包器的用户所带来隐含的兼容性问题。所以在这些情况下，使用 `node16` 或者 `nodenext` 解析配置看起来是一个更好的选择。

更多关于 `--moduleResolution bundler` 的信息，可与查看这个实现的 [PR](https://github.com/microsoft/TypeScript/pull/51669) 。

## 解析自定义标志

如今 JavaScript 工具模拟了混合的解析规则，就如同我们如上所描述的 bundler 模式一样。因为工具间的支持可能存在轻微的不同， TypeScript 5.0 提供一些方式来开启或者关闭一些在配置中能够（不能）使用的功能。

### allowImportingTsExtensions

`--allowImportingTsExtensions` 允许 TypeScript 文件以一个具体的 TypeScript 扩展名（比如 .ts ， .mts ， .tsx ）来导入彼此。

这个标志只能在 `--noEmit` 或者 `--emitDeclarationOnly` 开启的情况下使用，因为这些导入路径不会在 JavaScript 的输出文件中被解析。这里是期望由你的解析器（比如：打包器，运行时环境，或者一些其他的工具）来让这些导入在 .ts 文件中工作。

### resolvePackageJsonExports

`--resolvePackageJsonExports` 强制 TypeScript 查看读取 node_modules 的包的 package.json 文件的 [exports](https://nodejs.org/api/packages.html#exports) 字段。

这个配置在 `node16` 、 `nodenext` 以及 `--moduleResolution` 为 `bundler` 的情况下默认为 true 。

### allowArbitraryExtensions

在 TypeScript 5.0 中，当一个导入路径以一个非 JavaScript 或者 TypeScript 文件的扩展名结束时，编译器会寻找一个此路径的定义文件，形式为 {file basename}.d.{extension}.ts 。比如，如果你在一个打包项目中使用了一个 CSS 加载器，你可能会为这些样式文件编写（或生成）定义文件。

```css
/* app.css */
.cookie-banner {
    display: none;
}
```

```typescript
// app.d.css.ts
declare const css: {
  cookieBanner: string;
};
export default css;
```

```typescript
// App.tsx
import styles from "./app.css";

styles.cookieBanner; // string
```

默认情况下，这个导入会引起一个错误，这个错误会告诉你 TypeScript 无法理解这个文件类型，以及运行时不支持导入它。但如果你通过配置运行时或者打包器去处理它，你可以通过 `--allowArbitraryExtensions` 这个编译选项来禁止这个错误的出现。

请注意，在以前，通过添加一个名为 app.css.d.ts 而不是 app.d.css.ts 的文件也能得到一个相似的效果。然而这只能工作在 Node 的 CommonJS 模块的 require 解析规则下。严格上讲，前者被解释为一个名为 app.css.js 的 JavaScript 文件的类型定义文件。由于在支持 Node ESM 下相关文件的导入需要包含扩展名，在 `--moduleResolution` 为 `node16` 或者 `nodenext` 的 ESM 文件下 TypeScript 会在上面的例子中报错。

更多的信息，可以查看这个特性的[提案](https://github.com/microsoft/TypeScript/issues/50133)以及相关的 [PR](https://github.com/microsoft/TypeScript/pull/51435) 。

### 自定义条件

`--customConditions` 指定一个额外的条件列表，可以使得 TypeScript 从 package.json 文件中的 [exports](https://nodejs.org/api/packages.html#exports) 和 [imports](https://nodejs.org/api/packages.html#imports) 字段正确地解析。这些条件会添加到默认使用的解析器（无论条件是否存在）中。

比如，如果在 tsconfig.json 设置这个字段为如下：

```json
{
  "compilerOptions": {
    "target": "es2022",
    "moduleResolution": "bundler",
    "customConditions": [
      "my-condition"
    ]
  }
}
```

任何时候引用 package.json 的 `exports` 和 `imports` 字段， TypeScript 会考虑叫 my-condition 的条件。

所以当从一个带有如下 package.json 的包中导入的时候

```json
{
  // ...
  "exports": {
    ".": {
      "my-condition": "./foo.mjs",
      "node": "./bar.mjs",
      "import": "./baz.mjs",
      "require": "./biz.mjs"
    }
  }
}
```

TypeScript 会尝试寻找相应的 foo.mjs 的文件。

这个字段只有在 `node` 、 `nodenext` 和 `--moduleResolution` 为 `bundler` 下才合法。

### verbatimModuleSyntax

默认情况下， TypeScript 做了一些叫导入省略的事情。总的来说，如果你编写如下代码：

```typescript
import {
  Car
} from "./car";

export function drive(car: Car) {
  // ...
}
```

TypeScript 会检测到你只是导入一个类型，会完全移除这个导入。输出的 JavaScript 看起来可能如下：

```typescript
export function drive(car) {
  // ...
}
```

很多时候这已经很棒了，但是如果从 `./car` 导出的 `Car` 不是一个值。我们会得到一个运行时的错误。

但这确实对某些边缘情况增加了一层复杂度。比如，注意这里没有写 `import "./car"` 这样的语句，这个导入会被完全删除。这实际上在有副作用或没有副作用的模块中存在区别。

TypeScript 对 JavaScript 的构建策略也有其他几个层次的复杂度。导入省略不总是由一个导入的使用方式来驱动。它经常也查询一个值是如何声明的。所以它可能看起来不总是清晰的，比如下面这样

```typescript
export {
  Car
} from "./car";
```

我们无法知道这段代码时候应该被保留或删除。如果 `Car` 通过 class 定义，那么它在输出的 JavaScript 中会被保留。但如果 `Car` 只是一个 type 别名或者 interface ，那么输出的 JavaScript 文件根本不应该导出 `Car` 。

虽然 TypeScript 可能能够根据文件间的信息做出这些构建判断，但不是每一个编译器都可以的。

在导入和导出语句上使用 type 修饰符对这些情况可以起到帮助。我们可以通过使用 type 修饰符来明确一个导入或导出是否只是用于类型分析，是否可以在 JavaScript 文件中完全删除。

```typescript
// 这个语句会在输出的 JS 文件中被完全删除
import type * as car from "./car";

// 导入或者导出类型 Car 会在输出的 JS 文件中被完全删除
import { type Car } from "./car";
export { type Car } from "./car";
```

type 修饰符本身并不是很有用，默认情况下，模块省略仍然会删除这些导入，并且不会强制你区分 type 导入导出和原始的导入导出。所以 TypeScript 的 `--importsNotUsedAsValues` 标志确保你使用 type 修饰符， `--preserveValueImports` 标志来防止某些模块省略的行为， `--isolatedModules` 确保 TypeScript 的代码可以工作在不同的编译器中。不幸的是，理解这三个标志的细节有难度，并且还有一些意外行为的边缘情况。

TypeScript 5.0 引入了一个新的选项，叫 `--verbatimModuleSyntax` ，以此来简化这些情况，这个规则非常的简单，任何没有 type 修饰符的导入导出将会被保留，任何使用了 type 修饰符的则会被完全删除。

```typescript
// 会被完全删除
import type { A } from "a";

// 重写成 import { b } from "bcd"
// Rewritten to 'import { b } from "bcd";'
import { b, type c, type d } from "bcd";

//重写成 import {} from "xyz"
import { type xyz } from "xyz";
```

这个选项意味着所见即所得。

当涉及到模块间互相操作时这确实造成了一些影响，在这个标志下，当你的设置或者文件扩展名表明使用一个不同的模块系统的时候， ECMAScript 的导入和导出不会被重写成 require 调用，而是得到一个错误。如果你需要生成使用 require 和 module.exports 的代码，你不得不使用 ES2015 之前的 TypeScript 的模块语法。

虽然这是一个限制，但这缺点是使得一些问题更加明显了。比如，在 `--module` 的 `node16` 的设置下很容易忘记给 package.json 文件的 type 字段设置值。因此，开发者会无意识地编写 CommonJS 模块而不是 ESM 模块，对查找规则和输出内容感到惊讶。这个新的标志确保了你是有意指定你使用地文件类型，因为它们间的语法是有意不同的。

因为 `--verbatimModuleSyntax` 相比 `--importsNotUsedAsValues` 和` --preserveValueImports` ，提供了更一致性的描述，旧的两个标志将会被废弃。

更多的细节，可以查看这个 [PR](https://github.com/microsoft/TypeScript/pull/52203) 和[提案](https://github.com/microsoft/TypeScript/issues/51479)。

## 支持 export type * 语法

在 TypeScript 3.8 时引入了类型导入，该语法不允许类似 `export * from "module"` 或者 `export * as ns from "module"` 重新导出。TypeScript 5.0 对这些形式添加了支持。

```typescript
// models/vehicles.ts
export class Spaceship {
  // ...
}

// models/index.ts
export type * as vehicles from "./vehicles";

// main.ts
import { vehicles } from "./models";

function takeASpaceship(s: vehicles.Spaceship) {
  // ✅ 可以 - vehicles 只被使用在一个类型的位置
}

function makeASpaceship() {
  return new vehicles.Spaceship();
  //         ^^^^^^^^
  // vehicles 无法作为一个值来使用，因为它是由通过 export type 来导出的。
}
```

你可以阅读相关[实现细节](https://github.com/microsoft/TypeScript/pull/52217)。

## 在 JSDoc 中支持 @satisfies

TypeScript 4.9 引入了 `satisfies` 操作符。它确保了一个表达式的类型是兼容的，不会影响到类型自身。比如，我们可以查看如下代码：

```typescript
interface CompilerOptions {
  strict?: boolean;
  outDir?: string;
  // ...
}

interface ConfigSettings {
  compilerOptions?: CompilerOptions;
  extends?: string | string[];
  // ...
}

let myConfigSettings = {
  compilerOptions: {
    strict: true,
    outDir: "../lib",
    // ...
  },

  extends: [
    "@tsconfig/strictest/tsconfig.json",
    "../../../tsconfig.base.json"
  ],

} satisfies ConfigSettings;
```

在上面，TypeScript 知道 `myConfigSettings.extends` 是一个数组类型定义，因为虽然 `satisfies` 验证了对象的类型，但是它没有直接把对象转化为 `ConfigSettings` 从而丢失一些信息。因此如果我们想要在 `extends` 上调用 `map` ，这样完全可以。

```typescript
declare function resolveConfig(configPath: string): CompilerOptions;

let inheritedConfigs = myConfigSettings.extends.map(resolveConfig);
```

这对 TypeScript 用户来说很有用的，但是很多的用户使用 TypeScript 的 JSDoc 注解来对 JavaScript 代码进行类型检查。这也是为什么 TypeScript 5.0 支持了一个名叫 `@satisfies` 的完全相同功能的 JSDoc 的标签。

/** @satisfies */ 可以捕获到类型不匹配的情况：

```javascript
// @ts-check

/**
 * @typedef CompilerOptions
 * @prop {boolean} [strict]
 * @prop {string} [outDir]
 */

/**
 * @satisfies {CompilerOptions}
 */
let myCompilerOptions = {
  outdir: "../lib",
//  ~~~~~~ oops! we meant outDir
};
```

但是它也会保留表达式的原始类型，这允许我们在接下里的代码中使用更加精确的值。

```javascript
// @ts-check

/**
 * @typedef CompilerOptions
 * @prop {boolean} [strict]
 * @prop {string} [outDir]
 */

/**
 * @typedef ConfigSettings
 * @prop {CompilerOptions} [compilerOptions]
 * @prop {string | string[]} [extends]
 */


/**
 * @satisfies {ConfigSettings}
 */
let myConfigSettings = {
  compilerOptions: {
    strict: true,
    outDir: "../lib",
  },
  extends: [
    "@tsconfig/strictest/tsconfig.json",
    "../../../tsconfig.base.json"
  ],
};

let inheritedConfigs = myConfigSettings.extends.map(resolveConfig);
```

/** @satisfies */ 也可以被内联在括号表达式中，我们可以把 myConfigSettings 写成形式：

```javascript
let myConfigSettings = /** @satisfies {ConfigSettings} */ ({
  compilerOptions: {
    strict: true,
    outDir: "../lib",
  },
  extends: [
    "@tsconfig/strictest/tsconfig.json",
    "../../../tsconfig.base.json"
  ],
});
```

为什么要支持这种形式？是这样的，很多情况下你会在一段代码的很深的位置，比如一个函数调用

```javascript
compileCode(/** @satisfies {ConfigSettings} */ ({
  // ...
}));
```

感谢 [Oleksandr Tarasiuk](https://github.com/a-tarasyuk) 提供了这个[新特性](https://github.com/microsoft/TypeScript/pull/51753)

## 在 JSDoc 中支持 @overload

在 TypeScript 中，你可以指定一个函数的重载形式。重载使得我们可以让一个函数以不同的参数进行调用，然后可能返回不同的结果。这些重载可以限制调用者实际调用代码的方式，以及得到返回结果的内容。

```typescript
// Our overloads:
function printValue(str: string): void;
function printValue(num: number, maxFractionDigits?: number): void;

// 实现
function printValue(value: string | number, maximumFractionDigits?: number) {
  if (typeof value === "number") {
    const formatter = Intl.NumberFormat("en-US", {
      maximumFractionDigits,
    });
    value = formatter.format(value);
  }

  console.log(value);
}
```

在上面的代码中，我们让 `printValue` 函数可以接收一个 string 或者 一个 number 来作为它的第一个参数，如果第一个参数是 number ，那么它还可以接收第二个参数来确定要打印多少小数位。

现在 TypeScript 5.0 允许使用 JSDoc 来通过标签 `@overload` 来定义一个重载。每一个带有 `@overload` 标签的 JSDoc 注释会被当成一个接下来的函数的一个不同的重载

```javascript
// @ts-check

/**
 * @overload
 * @param {string} value
 * @return {void}
 */

/**
 * @overload
 * @param {number} value
 * @param {number} [maximumFractionDigits]
 * @return {void}
 */

/**
 * @param {string | number} value
 * @param {number} [maximumFractionDigits]
 */
function printValue(value, maximumFractionDigits) {
  if (typeof value === "number") {
    const formatter = Intl.NumberFormat("en-US", {
      maximumFractionDigits,
    });
    value = formatter.format(value);
  }

  console.log(value);
}
```

现在不管是在 TypeScript 中编写还是在 JavaScript 中编写，TypeScript 都可以在我们错误地调用函数的时候进行提示。

```javascript
// all allowed
printValue("hello!");
printValue(123.45);
printValue(123.45, 2);

printValue("hello!", 123); // error!
```

感谢 [Tomasz Lenarcik](https://github.com/apendua) 实现了这个新的[标签](https://github.com/microsoft/TypeScript/pull/51234)。

## 在 --build 下传递特定的构建标志

现在 TypeScript 支持在 --build 模式下传递如下的标志

- `--declaration`
- `--emitDeclarationOnly`
- `--declarationMap`
- `--sourceMap`
- `--inlineSourceMap`

当你的开发构建和生产构建存在不同时，这可以让自定义构建的某些部分变得更加容易。

比如，某个库的开发构建可能不需要产生定义文件，但生产构建就需要。一个项目可以配置在默认情况下关闭类型定义文件生成，也可以通过如下命令简单地生成它：

```text
tsc --build -p ./my-project-dir
```

一旦你在内部周期内完成代码迭代，生产构建只需要传递 `--declaration` 标志即可。

更多关于此改变的信息可以点击[此处](https://github.com/microsoft/TypeScript/pull/51241)。

## 编辑器中忽略大小写的导入顺序

在类似 Visual Studio 和 VS Code 的编辑器中， TypeScript 会增强导入和导出的组织和排序的体验。虽然很多时候，可能会对已“排序”的列表产生不同的解释。

比如，如下的导入列表是排序过的吗？

```javascript
import {
  Toggle,
  freeze,
  toBoolean,
} from "./utils";
```

你可能会得出“这取决于”这样令人惊讶的答案，如果我们对大小写敏感，那么很明显这个列表不是顺序的。字母 `f` 应该在 `t` 和 `T` 之前。

但在很多的编程语言中，排序默认情况下是基于字符串的比特的值。 JavaScript 比较的字符串的方式意味着 Toggle 总是排在 freeze 的前面，因为在 [ASCII](https://en.wikipedia.org/wiki/ASCII) 字符编码中大写字母在小写字母前面。所以根据这个观点，这个导入列表就是顺序的。

在以前，TypeScript 会认为这个列表是排序的，因为它基于一个大小写敏感的排序。对于那些对更喜欢大小写不敏感，或者使用了类似 ESLint 那种默认情况下忽略大小写的排序的工具的用户来说，这会打击他们的使用 TypeScript 意愿。

现在 TypeScript 默认情况下检测大小写。这意味着 TypeScript 和 类似 ESLint 的工具通常情况下不会再为了“最好的导入顺序”而相互“打架”。

我们的团队也在实验进一步的排序策略，你可以[在此](https://github.com/microsoft/TypeScript/pull/52115)阅读相关的信息。这些配置可能最终能通过用户来配置。但是现在，这些配置仍然是不稳定和实验性质的，现在你可以在 VS code 的 JSON 配置文件中通过 typescript.unstable 入口来配置它们。以下是你可以使用的所有配置项（设置为默认值）：

```json
{
  "typescript.unstable": {
    // 是否忽略大小写排序，值可为
    // - true
    // - false
    // - "auto" (自动检测)
    "organizeImportsIgnoreCase": "auto",
    // 按顺序排序还是使用码点或者考虑 Unicode 规则，值可为
    // - "ordinal"
    // - "unicode"
    "organizeImportsCollation": "ordinal",
    // 在 organizeImportsCollation 为 unicode 下，当前的语言环境是？值可为
    // - [任何其他的语言环境代码]
    // - "auto" (使用编辑器的语言环境)
    "organizeImportsLocale": "en",
    // 在 organizeImportsCollation 为 unicode 下，大写字母在前还是小写字母在前？值可为
    // - false (由语言环境指定)
    // - "upper"
    // - "lower"
    "organizeImportsCaseFirst": false,
    // 在 organizeImportsCollation 为 unicode 下，数字是否根据大小进行比较（比如，"a1" < "a2" < "a100"）？值可为
    // - true
    // - false
    "organizeImportsNumericCollation": true,
    // 在 organizeImportsCollation 为 unicode 下，带有重音标志或变音标志的字母与他们的“基础”字母是否区分排序（比如 é 是否和 e 不同）？值可为
    // - true
    // - false
    "organizeImportsAccentCollation": true
  },
  "javascript.unstable": {
    // 和上面相同的配置
  }
}
```

你可以在这个 [PR](https://github.com/microsoft/TypeScript/pull/51733) 查看关于自动检测和指定大小写不敏感的底层工作的细节，其次是更加广泛的配置集这个 [PR](https://github.com/microsoft/TypeScript/pull/52115) 。

## 全面的 switch/case 完成功能

当我们编写了一个 `switch` 语句的时候，现在 TypeScript 会在值为一个字面类型的时候进行检测。如果是这种情况， TypeScript 会完整地检测出每个未被覆盖的情况

![](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2023/03/exhaustiveCaseCompletions-5.0-stable-1.gif)

你可以在 [Github](https://github.com/microsoft/TypeScript/pull/50996) 上查看该实现的相关细节。

## 优化速度，内存和包大小

TypeScript 5.0 在代码结构，数据结构和算法实现上包含了许多强大的改变。所有的这些改变意味着你的整个使用过程会更加快速，这不仅仅体现在运行 TypeScript 上，也包括安装它的速度。

以下是和 TypeScript 4.9 相比一些能够被检测的在速度和大小上的优势

| 脚本                                                         | 相比 TS 4.9 的时间或大小 |
|------------------------------------------------------------|------------------|
| material-ui 构建时间                                           | 90%              |
| TypeScript 编译器启动时间                                         | 89%              |
| [Playwright](https://github.com/microsoft/playwright) 构建时间 | 88%              |
| TypeScript 编译器构建时间                                         | 87%              |
| Outlook Web 构建时间                                           | 82%              |
| VS Code 构建时间                                               | 80%              |
| TypeScript 的包大小                                            | 59%              |

![](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2023/03/speed-5.0-stable-2.png)

![](https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2023/03/size-5.0-stable-1.png)

怎么样，在未来我们会对这些显著的改进提供更多的细节。但现在我们就能告诉你。

首先，我们最近将 TypeScript 从命名空间迁移到了模块，模块允许我们利用现代构建工具进行类似范围提升之类的执行优化。使用这个工具，重新审视我们的打包策略，然后移除一些废弃的代码，这样我们就可以从 TypeScript 4.9 的 63.8 M 的包大小减少 26.4 M 。通过直接函数调用也让我们显著地提升了速度。我们把这些内容一起放在了一篇关于模块迁移地细节的[文章](https://devblogs.microsoft.com/typescript/typescripts-migration-to-modules/)中。

TypeScript 也在编译器中添加更统一的内部对象类型。以及精简了一些存储在这些对象类型上的数据。这减少了多态操作，同时平衡了因让对象更加统一而增加的内存使用量。

对于序列化信息到字符串我们也做了一些缓存。作为错误报告的一部分，声明提示，代码完成的类型展示在最后会相当地昂贵。现在 TypeScript 会缓存一些常见的使用部分，然后在这些操作中复用。

另一个提升代码解析的显著的改变是利用 `var` 来偶尔回避在闭包中使用 `let` 和 `const` 的开销。这会提升一部分的解析性能。

总之，我们期望许多代码库可以体会到 TypeScript 5.0 带来的速度提升，一般这个提升可以在 10% 到 20% 之间。当然这个提升取决于硬件和代码库的特性，但我们鼓励你从现在开始在你的代码库中尝试使用它。

更多的信息，可以查看如下的一些显著的优化：

- [迁移到模块](https://github.com/microsoft/TypeScript/pull/51387)
- [Node 单态化](https://github.com/microsoft/TypeScript/pull/51682)
- [Symbol 单态化](https://github.com/microsoft/TypeScript/pull/51880)
- [减少标识符大小](https://github.com/microsoft/TypeScript/pull/52170)
- [打印缓存](https://github.com/microsoft/TypeScript/pull/52382)
- [var 的有限使用](https://github.com/microsoft/TypeScript/issues/52924)

## 破坏性更新和废弃的运行时要求

现在 TypeScript 的输出目标为 ECMAScript 2018 。 TypeScript 也需要一个 12.20 版本的最小的 Node 引擎。对于 Node 用户来说，这意味着 TypeScript 5.0 至少需要 Nodejs 12.20 或更高的版本。

### lib.d.ts 改变

Dom 类型的生成的改变可能会对现有的代码产生影响。尤其是某些属性会从 number 类型改为数字字面量类型，处理剪切，复制和粘贴的属性和方法移动到了别的接口中。

### API 破坏性变更

在 TypeScript 5.0 中，我们迁移到了模块，移除了一些不必要的接口类型，做了一些正确性的提升。更多有关改变内容的细节，可以查看 API 破坏性变更的[页面](https://github.com/microsoft/TypeScript/wiki/API-Breaking-Changes)。

### 禁止关系操作符的隐式类型转化

如果你在 TypeScript 中编写了一段会引起隐式字符串到数字的类型转换的代码，那么会产生一个警告。

```typescript
function func(ns: number | string) {
  return ns * 4; // Error, possible implicit coercion
}
```

在 TypeScript 5.0 ，这也会被应用在关系操作符 > 、 < 、 <= 、 >= 上

```typescript
function func(ns: number | string) {
  return ns > 4; // Now also an error
}
```

如果你希望这么做的话，你可以通过 + 来显示地将一个操作数转为数字：

```typescript
function func(ns: number | string) {
  return +ns > 4; // OK
}
```

这个正确的[改进](https://github.com/microsoft/TypeScript/pull/52048)由 [Mateusz Burzyński](https://github.com/Andarist) 贡献。

### 枚举修复

自从 TypeScript 发布以来，在枚举方面一直有奇怪的现象。在 5.0 中，我们修复了这些问题的一部分，以及减少你可以定义的各种枚举所需要理解的概念的数量。

在这之中，你可以会主要遇到两个新的错误。第一个是现在如果将一个域外的字面量给到一个枚举，那么跟预期一样产生错误：

```typescript
enum SomeEvenDigit {
  Zero = 0,
  Two = 2,
  Four = 4
}

// Now correctly an error
let m: SomeEvenDigit = 1;
```

另一个是带有由数字和非直接引用字符串的值定义的的枚举会错误地创建一个所有枚举项都是数字的枚举：

```typescript
enum Letters {
  A = "a"
}

enum Numbers {
  one = 1,
  two = Letters.A
}

// Now correctly an error
const t: number = Numbers.two;
```

可以[在此](https://github.com/microsoft/TypeScript/pull/50528)查看相关变更的更多细节。

### 在 `--experimentalDecorators` 标志下对带有参数装饰器的构造器进行更准确地类型检查

TypeScript 5.0 在 `--experimentalDecorators` 下对装饰器的类型检查更加的准确。一个明显的地方就是对构造器的参数使用装饰器：

```typescript
export declare const inject: (entity: any) => (target: object, key: string | symbol, index?: number) => void;

export class Foo {
}

export class C {
  constructor(@inject(Foo) private x: any) {
  }
}
```

这个调用会失败，因为参数 `key` 期望一个 string 或者是一个 symbol ，但是构造器参数接口的 `key` 为 undefined 。正确的做法是改变 `inject` 函数内 `key` 的类型。如果你在使用一个无法升级的库，一个合理的解决方法是把 `inject` 函数包裹在一个类型更加安全的装饰器函数内，然后对 `key` 参数使用类型断言。

更多的细节，可以查看这个 [issue](https://github.com/microsoft/TypeScript/issues/52435) 。

### 废弃项以及默认值的改变

在 TypeScript 5.0 ，我们废弃了如下的设置以及相关的值：

- `--target: ES3`
- `--out`
- `--noImplicitUseStrict`
- `--keyofStringsOnly`
- `--suppressExcessPropertyErrors`
- `--suppressImplicitAnyIndexErrors`
- `--noStrictGenericChecks`
- `--charset`
- `--importsNotUsedAsValues`
- `--preserveValueImports`
- 项目 `references` 中的 `prepend` 字段

这些配置会继续支持，到 TypeScript 5.5 时会被完全的移除，但是使用这些设置仍然会收到一个警告。在 TypeScript 5.0 ，以及之后的 5.1 5.2 5.3 和 5.4 ，你可以指定 `ignoreDeprecations` 为 5.0 来忽略这些警告。我们也将很快发布一个 4.9 的补丁，允许指定 `ignoreDeprecations` 来进行更平滑的升级。除了废弃项，我们还改变了一些 TypeScript 设置来更好地提升跨平台的行为。

`--newLine` ，它控制了 JavaScript 文件的行尾，如果未指定，则根据当前的操作系统进行推断。我们认为构建应该尽可能的确定，现在 windows 的记事本支持了修改换行的功能，新的默认设置为 LF 。旧的特定于操作系统的推断行为不再支持。

`--forceConsistentCasingInFileNames` ，它确保了在项目内对相同文件的所有的引用是大小写一致的。现在默认的值是 true 。这有助于捕获在大小写不敏感的系统中编写的代码的差异问题。

你可以在这个 [issue](https://github.com/microsoft/TypeScript/issues/51909) 下留言以及查看更多的信息。

## 下一步？

目前 TypeScript 5.1 早已在开发中了，在 github 上也有我们的计划。如果你迫切想要尝鲜新版本，我们鼓励你可以尝试我们的日更新版本以及 VS Code 中 JavaScript 和 TypeScript 的日更新插件。

当然，如果你选择只使用 TypeScript 新的稳定的版本，这也完全 OK 。我们希望 TypeScript 5.0 可以让让每个人更快的编码，更加享受编码。
