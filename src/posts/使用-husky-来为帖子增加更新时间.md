---
title: 使用 husky 来为帖子增加更新时间
key: 1658972281date: 2022-07-28 09:38:01
updated: 2023-02-13 18:28:44
tags:
- Hexo
- Next
- Nodejs
- JavaScript
- Husky
- Git
categories:
- 编程
---


# 前言

使用 `husky` 来为 `Hexo` 帖子增加更新时间

<!-- more -->

本文都是建立在 `Hexo` 的 `Next` 主题下的，其他的主题可能会不兼容

在 `Next` 主题下，其实有配置可以让我们开启帖子更新时间的，如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/28/202207280948585.avif)

默认情况下，`Next` 应该是会去读取文件的最后修改时间来作为更新时间的

但是这会出现一个问题，那就是我们使用的 `Github Action` 自动部署的

每次都会重新拉取仓库，这样子每个文件的最后修改时间都会变成创建时间

# 正文

为了解决上面提到的问题，有两种解决办法

- 直接关闭更新时间，眼不见为敬（~~推荐~~
- 增加 `updated` 字段手动更新帖子更新时间

这里我个人思考了下，决定还是得手动更新帖子时间，原因如下：

- 我想开启这个功能但我又想通过 `Github Action` 部署
- 万一换电脑了，重新拉取仓库，那更新时间就全乱了
- ~~为了学习~~

## 添加 updated 字段

在每个帖子 `md` 文件的顶部， 我们可以通过增加 `updated` 字段来指定更新时间

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/28/202207280958069.avif)

首先我们可以更改模板，加上 `updated` ，这样每一次 `hexo new` 就会带上 `updated` 字段了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/28/202207281000922.avif)

接下来我们要给之前的帖子加上更新时间

我们依然使用 `js` 来写个脚本来批量修改文章内容

在这之前，我们首先要做个表格来保存帖子的最后修改时间，至于原因，后面会讲

在 `Node` 上，我们可以使用 `fs.stat` 来获取文件的信息

```javascript
const fsPromise = require('fs/promises');
const path = require('path');
const dayjs = require('dayjs');

const POST_LIST_DIR = path.resolve('./source/_posts');

const main = async () => {
  const filenameList = await fsPromise.readdir(POST_LIST_DIR);
  const fileHandler = await fsPromise.open("./updated.json", "w+");
  const infoList = [];
  for (const filename of filenameList) {
    const filepath = path.resolve(POST_LIST_DIR, filename);
    const fileStat = await fsPromise.stat(filepath);
    // 把 mtime 转成需要的格式
    const updated = dayjs(fileStat.mtime).format("YYYY-MM-DD HH:mm:ss");
    infoList.push({
      filepath,
      updated
    });
  }
  // 写入文件
  await fileHandler.write(JSON.stringify(infoList));
  await fileHandler.close();
}

main();
```

执行之后我们就能发现项目根目录下有个 `updated.json` 文件，打开它格式化下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/28/202207281035982.avif)

这样子我们就保存了文件的更新日期

有人可能疑问了，你这更新时间怎么一个样

因为之后的操作会写入文件，会导致 `mtime` 发生改变，而我当时又没有备份，留下了悔恨的泪水...

`ok` ，有了数据备份之后我们就可以开始折腾了，和之前处理 `CDN` 前缀一样，我们依然分为三个步骤

- 读取帖子列表
- 加上 `updated` 字段
- 把新的帖子内容写回文件

代码如下，由于 `getPostList` 和 `writePostList` 和之前是一样的，所以这里直接抽成公共函数引入了

不清楚实现的可以去 {% post_link 一个替换-cdn-前缀的小工具 一个替换 cdn 前缀的小工具 %} 这个帖子查看

