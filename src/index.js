/*
 * @Description: 入口页
 * @Author: wish.WuJunLong
 * @Date: 2021-05-06 10:36:06
 * @LastEditTime: 2021-07-13 09:06:36
 * @LastEditors: wish.WuJunLong
 */
import React from "react";
import ReactDOM from "react-dom";
import "./global.scss";
import App from "./App";

import moment from "moment";
import "moment/locale/zh-cn";

import axios from "./api/api";

React.Component.prototype.$moment = moment;

// 拆分地址栏参数
React.$filterUrlParams = (val) => {
  if (val) {
    let str = val.replace("?", "");
    let arr = str.split("&");
    let obj = {};
    arr.forEach((e) => {
      let key = e.split("=");
      obj[key[0]] = key[1];
    });
    return obj;
  }
};

//根据身份证，计算年龄
React.$getAge = (identityCard) => {
  let len = (identityCard + "").length;
  if (len === 0) {
    return 0;
  } else {
    if (len !== 15 && len !== 18) {
      return 0;
    }
  }
  let strBirthday = "";
  let sex = "";
  if (len === 18) {
    strBirthday =
      identityCard.substr(6, 4) +
      "-" +
      identityCard.substr(10, 2) +
      "-" +
      identityCard.substr(12, 2);
    sex = identityCard.substr(16, 1) % 2 === 1 ? "男" : "女";
  }
  if (len === 15) {
    strBirthday =
      "19" +
      identityCard.substr(6, 2) +
      "-" +
      identityCard.substr(8, 2) +
      "-" +
      identityCard.substr(10, 2);
  }

  let birthDate = new Date(strBirthday);
  let nowDateTime = new Date();
  let age = nowDateTime.getFullYear() - birthDate.getFullYear();
  if (
    nowDateTime.getMonth() < birthDate.getMonth() ||
    (nowDateTime.getMonth() === birthDate.getMonth() &&
      nowDateTime.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return { age, strBirthday, sex };
};

// 判断url地址是否带有 session 参数
// if (
//   React.$filterUrlParams(window.location.search) &&
//   React.$filterUrlParams(window.location.search).ssotoken === "logout"
// ) {
  // 如果 session 值为 logout 则遍历所有cookie并删除
  // let cookieData = Cookie.get();
  // console.log(cookieData);
  // for (let i in cookieData) {
  //   console.log(i);
  //   Cookie.remove(i);
  // }
//   localStorage.removeItem("ssotoken");
// } else if (
//   React.$filterUrlParams(window.location.search) &&
//   React.$filterUrlParams(window.location.search).ssotoken !== "logout"
// ) {
  // 如果 session 有值 则base64解密 并转义为对象 经行遍历添加cookie
  // let url = React.$filterUrlParams(window.location.search).ssotoken;
  // console.log(url);
  // localStorage.setItem("ssotoken", url);
  // let urlData = JSON.parse(Base64.decode(url));
  // let urlData = JSON.parse(url);
  // for (let i in urlData) {
  //   console.log(i, urlData[i]);
  //   Cookie.set(i, urlData[i]);
  // }
// }

if (!React.Component.prototype.$parentUrl) {
  React.Component.prototype.$parentUrl = document.referrer;
}

axios.defaults.headers.common["ssotoken"] = localStorage.getItem("ssotoken") || "";
React.Component.prototype.$axios = axios;

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("yunShangApp")
);
