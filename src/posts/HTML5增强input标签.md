---
title: HTML5增强input标签
key: 1602066809date: 2020-10-07 18:33:29
updated: 2023-02-13 18:28:44
tags:
 - HTML5
categories:
 - 笔记
---



# 前言

写写HTML5中增强的`input`标签

<!-- more -->

# input

## placeholder

设定文本框未输入时的输入提示

```html
<input placeholder="我是placeholder设定的文字"/>
```

运行如下

<input placeholder="我是placeholder设定的文字"/>

placeholder的字体可以通过特定的样式来设定

```css
/* webkit系列的浏览器 */
input::-webkit-input-placeholder{
  color: green;
}
/* 火狐 */
input::-moz-placeholder{
  color: red;
}
/* IE */
input::-ms-input-placeholder{
  color: orange;
}
```

运行如下

<p>
  <input id="input1" placeholder="我是placeholder设定的文字"/>
  <style>
  input#input1::-webkit-input-placeholder{
    color: green;
  }
  input#input1::-moz-placeholder{
    color: red;
  }
  input#input1::-ms-input-placeholder{
    color: orange;
  }
  </style>
</p>

PS：火狐浏览器下会是红色，IE下是橙色。

## datalist

可以通过指定`input`的`list`属性指定id并配合`datalist`标签来完成下拉框的展示。

```html
<input type="text" list="datalist1" />
<datalist id="datalist1">
  <option value="选项1">选项1</option>
  <option value="选项2">选项2</option>
  <option value="选项3">选项3</option>
</datalist>
```

运行如下（点击可以看到下拉展示框）

<p>
  <input type="text" list="datalist1" autocomplete="off" />
  <datalist id="datalist1">
    <option value="选项1">选项1</option>
    <option value="选项2">选项2</option>
    <option value="选项3">选项3</option>
  </datalist>
</p>

## autocomplete

使得浏览器可以使用之前提交过的数据自动填充

```html
<input type="text" name="phone" />
```

如果之前提交过含有`name`属性值为`phone`的`form`表单，下面的`input`框点击之后会有历史的下拉列表可供选择

<p><input id="input2" type="text" name="phone" autocomplete="on" /></p>

tips：谷歌浏览器不写情况下`autocomplete`默认开启。

效果图