```javascript
const {getPostList, writePostList} = require('./util');
const fsPromise = require("fs/promises");
const dayjs = require('dayjs');

// 非贪婪
const REGEXP = /---(?<frontMatter>(\S|\s)*?)---/;

/**
 * @param filepath {string}
 * @returns {Promise<string>}
 */
const getFileLastModifyDate = async (filepath) => {
  // 通过 stat 获取修改时间
  const fileStat = await fsPromise.stat(filepath);
  return dayjs(fileStat.mtime).format("YYYY-MM-DD HH:mm:ss");
}

/**
 * @param postList {Array<{ filepath: string; fileContent: string }>}
 * @returns {Promise<Array<{ filepath: string; fileContent: string }>>}
 */
const addPostUpdated = async (postList) => {
  // 过滤掉不符合正则的文件
  postList = postList.filter(post => {
    const {fileContent} = post;
    return REGEXP.test(fileContent);
  });

  const newPostList = [];

  for (const post of postList) {
    const {filepath, fileContent} = post;
    const updated = await getFileLastModifyDate(filepath);
    const {frontMatter} = fileContent.match(REGEXP).groups;
    const infoList = frontMatter
      .split(/\r|\n|\r\n/)
      .filter(item => !!item.trim());
    // 找 date 字段
    const dateInfoIndex = infoList.findIndex(item => item.startsWith("date"));
    // 找 updated 字段
    const updatedInfoIndex = infoList.findIndex(item => item.startsWith("updated"));
    if (updatedInfoIndex > -1) {
      // 有 updated 字段就跳过
      continue;
    }
    // 在 date 字段后插入 updated 字段
    infoList.splice(dateInfoIndex + 1, 0, `updated: ${updated}`);
    // 替换内容并 push 到新的 newPostList 中，用于写回文件
    newPostList.push({
      filepath,
      fileContent: fileContent.replace(REGEXP, `---\n${infoList.join('\n')}\n---`)
    });
  }

  return newPostList;
}

const main = async () => {
  const postList = await getPostList();
  const newPostList = await addPostUpdated(postList);
  await writePostList(newPostList);
}

main();
```

这里依然用到了我们的老朋友正则，使用 `/---(?<frontMatter>(\S|\s)*?)---/` 来匹配开头的帖子元数据

注意到这里使用了具名捕获组，这样方便我们拿到数据，以及非贪婪匹配 `*?` 

默认贪婪匹配的情况下，我发现有点问题，主要是表格的语法里面也会出现 `---` 三个横杠的情况，会修改到其他的地方，所以要使用非贪婪

以及使用 `(\S|\s)*?` 而不是 `.*?` ，因为 `.` 不匹配换行符号

**重要：这个工具只有在第一次才能获取正确的修改时间，因为存在重新写入文件，会导致 `mtime` 变化！！**

**重要：这个工具只有在第一次才能获取正确的修改时间，因为存在重新写入文件，会导致 `mtime` 变化！！**

**重要：这个工具只有在第一次才能获取正确的修改时间，因为存在重新写入文件，会导致 `mtime` 变化！！**

如果不小心搞错了，也不用担心，因为前文我们提前存了个 `updated.json` ，读出来，然后不用 `fs.stat` 了，而是根据 `json` 文件里的映射一一对应重新 `patch` 一下即可

