---
title: Manacher 算法求最长回文子串
key: 1648803863date: 2022-04-01 17:04:23
updated: 2023-02-13 18:28:45
tags:
- 回文
- 字符串
- Manacher算法
categories:
- 算法
---


# 前言

经典算法之 `Manacher`（马拉车） 算法求最长回文子串

<!-- more -->

最近刷了刷 `leetcode` 的题目，不刷不知道，一刷吓一跳，都忘得差不多了

吓得我一身冷汗，可不敢松懈~~躺平~~啊

不过好像也没记多少啊（逃

# 正文

## 回文字符串

回文字符串的意思就是正着读和反着读的结果是相同的

比如 `abcba` , `abccba`

对于判断是否为回文字符串，一般都使用以下的简单算法来判断

```javascript
function isPalindrome(str) {
  let i = 0;
  let j = str.length - 1;
  while (i < j) {
    if (str[i] !== str[j]) {
      return false;
    }
    i++;
    j--;
  }
  return true;
}
```

核心原理为使用两个指针分别从开头和结尾向中间遍历

依次判断每一步下对应的两位字符是否相等，不相等即不为回文字符串

当循环结束，证明所有两两对应的字符都相等，则该字符串为回文字符串

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/01/202204011743806.avif)

这里有一点要注意，回文字符串在奇偶长度下存在一定的差异

在奇数长度下，比如 `abcdcba` ，它的中点为 `d` ，此时它的左边和右边对称，可以理解为 `d` 为对称轴

而在偶数长度下，比如 `abcddcba` ，它没有所谓的对称轴，或者说它的对称轴为 `dd` ，`dd` 的左右两边对称

如果只是对于判断是否回文来说，这个差异其实影响不大，因为 `isPalindrome` 函数对奇偶都能正确地判断

奇数长度， `while` 循环退出时为 `i === j` ，对于 `i` （或者是 `j` ） 来说没必要判断

而偶数长度， `while` 循环退出时为 `i === j + 1` ，此时全部的字符都判断到了

## 回文子串

> 伟大的学者鲁迅曾经说过：每创造出一种特定格式的字符串，我们可以在其前面加上“子”，从而生成另一种问题

在字符串中找回文子串，很暴力的算法就是我们去遍历每个子串，判断是否为回文串，是的话再进行下一部的操作

```javascript
/**
 * @param str {string} 字符串
 */
function subPalindrome(str) {
  const len = str.length;
  for (let i = 0; i < len; i++) {
    for (let j = i; j < len; j++) {
      if (isPalindrome(str, i, j)) {
        // 做操作
        // ...
      }
    }
  }
}

/**
 * 判断字符串的某个范围是否为回文串
 * @param str {string} 字符串
 * @param i {number} 起始判断位置
 * @param j {number} 结束判断位置
 * @return {boolean} 该范围是否为回文串
 */
function isPalindrome(str, i, j) {
  while (i < j) {
    if (str[i] !== str[j]) {
      return false;
    }
    i++;
    j--;
  }
  return true;
}
```

通过两层 `for` 循环，确定起始位置 `i` 和结束位置 `j` ，然后判断该子串是否回文

这类问题可以延申出各种提问，比如

- 求字符串 `s` 的回文子串结果集
- 求字符串 `s` 的回文子串个数
- 求字符串 `s` 的最长的回文子串

对于第一个提问，只需在 `if (isPalindrome(str, i, j)) { /* ... */}` 内部剪切该子串，然后添加到结果数组即可

对于第二个提问，只需自增一个变量即可

对于第三个提问，只需每次和之前的最长回文子串判断长度即可

可以说这种算法，泛用性很高，但是致命的缺点是它的复杂度太高了，光两层 `for` 循环就是 <code>O(n<sup>2</sup>)</code> 的复杂度

再加上判断子串是否回文的时候又遍历了一次字符串，那么这个算法的时间复杂度就达到了惊人的 <code>O(n<sup>3</sup>)</code>

字符串一旦很长，就非常容易出现超时结果

前面我们使用了确定头尾节点的方式来遍历所有的子串

另一种思路是我们根据对称轴的方式来遍历所有的子串

这里我们以计算回文子串的个数来作例子

