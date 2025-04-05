---
title: >-
  在 vue3 中集成 eslint9 和 prettier
tags:
  - Vue
  - JavaScript
  - Eslint
  - Prettier
categories:
  - 编程
date: 2025-03-24 17:27:36
updated: 2025-03-24 21:41:57
key: 1742808457
---



# 前言

在 vue3 中集成 eslint9 和 prettier 。

<!-- more -->

eslint8 已于 2024-10-05 进入不维护状态，所以本着没事找事干的准则，本文将在 vue 项目中使用 eslint9 并且集成 prettier 。

# 正文

## 创建 vue 项目

这一步简单，只需使用如下的命令，按提示即可创建最新的基于 vite 的 vue 项目了：

```bash
pnpm create vite
```

如果你是其他的包管理器，把前缀替换下即可。

## 新版 eslint 配置文件

从 eslint8 到 eslint9 ，官方更改了编写配置的规则， eslint9 使用了扁平化（ FlatConfig ）的方式，以 `.js` 扩展作为配置文件的格式：

- `eslint.config.js`
- `eslint.config.mjs`
- `eslint.config.cjs`

一般这里用第一个即可，即 `eslint.config.js` ，当然不用我们手动创建，后面会说。

配置文件会导出一个数组的配置项，看起来如下：

```javascript
export default [
  // 配置
];
```

如果想要类型提示，可以使用工具函数 `defineConfig` ：

```javascript
import { defineConfig } from "eslint/config";

export default defineConfig([
  // 配置
]);
```

数组内的每一个项目即为一个完整的配置项，后面的配置项的优先级会比前面的高（针对某个文件类型），每个配置项的结构如下：

```javascript
const config = {
  files: [],
  ignores: [],
  languageOptions: {},
  linterOptions: {},
  processor: {},
  extends: [],
  plugins: [],
  rules: [],
  setting: {},
};
```

这里面我们需要注意的配置项有 `files` ， `ignores` ， `languageOptions` ， `plugins` ， `rules` 和 `extends` ，这几个配置项对于开发来说比较常用。

### files 和 ignores

`files` 用于指定包含哪些文件，而 `ignores` 则用于排除某些文件。这两个选项都是通过 glob 表达式（相关解析库：[minimatch](https://github.com/isaacs/minimatch)）来识别的

比如我们想包含 `src` 下的所有 js 文件，我们的配置文件可以写为：

```javascript
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["src/**/*.js"],
  },
]);
```

如果 `src` 内的某个 js 是第三方导入的，那可以使用 `ignores` 排除掉：

```javascript
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["src/**/*.js"],
    ignores: ["src/assets/js/thrid-lib.js"],
  },
]);
```

`ignores` 默认会排除掉 `node_modules` ，所以不用我们手动指定。

### rules

这个和之前的基本一样，对象键名为规则名，键值为严重等级，或者一个数组，第一个值为严重等级，后续的值为规则自定义的参数。

严重等级分为：

- `error`（或者数字 2），违反规则将导致 eslint 检查报错。
- `warn` （或者数字 1），违反规则会出现警告，但不会导致 eslint 报错。
- `off` （或者数字 0），关闭该规则。

比如此时想要让每行语句都加上分号，每家就报告错误的话，我们可以使用 `@stylistic/eslint-plugin` 里面的 [semi](https://eslint.style/rules/js/semi) 规则，配置如下：

```javascript
import { defineConfig } from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
  {
    // 这里为了方便演示，只检测 src/main.ts 文件
    files: ["src/main.ts"],
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "@stylistic/semi": "error",
    },
  },
]);
```

这里如果看不懂 `plugins` 的配置可以先不管，你只要知道 `plugins` 注册了一个命名空间，这个空间叫 `@stylistic` ，它来源于我们导入的 `stylistic` 插件，接着，在 `rules` 上我们就可以使用这个命名空间内的规则，即 `@stylistic/semi` 。

这里我们把严重等级设置为 `error` ，意味着，现在检查会报错，如下图：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/03/24/20250324112347978.avif)

这是执行命令行的检查， eslint 也提示出现错误：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/03/24/20250324112723606.avif)

当然，这个规则的意思是控制分号，而不是禁止分号，默认是禁止分号的功能是因为规则提供了一个默认的参数，这个参数 `always` 要求语句末必须存在分号，也就是说，上面的配置和下面等价：

```javascript
import { defineConfig } from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
  {
    // 这里为了方便演示，只检测 src/main.ts 文件
    files: ["src/main.ts"],
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "@stylistic/semi": ["error", "always"],
    },
  },
]);
```

