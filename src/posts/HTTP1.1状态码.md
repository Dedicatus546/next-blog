---
title: HTTP1.1状态码（译）
key: 1601798040date: 2020-10-04 15:54:00
updated: 2023-02-13 18:28:44
tags:
 - HTTP
categories:
 - 笔记
---


# 前言

学一学状态码，这样被问到就能答出来了

<!-- more -->

# HTTP1.1状态码

原文来自HTTP1.1的官方RFC

[传送门](http://www.faqs.org/rfcs/rfc2616.html)

## 1xx

> This class of status code indicates a provisional response,
> consisting only of the Status-Line and optional headers, and is
> terminated by an empty line. There are no required headers for this
> class of status code. Since HTTP/1.0 did not define any 1xx status
> codes, servers MUST NOT send a 1xx response to an HTTP/1.0 client
> except under experimental conditions.

这类状态码表示一个临时的响应，只包括状态行和可选的头部，接着以一个空行结束这个响应。
对于这类状态码没有必要的头部。
因为HTTP/1.0没有定义任何的1xx状态码，所以服务器不能发送一个1xx响应给一个使用HTTP/1.0协议的客户端，除非是在实验性质的条件下。

> A client MUST be prepared to accept one or more 1xx status responses
> prior to a regular response, even if the client does not expect a 100
> (Continue) status message. Unexpected 1xx status responses MAY be
> ignored by a user agent.

一个客户端必须准备好去接收一个或多个先于常规响应的1xx状态的响应，即使客户端不期待一个100(Continue)的状态消息。
不被期望的1xx状态响应可能会被用户代理忽略。

> Proxies MUST forward 1xx responses, unless the connection between the
> proxy and its client has been closed, or unless the proxy itself
> requested the generation of the 1xx response. (For example, if a
> proxy adds a "Expect: 100-continue" field when it forwards a request,
> then it need not forward the corresponding 100 (Continue)
> response(s).)

代理必须转发1xx响应，除非在代理和客户端之间的连接已经关闭，或者代理自身请求1xx响应的生成。
（比如，当一个代理转发一个请求时添加了一个"Expect: 100-continue"字段，那么他就不必转发相应的100(Continue)响应）。

### 100 Continue

> The client SHOULD continue with its request. This interim response is
> used to inform the client that the initial part of the request has
> been received and has not yet been rejected by the server. The client
> SHOULD continue by sending the remainder of the request or, if the
> request has already been completed, ignore this response. The server
> MUST send a final response after the request has been completed. See
> section 8.2.3 for detailed discussion of the use and handling of this
> status code.

客户端应该继续它的请求，这个临时的响应用于通知客户端请求的初始部分已经被接收了，并且还没有被服务器拒绝。
客户端应该继续发送请求的剩余部分，如果请求已经完成了，就会忽略这个响应。服务器必须在请求完成之后发送一个最后的响应。
8.2.3节对这个状态码的使用和处理有详细地讨论。

### 101 Switch Protocols

> The server understands and is willing to comply with the client's
> request, via the Upgrade message header field (section 14.42), for a
> change in the application protocol being used on this connection. The
> server will switch protocols to those defined by the response's
> Upgrade header field immediately after the empty line which
> terminates the 101 response.

通过Upgrade消息头部字段（见14.42节），服务器理解并与愿意遵守客户端的请求，来改变这个连接的应用层协议。
服务器将立即切换为响应Upgrade头部定义的协议，然后以一个空行来结束这个101的响应。

> The protocol SHOULD be switched only when it is advantageous to do
> so. For example, switching to a newer version of HTTP is advantageous
> over older versions, and switching to a real-time, synchronous
> protocol might be advantageous when delivering resources that use
> such features.

只有当切换协议有利的时候，协议才应该切换。
比如，当提供使用这些特性的资源时，切换到一个新版本的HTTP协议比一个旧版本的有利。
或者切换一个实时的，同步的协议可能也有利。

## 2xx

> This class of status code indicates that the client's request was
> successfully received, understood, and accepted.

这类状态码表明客户端的请求被成功的接收，理解，接受。

### 200 OK

> The request has succeeded. The information returned with the response
> is dependent on the method used in the request, for example:
> - GET an entity corresponding to the requested resource is sent in the response;
> - HEAD the entity-header fields corresponding to the requested resource are sent in the response without any message-body;
> - POST an entity describing or containing the result of the action;
> - TRACE an entity containing the request message as received by the end server.

请求已经成功了，响应返回的消息依赖于请求使用的方法，比如：
- GET 请求资源相应的实体已经在响应中并回送给客户端。
- HEAD 请求资源相应的实体头部字段已经在响应中并回送给客户端。
- POST 实体描述或者包括了动作的结果。
- TRACE 实体包括了最终被服务器接受的请求报文。

### 201 Created

> The request has been fulfilled and resulted in a new resource being
> created. The newly created resource can be referenced by the URI(s)
> returned in the entity of the response, with the most specific URI
> for the resource given by a Location header field. The response
> SHOULD include an entity containing a list of resource
> characteristics and location(s) from which the user or user agent can
> choose the one most appropriate. The entity format is specified by
> the media type given in the Content-Type header field. The origin
> server MUST create the resource before returning the 201 status code.
> If the action cannot be carried out immediately, the server SHOULD
> respond with 202 (Accepted) response instead.

请求已经接受并且创建了一个新的资源。
新创建的资源可以被返回的响应实体中的URI(s)所引用，对这个资源最具体的URI通过一个Location字段给出。
响应应该包含一个实体，这个实体包括资源的特点和位置的列表，用户或者用户代理可以选择一个最适当的。
实体格式通过头部的Content-type字段的媒体类型来指定。
源服务器必须在返回201状态码之前创建资源。
如果动作不能被立即执行，那么服务器应该以202状态码来代替201进行响应。

> A 201 response MAY contain an ETag response header field indicating
> the current value of the entity tag for the requested variant just
> created, see section 14.19.

一个201响应可以包含一个ETag的响应头部字段，指明在资源创建之后当前实体标签的值

### 202 Accepted

> The request has been accepted for processing, but the processing has
> not been completed.  The request might or might not eventually be
> acted upon, as it might be disallowed when processing actually takes
> place. There is no facility for re-sending a status code from an
> asynchronous operation such as this.

请求已经被接受并处理，但是处理并没有完成。
请求可能最终完成了，也可能最终没有完成，因为处理实际发生时可能不被允许。
无法从一个异步的操作中重新发送状态码。

> The 202 response is intentionally non-committal. Its purpose is to
> allow a server to accept a request for some other process (perhaps a
> batch-oriented process that is only run once per day) without
> requiring that the user agent's connection to the server persist
> until the process is completed. The entity returned with this
> response SHOULD include an indication of the request's current status
> and either a pointer to a status monitor or some estimate of when the
> user can expect the request to be fulfilled.

202响应故意设计成不确定的。这样做的目的是允许服务器接受一个请求来处理一些其他过程（可能是一个每天只运行一次的批处理操作），而在过程完成之前，不需要用户代理和服务器之间建立持久连接。
这个响应返回的实体应该包括一个请求的当前状态的一个指示，并且包含一个状态监控的指针或者当用户可以期待解决请求的一些估计。

### 203 Non-Authoritative Information

> The returned metainformation in the entity-header is not the
> definitive set as available from the origin server, but is gathered
> from a local or a third-party copy. The set presented MAY be a subset
> or superset of the original version. For example, including local
> annotation information about the resource might result in a superset
> of the metainformation known by the origin server. Use of this
> response code is not required and is only appropriate when the
> response would otherwise be 200 (OK).

返回的实体头部的元信息是非原始服务器提供的不确定集，它来自本地或者第三方的副本。
返回的不确定集合可能是源版本的一个子集或者是超集。
例如，包含资源的本地注释信息可能产生一个源服务器能够理解的元信息的超集。
使用这个响应码不是必须的，只有当响应是除了200(OK)的才适用。

### 204 No Content

> The server has fulfilled the request but does not need to return an
> entity-body, and might want to return updated metainformation. The
> response MAY include new or updated metainformation in the form of
> entity-headers, which if present SHOULD be associated with the
> requested variant.

服务器已经完成了请求但是不需要返回一个实体，可能会返回一个更新过的元信息。
响应可能以实体头部的方式包含新的或者更新过的元信息，如果元信息存在的话，那么它应该和请求变量相关联。

> If the client is a user agent, it SHOULD NOT change its document view
> from that which caused the request to be sent. This response is
> primarily intended to allow input for actions to take place without
> causing a change to the user agent's active document view, although
> any new or updated metainformation SHOULD be applied to the document
> currently in the user agent's active view.

如果客户端是一个用户代理，它不应该更改引起这个请求发送的文档视图。
这个响应主要的意义是在不更改用户代理的活动文档视图的情况下允许输入动作，尽管当前任何新的或者更新过的元信息应该被应用在用户代理的活动文档上。

> The 204 response MUST NOT include a message-body, and thus is always
> terminated by the first empty line after the header fields.

204响应必须不能包含一个消息主体，也就是它总是以在首部字段之后的第一个空行结束。

### 205 Reset Content

> The server has fulfilled the request and the user agent SHOULD reset
> the document view which caused the request to be sent. This response
> is primarily intended to allow input for actions to take place via
> user input, followed by a clearing of the form in which the input is
> given so that the user can easily initiate another input action. The
> response MUST NOT include an entity.

服务器完成了请求并且用户代理应该重置引起这个请求发送的文档视图。
这个响应的主要意义允许输入操作，清除一个已经输入的文档以便用户可以容易地发起另一个输入动作。
这个响应必须不包含一个实体。

### 206 Partial Content

> The server has fulfilled the partial GET request for the resource.
> The request MUST have included a Range header field (section 14.35)
> indicating the desired range, and MAY have included an If-Range
> header field (section 14.27) to make the request conditional.

服务器完成了对资源的部分GET请求。
请求必须包含一个Range首部字段，以此来表明的想要的范围。
也可能包含了一个If-Range首部字段，使得请求变为条件请求。

> The response MUST include the following header fields:
> - Either a Content-Range header field (section 14.16) indicating
>   the range included with this response, or a multipart/byteranges
>   Content-Type including Content-Range fields for each part. If a
>   Content-Length header field is present in the response, its
>   value MUST match the actual number of OCTETs transmitted in the
>   message-body.
> - Date
> - ETag and/or Content-Location, if the header would have been sent
>   in a 200 response to the same request
> - Expires, Cache-Control, and/or Vary, if the field-value might
>   differ from that sent in any previous response for the same
>   variant

响应必须包含以下的首部字段
- Content-Range首部字段表明这个响应包含的范围，或者一个值为multipart/byteranges的Content-type且包括了每个部分的Content-Range字段。
  如果一个Content-Length首部字段出现在响应中，那么它的值必须和在消息主体中已传送的字节数相匹配。
- Date字段。
- ETag和/或者Content-Location字段，如果这些首部在之前相同的请求的200响应中出现过。
- Expires，Cache-Control和/或者Vary首部，如果字段值可能和之前任何发送的相同变量的响应不同。

>  If the 206 response is the result of an If-Range request that used a
>  strong cache validator (see section 13.3.3), the response SHOULD NOT
>  include other entity-headers. If the response is the result of an
>  If-Range request that used a weak validator, the response MUST NOT
>  include other entity-headers; this prevents inconsistencies between
>  cached entity-bodies and updated headers. Otherwise, the response
>  MUST include all of the entity-headers that would have been returned
>  with a 200 (OK) response to the same request.

如果206响应是一个使用了强缓存验证的If-Range请求的结果的话，那么响应不应该包含其他的实体头部。
如果响应是一个使用了弱缓存验证的If-Range请求的结果的话，那么响应必须不包含其他的实体首部。
这预防了在缓存实体主体和更新过的首部间的不一致性。
除此之外，响应必须包含对于相同请求下200响应所返回的所有实体头部。

>  A cache MUST NOT combine a 206 response with other previously cached
>  content if the ETag or Last-Modified headers do not match exactly,
>  see 13.5.4.

如果ETag或者Last-Modified首部没准确匹配的情况下，缓存必须不能对一个206的响应和之前缓存的内容进行合并。

>  A cache that does not support the Range and Content-Range headers
>  MUST NOT cache 206 (Partial) responses.

不支持Range和Content-Range首部的缓存必须不能缓存206(Partial)响应的结果

## 3xx

> This class of status code indicates that further action needs to be
> taken by the user agent in order to fulfill the request.  The action
> required MAY be carried out by the user agent without interaction
> with the user if and only if the method used in the second request is
> GET or HEAD. A client SHOULD detect infinite redirection loops, since
> such loops generate network traffic for each redirection.

这类状态码表明为了完成请求需要用户代理的进一步操作。
需要的操作可能被用户代理（自动地）执行，而不需要和用户进行交互，仅仅如果第二个请求使用的方法是GET或者HEAD。
一个客户端应该检测无限的重定向循环，因为这样的循环中每一个重定向会造成网络负载。

> Note: previous versions of this specification recommended a
> maximum of five redirections. Content developers should be aware
> that there might be clients that implement such a fixed
> limitation.

注意：这个规范先前的版本推荐最大的重定向次数为5次。
内容开发商应该察觉到可能有客户端实现了这样的一种固定的限制。

### 300 Multiple Choices

> The requested resource corresponds to any one of a set of
> representations, each with its own specific location, and agent-
> driven negotiation information (section 12) is being provided so that
> the user (or user agent) can select a preferred representation and
> redirect its request to that location.

请求的资源的表示对应集合中的任何一个，每个都有自身具体的位置。
提供代理驱动的协商信息，以便用户（或者用户代理）能够选择一个首选的表示并重定向请求到这个表示对应的位置。

> Unless it was a HEAD request, the response SHOULD include an entity
> containing a list of resource characteristics and location(s) from
> which the user or user agent can choose the one most appropriate. The
> entity format is specified by the media type given in the Content-
> Type header field. Depending upon the format and the capabilities of
> the user agent, selection of the most appropriate choice MAY be
> performed automatically. However, this specification does not define
> any standard for such automatic selection.

响应应该包含一个实体，除非是一个HEAD请求，这个实体包括了资源特点和位置，使得用户或者用户代理可以选择更适当的一个。
实体格式由Content-Type首部提供的媒体类型指定。
依靠这个格式和用户代理的能力，一个更适当的选择动作可能是自动执行的。
然而，这个规范并没有定义任何对于这种自动选择的标准。

> If the server has a preferred choice of representation, it SHOULD
> include the specific URI for that representation in the Location
> field; user agents MAY use the Location field value for automatic
> redirection. This response is cacheable unless indicated otherwise.

如果服务器有一个首选的表示，应该在Location字段包含这个表示具体的URI；
用户代理可能使用Location字段的值来自动地重定向。
这个响应可以被缓存除非另有表明。

### 301 Moved Permanently

> The requested resource has been assigned a new permanent URI and any
> future references to this resource SHOULD use one of the returned
> URIs.  Clients with link editing capabilities ought to automatically
> re-link references to the Request-URI to one or more of the new
> references returned by the server, where possible. This response is
> cacheable unless indicated otherwise.

请求的资源已经被分配一个新的永久的URI，任何未来对此资源的引用应该使用返回的URIs中的一个。
具有链接编辑功能的客户端应该尽可能自动地使用服务器返回地一个或者多个新的引用来重新链接请求URI。
这个响应是可以被缓存的除非另有表明。

> The new permanent URI SHOULD be given by the Location field in the
> response. Unless the request method was HEAD, the entity of the
> response SHOULD contain a short hypertext note with a hyperlink to
> the new URI(s).

新的永久URI应该由响应的Location字段给出。
响应的实体应该包含对新的URIs的一个短的超链接文本注释，除非请求的方法是HEAD。

> If the 301 status code is received in response to a request other
> than GET or HEAD, the user agent MUST NOT automatically redirect the
> request unless it can be confirmed by the user, since this might
> change the conditions under which the request was issued.

如果301状态码是由非GET或者HEAD的请求所响应的话，用户代理必须不能自动地重定向请求，除非被用户所确认，因为这可能会改变已发出请求的条件。

> Note: When automatically redirecting a POST request after
> receiving a 301 status code, some existing HTTP/1.0 user agents
> will erroneously change it into a GET request.

注意：当在收到一个301状态码而自动地重定向一个POST请求时，一些现存地HTTP/1.0的用户代理会错误地将其转为一个GET请求

### 302 Found

> The requested resource resides temporarily under a different URI.
  Since the redirection might be altered on occasion, the client SHOULD
  continue to use the Request-URI for future requests.  This response
  is only cacheable if indicated by a Cache-Control or Expires header
  field.

请求的资源暂时处于一个不同的URI下。
因为这种重定向可能会被不定期地改变，所以客户端应该为了未来的请求继续使用原来的请求URI。
这个响应只有被Cache-Control或者Expires头部指定的情况下才能被缓存。

> The temporary URI SHOULD be given by the Location field in the
  response. Unless the request method was HEAD, the entity of the
  response SHOULD contain a short hypertext note with a hyperlink to
  the new URI(s).

临时的URI应该由响应的Location字段给出。
响应的实体应该包含对新的URIs的一个短的超链接文本注释，除非请求的方法是HEAD。

> If the 302 status code is received in response to a request other
  than GET or HEAD, the user agent MUST NOT automatically redirect the
  request unless it can be confirmed by the user, since this might
  change the conditions under which the request was issued.

如果302状态码是由非GET或者HEAD的请求所响应的话，用户代理必须不能自动地重定向请求 ，除非被用户所确认，因为这可能会改变已发出请求的条件。

> Note: RFC 1945 and RFC 2068 specify that the client is not allowed
  to change the method on the redirected request.  However, most
  existing user agent implementations treat 302 as if it were a 303
  response, performing a GET on the Location field-value regardless
  of the original request method. The status codes 303 and 307 have
  been added for servers that wish to make unambiguously clear which
  kind of reaction is expected of the client.

注意：RFC 1945和RFC 2068指出了不允许客户端改变重定向请求的方法。
然而，大多数现存的用户代理实现把302当成303响应，不论源服务器的请求方法是什么，都以GET方法来执行Location的字段值。
303和307状态码被添加进来，就是为了使得服务器能够明确客户端到底期待哪种类型的反应。

### 303 See Other

> The response to the request can be found under a different URI and
  SHOULD be retrieved using a GET method on that resource. This method
  exists primarily to allow the output of a POST-activated script to
  redirect the user agent to a selected resource. The new URI is not a
  substitute reference for the originally requested resource. The 303
  response MUST NOT be cached, but the response to the second
  (redirected) request might be cacheable.

请求的响应可以在一个不同的URI下被找到，并且应该使用GET方法来访问资源。
这个方法存在的主要是允许已激活的POST脚本的输出可以重定向到用户代理选择的资源。
新的URI不是原请求的资源的一个替代引用。
303响应不能被缓存，但第二次请求（重定向）的响应可以被缓存。

> The different URI SHOULD be given by the Location field in the
  response. Unless the request method was HEAD, the entity of the
  response SHOULD contain a short hypertext note with a hyperlink to
  the new URI(s).

不同的URI应该由响应的Location字段给出。
响应的实体应该包含对新的URI(s)的一个短的超链接文本注释，除非请求的方法是HEAD。

> Note: Many pre-HTTP/1.1 user agents do not understand the 303
  status. When interoperability with such clients is a concern, the
  302 status code may be used instead, since most user agents react
  to a 302 response as described here for 303.

注意：许多先前的HTTP/1.1用户代理不能理解303状态码。
当这些客户端关系互操性时，302状态码会被使用，因为大多数的用户代理对302响应的反应和这里描述的303一样。

### 304 Not Modified

> If the client has performed a conditional GET request and access is
  allowed, but the document has not been modified, the server SHOULD
  respond with this status code. The 304 response MUST NOT contain a
  message-body, and thus is always terminated by the first empty line
  after the header fields.

如果客户端执行了一个条件GET请求且允许访问，但是文档并没有被改变时，服务器应该响应这个状态码。
304响应必须不能包含一个消息主体，因此它总是在首部字段之后的第一个空行结束。

> The response MUST include the following header fields:
  - Date, unless its omission is required by section 14.18.1

响应必须包含以下首部字段：
- Date首部，除非需要省略此字段，见14.18.1

> If a clockless origin server obeys these rules, and proxies and
  clients add their own Date to any response received without one (as
  already specified by RFC 2068, section 14.19), caches will operate
  correctly.

如果一个无时钟的源服务器服从这些规则，并且代理和客户端对任何没有Date的响应添加了他们自己的Date字段（RFC 2068已经指明了，见14.19节），缓存将会正确地操作。

> - ETag and/or Content-Location, if the header would have been sent
    in a 200 response to the same request

- ETag和/或者Content-Location首部，如果这些首部在相同请求的200响应里出现过。

> - Expires, Cache-Control, and/or Vary, if the field-value might
    differ from that sent in any previous response for the same
    variant

- Expires，Cache-Control，和/或者Vary首部，如果字段值可能和先前任何对相同变量的响应不同时。

> If the conditional GET used a strong cache validator (see section
  13.3.3), the response SHOULD NOT include other entity-headers.
  Otherwise (i.e., the conditional GET used a weak validator), the
  response MUST NOT include other entity-headers; this prevents
  inconsistencies between cached entity-bodies and updated headers.

如果条件请求GET使用了强缓存验证（见13.3.3），响应不应该包含其他的实体首部。
除此之外（使用了弱缓存验证），响应必须不能包含其他的实体首部；
这防止实体主体和更新过的首部之间的不一致性。

> If a 304 response indicates an entity not currently cached, then the
  cache MUST disregard the response and repeat the request without the
  conditional.

如果一个304响应表明一个实体目前没有缓存，那么缓存必须忽略响应并且重新发起非条件的请求。

> If a cache uses a received 304 response to update a cache entry, the
  cache MUST update the entry to reflect any new field values given in
  the response.

如果一个缓存使用了304响应来更新缓存，那么此缓存必须更新在给出的响应中表明任何新的字段值。

### 305 Use Proxy

> The requested resource MUST be accessed through the proxy given by
  the Location field. The Location field gives the URI of the proxy.
  The recipient is expected to repeat this single request via the
  proxy. 305 responses MUST only be generated by origin servers.

请求的资源必须通过在给出的Location字段上的代理进行访问。
Location字段给出了代理的URI。
接收者被期望通过代理重复这个独立的请求。
305响应必须只能被源服务器产生。

> Note: RFC 2068 was not clear that 305 was intended to redirect a
  single request, and to be generated by origin servers only.  Not
  observing these limitations has significant security consequences.

注意：RFC 2068没有说明305的目的是重定向独立请求，并且只能被源服务器产生。
不注意这些限制会有重大的安全后果。

### 306 306 (Unused)

> The 306 status code was used in a previous version of the
> specification, is no longer used, and the code is reserved.

306状态码在之前版本的规范中使用，当前版本不再使用，保留此状态码。

### 307 Temporary Redirect

> The requested resource resides temporarily under a different URI.
  Since the redirection MAY be altered on occasion, the client SHOULD
  continue to use the Request-URI for future requests.  This response
  is only cacheable if indicated by a Cache-Control or Expires header
  field.

请求的资源暂时转义到一个不同的URI下。
因为这种重定向可能会被不定期地改变，所以客户端应该为了未来的请求继续使用原来的Request-URI。
这个响应只有被Cache-Control或者Expires头部指定的情况下才能被缓存。

> The temporary URI SHOULD be given by the Location field in the
  response. Unless the request method was HEAD, the entity of the
  response SHOULD contain a short hypertext note with a hyperlink to
  the new URI(s) , since many pre-HTTP/1.1 user agents do not
  understand the 307 status. Therefore, the note SHOULD contain the
  information necessary for a user to repeat the original request on
  the new URI.

暂时的URI应该在响应的Location字段给出。
响应的实体应该包含对新的URIs的一个短的超链接文本注释，除非请求的方法是HEAD，因为许多先前的HTTP/1.1用户代理不能理解307状态。
因此，注释应该为用户包含必要的信息，使得用户能够重新向源服务器发起新URI的请求。

> If the 307 status code is received in response to a request other
  than GET or HEAD, the user agent MUST NOT automatically redirect the
  request unless it can be confirmed by the user, since this might
  change the conditions under which the request was issued.

如果307状态码来自是非GET或HEAD请求的响应，用户代理必须不能自动地重定向请求，除非经过用户的同意，因为这可能会改变已发出请求的条件。

## 4xx

> The 4xx class of status code is intended for cases in which the
  client seems to have erred. Except when responding to a HEAD request,
  the server SHOULD include an entity containing an explanation of the
  error situation, and whether it is a temporary or permanent
  condition. These status codes are applicable to any request method.
  User agents SHOULD display any included entity to the user.

4xx状态码目的是客户端可能出现错误的情况。
除了当响应一个HEAD请求，服务器应该包含一个实体，这个实体包含了错误情况的解释说明，无论这个错误是暂时的还是永久。

> If the client is sending data, a server implementation using TCP
  SHOULD be careful to ensure that the client acknowledges receipt of
  the packet(s) containing the response, before the server closes the
  input connection. If the client continues sending data to the server
  after the close, the server's TCP stack will send a reset packet to
  the client, which may erase the client's unacknowledged input buffers
  before they can be read and interpreted by the HTTP application.

如果客户端正在发送数据，使用TCP实现的服务器小心，在服务器关闭输入链接之前，确保客户端收到包含响应的数据包。
如果客户端在连接关闭之后继续发送数据，服务器的TCP栈将发送一个重置包给客户端，然后在未确认的数据可以被HTTP应用读取和解释之前，清空它们。

### 400 Bad Request

> The request could not be understood by the server due to malformed
  syntax. The client SHOULD NOT repeat the request without
  modifications.

请求由于错误的语法而不能被服务器理解。
客户端不应该在没有更改过请求的情况下重复请求。

### 401 Unauthorized

> The request requires user authentication. The response MUST include a
  WWW-Authenticate header field (section 14.47) containing a challenge
  applicable to the requested resource. The client MAY repeat the
  request with a suitable Authorization header field (section 14.8). If
  the request already included Authorization credentials, then the 401
  response indicates that authorization has been refused for those
  credentials. If the 401 response contains the same challenge as the
  prior response, and the user agent has already attempted
  authentication at least once, then the user SHOULD be presented the
  entity that was given in the response, since that entity might
  include relevant diagnostic information. HTTP access authentication
  is explained in "HTTP Authentication: Basic and Digest Access
  Authentication" \[43\].

请求需要用户的认证。
响应必须包含一个WWW-Authenticate首部字段（见14.47节），这个字段包含对请求资源的适用的验证。
客户端可能重复请求，并带上了合适的Authorization首部字段（见14.8节）。
如果请求早已包含了Authorization认证，那么401响应表明证书的授权已经被拒绝。
如果401响应包含和先前响应相同的验证，用户代理早已尝试验证至少一次，那么用户应该被呈现在响应的主体中，因为主体可能包含了相关的诊断信息。
"HTTP Authentication: Basic and Digest Access Authentication"解释了HTTP的授权访问。

### 402 Payment Required

> This code is reserved for future use.

这个状态码保留，为今后使用。

### 403 Forbidden

> The server understood the request, but is refusing to fulfill it.
  Authorization will not help and the request SHOULD NOT be repeated.
  If the request method was not HEAD and the server wishes to make
  public why the request has not been fulfilled, it SHOULD describe the
  reason for the refusal in the entity.  If the server does not wish to
  make this information available to the client, the status code 404
  (Not Found) can be used instead.

服务器理解了请求，但是拒绝去完成它。
认证将没有效果并且请求不应该被重复。
如果请求的方法不是HEAD并且服务器希望公开请求没有被完成的原因，它应该在实体中描述拒绝的原因。
如果服务器不希望客户端获得这些信息，那么应该使用404(Not Found)状态码。

### 404 Not Found

> The server has not found anything matching the Request-URI. No
  indication is given of whether the condition is temporary or
  permanent. The 410 (Gone) status code SHOULD be used if the server
  knows, through some internally configurable mechanism, that an old
  resource is permanently unavailable and has no forwarding address.
  This status code is commonly used when the server does not wish to
  reveal exactly why the request has been refused, or when no other
  response is applicable.

服务器没有找到任何和请求URI相匹配的资源。
不指明这个情况是暂时的还是永久的。
如果服务器通过一些内部的配置机制知道一个旧资源永久地不可获得并且没有转移的地址，那么应该使用410(Gone)状态码。
这个404状态码通常用在当服务器不希望准确地揭示请求被拒绝的原因，或者没有其他适合的响应可使用时。

### 405 Method Not Allowed

> The method specified in the Request-Line is not allowed for the
  resource identified by the Request-URI. The response MUST include an
  Allow header containing a list of valid methods for the requested
  resource.

请求行指定的方法不被允许访问请求URI的标识的资源。
响应必须包含一个Allow首部，这个首部包含了对这个请求资源的合法方法的列表。

### 406 Not Acceptable

> The resource identified by the request is only capable of generating
  response entities which have content characteristics not acceptable
  according to the accept headers sent in the request.

请求标识的资源只能够生成响应实体，这个响应实体的内容特点根据请求发送的accept首部字段来看不可接受

> Unless it was a HEAD request, the response SHOULD include an entity
  containing a list of available entity characteristics and location(s)
  from which the user or user agent can choose the one most
  appropriate. The entity format is specified by the media type given
  in the Content-Type header field. Depending upon the format and the
  capabilities of the user agent, selection of the most appropriate
  choice MAY be performed automatically. However, this specification
  does not define any standard for such automatic selection.

响应应该包含一个实体，除非是一个HEAD请求，这个实体包括了实体特点和位置，使得用户或者用户代理可以选择更适当的一个。
实体格式由Content-Type首部提供的媒体类型指定。
依靠这个格式和用户代理的能力，一个更适当的选择动作可能是自动执行的。
然而，这个规范并没有定义任何对于这种自动选择的标准。

> Note: HTTP/1.1 servers are allowed to return responses which are
  not acceptable according to the accept headers sent in the
  request. In some cases, this may even be preferable to sending a
  406 response. User agents are encouraged to inspect the headers of
  an incoming response to determine if it is acceptable.

注意：HTTP/1.1的服务器允许返回一个和请求包含的accept字段不符合的不可接受的响应。
在某些情况下，这可能比发送406响应更可取。鼓励用户代理去检查到达的响应的首部去判断它是不是可接受的。

> If the response could be unacceptable, a user agent SHOULD
  temporarily stop receipt of more data and query the user for a
  decision on further actions.

如果响应不可以被接受，用户代理应该暂时暂停获取数据并询问用户，以此来决定进一步动作。

### 407 Proxy Authentication Required

> This code is similar to 401 (Unauthorized), but indicates that the
  client must first authenticate itself with the proxy. The proxy MUST
  return a Proxy-Authenticate header field (section 14.33) containing a
  challenge applicable to the proxy for the requested resource. The
  client MAY repeat the request with a suitable Proxy-Authorization
  header field (section 14.34). HTTP access authentication is explained
  in "HTTP Authentication: Basic and Digest Access Authentication" \[43\].

这个状态码和401类似，但是它表明客户都安必须先通过代理的认证。代理必须返回一个Proxy-Authenticate首部字段（见14.33节），
这个首部字段包含一个向代理请求资源的适用的验证。
客户都安可能重复请求并带上何时的Proxy-Authorization首部字段（见14.43节）。
"HTTP Authentication: Basic and Digest Access Authentication"解释了HTTP授权访问。

### 408 Request Timeout

> The client did not produce a request within the time that the server
  was prepared to wait. The client MAY repeat the request without
  modifications at any later time.

客户端不能在服务器准备的时间内产生一个请求。
客户端可能在没有更改的情况下在之后的任意时间重复请求。

### 409 Conflict

> The request could not be completed due to a conflict with the current
  state of the resource. This code is only allowed in situations where
  it is expected that the user might be able to resolve the conflict
  and resubmit the request. The response body SHOULD include enough
  information for the user to recognize the source of the conflict.
  Ideally, the response entity would include enough information for the
  user or user agent to fix the problem; however, that might not be
  possible and is not required.

请求由于和资源当前的状态冲突而不能被完成。
这个状态码只被允许在期望用户可能能够解决冲突并重新请求的情况下使用。
响应主体应该包括足够的信息使得用户认识冲突的源头。
理想情况下，响应实体包含足够的信息，用户和用户代理修复问题；然而，处理可能是不一定，也可能不是需要的。

> Conflicts are most likely to occur in response to a PUT request. For
  example, if versioning were being used and the entity being PUT
  included to a resource which conflict with those made by an
  earlier (third-party) request, the server might use the 409 response
  to indicate that it can't complete the request. In this case, the
  response entity would likely contain a list of the differences
  between the two versions in a format defined by the response
  Content-Type.

冲突最有可能发生在PUT请求的响应中。
例如，如果使用了版本控制并且包含一个和先前（第三方）相冲突的资源的PUT实体，服务器可能使用409响应来表明不能完成请求。
在这种情况下，响应实体可能在一个响应的Content-Type定义的格式中包含两个版本之间的不同点的列表。

### 410 Gone

> The requested resource is no longer available at the server and no
  forwarding address is known. This condition is expected to be
  considered permanent. Clients with link editing capabilities SHOULD
  delete references to the Request-URI after user approval. If the
  server does not know, or has no facility to determine, whether or not
  the condition is permanent, the status code 404 (Not Found) SHOULD be
  used instead. This response is cacheable unless indicated otherwise.

请求的资源不再能够从服务器获得，并且未知转移地址。
可以认为这种情况是永久性的。
有连接编辑能力的客户端应该在用户确认之后删除请求URI的引用。
如果服务器不知道，或者没有设施去确定这种情况是否为永久，应该使用404(Not Found)。
这个响应可以被缓存除非另有说明。

> The 410 response is primarily intended to assist the task of web
  maintenance by notifying the recipient that the resource is
  intentionally unavailable and that the server owners desire that
  remote links to that resource be removed. Such an event is common for
  limited-time, promotional services and for resources belonging to
  individuals no longer working at the server's site. It is not
  necessary to mark all permanently unavailable resources as "gone" or
  to keep the mark for any length of time -- that is left to the
  discretion of the server owner.

410响应主要的目的是协助网站维护，通知接收者资源不可获得且服务器拥有者渴望删除连接到该资源地链接。
这样的事件对于一个有时间限制的促销服务和当个人的资源不再在服务器站点上运行来说是很常见的。
标记所有的永久不可获得的资源为“gone”或者保持标记的时间是没有必要的 -- 这由服务器所有者自行决定。

### 411 Length Required

> The server refuses to accept the request without a defined Content-
  Length. The client MAY repeat the request if it adds a valid
  Content-Length header field containing the length of the message-body
  in the request message.

服务器拒绝接受没有定义的Content-Length的请求。
客户端可能重复请求，在请求上添加一个合法的Content-Length首部字段，这个字段包含在请求消息的消息主体的长度。

### 412 Precondition Failed

> The precondition given in one or more of the request-header fields
  evaluated to false when it was tested on the server. This response
  code allows the client to place preconditions on the current resource
  metainformation (header field data) and thus prevent the requested
  method from being applied to a resource other than the one intended.

当在服务器上测试时，在一个或多个的请求首部字段前提被评估为false。
这个响应码允许客户端在当前资源的元信息上（首部字段数据）安放前提条件因此可以防止请求方法应用于一种非预期的资源。

### 413 Request Entity Too Large

> The server is refusing to process a request because the request
  entity is larger than the server is willing or able to process. The
  server MAY close the connection to prevent the client from continuing
  the request.

服务器拒绝处理请求，因为请求的实体大于服务器期望或者能够处理的大小。
服务器可能关闭连接来防止客户端继续请求。

> If the condition is temporary, the server SHOULD include a Retry-
  After header field to indicate that it is temporary and after what
  time the client MAY try again.

如果情况是暂时的，服务器应该包含一个Retry-After首部字段来表明情况是暂时的并且在某个时间后客户端可以再尝试请求。

### 414 Request-URI Too Long

> The server is refusing to service the request because the Request-URI
  is longer than the server is willing to interpret. This rare
  condition is only likely to occur when a client has improperly
  converted a POST request to a GET request with long query
  information, when the client has descended into a URI "black hole" of
  redirection (e.g., a redirected URI prefix that points to a suffix of
  itself), or when the server is under attack by a client attempting to
  exploit security holes present in some servers using fixed-length
  buffers for reading or manipulating the Request-URI.

服务器拒绝服务这个请求，因为请求URI长度超过服务器愿意解释的长度。
这种情况只可能发生在当一个客户端不恰当地把一个有很长查询信息的POST请求转换成一个GET请求，
当客户端下降到一个URI重定向的黑洞（即，一个重定向的URI前缀指向一个他自己的后缀），
或者当服务器被客户端攻击，客户端尝试利用存在于一些服务器上的固定长度的缓冲区安全漏洞来读取或者操纵请求URI的数据。

### 415 Unsupported Media Type

> The server is refusing to service the request because the entity of
  the request is in a format not supported by the requested resource
  for the requested method.

服务器拒绝服务请求因为请求的实体的格式不支持以某个请求方法来请求资源。

### 416 Request Range Not Satisfiable

> A server SHOULD return a response with this status code if a request
  included a Range request-header field (section 14.35), and none of
  the range-specifier values in this field overlap the current extent
  of the selected resource, and the request did not include an If-Range
  request-header field. (For byte-ranges, this means that the first-
  byte-pos of all of the byte-range-spec values were greater than the
  current length of the selected resource.)

服务器应该在请求包含一个Range请求头字段（见14.35节），在这个字段上没有和当前选择资源重叠的范围标志，且请求没有包含一个If-Range请求头字段
（对于比特范围，这意味着所有比特范围规格的第一个比特的位置比当前选择的资源的长度要大）的情况下返回一个响应。

> When this status code is returned for a byte-range request, the
  response SHOULD include a Content-Range entity-header field
  specifying the current length of the selected resource (see section
  14.16). This response MUST NOT use the multipart/byteranges content-
  type.

当这个状态码为一个比特范围请求返回时，响应应该包含一个Content-Range的实体头部字段指明选择资源的当前长度（见14.16节）
响应必须不能使用mulipart/byteranges内容类型

### 417 Expectation Failed

> The expectation given in an Expect request-header field (see section
  14.20) could not be met by this server, or, if the server is a proxy,
  the server has unambiguous evidence that the request could not be met
  by the next-hop server.

请求头的Expect字段给出的期望服务器无法满足，或者，如果服务器是一个代理，代理服务器有明确的证据知道下一跳的服务器无法满足时。

## 5xx

> Response status codes beginning with the digit "5" indicate cases in
  which the server is aware that it has erred or is incapable of
  performing the request. Except when responding to a HEAD request, the
  server SHOULD include an entity containing an explanation of the
  error situation, and whether it is a temporary or permanent
  condition. User agents SHOULD display any included entity to the
  user. These response codes are applicable to any request method.

响应码以数字5开头来表明服务器知道它发生了错误或者无法执行请求。
服务器应该包含一个实体，除了当响应一个HEAD请求时，这个实体包含了错误情况的解释，以及为暂时性还是永久性的错误。
用户代理应该向用户展示任何包含在实体中的信息。
这些响应码对任何的请求方法都适用。

### 500 Internal Server Error

> The server encountered an unexpected condition which prevented it
  from fulfilling the request.

服务器遇到了一个意外的情况阻止了服务器完成请求。

### 501 Not Implemented

> The server does not support the functionality required to fulfill the
  request. This is the appropriate response when the server does not
  recognize the request method and is not capable of supporting it for
  any resource.

服务器不支持完成请求要求的功能。
这个响应当服务器无法识别请求方法以及无法支持以这个请求方法访问任何资源。

### 502 Bad Gateway

> The server, while acting as a gateway or proxy, received an invalid
  response from the upstream server it accessed in attempting to
  fulfill the request.

当服务器扮演一个网关或者代理时从上游接受到一个非法响应时，需要访问并尝试完成该请求。

### 503 Service Unavailable

> The server is currently unable to handle the request due to a
  temporary overloading or maintenance of the server. The implication
  is that this is a temporary condition which will be alleviated after
  some delay. If known, the length of the delay MAY be indicated in a
  Retry-After header. If no Retry-After is given, the client SHOULD
  handle the response as it would for a 500 response.

服务器当前由于一个暂时的超负荷或维护无法处理请求。
这个状态码的意义是这个情况是暂时的，将会在延迟一段时间之后得到缓解。
如果知道延迟时间的长度，那么应该在Retry-After头部中表明。
如果没有给出Retry-After，客户端应该像收到500响应那样处理这个响应。

> Note: The existence of the 503 status code does not imply that a
  server must use it when becoming overloaded. Some servers may wish
  to simply refuse the connection.

注意：503状态码的存在不意味着服务器必须在超载时使用它。
一些服务器可能只希望简单地拒绝连接。

### 504 Gateway Timeout

> The server, while acting as a gateway or proxy, did not receive a
  timely response from the upstream server specified by the URI (e.g.
  HTTP, FTP, LDAP) or some other auxiliary server (e.g. DNS) it needed
  to access in attempting to complete the request.

当服务器扮演一个网关或者代理时，没有从上游收到一个对指定URI（比如HTTP，FTP，LDAP）的及时的响应或者一些其他的辅助服务器（比如DNS），
需要访问并尝试完成该请求。

> Note: Note to implementors: some deployed proxies are known to
  return 400 or 500 when DNS lookups time out.

注意：实现者注意：一些已部署的代理通常在DNS查找超时时返回一个400或者500响应。

### 505 HTTP Version Not Supported

> The server does not support, or refuses to support, the HTTP protocol
  version that was used in the request message. The server is
  indicating that it is unable or unwilling to complete the request
  using the same major version as the client, as described in section
  3.1, other than with this error message. The response SHOULD contain
  an entity describing why that version is not supported and what other
  protocols are supported by that server.

服务器不支持，或者拒绝支持请求消息中使用的HTTP协议版本。
服务器表明它不支持或者不愿意去完成和客户端使用相同主要版本的请求，这在3.1节描述过了，除非是个错误的请求。
响应应该包含一个实体来描述版本不被支持的原因以及服务器支持的其他协议。


# 后记

英语稀碎😂