```javascript
/**
 * @param str {string} 字符串
 * @return {number} 回文子串的个数
 */
function subPalindrome(str) {
  const len = str.length;
  let count = 0;
  for (let i = 0; i < len; i++) {
    count += palindromeCount(str, i, i + 1);
    count += palindromeCount(str, i, i);
  }
  return count;
}

/**
 * 计算以 i j 为中点的回文串的个数
 * @param str {string} 字符串
 * @param i {number} 左中点
 * @param j {number} 右中点
 * @return {number} 返回回文串的个数
 */
function palindromeCount(str, i, j) {
  if (i < 0 || i >= str.length || j < 0 || j >= str.length) {
    return 0;
  }
  let count = 0;
  while (i >= 0 && j < str.length) {
    if (str[i] === str[j]) {
      count++;
    }
    i--;
    j++;
  }
  return count;
}
```

由于我们以通过对称轴的方式来遍历子串，由原来的两层 `for` 循环降低到一层，总体的时间复杂度降为 <code>O(n<sup>2</sup>)</code>

其中需要注意的是 `palindromeCount(str, i, i + 1)` 和 `palindromeCount(str, i, i)` 分别对应偶数长度和奇数长度的情况

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/02/202204021033925.avif)

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/02/202204021037507.avif)

## 最长回文子串

通过上面的分析，使用上面提到的 <code>O(n<sup>2</sup>)</code> 即可求出最长的回文子串，但是一旦字符串过长，依然会产生超时的问题

那么能不能用 `O(n)` 的复杂度求出最长的回文子串呢

答案是可以的，这也就是本文所要提到的 `Manacher` （马拉车）算法

该算法能在 `O(n)` 的时间内算出最长回文子串，但此时需要的空间复杂度由 `O(1)` 提升到 `O(n)` ，属于空间换时间的算法

首先 `Manacher` 算法通过添加分隔符来解决奇偶长度下的回文串的差异

比如，现在我们存在一个 `cbcbaa` 的字符串，该算法的第一步就是将该字符串变为 `#c#b#c#b#a#a#`

经过这样的变换，现在字符串的回文子串都会变成奇数回文子串

比如 `bcb` 为原字符串的一个回文子串，经过变化后为 `#b#c#b#` ，此时长度为 `7(3 + 4)`

而 `aa` 经过变化后为 `#a#a#` ，此时长度为 `5(2 + 3)`

接着我们需要开一个数组 `p[]` ，这个数组的长度为经过变化后字符串的长度

对于每个 `i` ， `p[i]` 对应的意义为，以 `p[i]` 为中心的**最长回文串的半径**

|  #  |  c  |  #  |  b  |  #  |  c  |  #  |  b  |  #  |  a  |  #  |  a  |  #  |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
|  1  |  2  |  1  |  4  |  1  |  4  |  1  |  2  |  1  |  2  |  3  |  2  |  1  |

可能通过表看起来不是很明显，可以通过下面这个图来理解**最长回文串的半径**

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/02/202204021130180.avif)

现在我们先不管这个 `p[]` 数组是怎么求出来的

在得到 `p[]` 数组之后，可以发现 `p[i] - 1` 就是以该点为中点所能形成的最长子回文串的长度（去掉 `#` 号后）

比如 `#c#b#c#` 中点 `b` 对应的 `p[i]` 为 `4` ， 此时去掉 `#` 号后结果为 `cbc` ，长度为 `3` ，即 `3 = 4 - 1`

比如 `#a#a#` 中点 `#` 对应的 `p[i]` 为 `3` ，此时去掉 `#` 号后结果为 `aa` ，长度为 `2` ，即 `2 = 3 - 1`

现在回过头来，我们需要去计算 `p[]` 这个数组，只要 `p[]` 数组求出来，那么我们就可以遍历这个 `p[]` 数组（ `O(n)` 时间下）得到最长的回文串了

首先，我们先以中心扩展的方法来讲一下如何更快的计算 `p[i]` 的值

假设现在有一个字符串为 `#a#b#c#d#c#b#a#`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/03/202204032313463.avif)

我们先用中心扩展计算到 `i` 为 `7` 的结果，此时表格为

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/03/202204032331174.avif)

当我们计算到 `i` 为 `8` 的时候，此时用中心扩展可以求出该位置对应的值

但是我们求出过 `i` 为 `7` 的 `p[i]` 值为 `8`

