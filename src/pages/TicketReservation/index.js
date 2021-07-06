/*
 * @Description: 火车票预定页面
 * @Author: wish.WuJunLong
 * @Date: 2021-05-12 16:21:59
 * @LastEditTime: 2021-07-06 11:02:31
 * @LastEditors: wish.WuJunLong
 */

import React, { Component } from "react";

import {
  Input,
  Checkbox,
  Button,
  Modal,
  Select,
  Table,
  message,
  Pagination,
  Radio,
  Switch,
  Spin,
  Popover,
} from "antd";

import ViaStopPopover from "../../components/viaStopPopover"; // 经停站组件

import TripIcon from "../../static/trip_icon.png"; // 行程icon
import AddPassengerIcon from "../../static/add_passenger_btn.png"; // 添加乘客图标
import RemoveBtnIcon from "../../static/remove_btn.png"; // 删除按钮
import InsuranceIcon from "../../static/insurance_icon.png"; // 保险图标
import WarningIcon from "../../static/warn_icon.png"; // 警告图标

import PassengerRemark from "../../static/ADT_name_icon.png"; // 乘客备注

import OccupySeatModal from "../../components/occupySeatModal"; // 占座弹窗

import { Base64 } from "js-base64";

import "./TicketReservation.scss";

const { Option } = Select;
const { Column } = Table;

let child;