```javascript
const {getPostList, writePostList} = require('./util');
const fsPromise = require("fs/promises");
const dayjs = require('dayjs');
const path = require("path");

// 非贪婪
const REGEXP = /---(?<frontMatter>(\S|\s)*?)---/;
let updatedMap = {};

const getUpdatedJsonMap = async () => {
  const string = (await fsPromise.readFile(path.resolve('./updated.json'))).toString('utf-8');
  const array = JSON.parse(string);
  // 根据 json 文件生成 map
  updatedMap = array.reduce((map, item) => {
    map[item.filepath] = item.updated;
    return map;
  }, {});
}

/**
 * @param postList {Array<{ filepath: string; fileContent: string }>}
 * @returns {Promise<Array<{ filepath: string; fileContent: string }>>}
 */
const addPostUpdated = async (postList) => {
  postList = postList.filter(post => {
    const {fileContent} = post;
    return REGEXP.test(fileContent);
  });

  const newPostList = [];

  for (const post of postList) {
    const {filepath, fileContent} = post;
    // const updated = await getFileLastModifyDate(filepath);
    // 拿到对应文件的 updated 值
    const updated = updatedMap[filepath];
    if (!updated) {
      continue;
    }
    const {frontMatter} = fileContent.match(REGEXP).groups;
    const infoList = frontMatter
      .split(/\r|\n|\r\n/)
      .filter(item => !!item.trim());
    const dateInfoIndex = infoList.findIndex(item => item.startsWith("date"));
    const updatedInfoIndex = infoList.findIndex(item => item.startsWith("updated"));
    if (updatedInfoIndex > -1) {
      // 原地更新
      infoList[updatedInfoIndex] = `updated: ${updated}`;
    } else {
      // 在 date 字段后插入 updated 字段
      infoList.splice(dateInfoIndex + 1, 0, `updated: ${updated}`);
    }
    newPostList.push({
      filepath,
      fileContent: fileContent.replace(REGEXP, `---\n${infoList.join('\n')}\n---`)
    });
  }

  return newPostList;
}

const main = async () => {
  const postList = await getPostList();
  await getUpdatedJsonMap();
  const newPostList = await addPostUpdated(postList);
  await writePostList(newPostList);
}

main();
```

到这里我们就完成了对所有的 `md` 文件添加上 `updated` 字段了

但是还有个问题，难道我每次修改帖子提交，我都要自己去改 `updated` 字段吗

这也太不优雅了，作为一个爱搞事的人，绝不会去做没意义的事，所以我们要让帖子自己更新

## 使用 husky 来自动更新帖子

刚开始也有在网络上查找相应的办法，但是关于这个问题还是太少解决方案了

最后我决定使用 `husky` 来解决这个问题

`husky` 是一个工具，可以让我们在 `git` 操作上 `hook` 一些逻辑

我们主要使用 `husky` 在 `commit` 前检测 `add` 的文件中是否含有帖子，如果有，读取这个帖子，把 `updated` 字段置为当前的时间，然后重新 `add` 进去

`husky` 的官网 [Husky - Git hooks](https://typicode.github.io/husky/#/)

首先我们要安装 `husky` ，这里我用的是 `pnpm`， 如果你用的是 `npm` ，那么使用 `npm install husky --save-dev` 

```text
pnpm add husky -D
```

安装完依赖之后，我们还要开启 `git hooks` 功能，执行

```text
pnpx husky install
```

然后项目根目录下就会出现一个 `.husky` 的文件夹

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/28/202207281434119.avif)

接着我们添加一个 `pre-commit` 的 `hook`

```text
pnpx husky add .husky/pre-commit "pnpm run flushPostUpdated"
```

这里这个 `flushPostUpdated` 命令我们要注册到 `package.json` 中

```json5
{
  // ...
  "scripts": {
    "build": "hexo generate",
    "clean": "hexo clean",
    "deploy": "hexo deploy",
    "server": "hexo server",
    "flushPostUpdated": "node flushPostUpdated.js"
  }
  // ...
}
```

我们可以在 `flushPostUpdated.js` 里面写个 `hello world` ，然后随便 `add` 一个文件 `commit` 一下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/28/202207281443275.avif)

可以看到文件被执行了，打印了 `hello world`

接下来我们的目标就是在 `flushPostUpdated` 这个文件实现功能了

首先我们要获取当前 `git add` 的文件列表

这里我们使用 `shelljs` 配置 `git status` 命令来进行解析

一般我们都是直接使用 `git status` 来查看当前文件的追踪情况的，如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/28/202207281521524.avif)

但是这个格式不利于我们做解析，所以我们要配合一些参数来简化这些信息

我们可以打开 [Git - git-status Documentation](https://git-scm.com/docs/git-status) 查看文档

其中 `--porcelain` 以便于解析的格式输出相应的信息，如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/28/202207281529837.avif)

