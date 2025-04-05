---
title: Content Security policy（译）
tags:
  - CSP
  - Html
  - Web 安全
categories:
  - 翻译
key: 1696150913date: 2023-10-01 17:01:53
updated: 2023-10-01 17:01:53
---


# 前言

Content Security policy（译）

<!-- more -->

原文地址：[Content security policy](https://web.dev/csp/)

这次带来的是 web.dev 上的一篇文章，不得不说这网站很不错。

前提是英语够好，很适合当厕所读物。

本文主要是讲述 Content Security policy ，即内容安全策略。

# 正文

在现代浏览器上， Content Security policy （下文统称 CSP ）可以显著减少跨站脚本攻击带来的风险和影响。

[同源策略](https://en.wikipedia.org/wiki/Same-origin_policy)是 web 内容安全模型的根源。来自 `https://mybank.com` 的代码应该只能访问 `https://mybank.com` 的数据，而 `https://evil.example.com` 网站绝对不应该被允许访问这些数据。每个源应该和网站的其他部分隔离，并为开发者提供了一个安全的沙箱，使得开发者能够构建和执行他们的应用。理论上看，这实在是太棒了，但实际上，攻击者可以使用一种聪明的方法来攻击系统。

[Cross-site script attacks](https://en.wikipedia.org/wiki/Cross-site_scripting) （跨站脚本攻击，下文统称 XSS ）就是这样的一种方法，它通过欺骗站点来传递包含了恶意代码的预期内容。这是一个很严重的问题，因为浏览器信任所有页面上展示的代码，它会将这些代码视作该页面的安全来源的一个合法的部分。 [XSS Cheat Sheet](https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet) 是一个古老但记录了具有代表性的的方法。攻击者可能会使用这些方法，通过注入恶意代码来违反这种信任规则。如果一个攻击者成功地注入了任何代码，这意味着完蛋了，用户的会话（session）数据会被窃取，应该保密的信息也会泄露给坏人。显然我们得防止这样的情况发生。

本概述重点介绍了一种可以显著降低现代浏览器中收到 XSS 攻击的风险和影响的防御措施，即 CSP 。

## Summary（摘要）

- 使用允许，告诉客户端被允许的或不被允许的名单。
- 学习可用的指令。
- 学习这些指令对应的关键词。
- 内联代码和使用 `eval()` 是有害的。
- 在执行策略之前，向服务器报告违反策略的行为。

## 允许的源列表（Source allowlists）

XSS 攻击利用的是浏览器无法区分脚本是应用的一部分还是被第三方恶意的注入的一部分。比如，本页底部的 Google 的加一按钮在从 `https://apis.google.com/js/plusone.js` 这个地址加载并在本页面的上下文中执行。我们信任这些代码，但我们不能期望浏览器自身去认定来自 `apis.google.com` 的代码是好的，而来自 `api.evil.example.com` 的代码可能是不好的。浏览器只会“乐呵呵”地下载这些文件然后执行这些请求的任何代码，无论代码的来源如何。

CSP 定义了 `Content-Security-Policy` 请求头，允许你创建一个可信任内容的允许源列表，然后指示浏览器只执行或者渲染来自这些源的资源，而不是盲目地信任服务器分发地任何资源。即使一个攻击者找到了漏洞来注入代码，由于脚本和允许源列表不匹配，因此这些恶意代码就无法被执行了。

因为我们信任了 `apis.google.com` 分发的合法的代码，我们也可以信任自身的代码。我们可以定义一个策略，这个策略允许执行来自这两个源中的其中一个源的代码：

```yaml
Content-Security-Policy: script-src 'self' https://apis.google.com
```

很简单对吧？正如你所猜测的那样， `script-src` 是一个控制指定页面相关特权脚本集合的指令，在这里我们制定了 `self` 作为一个合法的脚本源， `https://apis.google.com` 作为另一个，这样，浏览器就会尽责地下载和执行来自 HTTPS 协议的 `api.google.com` 的，以及自身来源的代码。

![](https://web-dev.imgix.net/image/T4FyVKpzu4WKF1kBNvXepbi08t52/RSnKHpls9RiDnnSGxMlE.png?auto=format&w=741)

定义了这个策略后，浏览器会简单地抛出一个错误而不是加载任何其他来源的脚本。当一个聪明的攻击者设法往你的站点注入代码时，他们只能头大地看着这条错误消息，而不是他们期望地成功注入。

### 为各种资源应用策略

虽然脚本资源是最明显具有安全风险的一类资源， 但是 CSP 提供了一系列的丰富的策略指令，这些指令可以细粒度地控制页面允许加载的资源。在上文中你已经知道了 `script-src` 指令，所以理解起来应该是不难的。

我们可以快速浏览其余的资源指令。下面的列表展示了第二版标准的指令的说明，第三版标准已经发布了，但是主流浏览器大部分都未实现。

- `base-url` 限制了页面中 `<base>` 元素可以出现的 URL 列表。
- `child-src` 列出了 worker 和内嵌 iframe 内容的 URL 列表。比如： `child-src https://youtube.com` 能够内嵌来自 Youtube 的视频而其他来源的则不可以。
- `connect-src` 限制了你可以连接的（通过 XHR ， WebSockets 和 EventSource ） URL 列表。
- `font-src` 指定了可以提供 web 字体的源列表。 Google 的 web 字体需要通过 `font-src https://themes.googleusercontent.com` 来开启。
- `form-action` 列出了 `<form>` 标签合法的提交位置列表。
- `frame-ancestors` 制定了可以内嵌到当前页面的源列表。这个指令应用到 `<frame>` ， `<iframe>` ， `<embed>` 和 `<applet>` 标签上。这个指令无法通过 `<meta>` 标签来使用，并且只能应用到非 HTML 的资源。
- `frame-src` 在第二版标准中废弃了，但是在第三版标准中恢复了。如果不设定的话，和以前一样会回退到 `child-src` 指令上。
- `img-src` 定义了一个允许加载图像的源列表。
- `media-src` 限制了允许分发视频和音频的源列表。
- `object-src` 允许控制 Flash 和其他的插件。
- `plugin-types` 限制了页面可能调用的插件的类型。
- `report-uri` 指定了一个当违反 CSP 时浏览器发送报告的 URL 。这个指令无法通过 `<meta>` 标签指定。
- `style-src` 类似于 `script-src` 。
- `upgrade-insecure-requests` 指示用户代理去重写 URL 协议，比如将 HTTP 改成 HTTPS 。这个指令适合那些有大量需要重写旧 URL 的网站。
- `worker-src` 是第三版标准的指令，用来限制加载 worker ， shared worker 或者 service worker 的源列表。截至 2017 年 7 月，该指令部分实现。

默认情况下，指令是开放的，如果你不设置某个策略的指令，比如 `font-src` ，那么这个指令的默认行为就跟你指定了 * 作为合法的源一样（也就是说你可以从任何地方加载字体，没有限制）。

你可以通过使用 `default-src` 指令来重写默认的行为。这个指令定义了大多数未指定值的指令的默认值。通常情况下，这个指令会应用到任何以 `-src` 为结尾的指令。如果 `default-src` 设置为 `http://example.com` ， 并且你未指定 `font-src` 的值，那么你只能从 `https://example.com` 加载字体了。前面的例子中我们只制定了 `script-src` ，这意味着诸如图片，字体等都能从任何源加载。

以下的指令不会回退到 `default-src` 。记住未指定值的情况等同于允许任何源。

- `base-uri`
- `form-action`
- `frame-ancestors`
- `plugin-types`
- `report-uri`
- `sandbox`

你可以根据情况为你的应用指定尽可能多的或尽可能少的指令，只需要简单地在 HTTP 请求头中列出每个指令，并用分号分开即可。你要确保在单个指令中列出指定类型需要的全部资源。如果你编写了诸如 `script-src https://host1.com; script-src https://host2.com` ，第二个指令会被简单地忽略掉。下面的方式可以正确地指定两个源一起作为合法的值：

```
script-src https://host1.com https://host2.com
```

举个例子，如果你有一个应用，这个应用从 CDN 中加载它的所有资源（假设这个 CDN 的地址为 `https://cdn.example.net` ），并且你知道你无需任何其他任何框架或者插件，那么你的策略看起来跟如下一样：

```
Content-Security-Policy: default-src https://cdn.example.net; child-src 'none'; object-src 'none'
```

### 实现细节

你可能会在网络上的各种教程中看到 `X-Webkit-CSP` 和 `X-Content-Security-Policy` 请求头。现在，你应该忽略这些前缀的请求头，现代浏览器（IE 除外）支持了不包含前缀的 `Content-Security-Policy` 请求头，这才是你应该使用的。

无论你使用了什么标头，策略都是基于每个页面来定义的，你需要对每个想要被保护的页面发送响应的 HTTP 标头。这是相当灵活的，因为你可以对有特定需求的指定页面上调整相应的策略。可能在你的站点上的某个页面有一个加一的按钮，而其他页面没有，那么你可以允许在这个页面上加载按钮代码而其他页面则不允许。

每个指令的源列表都是灵活的。你可以通过协议（ `data:` ， `https:` ），或者从只指定主机范围（比如指定 `example.com` ，这表示匹配任何该主机的源，任何的协议，任何端口）到指定一个完整的 URI 地址（比如 `https//example.com:443` ，只会匹配 HTTPS ，主机为 `example.com` 并且端口为 443 ）。通配符也是允许的值，但只能作为一个协议，一个端口，或者主机名最左边的位置， `*://*.example.com:*` 会匹配所有 `example.com` 的子域名（但不包含 `example.com` 自身），所有的协议以及任何的端口。

源列表也可以接受下面的四个关键字作为值：

- `'none'` ，正如你所期望的，它不会匹配任何东西。
- `'self'` 匹配当前的源，但不包含它的子域名。
- `'unsafe-inline'` 允许内联的 JavaScript 和 CSS 代码（我们稍后会深入讨论这一点）。
- `'unsafe-eval'` 允许使用文本执行 JavaScript 代码，比如 `eval` （稍后也会讨论这一点）。

这些关键字需要单引号包起来，比如， `script-src 'self'` （带有引号）允许执行来自当前域名的代码。而 `script-src self` （不带引号）则是允许执行来自一个名叫 self 的服务器的代码（不是来自当前域名），不带引号的写法可能和你的理解会存在出入。

### 沙盒

`sandbox` 这个指令值得一谈。它和我们见过的指令有细微不同，因为它是限制页面可以执行的操作而不是页面可以加载的资源。如果设置了 `sandbox` 指令，页面会被当作在一个带着 `sandbox` 属性的 `<iframe>` 标签内部加载的一样。这会对页面造成广泛的影响，即强制页面进入一个独立的源中，阻止表单提交，等等。这部分有点超出本文的范围了，你可以在 [HTML5 规范的沙盒部分](https://html.spec.whatwg.org/dev/origin.html#sandboxing)中找到 `sandbox` 属性的完整细节。

### \<meta\> 标签

CSP 首选的分发机制是通过请求头。但是通过直接在页面上通过标记设置策略可能也很有用。可以通过一个带有 `http-equiv` 属性的 `<meta>` 标签来实现。

```
<meta http-equiv="Content-Security-Policy" content="default-src https://cdn.example.net; child-src 'none'; object-src 'none'">
```

## 内联代码是有害的

应该明确的是， CSP 是基于允许源列表，它是指示浏览器将特定的资源集合视为可接受的并且拒绝其他的资源的一种明确的方式。然而，基于源的允许列表无法解决由 XSS 攻击带来最大的威胁，即内联代码注入。如果一个攻击者可以注入一段直接包含一些恶意载体的 script 标签的代码（ `<script>sendMyDataToEvilDotCom()</script>` ），浏览器没有一种机制去把它和包含合法的内联代码的 `<script>` 标签区分开。 CSP 通过完全禁止内联脚本来解决这个问题，这是唯一可以解决的方式。

完全禁止内联脚本不仅包括在 `<script>` 标签中直接嵌入的脚本，也包括内联的事件处理程序以及 `javascript:` 协议的地址。你需要将 `<script>` 标签的内容移动到一个外部的文件中，然后把 `javascript:` 地址和 `<a ... onclick="[JAVASCRIPT]">` 替换成适当的 `addEventListener()` 调用。比如，你可能会把下面的代码：

```html
<script>
  function doAmazingThings() {
  alert('YOU AM AMAZING!');
  }
</script>
<button onclick='doAmazingThings();'>Am I amazing?</button>
```

改写成如下这样：

```html
<script src='amazing.js'></script>
<button id='amazing'>Am I amazing?</button>
```

```javascript
// amazing.js
function doAmazingThings() {
  alert('YOU AM AMAZING!');
}
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('amazing').addEventListener('click', doAmazingThings);
});
```

重写后的代码相比原先的有很多的优点并且能够很好地配合 CSP 技术。无论你是否使用 CSP ，这都已经是最佳的实践。内联代码使用了一种你不该的使用的混合了结构和行为的方式。而外部资源可以很好地被浏览器缓存，对开发者而言更容易去理解，并且有利于编译和压缩。如果你把代码移动到外部资源中那么你可以写出更好的代码。

内联样式的道理也是一样的，所有的 `style` 属性和 `<style>` 标签都应该合并到一个外部的样式文件中，这样可以防止 CSS 启用各种巧妙的[数据泄露](https://scarybeastsecurity.blogspot.com/2009/12/generic-cross-browser-cross-domain.html)的方式。

如果你必须使用内联脚本或者样式，你可以通过在 `script-src` 和 `style-src` 的允许源列表内添加 `'unsafe-inline'` 来开它。你也可以使用随机数或者哈希值（见下文），但你真的不应该这么做。禁止内联脚本是 CSP 提供的最大的安全优势，禁用内联样式同样也能加固你的应用。移动所有不合规的代码并确保应用仍然可以正确工作需要一点儿工作量，但这是一个非常值得做出的权衡。

### 如果你必须使用它

CSP 第二版允许你通过加密随机数（只使用一次）或者一个哈希值来将内联脚本添加到允许源列表中，这提供了一种低版本兼容性。尽管这可能很麻烦，但在紧要关头真的很有用。

为了使用一个随机数，需要在 `<script>` 标签上添加一个 `nonce` 属性。它的值必须和可信任的源列表中的一个匹配。比如：

```html
<script nonce="EDNnf03nceIOfn39fn3e9h3sdfa">
  // Some inline code I can't remove yet, but need to asap.
</script>
```

现在，把这个随机数附加到 `nonce-` 关键字后，然后添加到你的 `script-src` 指令内。

```
Content-Security-Policy: script-src 'nonce-EDNnf03nceIOfn39fn3e9h3sdfa'
```

记住随机数必须在每个页面请求中重写生成，并且这些随机数必须是不可猜测的。

哈希值的工作方式也一样，为脚本自身创建一个 SHA 哈希值，然后添加到 `script-src` 指令内，而非往 `<script>` 标签上添加一个属性。比如，我们假设你的页面上包含下面的代码：

```html
<script>alert('Hello, world.');</script>
```

你的安全策略需要包含他，那么你需要写成如下形式：

```
Content-Security-Policy: script-src 'sha256-qznLcsROx4GACP2dm0UCKCzCG-HiZ1guq6ZZDob_Tng='
```

这里还有一些东西需要主义。 `sha-*` 前缀制定了生成哈希的算法。在上面的例子中，使用了 `sha256-` 前缀。CSP 也支持 `sha384-` 和 `sha512-` 。当生成哈希的时候，不要把 `<script>` 标签包含在内。并且大小写和空格，包括前置和尾随的空格也很重要。

通过 Google 搜索生成 SHA 哈希值，你可以找到多种语言的解决方案。使用 Chrome 40 之后的版本，你可以打开 DevTools 然后重新加载你的页面，然后控制台选项卡会出现你包含的每一个内联脚本的正确 sha256 哈希值的的错误信息。

## eval 也是有害的

即使一个攻击者无法直接注入脚本，但他们能够将原本其他的惰性文本转换成可执行的 JavaScript 代码以此欺骗你的应用，然后通过你的应用来执行这些代码。 `eval` ， `new Function` ， `setTimeout([string], ...)` ，以及 `setInterval([string], ...)` 都是一些能够注入可能文本并且最终执行到一些非期望的恶意行为的容器。CSP 对这个风险的默认处理是完全阻止这些容器。

这对你构建应用程序的方式有多种影响：

- 你必须通过内建的 `JSON.parse` 来解析 JSON ，而不能依赖 `eval` 。从 IE8 之后的每个[浏览器](https://caniuse.com/#feat=json)都能执行原生的 JSON 操作，这些操作是安全的。
- 重写任何 `setTimeout` 和 `setInterval` ，使用内联函数而不是字符串作为参数，比如：

把下面的方式

```javascript
setTimeout("document.querySelector('a').style.display = 'none';", 10);
```

重写成如下会更好：

```javascript
setTimeout(function () {
  document.querySelector('a').style.display = 'none';
}, 10);
```

- 避免运行时使用任何内联模板，许多模板库会使用 `new Function` 来加速运行时模板的生成。这是动态编程的一个奇淫技巧，但是存在评估恶意文本的风险。一些框架对 CSP 的支持是开箱即用的，在没有 `eval` 的情况下会回退到一个健壮的解析器。[AngularJS 的 `ng-csp` 指令](https://docs.angularjs.org/api/ng/directive/ngCsp)就是一个很好的例子。

然而，更好的是选择一个提供预编译的模板语言（比如 [Handlebars](https://handlebarsjs.com/installation/precompilation.html) ）。预编译模板可以让用户体验到比最快运行时实现还要快的速度，并且也更安全。如果 `eval` 和它的转 JavaScript 的文本片段对你的应用是必要的话，你可以通过往 `script-src` 指令中添加 `'unsafe-eval'` 作为一个允许的源来开启它，但我们强烈不鼓励你开启它。禁止字符串的执行能力使得攻击者在你的站点上执行非信任代码变得非常的困难。

## 报告

CSP 阻止客户端内非信任源的能力对你的用户来说是一个巨大的优点，但出错后发送到后端服务器的某种通知也是相当有用的，这样你就可以第一时间确认然后消除这些允许恶意注入的 bug 。为此，你可以指示浏览器 `POST` 一个 JSON 格式的违规报告到 `report-uri` 指令指定的一个地址。

```
Content-Security-Policy: default-src 'self'; ...; report-uri /my_amazing_csp_report_parser;
```

这些 JSON 格式的报告的格式看起来如下：

```json
{
    "csp-report": {
    "document-uri": "http://example.org/page.html",
    "referrer": "http://evil.example.com/",
    "blocked-uri": "http://evil.example.com/evil.js",
    "violated-directive": "script-src 'self' https://apis.google.com",
    "original-policy": "script-src 'self' https://apis.google.com; report-uri http://example.org/my_amazing_csp_report_parser"
    }
}
```

这包含了很多有用的信息，可以帮助你追踪到指定页面违规的原因，包括违规的页面地址（ `document-uri` ），页面的来源（注意这里不是 HTTP 标头字段，这个键并没有拼写错误），违规的资源（ `blocked-uri` ），造成违规的指令（ `violated-directive` ）以及页面完整的策略值（ `original-policy` ）。

### 仅报告

如果你只是刚开始使用 CSP ，那么在向你的用户推出一个严格的策略之前，评估你的应用的当前状态是有意义的。CSP 作为一个完整部署的附加选项，你可以让浏览器监控策略，报告违规行为但不强制执行策略限制。这时候你需要发送一个 `Content-Security-Policy-Report-Only` 标头而不是 `Content-Security-Policy` 标头。

```
Content-Security-Policy-Report-Only: default-src 'self'; ...; report-uri /my_amazing_csp_report_parser;
```

在仅报告中指定的策略不会阻止被限制的资源，但是会向指定的地址发送违规报告。你甚至可以两个标头都发送给客户端，强制一项策略同时监控另一项策略。这对于评估你的应用使用 CSP 带来改变的影响是一种很棒的方式。对一个新的策略采用仅报告模式，监控违规报告，然后修复开启后出现的 bug 。当你对这个策略的影响满意之后，关闭进报告模式，强制限制该策略。

## 现实世界的用例

CSP 第一版标准在 Chrome 、 Safari 和 Firefox 浏览器中相当有用，但在 IE10 中仅能有限支持。你可以在 [caniuse](https://caniuse.com/#feat=contentsecuritypolicy) 中查看具体信息。 CSP 第二版标准在 Chrome 40 之后就支持了。像 Twitter 和 Facebook 等大量的网站已经部署了这个标头（[ Twitter 用例学习](https://blog.twitter.com/engineering/en_us/a/2011/improving-browser-security-with-csp.html)这一篇文章值得一读），该标准已经完全准备好部署在你自己的站点上了。

为你的应用指定策略的第一步是评估你的应用实际加载的资源。一旦你认为自己掌握了如何将你的应用的内容组合到一起，你就可以根据这些要求来设置一个策略。让我们来看一些一些常见的用例，确定如何在 CSP 的保护范围内来获得最好支持。

### 用例 1 ，社交媒体部件

- Facebook 的[喜欢按钮](https://developers.facebook.com/docs/plugins/like-button) 实现了一些配置项。我们推荐坚持使用 iframe 版本，因为它与你站点的其他部分安全地沙箱化了。对此，为了让这个功能正常，我们需要一个 `child-src https://facebook.com` 的指令。注意，默认情况下， Facebook 提供的 iframe 代码通过一个相对路径进行加载，即 `//facebook.com` 。你可以显式指定为 HTTPS ，即 `https://facebook.com` 。如果你不是需要的话，你完全没理由使用 HTTP 。
- Twitter 的[喜欢按钮](https://publish.twitter.com/#) 依赖一个脚本和一个 iframe 。两者都是以 `https://platform.twitter.com` 为主机名。（ Twitter 同样提供默认的相对 URL ，当进行复制粘贴到本地环境时，通过修改代码来指定成 HTTPS ）通过设置成 `script-src https://platform.twitter.com; child-src https://platform.twitter.com` ， 然后只需把 Twitter 提供的代码片段移动到一个外部的 JavaScript 文件即可。
- 有相似的要求的其他平台，操作也是类似的。我们建议只设置一个 `default-src 'none'` ，然后观察控制台来确定需要启用那些资源来让部件正常工作。

包含多个组件的情况也是容易理解的，简单地组合策略指令，记住在一个指令内合并所有的单个类型的全部资源。如果你想要全部的三种媒体组件，策略看起来如下所示：

```
script-src https://apis.google.com https://platform.twitter.com; child-src https://plusone.google.com https://facebook.com https://platform.twitter.com
```

### 用例 2 

假设你运营了一个银行站点，并且你想要确保能够加载你编写的全部资源，可以先以一个阻止一切的策略（ `default-src 'none'` ）来作为开始，从此出进行构建。

我们假设银行站点从一个 CDN （ `https://cdn.mybank.net` ）加载所有的图片，样式和脚本，通过 XHR 来连接 `https://api.mybank.com/` 来拉取各种数据，并且会使用 iframe ，但只是作为站点的本地页面（没有第三方来源），不会使用 Flash ，没有字体文件以及额外的东西。在这样的条件下，我们可以发送一个最具有限制性的 CSP 标头，如下：

```
Content-Security-Policy: default-src 'none'; script-src https://cdn.mybank.net; style-src https://cdn.mybank.net; img-src https://cdn.mybank.net; connect-src https://api.mybank.com; child-src 'self'
```

### 用例 3 仅使用 SSL 

有一个结婚戒指讨论论坛的管理员想要确保所有的资源仅通过安全通道加载，但不想要编写很多的代码。重写庞大的充满了内联脚本和样式的第三方论坛软件超出了他的能力。下面的策略可能会有效：

```
Content-Security-Policy: default-src https:; script-src https: 'unsafe-inline'; style-src https: 'unsafe-inline'
```

尽管 `default-src` 指定了 `https:` ，但是脚本和样式指令没有自动的继承。每个指令完全覆盖该特定资源类型的默认值。

## 未来

CSP 第二版标准是[候选推荐](https://www.w3.org/TR/CSP2/)的。 W3C 的 Web 应用安全工作小组早已开始编写下一个版本的规范了，即 [CSP 第三版标准](https://www.w3.org/TR/CSP3/)。

如果你对这些即将推出的新功能的讨论感兴趣的话，可以浏览 [public-webappsec@](http://lists.w3.org/Archives/Public/public-webappsec/) 的邮件归档列表，或者直接加入。
