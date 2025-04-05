---
title: 记一次对StarUML-3.2.2的解包  
key: 1591924668date: 2020-06-12 09:17:48  
updated: 2023-02-13 18:28:45
tags:
- JavaScript
categories:
- 编程
---


# 前言

感觉很久没写帖子了…  
老是把上学期的实训还没有做完当借口感觉也不是很行  
索性就随便写写吧  
（项目还没有做完，cao！）

<!-- more -->

# 准备

上系统分析与设计的课需要用到一个StartUML的软件  
虽然老师已经提供了完整的工具了  
但是人嘛，总是喜新厌旧的  
不是最新版这手就不舒服…  
直接上官网下载了最新版的  
高高兴兴的替换  
What the f**k？ 直接黑屏

不行，上网找找看看有没有新的解决方法  
emmm，找了一会，找到了好东西

> 吾爱论坛的一个帖子: [另一种 StarUML 3.x 完美**的思路](https://www.52pojie.cn/thread-796683-1-1.html)

感觉能行，~~是我最擅长的js~~
直接开搞

> StartXML官网：[StarUML 3](http://staruml.io/)

这次使用的版本为最新版，版本号为3.2.2  
除此之外需要node环境，需要npm的一个asar的一个包  
这个就不细讲，因为我也不懂emmm…

# 过程

看完吾爱那个帖子还是蛮吃惊的  
这应用好像是Electron的…  
简单讲就是套了个谷歌浏览器的桌面应用

ok那开始，先把最新的app.asar文件解包出来  
`asar extract app.asar app`  
extract解包，app.asar为需要解包的文件 app为解包的目录

解包出来  
emmm，挺熟悉的…

![](https://i.loli.net/2020/03/05/LsURBaNWz4lFMgb.png)

马不停蹄，直接奔着`about-dialog.js`文件去  
在`src/dialogs`文件下  
在这个文件下的`showDialog`函数下果然找到了这一段代码

![](https://i.loli.net/2020/03/05/L4WdDYT1XAPgHFq.png)

这段代码判断根据凭证管理器返回的状态来给模态框设置内容

```javascript
if (app.licenseManager.getStatus() === true) {
    // ...
} else {
    // ...
}
```

所以现在首要的是找到app这个变量  
这个变量有着licenseManager的实例  
ctrl这个变量发现有两处存在这个变量  
分别是`src/main-process/application.js`和 `src/index.js`下

其中`application.js`文件的代码段为

![](https://i.loli.net/2020/03/05/S5toYwOJPWmjNXc.png)

metadataManager？  
很明显不是我们的licenseManager  
直接不管  
看`src/index.js`文件

![](https://i.loli.net/2020/03/05/f1OrbdWgNDUnIBT.png)

`new AppContxt()` 按照字面意思应该是app的上下文  
应该是这个不会错  
点进去发现是一个类  
`ctrl+f`搜索licenseManager  
果然在38行发现了引入的凭证管理器

![](https://i.loli.net/2020/03/05/vgUYwrQ2OIaMjxd.png)

ok定位到`src/enginer/license-manager.js`这个文件  
继续`ctrl+f`搜索getStatus  
找到代码，是LicenseManager的一个方法  
这个方法返回了一个定义在文件中的变量`status`

![](https://i.loli.net/2020/03/05/1A7zcp9NBlyXdEL.png)

根据前面我们知道，当status为`true`，就会往模态框渲染已注册的内容了  
所以继续搜索status  
发现一个`setStatus`函数  
这个函数不在类中  
（截图好累，直接贴代码吧….）

```javascript
/**
 * Set Registration Status
 * This function is out of LicenseManager class for the security reason
 * (To disable changing License status by API)
 * @private
 * @param {boolean} newStat
 * @return {string}
 */
function setStatus(licenseManager, newStat) {
    if (status !== newStat) {
        status = newStat
        licenseManager.emit('statusChanged', newStat)
    }
}
```

注释也给出了没写在类方法中的原因

> To disable changing License status by API  
> 译过来就是：防止通过api的方式去改变凭证

也就是不想让license管理器对象直接设置status状态  
这也反过来证明这个status状态确实决定注册的状态  
（有点心虚的味道…）

这里还可以发现设置状态会广播一个`statusChanged`的事件
`licenseManager.emit('statusChanged', newStat)`
状态根据传进来的newStat决定

接下来看到底谁调用了`setStatus`这个函数了  
搜索发现`checkLicenseValidity`函数和`register`函数都调用了

怎么有两个函数调用…  
看了看方法，找到猫腻  
类中有一个方法`appReady`  
代码是这样的

```javascript
class LicenseManager extends EventEmitter {

    // ...  

    appReady() {
        this.checkLicenseValidity()
    }
}
```

看方法名就知道了，在应用准备的时候调用这个函数  
那八九不离十是`checkLicenseValidity`这个函数了  
而且`register`函数的注释也让我更加确定

> Check the license key in server and store it as license.key file in local
> 通过服务器检查凭证并将它以license.key文件进行储存

不难分析，刚安装的软件肯定是没有注册的   
需要通过键入密钥来激活  
也就是这几种情况

* 开启app - 有本地文件 - 进行检验 - 显示检验状态
* 开启app - 没有本地文件 - 显示未注册
* 开启app - 没有本地文件 - 输入密钥 - 成功 - 生成文件方便下次启动的验证

当然我们手头是没有密钥的，所以`register`函数关系不大  
目的是在启动检测的时候假装存在检验文件， 并检测成功

观察`checkLicenseValidity`函数，它调用了`validate`函数进行验证  
但是`validate`函数其实已经不重要了  
为啥呢？  
因为`validate`函数没有调用`setStatus`这个函数了  
也就是注册状态的变化和`validate`函数块无关了  
跟`validate`函数执行的对应回调有关  
也就是`checkLicenseValidity`函数中的代码

```javascript
class LicenseManager extends EventEmitter {

    // ...  

    checkLicenseValidity() {
        this.validate().then(() => {
            setStatus(this, true)
        }, () => {
            setStatus(this, false)
            UnregisteredDialog.showDialog()
        })
    }
}
```

这里可以看到成功就设置状态为true  
失败设置状态为false并展示一个未注册的展示框

OK大体上摸清楚了  
只要把代码这个函数的代码改为

```javascript
class LicenseManager extends EventEmitter {

    // ...  

    checkLicenseValidity() {
        this.validate().then(() => {
            setStatus(this, true)
        }, () => {
            // 失败也设置未注册成功
            setStatus(this, true)
            // 失败不展示失败的模态框
            // UnregisteredDialog.showDialog()
        })
    }
}
```

其实大部分工作都已经完成了  
接下来回到最开始的if判断

```javascript
if (app.licenseManager.getStatus() === true) {
    var info = app.licenseManager.getLicenseInfo();
    var licenseTypeName = 'Unknown';
    switch (info.licenseType) {
        case 'PS':
            licenseTypeName = 'Personal';
            break;
        case 'CO':
            licenseTypeName = 'Commercial';
            break;
        case 'ED':
            licenseTypeName = 'Educational';
            break;
        case 'CR':
            licenseTypeName = 'Classroom';
            break;
    }
    $license.html('Licensed to ' + info.name);
    $licenseType.html(licenseTypeName + ' License');
    $quantity.html(info.quantity + ' User(s)');
} else {
    $license.html('UNREGISTERED');
}
```

判断成功后会获取凭证的信息  
在LicenseManager类中也可以找到这个方法  
也就是只要构造出符合结构的对象就可以了  
也可以直接在方法体里面改  
我的话通过返回的对象来改  
也就是

```javascript
class LicenseManager extends EventEmitter {

    // ...  

    getLicenseInfo() {
        // 不返回lincenseInfo了
        return licenseInfo
        //这里获取密钥所包含的信息，具体可以看validate函数，里面有对密钥的解析，也就是json格式
        return {
            name: "17软件工程",
            product: "系统分析与设计",
            licenseType: "PS",
            quantity: "INDEX",
            timestamp: "1583395020",
            licenseKey: "仅供学习，请勿用于商业用途",
            crackedAuthor: "Dedicatus545"
        };
    }
}
```

到这里其实基本就完成了  
最后就是重新打包这个文件  
`asar pack app app.asar`  
替换之后就完成了

附上一张截图

![](https://i.loli.net/2020/03/05/3uXfOKYQwC59s6r.png)

仅供学习使用，请勿使用于商业用途。

    