这个格式我们就非常喜欢了，只要按行处理即可

当然，在这之前，我们需要明白每个文件之前的符号代表的意义

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/28/202207281530825.avif)

我们依然查看上面的文档，拉下来在 `Output` 中，详细的为我们介绍了符号的意义

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/28/202207281546317.avif)

可以看到两个 `?` 代表文件未被跟踪，到时我们解析可以直接跳过这些行

`M` 代表文件被修改，而根据我们输出的图来看， `M` 可能在第一个字符（上图中的 `X` 位置），也可能在第二个字符（上图中的 `Y` 位置），这又是什么意思呢

这里我们要搞明白 `X` 和 `Y` 代表的意思，在这段文档的上面，解释了 `X` 和 `Y` 的意义，这里我们直接关注圈出来的部分

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/28/202207281552526.avif)

`X` 代表了 `index` 索引区的情况，而 `Y` 代表了工作区的情况，每当我们把文件 `add` 之后，实际上是把工作区的文件复制到索引区

根据我们上图的输出的信息，此时 `package.json` 文件应该是在 `index` 区里面的，我们把它从 `index` 区删除再输出信息看看

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/28/202207281557231.avif)

这时 `M` 标记在 `Y` 位置展示了，表示工作区和索引区的 `package.json` 不一致，被标记为修改了

其实更容易的理解是： `X` 代表了 `index` 区和当前版本库的差异，而 `Y` 代表了工作区和 `index` 区的差异

我们可以重新添加 `package.json` ，然后再修改 `package.json` 的内容

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/28/202207281601390.avif)

这时会出现两个 `M` ，意味着 `index` 区和当前的版本库文件不一致，工作区和当前的 `index` 区文件不一致

ok ，明白了之后，我们其实要处理的行就很明确了，即 **X 列为 M 状态的帖子文件**

有没有办法不输出这些未追踪的文件呢？

`git status` 提供了 `--untracked-files[=<mode>]` 来让我们能够选择是否输出为追踪的文件，其中 `mode` 为 `no` 的情况下即可不输出未追踪的文件

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/28/202207281611407.avif)

这样子就非常 nice 了，非常好操作，但是这个帖子的中文被转义了，而且还出现了引号，有点不适

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/28/202207281739808.avif)

使用 `git config --global core.quotepath false` 关掉 `git` 的自动转义功能，记得控制台保持 `utf-8` 编码，不然会乱码

再输出一次命令看看

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/28/202207281741025.avif)

现在中文直接显示，那么我们就能很好的解析了

接下来我们尝试使用 `shelljs` 来解析

```javascript
const shelljs = require('shelljs');
const path = require('path');
const fsPromise = require('fs/promises');

const POST_LIST_DIR = path.resolve('./source/_posts');
const CODE = {
  SUCCESS: 0,
  FAILURE: 101,
};

/**
 * @returns {string[]}
 */
const getMdFilepathList = () => {
  const result = shelljs.exec("git status --porcelain --untracked-files=no", {
    // 控制台不输出
    silent: true
  });

  if (result.code !== CODE.SUCCESS) {
    throw result.stderr;
  }

  return result.stdout
    .split(/\r|\n|\r\n/)
    // 以 M 开头
    .filter(line => line.startsWith("M"))
    // 提取文件路径
    .map(line => path.resolve(line.substring(3)))
    // 过滤非目标下文件
    .filter(filepath => filepath.startsWith(POST_LIST_DIR))
    // 过滤非 md 后缀文件
    .filter(filepath => path.extname(filepath) === '.md');
}

console.log(getMdFilepathList());
```

执行之后，就可以看到输出的文件列表了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/29/202207290932798.avif)

得到文件路径列表之后，我们要做的就是和之前脚本增加 `updated` 字段的逻辑

首先我们要创建一个当前的 `updated` 

```javascript
const dayjs = require('dayjs');

/**
 * @returns {string}
 */
const createCurrentUpdated = () => {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}
```

