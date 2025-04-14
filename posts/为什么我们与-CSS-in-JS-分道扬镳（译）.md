---
title: 为什么我们与 CSS-in-JS 分道扬镳（译）
tags:
  - CSS
  - CSS-in-js
  - React
  - TypeScript
  - JavaScript
categories:
  - 译文
key: 1683093174date: 2023-05-03 13:52:54
updated: 2023-05-03 13:56:47
---



# 前言

为什么我们与-CSS-in-JS-分道扬镳（译）

<!-- more -->

原帖地址：[Why We're Breaking Up with CSS-in-JS](https://dev.to/srmagura/why-were-breaking-up-wiht-css-in-js-4g9b)

# 正文

哈喽，我是 Sam ，是 [Spot](https://www.spotvirtual.com/) 的软件工程师，也是 [Emotion](https://emotion.sh/) 的第二大活跃的维护者。 Emotion 是一个广受欢迎的 React 的 CSS-in-js 库。这篇文章将会深入研究最初吸引我使用 CSS-in-js 的理由，以及为什么我（和其他的 Spot 成员）决定放弃使用它。

首先我们先从 CSS-in-js 的概述开始说起，讲述它的优点以及缺点。接着我们将会深入在 Spot 中 CSS-in-js 造成的性能问题，以及如何去避免这些问题。

## CSS-in-js 是什么

顾名思义， CSS-in-js 允许你通过在 JavaScript 或者 TypeScript 代码中直接编写 CSS 样式来为你的 React 组件添加样式：

```jsx
// @emotion/react (css prop), with object styles
function ErrorMessage({ children }) {
  return (
    <div
      css={{
        color: 'red',
        fontWeight: 'bold',
      }}
    >
      {children}
    </div>
  );
}

// styled-components or @emotion/styled, with string styles
const ErrorMessage = styled.div`
  color: red;
  font-weight: bold;
`;
```

[styled-components](https://styled-components.com/) 和 [Emotions](https://emotion.sh/) 是 React 社区中最受欢迎的 CSS-in-js 库。虽然我只使用过 Emotion ，但我相信本文中提到的所有观点基于都可以同样的应用于 style-components 库上。

本文专注于 CSS-in-js 的运行时，在 styled-components 和 Emotion 中都包含的一个分类。CSS-in-js 运行时可以简单地理解为当应用运行的时候，解释以及应用样式。我们会在文末简单地讨论下 CSS-in-js 地编译时间。

## CSS-in-js 的优劣

在我们深入 CSS-in-js 的编码模式的本质以及对性能的影响之前，我们先从一个高等级的概述开始，来说明为什么你会选择或者不会选择采用这项技术。

### 优点

1\. **局部范围样式** ，但我们编写纯的 CSS 时，很容易在不经意间把样式应用到比原先打算的更大的范围。比如，想象你正在制作一个列表视图，每一行应该设置些 padding 间距和 border 边框，你可能会编写如下的样式：

```css
.row {
  padding: 0.5rem;
  border: 1px solid #ddd;
 }
```

在几个月后当你完全忘记这个列表试图的时候，你会创建另一个包含行的组件，自然而然的，你会在这些行上设置 `className="row"` 。现在新的组件的行有着一个难看的边框，但是你却不知道这是为什么！虽然这种类型的问题可以通过使用更长的类名或者更具体的选择器来解决，但是对于身为开发人员的你来说，你依然需要确保没有类名冲突。

CSS-in-js 默认情况下通过样式局部化来完全解决这个问题。如果你编写如下的列表视图的行：

```jsx
<div css={{ padding: '0.5rem', border: '1px solid #ddd' }}>...</div>
```

这里不可能把 padding 和 border 偶然地应用到不相关的元素上。

> 注意 CSS Modules 也提供了局部范围样式。

2\. **托管你的 CSS 样式** 。如果你使用纯的 CSS ，你可能会把所有的 `.css` 文件放到 `src/styles` 文件夹下，而所有的 React 组件则放在了 `src/components` 下。随着应用的大小不断增大，很快就会很难分辨哪个组件使用了哪个样式了。很多时候，你的 CSS 样式中最终会出现死代码，因为无法简单地辨别样式是否被使用到。

一个组织代码的更好的方法是，**在同一个地方引入一个包含了全部东西的单个组件**。这样子的实践，叫做托管，在 Kent C. Dodds 的一篇非常棒的[博客](https://kentcdodds.com/blog/colocation)中有提到。

问题是很难使用纯的 CSS 来实现托管，因为 CSS 和 JavaScript 必须放在不同的文件中，而且样式将会应用到全局，无论 `.css` 文件放在什么地方。另一个方面，如果你使用 CSS-in-js ，你可以在你的 React 组件中直接编写样式，然后使用他们，如果操作正确，这会大大地提高程序地可维护性。

> 注意：CSS Modules 也允许你合并样式与组件，虽然可以不用在同一个文件中。

3\. **在样式中可以使用 JavaScript 变量**。 CSS-in-js 能在样式规则中够引用 JavaScript 变量，比如：

```jsx
// colors.ts
export const colors = {
  primary: '#0d6efd',
  border: '#ddd',
  /* ... */
};

// MyComponent.tsx
function MyComponent({ fontSize }) {
  return (
    <p
      css={{
        color: colors.primary,
        fontSize,
        border: `1px solid ${colors.border}`,
      }}
    >
      ...
    </p>
  );
}
```

如上例子所示，你可以在 CSS-in-js 样式中使用 JavaScript 常量（比如 `colors` ）和 React 的 props 或者 state （比如 `fontSize` ） 。在样式中使用 JavaScript 常量的能力可以在某些情况下减少重复的代码，因为不必将同一个常量定义为一个 CSS 变量和一个 JavaScript 常量。使用 props 和 state 的能力允许你创建高度可定制样式的组件，而不用使用行内的样式（当相同的样式应用于许多元素时，行内样式的性能不理想。）

### 中性观点

1\. **这是一项新的热门的技术**。许多开发者，包括我，会快速采用 JavaScript 社区中最热门的新趋势。这是合理的，因为在很多情况下，新的库以及框架已经证明了比它们的前辈有巨大的改进（可以想想 React 相比早期的 JQuery 提高了多少生产力）。另一方面，我们对新的工具的痴迷另一部分原因仅仅是一种痴迷。我们害怕错过下一件重大的事情，当我们决定采取新的库或者框架时我们可能忽略真正的缺点。我认为这一定是 CSS-in-js 被广泛采用的一个因素，至少对我来说。

### 缺点

1\. **CSS-in-js 增加了运行时开销**。当你的组件渲染的时候， CSS-in-js 库必须“序列化”样式，生成纯的 CSS ，这样才可以被插入到网页文档中。很明显这占用了额外的 CPU 周期，但它真的对你的应用的性能产生足够明显的影响吗？**我们会在下个章节深入探究这个问题**。

2\. **CSS-in-js 增加了打包产物大小**。这是一个很明显的缺点，现在每一个访问你的站点的用户不得不下载 CSS-in-js 库的 JavaScript 代码。 Emotion 在最小压缩后为 [7.9kB](https://bundlephobia.com/package/@emotion/react@11.10.4) ，而 styled-component 为 [12.7kB](https://bundlephobia.com/package/styled-components@5.3.6) 。虽然两者的库体积都不是很大，但是它确确实实地增加了（作为比较， `react` + `react-dom` 为 44.5kB）。

3\. **CSS-in-js 让 React Devtools 的显示变得混乱**。对于每一个使用 `css` 的 prop 的元素， Emotion 会渲染 `<EmotionCssPropInternal>` 和 `<Insertion>` 组件。如果你在许多元素上使用 `css` 的 prop ， Emotion 的内部组件会让 React Devtools 的显示变得混乱，如下所示：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/05/03/202305031318890.avif)

### 丑陋点

1\. **频繁地插入 CSS 规则，会让浏览器强制性地执行许多额外的工作**。 [Sebastian Markbåge](https://github.com/sebmarkbage) ，React 核心团队的成员，以及 React Hook 的最初设计者，在 React 18 工作小组内写了一篇[内容丰富的讨论](https://github.com/reactwg/react-18/discussions/110)，是关于 CSS-in-js 库需要在 React 18 上如何改变才能让彼此一起工作，以及运行时 CSS-in-js 的在一般情况下的未来。他特别指出：

> 在并发渲染下， React 可以两次渲染间让出执行权给浏览器。如果你为一个组件插入了一个新的规则，然后 React 交出执行权，然后浏览器必须确认这些规则是否应用到现有的文档树中。所以它重新计算样式规则。然后 React 渲染下一个组件，然后这个组件发现了一个新的样式规则，浏览器又开始重新计算样式规则，周而复始。
> 
> **这实际上造成了当 React 渲染的时候，针对所有 DOM 节点的所有 CSS 规则在每一帧中都重新计算了**。这是非常慢的。

**2022-10-25 更新**： Sebastian 的这句话特别指的是 React 并发模式下的性能，并且没用使用 `useInsertionEffect` 。如果你想要更深入地了解，我推荐你去完整地阅读整个讨论。感谢 Dan Abramov 在推特上[指出](https://twitter.com/dan_abramov/status/1584838817982590976)了这个错误

这个问题最糟糕的是，这不是一个可修复的问题（在运行时 CSS-in-js 的上下文中）。当组件渲染的时候，运行时 CSS-in-js 库通过插入新的样式规则来工作，这在根本上不利于性能。

2\. **在使用 CSS-in-js 中，这里会有很多情况会造成错误，特别是在使用 SSR 以及、或者组件库**。在 Emotion 的仓库中，我们收到了很多类似下面的 issues ：

> 我在 SSR 下使用 Emotion 和 MUI / Mantine / （其他由 Emotion 驱动的组件库），它没有正确工作，因为...

虽然每个 issue 的根本原因不相同，但是这里有些共同的主题：

- 多个 Emotion 实例一次性加载了。即使多个实例是相同版本的 Emotion ，这也会造成问题。（[例子](https://github.com/emotion-js/emotion/issues/2639)）
- 组件库经常不会给你完整的控制样式插入顺序的权力。（[例子](https://github.com/emotion-js/emotion/issues/2803)）
- Emotion 的 SSR 支持在 React 17 和 React 18 下是不同的。这对兼容 React 18 的流式传输 SSR 是有必要的。（[例子](https://github.com/emotion-js/emotion/issues/2725)）

相信我，这些复杂性的源头只是冰山一角。（如果你很勇敢，你可以查看 TypeScript 定义中关于 `@emotion/styled` 的[部分](https://github.com/emotion-js/emotion/blob/8a163746f0de5c6a43052db37f14c36d703be7b9/packages/styled/types/base.d.ts)）

## 深入探讨性能

关于这点，很明显运行时 CSS-in-js 既有优点也有缺点。为了理解为什么我们的团队放弃了这项技术，我们需要探究 CSS-in-js 在真实世界中的性能影响。

本节专注于在 Spot 的代码库中使用 Emotion 造成的性能影响。像这样，不能假定下面的性能数字也适用于你的代码库，使用 Emotion 方式的方式有很多，每一种都有自己的性能指标。

### 在渲染内部还是渲染外部进行序列化。

样式序列化指的是 Emotion 获取 CSS 字符串或者对象样式，然后把它们转化为可插入文档的纯 CSS 字符串的过程。在序列化时 Emotion 也会计算该纯 CSS 样式的一个哈希值，这个哈希就是你所看到的类名。比如 `css-15nl2r3` 。

虽然我没有对上面的情况测量，但我认为 Emotion 如何执行的最重要的原因之一是样式序列化是在 React 的渲染周期的内部还是外部执行。

在 Emotion 的文档中的例子展示了渲染周期内部序列化，例子如下：

```jsx
function MyComponent() {
  return (
    <div
      css={{
        backgroundColor: 'blue',
        width: 100,
        height: 100,
      }}
    />
  );
}
```

每一次 `MyComponent` 渲染，对象样式会被重新序列化。如果 `MyComponent` 频繁地渲染（比如：每一次的点击），重复地序列化可能会增大性能开销。

一个性能更高的方法是把样式对象移动到组件外部，这样当模块加载的时候，序列化只会执行一次，而不是在每次渲染的时候都执行。你可以通过 `@emotion/react` 包下的 `css` 函数来实现它

```jsx
const myCss = css({
  backgroundColor: 'blue',
  width: 100,
  height: 100,
});

function MyComponent() {
  return <div css={myCss} />;
}
```

当然，这样你就不能在样式中使用 props 变量了，也就是说你错过了一个 CSS-in-js 的主要卖点。

**在 Spot 代码库中，我们在渲染周期内执行样式序列化，所以下面的性能分析会基于这种情况**。

### 对成员浏览组件的基准测试

终于到了通过分析一个来自 Spot 的真实组件来使得事情具体化的时候了。我们使用一个成员浏览的组件，一个相当简单的视图列表，显示了团队中的所有成员。组件的样式几乎都使用了 Emotion ，具体来说是使用了 `css` 的 prop 来指定样式。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/05/03/202305031318869.avif)

对于这个测试

- 成员浏览组件会展示 20 个用户。
- 不会对列表成员包裹 `React.memo` 。
- 强制最顶层的 `<BrowseMembers>` 组件每秒渲染一次，然后记录最开始 10 次渲染的时间。
- 关闭 React 的严格模式（开启严格模式会使得在分析器中的渲染时间翻倍）。

我使用 React DevTools 分析了页面，得到了头 10 次渲染时间的怕平均值，为 **54.3** 毫秒。

我个人的经验法则是 React 组件的渲染时间应该在 16 毫秒或更短，因为每秒 60 帧中的 1 帧需要 16.67 毫秒。成员浏览组件目前是这个数字的 3 倍多，所以它是一个相当繁重的组件。

这个测试是在 **M1 Max** 的 CPU 上执行的，这个 CPU 的性能超过了用户的平均值。 在功能较弱的机器上很容易达到 **200** 毫秒。

### 分析火焰图

下面是上面测试的**单个列表项**的火焰图：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/05/03/202305031319228.avif)

正如你所见， `<Box>` 和 `<Flex>` 组件的渲染花费了很多时间。这些花费就是我们使用 `css` 的 prop 所进行的 “样式原语” 操作的花费。渲染每一个 `<Box>` 组件需要使用 0.1 到 0.2 毫秒，由于 `<Box>` 的组件数量很多，加起来花费的开销就会很大了。

### 不使用 Emotion 下对成员浏览组件的基准测试

为了看到这个由于 Emotion 造成的昂贵的渲染有多大，我使用 Sass Modules 而非 Emotion 重写了组件的样式。（ Sass Modules 会在构建的时候生成纯 CSS 样式，所以使用它几乎没有性能损失）。

我重复这个如上所述的相同的测试，得到了头 10 次渲染的平均值，为 **27.7** 毫秒，和原来相比减少了 **48%** 。

所以，这就是我们放弃 CSS-in-js 的原因： 运行时性能开销简直太高了。

综上我重复这个免责声明：这个结果只直接适用于 Spot 的代码库，以及我们如何使用 Emotion。如果你的代码库用更高效的方式来使用 Emotion （比如：在渲染周期外部样式序列化），在移除 CSS-in-js 你可能会发现提升不大。

下面是一些给好奇的人准备的原始数据：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/05/03/202305031319976.avif)

## 新的样式系统

在我们下决心放弃 CSS-in-js 后，显而易见的问题是：我们应该使用什么，理想情况下，我们想要一个性能和纯 CSS 相近的样式系统，同时尽可能多的保留 CSS-in-js 的优点。这是一些我在标为“优点”的小节中的描述的 CSS-in-js 的基本优点：

- 支持局部样式。
- 样式和应用它的组件位于同一位置。
- 可以在样式中使用 JavaScript 变量。

如果你密切关注了那一小节，你可能会记得我说过 CSS Modules 也提供了局部样式和样式托管，并且 CSS Modules 会编译成纯的 CSS 文件，所以使用它并不会有运行时的开销。

在我看来， CSS Modules 的主要缺点是，归根到底，它仍然是纯的 CSS ，纯 CSS 缺少了提高开发体验和减少相同代码的特性。虽然 CSS 即将支持[嵌套选择器](https://developer.chrome.com/blog/help-css-nesting/)特性，但目前仍然没有实现，这个特性极大提升了开发体验。

幸运地是，这个问题有一个简单的解决办法，即 Sass Modules ，用 [Sass](https://sass-lang.com/) 来编写 CSS Modules 。通过 CSS Modules 你可以享受到局部样式特性，而使用 Sass ，可以享受到强大的构建时特性，并且本质上没有运行时开销。这是为什么 Sass Modules 将会成为我们通用的样式解决方案。

> 边注：使用 Sass Modules ，你会失去上文说到的第 3 个 CSS-in-js 的优点（在样式中使用 JavaScript 变量的能力）。尽管，你可以在 Sass 文件中使用一个 `:export` 块来把 Sass 的常量应用到 JavaScript 中。这不是很方便，但也聊胜于无。

### 工具类名

从 Emotion 切换到 Sass Modules ，团队担忧应用及其常见的样式会不太方便，比如：`display: flex` ，在这之前，我们会写

```jsx
<FlexH alignItems="center">...</FlexH>
```

只是用 Sass Modules 来完成的话，我们必须新建一个 `.module.scss` 文件，然后创建一个类名，这个类名应用了 `display: flex` 和 `align-items: center` 。这看起来不算糟糕，但是确实不太方便。

为了提高开发体验，我们决定引用一个工具类名系统。如果你不熟悉工具类名，它们是一组 CSS 类，每一个类会为元素设置单个 CSS 属性。通常情况下，你会组合多个工具类名来得到想要的样式。根据上面的例子，可以写出如下的代码：

```jsx
<div className="d-flex align-items-center">...</div>
```

[Bootstrap](https://getbootstrap.com/) 和 [Tailwind](https://tailwindcss.com/) 是最受欢迎的 CSS 框架，它们提供了许多的工具类。这些库为它们的工具系统花费了大量的设计精力，所以选择其中的一个而非自研一个是最有意义的。我已经使用 Bootstrap 很多年了，所以我们选择了 Bootstrap 。虽然可以引入 Bootstrap 工具类名来作为预构建 CSS 文件，但是我们仍然需要自定义类来适配我们现有的样式系统，所以我拷贝了 Bootstrap 源码的相关部分到我们的项目中。

我们已经为新的组件使用 Sass Modules 和工具类名，这一过程到目前已经持续了几周，我们用起来相当地开心。开发体验和 Emotion 相似，运行时的性能非常的优秀。

> 边注：我们也使用了 [typed-scss-modules](https://www.npmjs.com/package/typed-scss-modules) 包来为 Sass Modules 生成 TypeScript 定义。可能这样做最大的好处时允许我们定义一个工作方式类似于 [classnames](https://www.npmjs.com/package/classnames) 的 utils 的工具函数，除了它只接受合法的工具类名作为参数。

## 关于编译时 CSS-in-js 

本文主要专注于运行时 CSS-in-js 库，比如 Emotion 和 styled-components 。最近，我们发现一些新出现的 CSS-in-js 库，它们在编译的时候把样式转化为纯的 CSS 。

- [Compiled](https://compiledcssinjs.com/)
- [Vanilla Extract](https://vanilla-extract.style/)
- [Linaria](https://linaria.dev/)

这些库支持提供和运行时 CSS-in-js 相似的优点，并且没有运行时开销。

虽然我自己没有使用过任何编译时的 CSS-in-js 库，但我觉得和 Sass Modules 相比，它仍然有缺点。以下是当我特别查看编译环节的时候发现的缺点：

- 样式仍然需要在组件第一次挂载时插入文档，这会强制浏览器对每一个 DOM 节点重新计算样式（这个缺点在丑陋点一节中有讨论到）
- 动态样式，比如在这个[例子](https://compiledcssinjs.com/#speed-up-your-styles)中的 `color` 的 prop 就无法在构建时被提取。所以编译过程使用 `style` 的 prop （内联样式）添加了一个 CSS 变量。众所周知当应用行内样式到许多的元素上时，会导致性能下降。
- 这些库仍然会往 React 树中插入样板组件，比如[这里](https://compiledcssinjs.com/#speed-up-your-styles)所示。这和运行时 CSS-in-js 一样会使得 React DevTools 变得混乱。

## 结论

感谢您阅读这篇深入讨论运行时 CSS-in-js 的文章。和许多技术一样，它有优点，也有缺点。最终，评估这些优缺点取决于作为程序员的你，然后关于这项技术是否符合你的用例做出明确的决定。对于 Spot 的我们来说， Emotion 的运行时的性能开销远远超过开发体验上的优点，特别是当你发现 Sass Modules + 工具类名的替代方案也有良好的开发体验并且提供了及其优越的性能时。

## 关于 Spot

在 [Spot](https://www.spotvirtual.com/) 中，我们正在构建远程工作的未来。当公司选择远程办公时，可能会失去在办公室中存在的联系感和文化感。 Spot 是一个下一代的沟通平台，通过结合传统的消息沟通和能够创建和定制你自己的 3D 虚拟办公室特性的视频会议，将你们的团队聚集在一起。如果你听起来很有趣，可以联系我们！

PS：我们正在寻找才华横溢的软件工程师来加入我们的团队，[可以在这里查看详情](https://www.spotvirtual.com/careers/)

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/05/03/202305031320670.avif)

# 后记

我也尝鲜过 CSS-in-js ，我觉得 CSS-in-js 最大的优点就是能够和 JavaScript 无缝衔接，能够在 render 内部使用相关的变量。

不过上面也提到了，过多的样式插入也会消耗性能，目前我看到应该就力扣使用了 Emotion 的库，使用起来感觉也还行吧。

Vue 就支持直接写局部样式，而不用担心污染全局，不过和 CSS Modules 之类一样，不支持使用 JavaScript 变量，不过我记得有类似通过 CSS 变量来实现的特性，和文中提到的编译时 CSS-in-js 很像。

原帖评论也有提到一个 BEM 的 CSS 命名规则，不过一个项目毕竟不是一个人完成的，每个人对起名的理解都不一样，比如有的人复数喜欢用 `s` 结尾，而有的人喜欢用 `list` 结尾，比如 `users` 和 `userList`。

归根结底，需要根据项目自身的情况来选择合适的技术栈，就如同原文所说的，如果项目更加注重开发体验，网站整体的复杂性不高，更多的是静态内容显示，那么使用 Emotion 的相关 CSS-in-js 是相当不错的。

而如果网站对性能的要求很高，那么选择 0 运行时开销的 CSS 技术就很有必要了，目前来看首选的就是 CSS(Sass) Modules 。