根据回文串对称的特性，此时它的左右两侧是对称的，这意味着，**如果 `i` 的左侧存在回文子串，那么右侧也一定存在相应的回文子串**

即计算 `i` 为 `8` 的 `p[i]` 的值，可以计算 `i` 为 `8` 相对于 `i` 为 `7` 的对称点，即 `i` 为 `6` 的 `p[i]` 的值

该值是计算过的，所以可以在 `O(1)` 的时间复杂度内计算出来

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/03/202204032332794.avif)

我们可以计算一下 `i` 为 `9` 时的表格，结果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/03/202204032333191.avif)

`i` 为 `11` 的时候表格如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/03/202204032334595.avif)

看起来似乎没什么问题，但是，当字符串为 `#c#d#c#b#c#d#c#b#c#` 时

假设我们计算到 `i` 为 `11` 的第二个 `d` 此时的 `p[i]` ，此时表格如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/04/202204041001146.avif)

然后此时我们推断 `i` 为 `15` 的 `p[i]` 的值，由于 `i` 为 `15` 关于 i 为 `11` 的对称点为 `i` 为 `7`

此时我们会把 `p[15]` 赋值为 `p[7]` ，即 `p[15] = 7` ，但是很明显，该值是错误的，为什么呢，我们可以标记以下 `p[7]` 的范围 和 `p[11]` 的范围

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/04/202204041013354.avif)

表格中黑色线为 `p[11]` 的范围，红色线为 `p[7]` 的范围

错误的原因即 `p[7]` 的范围有一部分是超出 `p[11]` 的范围的，所以，此时只能最长取到 `p[11]` 最左边的部分，如下图：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/04/202204041017480.avif)

此时只能取到蓝色的部分，所以此时 `p[15]` 应该为 `4`

这个过程可以理解为**确定下界**，即可以复用之前的值，但是该值必须收缩到合理的范围内

我们再举一个例子，此时目标字符串为 `#c#b#c#d#c#b#c#b#c`

我们计算到 `i` 为 `7` 的 `p[i]` 的值为 `8`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/04/202204041033398.avif)

然后我们计算 `i` 为 `13` 的 `p[i]` 的值

根据回文串的对称性，我们可以很方便的找到 `i` 为 `13` 关于 `i` 为 `7` 的对称点，即 `i` 为 `1`

此时 `p[1]` 为 `2` ，那么 `p[13]` 应该也为 `2`

但是很明显不是，我们标出 `p[7]` 和 `p[13]` 的范围看看

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/04/202204041050137.avif)

此时 `p[13]` 的范围超出了 `p[7]` 的范围，我们能取到的范围为蓝色部分，如下图：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/04/202204041052239.avif)

此时我们应该使用中心扩展继续对蓝色的两端进行遍历，确定 `p[13]` 能够达到的最大范围

即继续判断 `char[11]` 和 `char[15]` 是否相等，相等继续判断 `char[10]` 和 `char[16]` 是否相等

这个过程可以理解为**确定上界**，即通过下界确定的值可能不是该 `i` 能够达到的最大 `p[i]` 值，需要继续对两端进行扩展来确定最大的值

至此，我们其实讨论了三种情况下如何进行 `p[i]` 的快速计算

记 `maxIndex` 为当前最长的回文子串的中心索引

记 `i` 关于 `maxIndex` 的对称点为 `i'`

- 当 `i' - p[i'] < maxIndex - p[maxIndex]` 时，此时 `p[i] = maxIndex + p[maxIndex] - i` ，此时 `maxIndex + p[maxIndex]`
  为 `maxIndex` 对应的最长回文串的右边界的索引
- 当 `i' - p[i'] == maxIndex - p[maxIndex]` 时，此时 `p[i]` 依然为 `maxIndex + p[maxIndex] - i` ，但 `p[i]`
  此时可能还能扩展，所以需要继续使用中心扩展来计算该位置的最大值
- 当 `i' - p[i'] > maxIndex - p[maxIndex]` 时，此时 `p[i] = p[i']` ，且无法继续扩展

转化成代码如下：