如果我们把 `always` 改为 `never` ，那么就是要求每个语句末不要加分号，除了那些为了消除歧义必须加的分号除外，此时配置如下：

```javascript
import { defineConfig } from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
  {
    // 这里为了方便演示，只检测 src/main.ts 文件
    files: ["src/main.ts"],
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "@stylistic/semi": ["error", "never"],
    },
  },
]);
```

此时 eslint 便不再报错，如下图：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/03/24/20250324114050718.avif)

### plugins

这个和之前的也基本一样，插件的作用主要是扩展新的规则，你可以简单地理解为，插件就是通过写额外的代码来新增新的规则，但插件默认是不会启用这些规则的，需要你在 `rules` 中启用，所以在前面的文章中，我们通过 `@stylistic/eslint-plugin` 来导入插件，然后通过在 `rules` 中编写 `"@stylistic/semi": ["error", "never"]` 启用了内部的一个规则。

通过 `plugins` 注册的插件会指定一个命名空间，这个空间关系到 `rules` 中规则的名称，比如对于前面的例子，如果我们把命名空间改为 `cm` ，那么 `rules` 内相关的规则就要改为 `cm` 开头：

```javascript
import { defineConfig } from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
  {
    // 这里为了方便演示，只检测 src/main.ts 文件
    files: ["src/main.ts"],
    plugins: {
      cm: stylistic,
    },
    rules: {
      "cm/semi": ["error", "never"],
    },
  },
]);
```

这也同时会影响 eslint 插件的提示信息：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/03/24/20250324143535580.avif)

所以一般情况下，使用简化的包名是比较合适的，能快速的知道是哪个插件的规则报错的。

### extends

前面我们谈及了 eslint 的 `plugins` 和 `rules` ，在 eslint 中，很多时候我们不可能一个一个的规则手动的去启用，所以很多的包都会带有预设的配置供我们使用，这时我们使用 eslint 的 `extends` 来继承这些预设的配置，然后重写部分规则即可。

比如我们使用 `eslint-plugin-vue` 这个插件，在这个插件的导出中，提供了一组可选的内置配置：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/03/24/20250324152655711.avif)

其中那些 `LegacyConfig` 的导出项为 eslint8 所用的，而 eslint9 需要使用下面那些 `FlatConfig` 。

这时我们可以用如下的配置来继承：

```javascript
import { defineConfig } from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";
import eslintPluginVue from "eslint-plugin-vue";

export default defineConfig([
  {
    files: ["src/App.vue"],
    extends: [
      stylistic.configs.recommended,
      eslintPluginVue.configs["flat/recommended"],
    ],
  },
]);
```

这时候，看 `src/App.vue` 文件，就可以发现已经出现了相关的提示：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/03/24/20250324155516486.avif)

### languageOptions

这个对象主要是用来配置一些 js 语言选项的配置，具体如下：

```javascript
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    languageOptions: {
      ecmaVersion: "latest", // ecma 版本，默认为最新
      sourceType: "module", // 包导入类型，cjs 还是 esm 还是纯 js ，默认为 esm
      parser: {}, // 指定解析器，不指定使用 eslint 内置解析器 espree
      parserOptions: {
        // 配置解析器的选项
      },
      globals: {
        // 配置全局合法的对象
        var1: "writable", // var1 可写可读
        var2: "readonly", // var2 只读
        var3: "off", // 不允许使用
      },
    },
  },
]);
```

eslint 内置的 `parserOptions` 可配置的选项可以查看[此处](https://eslint.org/docs/latest/use/configure/language-options#specifying-parser-options)。

`globals` 选项有对应的 `globals` 包，可以方便我们快速导入对应环境的全局变量，这个后面会讲。

`ecmaVersion` 和 `sourceType` 在 vue 项目中的话基本就是按默认就行了，即 `latest` 和 `module` 。

`parser` 的话， vue 需要一个专属的 `parser` 才能解析 `.vue` 模板，这个后面也会讲。

## 安装对应依赖

由于需要在 vue 下集成 eslint9 和 prettier ，我们需要安装下列的包：

- `eslint`
- `eslint-plugin-prettier`
- `eslint-plugin-vue`
- `globals`
- `prettier`
- `typescript-eslint`
- `@eslint/js`

当然很多我们不用手动装，只需执行如下的命令：

```bash
npm init @eslint/config
```

注意这里不要用 pnpm ，两者的 init 命令似乎不一样。

执行后，选第二个，接着下来的选项按需求选即可即可，如下图：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/03/24/20250324094042067.avif)