const newPassenger = {
  // 成人数据
  type: "ADT",
  name: "", // 姓名
  cert_no: "", // 证件号
  card_name: "", // 证件名字
  cert_type: "身份证", // 证件类型
  id: "", // 乘客ID
  phone: "", // 手机号
  choose_seat: "", // 选座内容
  verify_status: 0, // 待核验
};
const newChild = {
  // 儿童数据
  type: "CHD",
  name: "",
  year: null,
  month: null,
  day: null,
};

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ticketMessage: {}, // 车次信息

      reservationMessage: {}, // 预定信息

      viaStopPopover: "", // 经停站信息弹窗
      viaStopData: [], // 经停站数据

      passengerModal: false, // 乘客弹窗
      passengerList: [], // 乘客列表

      passengerSearch: {
        // 常用乘客列表筛选条件
        page: 1,
        limit: 10,
        name: "",
        group_id: "",
      },

      groupList: [], // 分组列表

      selectedRowKeys: [], // 乘客表格选中列表
      checkedPassenger: [newPassenger], // 乘车乘客列表

      standing: true, // 是否接受站票

      contactMessage: {
        // 联系人信息
        name: "",
        phone: "",
        mail: "",
      },

      passengerCheckStatus: false, // 校验乘客
      createOrderStatus: false, // 创建订单

      isPassengerCheck: false, // 乘机人核验弹窗
      isPassengerCheckStatus: false, // 核验状态
      isPassengerCheckMessage: {}, // 核验人数据

      insuranceList: [], // 保险列表
      selectInsurance: "", // 已选择保险ID
      insuranceMessage: {}, // 保险信息

      submitStatus: false, // 订单信息提交

      // 占座中弹窗
      isOccupyNo: "",
      isOccupyModal: false,
      isOccupyStatus: 0,
    };
  }

  async componentDidMount() {
    await this.setState({
      ticketMessage: React.$filterUrlParams(decodeURI(this.props.location.search)),
    });
    await this.getReservationData();
    this.getChildDate();
  }

  // 获取预定信息
  getReservationData() {
    let data = {
      key: this.state.ticketMessage.k,
    };

    this.$axios.post("/train/check", data).then((res) => {
      if (res.code === 0) {
        if (!res.data) {
          return message.warning("数据过期，返回列表页重新选择坐席");
        }
        let newData = res.data;
        newData["key"] = 0;
        for (let k in newData.seat) {
          if (newData.seat[k].code === this.state.ticketMessage.c) {
            newData.seat = newData.seat[k];
            break;
          }
        }
        console.log(newData);

        let contact = {
          name: newData.dis_msg.role_name || "",
          phone: newData.dis_msg.phone || "",
          mail: newData.dis_msg.mail || "",
        };

        this.setState({
          reservationMessage: newData,
          contactMessage: contact,
        });
      } else {
        message.warning(res.msg);
      }
    });
  }

  // 获取经停站信息
  openViaStopMessage = () => {
    this.setState({
      viaStopPopover: 0,
      viaStopData: [],
    });
    let data = {
      departure: this.state.reservationMessage.station.departure_name, //类型：String  必有字段  备注：出发站点
      arrive: this.state.reservationMessage.station.arrive_name, //类型：String  必有字段  备注：到达站
      ticket: "ADT", //类型：String  必有字段  备注：票类型
      departure_date: this.$moment(
        this.state.reservationMessage.train.departure_date
      ).format("YYYY-MM-DD"), //类型：String  必有字段  备注：出发日期
      code: this.state.reservationMessage.train.code, //类型：String  必有字段  备注：车次
      number: this.state.reservationMessage.train.number, //类型：String  必有字段  备注：列车号
    };

    this.$axios.post("/train/station", data).then((res) => {
      if (res.code === 0) {
        this.setState({
          viaStopPopover: 0,
          viaStopData: res.data,
        });
      } else {
        this.setState({
          viaStopPopover: "",
          viaStopData: [],
        });
        message.warning("经停信息获取失败：" + res.msg);
      }
    });
  };

  // 关闭经停站信息弹窗并中断请求
  closeViaStopPopover = () => {
    this.setState({
      viaStopPopover: "",
      viaStopData: [],
    });
  };

  // 打开常用乘客弹窗
  async openPassengerModal() {
    await this.getGroupList();
    await this.getPassengerList();
    // sessionStorage.setItem("passenger", JSON.stringify(this.state.checkedPassenger));
    await this.setState({
      passengerModal: true,
      selectedRowKeys: this.state.checkedPassenger,
    });
  }

  // 获取常用乘客列表
  getPassengerList() {
    let data = this.state.passengerSearch;
    data["passenger_type"] = "ADT";
    this.$axios.post("/train/passenger/list", data).then((res) => {
      if (res.errorcode === 10000) {
        this.setState({
          passengerList: res.data,
        });
        // this.editPassengerData();
      } else {
        message.warning(res.msg);
      }
    });
  }

  // 组装选中乘客信息
  editPassengerData() {
    let thisList = this.state.passengerList.data; // 乘客列表
    let checkList = sessionStorage.getItem("passenger")
      ? JSON.parse(sessionStorage.getItem("passenger"))
      : [];
    let modalList = this.state.selectedRowKeys; // 选中乘客列表

    if (checkList.length < 1) {
      return false;
    }
    thisList.forEach((item) => {
      checkList.forEach((oitem, oindex) => {
        if (item.name === oitem.name && item.cert_no === oitem.cert_no) {
          checkList[oindex] = item;
        }
      });
    });

    console.log([...new Set(modalList.concat(checkList))]);
    sessionStorage.setItem("passenger", JSON.stringify(checkList));
    this.setState({
      selectedRowKeys: [...new Set(modalList.concat(checkList))],
    });
  }

  // 常用乘客筛选
  changePassengerSearch = (label, val) => {
    let data = this.state.passengerSearch;
    if (label === "name") {
      data["name"] = val.target.value;
    } else if (label === "group_id") {
      data["group_id"] = val;
    }
    this.setState({
      passengerSearch: data,
    });
  };

  // 获取分组列表
  getGroupList() {
    let data = {
      limit: 999,
    };
    this.$axios.post("/train/pasgroup/list", data).then((res) => {
      if (res.errorcode === 10000) {
        this.setState({
          groupList: res.data.data,
        });
      } else {
        message.warning(res.msg);
      }
    });
  }

  // 乘客信息核验
  passengerVerify(val, type) {
    if (!val.name || !val.cert_no) {
      return message.warning("请选择信息完整的乘客进行核验");
    }
    // 判断乘客是否已经经行校验
    if (type) {
      // 已校验 直接打开弹窗
      val["is_passenger_list"] = true;
      this.setState({
        isPassengerCheck: true,
        isPassengerCheckMessage: val,
        isPassengerCheckStatus: false,
      });
    } else {
      // 未校验 进行校验步骤
      if (React.$getAge(val.cert_no).age < 14) {
        console.log(val);
        return false;
      }
      val["type"] = "ADT";
      this.setState({
        isPassengerCheckStatus: true,
        isPassengerCheck: true,
        isPassengerCheckMessage: val,
      });

      this.passengerCheckData([val]).then((res) => {
        if (res.code === 0) {
          let data = this.state.checkedPassenger;
          data.forEach((item) => {
            if (item.name === this.state.isPassengerCheckMessage.name) {
              item.verify_status = 1;
            }
          });
          console.log(data);
          this.setState({
            checkedPassenger: data,
          });
          this.setState({
            isPassengerCheckStatus: false,
            isPassengerCheck: false,
            isPassengerCheckMessage: {},
          });
          this.getPassengerList();

          message.success(res.data);
        } else {
          val["status"] = res.data.status;
          val["captcha"] = res.data.captcha;
          this.setState({
            isPassengerCheckMessage: val,
            isPassengerCheckStatus: false,
          });
        }
      });
    }

    console.log(val);
  }

  // 重新查询核验信息
  reloadVerify() {
    this.setState({
      isPassengerCheckStatus: true,
    });
    this.passengerCheckData([this.state.isPassengerCheckMessage]).then((res) => {
      if (res.code === 0) {
        this.getPassengerList();
        if (this.state.isPassengerCheckMessage.is_passenger_list) {
          let data = this.state.checkedPassenger;
          for (let i = 0; i < data.length; i++) {
            if (data[i] === this.state.isPassengerCheckMessage.name) {
              return data[i].verify_status === 1;
            }
          }
          console.log(data);
          this.setState({
            checkedPassenger: data,
          });
        }
        this.setState({
          isPassengerCheckStatus: false,
          isPassengerCheck: false,
          isPassengerCheckMessage: {},
        });
      } else {
        this.setState({
          isPassengerCheckStatus: false,
          isPassengerCheckMessage: res.data,
        });
      }
    });

    // let newData = {
    //   channel: "Di", //类型：String  必有字段  备注：渠道
    //   source: "Yunkun", //类型：String  必有字段  备注：数据源
    //   passenger: [
    //     {
    //       phone: this.state.isPassengerCheckMessage.phone, //类型：String  必有字段  备注：手机
    //       card_no: this.state.isPassengerCheckMessage.cert_no, //类型：String  必有字段  备注：证件号
    //       name: this.state.isPassengerCheckMessage.name, //类型：String  必有字段  备注：姓名
    //     },
    //   ],
    // };
    // this.$axios.post("/train/passenger/verf", newData).then((res) => {
    //   if (res.code === 0) {
    //     this.setState({
    //       isPassengerCheckStatus: false,
    //       isPassengerCheck: false,
    //       isPassengerCheckMessage: {},
    //     });
    //     this.getPassengerList();
    //     if (this.state.isPassengerCheckMessage.is_passenger_list) {
    //       let data = this.state.checkedPassenger;
    //       for (let i = 0; i < data.length; i++) {
    //         if (data[i] === this.state.isPassengerCheckMessage.name) {
    //           return data[i].verify_status === 1;
    //         }
    //       }
    //       console.log(data);
    //       this.setState({
    //         checkedPassenger: data,
    //       });
    //     }
    //   }
    // });
  }

  // 乘客列表分页
  changePassengerList = async (page, pageSize) => {
    let data = this.state.passengerSearch;
    data["page"] = page;
    data["limit"] = pageSize;

    await this.setState({
      passengerSearch: data,
    });
    await this.getPassengerList();
  };

  // 存储选中乘客
  saveTablePassenger() {
    let thisPassengerList = this.state.checkedPassenger.concat(
      this.state.selectedRowKeys
    );

    thisPassengerList.forEach((item, index) => {
      if (!item.name && !item.card_no) {
        thisPassengerList.splice(index, 1);
      }
    });
    thisPassengerList.forEach((item) => {
      if (React.$getAge(item.cert_no).age >= 14) {
        item["type"] = "ADT";
        item["choose_seat"] = "";
      } else {
        item["type"] = "CHD";
        item["year"] = this.$moment(React.$getAge(item.cert_no).strBirthday).format(
          "YYYY"
        );
        item["month"] = this.$moment(React.$getAge(item.cert_no).strBirthday).format(
          "MM"
        );
        item["day"] = this.$moment(React.$getAge(item.cert_no).strBirthday).format("DD");
      }
    });
    let newItem;
    if (thisPassengerList[0].type !== "ADT") {
      for (let i = 0; i < thisPassengerList.length; i++) {
        if (thisPassengerList[i].type === "ADT") {
          newItem = thisPassengerList[i];
          thisPassengerList.splice(i, 1);
          break;
        }
      }
      thisPassengerList.unshift(newItem);
    }

    let oneByADT = false;
    for (let i = 0; i < thisPassengerList.length; i++) {
      if (thisPassengerList[i] && thisPassengerList[i]["type"] === "ADT") {
        oneByADT = true;
        break;
      }
    }
    console.log(oneByADT);
    if (!oneByADT) {
      return message.warning("请至少选择一个成人");
    }

    this.setState({
      checkedPassenger: thisPassengerList,
      passengerModal: false,
    });
  }

  // 增加页面乘客按钮
  addPassenger() {
    let data = this.state.checkedPassenger;
    if (data.length >= 5) {
      return message.warning("当前订单最多支持五名乘客预定");
    }
    let adtData = [];
    let chdData = [];
    data.forEach((item) => {
      if (item.type === "ADT") {
        adtData.push(item);
      } else {
        chdData.push(item);
      }
    });
    adtData.push(newPassenger);
    let newData = adtData.concat(chdData);
    this.setState({
      checkedPassenger: newData,
    });
  }

  // 增加同行儿童
  addChild(val) {
    let data = this.state.checkedPassenger;
    if (data.length >= 5) {
      return message.warning("当前订单最多支持五名乘客预定");
    }
    // data.splice(val + 1, 0, newChild);
    data.push(newChild);
    this.setState({
      checkedPassenger: data,
    });
  }

  // 获取儿童出生日期列表
  getChildDate() {
    let dataList = [];
    for (let i = 0; i < 18; i++) {
      dataList.push(this.$moment().subtract(i, "years").format("YYYY"));
    }
    return dataList || [];
  }

  // 获取儿童出生日期月份天数
  getMonthDays(val) {
    let days = [];
    if (val.year && val.month) {
      console.log(`${val.year}-${val.month}`);
      let daysNumber = this.$moment(`${val.year}-${val.month}`, "YYYY-MM").daysInMonth();
      for (let i = 1; i <= daysNumber; i++) {
        days.push(i < 10 ? `0${i}` : String(i));
      }
    }

    return days;
  }

  // 儿童出生日期选择
  changeChildAge = (index, type, val) => {
    let data = JSON.parse(JSON.stringify(this.state.checkedPassenger));
    data[index][type] = val;
    if (type === "year" && !val) {
      data[index]["year"] = null;
      data[index]["month"] = null;
      data[index]["day"] = null;
    } else if (type === "month" && !val) {
      data[index]["day"] = null;
    }

    console.log(data);
    this.setState({
      checkedPassenger: data,
    });
  };

  // 删除乘客按钮
  removeThisPassenger(val) {
    let data = JSON.parse(JSON.stringify(this.state.checkedPassenger));

    data[val]["remove"] = true;
    let thisNumber = val + 1;
    for (let i = 0; i < data.length; i++) {
      if (thisNumber <= i && data[thisNumber].type !== "ADT") {
        data[i]["remove"] = true;
        thisNumber += 1;
      } else if (thisNumber <= i && data[thisNumber].type === "ADT") {
        break;
      }
    }

    let newData = [];
    data.forEach((item) => {
      if (!item.remove) {
        newData.push(item);
      }
    });

    if (newData.length < 1) {
      newData = [newPassenger];
    }
    console.log(data);
    this.setState({
      checkedPassenger: newData,
    });
  }

  // 修改页面乘客数据
  editPassenger = (index, type, val) => {
    let data = JSON.parse(JSON.stringify(this.state.checkedPassenger));
    data[index][type] = val.target.value;
    this.setState({
      checkedPassenger: data,
    });
  };

  // 修改选座信息
  editSeatStatus = (index, val) => {
    let data = JSON.parse(JSON.stringify(this.state.checkedPassenger));
    console.log(data[index]["choose_seat"], val.target.value);
    data[index]["choose_seat"] =
      data[index]["choose_seat"] === val.target.value ? "" : val.target.value;
    console.log(data[index]["choose_seat"]);
    this.setState({
      checkedPassenger: data,
    });
  };

  // 修改是否接受站票状态
  editStandingStatus = (val) => {
    this.setState({
      standing: val.target.checked,
    });
  };

  // 已选座位人数
  selectSeatNumber() {
    let number = 0;
    let data = JSON.parse(JSON.stringify(this.state.checkedPassenger));
    data.forEach((item) => {
      if (item.choose_seat) {
        number += 1;
      }
    });

    return number;
  }

  // 联系人信息修改
  editContactMessage = (label, val) => {
    let data = this.state.contactMessage;
    data[label] = val.target.value;
    this.setState({
      contactMessage: data,
    });
  };

  // 创建订单 / 核验乘客信息
  createOrder() {
    let data = this.state.checkedPassenger;
    let contact = this.state.contactMessage;

    // let checkStatus = false;

    for (let i = 0; i < data.length; i++) {
      if (!data[i].name || !data[i].cert_no || !data[i].phone) {
        return message.warning("请完善乘客信息后创建订单");
      }
    }

    if (!contact.name || !contact.phone) {
      return message.warning("请完善联系人信息后创建订单");
    }

    let newData = [];
    for (let i = 0; i < data.length; i++) {
      data[i]["insurance"] = true;
      if (data[i].type === "ADT" && (data[i].name || data[i].cert_no)) {
        newData.push(data[i]);
      } else if (data[i].type === "CHD" && data[i].name) {
        newData.push(data[i]);
      }
    }

    let isPassengerStatus = false;
    for (let i = 0; i < newData.length; i++) {
      if (newData[i].verify_status !== 1) {
        isPassengerStatus = true;
        break;
      }
    }

    // 判断乘客列表是否有未核验人员
    if (isPassengerStatus) {
      // 未核验，经行核验操作
      this.setState({
        passengerCheckStatus: true,
      });

      // 提取未核验人员
      let checkPassenger = [];
      for (let i = 0; i < newData.length; i++) {
        if (newData[i].verify_status !== 1) {
          checkPassenger.push(newData[i]);
        }
      }

      message.info("乘客信息校验中，请稍等");

      this.passengerCheckData(checkPassenger).then((res) => {
        this.setState({
          passengerCheckStatus: false,
        });
        if (res.code === 0) {
          message.success(res.data);
          this.getInsuranceList();

          this.setState({
            checkedPassenger: newData,
            createOrderStatus: true,
          });
        } else {
          message.warning(`${res.msg}：${res.data.name} ${res.data.status}`);
          let verifyData;
          for (let i = 0; i < checkPassenger.length; i++) {
            if (checkPassenger[i].name === res.data.name) {
              verifyData = checkPassenger[i];
              break;
            }
          }
          verifyData["status"] = res.data.status;
          verifyData["captcha"] = res.data.captcha;
          this.passengerVerify(verifyData, true);
        }
      });
    } else {
      // 已核验，直接进入下一步
      this.getInsuranceList();
      this.setState({
        checkedPassenger: newData,
        createOrderStatus: true,
      });
    }
  }

  // 乘客核验
  passengerCheckData(data) {
    let checkData;
    let checkList = [];
    data.forEach((item) => {
      if (item.type === "ADT") {
        checkList.push({
          name: item.name, //类型：String  必有字段  备注：姓名
          card_no: item.cert_no, //类型：String  必有字段  备注：证件号
          card_type: 1, //类型：Number  必有字段  备注：证件类型
          card_name: "中国居民身份证", //类型：String  必有字段  备注：证件名字
          phone: item.phone, //类型：String  必有字段  备注：无
          ticket_type: 1, //类型：Number  必有字段  备注：票类型
        });
      }
    });

    checkData = {
      channel: "Di", //类型：String  必有字段  备注：渠道
      source: "YunKu", //类型：String  必有字段  备注：来源
      passenger: checkList,
    };

    return this.$axios.post("train/passenger/check", checkData).then((res) => {
      return res;
    });
  }

  // 获取保险列表
  getInsuranceList() {
    let data = {
      is_train: 1,
    };
    this.$axios.get("/train/insurance/list", { params: data }).then((res) => {
      if (res.errorcode === 10000) {
        let thisId = "";
        if (res.data.length > 0) {
          this.setState({
            insuranceMessage: res.data[0],
          });
          thisId = res.data[0].id;
        }
        this.setState({
          insuranceList: res.data,
          selectInsurance: thisId,
        });
      } else {
        message.warning(res.msg);
      }
    });
  }

  // 选择保险
  changeInsurance = (val) => {
    this.state.insuranceList.forEach((item) => {
      if (item.id === val) {
        this.setState({
          insuranceMessage: item,
        });
      }
    });
    this.setState({
      selectInsurance: val,
    });
  };

  // 开关乘客保险
  switchInsurance = (index, val) => {
    console.log(index, val);
    let data = JSON.parse(JSON.stringify(this.state.checkedPassenger));
    data[index]["insurance"] = val;
    this.setState({
      checkedPassenger: data,
    });
  };

  // 金额计算
  totalPriceData() {
    let price = this.state.reservationMessage.seat
      ? this.state.reservationMessage.seat.price
      : 0; // 票价
    let insurancePrice = this.state.insuranceMessage.default_dis_price
      ? this.state.insuranceMessage.default_dis_price
      : 0; // 保险价格
    let atdInsNumber = 0; // 成人保险人数
    let chdInsNumber = 0; // 儿童保险人数
    let total = 0; // 总价
    let adtNumber = 0; // 成人数量
    let chdNumber = 0; // 儿童数量
    let adtPrice = 0; // 成人总价
    let chdPrice = 0; // 儿童总价
    this.state.checkedPassenger.forEach((item) => {
      if (item.type === "ADT") {
        adtNumber += 1;
        if (item.insurance) {
          atdInsNumber += 1;
        }
      } else if (item.type === "CHD") {
        chdNumber += 1;
        if (item.insurance) {
          chdInsNumber += 1;
        }
      }
    });
    adtPrice = adtNumber * price + atdInsNumber * insurancePrice;
    chdPrice = chdNumber * (price / 2) + chdInsNumber * insurancePrice;

    total = adtPrice + chdPrice;
    return {
      total,
      adtNumber,
      chdNumber,
      adtPrice,
      chdPrice,
      atdInsNumber,
      chdInsNumber,
    };
  }

  // 提交订单
  submitOrder() {
    this.setState({
      submitStatus: true,
    });
    let passengerList = [];
    console.log(this.state.checkedPassenger);
    this.state.checkedPassenger.forEach((item) => {
      passengerList.push({
        //类型：Object  必有字段  备注：无
        name: item.name, //类型：String  必有字段  备注：姓名
        card_no: item.cert_no, //类型：String  必有字段  备注：证件号
        card_name: item.cert_type, //类型：String  必有字段  备注：证件名字
        card_type: item.cert_type === "身份证" ? "1" : "", //类型：String  必有字段  备注：证件类型
        id: item.id || 0, //类型：String  必有字段  备注：乘客ID
        seat_name: this.state.reservationMessage.seat.name, //类型：String  必有字段  备注：座位名字
        seat_code: this.state.reservationMessage.seat.code, //类型：String  必有字段  备注：座位代码
        price: this.state.reservationMessage.seat.price, //类型：String  必有字段  备注：座位价格
        ticket_type: item.type === "ADT" ? "1" : item.type === "CHD" ? "2" : "", //类型：String  必有字段  备注：票类型
        phone: item.phone, //类型：String  必有字段  备注：手机号
        is_insurance: item.insurance ? 1 : 0, //类型：Number  必有字段  备注：是否购买保险
        school: {
          //类型：Object  可有字段  备注：学校信息，默认为空。如果是学生票则必须
          // province_name: "", //类型：String  可有字段  备注：省份，可为空
          // province_code: "", //类型：String  可有字段  备注：省份代码，可为空
          // code: "", //类型：String  必有字段  备注：学校代码
          // name: "", //类型：String  必有字段  备注：学校名字
          // student_no: "", //类型：String  必有字段  备注：学号
          // system: "", //类型：String  必有字段  备注：学制
          // enter_year: "", //类型：String  必有字段  备注：如学年份
        },
        passport: {
          //类型：Object  可有字段  备注：护照信息，如果是护照则必须
          expired: "2030-01-01", //类型：String  必有字段  备注：过期时间
          birthday: React.$getAge(item.cert_no).strBirthday, //类型：String  必有字段  备注：生日
          sex: React.$getAge(item.cert_no).sex === "男" ? "M" : "F", //类型：String  必有字段  备注：性别
          country: "CN", //类型：String  必有字段  备注：国家代码
        },
      });
    });
    let data = {
      source: "YunKu", // 数据源
      insurance_id: Number(this.state.selectInsurance), // 保险ID
      order: {
        standing: this.state.standing, //类型：Boolean  必有字段  备注：是否接受站票，默认否
        is_choose_seat: false, //类型：Boolean  必有字段  备注：是否选座，默认否
        choose_seat: "", //类型：String  必有字段  备注：选座内容
      },
      train: {
        //类型：Object  必有字段  备注：车次信息
        departure: this.state.reservationMessage.station.departure_name, //类型：String  必有字段  备注：出发地
        arrive: this.state.reservationMessage.station.arrive_name, //类型：String  必有字段  备注：到达地
        departure_code: this.state.reservationMessage.station.departure_code, //类型：String  必有字段  备注：出发地code
        arrive_code: this.state.reservationMessage.station.arrive_code, //类型：String  必有字段  备注：到达地code
        code: this.state.reservationMessage.train.code, //类型：String  必有字段  备注：车次
        number: this.state.reservationMessage.train.number,
        departure_date: `${this.$moment(
          this.state.reservationMessage.train.departure_date
        ).format("YYYY-MM-DD")} ${this.state.reservationMessage.train.departure}`, //类型：String  必有字段  备注：出发日期
        arrive_date: `${this.$moment(this.state.reservationMessage.train.departure_date)
          .add(this.state.reservationMessage.train.days, "days")
          .format("YYYY-MM-DD")} ${this.state.reservationMessage.train.arrive}`, //类型：String  必有字段  备注：到达日期
        seat_number: "", //类型：String  必有字段  备注：座位号
        travel_time: this.state.reservationMessage.train.run_minute, //类型：String  必有字段  备注：行程时长
        seat: this.state.reservationMessage.seat.name, //类型：String  必有字段  备注：座位等级中文
        seat_level: this.state.reservationMessage.seat.code, //类型：String  必有字段  备注：座位等级
        train_level: this.state.reservationMessage.train.type, //类型：String  必有字段  备注：火车类型
      },
      passenger: passengerList,
    };

    console.log(data);

    this.$axios.post("/train/order/reserve", data).then((res) => {
      this.setState({
        submitStatus: false,
      });
      if (res.code === 0) {
        // this.props.history.push({ pathname: "/orderDetail/" + res.data.order.order_no });
        this.openOccupy(res.data.order.order_no);
      } else {
        message.warning(res.msg || "订单创建失败，请重试");
      }
    });
  }

  // 占座成功
  orderSuccess = () => {
    window.location.href = `${this.$parentUrl}pay/${Base64.encode(
      this.state.isOccupyNo
    )}`;
  };

  onRef(ref) {
    child = ref;
  }

  // 打开占座弹窗
  async openOccupy(val) {
    await this.setState({
      isOccupyNo: val,
      isOccupyModal: true,
      isOccupyStatus: Math.floor(Math.random() * 100) + 150,
    });
    await child.startTime();
  }

  // 跳转详情
  closeOccupy = () => {
    this.props.history.push({ pathname: "/orderDetail/" + this.state.isOccupyNo })
  }
  // 重选车次
  jumpOccupy = () => {
    this.props.history.goBack()
  }

  render() {
    const rowSelection = {
      hideSelectAll: true,
      preserveSelectedRowKeys: true,
      onChange: (selectedRowKeys, selectedRows) => {
        // console.log(selectedRowKeys)
        // if(selectedRows.length >= 5){
        //   return message.warning('当前订单最多支持五名乘客预定')
        // }
        this.setState({
          selectedRowKeys: selectedRows,
        });
      },
      // onSelect: (record, selected, selectedRows, nativeEvent) => {
      //   console.log(record, selected, selectedRows, nativeEvent)
      //   if(selectedRows.length >= 5){
      //     return message.warning('当前订单最多支持五名乘客预定')
      //   }
      //   this.setState({
      //     selectedRowKeys: selectedRows,
      //   });
      // },
    };
    return (
      <div className="ticket_reservation">
        {/* 车次信息 */}
        <div className="ticket_card ticket_info">
          <div className="title">
            <p className="title_name">车次信息</p>
            <div className="title_option"></div>
          </div>

          <div className="info_main">
            <div className="info_box">
              <div className="box_number">
                {this.state.reservationMessage.train
                  ? this.state.reservationMessage.train.code
                  : ""}
              </div>

              <div className="box_stop">
                <ViaStopPopover
                  data={this.state.reservationMessage}
                  popoverStatus={this.state.viaStopPopover}
                  popoverData={this.state.viaStopData}
                  popoverPosition="bottomLeft"
                  close={this.closeViaStopPopover}
                  open={this.openViaStopMessage}
                ></ViaStopPopover>
              </div>
            </div>

            <div className="info_time">
              {this.$moment(
                this.state.reservationMessage.train
                  ? this.state.reservationMessage.train.departure_date
                  : ""
              ).format("YYYY-MM-DD")}
              &nbsp; (
              {this.$moment(
                this.state.reservationMessage.train
                  ? this.state.reservationMessage.train.departure_date
                  : ""
              ).format("ddd")}
              )
            </div>

            <div className="info_message">
              <div className="message_address">
                <span
                  style={{
                    background:
                      (this.state.reservationMessage.station
                        ? this.state.reservationMessage.station.start
                        : 0) ===
                      (this.state.reservationMessage.station
                        ? this.state.reservationMessage.station.departure_name
                        : 1)
                        ? "#F89292"
                        : "#85CD83",
                  }}
                >
                  {(this.state.reservationMessage.station
                    ? this.state.reservationMessage.station.start
                    : 0) ===
                  (this.state.reservationMessage.station
                    ? this.state.reservationMessage.station.departure_name
                    : 1)
                    ? "始"
                    : "过"}
                </span>
                {this.state.reservationMessage.train
                  ? this.state.reservationMessage.train.departure
                  : ""}
                <p>
                  {this.state.reservationMessage.station
                    ? this.state.reservationMessage.station.departure_name
                    : ""}
                </p>
              </div>

              <img src={TripIcon} alt="行程图标"></img>

              <div className="message_address">
                <span
                  style={{
                    background:
                      (this.state.reservationMessage.station
                        ? this.state.reservationMessage.station.end
                        : 0) ===
                      (this.state.reservationMessage.station
                        ? this.state.reservationMessage.station.arrive_name
                        : 1)
                        ? "#1E8BF9"
                        : "#85CD83",
                  }}
                >
                  {(this.state.reservationMessage.station
                    ? this.state.reservationMessage.station.end
                    : 0) ===
                  (this.state.reservationMessage.station
                    ? this.state.reservationMessage.station.arrive_name
                    : 1)
                    ? "终"
                    : "过"}
                </span>
                {this.state.reservationMessage.train
                  ? this.state.reservationMessage.train.arrive
                  : ""}
                <p>
                  {this.state.reservationMessage.station
                    ? this.state.reservationMessage.station.arrive_name
                    : ""}
                </p>
              </div>
            </div>

            <div className="info_date">
              行程：
              {`${
                this.state.reservationMessage.train
                  ? Math.floor(
                      Number(this.state.reservationMessage.train.run_minute) / 60
                    )
                  : 0
              }小时${
                this.state.reservationMessage.train
                  ? Math.floor(
                      Number(this.state.reservationMessage.train.run_minute) % 60
                    )
                  : 0
              }分`}
            </div>

            <div className="info_price">
              <span>
                {this.state.reservationMessage.seat
                  ? this.state.reservationMessage.seat.name
                  : ""}
              </span>
              &yen;
              {this.state.reservationMessage.seat
                ? this.state.reservationMessage.seat.price
                : ""}
            </div>
          </div>
        </div>
        {/* 乘客信息 */}
        {this.state.createOrderStatus ? (
          // 确认信息状态 / 选择保险
          <div className="ticket_card passenger_box">
            <div className="title">
              <p className="title_name">乘客信息</p>
            </div>

            <div className="passenger_main create_order">
              {this.state.checkedPassenger.map((item, index) => (
                <div className="main_list" key={index}>
                  {item.type === "ADT" ? (
                    <>
                      <div className="list_type">成</div>

                      <div className="list_item">
                        <div className="item_title">姓名</div>
                        <div className="item_input">{item.name}</div>
                      </div>

                      <div className="list_item">
                        <div className="item_title">{item.cert_type}</div>
                        <div className="item_input">{item.cert_no}</div>
                      </div>

                      <div className="list_item">
                        <div className="item_title">手机号</div>
                        <div className="item_input">{item.phone}</div>
                      </div>
                      <div className="list_item">
                        <div className="item_title">保险</div>
                        <div className="item_input">
                          <Switch
                            checkedChildren="是"
                            unCheckedChildren="否"
                            onChange={this.switchInsurance.bind(this, index)}
                            checked={item.insurance}
                          />
                        </div>
                      </div>
                    </>
                  ) : item.type === "CHD" ? (
                    <>
                      <div className="list_type">童</div>

                      <div className="list_item">
                        <div className="item_title">姓名</div>
                        <div className="item_input">{item.name}</div>
                      </div>

                      <div className="list_item">
                        <div className="item_title">出生日期</div>
                        <div className="item_input">
                          {item.year}-{item.month}-{item.day}
                        </div>
                      </div>
                      <div className="list_item">
                        <div className="item_title">保险</div>
                        <div className="item_input">
                          <Switch
                            checkedChildren="是"
                            unCheckedChildren="否"
                            onChange={this.switchInsurance.bind(this, index)}
                            checked={item.insurance}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    ""
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // 初始状态 / 添加删除乘客
          <div className="ticket_card passenger_box">
            <div className="title">
              <p className="title_name">乘客信息</p>
              <div className="title_option">
                <Button
                  className="open_passenger_btn"
                  onClick={() => this.openPassengerModal()}
                >
                  <img src={AddPassengerIcon} alt="打开乘客弹窗"></img>
                </Button>

                <Modal
                  title={false}
                  visible={this.state.passengerModal}
                  getContainer={false}
                  centered={true}
                  width={712}
                  wrapClassName="passenger_modal"
                  onCancel={() => this.setState({ passengerModal: false })}
                  onOk={() => this.saveTablePassenger()}
                >
                  <div className="modal_title">常用乘客</div>

                  <div className="modal_main">
                    <div className="modal_search_box">
                      <div className="search_box_list">
                        <div className="list_title">姓名</div>
                        <div className="list_input">
                          <Input
                            placeholder="请输入"
                            onChange={this.changePassengerSearch.bind(this, "name")}
                            value={this.state.passengerSearch.name}
                            allowClear
                          ></Input>
                        </div>
                      </div>

                      <div className="search_box_list">
                        <div className="list_title">分组</div>
                        <div className="list_input">
                          <Select
                            placeholder="请选择"
                            onChange={this.changePassengerSearch.bind(this, "group_id")}
                            value={this.state.passengerSearch.group_id}
                            allowClear
                          >
                            {this.state.groupList.map((item, index) => (
                              <Option key={index} value={item.id}>
                                {item.group_name}
                              </Option>
                            ))}
                          </Select>
                        </div>
                      </div>

                      <Button
                        className="search_box_btn"
                        type="primary"
                        onClick={() => this.getPassengerList()}
                      >
                        搜索
                      </Button>
                    </div>

                    <div className="modal_table">
                      <Table
                        dataSource={this.state.passengerList.data || []}
                        pagination={false}
                        rowKey="id"
                        size="small"
                        bordered
                        rowSelection={rowSelection}
                      >
                        <Column
                          title="姓名"
                          dataIndex="name"
                          render={(text, render) => {
                            return (
                              text || render.en_first_name + "/" + render.en_last_name
                            );
                          }}
                        />
                        <Column
                          title="证件"
                          dataIndex="cert_type"
                          render={(text) => {
                            return text ? text : "--";
                          }}
                        />
                        <Column
                          title="证件号"
                          dataIndex="cert_no"
                          render={(text) => {
                            return text ? text : "--";
                          }}
                        />
                        <Column
                          title="手机号"
                          dataIndex="phone"
                          render={(text) => {
                            return text ? text : "--";
                          }}
                        />
                        <Column
                          title="分组"
                          dataIndex="group_id"
                          render={(text) => {
                            return text
                              ? this.state.groupList.findIndex((item) => {
                                  return item.id === text;
                                })
                              : "未分组";
                          }}
                        />
                        <Column
                          title="状态"
                          dataIndex="verify_status"
                          render={(text, render) => {
                            return text === 1 ? (
                              <span>正常</span>
                            ) : (
                              <span
                                onClick={() => this.passengerVerify(render)}
                                style={{
                                  color: text !== 1 ? "#FB9826" : "#333",
                                  cursor: text !== 1 ? "pointer" : "auto",
                                }}
                              >
                                {text === 0
                                  ? "待核验"
                                  : text === 2
                                  ? "手机号/邮箱待核验"
                                  : text === -1
                                  ? "未通过"
                                  : text === -2
                                  ? "冒用"
                                  : text === -3
                                  ? "请报验"
                                  : text === -10
                                  ? "未知"
                                  : "待核验"}
                              </span>
                            );
                          }}
                        />
                      </Table>
                      <Pagination
                        onChange={this.changePassengerList}
                        size="small"
                        current={this.state.passengerList.current_page || 1}
                        total={this.state.passengerList.total || 0}
                        pageSize={this.state.passengerList.per_page || 10}
                      />
                    </div>
                  </div>
                </Modal>
              </div>
            </div>

            <div className="passenger_main">
              {this.state.checkedPassenger.map((item, index) => (
                <div className="main_list" key={index}>
                  {item.type === "ADT" ? (
                    <>
                      <div className="list_type">成</div>

                      <div className="list_item adt_name">
                        <div className="item_title">姓名</div>
                        <div className="item_input">
                          <Input
                            value={item.name}
                            placeholder="与证件一致"
                            allowClear
                            onChange={this.editPassenger.bind(this, index, "name")}
                          ></Input>
                          {item.remark ? (
                            <Popover
                              overlayClassName="passenger_remark_popover"
                              content={
                                <div className="passenger_remark">
                                  <p className="remark_title">备注</p>
                                  <p className="remark_message">{item.remark}</p>
                                  {/* <div
                                    className="remark_btn"
                                    onClick={() => message.warning("功能开发中")}
                                  >
                                    修改
                                  </div> */}
                                </div>
                              }
                            >
                              <div className="remark_icon">
                                <img src={PassengerRemark} alt="乘客备注"></img>
                              </div>
                            </Popover>
                          ) : (
                            ""
                          )}
                        </div>
                      </div>

                      <div className="list_item">
                        <div className="item_title">证件</div>
                        <div className="item_input">
                          <Select value={item.cert_type} placeholder="请选择">
                            <Option value="身份证">身份证</Option>
                          </Select>
                        </div>
                      </div>

                      <div className="list_item">
                        <div className="item_title">证件号</div>
                        <div className="item_input">
                          <Input
                            onChange={this.editPassenger.bind(this, index, "cert_no")}
                            value={item.cert_no}
                            placeholder="请输入证件号"
                            allowClear
                          ></Input>
                        </div>
                      </div>

                      <div className="list_item">
                        <div className="item_title">手机号</div>
                        <div className="item_input">
                          <Input
                            onChange={this.editPassenger.bind(this, index, "phone")}
                            value={item.phone}
                            placeholder="请输入"
                            allowClear
                          ></Input>
                        </div>
                      </div>

                      {item.verify_status !== 1 && item.name && item.cert_no ? (
                        <Button
                          className="is_verify_status"
                          type="link"
                          size="small"
                          onClick={() => this.passengerVerify(item)}
                        >
                          待核验
                        </Button>
                      ) : (
                        ""
                      )}

                      <Button className="add_child" onClick={() => this.addChild(index)}>
                        + 同行儿童
                      </Button>

                      <Button
                        className="remove_btn"
                        onClick={() => this.removeThisPassenger(index)}
                      >
                        <img src={RemoveBtnIcon} alt="删除乘客图标"></img>
                      </Button>
                    </>
                  ) : item.type === "CHD" ? (
                    <>
                      <div className="list_type">童</div>

                      <div className="list_item adt_name chd_name">
                        <div className="item_title">姓名</div>
                        <div className="item_input">
                          <Input
                            value={item.name}
                            placeholder="与证件一致"
                            allowClear
                            onChange={this.editPassenger.bind(this, index, "name")}
                          ></Input>
                        </div>
                      </div>

                      <div className="list_item">
                        <div className="item_title">出生日期</div>
                        <div className="item_input_date">
                          <Select
                            allowClear
                            placeholder="请选择"
                            value={item.year}
                            onChange={this.changeChildAge.bind(this, index, "year")}
                          >
                            {this.getChildDate().map((oitem) => (
                              <Option key={oitem} value={oitem}>
                                {oitem}
                              </Option>
                            ))}
                          </Select>
                          年
                        </div>
                        <div className="item_input_date">
                          <Select
                            allowClear
                            placeholder="请选择"
                            disabled={!item.year}
                            value={item.month}
                            onChange={this.changeChildAge.bind(this, index, "month")}
                          >
                            <Option value="01">01</Option>
                            <Option value="02">02</Option>
                            <Option value="03">03</Option>
                            <Option value="04">04</Option>
                            <Option value="05">05</Option>
                            <Option value="06">06</Option>
                            <Option value="07">07</Option>
                            <Option value="08">08</Option>
                            <Option value="09">09</Option>
                            <Option value="10">10</Option>
                            <Option value="11">11</Option>
                            <Option value="12">12</Option>
                          </Select>
                          月
                        </div>
                        <div className="item_input_date">
                          <Select
                            placeholder="请选择"
                            value={item.day}
                            disabled={!item.month}
                            allowClear
                            onChange={this.changeChildAge.bind(this, index, "day")}
                          >
                            {this.getMonthDays(item).map((oitem) => (
                              <Option value={oitem} key={oitem}>
                                {oitem}
                              </Option>
                            ))}
                          </Select>
                          日
                        </div>
                      </div>

                      <Button
                        className="remove_btn"
                        onClick={() => this.removeThisPassenger(index)}
                      >
                        <img src={RemoveBtnIcon} alt="删除乘客图标"></img>
                      </Button>
                    </>
                  ) : (
                    ""
                  )}
                </div>
              ))}

              {/* 判断乘客列表中是否含有儿童 */}
              {this.state.checkedPassenger.find((item) => {
                return item.type === "CHD";
              }) ? (
                <div className="child_info">
                  <p>儿童票说明：</p>
                  <p>
                    1.
                    每名成年乘客可免费携带一名身高不足1.2米的儿童，该儿童可不用购票及填写相关信息。携带的其他儿童身高不足1.2米也须购儿童票。
                  </p>
                  <p>
                    2.
                    身高不足1.2米的免费儿童需与成人共用一个席位，若想要单独的席位，须购儿童票。
                  </p>
                  <p>
                    3.
                    身高1.2米—1.5米儿童可购儿童票，但须跟成人票一起购买，使用同行成人证件购票并凭此证件取票。
                  </p>
                  <p>
                    4.
                    身高超1.5米的儿童须购全价票。因儿童无有效证件，此类票只能在线下售票窗口购买。
                  </p>
                  <p>
                    备注：请根据儿童实际身高购票，携程不承担因儿童身高与所购车票不符而无法进站的责任。
                  </p>
                </div>
              ) : (
                ""
              )}
            </div>

            <div className="add_passenger_box">
              <Button
                className="add_btn"
                type="primary"
                onClick={() => this.addPassenger()}
              >
                添加乘客
              </Button>
            </div>
          </div>
        )}

        {/* 在线选座 */}
        {this.state.createOrderStatus ? (
          ""
        ) : this.state.reservationMessage.train &&
          (this.state.reservationMessage.train.type === "G" ||
            this.state.reservationMessage.train.type === "D") ? (
          <div className="ticket_card cabin_info">
            <div className="title">
              <p className="title_name">在线选座</p>
              <div className="title_option">
                <Checkbox
                  onChange={this.editStandingStatus}
                  checked={this.state.standing}
                >
                  接受无座
                </Checkbox>
              </div>
            </div>

            <div className="cabin_box">
              <div className="box_title">选择座位</div>

              <div>
                {this.state.checkedPassenger.map((item, index) =>
                  item.type === "ADT" ? (
                    <div className="box_check" key={index}>
                      <div className="check_title">窗</div>
                      <Radio.Group
                        className="check_radio_box"
                        name={`radioGroup_${index}`}
                        value={item.choose_seat}
                        onChange={this.editSeatStatus.bind(this, index)}
                      >
                        <Radio.Button value="A">
                          <span className="cabin_img"></span>
                          <span className="cabin_text">A</span>
                        </Radio.Button>
                        <Radio.Button value="B">
                          <span className="cabin_img"></span>
                          <span className="cabin_text">B</span>
                        </Radio.Button>
                        <Radio.Button value="C">
                          <span className="cabin_img"></span>
                          <span className="cabin_text">C</span>
                        </Radio.Button>
                        <label className="ant-radio-button-wrapper not_radio">
                          <div className="check_title">过道</div>
                        </label>

                        <Radio.Button value="D">
                          <span className="cabin_img"></span>
                          <span className="cabin_text">D</span>
                        </Radio.Button>
                        <Radio.Button value="F">
                          <span className="cabin_img"></span>
                          <span className="cabin_text">F</span>
                        </Radio.Button>
                      </Radio.Group>

                      <div className="check_title">窗</div>
                    </div>
                  ) : (
                    ""
                  )
                )}
              </div>

              <div className="box_title">已选{this.selectSeatNumber()}人</div>
            </div>
            <div className="cabin_message">
              系统将优先为您选择所选座位，无座时将安排其它座位
            </div>
          </div>
        ) : (
          <div className="not_cabin_select">
            <img src={WarningIcon} alt="警告图标"></img>
            <span>温馨提示：</span>
            卧铺价格暂显示下铺全价，网上购票铺位随机，实际以占座后铺位价格为准，如有差价则1-3工作日原路退回
          </div>
        )}

        {/* 联系人信息 */}
        <div className="ticket_card contact_info">
          <div className="title">
            <p className="title_name">联系人信息</p>
          </div>

          {this.state.createOrderStatus ? (
            <div className="contact_box">
              <div className="box_list">
                <div className="list_title">姓名：</div>
                <div className="list_input">{this.state.contactMessage.name}</div>
              </div>

              <div className="box_list">
                <div className="list_title">手机号：</div>
                <div className="list_input">{this.state.contactMessage.phone}</div>
              </div>

              <div className="box_list">
                <div className="list_title">邮箱：</div>
                <div className="list_input">{this.state.contactMessage.mail}</div>
              </div>
            </div>
          ) : (
            <div className="contact_box">
              <div className="box_list">
                <div className="list_title">姓名</div>
                <div className="list_input">
                  <Input
                    placeholder="请输入"
                    value={this.state.contactMessage.name}
                    onChange={this.editContactMessage.bind(this, "name")}
                  ></Input>
                </div>
              </div>

              <div className="box_list">
                <div className="list_title">手机号</div>
                <div className="list_input">
                  <Input
                    placeholder="请输入"
                    value={this.state.contactMessage.phone}
                    onChange={this.editContactMessage.bind(this, "phone")}
                  ></Input>
                </div>
              </div>

              <div className="box_list">
                <div className="list_title">邮箱</div>
                <div className="list_input">
                  <Input
                    placeholder="请输入"
                    value={this.state.contactMessage.mail}
                    onChange={this.editContactMessage.bind(this, "mail")}
                  ></Input>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 保险服务 */}
        {this.state.createOrderStatus ? (
          <div className="ticket_card insurance_info">
            <div className="title">
              <p className="title_name">
                <img className="insurance_icon" src={InsuranceIcon} alt="保险图标"></img>
                保险服务
              </p>
            </div>
            <div className="insurance_box">
              <div className="box_title">选择保险</div>
              <Select value={this.state.selectInsurance} onChange={this.changeInsurance}>
                {this.state.insuranceList.map((item) => (
                  <Option value={item.id} key={item.id}>
                    {item.insure_desc}
                  </Option>
                ))}
              </Select>
              <div className="box_info">
                <span>&yen; {this.state.insuranceMessage.default_dis_price || 0}</span>
                元/人
              </div>
            </div>
          </div>
        ) : (
          ""
        )}

        {/* 订单金额 */}
        <div className="ticket_card price_info">
          <div className="title">
            <p className="title_name">订单金额</p>
          </div>

          <div className="price_main">
            <div className="price_total">
              订单总额 <span>&yen; {this.totalPriceData().total}</span>
            </div>
            <div className="main_list">
              <div className="list_type chd_type">成人票</div>
              <div className="list_price">
                <div className="price_title">票面价</div>
                <div className="price_info">
                  &yen;
                  {this.state.reservationMessage.seat
                    ? this.state.reservationMessage.seat.price
                    : 0}{" "}
                  x {this.totalPriceData().adtNumber}
                </div>
              </div>
              <div className="list_price">
                <div className="price_title">服务费</div>
                <div className="price_info">
                  &yen;
                  {0} x {this.totalPriceData().adtNumber}
                </div>
              </div>
              <div className="list_price">
                <div className="price_title">保险</div>
                <div className="price_info">
                  &yen;
                  {this.state.insuranceMessage.default_dis_price || 0} x{" "}
                  {this.totalPriceData().atdInsNumber}
                </div>
              </div>
              <div className="list_price">
                <div className="price_title">共计</div>
                <div className="price_info">
                  &yen;
                  {this.totalPriceData().adtPrice}
                </div>
              </div>
            </div>
            {this.state.checkedPassenger.find((item) => {
              return item.type === "CHD";
            }) ? (
              <div className="main_list">
                <div className="list_type">儿童票</div>
                <div className="list_price">
                  <div className="price_title">票面价</div>
                  <div className="price_info">
                    &yen;
                    {this.state.reservationMessage.seat
                      ? Number(this.state.reservationMessage.seat.price) / 2
                      : 0}{" "}
                    x {this.totalPriceData().chdNumber}
                  </div>
                </div>
                <div className="list_price">
                  <div className="price_title">服务费</div>
                  <div className="price_info">
                    &yen;
                    {0} x {this.totalPriceData().chdNumber}
                  </div>
                </div>
                <div className="list_price">
                  <div className="price_title">保险</div>
                  <div className="price_info">
                    &yen;
                    {this.state.insuranceMessage.default_dis_price || 0} x{" "}
                    {this.totalPriceData().chdInsNumber}
                  </div>
                </div>
                <div className="list_price">
                  <div className="price_title">共计</div>
                  <div className="price_info">
                    &yen;
                    {this.totalPriceData().chdPrice}
                  </div>
                </div>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>

        {/* 提交按钮 */}
        {this.state.createOrderStatus ? (
          <div className="submit_box">
            <Button
              loading={this.state.submitStatus}
              onClick={() => this.setState({ createOrderStatus: false })}
            >
              修改信息
            </Button>

            <Button
              loading={this.state.submitStatus}
              type="primary"
              onClick={() => this.submitOrder()}
            >
              {this.state.submitStatus ? "创建订单中" : "确定"}
            </Button>
          </div>
        ) : (
          <div className="submit_box">
            <Button
              loading={this.state.passengerCheckStatus}
              onClick={() => this.props.history.goBack()}
            >
              重选班次
            </Button>

            <Button
              loading={this.state.passengerCheckStatus}
              type="primary"
              onClick={() => this.createOrder()}
            >
              {this.state.passengerCheckStatus ? "校验中" : "提交订单"}
            </Button>
          </div>
        )}

        {/* 乘机人核验 */}
        <Modal
          title="乘机人核验"
          footer={false}
          width={712}
          centered
          visible={this.state.isPassengerCheck}
          wrapClassName="is_passenger_check"
          keyboard={!this.state.isPassengerCheckStatus}
          maskClosable={!this.state.isPassengerCheckStatus}
          closable={!this.state.isPassengerCheckStatus}
          onCancel={() =>
            this.setState({
              isPassengerCheck: false,
            })
          }
        >
          <div className="check_title">
            <h3>乘车人联系方式需要核验</h3>
            <p>根据铁路局规定，乘车人手机号核验通过后才可购票</p>
          </div>

          <div className="check_main">
            {this.state.isPassengerCheckStatus ? (
              <Spin tip="正在进行乘客信息核验，请稍等..."></Spin>
            ) : (
              <>
                <p>请按照以下方式进行手机核验：</p>
                <p className="passenger_info">
                  请通知乘车人<span>{this.state.isPassengerCheckMessage.name}</span>
                  ，使用手机号<span>{this.state.isPassengerCheckMessage.phone}</span>
                  ，在30分钟内短信发送以下核验码到12306
                </p>
                <p className="code">
                  核验码：
                  <span>
                    {this.state.isPassengerCheckMessage.captcha || "未获取到验证码"}
                  </span>
                  <Button
                    type="link"
                    size="small"
                    onClick={() =>
                      this.passengerVerify(this.state.isPassengerCheckMessage)
                    }
                  >
                    刷新验证码
                  </Button>
                </p>
              </>
            )}
          </div>

          <div className="check_status">
            核验状态：
            <span>
              {this.state.isPassengerCheckMessage.status
                ? this.state.isPassengerCheckMessage.status
                : this.state.isPassengerCheckMessage.verify_status === 0
                ? "待核验"
                : this.state.isPassengerCheckMessage.verify_status === 2
                ? "手机号/邮箱待核验"
                : this.state.isPassengerCheckMessage.verify_status === -1
                ? "未通过"
                : this.state.isPassengerCheckMessage.verify_status === -2
                ? "冒用"
                : this.state.isPassengerCheckMessage.verify_status === -3
                ? "请报验"
                : this.state.isPassengerCheckMessage.verify_status === -10
                ? "未知"
                : "待核验"}
            </span>
          </div>

          {this.state.isPassengerCheckStatus ? (
            ""
          ) : (
            <div className="reload_passenger_status">
              <Button
                className="reload_btn"
                type="primary"
                onClick={() => this.reloadVerify()}
              >
                已发送验证码，刷新结果
              </Button>
            </div>
          )}
        </Modal>

        {/* 占座弹窗 */}
        <OccupySeatModal
          isOccupyNo={this.state.isOccupyNo}
          isOccupyModal={this.state.isOccupyModal}
          isOccupyStatus={this.state.isOccupyStatus}
          closeOccupy={() => this.closeOccupy()}
          orderSuccess={() => this.orderSuccess()}
          jumpOccupy={() => this.jumpOccupy()}
          onRef={this.onRef}
        ></OccupySeatModal>
      </div>
    );
  }
}
