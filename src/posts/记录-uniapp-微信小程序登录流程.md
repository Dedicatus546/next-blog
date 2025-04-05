---
title: >-
  记录 uniapp 微信小程序登录流程
tags:
  - uniapp
  - 微信
  - JavaScript
categories:
  - 编程
date: 2024-12-06 00:04:31
updated: 2024-12-06 00:04:31
key: 1733414672
---


# 前言

记录 uniapp 微信小程序登录流程。

<!-- more -->

# 正文

之前做过一个基于 uniapp 的小程序，当时需要通过微信绑定的手机号来串联登录流程，在此做一个记录。

本文基于微信绑定的手机号来做唯一 ID ，非 `openid` 。

首先，每个微信小程序都会有一个 `appid` 和 `appsecret` 。登录微信公众平台，选择小程序登录后即可看到，比如我微信账号的小程序测试号：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/12/05/20241205224625331.avif)

这两个东西都不放在前端代码中，特别是 `appsecret` ，后面的接口是要根据该字段来验证权限的。

## 前端获取 code

前端首先通过 `uni.login` 来获取 code ，这个 API 在微信平台上的接口为 `wx.login` 。这个 code 后面要用到。

```javascript
const getCode = async () => {
  const { code } = await uni.login({});
  return code;
}
```

## 后端获取 openid 

这一步要用到上一步的 `code` 。

后端调用微信的接口：[GET https://api.weixin.qq.com/sns/jscode2session](https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html)，这个接口需要 `appid` 和 `appsecret` 和上一步的 `code` 。

然后我们可以得到 `openid` ，还有 `unionid` 等信息。这里我们只要 `openid` 。

## 后端获取 accessToken 

这一步获取 `accessToken` ，后面的流程需要用到。

后端调用微信的接口：[GET https://api.weixin.qq.com/cgi-bin/token](https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/mp-access-token/getAccessToken.html)，这个接口需要 `appid` 和 `appsecret` 。

## 前端获取 phoneCode 

这一步也是获取一个 `code` ，不过这个 `code` 是来获取手机信息的，这里就叫成 `phoneCode` 。

在微信的文档中，有两种获取该 `phoneCode` 的方式，区别为得到的手机号是否实时验证。

- [手机号快速验证组件](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/getPhoneNumber.html)
- [手机号实时验证组件](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/getRealtimePhoneNumber.html)

在之前的项目中，我们用的是第一个。在文档中我们需要按如下来触发获取 `phoneCode` 。

```html
<button 
  open-type="getPhoneNumber" 
  bindgetphonenumber="getPhoneNumber"
>
  获取手机号
</button>
```

点击这个按钮就会弹出一个手机号码选择框：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/12/06/20241206000223469.avif)

这里可以根据 UI 来改为不同的触发形式，不一定是点击文字，你也可以在内部显示一个图片等等，把这里的 `button` 当成一个 `view` 就行，不过注意要清除 `button` 的默认样式：

```css
.clearButtonStyle {
  padding: 0;
  margin: 0;
  border: none;
  appearance: none;
}

/* 去掉 button 的边框 */
.clearButtonStyle::after {
  border: none;
}
```

然后我们在 `getPhoneNumber` 函数的内部就可以获取到 `phoneCode` ：

```javascript
const getPhoneNumber = (e) => {
  if (e.detail.errMsg === "getPhoneNumber:ok") {
    // 这里就获取到了 phoneCode 了。
    const phoneCode = e.detail.code;
  } else {
    // 可以做提示
  }
}
```

## 后端获取手机号

根据前面获取的参数，在这一步我们就可以获取用户选择的手机号。

后端调用微信的接口：[POST https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=ACCESS_TOKEN](https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-info/phone-number/getPhoneNumber.html)，这个接口需要 `openid` ， `accessToken` 和上一步的 `phoneCode` 。

在返回的参数中就能得到明文手机号：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/12/05/20241205234222302.avif)

接着就是用这个手机号验证用户是否存在，存在就下发一个 token ，不存在就用这个手机号创建一个用户，然后一样下发 token 。

# 后记

最后总结一下流程，起点为通过 `button` 的 `getPhoneNumber` 方法：

```javascript
const getPhoneNumber = async (e) => {
  if (e.detail.errMsg === "getPhoneNumber:ok") {
    const { code } = await uni.login({});
    const phoneCode = e.detail.code;
    // loginByWXApi 这个为后端的接口，非微信接口。
    const { token, userInfo } = await loginByWXApi(code, phoneCode);
  } else {
    // 可以做提示
  }
}
```

然后后端的流程（这里以 js 代码为例）：

```javascript
const appid = "xxx";
const appsecret = "xxx";

const loginByWXApi = async (code, phoneCode) => {
  // 获取 openid
  const { openid } = await fetch(`https://api.weixin.qq.com/sns/jscode2session?grant_type=authorization_code&appid=${appid}&secret=${appsecret}&js_code=${code}`).then(resp => resp.json());
  // 获取 accessToken 
  const { access_token } = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${appsecret}`).then(resp => resp.json());
  // 获取手机号
  const { phone_info } = await fetch(`https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${access_token}`, {
    methods: "POST",
    body: JSON.stringify({
      code: phoneCode,
      openid,
    })
  }).then(resp => resp.json());
  const { purePhoneNumber } = phone_info;
  // 获取手机号后的流程...

  return {
    token: "xxx"
    userInfo: "xxx"
  }
}
```