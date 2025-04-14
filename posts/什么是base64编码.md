---
title: 什么是base64编码
key: 1645432553date: 2022-02-21 16:35:53
updated: 2023-02-13 18:28:44
tags:
- Base64
- JavaScript
categories:
- 编程
---


# 前言

在看 `vueuse/core` 的源码时，看到 `useBase64` 函数时，有感而发

<!-- more -->

虽然平时都会很经常地看见 `base64` 编码，比如打包的时候如果图片大小很小的话，会直接内联成 `base64` 来减少网络请求 

那么 `base64` 究竟是如何来编码的呢？

# 正文

## base64 原理

这里放上维基百科对于 `base64` 的定义

> Base64（基底64）是一种基于64个可打印字符来表示二进制数据的表示方法。每6个比特为一个单元，对应某个可打印字符。3个字节相当于24个比特，对应于4个Base64单元，即3个字节可由4个可打印字符来表示。在Base64中的可打印字符包括字母A-Z、a-z、数字0-9，这样共有62个字符，此外两个可打印符号在不同的系统中而不同。

从这个定义中我们就可以明白几个点

- 编码后的结果为 `64` 个可打印字符的组合
- 使用 `6` 比特来表示一个可打印字符
- 由于单元长度为 `6`，所以需要使用 `4` 个可打印字符来表示 `3` 个字节（ `1` 个字节为 `8` 比特）

根据第一点，可以知道应该存在一个对应表，每个字符对应一个长度为 `6` 的比特序列

![来自维基百科](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/02/22/202202221829722.avif)

可以看到经过 `base64` 编码之后，只会存在 `A-Z` ， `a-z` ， `0-9` ， `+/=` 这 `64` 个字符

使用 `hello` 来作为例子来解释 `base64` 是如何编码的

对于 `hello` 这个字符，其中 

- `h` 的 `10` 进制为 `104` ， `2` 进制为 `01101000`
- `e` 的 `10` 进制为 `101` ， `2` 进制为 `01100101`
- `l` 的 `10` 进制为 `108` ， `2` 进制为 `01101100`
- `o` 的 `10` 进制为 `111` ， `2` 进制为 `01101111`

这时候我们就得到了 `hello` 的 `2` 进制数据 `01101000 01100101 01101100 01101100 01101111`

然后我们按照 `6` 位一组进行划分，得到 `011010 000110 010101 101100 011011 000110 1111`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/02/26/202202261719280.avif)

根据对照表，前面的四位 `011010 000110 010101 101100 011011 000110` 经过编码为 `aGVsbG` 

这时发现后面的 `1111` 并不能够被编码

除非变成 `1111xx`

这时候我们要在原数据最后添加 `NUL` 来补充位数

这里的 `NUL` 为空字符的意思，它的 `2` 进制编码为 `00000000`

在添加一个 `NUL` 之后，原数据变为 `01101000 01100101 01101100 01101100 01101111 00000000`

这时分组之后为 `011010 000110 010101 101100 011011 000110 111100 000000`

现在不存在不足 `6` 位的情况

根据对照表，可以得出编码后的字符 `aGVsbG8A` 

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/02/26/202202261724091.avif)

但是由于我们添加了 `1` 个 `NUL` 在原数据的末尾

所以编码后的数据中最后一个 `A` 是不存在，这个 `A` 用 `=` 来代替

即编码后的字符串为 `aGVsbG8=`

如果添加了两个 `NUL` ，那么就要把末尾的两个 `A` 改为 `=`

`=` 的数量取决于我们添加了多少个 `NUL` ，它的个数的值为 `0` ， `1` ，`2`

为什么不会为 `3` 个呢，这是因为 `base64` 为 `4` 个 `6` 比特数据来表示 `3` 个 `8` 比特数据

如果添加了 `3` 个 `NUL`，那么在末尾就变为 `4` 个 `000000` 表示 `3` 个 `00000000` ，很明显这是没有意义的

换句话说，原数据的字节个数必须为 `3` 的倍数，对 `3` 取余可得到的值为 `1` ， `2` ，即分别对应了添加 `2` 个 `NUL`，添加 `1` 个 `NUL`

## JS 中的 base64

在 `js` 中，也有两个 `api` 对应 `base64` 的编码和解码，分别是 `btoa`，`atob`