使用它，就能获取 `commit` 时的时间字符串了，把它 `patch` 到 `updated` 字段即可

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/29/202207290936429.avif)

接着我们根据前面获取的 `mdFilepathList` 来获取文件内容

```javascript
/**
 * @param filepathList {string[]}
 * @returns {Promise<Array<{ filepath: string; fileContent: string }>>}
 */
const getPostList = async (filepathList) => {
  const postList = [];
  for (const filepath of filepathList) {
    const buffer = await fsPromise.readFile(filepath);
    postList.push({
      filepath,
      fileContent: buffer.toString('utf-8')
    });
  }
  return postList;
}
```

这个函数和之前的 `getPostList` 逻辑是一样的，不过我们使用了参数来获取特定的文件

接着我们依然使用正则来替换 `updated` 字段

```javascript
const REGEXP = /---(?<frontMatter>(\S|\s)*?)---/;

/**
 * @param postList {Array<{ filepath: string; fileContent: string }>}
 * @returns {Promise<Array<{ filepath: string; fileContent: string }>>}
 */
const flushPostUpdated = async (postList) => {
  const newPostList = [];

  const updated = createCurrentUpdated();

  for (const post of postList) {
    const {filepath, fileContent} = post;
    const {frontMatter} = fileContent.match(REGEXP).groups;
    const infoList = frontMatter
      .split(/\r|\n|\r\n/)
      .filter(item => !!item.trim());
    const dateInfoIndex = infoList.findIndex(item => item.startsWith("date"));
    const updatedInfoIndex = infoList.findIndex(item => item.startsWith("updated"));
    if (updatedInfoIndex > -1) {
      // 原地更新
      infoList[updatedInfoIndex] = `updated: ${updated}`;
    } else {
      // 在 date 字段后插入 updated 字段
      infoList.splice(dateInfoIndex + 1, 0, `updated: ${updated}`);
    }
    newPostList.push({
      filepath,
      fileContent: fileContent.replace(REGEXP, `---\r\n${infoList.join('\r\n')}\r\n---`)
    });
  }

  return newPostList;
}
```

`patch` 完成之后我们使用之前的 `writePostList` 重新写回去

然后我们要重新把这些文件 `add` 进 `index` 区

```javascript
/**
 * @param filepathList {string[]}
 */
const reGitAdd = (filepathList) => {
  for (const filepath of filepathList) {
    let result;
    if ((result = shelljs.exec(`git add ${filepath}`)).code !== CODE.SUCCESS) {
      throw result.stderr;
    }
  }
}
```

这样子我们就完成了整个逻辑的编写

然后我们来测试一下效果，我们先把文件的 `updated` 字段改成 `1999-01-01 00:00:00`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/29/202207291012738.avif)

注意，这里我们先不使用 `pre-commit` 钩子，可以先注释掉，如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/29/202207291037819.avif)

然后我们 `add` 进去，然后提交一个 `commit` ，确保我们的版本库里面的日期是 `1999-01-01 00:00:00`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/29/202207291040787.avif)

然后我们打开 `pre-commit` 钩子，随便更改一下内容，再次提交

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/29/202207291042325.avif)

成功的变为当前的时间，并且此时是已经 `commit` 的了

---

到这里我们基本完成了整个流程，现在我们只管更新文章的内容，更新 `updated` 字段交给了脚本

大大地减少了心智负担，又可以愉快地写帖子了

但是到这里就结束了吗，不一定

## extra

当然以下部分为扩展部分，我觉得大部分人用上面的方式即可，没必要搞太复杂

现在我们来复现一下一个场景

小林正在写一篇帖子，帖子名为 `使用 husky 来为帖子增加更新时间` 

写完了帖子，小林开心的把帖子 `add` 到 `index` 区，准备 `commit` 然后 `push` 到 `Github` 上

这时候小林的老妈大喊了一声：“孩儿，去把洗好的衣服凉一下”

小林想着，既然 `add` 了，晚点 `commit` 也没事，就去晾衣服了