![](https://s1.ax1x.com/2020/10/07/0dYxk8.png)

## pattern

`pattern`属性可以让浏览器提交表单前验证内容是否符合设置的正则。

```html
<form action="https://www.w3school.com.cn/example/html5/demo_form.asp" method="get">
  <input placeholder="输入3个数字" name="number" pattern="[0-9]{3}" >
  <input type="submit" value="提交">
</form>
```

tips：如果不输入直接提交那么不会检查。

<p>
  <form action="https://www.w3school.com.cn/example/html5/demo_form.asp" method="get">
    <input placeholder="输入3个数字" name="number" pattern="[0-9]{3}" >
    <input type="submit" value="提交">
  </form>
</p>

在chrome下的效果

![](https://s1.ax1x.com/2020/10/07/0d5uCD.png)

在火狐下的效果

![](https://s1.ax1x.com/2020/10/07/0d5HIK.png)

## required

要求用户必须输入内容，不然不允许提交。

```html
<form action="https://www.w3school.com.cn/example/html5/demo_form.asp" method="get">
  <input placeholder="输入内容" name="content" required >
  <input type="submit" value="提交">
</form>
```

运行如下

<p>
  <form action="https://www.w3school.com.cn/example/html5/demo_form.asp" method="get">
    <input placeholder="输入内容" name="content" required />
    <input type="submit" value="提交">
  </form>
</p>

效果图

![](https://s1.ax1x.com/2020/10/07/0dIeLn.png)

## autofocus

使得文本框自动获得焦点，一般只能在一个页面上设置一个控件为autofocus

```html
<input placeholder="刷新试试" autofocus/>
```

tips：chrome下会把此控件自动拉到屏幕中间。

## selectionDirection

通过dom对象该属性来判断当前用户是正向选取文字还是反向选取文字

正向选择或者没有选取任何文字时为forward，反向选择时为backward

```html
<input id="input3" type="text" value="选中文字试试">
<button id="btn1" onclick="">查看当前的选择方向</button>
<span>
  <span>当前的方向为：</span>
  <span id="curSD"></span>
</span>
<script>
const el = document.getElementById('input3');
document.getElementById('btn1').onclick = function() {
  document.getElementById('curSD').innerText = el.selectionDirection;
}
</script>
```

tips：这个属性对`textarea`标签适用

运行如下

<p>
  <input id="input3" type="text" value="选中文字试试">
  <button id="btn1" onclick="">查看当前的选择方向</button>
  <span>
    <span>当前的方向为：</span>
    <span id="curSD"></span>
  </span>
  <script>
  const el = document.getElementById('input3');
  document.getElementById('curSD').innerText = el.selectionDirection;
  document.getElementById('btn1').onclick = function() {
    document.getElementById('curSD').innerText = el.selectionDirection;
  }
  </script>
</p>

## type扩展

HTML5扩展了`input`的`type`类型

- `type="search"` 和text类型的基本一样，chrome下这个输入之后在输入框内测右部有一个'X'可以删除输入内容，而火狐下没有

  <p><input type="search"/></p>

- `type="tel"` 用于输入电话，但是没有校验规则，因为世界上的电话号码有很多的格式

  <p><input type="tel"/></p>

- `type="url"` 用于输入一个url，如果不是一个合法的url不允许提交（必须存在协议前缀，比如`http://`，`https://`），不判空，如果需要非空，则需添加`required`

  <p>
    <form action="https://www.w3school.com.cn/example/html5/demo_form.asp" method="get">
      <input type="url" name="url" />
      <input type="submit" value="提交">
    </form>
  </p>

- `type="email"` 用于输入一个email，如果不是一个合法的email不允许提交，不判空，如果需要非空，则需添加`required`

  <p>
    <form action="https://www.w3school.com.cn/example/html5/demo_form.asp" method="get">
      <input type="email" name="email" />
      <input type="submit" value="提交">
    </form>
  </p>

- `type="date"` 原生自带的日期选择控件，包括年月日的选取，
  在js中通过`e.target.value`获取的是一个字符串，格式为`yyyy-MM-dd`
  也可以通过`e.target.valueAsNumber`获取时间戳（UTC时间戳），或者`e.target.valueAsDate`获取一个日期对象

  <p>
    <input id="input5" type="date"/>
    <p>
      <p>
        <span>value属性值：</span>
        <span id="valueProp">无</span>；
      </p>
      <p>
        <span>valueAsNumber属性值：</span>
        <span id="valueAsNumberProp">无</span>；
      </p>
      <p>
        <span>valueAsDate属性值：</span>
        <span id="valueAsDateProp">无</span>
      </p>
    </p>
    <script>
      document.getElementById('input5').onchange = function(e){
        document.getElementById('valueProp').innerText = e.target.value;
        document.getElementById('valueAsNumberProp').innerText = e.target.valueAsNumber;
        document.getElementById('valueAsDateProp').innerText = e.target.valueAsDate;
      }
    </script>
  </p>

- `type="month"` 原生自带的日期选择控件，包括年月（火狐下不支持）
  在js中通过`e.target.value`获取的是一个字符串，格式为`yyyy-MM`
  也可以通过`e.target.valueAsNumber`获取据1970年1月起经过的月份，或者`e.target.valueAsDate`获取一个日期对象

  <p>
    <input id="input6" type="month" />
    <p>
      <p>
        <span>value属性值：</span>
        <span id="valueProp1">无</span>；
      </p>
      <p>
        <span>valueAsNumber属性值：</span>
        <span id="valueAsNumberProp1">无</span>；
      </p>
      <p>
        <span>valueAsDate属性值：</span>
        <span id="valueAsDateProp1">无</span>
      </p>
    </p>
    <script>
      document.getElementById('input6').onchange = function(e){
        document.getElementById('valueProp1').innerText = e.target.value;
        document.getElementById('valueAsNumberProp1').innerText = e.target.valueAsNumber;
        document.getElementById('valueAsDateProp1').innerText = e.target.valueAsDate;
      }
    </script>
  </p>

- `type="week"` 原生自带周数选择控件，火狐下不支持
  value属性的值的格式为`yyyy-W + '周数'`，比如`2020-W01`表示2020年的第一周

  <p>
    <input id="input7" type="week"/>
    <p>
      <p>
        <span>value属性值：</span>
        <span id="valueProp2">无</span>；
      </p>
      <p>
        <span>valueAsNumber属性值：</span>
        <span id="valueAsNumberProp2">无</span>；
      </p>
      <p>
        <span>valueAsDate属性值：</span>
        <span id="valueAsDateProp2">无</span>
      </p>
    </p>
    <script>
      document.getElementById('input7').onchange = function(e){
        document.getElementById('valueProp2').innerText = e.target.value;
        document.getElementById('valueAsNumberProp2').innerText = e.target.valueAsNumber;
        document.getElementById('valueAsDateProp2').innerText = e.target.valueAsDate;
      }
    </script>
  </p>

- `type="time"` 原生自带时间选择控件，包括小时和分钟，时间为24小时制
  小时范围00-23，分钟范围00-59，`value`属性的值的格式为`HH:mm`
  谷歌下有下拉框可供选择，火狐下只能通过输入来选择并且火狐下多了个上下午选择框

  <p>
    <input id="input8" type="time"/>
    <p>
      <p>
        <span>value属性值：</span>
        <span id="valueProp3">无</span>；
      </p>
      <p>
        <span>valueAsNumber属性值：</span>
        <span id="valueAsNumberProp3">无</span>；
      </p>
      <p>
        <span>valueAsDate属性值：</span>
        <span id="valueAsDateProp3">无</span>
      </p>
    </p>
    <script>
      document.getElementById('input8').onchange = function(e){
        document.getElementById('valueProp3').innerText = e.target.value;
        document.getElementById('valueAsNumberProp3').innerText = e.target.valueAsNumber;
        document.getElementById('valueAsDateProp3').innerText = e.target.valueAsDate;
      }
    </script>
  </p>

- `type="datetime-local"` 可以看出`date`和`time`类型的结合体，不过选择的时间是本地时间
  支持年月日和时分，`value`属性的值的格式为`yyyy-MM-ddTHH:mm`
  火狐下不支持，chrome下无`valueAsDate`的属性值

  <p>
    <input id="input9" type="datetime-local"/>
    <p>
      <p>
        <span>value属性值：</span>
        <span id="valueProp4">无</span>；
      </p>
      <p>
        <span>valueAsNumber属性值：</span>
        <span id="valueAsNumberProp4">无</span>；
      </p>
      <p>
        <span>valueAsDate属性值：</span>
        <span id="valueAsDateProp4">无</span>
      </p>
    </p>
    <script>
      document.getElementById('input9').onchange = function(e){
        document.getElementById('valueProp4').innerText = e.target.value;
        document.getElementById('valueAsNumberProp4').innerText = e.target.valueAsNumber;
        document.getElementById('valueAsDateProp4').innerText = e.target.valueAsDate;
      }
    </script>
  </p>

- `type="number"` 元素自带的数字输入控件，只允许输入数字，如果输入其他内容则表单提交时该字段为空白
  输入框内部右侧有个上下按钮可以以此递增或递减数字

  <p>
    <input type="number" onchange="document.getElementById('valueAsDateProp5').innerText = this.valueAsNumber"/>
    <p>
      <span>valueAsNumber属性值：</span>
      <span id="valueAsDateProp5">无</span>
    </p>
  </p>

- `type="range"` 原生自带范围输入控件，默认范围0-100，通过min属性和max属性来设置设置最小值和最大值

  <p>
    <input type="range" min="-1" max="50"
        value="-1"
        onchange="document.getElementById('valueAsDateProp6').innerText = this.valueAsNumber"/>
    <p>
      <span>valueAsNumber属性值：</span>
      <span id="valueAsDateProp6">无</span>
    </p>
  </p>

- `type="color"` 原生自带的取色板控件
  chrome下的面板比较的简单，火狐下的面板比较的复杂，可以存自定的颜色
  `value`属性的值的格式为16进制颜色格式

  <p>
    <input type="color"
      onchange="document.getElementById('valueAsDateProp7').innerText = this.value"/>
    <p>
      <span>value属性值：</span>
      <span id="valueAsDateProp7">无</span>
    </p>
  </p>

# 后记

新特性虽然好，但是不同浏览器下的样式不一样，而且无法细致地控制行为，所以很少用到。

如果是一些管理系统，使用现成的组件库会是更好地选择。

比如Vue的`ElementUI`，`Vuetify`，`Ant Design Vue`。

或者React的`Ant Design`。

都有更好的兼容性和更强的控制性。

不过当成学习也是相当不错的嘛。