```javascript
/**
 * @param str {string} 需要计算最长回文子串长度的字符串
 * @return {number} 最长回文串长度
 */
function manacher(str) {
  if (str.length === 0) {
    return 0;
  }
  // 加 # 号
  str = addHash(str);
  const p = [];
  let ans = 0;

  let maxIndex = 0;
  p[0] = 1;
  const len = str.length;
  for (let i = 1; i < len; i++) {
    // maxIndex 对应回文子串的右边界
    const rightIndex = maxIndex + p[maxIndex] - 1;
    // 小于右边界，可以使用对称性加快查找
    if (i <= rightIndex) {
      // 计算 i 关于 maxIndex 的对称点 symmetryI
      const symmetryI = 2 * maxIndex - i;
      // 对称点对应回文子串的左边界
      const symmetryILeftIndex = symmetryI - p[symmetryI] + 1;
      // maxIndex 对应回文子串的左边界
      const leftIndex = maxIndex - p[maxIndex] + 1;
      // 对称点左边界大于 maxIndex 左边界
      if (symmetryILeftIndex > leftIndex) {
        // 直接取值
        p[i] = p[symmetryI];
      }
      // 对称点左边界等于 maxIndex 左边界
      else if (symmetryILeftIndex === leftIndex) {
        // 直接取值
        p[i] = p[symmetryI];
        // 但是需要中心扩展
        while (
          i - p[i] >= 0 &&
          i + p[i] < len &&
          str[i - p[i]] === str[i + p[i]]
          ) {
          p[i]++;
        }
        // 更新右边界，尽可能使用对称性加快查找
        if (i + p[i] > maxIndex + p[maxIndex]) {
          maxIndex = i;
        }
      }
      // 对称点左边界小于 maxIndex 左边界
      else if (symmetryILeftIndex < leftIndex) {
        // 需要收缩
        p[i] = symmetryI - leftIndex + 1;
      }
    }
    // 无法使用对称性
    else {
      // 初始置为1
      p[i] = 1;
      // 尝试中心扩展
      while (
        i - p[i] >= 0 &&
        i + p[i] < len &&
        str[i - p[i]] === str[i + p[i]]
        ) {
        p[i]++;
      }
      // 更新右边界，尽可能使用对称性加快查找
      if (i + p[i] > maxIndex + p[maxIndex]) {
        maxIndex = i;
      }
    }
    ans += Math.floor(p[i] / 2);
  }
  return ans;
}

/**
 * @param str {string} 需要添加 # 号的字符串
 * @return {string} 添加 # 号后的字符串
 */
function addHash(str) {
  return "#" + str.split("").join("#") + "#";
}
```

到此该算法的实现就结束

可能有人会问，你这个代码怎么和我网上看的代码不一样

我们贴一个 `leetcode` 官方题解的 `manacher` 算法代码

```javascript
var countSubstrings = function (s) {
  let n = s.length;
  let t = ['$', '#'];
  for (let i = 0; i < n; ++i) {
    t.push(s.charAt(i));
    t.push('#');
  }
  n = t.length;
  t.push('!');
  t = t.join('');

  const f = new Array(n);
  let iMax = 0, rMax = 0, ans = 0;
  for (let i = 1; i < n; ++i) {
    // 初始化 f[i]
    f[i] = i <= rMax ? Math.min(rMax - i + 1, f[2 * iMax - i]) : 1;
    // 中心拓展
    while (t.charAt(i + f[i]) == t.charAt(i - f[i])) {
      ++f[i];
    }
    // 动态维护 iMax 和 rMax
    if (i + f[i] - 1 > rMax) {
      iMax = i;
      rMax = i + f[i] - 1;
    }
    // 统计答案, 当前贡献为 (f[i] - 1) / 2 上取整
    ans += Math.floor(f[i] / 2);
  }

  return ans;
};
```

对于一些边界的设置这里不讲，比如添加了 `$` 和 `!` 来作为头尾符号，这样可以在中心扩展时不用判断索引在数组位置的合法性

我们主要讲 `for` 循环内部的写法

第一句为

```javascript
f[i] = i <= rMax ? Math.min(rMax - i + 1, f[2 * iMax - i]) : 1;
```

其中 `i <= rMax` 不用解释，主要是 `Math.min(rMax - i + 1, f[2 * iMax - i])`

我们写的代码中