回来的时候，小林把一些额外的部分写进了帖子，还没写完突然想起之前的版本忘记了 `commit`

试问：如果这个时候 `commit` ，会出现什么情况

没错，还没 `add` 进 `index` 区的部分会被一同提交到版本库

因为在钩子中，我们的逻辑就是 `patch` 头部的 `updated` 字段，然后重新 `git add`

也就是说，如果此时文件的 `X` 和 `Y` 都是 `M` 标志的话，会出现一些矛盾

即我们 `git add` 的文件是当前工作区的文件，而工作区的文件存在另外的更新

那我们改如何解决这个问题呢？

刚开始的时候我是想像 `VSCode` 那样，选中某些行来进行局部 `add` 的，但是实在是没搞懂

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/29/202207291531076.avif)

之后，我就想了一个比较笨的办法，这个笨方法的步骤是：

- 把当前工作区的文件备份
- 对当前工作区的备份文件 `patch` 它的 `updated` 字段
- 把 `index` 区的文件写回工作区
- 对当前工作区的文件 `patch` 它的 `updated` 字段
- `git add` 当前工作区的文件
- 把备份文件写回原来的位置
- 删除备份文件

其中有一个非常重要的步骤是：**把 `index` 区的文件写回工作区**

这意味着我们必须知道当前在 `index` 区的文件长什么样

这里可以使用 `git show ":文件名"` 这个命令查看（~~别问我怎么知道的，我百度的~~

这样我们就可以用 `shelljs` 执行然后获取内容了

其他的步骤其实很简单，文件拷来拷去而已

这里放下完整的代码

