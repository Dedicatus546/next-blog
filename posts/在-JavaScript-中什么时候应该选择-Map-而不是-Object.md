---
title: 在 JavaScript 中什么时候应该选择 Map 而不是 Object
tags:
  - JavaScript
  - Object
  - Map
categories:
  - 译文
key: 1676628070date: 2023-02-17 18:01:10
updated: 2023-02-27 15:48:30
---



# 前言

原文地址：[When You Should Prefer Map Over Object In JavaScript](https://www.zhenghao.io/posts/object-vs-map)

<!-- more -->

# 正文

在 JavaScript 中，缺乏一种“指导”来选择 `Map` 还是 `Object`

> reddit 上对此的[讨论](https://www.reddit.com/r/javascript/comments/vgs7y1/why_you_should_prefer_map_over_object_in/) 

在 JavaScript 中，对象非常常见，我们可以很方便的将数据的多个部分组合起来。在 ES6 之后，增加了 `Map` 这一特性。从很多方面来看， `Map` 似乎是一个实现了有点复杂接口的，功能更加强大的 `Object` 。然而，很多人在需要哈希表这种特性时仍然会使用 `Object` 对象 ，只有在意识到哈希表的键在当前的用例下不能为字符串的时候才去使用 `Map` 。因此，在当下的 JavaScript 社区中， `Map` 仍然是**未被充分利用的**。

在这篇文章中，我会告诉你什么情况下更应该考虑使用 `Map` ，以及在这种情况下的基准性能。

> 在 JavaScript 中 ，对象是一个非常广义的术语，几乎所有的东西都可以是对象，除了 `null` 和 `undefined`，在这篇文章中，对象只表示普通对象，即这个对象由一对左右括号 `{}` 分隔。

## 总结：

- 在编码时就明确需要记录固定、有限的字段或者属性时，使用 `Object`，比如一个配置对象。以及通常情况下所有只使用一次的对象。
- 在键值对数量可变，需要频繁地更新，编码时无法确定键的名称时，使用 `Map` ，比如一个事件发射器（ `event emitter` ）。
- 从我的基准测试来看，除非键是小整数的字符串，其他情况下 `Map` 在插入，删除，迭代速度上都要好于 `Object` ，并且在相同键值对数量下 `Map` 使用的内存会更小。

## 为什么 Object 不符合哈希测试用例

使用对象作为哈希表，最明显的缺点可能是键只能是字符串或者符号（ `Symbol` ）类型，其他类型会通过 `toString` 方法隐式转化为字符串类型。

```javascript
const foo = []
const bar = {}
const obj = { [foo]: 'foo', [bar]: 'bar' }

console.log(obj) // { "": 'foo', [object Object]: 'bar' }
```

更重要的是，将对象作为哈希表可能会造成一些令人迷惑的安全隐患。

### 多余的继承

在 ES6 之前，创建一个哈希表只能通过创建一个空的对象来实现。

```javascript
const hashMap = {}
```

然而，在创建的时候，这个对象就不再是空的了。尽管 `hashMap` 变量是一个空的对象字面量，但是他自动继承了 `Object.prototype` 。这也是我们能在 `hashMap` 对象上执行 `hasOwnProperty` ， `toString` ，`constructor` 的原因，尽管我们从未明确定义这些方法。

由于存在原型继承，现在我们有了两种类型的属性：对象本身的属性，比如，它自身的属性；原型链上的属性，比如，继承的属性。因此，我们需要一个额外的检查（比如 `hasOwnProperty` ）来确保给定的属性确实是用户提供的，而不是从原型链继承过来的。

除此之外，由于 JavaScript 的属性解析机制，在运行时任何对 `Object.prototype` 的改变都会链式影响到所有对象，这会引发[原型污染攻击](https://github.com/HoLyVieR/prototype-pollution-nsec18/blob/master/paper/JavaScript_prototype_pollution_attack_in_NodeJS.pdf)，这种攻击会对一个庞大复杂的 JavaScript 应用造成严重的安全问题。

幸运地是，我们可以通过使用 `Object.create(null)` 来创建一个不从 `Object.prototype` 继承的对象，从而解决原型污染攻击问题。

### 名称冲突

当一个对象自身和它的原型链上存在一个同名的属性时，它的执行结果可能和预期不符，从而使程序发生崩溃。

比如，我们有一个函数 `foo` ，这个函数接收一个对象作为参数。

```javascript
function foo(obj) {
  //...
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
			
    }
  }
}
```

在 `obj.hasOwnProperty(key)` 这行代码中有一处风险：前文我们知道了 JavaScript 中的属性解析机制，如果此时 `obj` 包含了一个用户提供的属性，这个属性的名称和 `hasOwnProperty` 相同，这会导致 `Object.prototype.hasOwnProperty` 被重写。因此，我们无法准确地知道哪个方法会在执行中被调用。

使用一些防御性的编程可以防止这种情况，比如我们可以从 `Object.prototype` 上“借用真正的” `hasOwnProperty` 。

```javascript
function foo(obj) {
  //...
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // ...
    }
  }
}
```

也可以以一种简短的方式来完成上述的功能，即通过字面对象来调用方法 `{}.hasOwnProperty.call(key)` 。但是它看起来仍然相当的冗长，这也是为什么后来添加了 `Object.hasOwn` 这个静态方法。

### 次优的人体工程学

当 `Object` 作为一个哈希表的时候，不符合人体工程学。许多常见的任务无法以直观的方式执行。

#### 大小

`Object` 没有提供一个方便的方法来获取大小，即属性的数量。并且对象的大小构成也存在细微的差别。

- 如果你只在意可枚举的字符串的键，可以使用 `Object.keys` 来把这些键转为一个数组，然后取这个数组的 `length` 属性。
- 如果你还想要知道不可枚举的字符串的键，可以使用 `Object.getOwnPropertyNames` 来获得键的列表，然后取它的 `length` 属性。
- 如果你对符号类型的键感兴趣，那么可以使用 `getOwnPropertySymbols` 来获取符号类型的键，或者也可以使用 `Reflect.ownKeys` 来一次性获取所有的字符串键和符号键，无论这些键是否可以枚举。

上述的选项的复杂度都是 `O(n)` ，因为我们必须首先构建一个键的数组，然后我们才能拿到它的 `length` 属性。

#### 迭代

对象的循环也有一些相似的复杂性。

我们可以用旧的 `for...in` 来遍历对象，但它会包含继承的可枚举属性。

```javascript
Object.prototype.foo = 'bar'

const obj = {id: 1}

for (const key in obj) {
  console.log(key) // 'id', 'foo'
}
```

我们不能对一个对象使用 `for...of` ，因为默认情况下对象是不可迭代的，除非我们在它上面显示地定义了 `Symbol.iterator` 方法。

我们可以使用 `Object.keys` ， `Object.values` 以及 `Object.entries` 来获取可枚举的字符串属性列表，值列表，键值对列表，然后对这个列表进行迭代，这引入了额外的步骤开销。

其次，插入的顺序也无法保证。在大多数浏览器下，整数键会按升序排列并且放在字符串键之前，尽管这个字符串键先于这个整数键被添加到对象中。

```javascript
const obj = {}

obj.foo = 'first'
obj[2] = 'second'
obj[1] = 'last'

console.log(obj) // {1: 'last', 2: 'second', foo: 'first'}
```

#### 清除

对于对象来说，没有一种简单的方式来移除所有的属性，必须通过 `delete` 操作符来删除掉一个个的属性，这种方式是[公认缓慢的](https://stackoverflow.com/questions/43594092/slow-delete-of-object-properties-in-js-in-v8)。但是在我的基准测试中，它的性能实际上比 `Map.prototype.delete` 慢了不到一个数量级而已。详细的数据会在后面展示。

#### 属性存在检测

我们无法依赖对象的 `.` 或 `[]` 方式来判断一个属性是否存在，因为属性可能会被设为 `undefined` ，我们可以使用 `Object.prototype.hasOwnProperty` 或者 `Object.hasOwn` 来进行判断。

```javascript
const obj = {a: undefined}

Object.hasOwn(obj, 'a') // true
```

## 哈希表 Map

ES6 带来了 `Map` ，它更加适合哈希表的用例。

首先，与只支持字符串和符号作为的键的 `Object` 不同的是， `Map` 支持任何数据类型的键。

> 然而，如果你使用 `Map` 来存储对象的元数据的话，那么你应该使用 `WeakMap` 而不是 `Map` ，使用 `WeakMap` 可以防止发生内存泄露。

但更重要的是， `Map` 在用户定义数据和内建程序数据之间做了清晰的分隔，代价就是我们需要额外通过 `Map.prototype.get` 来获取键值。

`Map` 更符合人体工程学，具体表现在： `Map` 默认情况下就是可迭代的，即可以用 `for...of` 来对 `Map` 对象进行迭代，或者使用嵌套解构的方式来得到 `Map` 对象的第一个键值对数据。

```javascript
const [[firstKey, firstValue]] = map
```

`Map` 提供了专门的方法来应对各种各样的普通的任务：

- `Map.prototype.has` 用来检查一个键值对是否存在，这比在 `Object` 对象上使用 `Object.prototype.hasOwnProperty` 或者 `Object.hasOwn` 更容易让人理解。
- `Map.prototype.get` 返回给定键相对应的值。可能有人会觉得使用 `get` 比在 `Object` 对象上使用 `.` 或者 `[]` 语法来取值更笨重，然而这样子的方式却很好的分隔了用户数据和内建方法。
- `Map.prototype.size` 返回了 `Map` 对象所包含的键值对的数量，从设计上就赢过了上文说过的获取 `Object` 对象大小的方式，并且，这个方法的执行速度更快。
- `Map.prototype.clear` 删除了 `Map` 对象里所有的键值对，相比 `delete` 操作符，`clear` 的执行速度要快得多。

## 性能猜想

在 JavaScript 社区中似乎有这么一个共识，那就是在大多数情况下 `Map` 都要快于 `Object` 。[有的人](https://twitter.com/diegohaz/status/1534888291732013058)还是断言从 `Object` 切换到 `Map` 后可以看到明显的性能提升。

从我在 LeetCode 上的刷题经验来看，似乎可以肯定这个观点：每当你提交的代码之后，LeetCode 会使用一份巨大的测试用例数据来测试你的代码，如果执行时间过长，那么会提示超时。比如像[这道题](https://leetcode.com/problems/random-pick-with-weight/solutions/671804/Javascript-with-explanation-and-very-interesting-find-regarding-vs-Map/)，如果使用 `Object` 会出现超时，而使用 `Map` 则不会。

然而，我相信 “ `Map` 比 `Object` 快” 只是一种简化的说法。我想找出其中的一些细微的差别。因此，我创建了一些[简单的应用](https://csb-yuu1dm.netlify.app/)来执行一些基准测试。

<details>
<summary>重要声明</summary>
尽管我做了许多的尝试，比如翻阅其他人的文章，浏览一些引擎的 C++ 的源码，但我依然无法说自己完全理解 V8 在底层是如何对 <code>Map</code> 进行优化的。构建具有完美鲁棒性的基准测试是很困难的，因为许多人都没有经历过关于基准测试或者结果分析的任何形式的训练。基准测试做的越多，就越觉得在<a href="https://en.wikipedia.org/wiki/Blind_men_and_an_elephant">盲人摸象</a>。所以请以质疑的态度来看待我这里说的所有有关性能的话。你需要在生产环境上用你的应用来测试从 <code>Object</code> 改为 <code>Map</code> 来确定是否有实际的性能提升。
</details>

## 基准测试实现细节

[这个应用](https://csb-yuu1dm.netlify.app/)带有一个表格，测量了 `Object` 和 `Map` 在插入，迭代和删除操作上的速度。

插入和迭代的性能的测量单位为 op/s （每秒完成的操作数）。我编写了一个工具函数 `measureFor` ，这个函数重复执行传入的目标函数，直到达到了指定的最小时间阈值（即界面上的 `duration` 输入框的值）。这个函数返回了每秒内传入函数执行的平均次数。

```javascript
function measureFor(f, duration) {
  let iterations = 0;
  const now = performance.now();
  let elapsed = 0;
  while (elapsed < duration) {
    f();
    elapsed = performance.now() - now;
    iterations++;
  }

  return ((iterations / elapsed) * 1000).toFixed(4);
}
```

对于删除操作，我通过测量在 `Object` 上使用 `delete` 操作符删除所有属性所花费的时间，和在相同大小下使用 `Map` 的 `delete` 方法删除所有属性所花费的时间来作比较。我可以使用 `Map` 的 `clear` 方法，但是它违背了基准测试的目的，并且我确定 `clear` 是相当快的。

在这三种操作中，我更在意插入操作，因为它往往是我日常工作中最常用到的操作。对于迭代性能，很难去提出一个能够囊括所有情况的基准测试，因为我们有太多的方式来对一个对象进行迭代，所以这里我只是单单测量 `for...in` 这个循环。

在测试中我使用了三种类型的键：

- 字符串键，比如 `yekwl7caqejth7aawelo4` 。
- 整数键，比如 `123` 。
- 由 `Math.random().toString()` 生成的数字字符串，比如 `0.4024025689756525` 。

所有的键都是随机产生的，所以并不会触发 V8 的内联缓存，并且在把这些键添加到对象前，显式地使用 `toString` 方法来把整数和小数转为字符串，以此来避免隐式类型转换而产生开销。

最后，在基准测试开始之前，进行一个至少 100 毫秒的预热阶段，在预热阶段内，我们反复地创建 `Object` 和 `Map` 对象，然后释放他们。

如果你想执行的话，相关代码被我放到了 [CodeSandbox](https://codesandbox.io/s/still-glitter-yuu1dm) 中。

开始时`Object` 和 `Map` 对象的属性或键值对为 100 个，然后增加到 500 万个。每种操作持续执行 10000 毫秒，然后观察它们彼此间的执行情况。以下是我观察到的结果：

<details>
<summary>为什么在键值对数量达到 500 万的时候就停止增加？ </summary>
因为这大概是一个 JavaScript 对象能够达到的大小。根据 StackOverflow 论坛上一位活跃的 V8 引擎工程师 <a href="https://stackoverflow.com/questions/54452896/maximum-number-of-entries-in-node-js-map#comment127492362_72149605">@jmrk</a> 的说法，如果键为字符串，那么一个正常的对象在键值对大小超过大约 8.3m 之后会慢到无法使用（这里其实是一个技术上的原因：某位的字段超过23位宽时执行中会采取非常慢的回退路径）。
</details>

### 字符串键

一般来说，当键是非数字字符串时，`Map` 在所有的操作上都要赢过 `Object`。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/27/202302271538869.avif)

但是要注意一个细节，当键值对的数量在不是特别巨大时（少于 10 万），`Map` 在插入速度上是 `Object` 的两倍，一旦键值对的数量大于 10 万，性能差距就开始减小了。

我做了些图表来更好地说明我的研究

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/27/202302271539289.avif)

上面的图表展示了插入速率（ y 轴）随着键值对数量（ x 轴）的增加而下降。然而，由于 x 轴展开的太宽了（从 100 到 100 万），就很难理解这两条线之间的差距。

所以我使用了对数尺度来处理这些数据，然后做成了如下的表格。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/27/202302271544191.avif)

你可以很清晰地看出两条线是会相交于某一点的。

我做了另一个图表，用来展现在插入速度上 `Map` 对于 `Object` 究竟快了多少。你可以看到刚开始时 `Map` 的速度是 `Object` 的两倍。然后随着时间的推移性能差距开始减小。最终在大小增加到 500 万时 `Map` 只比 `Object` 快了 30% 。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/27/202302271545948.avif)

不过大多数人基本都不会在一个 `Object` 对象或者 `Map` 对象中存放超过 100 万个键值对。在几百或者几千的大小下，相比于 `Object` ，`Map` 至少有两倍的性能提升。因此，我们是否应该到此为止，然后开始在所有地方都使用 `Map` 来重构我们的代码库？

当然不是，至少不应该期望应用的性能能够翻倍。目前我们还没有探究其他类型的键的情况。我们先来看下整数键的情况。

### 整数键

我特地在 `Object` 对象上执行整数键的基准测试的原因是 V8 引擎内部优化了[整数索引属性](https://v8.dev/blog/fast-properties#named-properties-vs.-elements)，并且把它们储存到了一个额外的数组中，这样取值的时候就能线性并且连续地访问。但在 `Map` 上我并没有找到任何信息，能够确定引擎也对 `Map` 执行了同样的优化。

首先我们把整数键的范围设为 0 到 1000

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/27/202302271546195.avif)

如我所料， `Object` 在这种情况下赢过了 `Map` 。`Object` 在插入上比 `Map` 快 65% ，在迭代上快 16%。

接着我们加大取值的范围，把最大的整数键设为 1200 .

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/27/202302271546757.avif)

似乎在插入速度上 `Map` 开始略微超过了 `Object` ，而迭代速度上 `Map` 已经是 `Object` 的 5 倍了。

现在我们只是增加了键的范围，而不是 `Object` 和 `Map` 对象的实际大小。我们可以提高大小来看看对性能的影响。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/02/27/202302271547623.avif)

当达到 1000 个属性的大小时， `Object` 比 `Map` 在插入速度上快了 70% ，在迭代速度上就只有原来的一半了。

我试了许多不同大小和键范围的组合，但都没法提出一个清晰的规律。但我观察到的整体趋势是，在占用变大时，对于一些相对较小的整数键， `Object` 在插入上会有更好的性能，删除性能上大体相同，而迭代性能只有 `Map` 的 20% 到 25%。插入速度开始变慢的最大的整形键的阈值会随着 `Object` 的变大而变大。例如，当一个 `Object` 只有 100 个键值对的时候，阈值是 1200 ；而当包含 1200 个键值对时，阈值似乎就达到了 24000 左右。

### 数字键

最后，我们来看看最后一种类型的键——数字键。

严格上讲，前文讲到的整数键其实也是数字键。这里的数字键特指通过 `Math.random().toString()` 生成的数字字符串。

数字键的结果和字符串的相似：刚开始的时候 `Map` 远远快于 `Object`（在插入和删除上是 `Object` 的两倍，在迭代上是 `Object` 的 4 到 5 倍），但是当占用变大时它们之间的性能又会趋于统一。

<details>
<summary>嵌套的 <code>Object</code> 或者 嵌套的 <code>Map</code> 的情况呢？</summary>
你可能会注意到我只提及了只有一层的扁平的 <code>Object</code> 和 <code>Map</code> 。 我也尝试过嵌套，但是我发现只要键值对的数量相同，性能特征基本保持相同，无论我们嵌套了多少层。
<p></p>
比如，当我们把 <code>width</code> 设为 100 ，把 <code>depth</code> 设为 3 时，这时键值对数量达到 10 万（ 100 * 100 * 100 ）。而结果和把 <code>width</code> 设为 100000 ，把 <code>depth</code> 设为 1 几乎一样。
</details>

### 内存使用

内存使用情况也是测试的另一个重要的方面。

因为在浏览器环境中无法控制垃圾收集器，所以我决定在 Node 环境下来进行测试。

我创建了一个[小脚本](https://gist.github.com/zhenghaohe/b496dcffe3a9a6217eba90776dc2cafe)来测量他们各自的内存使用，在每个测量前都会手动触发完整的垃圾回收机制。可以使用 `node --expose-gc` 来执行这个脚本。以下是我得到的结果

```javascript
{
  object: {
    'string-key': {
      '10000': 3.390625,
      '50000': 19.765625,
      '100000': 16.265625,
      '500000': 71.265625,
      '1000000': 142.015625
    },
    'numeric-key': {
      '10000': 1.65625,
      '50000': 8.265625,
      '100000': 16.765625,
      '500000': 72.265625,
      '1000000': 143.515625
    },
    'integer-key': {
      '10000': 0.25,
      '50000': 2.828125,
      '100000': 4.90625,
      '500000': 25.734375,
      '1000000': 59.203125
    }
  },
  map: {
    'string-key': {
      '10000': 1.703125,
      '50000': 6.765625,
      '100000': 14.015625,
      '500000': 61.765625,
      '1000000': 122.015625
    },
    'numeric-key': {
      '10000': 0.703125,
      '50000': 3.765625,
      '100000': 7.265625,
      '500000': 33.265625,
      '1000000': 67.015625
    },
    'integer-key': {
      '10000': 0.484375,
      '50000': 1.890625,
      '100000': 3.765625,
      '500000': 22.515625,
      '1000000': 43.515625
    }
  }
}
```

可以很清晰地看出 `Map` 在任何情况下都比 `Object` 要消耗更少的内存（ 20% - 50% ），这并不意外，因为 `Map` 并不像 `Object` 一样存储诸如 `writable` 、 `enumerable` 、 `configurable` 这些[属性描述符](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperties)。

## 结论

我们能从上面的分析中得到什么？

- `Map` 比 `Object` 快，除非键类型为小整数的数组索引键。`Map` 在内存占用上是更高效的。
- 在需要对一个哈希表频繁更新时，使用 `Map`；如果只想存储固定的键值对集合，使用 `Object` ，不过要小心原型继承陷阱。

> 如果你确定知道 V8 优化 `Map` 的细节或者是简单地想指出基准测试中的错误，欢迎联系我，我很乐意根据你提供的信息来更新这篇文章。

## 浏览器兼容性声明

`Map` 是一个 ES6 的特性，但现在基本不需要担心它的兼容性，除非你需要服务一些使用老旧浏览器的用户。在我看来“老旧”就是比 IE11 更老，因为即使是 IE11 也支持了 `Map` ，并且目前 IE11 已被[废弃](https://twitter.com/swyx/status/1536353949132853248)。默认情况下我们不应该盲目地转换代码以及添加垫片来把我们的代码转化到 ES5，因为这不仅会增加打包体积，而且执行速度要慢于现代的 JavaScript 代码。更重要的是， 99.999% 的用户使用了现代浏览器，这会对他们产生不利影响。

我们不必放弃对过时浏览器的支持。通过 `nomodule` 特性来提供一些备选的代码段从而支持过时的浏览器，这样我们可以避免降低使用现代浏览器用户的访问体验。如果你需要更多的有说服力的理由，可以浏览 [Transitioning to modern JavaScript](https://www.youtube.com/watch?v=cLxNdLK--yI) 这篇文章。

JavaScript 语言正在不断进化，浏览器平台在优化现代 JavaScript 代码上也在不断进步。我们不应该把浏览器的兼容性当作接口，而去忽略它们已取得的进步。