这样子我们就安装了一些需要的包，并且也生成了一个 eslint 的配置文件：

```javascript
import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,vue}"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,vue}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,vue}"],
    plugins: {
      js,
    },
    extends: ["js/recommended"],
  },
  tseslint.configs.recommended,
  pluginVue.configs["flat/essential"],
  {
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
]);
```

这里我们可以精简以下 `files` 字段，因为一般情况下我们不会写 `.mjs` ， `.cjs` 和 `.js` 文件，并且我们希望只针对 `src/` 下的文件：

```javascript
import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";

export default defineConfig([
  {
    files: ["src/**/*.{ts,vue}"],
  },
  {
    files: ["src/**/*.{ts,vue}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["src/**/*.{ts,vue}"],
    plugins: {
      js,
    },
    extends: ["js/recommended"],
  },
  tseslint.configs.recommended,
  pluginVue.configs["flat/essential"],
  {
    files: ["src/**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
]);
```

进一步，其实我们不需要那么多的配置项，可以合并下：

```javascript
import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";

export default defineConfig([
  {
    files: ["src/**/*.{ts,vue}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["src/**/*.vue"],
    extends: [pluginVue.configs["flat/recommended"]],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
]);
```

该配置几乎已经将 vue 和 eslint9 集成了，这里需要注意是最后一项配置了 `parserOptions.parser` ，其值为 `tseslint.parser` ，这是因为上一项的 `pluginVue.configs["flat/essential"]` 中使用了 `vue-eslint-parser` ，这个 `parser` 不支持 `<script setup lang="ts"></script>` ，即模板内的 ts 块，所以需要传递 `parser` 参数，让 `vue-eslint-parser` 内部使用 `tseslint.parser` 来解析。

第二项配置了 `globals.browser` ，这告诉了 eslint 使用浏览器下的一些全局对象不要报错，如果我们查看该包的源代码，其实它就是一个 json 文件：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/03/24/20250324163210725.avif)

这里的 `false` 等价于 `readonly` ，也就是对象默认都是只读的。

接着，我们安装 prettier 相关的依赖，首先是 `eslint-plugin-prettier` ，执行以下命令：

```bash
pnpm add eslint-plugin-prettier -D
```

然后使用 `recommended` 导出，放到配置的最后一项，确保关闭前面那些和 prettier 相冲突的规则：

```javascript
import { defineConfig } from "eslint/config";
import pluginPrettierRecomended from "eslint-plugin-prettier/recommended";

export default defineConfig([
  // ...
  // 其他配置
  pluginPrettierRecomended,
]);
```

不过我们会发现 eslint 挂了，我们查看 vscode 的输出面板，查看 eslint 的输出，发现是缺少了 `eslint-config-prettier` 包：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/03/24/20250324165221241.avif)

这里你可能会好奇，为啥得安装这个包啊，我们查看这个包的` package.json` 文件，发现 `peerDependencies` 字段有几个包：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/03/24/20250324165438676.avif)

这意味着在我们项目中必须存在这些依赖，因为这些依赖并不依赖 `eslint-plugin-prettier` ，而是安装了 `eslint-plugin-prettier` 的项目。

所以，除了 `eslint-config-prettier` ，还需要 `prettier` 和 `@types/eslint`（这个类型包倒不是很重要），执行下面的命令：

```bash
pnpm add eslint-config-prettier prettier @types/eslint -D
```

这时候我们查看 `.vue` 文件，发现 prettier 相关的错误已经显示了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/03/24/20250324170021834.avif)

最后，再在 `package.json` 加一条 lint 的命令：

```json
{
  "scripts": {
    // ...
    "lint": "eslint --fix"
  },
}
```

至此，vue3 内 集成 eslint9 和 pettier 就完成了，当然还可以继续集成其他的库，比如 git 相关的 lint-staged 和 husky 等。

# 后记

之前我也写过集成 eslint 和 prettier 的相关[文章](/ab320da75195)，不过当时 eslint 的版本还是 7 还是 8 来着，我对 eslint 的感觉还是比较陌生的，毕竟一个项目一般搞好一次基本也不会频繁改这些东西，其他项目要用到直接拷贝即可。

不过这次借着这篇文章，也算是对 eslint9 有了个比较基础的认识，知道了常用的每个配置项的意思，其实这些东西文档都有，而且都很详细，就是全英文看久了真的头大...