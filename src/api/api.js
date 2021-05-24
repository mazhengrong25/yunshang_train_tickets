/*
 * @Description: axios封装
 * @Author: wish.WuJunLong
 * @Date: 2021-05-12 10:51:06
 * @LastEditTime: 2021-05-12 16:20:43
 * @LastEditors: wish.WuJunLong
 */

import axios from "axios";

// 创建axios实例
const service = axios.create({
  // baseURL: process.env.BASE_API,
  // timeout: 5000, // 请求的超时时间
  headers: {
    // Cookie:
    //   "id=5ee83502207c8338fe1c9907; name=junlong; email=wishtime1024%40gmail.com; loginCount=43; remember_web_dis_user_59ba36addc2b2f9401580f014c7f58ea4e30989d=eyJpdiI6IjQwQ1VjYktHWUgxZTFBWmJRYkdWXC9RPT0iLCJ2YWx1ZSI6IjRsN0JWYWJSRUdjUG00YXRWVktnK3EwT2RrQ3hZKzZsWkxDZDQyWUxrbU1FVzQyRmh0bFRWd2pyZlQ4dHVmTnpJUEUrVE9xMUV2dlkyZ0kzSFpGbEE3NnRPMG5YUVwvRGFRdjBvdytHckVTMU84STJ3UTNvRDM1STg3bG9BM2E0anNtWTh2WXo5QStpRkg2Y3ByeTR2amc9PSIsIm1hYyI6IjE3ZjJjZTJjYzA5OWEwZWEwNDBiODVkOTk4YTQ4OTUyMTY0ZGVmZjI1Mzk0OTRhYTM0OTgyOTA3NjM2ODVhYzIifQ%3D%3D; connect.sid=s%3AEDsUP2_W49bZuvVnACVghERtzlm41pqG.A0pw1nNlRK8h6p6m0TYCAsRfB%2FAxUf%2FzvJ1fHuoHpUQ; ysb2b_session=15Ao92U7AAV0JeUbQitDdOeH2iisqW7EgZg3Nhf8",
  },
  crossDomain: true,
  withCredentials: true, // 允许携带cookie
});

// 发送请求前处理request的数据
axios.defaults.transformRequest = [
  function (data) {
    let newData = "";
    for (let k in data) {
      newData += encodeURIComponent(k) + "=" + encodeURIComponent(data[k]) + "&";
    }
    return newData;
  },
];

// request拦截器
service.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    // 错误处理代码

    return Promise.reject(error);
  }
);

// response拦截器
service.interceptors.response.use(
  (response) => {
    return response.data;
  },

  (error) => {
    if (error && error.response) {
      switch (error.response.status) {
        case 400:
          error.message = "请求错误";
          break;
        case 401:
          error.message = "未授权访问";
          break;
        default:
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default service;
