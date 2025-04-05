---
title: 一个替换 cdn 前缀的小工具
key: 1658734852date: 2022-07-25 15:40:52
updated: 2023-02-13 18:28:44
tags:
- Node
- JavaScript
categories:
- 编程
---


# 前言

一个替换 `cdn` 前缀的小工具

<!-- more --> 

众所周知，人不会闲着蛋疼给自己找事干

所以，做这个小工具是有原因的，原因如下

目前博客的图床是丢在 `github` 仓库上的，然后通过 `jsdelivr` 来进行 `cdn` 代理的

这个说实话非常的不错，最开始图床用的 `sm.ms` ，但是图片不在自己手里不是很放心，后面就使用 `github` 图床

但是最近 `jsdelivr` 的 `cdn` 很容易出现连接不上的情况，可以说非常的操蛋，一下子整个站点的图片全挂了

`issue` 地址：[Jsdelivr have been DNS pollution and SNI block again in China. They are pointed to google, twitter and facebook IPs](https://github.com/jsdelivr/jsdelivr/issues/18397)

问题很明显：`cdn.jsdelivr.net` 被 `DNS` 污染了，所以无法访问了，但是另一个地址 `fastly.jsdelivr.net` 是没有问题的

所以我们需要把全部的 `md` 文档里面的图片的 `cdn.jsdelivr.net` 链接替换成 `fastly.jsdelivr.net`

虽然可以直接 `ide` 搜索复制的，但是作为一个有梦想的咸鱼，额，不对，有梦想的程序员，借助 `node` 来替我们完成这项工作

# 正文

首先我们需要拆解下处理的步骤

- 读出文件的内容
- 替换相关内容
- 写入文件的内容

所以我们可以写出下面的简单框架

```javascript
const fs = require('fs');
const path = require('path');

const POST_LIST_DIR = './source/_posts';
const SOURCE_CDN = 'fastly.jsdelivr.net';
const TARGET_CDN = 'cdn.jsdelivr.net';
const REGEXP = new RegExp(`!\\[.*\\]\\(https?:\\/\\/${SOURCE_CDN.replaceAll(".", "\\.")}.*\\)`, 'img');

/**
 * @returns {Promise<Array<{ filepath: string; fileContent: string }>>}
 */
const getPostList = async () => {
  // TODO
}

/**
 * @param postList {Array<{ filepath: string; fileContent: string }>}
 * @returns {Array<{ filepath: string; fileContent: string }>}
 */
const replaceCdn = (postList) => {
  // TODO 
}

/**
 * @param postList {Array<{ filepath: string; fileContent: string }>}
 * @returns {Promise<void>}
 */
const writePostList = async (postList) => {
  // TODO
}

const main = async () => {
  const postList = await getPostList();
  const newPostList = replaceCdn(postList);
  await writePostList(newPostList);
}

main();
```

可以看到这里面我们使用了 `{ filepath: string; fileContent: string }` 来作为中间的数据结构

主要是为了让内容和文件对应，这样子处理完成之后，我们能够重新的写回去

在替换部分我们使用了正则

```javascript
const REGEXP = new RegExp(`!\\[.*\\]\\(https?:\\/\\/${SOURCE_CDN.replaceAll(".", "\\.")}.*\\)`, 'img');
```

在 `md` 中，图片的语法是 `![图片的简介](图片地址)`

在不处理地址的情况下，我们使用 `/!\[.*\]\(.*\)/mg` 即可匹配到对应的项

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/25/202207251608716.avif)

加上地址的话只要在圆括号判断即可 `/!\[.*\]\(https?:\/\/fastly\.jsdelivr\.net.*\)/img`

这里加上地址判断的原因是之前还有一些图片使用的 `sm.ms` 的图床，排除掉它们

接下来就可以实现每个函数了

## getPostList 实现

```javascript
const getPostList = async () => {
  return new Promise((resolve, reject) => {
    // 读一个文件夹，会返回文件夹内的文件列表名字
    fs.readdir(POST_LIST_DIR, (err, result) => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      Promise.all(result.map(filename => {
        return new Promise((resolve, reject) => {
          // 构造文件的绝对路径
          const filepath = path.resolve(POST_LIST_DIR, filename)
          // 读取这个文件
          fs.readFile(filepath, (err, result) => {
            if (err) {
              reject(err);
              return;
            }
            // 把结果 resolve 出去
            resolve({
              filepath, 
              fileContent: result.toString('utf-8')
            });
          })
        })
      })).then(resolve, reject);
    });
  })
}
```

## replaceCdn 实现

```javascript
/**
 * @param postList {Array<{ filepath: string; fileContent: string }>}
 * @returns {Array<{ filepath: string; fileContent: string }>}
 */
const replaceCdn = (postList) => {
  return postList.map(post => {
    const { filepath, fileContent } = post;
    // 对每个文件内容进行正则替换
    return {
      filepath, 
      fileContent: fileContent.replace(REGEXP, (match) => {
        return match.replace(SOURCE_CDN, TARGET_CDN);
      })
    };
  });
}
```

这里 `replace` 使用了函数参数来替换对应内容，每匹配到一个结果，就会回调一次这个函数，将其返回结果作为新的字符串

比如这里的 `fileContent` 为 `![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/25/202207251608716.avif)`

那么函数里的 `match` 参数就会是 `![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/25/202207251608716.avif)`

然后我们再简单地 `replace` 地址即可

## writePostList 实现

```javascript
const writePostList = async (postList) => {
  return Promise.all(postList.map(post => {
    const { filepath, fileContent } = post;
    return new Promise((resolve, reject) => {
      // 写入文件
      fs.writeFile(filepath, fileContent, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }));
}
```

完成之后我们使用一个 `test.md` 来测试效果

```markdown
![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/25/202207251608716.avif)

aa![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/25/202207251608716.avif)bb

![](https://sm.ms/xx.avif)

https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/202207251608716.avif

https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/202207251608716.avif

aaahttps://fastly.jsdelivr.net/gh/Dedicatus546/image@main/202207251608716.avif
```

然后我们执行 `node ./replacePicCdn.js` 

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/25/202207251623316.avif)

然后我们就可以看见文件发生改变了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/25/202207251624556.avif)

# 后记

虽然是一个简单的小工具不过还是相当有趣的

主要是在正则这一块，通过 `new RegExp`的正则，`\` 这个也需要转义

比如字面量情况下 `/!\[.*\]\(.*\)/mg` 这样写即可

但是 `new` 的话就要 `new RegExp("!\\[.*\\]", "mg")` ，在这里卡了好一会了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/25/202207251631748.avif)