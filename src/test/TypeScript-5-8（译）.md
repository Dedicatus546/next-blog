---
title: TypeScript 5.8（译）
tags:
  - TypeScript
  - JavaScript
categories:
  - 编程
date: 2025-03-03 22:45:58
updated: 2025-03-04 14:54:58
key: 1741013159
---



# 前言

原文地址：[Announcing TypeScript 5.8](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/)

<!-- more -->

# 正文

## 细粒化检测返回表达式的分支

考虑一段如下的代码：

```typescript
declare const untypedCache: Map<any, any>;

function getUrlObject(urlString: string): URL {
  return untypedCache.has(urlString) ? untypedCache.get(urlString) : urlString;
}
```

这段代码的意图是如果缓存中存在的话，从缓存中取 URL 对象，如果缓存中不存在，则创建一个新的对象。然而这里有一个 bug ：我们实际上忘记根据输入构建一个新的 URL 对象。不幸的是， TypeScript 通常不会捕获这类错误。

更多信息查看此 [PR](https://github.com/microsoft/TypeScript/pull/60761) 。
