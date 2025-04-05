---
title: Vuex@next源码解析 - helpers篇
key: 1603939642date: 2020-10-29 10:47:22
updated: 2023-02-13 18:28:43
tags:
  - Vue
  - Vuex
  - JavaScript
categories:
  - 笔记
---


# 前言

这应该就是`Vuex`的最后一篇了。

本篇主要写`Vuex`方便开发者把相关`state`，`getter`，`mutation`，`action`以一种简单的方式混入组件中。

<!-- more -->

# helpers

`helpers.js`位于`src`文件夹下

![](https://i.loli.net/2020/10/29/utLfoZKnSNVhlmk.png)

## `mapStates`

现在我们有如下的一个`store`，并且注入到`Vue`中了。

```javascript
const store = createStore({
  state: {
    name: "lwf",
    age: 22,
  },
});
```

想使用`store`上的某个`state`，一般而言可以。

- `this.$store.state[stateName]`

```javascript
export default {
  name: "Test",
  methods: {
    test() {
      console.log(this.$store.state.name);
      console.log(this.$store.state.age);
    },
  },
  mounted() {
    this.test();
  },
};
```

- 通过`computed`进行包装

```javascript
export default {
  name: "Test",
  computed: {
    name() {
      return this.$store.state.name;
    },
    age() {
      return this.$store.state.age;
    },
  },
  mounted() {
    console.log(this.name);
    console.log(this.age);
  },
};
```

可以看出，每次去特定的状态，需要写`this.$store.state.xxx`这样子的代码。

一两个地方还好，一多起来，代码就会让人感觉很**丑**。

如果是嵌套的状态那就更恐怖了，比如`this.$store.state.m1.m2.m3.m4.propertyName`。

而第二种方式使得对状态的引用更加的直接，但是还是有一个问题。

就是在`computed`中的代码太类似了，如果对多个状态都这样子写，还是很**丑**。

所以，`Vuex`很贴心的给了我们一个工具函数，让我们能够以函数调用的形式来表达这种映射关系，使得整体的代码更加的简洁，如下：

```javascript
import { mapState } from "vuex";

export default {
  name: "Test",
  computed: {
    ...mapState(["name", "age"]),
  },
  mounted() {
    console.log(this.name);
    console.log(this.age);
  },
};
```

上面的代码能够运行，也得归功于`ES6`的展开运算符`...`。

OK，把代码贴上来，看看实现是如何做到的。

```javascript
export const mapState = normalizeNamespace((namespace, states) => {
  const res = {};
  if (__DEV__ && !isValidMap(states)) {
    console.error(
      "[vuex] mapState: mapper parameter must be either an Array or an Object"
    );
  }
  normalizeMap(states).forEach(({ key, val }) => {
    res[key] = function mappedState() {
      let state = this.$store.state;
      let getters = this.$store.getters;
      if (namespace) {
        const module = getModuleByNamespace(this.$store, "mapState", namespace);
        if (!module) {
          return;
        }
        state = module.context.state;
        getters = module.context.getters;
      }
      return typeof val === "function"
        ? val.call(this, state, getters)
        : state[val];
    };
    // mark vuex getter for devtools
    res[key].vuex = true;
  });
  return res;
});
```

最前面定义了一个`res`对象，用于保存所有的映射结果，最后返回的就是这个对象。

```javascript
if (__DEV__ && !isValidMap(states)) {
  console.error(
    "[vuex] mapState: mapper parameter must be either an Array or an Object"
  );
}
```

`if`来判断第二个参数是不是合法的映射对象，不是就要报错。

```javascript
normalizeMap(states).forEach(({ key, val }) => {
  res[key] = function mappedState() {
    // ...
  };
  // mark vuex getter for devtools
  res[key].vuex = true;
});
```

通过`normalizeMap`函数把第二个参数标准化了，然后遍历标准化后的数组，取到里面的每一个对象。

在`res`上挂载每个`key`，每个`key`对应的值是一个函数。

`res[key].vuex = true`用于让调试工具识别，这里可以忽略不管。

```javascript
res[key] = function mappedState() {
  let state = this.$store.state;
  let getters = this.$store.getters;
  if (namespace) {
    const module = getModuleByNamespace(this.$store, "mapState", namespace);
    if (!module) {
      return;
    }
    state = module.context.state;
    getters = module.context.getters;
  }
  return typeof val === "function"
    ? val.call(this, state, getters)
    : state[val];
};
```

这里可能有人有疑问，为什么可以`mappedState`函数中可以使用`this`。

这时因为，`res`是我们最终返回的结果，而最终我们会在组件内的`computed`中展开这个对象。

也就是说可以这个函数理解成写在`computed`上的一个函数。

而`Vue`会自动的对`computed`上的属性进行上下文的绑定，所以就能使用`this.$store`来取到`store`了。

这也表示了这个地方不能使用箭头函数，因为箭头函数的上下文在书写的时候已经确定了。

回到函数中，内部先取到总的`state`，以及全部的`getters`。

如果存在命名空间，那么要使用该命名空间对应模块（通过`getModuleByNamespace`函数来获取）对象的一个`state`和`getters`。

然后判断传进来的是否为一个函数，因为如果只是简单的映射，属性值可以直接为一个字符串，这时直接从`state`中取值，表示`store`中的`state`名。

也可以是一个函数，从而可以进行更加复杂地计算。

## `mapGetters`

```javascript
export const mapGetters = normalizeNamespace((namespace, getters) => {
  const res = {};
  if (__DEV__ && !isValidMap(getters)) {
    console.error(
      "[vuex] mapGetters: mapper parameter must be either an Array or an Object"
    );
  }
  normalizeMap(getters).forEach(({ key, val }) => {
    // The namespace has been mutated by normalizeNamespace
    val = namespace + val;
    res[key] = function mappedGetter() {
      if (
        namespace &&
        !getModuleByNamespace(this.$store, "mapGetters", namespace)
      ) {
        return;
      }
      if (__DEV__ && !(val in this.$store.getters)) {
        console.error(`[vuex] unknown getter: ${val}`);
        return;
      }
      return this.$store.getters[val];
    };
    // mark vuex getter for devtools
    res[key].vuex = true;
  });
  return res;
});
```

`mapXXX`这几个函数的逻辑很相像，如果已经掌握`mapState`了，那么其他类似的函数也可以很容易地理解

`mapGetters`和`mapState`函数基本相同

开始定义了`res`来保存结果集用于返回，通过`isValidMap`来对映射进行验证

然后通过`normalizeMap`来遍历`key-val`值，不同点在于

对于`getter`的获取，是在`store.getters`上进行查找的，`getter`的名字需要结合命名空间名，也就是对应`val = namespace + val`这句

这里依然判断了该命名空间的模块是否存在，但是其实不用使用到这个模块，进一步判断了对应的名字是否在`store.getters`中

最后通过直接取值并返回`store.getters[val]`

注意在`mapGetters`中是不能使用函数作为属性的，因为源码上并没有实现这样的功能

## `mapMutations`

```javascript
export const mapMutations = normalizeNamespace((namespace, mutations) => {
  const res = {};
  if (__DEV__ && !isValidMap(mutations)) {
    console.error(
      "[vuex] mapMutations: mapper parameter must be either an Array or an Object"
    );
  }
  normalizeMap(mutations).forEach(({ key, val }) => {
    res[key] = function mappedMutation(...args) {
      // Get the commit method from store
      let commit = this.$store.commit;
      if (namespace) {
        const module = getModuleByNamespace(
          this.$store,
          "mapMutations",
          namespace
        );
        if (!module) {
          return;
        }
        commit = module.context.commit;
      }
      return typeof val === "function"
        ? val.apply(this, [commit].concat(args))
        : commit.apply(this.$store, [val].concat(args));
    };
  });
  return res;
});
```

`mapMutations`支持属性值为函数的情况，这时第一个参数为该命名空间下的`commit`函数

如果不是函数，那么直接`commit`掉传入的属性值，以及附带的参数。

注意`mapMutations`是展开到组件的`method`下的，而不是`computed`下

## `mapActions`

```javascript
export const mapActions = normalizeNamespace((namespace, actions) => {
  const res = {};
  if (__DEV__ && !isValidMap(actions)) {
    console.error(
      "[vuex] mapActions: mapper parameter must be either an Array or an Object"
    );
  }
  normalizeMap(actions).forEach(({ key, val }) => {
    res[key] = function mappedAction(...args) {
      // get dispatch function from store
      let dispatch = this.$store.dispatch;
      if (namespace) {
        const module = getModuleByNamespace(
          this.$store,
          "mapActions",
          namespace
        );
        if (!module) {
          return;
        }
        dispatch = module.context.dispatch;
      }
      return typeof val === "function"
        ? val.apply(this, [dispatch].concat(args))
        : dispatch.apply(this.$store, [val].concat(args));
    };
  });
  return res;
});
```

`mapActions`和`mapMutations`基本逻辑一模一样，不同点为使用`dispatch`进行分发而不是使用`commit`

注意`mapActions`是展开到组件的`method`下的，而不是`computed`下

## `createNamespacedHelpers`

```javascript
export const createNamespacedHelpers = (namespace) => ({
  mapState: mapState.bind(null, namespace),
  mapGetters: mapGetters.bind(null, namespace),
  mapMutations: mapMutations.bind(null, namespace),
  mapActions: mapActions.bind(null, namespace),
});
```

这个函数实现非常简单，返回一个对象，对象上就是四个`mapXXX`的方法

只不过这四个方法，通过`bind`绑定了第一个参数（第一个参数为传入的`namespace`）

## `normalizeMap`

```javascript
function normalizeMap(map) {
  if (!isValidMap(map)) {
    return [];
  }
  return Array.isArray(map)
    ? map.map((key) => ({ key, val: key }))
    : Object.keys(map).map((key) => ({ key, val: map[key] }));
}
```

对于映射，在`mapXXX`的 API 中，可以传入一个对象，也可以传入一个字符数组

这个函数统一的转换成一个对象数组，对象中包含`key`和`val`键，用来表明需要映射的状态`val`和映射到组件中的名字`key`，比如

```javascript
// 下面这种情况对应需要映射的属性名和映射到组件中的属性名是一样的
normalizeMap(["name", "age"]); // [ { key: 'name', val: 'name' }, { key: 'age', val: 'age' } ]

// 下面这种就可以自定义映射到组件中的属性名
normalizeMap({ myName: "name", myAge: "age" }); // [ { key: 'myName', val: 'name' }, { key: 'myAge', val: 'age' } ]
```

## `isValidMap`

```javascript
function isValidMap(map) {
  return Array.isArray(map) || isObject(map);
}
```

如果是从上面看下来的话，那么这个函数被使用在哪个地方应该非常的明朗

这个函数在`mapXXX`函数上，基本上在第一行就使用到，用来校验第二个参数为一个`Array`或者一个`Object`

使用了内置对象`Array`的`isArray`和工具函数`isObject`来进行验证。

## `normalizeNamespace`

```javascript
function normalizeNamespace(fn) {
  return (namespace, map) => {
    if (typeof namespace !== "string") {
      map = namespace;
      namespace = "";
    } else if (namespace.charAt(namespace.length - 1) !== "/") {
      namespace += "/";
    }
    return fn(namespace, map);
  };
}
```

在每个`mapXXX`的函数，都会通过这个函数进行包装

这个函数的开头，有一段注释

```text
/**
 * Return a function expect two param contains namespace and map.
 * it will normalize the namespace and then
 * the param's function will handle the new namespace and the map.
 */
```

大意就是返回一个接收`namespace`和`map`的一个函数

这个函数会标准化命名空间参数`namespace`，使得传入的函数可以处理新的命名空间`namespace`和一个映射对象 map

大白话就是包装一个函数，添加了一段对参数的逻辑判断 🤣

在 Vuex 中，如果是嵌套比较深的模块，那么如果使用`mapXXX`这类函数传参会比较的**丑**

比如现在有一个`store`，如下（已经注册到`Vue`中，注意这里开启了命名空间）

```javascript
const store = createStore({
  modules: {
    m1: {
      namespaced: true,
      modules: {
        m2: {
          namespaced: true,
          modules: {
            m3: {
              namespaced: true,
              state: {
                name: "lwf",
                age: 22,
              },
            },
          },
        },
      },
    },
  },
});
```

现在我们想把模块`m3`的`state`映射到组件中，可能会这样写（这时无法直接传入单个数组进行映射了，这种传法只对根模块有效）

```javascript
import { mapState } from "vuex";
export default {
  name: "Test",
  computed: {
    ...mapState({
      name: (state) => state.m1.m2.m3.name,
      age: (state) => state.m1.m2.m3.age,
    }),
  },
  mounted() {
    console.log(this.name);
    console.log(this.age);
  },
};
```

可以发现配置属性的函数时，要重复编写`state.m1.m2.m3`，还是**丑**

所以可以使用两个参数的情况，如下

```javascript
import { mapState } from "vuex";
export default {
  name: "Test",
  computed: {
    ...mapState("m1/m2/m3", ["name", "age"]),
  },
  mounted() {
    console.log(this.name);
    console.log(this.age);
  },
};
```

第一个参数指定命名空间，第二个参数指定该空间下的状态名数组

回到`normalizeNamespace`函数，只有一段`if-elseif`的逻辑

```javascript
if (typeof namespace !== "string") {
  map = namespace;
  namespace = "";
} else if (namespace.charAt(namespace.length - 1) !== "/") {
  namespace += "/";
}
```

如果第一个参数传的不是字符串，那么也就是只传一个映射`map`而已，

如果第一个参数传的是字符串且它的最后一个字符不是`/`的话，加上一个斜杠，这个处理主要是为了用户考虑吧我感觉

对于一般人说，对嵌套模块的书写是`m1/m2/m3`，而不是`m1/m2/m3/`

但是 Vuex 对命名空间模块的注册（在`_modulesNamespaceMap`上注册，使用了第二种方式）

所以这里`Vuex`对于传入命名，可以第一种写法也可以第二种，因为第一种会自动的加上`/`，第二个判断的作用就是如此

而且从这里也可以理解，为什么可以传一个数组默认就是取根模块的状态，因为直接传入一个数组，此时的`namespace`就是空字符串

而空字符是假值，在`mapState`中不会去查找对应模块，而是直接使用根模块的`state`来取值

## `getModuleByNamespace`

```javascript
function getModuleByNamespace(store, helper, namespace) {
  const module = store._modulesNamespaceMap[namespace];
  if (__DEV__ && !module) {
    console.error(
      `[vuex] module namespace not found in ${helper}(): ${namespace}`
    );
  }
  return module;
}
```

根据命名空间来获取对应的`Module`对象，此时`helper`（值为`mapState`，`mapGetters`，`mapMutations`，`mapActions`这其中的一个）只用于生成一个报错字符串的而已

# 后记

每天进步一点点~

<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=330 height=86 src="//music.163.com/outchain/player?type=2&id=461301621&auto=0&height=66"></iframe>
