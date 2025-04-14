---
title: >-
  记录 uniapp 微信小程序获取定位流程
tags:
  - uniapp
  - 微信
  - JavaScript
categories:
  - 编程
date: 2024-12-06 10:38:07
updated: 2024-12-12 21:42:32
key: 1733452687
---





# 前言

记录 uniapp 微信小程序获取定位流程。

<!-- more -->

# 正文

之前做过一个基于 uniapp 的小程序，当时需要通过定位来获取用户的位置，从而来计算用户所需的运费。

## 检测 GPS 开关

在手机中，一般都会有一个 GPS 开关，比如我的小米手机是如下这样的：

{% hexoimg 1.77778 https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/12/12/20241212151209412.avif %}

这个开关决定了所有的应用是否能够使用定位，所以最开始，我们要检测这个开关是否开启了。

在 uniapp 中，有两个可以获取该开关的接口，分别是

- [uni.getSystemInfo](https://uniapp.dcloud.net.cn/api/system/info.html)
- [uni.getSystemSetting](https://uniapp.dcloud.net.cn/api/system/getsystemsetting.html)

第一个 API 里面提示说不推荐使用，所以我们用第二个。

PS：这两个 API 分别对应微信的 [wx.getSystemInfo](https://developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.getSystemInfo.html) 和 [wx.getSystemSetting](https://developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.getSystemSetting.html) 。在微信的 [wx.getSystemInfo](https://developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.getSystemInfo.html) 文档中，有下面这段提示：

> 从基础库 2.20.1 开始，本接口停止维护，请使用 wx.getSystemSetting、wx.getAppAuthorizeSetting、wx.getDeviceInfo、wx.getWindowInfo、wx.getAppBaseInfo 代替

所以在 uniapp 这边我们用 [uni.getSystemSetting](https://uniapp.dcloud.net.cn/api/system/getsystemsetting.html) 就行了，不过我看文档这个接口只有微信和 APP 支持，但是我在支付宝小程序的文档上发现了相似的接口 [my.getSystemSetting](https://opendocs.alipay.com/mini/071crr?pathHash=5da23380)，也有这个返回字段，就挺奇怪的😫。

相关代码如下：

```javascript
const { locationEnabled } = uni.getSystemSetting()
```

## 检测 APP 是否有定位权限

在开启了 GPS 开关之后，我们还要检测微信是否有获取 GPS 的权限，在我的小米中是如下这样的：

{% hexoimg 1.77778 https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/12/12/20241212155852849.avif %}

这里的话我们要使用 [uni.getAppAuthorizeSetting](https://uniapp.dcloud.net.cn/api/system/getappauthorizesetting.html) 接口。这个接口返回了 `locationAuthorized` ，它可以判断微信是否拥有定位权限，代码如下：

```javascript
const { locationAuthorized } = uni.getAppAuthorizeSetting();
if (locationAuthorized === "authorized") {
  // 微信已有定位权限
} else if (locationAuthorized === "denied") {
  // 没有权限，需要引导用户
} else if (locationAuthorized === "not determined") {
  // 未请求过该权限
} else if (locationAuthorized === "config error") {
  // 只在 APP 端返回，主要是 APP 开发的时候没有授予相关权限问题。
  // Android平台：表示没有授予 android.permission.ACCESS_COARSE_LOCATION 权限
  // iOS平台：表示没有在 manifest.json -> App模块配置 中配置 Geolocation(定位) 模块
  // 这里我们只针对微信小程序，所以可以不用管这个分支判断。
}
```

## 检测小程序是否有定位权限

在每个小程序中，都有可以设置是否开启定位权限，比如这里我们拿 BOSS 直聘的小程序，进入小程序后点击右上角的三个点，然后点击设置，出现如下页面：

{% hexoimg 1.77778 https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/12/12/20241212161825534.avif %}

这里的位置信息就两个选项，一个是关闭，一个是使用小程序时，所以我们要检测的就是小程序的这个选项是不是为“使用小程序时”，这里要使用 [uni.getSetting](https://uniapp.dcloud.net.cn/api/other/setting.html#getsetting) 接口。这个接口返回了 `authSetting` 对象，这个对象包含了 [scope](https://uniapp.dcloud.net.cn/api/other/authorize.html#scope-%E5%88%97%E8%A1%A8) 的信息，其中 `scope.userLocation` 就是我们需要的值，代码如下：

```javascript
const { authSetting } = await uni.getSetting();

if (authSetting["scope.userLocation"]) {
  // 小程序已获取定位权限
}
```

其他的 scope 值可以在上面的链接查看，每个 scope 都会对应某个接口，比如这里的 `scope.userLocation` ，它对应了 [uni.getLocation](https://uniapp.dcloud.net.cn/api/location/location#getlocation) 和 [uni.chooseLocation](https://uniapp.dcloud.net.cn/api/location/location#chooselocation) 接口，这两个接口就是最后我们获取位置信息的。

## 获取定位信息

在上面的权限全部都符合之后，我们就可以调用 [uni.getLocation](https://uniapp.dcloud.net.cn/api/location/location#getlocation) 来获取当前位置，如果想要别的位置的信息，可以配合 [uni.chooseLocation](https://uniapp.dcloud.net.cn/api/location/location#chooselocation) 来实现。

使用 [uni.getLocation](https://uniapp.dcloud.net.cn/api/location/location#getlocation) 的代码如下：

```javascript
const { 
  latitude, // 维度
  longitude // 经度
} = await uni.getLocation({
  type: "gcj02",
});
```

这里我们用的是 gcj02 的坐标，它和 wgs84 的区别为（摘自 GPT ）：

### WGS-84（World Geodetic System 1984）

#### 定义
- WGS-84 是一种全球性的地理坐标系，由美国国防部制定，用于 GPS（全球定位系统）。
- 它是一个国际通用的地理参考坐标系。

#### 特点
- 使用地球的椭球体模型描述位置。
- 坐标值是全球统一的，没有针对任何国家或地区的调整。
- 常用于国际场景，例如 GPS 设备、Google Earth 等。

#### 应用场景
- GPS 系统
- 国际地图服务
- 卫星导航与定位

### GCJ-02（国测局坐标系）

#### 定义
- GCJ-02 是一种中国国家地理信息系统使用的地理坐标系，由中国国家测绘局开发。
- 它在 WGS-84 基础上进行了加密处理。

#### 特点
- 引入了偏移算法，对 WGS-84 坐标进行一定的随机偏移，以实现加密效果。
- 偏移算法是非线性的，且只有中国政府拥有其完整实现。
- 偏移的目的是为了国家地理信息安全。
- 在中国大陆范围内，WGS-84 坐标会偏离真实位置，偏移量随地理位置变化。

#### 应用场景
- 高德地图、腾讯地图、百度地图（部分基于 GCJ-02）等国内主要地图服务。
- 适用于中国大陆范围的地理位置标注。

---

简单点讲就是国内就用 gcj02 ，国外就用 wgs84 。 

如果不想使用当前的位置，而是手动定位一个位置的话，可以再调用 [uni.chooseLocation](https://uniapp.dcloud.net.cn/api/location/location#chooselocation) ，代码如下：

```javascript
const location = await uni.getLocation({
  type: "gcj02",
});
const { latitude, longitude } = await uni.chooseLocation({
  latitude: location.latitude,
  longitude: location.longitude,
});
```

这在微信中会弹出一个微信自带的地图定位选取页面，如下：

{% hexoimg 1.77778 https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/12/12/20241212194001795.avif %}

## 缺失权限时的引导

如果用户缺失了某些权限，我们希望能够对用户进行引导，比如提示一段文字，或者如果可以的话，我们可以定位到相应的页面让用户开启某些权限。

### 缺失全局的 GPS 权限

这种我们只能弹出一个模态框来提示用户开启，模态框可以用 [uni.showModal](https://uniapp.dcloud.net.cn/api/ui/prompt.html#showmodal) 来创建，相关代码如下：

```javascript
uni.showModal({
  title: "提示",
  content: "请先打开 GPS 开关",
  // 不显示取消按钮
  showCancel: false,
  success() {
    // 做一些事情
  },
});
```

这里也可以包在 Promise 中，用起来更加简洁：

```javascript
await new Promise((resolve) => {
  uni.showModal({
    title: "提示",
    content: "请先打开 GPS 开关",
    // 不显示取消按钮
    showCancel: false,
    success() {
      resolve();
    },
  });
})
```

### 微信缺失定位权限

这里我们可以使用 [uni.showModal](https://uniapp.dcloud.net.cn/api/ui/prompt.html#showmodal) 配合 [uni.openAppAuthorizeSetting](https://uniapp.dcloud.net.cn/api/system/openappauthorizesetting.html#openappauthorizesetting) 来让用户进入微信的设置页，代码如下：

```javascript
const confirm = await new Promise<boolean>((resolve, reject) => {
  uni.showModal({
    title: "提示",
    content: "请将定位权限授权给微信",
    confirmText: "前往设置",
    success(res) {
      // res.confirm 为 true 表示用户点了确定按钮
      resolve(res.confirm);
    },
    fail(err) {
      reject(err);
    },
  });
});
if (confirm) {
  // 打开微信设置页
  await uni.openAppAuthorizeSetting();
} else {
  throw new Error("用户取消给与微信定位权限");
}
```

### 小程序缺失定位权限

这里我们可以使用 [uni.showModal](https://uniapp.dcloud.net.cn/api/ui/prompt.html#showmodal) 配合 [uni.openSetting](https://uniapp.dcloud.net.cn/api/other/setting.html#opensetting) 来让用户进入微信的设置页，代码如下：

```javascript
const confirm = await new Promise<boolean>((resolve, reject) => {
  uni.showModal({
    title: "提示",
    content: "请将定位权限授权给微信",
    confirmText: "前往设置",
    success(res) {
      // res.confirm 为 true 表示用户点了确定按钮
      resolve(res.confirm);
    },
    fail(err) {
      reject(err);
    },
  });
});
if (confirm) {
  // 打开微信小程序设置页
  const authSetting = await uni.openSetting();
  // 这里可以根据 authSetting 来判断用户是否更新了相关的权限
} else {
  throw new Error("用户取消给与小程序定位权限");
}
```

# 后记

当然每个项目需要的定位引导的需求都是不一样，比如我做的那个项目，在用户没有小程序权限时，会引导用户进入小程序的设置页，当从设置页退出的时候，会重新检测一次是否开启，如果没开启，会提示用户功能受限。

当然万变不离其宗，都是上面这些函数组合来组合去而已，熟悉这些步骤后只需要组合即可。