使用 `btoa` 对 `hello` 进行编码

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/02/26/202202261754811.avif)

使用 `atob` 对 `aGVsbG8=` 进行解码

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/02/26/202202261755734.avif)

## useBase64 函数

`vueuse/core` 里面提供了 `useBase64` 的函数

> [vueuse/packages/core/useBase64/index.ts](https://github.com/vueuse/vueuse/blob/main/packages/core/useBase64/index.ts)

在源码中，我们可以看到 useBase64 的函数有许多个重载

```ts
export function useBase64(target: MaybeRef<string>): UseBase64Return
export function useBase64(target: MaybeRef<Blob>): UseBase64Return
export function useBase64(target: MaybeRef<ArrayBuffer>): UseBase64Return
export function useBase64(target: MaybeRef<HTMLCanvasElement>, options?: ToDataURLOptions): UseBase64Return
export function useBase64(target: MaybeRef<HTMLImageElement>, options?: ToDataURLOptions): UseBase64Return
```

主要的区别是支持不同的源数据类型，除了字符串，还支持 `Blob` 数据， `ArrayBuffer` 数据， `canvas` 元素以及 `image` 元素

在源码中，使用了 `FileReader` 这个类来传入 `Blob` 类型的数据，然后通过 `readAsDataURL` 来获取编码后的 `base64` 数据

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/02/26/202202262103288.avif)

核心的转换函数为 `blobToBase64` ，源码如下

```ts
function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = (e) => {
      resolve(e.target!.result as string)
    }
    fr.onerror = reject
    fr.readAsDataURL(blob)
  })
}
```

核心非常简单，就是读 `blob` 数据拿到 `base64` 而已，把结果包装成一个 `Promise`

对于不同的类型，可以在 `useBase64` 的实现中看到它的转换方法

```ts
export function useBase64(
  target: any,
  options?: any,
) {
  // ...
        const _target = unref(target)
        // undefined or null
        if (_target === undefined || _target === null) { resolve('') }
        else if (typeof _target === 'string') { resolve(blobToBase64(new Blob([_target], { type: 'text/plain' }))) }
        else if (_target instanceof Blob) { resolve(blobToBase64(_target)) }
        else if (_target instanceof ArrayBuffer) { resolve(window.btoa(String.fromCharCode(...new Uint8Array(_target)))) }
        else if (_target instanceof HTMLCanvasElement) { resolve(_target.toDataURL(options?.type, options?.quality)) }
        else if (_target instanceof HTMLImageElement) {
          const img = _target.cloneNode(false) as HTMLImageElement
          img.crossOrigin = 'Anonymous'
          imgLoaded(img).then(() => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')!
            canvas.width = img.width
            canvas.height = img.height
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            resolve(canvas.toDataURL(options?.type, options?.quality))
          }).catch(reject)
        }
  
  // ...
}
```

这里可以看到，对于字符串，并不是直接使用 `btoa` 进行编码，而是通过构造 `blob` 数据然后通过 `FileReader` 来读取

原因是多数浏览器下 `btoa` 对 `Unicode` 字符串进行编码都会触发 `InvalidCharacterError` 异常

比如我对我的姓进行编码，直接报错

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/02/26/202202262137176.avif)

这是由于 `UTF-8` 是可变长度的，如果直接使用 `btoa` ，就可能报错

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/02/26/202202262136738.avif)

可以看到 `mdn` 也给出了编码 `Unicode` 字符串的一种方法，就是

转移任何扩展字符，转成 `ASCII` ，这样就可以使用 `btoa` 进行编码了

这里使用的是 `encodeURIComponent` 和 `decodeURIComponent`

在截图的结尾，更加推荐使用类型化数组来进行转换

在源码中，对于 `ArrayBuffer` 类型就是使用 `Unit8Array` 来进行转化，然后再使用 `btoa`

```ts
// String.fromCharCode 拿到 ascii 编码后的字符串
if (_target instanceof ArrayBuffer) { resolve(window.btoa(String.fromCharCode(...new Uint8Array(_target)))) }
```

对于 `image` 和 `canvas` ，都是通过 `canvas.toDataURL` 来直接读取 `base64` 编码后的数据

其中 `image` 需要先 画 到 `canvas` 上，然后使用 `canvas.toDataURL` 处理