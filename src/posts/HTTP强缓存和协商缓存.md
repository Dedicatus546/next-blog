---
title: HTTP强缓存和协商缓存
key: 1627398288date: 2021-07-27 23:04:48
updated: 2023-02-13 18:28:44
tags:
 - HTTP
 - 缓存
categories:
 - 笔记
---


`HTTP`强缓存和协商缓存

<!-- more -->

`HTTP`中，一般把缓存分为两类，一类是强缓存，一类是协商缓存。

![](https://z3.ax1x.com/2021/07/27/WI1DaR.png)

# 强缓存

- `Pragma`：`HTTP/1.0`定义的请求头，该请求头只有一个值，即`Pragma: no-cache`，即不使用本地缓存，强制与服务器校验缓存的有效性；
- `Cache-Control`：`HTTP/1.1`定义的请求头，其中`Cache-Control:　no-cache`与`Pragma: no-cache`的效果相同，不过`Cache-Control:　no-cache`不支持`HTTP/1.0`；
- `Expires`：`HTTP/1.1`定义的请求头，该值为一个`HTTP`日期时间戳，比如`Expires: Wed, 21 Oct 2021 07:28:00 GMT`，该头部以绝对时间来判断是否使用缓存，如果在`Cache-Control`设置了`max-age`或者`s-max-age`指令，则该请求头失效，如果使用无效的日期，则表示该资源已经过期，需要重新获取。

优先级：`Pragma` \-\> `Cache-Control` \-\> `Expires`

# 协商缓存

- `Last-Modified/If-Modified-Since/If-Unmodified-Since`：这三者为配套使用的请求头；以日期为单位；
  - `Last-Modified`：响应首部，服务器通过返回该响应头来表示资源的最后的修改日期及时间，该值为一个`<day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT`，具体的语法可在MDN上查看[Last-Modified - HTTP | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Last-Modified)
  - `If-Modified-Since`：请求条件首部，如果服务器修改了资源，那么该资源的`Last-Modified`就会改变，和客户端的`Last-Modified`就会不一致，这时`If-Modified-Since`携带的还是之前的日期，与服务器一对比发现不同，就不会返回`304 Not Modified`（表示协商缓存成功），而是重新请求完整的资源，返回`200 OK`；
  - `If-Unmodified-Since`：请求条件首部，可以理解为和`If-Modified-Since`相似，区别在于如果服务器的资源的`Last-Modified`在`If-Unmodified-Since`之后的话，会返回`412 Precondition Failed`，只有两者想等才会返回对应的资源。
- `ETag/If-Match/If-None-Match`：这两者为配套使用的请求头，以一个唯一的标签来区分资源；
  - `ETag`：请求响应首部，表明该资源的一个版本标识符，如果服务器上的资源没有被修改，那么两次对统一资源的请求将会返回同一个`ETag`值；`ETag`的值可以分为验证器等级以及一个唯一的标识符；
  - `If-Match`：条件请求首部，当`If-Match`列出的标识符与服务器完全相同时，才会返回对应的资源。一般搭配`Range`头部，实现对同一文件的不同范围进行获取，如果`ETag`不匹配，返回`416 Range Not Satisfiable`；
  - `If-None-Match`：条件请求首部，当`If-None-Match`列出的标识和服务器上没有匹配的值时，才会返回请求的资源（`200 OK`），当存在的时候，返回`304 Not Modified`（命中缓存）

优先级：`ETag` \-\>　`Last-Modified`

和缓存相关的请求头为`Last-Modified/If-Modified-Since`，`ETag/If-None-Match`。

对于`ETag`请求首部的值的生成模式，并没有规定，`ETag`的值应该符合什么规定并没有明确，但是它代表某个资源独一无二的值。对于`ETag`，有两种验证器，一种是强验证器，一种是弱验证器。

- 强验证器（`Strong validation`）：强验证器的文件对象比较需要严格相等，及每一个字节都需要相同，在服务器层面来说比较难以保证，但是它确保了数据没有损失，同时也需要以牺牲性能为代价，该验证器的值可以使用`MD5`算法来对资源进行散列以获取唯一的值。
- 弱验证器（`Weak validation`）：弱验证器没有强验证器那么严格，内容相同即可认为两者是相同大的。复杂情况下可以构建一套弱验证器的体系，比如对于一个页面，即使广告内容不同，也可以认为这两个页面是相同的，那么该页面就不会重新向服务器请求。
