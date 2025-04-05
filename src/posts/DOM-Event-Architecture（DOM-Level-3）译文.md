---
title: DOM Event Architecture（DOM-Level-3）译文
key: 1606963845date: 2020-12-03 10:50:45
updated: 2023-02-13 18:28:44
tags:
 - DOM
categories:
 - 笔记
---


# 前言

👴回来了，这篇主要翻译下w3草案`UI Event`中的第3小节 - DOM事件体系（DOM Event Architecture）

这一个小节主要讲了事件捕获和冒泡的东西吧，当作一个笔记

<!-- more -->

原文：[UI Events](https://www.w3.org/TR/2019/WD-uievents-20190530)

# DOM Event Architecture （DOM事件体系）

> This section is non-normative. Refer to [DOM](https://dom.spec.whatwg.org) for a normative description of the DOM event architecture

本节是非规范化的。转到DOM标准来获得一个对DOM事件体系的一个规范化的描述。

个人感觉这个草案讲的比较宏观，而规范那边讲的很细致，就会讲对象的结构和伪代码等

对于我这种刚刚接触规范，感觉从草案上看会更好~，先对大体有一个认识

## Event dispatch and DOM event flow（事件分发和DOM事件流）

> This section gives a brief overview of the event **dispatch** mechanism and describes how events propagate through the DOM tree. Applications can dispatch event objects using the `dispatchEvent()` method, and the event object will propagate through the DOM tree as determined by the DOM event flow.

本节简短的概述了事件分发的机制以及事件如何通过DOM树进行传播。应用可以通过使用`dispatchEvent()`方法来分发事件对象，事件对象通过DOM事件流来确定在DOM树中的传递。

这里涉及到一个术语：**dispatch**

***

**dispatch**

> To create an event with attributes and methods appropriate to its type and context, and propagate it through the DOM tree in the specified manner. Interchangeable with the term `fire`, e.g., `fire` a `click` event or `dispatch` a `load` event.

创建一个带有适合对应类型和上下文的属性和方法的事件，然后在DOM树中通过特定的方式传递这个事件。可与术语`fire`互换，比如，比如可以说`fire`一个点击事件，也可以说`dispatch`一个加载的事件

***

> Event objects are dispatched to an **event target**. But before dispatch can begin, the event object’s **propagation path** must first be determined.

事件对象被分发到一个事件目标对象上。但在分发过程开始之前，事件对象的传递路径必须先确定下来

这里涉及到两个术语 **event target** 和 **propagation path**

***

**event target**

> The object to which an event is targeted using the §3.1 Event dispatch and DOM event flow. The event target is the value of the target attribute.

事件针对的对象（也就是事件的目标对象）。事件目标对象就是`target`属性的值（也就是我们在函数中使用参数`e`的`e.target`值）

**propagation path**

> The ordered set of current event targets though which an event object will pass sequentially on the way to and back from the event target.
> As the event propagates, each current event target in the propagation path is in turn set as the currentTarget.
> The propagation path is initially composed of one or more event phases as defined by the event type, but MAY be interrupted.
> Also known as an event target chain.

一个事件对象按序的到达事件目标对象以及从事件目标对象离开的过程中当前的事件对象组成的一个有序的集合。当事件传递的时候，每个在传播路径中的当前事件目标对象以及被设置为`currentTarget`（也就是赋值的一个过程）
传播路径最初由一个或者多个由事件类型定义的事件阶段组成，但可能会被打断。也可以理解为一条事件目标对象链。

***

> The **propagation path** is an ordered list of **current event targets** through which the event passes. This **propagation path** reflects the hierarchical tree structure of the document.
> The last item in the list is the **event target**, and the preceding items in the list are referred to as the target’s ancestors, with the immediately preceding item as the target’s parent.

传递路径是一个事件对象通过的当前事件目标对象的一个有序的集合。这个传递路径反映了文档的分层树的结构。列表中的最后一项为事件目标对象，之前的项称为目标对象的祖先，而直接祖先成为目标对象的父节点。

这里涉及到一个术语：**current event targets**

***

**current event targets**

> In an event flow, the current event target is the object associated with the event handler that is currently being dispatched.  
> This object MAY be the event target itself or one of its ancestors.  
> The current event target changes as the event propagates from object to object through the various phases of the event flow.  
> The current event target is the value of the `currentTarget` attribute.

在一个事件流中，当前事件目标对象为当前正在分发的事件处理器关联的对象
这个对象可能可能为事件目标对象本身或者是它的一个祖先。
当前事件目标对象在事件通过事件流的几个阶段从对象间传递的过程中改变
当前事件目标对象为`currentTarget`属性的值

PS：这里提到的`current target event`和先前的`target event`对应了每次我们在注册回调函数里面使用的参数`e`的属性`currentTarget`和`target`
`target`为触发了事件的dom节点，而`currentTarget`可以理解为指向了你注册回调时的那个dom节点

***

> Once the **propagation path** has been determined, the event object passes through one or more **event phases**.  
> There are three event phases: **capture phase**, **target phase** and **bubble phase**.  
> Event objects complete these phases as described below.  
> A phase will be skipped if it is not supported, or if the event object’s propagation has been stopped.  
> For example, if the `bubbles` attribute is set to false, the bubble phase will be skipped, and if `stopPropagation()` has been called prior to the dispatch, all phases will be skipped.

一旦传递路径被确定下来，事件对象传递给一个或多个事件阶段。
这里存在三个时间阶段：捕获阶段，目标阶段和冒泡阶段（这里可以对应下面这张图）
事件对象按照下面的描述来完成这些阶段。
如果某个阶段不被支持，或者事件对象的传播被中止，那么这个阶段会被跳过。
比如，如果冒泡属性被设置为`false`，那么冒泡阶段会被跳过，如果预先在分发前调用了`stopPropagation()`，所有的阶段会被跳过。

这里有几个术语：`event phases（事件阶段）`，`capture phase（捕获阶段）`,`target phase（目标阶段）`,`bubble phase（冒泡阶段）`，这几个术语在这里比较好理解，并且下面的图面也可以很好的展示这三个过程。

> - The capture phase: The event object propagates through the target’s ancestors from the `Window` to the target’s parent. This phase is also known as the capturing phase.
> - The target phase: The event object arrives at the event object’s **event target**. This phase is also known as the at-target phase. If the **event type** indicates that the event doesn’t bubble, then the event object will halt after completion of this phase.
> - The bubble phase: The event object propagates through the target’s ancestors in reverse order, starting with the target’s parent and ending with the `Window`. This phase is also known as the bubbling phase.

- 捕获阶段：事件对象从目标对象的组件（Window对象开始）到目标对象的父对象传递。
- 目标阶段：事件对象到达它的事件目标对象。如果事件类型表明事件不冒泡的话，那么事件对象会在这个阶段完成之后停止。
- 冒泡阶段：事件对象以捕获阶段相反的顺序进行传递，从事件目标对象的父节点开始，然后结束于Window对象。

![](https://i.loli.net/2020/12/03/iyUC1nhHEOspBGx.png)

## Default actions and cancelable events（默认动作和可取消的事件）

> Events are typically dispatched by the implementation as a result of a user action, in response to the completion of a task, or to signal progress during asynchronous activity (such as a network request).  
> Some events can be used to control the behavior that the implementation may take next (or undo an action that the implementation already took).  
> Events in this category are said to be cancelable and the behavior they cancel is called their **default action**.  
> Cancelable event objects can be associated with one or more 'default actions'. To cancel an event, call the `preventDefault()` method.

事件通常由一个实现了用户行为的操作分发，响应任务的完成，或者在异步活动间作为信号进程（比如一个网络请求）
一些事件常用于控制下一步实现可能出现的行为（或者回退一个早已实现的动作）
在这个类别的事件被称为可取消的，取消的行为被称为它们的默认动作
可取消的事件对象可以被一个或多个‘默认动作’关联。为了取消一个事件，调用`preventDefault()`方法。

这里有个术语：**default action**

***

**default action**

> A default action is an OPTIONAL supplementary behavior that an implementation MUST perform in combination with the dispatch of the event object.  
> Each event type definition, and each specification, defines the default action for that event type, if it has one.  
> An instance of an event MAY have more than one default action under some circumstances, such as when associated with an activation trigger.  
> A default action MAY be cancelled through the invocation of the `preventDefault()` method.  
> For more details, see §3.2 Default actions and cancelable events.

默认动作是可选的补充行为，实现必须和事件分发结合执行。
每个事件类型定义，每个规范，都定义了对应事件类型的默认动作（如果它拥有的话）。
每个事件的实例可能在某些情况下存在超过一个的默认动作，比如当和激活触发器关联时。
一个默认动作可能会被通过执行`preventDefault()`方法而取消。
更多的细节，可以查看§3.2节（也就是当前这一节）。

***

> EXAMPLE 1
> A mousedown event is dispatched immediately after the user presses down a button on a pointing device (typically a mouse).  
> One possible **default action** taken by the implementation is to set up a state machine that allows the user to drag images or select text.  
> The **default action** depends on what happens next — for example, if the user’s pointing device is over text, a text selection might begin.  
> If the user’s pointing device is over an image, then an image-drag action could begin.  
> Preventing the **default action** of a mousedown event prevents these actions from occurring.

一个鼠标事件会在用户使用点击设备（通常是一个鼠标）按下一个按钮之后立即被分发。
一个可能的采取实现的默认动作会设置一个状态机，允许用户去拖拽图像或者选择文字。
默认动作取决于接下来会发生什么 - 比如，如果用户的点击设备放在文字上，那么文字选择的动作就会开始
如果用户的点击设备放在一个图像的上面，那么一个图片拖拽的动作就会开始
阻止一个按下事件的默认的动作可以防止这些动作的发生

> **Default actions** are usually performed after the event dispatch has been completed,  
> but in exceptional cases they may also be performed immediately before the event is dispatched.

默认动作通常在事件分发完成之后被执行，但在特殊的场景下可能会在事件分发之前立即执行

> EXAMPLE 2
> The **default action** associated with the click event on `<input type="checkbox">` elements toggles the checked IDL attribute value of that element.  
> If the click event’s **default action** is cancelled, then the value is restored to its former state.

在`<input type="checkbox">`元素上关联点击事件的默认动作为切换这个元素`checked`属性的值
如果点击事件的默认动作被取消，那么值会恢复到之前的状态（也就是不会改变）

> When an event is canceled, then the conditional **default actions** associated with the event is skipped (or as mentioned above, if the default actions are carried out before the dispatch, their effect is undone).  
> Whether an event object is cancelable is indicated by the `cancelable` attribute.  
> Calling `preventDefault()` stops all related **default actions** of an event object.  
> The `defaultPrevented` attribute indicates whether an event has already been canceled (e.g., by a prior event listener).  
> If the DOM application itself initiated the dispatch, then the return value of the `dispatchEvent()` method indicates whether the event object was cancelled.

当一个事件被取消，与事件关联的有条件的默认动作会被跳过（或者就如上面提到的，如果默认动作在分发前被执行，它们的影响会被撤销）
事件对象是否可以取消由由`cancelable`属性来指明。
调用`preventDefault()`来停止一个事件对象的所有相关的默认动作
`defaultPrevented`属性表明事件是否已经被取消（比如，通过之前的一个事件监听函数）
如果是dom应用本身发起的分发操作，那么`dispatchEvent()`方法的返回值表明事件对象是否被取消

> Many implementations additionally interpret an event listener’s return value, such as the value `false`,  
> to mean that the **default action** of cancelable events will be cancelled (though `window.onerror` handlers are cancelled by returning `true`).

许多实现另外地解释了事件监听函数地返回值，比如值为`false`，意味着可取消地事件的默认动作被取消（虽然`window.onerror`以返回`true`来取消默认的动作）

## Synchronous and asynchronous events（同步和异步的事件）

> Events may be dispatched either synchronously or asynchronously.

事件可能以同步或者异步的方式分发。

> Events which are synchronous (sync events) are treated as if they are in a virtual queue in a first-in-first-out model,  
> ordered by sequence of temporal occurrence with respect to other events, to changes in the DOM, and to user interaction.  
> Each event in this virtual queue is delayed until the previous event has completed its propagation behavior, or been canceled.  
> Some sync events are driven by a specific device or process, such as mouse button events.  
> These events are governed by the **event order** algorithms defined for that set of events, and **user agents** will dispatch these events in the defined order.

同步的事件被当作放在在一个虚拟的先进先出的队列中，以和其他的事件按时间发生的顺序进行排序，依次执行来改变DOM以及和用户交互。
在这个虚队列中每个事件会延迟到之前的事件完成它的传递行为或者被取消之后再执行。
一些同步事件由一个特定的设备或者进程来驱动，比如一个鼠标按钮事件
这些事件通过为事件集合定义的事件排序算法来管理，用户代理按照定义的顺序分发这些事件

这里有两个术语：**event order**和**user agents**

***

**event order**

> The sequence in which events from the same event source or process occur, using the same or related event interfaces.  
> For example, in an environment with a mouse, a track pad, and a keyboard, each of those input devices would constitute a separate event source, and each would follow its own event order.  
> A mousedown event from the trackpad followed by a mouseup event from the mouse would not result in a click event.

相同事件源或者使用了相同或者线管事件接口的处理程序发生时的事件的顺序
比如，一个带有鼠标，触控板和键盘的环境，每个输入设备构成了一个分离的事件源，并且遵循它们自己的事件顺序。  
触控板的一个按下事件，然后一个鼠标的弹起事件不会导致一个点击事件（这里意思是，因为一个点击事件可以看成鼠标按下然后弹起之后触发的事件，但是由于这两个事件的源不同，并不会触发一个点击事件）

> There can be interactions between different event orders.  
> For example, a click event might be modified by a concurrent keydown event (e.g., via Shift+click).  
> However, the event orders of these different event sources would be distinct.

在不同的事件顺序中可以进行交互。
比如，一个点击事件可能被一个同时的键盘按下事件（比如Shift+click）修改。
然而，不同事件源的事件顺序是不同的

> The event order of some interfaces are device-independent.  
> For example, a user might change focus using the Tab key, or by clicking the new focused element with the mouse.  
> The event order in such cases depends on the state of the process, not on the state of the device that initiates the state change.

一些实现的事件顺序是设备无关的。
比如，一个用户可能使用Tab键来改变焦点，或者通过鼠标点击新的聚焦的元素。
事件顺序在这些情况下依赖进程的状态，而不依赖开始状态改变的设备的状态

**user agents**

> A program, such as a browser or content authoring tool, normally running on a client machine,  
> which acts on a user’s behalf in retrieving, interpreting, executing, presenting, or creating content.  
> Users MAY act on the content using different user agents at different times, for different purposes.  
> See the §1.2.1 Web browsers and other dynamic or interactive user agents and §1.2.2 Authoring tools for details on the requirements for a conforming user agent.

一个程序，比如一个浏览器或者一个内容创作工具，一般运行在客户机器上，
在检索，解释，执行，呈现或者内容创建时代表用户进行操作。
用户可能为了不同的目的，在不同时间，使用不同的用户代理操作内容。
查看1.2.1节和1.2.2节来知道一个符合的用户代理的要求的细节。

***

> Events which are asynchronous (async events) may be dispatched as the results of the action are completed,  
> with no relation to other events, to other changes in the DOM, nor to user interaction.

异步事件可能作为动作完成的结果被分发，和其他事件，DOM中的其他更改或者用户的交互没有关系。

> EXAMPLE 3
> During loading of a document, an inline script element is parsed and executed.  x
> The load event is queued to be fired asynchronously at the script element.  
> However, because it is an async event, its order with relation to other synchronous events fired during document load (such as the DOMContentLoaded event from [HTML5](https://www.w3.org/TR/2019/WD-uievents-20190530/#biblio-html5)) is not guaranteed.

在文档加载中，一个内联的script元素会被解析和执行。
load事件进入队列等待，然后异步地分发到script元素上。
然而，由于它是一个异步的事件，在文档加载时（比如HTML5中的DOMContentLoaded事件）不能保证它与其他相关的同步事件的分发的顺序

## Trusted events（可信赖的事件）

> Events that are generated by the **user agent**, either as a result of user interaction,  
> or as a direct result of changes to the DOM, are trusted by the **user agent** with privileges that are not afforded to events generated by script through the `createEvent()` method,  
> modified using the `initEvent()` method, or dispatched via the `dispatchEvent()` method.  
> The isTrusted attribute of trusted events has a value of true, while untrusted events have a isTrusted attribute value of false.

由用户代理生成的事件，或者用户交互的结果，或者改变DOM的直接结果，会被有特权的用户代理信任（不包括通过`createEvent()`方法生成的事件，使用`initEvent()`方法进行修改，或者通过`dispatchEvent()`方法进行分发）。
可信任的事件的`isTrusted`属性值为`true`，而不可信任的事件的`isTrusted`值为`false`

> Most untrusted events will not trigger default actions, with the exception of the click event.  
> This event always triggers the **default action**, even if the isTrusted attribute is false (this behavior is retained for backward-compatibility).  
> All other untrusted events behave as if the `preventDefault()` method had been called on that event.

大多不可信任的事件不会触发默认的动作，除了点击事件。
这个事件总是触发默认的动作，即使`isTrusted`属性为`false`（这个行为为了向后兼容而保留）
所有其他的不可信任的事件的行为撕毁就是在那个事件上调用了`preventDefault()`

## Activation triggers and behavior（激活的触发器和行为）

> Certain event targets (such as a link or button element) may have associated **activation behavior** (such as following a link) that implementations perform in response to an activation trigger (such as clicking a link).

某些事件目标对象（比如一个link（链接）或者button（按钮）元素）可能和激活的行为相关（比如跟随一个链接），实现执行来响应一个激活的触发器（比如点击一个链接）

> EXAMPLE 4
> Both HTML and SVG have an `<a>` element which indicates a link.  
> Relevant activation triggers for an `<a>` element are a click event on the text or image content of the `<a>` element,  
> or a keydown event with a key attribute value of "Enter" key when the `<a>` element has focus.  
> The activation behavior for an `<a>` element is normally to change the content of the window to the content of the new document,  
> in the case of external links, or to reposition the current document relative to the new anchor, in the case of internal links.

HTML和SVG都有一个`<a>`标签来表明一个链接。
一个`<a>`元素的相关的激活触发器为在文本或者`<a>`元素的图像内容上的点击事件，或者当`<a>`元素被聚焦时一个带有key属性值为`Enter`的keydown事件。
一个`<a>`标签激活行为一般改变window的内容为新的文档的内容，比如外部的链接，用来重新定位当前文档到一个新的描点，比如内部的链接

这里有两个术语**activation behavior**和**activation trigger**

***

**activation behavior**

> The action taken when an event, typically initiated by users through an input device, causes an element to fulfill a defined task.  
> The task MAY be defined for that element by the host language, or by author-defined variables, or both.  
> The default task for any given element MAY be a generic action, or MAY be unique to that element.  
> For example, the activation behavior of an HTML or SVG `<a>` element is to cause the user agent to traverse the link specified in the href attribute,  
> with the further optional parameter of specifying the browsing context for the traversal (such as the current window or tab, a named window, or a new window).  
> The activation behavior of an HTML `<input>` element with the type attribute value submit is be to send the values of the form elements to an author-defined IRI by the author-defined HTTP method.  
> See §3.5 Activation triggers and behavior for more details.

当一个事件，通常为通过用户输入设备发起，携带的动作使得一个元素完成一个定义的任务。
任务可能通过宿主语言，或者通过作者定义的变量，或者两者都使用来对对应元素定义。
任何给定的默认任务可能是一个通用的动作，或者可能唯一存在这个元素。
比如，HTML或者SVG的`<a>`标签元素的激活行为让用户代理遍历指定链接的`href`属性，遍历带有指定浏览上下文的其他可选的参数（比如当前窗口或者标签页，一个命名的窗口，或者一个新的窗口）
HTML的带有type属性值为submit的`<input>`元素激活行为为通过用户定义的HTTP方法发送form表单的值到一个用户定义的IRI
查看3.5节来获得更多细节信息

**activation trigger**

> An event which is defined to initiate an activation behavior.  
> Refer to §3.5 Activation triggers and behavior for more details.

一个定义的事件发起的一个激活行为
导向3.5节获得更多的细节信息

***

## Constructing Mouse and Keyboard Events（构建的鼠标和键盘事件）

> Generally, when a constructor of an Event interface, or of an interface inherited from the Event interface, is invoked, the steps described in [DOM]() should be followed.  
> However the KeyboardEvent and MouseEvent interfaces provide additional dictionary members for initializing the internal state of the Event object’s key modifiers: specifically, the internal state queried for using the `getModifierState()` and `getModifierState()` methods.  
> This section supplements the DOM4 steps for intializing a new Event object with these optional modifier states.

通常情况下，当一个事件接口的构造器，或者一个继承事件接口的接口被执行时，步骤会按照DOM中所描述的。
然而键盘事件和鼠标书简接口提供了额外的字典成员来初始化事件对象的关键修饰符的内部状态：特别是，可以使用`getModifierState()`和`getModifierState()`方法来查询内部的状态。
这个小节补充了DOM4中初始化一个带有可配置的修改师傅状态的事件对象的步骤

> For the purposes of constructing a KeyboardEvent, MouseEvent, or object derived from these objects using the algorithm below,  
> all KeyboardEvent, MouseEvent, and derived objects have internal key modifier state which can be set and retrieved using the key modifier names described in the Modifier Keys table in UIEvents-Key.

为了构造一个键盘事件，鼠标事件，或者从这些事件对象派生的对象，使用下面的算法，
所有的键盘事件，鼠标事件，和派生对象有内部的关键修饰符状态，这个状态可以使用关键词修饰名字（在UIEvents-Key中修饰关键词表格描述）被设置和重置

> The following steps supplement the algorithm defined for constructing events in DOM4:
> - If the Event being constructed is a KeyboardEvent or MouseEvent object or an object that derives from either of these, and a EventModifierInit argument was provided to the constructor, then run the following sub-steps:
>   - For each EventModifierInit argument, if the dictionary member begins with the string "modifier", then let the key modifier name be the dictionary member’s name excluding the prefix "modifier", and set the Event object’s internal key modifier state that matches the key modifier name to the corresponding value.

下面步骤补充了DOM4中构造事件定义的算法
- 如果构造的事件是一个键盘或者鼠标事件或者派生自这两个的事件，那么向构造函数提供一个`EventModifierInit`参数，然后执行下面的子步骤：
  - 遍历`EventModifierInit`参数，如果字典成员以`modifier`字符开头，那么设置字典成员名字为不包含`modifier`前缀的关键修饰符的名字，然后设置匹配关键修饰符名字的事件对象的内部关键修饰符状态为对应的值。

# 后记

最近打算写个DNF的纸娃娃系统，主要是生成补丁代码以及在线模拟换装的这么一个应用

原来的[纸娃娃](https://avatar.kritsu.net/)感觉挺多bug的，而且也好像没人维护

打算以这个为样本，再做一个，主要是黑猫的代码转es的代码可太恶心了...

附上一张开发的图，用的react + Material UI

![](https://i.loli.net/2020/12/03/XEqi2o9FM4JpngW.png)

PS：如果能搞成毕业设计那就有意思了哈哈哈哈哈哈哈哈哈