```javascript
if (symmetryILeftIndex > leftIndex) {
  // 直接取值
  p[i] = p[symmetryI];
}
// 对称点左边界等于 maxIndex 左边界
else if (symmetryILeftIndex === leftIndex) {
  // 直接取值
  p[i] = p[symmetryI];
  // other code ...
}
// 对称点左边界小于 maxIndex 左边界
else if (symmetryILeftIndex < leftIndex) {
  // 需要收缩
  p[i] = symmetryI - leftIndex + 1;
}
```

我们可以发现，只有当 `symmetryILeftIndex < leftIndex` 才会执行不一样的逻辑

而这个逻辑是一个收缩的过程，也就是说，无论如何，我们都能够复用对称点的值，但确保它收缩到 `maxIndex` 对应回文串的左边界内部即可

这里 `rMax - i + 1` 和 `symmetryI - leftIndex + 1` 意思相等

`f[2 * iMax - i]` 和 `p[symmetryI]` 意思相等

接着我们发现，无论如何他都进行了中心扩展和更新最大回文子串的中点和右边界这个步骤

```javascript
for (let i = 1; i < n; ++i) {
  // other code ....
  // 中心拓展
  while (t.charAt(i + f[i]) == t.charAt(i - f[i])) {
    ++f[i];
  }
  // 动态维护 iMax 和 rMax
  if (i + f[i] - 1 > rMax) {
    iMax = i;
    rMax = i + f[i] - 1;
  }
  // other code ....
}
```

其实不难理解，如果可以中心扩展的话，就能够使得循环走下去，如果不行，循环就退出

反应到我们写的代码来看，其实我们对每个 `if` 判断添加中心扩展也是可以的

```javascript
if (symmetryILeftIndex > leftIndex) {
  // 直接取值
  p[i] = p[symmetryI];
  // 尝试中心扩展
  while (
    i - p[i] >= 0 &&
    i + p[i] < len &&
    str[i - p[i]] === str[i + p[i]]
    ) {
    p[i]++;
  }
  // 更新右边界，尽可能使用对称性加快查找
  if (i + p[i] > maxIndex + p[maxIndex]) {
    maxIndex = i;
  }
}
// 对称点左边界等于 maxIndex 左边界
else if (symmetryILeftIndex === leftIndex) {
  // 直接取值
  p[i] = p[symmetryI];
  // 尝试中心扩展
  while (
    i - p[i] >= 0 &&
    i + p[i] < len &&
    str[i - p[i]] === str[i + p[i]]
    ) {
    p[i]++;
  }
  // 更新右边界，尽可能使用对称性加快查找
  if (i + p[i] > maxIndex + p[maxIndex]) {
    maxIndex = i;
  }
}
// 对称点左边界小于 maxIndex 左边界
else if (symmetryILeftIndex < leftIndex) {
  // 需要收缩
  p[i] = symmetryI - leftIndex + 1;
  // 尝试中心扩展
  while (
    i - p[i] >= 0 &&
    i + p[i] < len &&
    str[i - p[i]] === str[i + p[i]]
    ) {
    p[i]++;
  }
  // 更新右边界，尽可能使用对称性加快查找
  if (i + p[i] > maxIndex + p[maxIndex]) {
    maxIndex = i;
  }
}
```

但是经过分析之后我们明白，只有相等情况下中心扩展才是有意义的，大于或小于中心扩展的循环都是直接退出的，没有意义

对每种情况进行中心扩展，最终情况下，只有 `symmetryILeftIndex === leftIndex` 能走到循环里面，其他都是直接退出

维护 `iMax` 和 `rMax` 是同理的，只有当 `symmetryILeftIndex === leftIndex` 时，才有可能中心扩展出去，这样 `iMax` 和 `rMax` 才有可能更新，其他情况都是直接退出

# 后记

如果你已经明白了这个算法的原理，那么点击下面的连接，可以直接进行练习

[剑指 Offer II 020. 回文子字符串的个数 - 力扣（LeetCode）](https://leetcode-cn.com/problems/a7VOhD/)

在这里也非常感谢以下文章的帮助：

- [Manacher 算法 - 刘毅](https://ethsonliu.com/2018/04/manacher.html)
- [最长回文子串 - 维基百科](https://zh.wikipedia.org/wiki/%E6%9C%80%E9%95%BF%E5%9B%9E%E6%96%87%E5%AD%90%E4%B8%B2)

对于算法复杂度的证明，可以点击第一个链接，在后半部分有作者相关的分析