```javascript
// flushPostUpdated.js
const shelljs = require('shelljs');
const path = require('path');
const fsPromise = require('fs/promises');
const {
  writePostList, 
  gitAdd, 
  createCurrentUpdated, 
  POST_META_REGEXP, 
  POST_LIST_DIR, 
  SHELLJS_CODE
} = require("./util");

/**
 * 根据 index 区的信息解析需要处理的文件列表
 * @returns {Array<{ X: string, Y: string; path: string; filepath: string }>}
 */
const getMdFilepathList = () => {
  const result = shelljs.exec("git status --porcelain --untracked-files=no", {
    // 控制台不输出
    silent: true
  });

  if (result.code !== SHELLJS_CODE.SUCCESS) {
    throw result.stderr;
  }

  return result.stdout
    .split(/\r|\n|\r\n/)
    .filter(line => line.startsWith("M"))
    .map(line => ({
      X: line[0],
      Y: line[1],
      path: line.substring(3),
      filepath: path.resolve(line.substring(3))
    }))
    .filter(({filepath}) => filepath.startsWith(POST_LIST_DIR))
    .filter(({filepath}) => path.extname(filepath) === '.md');
}

/**
 * 获取在 index 区指定路径的文件列表
 * @param filepathList {string[]}
 * @returns {Promise<Array<{ filepath: string; fileContent: string }>>}
 */
const getPostListInIndex = async (filepathList) => {
  const postList = [];
  for (const filepath of filepathList) {
    const result = shelljs.exec(`git show ":${filepath}"`, {
      silent: true,
    });
    if (result.code !== SHELLJS_CODE.SUCCESS) {
      throw result.stderr;
    }
    postList.push({
      filepath,
      fileContent: result.stdout,
    });
  }
  return postList;
}

/**
 * 获取工作区区指定路径的文件列表
 * @param filepathList {string[]}
 * @returns {Promise<Array<{ filepath: string; fileContent: string }>>}
 */
const getPostList = async (filepathList) => {
  const postList = [];
  for (const filepath of filepathList) {
    const buffer = await fsPromise.readFile(filepath);
    postList.push({
      filepath,
      fileContent: buffer.toString("utf-8"),
    });
  }
  return postList;
}

/**
 * 拷贝文件列表，返回拷贝后的文件名列表
 * @param mdFilepathList {Array<{filepath: string}>}
 * @returns {Promise<Array<string>>}
 */
const backupMdFile = async (mdFilepathList) => {
  const list = [];
  for (const {filepath} of mdFilepathList) {
    const dir = path.dirname(filepath);
    const destFilename = path.basename(filepath) + '.pre-commit' + path.extname(filepath);
    const destFilepath = path.resolve(dir, destFilename)
    await fsPromise.copyFile(filepath, destFilepath);
    console.log(`backup md, source file: ${filepath}, backup file: ${destFilepath}`);
    list.push(destFilepath);
  }
  return list;
}

/**
 * 更新帖子元数据区域的 updated 字段， updated 值为当前时间，主要用于 pre-commit 钩子
 * @param postList {Array<{ filepath: string; fileContent: string }>}
 * @returns {Promise<Array<{ filepath: string; fileContent: string }>>}
 */
const flushPostUpdated = async (postList) => {
  const newPostList = [];
  const updated = createCurrentUpdated();

  for (const post of postList) {
    const {filepath, fileContent} = post;
    console.log(`patching filepath: ${filepath}`);
    const {frontMatter} = fileContent.match(POST_META_REGEXP).groups;
    const infoList = frontMatter
      .split(/\r|\n|\r\n/)
      .filter(item => !!item.trim());
    const dateInfoIndex = infoList.findIndex(item => item.startsWith("date"));
    const updatedInfoIndex = infoList.findIndex(item => item.startsWith("updated"));
    if (updatedInfoIndex > -1) {
      // 原地更新
      infoList[updatedInfoIndex] = `updated: ${updated}`;
    } else {
      // 在 date 字段后插入 updated 字段
      infoList.splice(dateInfoIndex + 1, 0, `updated: ${updated}`);
    }
    newPostList.push({
      filepath,
      fileContent: fileContent.replace(POST_META_REGEXP, `---\n${infoList.join('\n')}\n---`)
    });
  }

  return newPostList;
}

/**
 * 备份的文件覆盖到原文件
 * @param filepathList {string[]}
 * @returns {Promise<void>}
 */
const recoveryMdList = async (filepathList) => {
  for (const filepath of filepathList) {
    const dir = path.dirname(filepath);
    const backupFilepath = path.resolve(dir, path.basename(filepath) + '.pre-commit' + path.extname(filepath));
    const sourceFilepath = filepath;
    await fsPromise.copyFile(backupFilepath, sourceFilepath);
  }
}

/**
 * 删除备份文件
 * @param filepathList {string[]}
 * @returns {Promise<void>}
 */
const deleteBackupMdList = async (filepathList) => {
  for (const filepath of filepathList) {
    await fsPromise.rm(filepath);
  }
}

const main = async () => {
  const mdFileList = getMdFilepathList();
  if (mdFileList.length === 0) {
    console.log('no md file need to patch.');
    return;
  }
  console.log('will patch count: ', mdFileList.length);
  // 拷贝一份备份文件，patch 头部的 updated 字段
  const backupMdList = await backupMdFile(mdFileList);
  const backupPostList = await getPostList(backupMdList);
  const newBackupPostList = await flushPostUpdated(backupPostList);
  await writePostList(newBackupPostList);
  console.log('backup success.');

  // 提取索引区内的文件，patch 头部的 updated，写回工作区，然后 add
  const postList = await getPostListInIndex(mdFileList.map(file => file.path));
  const newPostList = await flushPostUpdated(postList);
  await writePostList(newPostList);
  gitAdd(newPostList.map((post) => post.filepath));
  console.log('patch success.');

  // add 之后，把备份文件重新放到工作区中
  await recoveryMdList(newPostList.map((post) => post.filepath))
  console.log('recovery md success.');
  await deleteBackupMdList(backupMdList);
  console.log('delete backup success.');
}

main();
```

```javascript
// util.js
const shelljs = require('shelljs');
const fsPromise = require('fs/promises');
const path = require('path');
const dayjs = require('dayjs');

/**
 * 帖子存放文件夹路径
 * @type {string}
 */
const POST_LIST_DIR = path.resolve('./source/_posts');
/**
 * 帖子顶部元数据区域正则
 * @type {RegExp}
 */
const POST_META_REGEXP = /---(?<frontMatter>(\S|\s)*?)---/;
/**
 * shelljs 返回码
 * @type {{SUCCESS: number, FAILURE: number}}
 */
const SHELLJS_CODE = {
  SUCCESS: 0,
  FAILURE: 101,
};

/**
 * 读取帖子列表
 * @returns {Promise<Array<{ filepath: string; fileContent: string }>>}
 */
const getPostList = async () => {
  const filenameList = await fsPromise.readdir(POST_LIST_DIR);
  const postList = [];
  for (const filename of filenameList) {
    const filepath = path.join(POST_LIST_DIR, filename);
    const buffer = await fsPromise.readFile(filepath);
    postList.push({
      filepath, fileContent: buffer.toString('utf-8')
    });
  }
  return postList;
}

/**
 * 写入帖子列表
 * @param postList {Array<{ filepath: string; fileContent: string }>}
 * @returns {Promise<void>}
 */
const writePostList = async (postList) => {
  for (const post of postList) {
    const {filepath, fileContent} = post;
    await fsPromise.writeFile(filepath, fileContent);
  }
}

/**
 * 得到项目根目录下的 updated.json ，转为 map(filepath -> updated)
 * @returns {Promise<{[filepath: string]: string}>}
 */
const getUpdatedJsonMap = async () => {
  const filepath = path.resolve('./updated.json');
  try {
    await fsPromise.access(filepath);
  } catch (e) {
    // 文件不存在
    return {};
  }
  const string = (await fsPromise.readFile(filepath)).toString('utf-8');
  const array = JSON.parse(string);
  return array.reduce((map, item) => {
    map[item.filepath] = item.updated;
    return map;
  }, {});
}

/**
 * 保存帖子的最后一次修改日期到项目根目录的 updated.json 文件
 * @returns {Promise<void>}
 */
const saveUpdatedJson = async () => {
  const filenameList = await fsPromise.readdir(POST_LIST_DIR);
  const fileHandler = await fsPromise.open("./updated.json", "w+");
  const infoList = [];
  for (const filename of filenameList) {
    const filepath = path.resolve(POST_LIST_DIR, filename);
    const fileStat = await fsPromise.stat(filepath);
    const updated = dayjs(fileStat.mtime).format("YYYY-MM-DD HH:mm:ss");
    infoList.push({
      filepath, updated
    });
  }
  await fileHandler.write(JSON.stringify(infoList));
  await fileHandler.close();
}

/**
 * @param filepathList {string[]}
 */
const gitAdd = (filepathList) => {
  for (const filepath of filepathList) {
    let result;
    if ((result = shelljs.exec(`git add ${filepath}`, {
      silent: true
    })).code !== SHELLJS_CODE.SUCCESS) {
      throw result.stderr;
    }
  }
}

/**
 * 创建一个当前时间的 updated 值
 * @returns {string}
 */
const createCurrentUpdated = () => {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

module.exports = {
  getPostList,
  writePostList,
  getUpdatedJsonMap,
  gitAdd,
  createCurrentUpdated,
  saveUpdatedJson,
  POST_META_REGEXP,
  POST_LIST_DIR,
  SHELLJS_CODE
}
```

# 后记

虽然过程曲折，但终究实现了自动更新帖子 `updated` 字段的功能，单单依靠文件的信息确实不是很准确

想了下，做备份的话，感觉可以用 `stash` 来搞，部分文件 `stash push` ，然后部分文件 `stash pop`

也可以使用 `git` 操作指定撤销 `index` 区的文件，如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/29/202207291601767.avif)

这样看起来似乎更简单一点

还有优化空间，但是...

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/29/202207291609686.avif)

虽然解决了问题，可是我之前帖子的更新时间都不见了，我 TM ...