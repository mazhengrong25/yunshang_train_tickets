/*
 * @Description: 订单列表
 * @Author: wish.WuJunLong
 * @Date: 2021-05-25 13:46:24
 * @LastEditTime: 2021-08-05 10:30:05
 * @LastEditors: wish.WuJunLong
 */

import React, { Component } from "react";

import {
  Button,
  Pagination,
  Table,
  Popover,
  message,
  Input,
  Select,
  DatePicker,
} from "antd";

import CancelOrderModal from "../../components/cancelOrderModal"; // 取消/退票确认弹窗

import { DownloadOutlined } from "@ant-design/icons";

import "./OrderList.scss";

import { Base64 } from "js-base64";

const { Column } = Table;
const { Option } = Select;
const { RangePicker } = DatePicker;

let timeout;
let currentValue;

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      orderStatusList: ["全部", "待支付", "出票中", "已出票", "已取消"],
      orderStatusActive: "全部",
      orderNumberData: {}, // 订单状态数量
      orderList: [], // 订单列表
      tableLoading: false, // 订单表格加载
      orderSearch: {
        status: "",
        orderType: "订单号",
        timeType: "出行时间",

        page: 1,
        limit: 20,
      },

      isSegmentsModal: false, // 取消订单弹窗
      isSegmentsModalData: {}, // 弹窗数据
      isSegmentsModalType: "", // 弹窗状态
      isSegmentsModalBtnStatus: false, // 弹窗按钮状态

      isAdmin: false, // 判断是否管理员账户

      disDataList: [], // 分销商列表
    };
  }

  componentDidMount() {
    this.getOrderListData();
  }

  // 组装筛选数据
  async searchSubmit() {
    console.log(this.state.orderSearch);
    let data = this.state.orderSearch;

    if (data.timeType === "出行时间" && data.timeData) {
      data.train_date_start = this.$moment(data.timeData[0]).format("YYYY-MM-DD");
      data.train_date_end = this.$moment(data.timeData[1]).format("YYYY-MM-DD");
      data.pay_time_start = "";
      data.pay_time_end = "";
    } else if (data.timeType === "预定时间" && data.timeData) {
      data.pay_time_start = this.$moment(data.timeData[0]).format("YYYY-MM-DD");
      data.pay_time_end = this.$moment(data.timeData[1]).format("YYYY-MM-DD");
      data.train_date_start = "";
      data.train_date_end = "";
    } else if (!data.timeData) {
      data.pay_time_start = "";
      data.pay_time_end = "";
      data.train_date_start = "";
      data.train_date_end = "";
    }

    if (data.orderType === "订单号" && data.orderNo) {
      data.order_no = data.orderNo;
      data.ticket_number = "";
    } else if (data.orderType === "票号" && data.orderNo) {
      data.ticket_number = data.orderNo;
      data.order_no = "";
    } else if (!data.orderNo) {
      data.ticket_number = "";
      data.order_no = "";
    }

    data.page = 1;

    let status =
      this.state.orderSearch.status === 2
        ? "待支付"
        : this.state.orderSearch.status === 3
        ? "出票中"
        : this.state.orderSearch.status === 4
        ? "已出票"
        : this.state.orderSearch.status === 5
        ? "已取消"
        : "全部";

    console.log(data);

    await this.setState({
      orderStatusActive: status,
      orderSearch: data,
    });

    await this.getOrderListData();
  }

  // 筛选数据输入框
  searchInput = (label, val) => {
    let data = this.state.orderSearch;
    data[label] = val.target.value;

    this.setState({
      orderSearch: data,
    });
  };

  // 筛选数据选择器
  searchSelect = (label, val) => {
    console.log(val);
    let data = this.state.orderSearch;
    data[label] = val;

    this.setState({
      orderSearch: data,
    });
  };

  // 分销商搜索
  handleSearch = (value) => {
    // if (this.delayedChange(value)) {
    if (value) {
      this.fetch(value, (data) => this.setState({ disDataList: data }));
    } else {
      this.setState({ disDataList: [] });
    }
  };

  fetch(value, callback) {
    let _that = this;
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    currentValue = value;

    function fake() {
      let data = {
        key: value,
      };
      _that.$axios.get("/searchDis", { params: data }).then((res) => {
        if (currentValue === value) {
          console.log(res);
          const data = [];
          res.forEach((r) => {
            data.push({
              value: r.id,
              text: r.company_name,
            });
          });
          callback(data);
        }
      });
    }

    timeout = setTimeout(fake, 300);
  }

  // 防抖
  // delayedChange(val) {
  //   if (/.*[\u4e00-\u9fa5]+.*/.test(val)) {
  //     return val;
  //   } else {
  //     return "";
  //   }
  // }

  // 获取订单列表
  getOrderListData() {
    this.setState({
      orderList: [],
      tableLoading: true,
    });

    let data = {
      channel: this.state.orderSearch.channel || "", //类型：String  必有字段  备注：渠道1 web 2 miniapp 3 wechat
      order_no: this.state.orderSearch.order_no || "", //类型：String  必有字段  备注：订单号
      out_trade_no: this.state.orderSearch.out_trade_no || "", //类型：String  必有字段  备注：外部订单号
      ticket_number: this.state.orderSearch.ticket_number || "", //类型：String  必有字段  备注：取票号（电子单号）
      from_station: this.state.orderSearch.from_station || "", //类型：String  必有字段  备注：出发
      to_station: this.state.orderSearch.to_station || "", //类型：String  必有字段  备注：到达
      pay_status: this.state.orderSearch.pay_status || "", //类型：String  必有字段  备注：支付状态：1:未支付 2:已支付 3:已退款 4:已取消
      pay_type: this.state.orderSearch.pay_type || "", //类型：String  必有字段  备注：支付方式：1:预存款 2：授信支付 3：易宝 4支付宝
      status: this.state.orderSearch.status || "", //类型：String  必有字段  备注：状态 1 占座中 2占座成功待支付 3已支付 4已出票 4已取消 5占座失败 6出票失败
      pro_center_id: this.state.orderSearch.pro_center_id || "", //类型：String  必有字段  备注：利润中心ID
      is_admin_book: this.state.orderSearch.is_admin_book || "", //类型：String  必有字段  备注：管理员代订 0否 1是
      is_settle: this.state.orderSearch.is_settle || "", //类型：String  必有字段  备注：是否结算 1 是 0 否
      train_date_start: this.state.orderSearch.train_date_start || "", //类型：String  必有字段  备注：起飞开始
      train_date_end: this.state.orderSearch.train_date_end || "", //类型：String  必有字段  备注：起飞结束
      pay_time_start: this.state.orderSearch.pay_time_start || "", //类型：String  必有字段  备注：支付开始
      pay_time_end: this.state.orderSearch.pay_time_end || "", //类型：String  必有字段  备注：支付结束
      train_number: this.state.orderSearch.train_number || "", //类型：String  必有字段  车次
      book_user: this.state.orderSearch.book_user || "", //类型：String  必有字段  订票员
      dis_id: this.state.orderSearch.dis_id || "", //类型：String  必有字段  分销商
      passenger: this.state.orderSearch.passenger || "", //类型：String  必有字段  乘客

      page: this.state.orderSearch.page,
      limit: this.state.orderSearch.limit,
    };

    this.$axios.post("/train/order/list", data).then((res) => {
      if (res.code === 0) {
        this.getOrderNumber(data);
        this.setState({
          orderList: res.data,
          isAdmin: res.is_admin,
        });
      }
      this.setState({
        tableLoading: false,
      });
    });
  }

  // 头部状态切换
  async isActiveHeader(val) {
    let data = this.state.orderSearch;
    data.status =
      val === "待支付"
        ? 2
        : val === "出票中"
        ? 3
        : val === "已出票"
        ? 4
        : val === "已取消"
        ? 5
        : "";
    await this.setState({
      orderSearch: data,
      orderStatusActive: val,
    });
    await this.getOrderListData();
  }

  // 获取订单状态数量
  getOrderNumber(data) {
    this.$axios.post("/train/order/count", data).then((res) => {
      if (res.code === 0) {
        this.setState({
          orderNumberData: res.data,
        });
      }
    });
  }

  // 判断订单状态
  orderStatusRefund(val) {
    // if (val.refund_orders && val.refund_orders.length > 0) {
    // return val.refund_orders.passengers.length !== val.passengers.length;
    return val.refund_orders.length < 1;
    // } else {
    //   return true;
    // }
  }
  orderStatusChange(val) {
    // if (val.change_orders && val.change_orders.length > 0) {
    // return val.change_orders.passengers.length !== val.passengers.length;
    return val.change_orders.length < 1;
    // } else {
    //   return true;
    // }
  }

  // 跳转详情页
  jumpDetail(val) {
    this.props.history.push({
      pathname: "/orderDetail/" + val.order_no,
    });
  }

  // 列表分页切换
  changePagination = async (page, pageSize) => {
    let data = this.state.orderSearch;
    data.page = page;
    data.limit = pageSize;
    await this.setState({
      orderSearch: data,
    });
    await this.getOrderListData();
  };

  // 打开取消订单弹窗
  orderCancel(val) {
    console.log(val);
    this.setState({
      isSegmentsModal: true,
      isSegmentsModalType: "取消",
      isSegmentsModalData: val,
      isSegmentsModalBtnStatus: false,
    });
  }

  // 关闭取消订单弹窗
  closeModalBtn() {
    this.setState({
      isSegmentsModal: false,
    });
  }

  // 取消订单提交
  submitModalBtn() {
    this.setState({
      isSegmentsModalBtnStatus: true,
    });
    let val = this.state.isSegmentsModalData;
    let data = {
      channel: "Di", //类型：String  必有字段  备注：渠道
      source: val.source, //类型：String  必有字段  备注：数据源
      order: {
        //类型：Object  必有字段  备注：订单信息
        order_no: val.order_no, //类型：String  必有字段  备注：订单号
        out_trade_no: val.out_trade_no, //类型：String  必有字段  备注：外部订单号
      },
    };
    this.$axios.post("/train/order/cancel", data).then((res) => {
      this.setState({
        isSegmentsModalBtnStatus: false,
      });
      if (res.code === 0) {
        message.success(res.data);
        this.setState({
          isSegmentsModal: false,
        });
        this.getOrderListData();
      } else {
        message.warning(res.msg);
      }
    });
  }

  // 改签单跳转
  jumpChangePage(val) {
    this.props.history.push({
      pathname: "/orderChange/" + val.order_no,
      query: { changeType: true },
    });
  }

  // 退票单跳转
  jumpRefundPage(val) {
    this.props.history.push({
      pathname: "/orderRefund/" + val.order_no,
      query: { changeType: true },
    });
  }

  // 表单下载
  downloadExcel() {
    let data = {
      channel: this.state.orderSearch.channel || "", //类型：String  必有字段  备注：渠道1 web 2 miniapp 3 wechat
      order_no: this.state.orderSearch.order_no || "", //类型：String  必有字段  备注：订单号
      out_trade_no: this.state.orderSearch.out_trade_no || "", //类型：String  必有字段  备注：外部订单号
      ticket_number: this.state.orderSearch.ticket_number || "", //类型：String  必有字段  备注：取票号（电子单号）
      from_station: this.state.orderSearch.from_station || "", //类型：String  必有字段  备注：出发
      to_station: this.state.orderSearch.to_station || "", //类型：String  必有字段  备注：到达
      pay_status: this.state.orderSearch.pay_status || "", //类型：String  必有字段  备注：支付状态：1:未支付 2:已支付 3:已退款 4:已取消
      pay_type: this.state.orderSearch.pay_type || "", //类型：String  必有字段  备注：支付方式：1:预存款 2：授信支付 3：易宝 4支付宝
      status: this.state.orderSearch.status || "", //类型：String  必有字段  备注：状态 1 占座中 2占座成功待支付 3已支付 4已出票 4已取消 5占座失败 6出票失败
      pro_center_id: this.state.orderSearch.pro_center_id || "", //类型：String  必有字段  备注：利润中心ID
      is_admin_book: this.state.orderSearch.is_admin_book || "", //类型：String  必有字段  备注：管理员代订 0否 1是
      is_settle: this.state.orderSearch.is_settle || "", //类型：String  必有字段  备注：是否结算 1 是 0 否
      train_date_start: this.state.orderSearch.train_date_start || "", //类型：String  必有字段  备注：起飞开始
      train_date_end: this.state.orderSearch.train_date_end || "", //类型：String  必有字段  备注：起飞结束
      pay_time_start: this.state.orderSearch.pay_time_start || "", //类型：String  必有字段  备注：支付开始
      pay_time_end: this.state.orderSearch.pay_time_end || "", //类型：String  必有字段  备注：支付结束
      train_number: this.state.orderSearch.train_number || "", //类型：String  必有字段  车次
      book_user: this.state.orderSearch.book_user || "", //类型：String  必有字段  订票员
      dis_id: this.state.orderSearch.dis_id || "", //类型：String  必有字段  分销商
      passenger: this.state.orderSearch.passenger || "", //类型：String  必有字段  乘客

      page: this.state.orderSearch.page,
      limit: this.state.orderSearch.limit,

      order_type: "1", //类型：String  必有字段  备注：1正常单 2改签单 3退票单
      download: "1", //类型：String  必有字段  备注：默认1
      report_type: "5",
    };

    /*
     *功能： 模拟form表单的提交
     *参数： URL 跳转地址 PARAMTERS 参数 function Post(URL, PARAMTERS ,Type){
     */
    //创建form表单
    var temp_form = document.createElement("form");
    temp_form.action = "/log/train/order_excel";
    //如需当前窗口打开，form的target属性要设置为'_self'
    temp_form.target = "_blank";
    temp_form.method = "post";
    temp_form.style.display = "none";
    //添加参数
    for (var item in data) {
      var opt = document.createElement("input");
      if (data[item]) {
        opt.name = item;
        opt.value = data[item];
        temp_form.appendChild(opt);
      }
    }
    document.body.appendChild(temp_form);
    //提交数据
    temp_form.submit();
  }

  render() {
    return (
      <div className="order_list">
        <div className="order_header">
          {this.state.orderStatusList.map((item, index) => (
            <div
              className={`header_list${
                this.state.orderStatusActive === item ? " active" : ""
              }`}
              onClick={() => this.isActiveHeader(item)}
              key={index}
            >
              {item}
              <span>
                {item === "全部"
                  ? this.state.orderNumberData[0] || 0
                  : item === "待支付"
                  ? this.state.orderNumberData[2] || 0
                  : item === "出票中"
                  ? this.state.orderNumberData[3] || 0
                  : item === "已出票"
                  ? this.state.orderNumberData[4] || 0
                  : item === "已取消"
                  ? this.state.orderNumberData[5] || 0
                  : 0}
              </span>
            </div>
          ))}
        </div>

        <div className="order_main">
          <div className="main_search">
            <div className="search_list">
              <div className="list_title" style={{ width: 74 }}>
                乘车人
              </div>
              <div className="list_item">
                <Input
                  onChange={this.searchInput.bind(this, "passenger")}
                  allowClear
                  placeholder="请输入"
                  value={this.state.orderSearch.passenger}
                ></Input>
              </div>
            </div>

            <div className="search_list">
              <div className="list_title">出发地</div>
              <div className="list_item">
                <Input
                  allowClear
                  onChange={this.searchInput.bind(this, "from_station")}
                  placeholder="请输入"
                  value={this.state.orderSearch.from_station}
                ></Input>
              </div>
            </div>

            <div className="search_list">
              <div className="list_title">到达地</div>
              <div className="list_item">
                <Input
                  allowClear
                  onChange={this.searchInput.bind(this, "to_station")}
                  placeholder="请输入"
                  value={this.state.orderSearch.to_station}
                ></Input>
              </div>
            </div>

            <div className="search_list" style={{ marginRight: 0 }}>
              <div className="list_title" style={{ width: 88 }}>
                <Select
                  onChange={this.searchSelect.bind(this, "timeType")}
                  value={this.state.orderSearch.timeType}
                >
                  <Option value="出行时间">出行时间</Option>
                  <Option value="预定时间">预定时间</Option>
                </Select>
              </div>
              <div className="list_item" style={{ width: 280 }}>
                <RangePicker
                  onChange={this.searchSelect.bind(this, "timeData")}
                  placeholder={["请选择", "请选择"]}
                  value={this.state.orderSearch.timeData}
                />
              </div>
            </div>

            <div className="search_list">
              <div className="list_title" style={{ width: 74 }}>
                <Select
                  onChange={this.searchSelect.bind(this, "orderType")}
                  value={this.state.orderSearch.orderType}
                >
                  <Option value="订单号">订单号</Option>
                  <Option value="票号">票号</Option>
                </Select>
              </div>
              <div className="list_item">
                <Input
                  onChange={this.searchInput.bind(this, "orderNo")}
                  allowClear
                  placeholder="订单号/票号"
                  value={this.state.orderSearch.orderNo}
                ></Input>
              </div>
            </div>

            <div className="search_list">
              <div className="list_title">车次</div>
              <div className="list_item">
                <Input
                  placeholder="请输入"
                  onChange={this.searchInput.bind(this, "train_number")}
                  allowClear
                  value={this.state.orderSearch.train_number}
                ></Input>
              </div>
            </div>

            {this.state.isAdmin ? (
              <div className="search_list">
                <div className="list_title">订票员</div>
                <div className="list_item">
                  <Input
                    placeholder="请输入"
                    onChange={this.searchInput.bind(this, "book_user")}
                    allowClear
                    value={this.state.orderSearch.book_user}
                  ></Input>
                </div>
              </div>
            ) : (
              ""
            )}

            {this.state.isAdmin ? (
              <div className="search_list">
                <div className="list_title">分销商</div>
                <div className="list_item">
                  <Select
                    showSearch
                    value={this.state.orderSearch.dis_id}
                    placeholder="输入中文进行选择"
                    defaultActiveFirstOption={false}
                    showArrow={false}
                    filterOption={false}
                    onSearch={this.handleSearch}
                    onChange={this.searchSelect.bind(this, "dis_id")}
                    notFoundContent={null}
                    allowClear
                  >
                    {this.state.disDataList.map((d) => (
                      <Option key={d.value} value={d.value}>
                        {d.text}
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>
            ) : (
              ""
            )}

            <div className="search_list" style={{ marginRight: 16 }}>
              <div className="list_title" style={{ width: 88 }}>
                订单状态
              </div>
              <div className="list_item">
                <Select
                  onChange={this.searchSelect.bind(this, "status")}
                  placeholder="请选择"
                  value={this.state.orderSearch.status}
                >
                  <Option value={""}>全部</Option>
                  <Option value={1}>占座中</Option>
                  <Option value={2}>待支付</Option>
                  <Option value={3}>出票中</Option>
                  <Option value={4}>已出票</Option>
                  <Option value={5}>已取消</Option>
                  <Option value={6}>占座失败</Option>
                  <Option value={7}>出票失败</Option>
                </Select>
              </div>
            </div>

            <Button
              className="search_submit"
              type="primary"
              onClick={() => this.searchSubmit()}
            >
              搜索
            </Button>

            <Button
              style={{ marginBottom: 16, color: "#0070e2" }}
              type="link"
              onClick={() => this.downloadExcel()}
            >
              <DownloadOutlined />
              报表下载
            </Button>
          </div>

          <div className="main_table">
            <Table
              dataSource={this.state.orderList.data}
              size="small"
              pagination={false}
              bordered
              loading={this.state.tableLoading}
              rowKey="id"
            >
              <Column
                title="操作"
                render={(text, render) => (
                  <div className="table_option">
                    <Button
                      size="small"
                      className="option_detail"
                      onClick={() => this.jumpDetail(render)}
                    >
                      详
                    </Button>
                    {render.status === 2 ? (
                      <Button
                        size="small"
                        className="option_cancel"
                        onClick={() => this.orderCancel(render)}
                      >
                        消
                      </Button>
                    ) : (
                      ""
                    )}
                    {render.status === 2 ? (
                      <Button
                        size="small"
                        className="option_pay"
                        type="link"
                        href={`/pay/${Base64.encode(render.order_no)}`}
                      >
                        付
                      </Button>
                    ) : (
                      ""
                    )}
                    {render.status === 4 ? (
                      // || render.status === 7
                      <Button
                        size="small"
                        className="option_refund"
                        onClick={() => this.jumpRefundPage(render)}
                      >
                        退
                      </Button>
                    ) : (
                      ""
                    )}
                    {render.status === 4 ? (
                      <Button
                        size="small"
                        className="option_cancel"
                        onClick={() => this.jumpChangePage(render)}
                      >
                        改
                      </Button>
                    ) : (
                      ""
                    )}
                  </div>
                )}
              />
              <Column
                title="乘车人"
                render={(text, render) => {
                  return (
                    <span className="ticket_passenger">
                      {render.passengers.map(
                        (item, index) => (index !== 0 ? "/" : "") + item.PassengerName
                      )}
                    </span>
                  );
                }}
              />

              {this.state.isAdmin ? (
                <Column
                  title="分销商"
                  render={(render) =>
                    render.distributor_user ? render.distributor_user.company_name : "-"
                  }
                />
              ) : (
                ""
              )}

              <Column
                title="行程"
                render={(text, render) => {
                  return `${render.from_station}-${render.to_station}`;
                }}
              />
              <Column
                title="车次"
                dataIndex="train_number"
                render={(text) => text || "-"}
              />
              <Column
                title="行程时间"
                render={(text, render) => (
                  <>
                    <p>{this.$moment(render.train_date).format("YYYY-MM-DD HH:mm")}-</p>
                    <p>{this.$moment(render.to_train_date).format("YYYY-MM-DD HH:mm")}</p>
                  </>
                )}
              />
              <Column
                title="票价"
                dataIndex="ticket_price"
                render={(text) => text || "-"}
              />
              <Column
                title="保险"
                dataIndex="insurance_price"
                render={(text) => text || "-"}
              />
              <Column
                title="服务费"
                dataIndex="service_price"
                render={(text) => text || "-"}
              />
              <Column
                title="结算价"
                dataIndex="need_pay_amount"
                render={(text) => text || "-"}
              />
              <Column
                title="订单状态"
                dataIndex="status"
                render={(text, render) => (
                  <span
                    style={{
                      color:
                        text === 1
                          ? "#FB9826"
                          : text === 2
                          ? "#FF0000"
                          : text === 3
                          ? "#0070E2"
                          : text === 4 &&
                            render.refund_orders.length < 1 &&
                            render.change_orders.length < 1 &&
                            render.offline_refund_number > 0
                          ? "#FF0000"
                          : text === 4 &&
                            render.refund_orders.length < 1 &&
                            render.change_orders.length < 1
                          ? "#5AB957"
                          : text === 4 && render.refund_orders.length > 0
                          ? "#FF0000"
                          : text === 4 && render.change_orders.length > 0
                          ? "#fb9826"
                          : text === 5
                          ? "#333333"
                          : text === 6
                          ? "#FF0000"
                          : text === 7
                          ? "#333333"
                          : "#333333",
                    }}
                  >
                    {text === 1 ? (
                      "占座中"
                    ) : text === 2 ? (
                      "待支付"
                    ) : text === 3 ? (
                      "出票中"
                    ) : text === 4 &&
                      render.refund_orders.length < 1 &&
                      render.change_orders.length < 1 &&
                      render.offline_refund_number > 0 ? (
                      "线下退票"
                    ) : text === 4 &&
                      render.refund_orders.length < 1 &&
                      render.change_orders.length < 1 ? (
                      "已出票"
                    ) : text === 4 && render.refund_orders.length > 0 ? (
                      <>
                        已退票
                        {render.offline_refund_number > 0 ? (
                          <>
                            <span style={{ color: "#000" }}> / </span>
                            <span style={{ color: "#FB8226" }}>线下退票</span>
                          </>
                        ) : (
                          ""
                        )}
                      </>
                    ) : text === 4 && render.change_orders.length > 0 ? (
                      "已改签"
                    ) : text === 5 ? (
                      "已取消"
                    ) : text === 6 ? (
                      <Popover
                        content={render.status_remark}
                        title={false}
                        trigger="hover"
                      >
                        <span style={{ cursor: "pointer" }}>占座失败</span>
                      </Popover>
                    ) : text === 7 && render.refund_orders.length > 0 ? (
                      "已退票"
                    ) : text === 7 ? (
                      <Popover
                        content={render.status_remark}
                        title={false}
                        trigger="hover"
                      >
                        <span style={{ cursor: "pointer" }}>出票失败</span>
                      </Popover>
                    ) : (
                      text
                    )}
                  </span>
                )}
              />
              <Column
                title="取票号"
                dataIndex="ticket_number"
                render={(text) => text || "-"}
              />
              <Column
                title="预定/支付时间"
                render={(text, render) => (
                  <>
                    <p>{this.$moment(render.created_at).format("YYYY-MM-DD HH:mm")}-</p>
                    <p>
                      {render.pay_time
                        ? this.$moment(render.pay_time).format("YYYY-MM-DD HH:mm")
                        : "-"}
                    </p>
                  </>
                )}
              />
            </Table>

            <div className="table_pagination">
              <Pagination
                current={this.state.orderList.current_page}
                total={this.state.orderList.total}
                pageSizeOptions={[20, 50, 100]}
                pageSize={this.state.orderSearch.limit}
                onChange={this.changePagination}
              />
            </div>
          </div>
        </div>

        <CancelOrderModal
          isSegmentsModalType="取消"
          isSegmentsModal={this.state.isSegmentsModal}
          isSegmentsModalData={this.state.isSegmentsModalData}
          isSegmentsModalBtnStatus={this.state.isSegmentsModalBtnStatus}
          submitModalBtn={() => this.submitModalBtn()}
          closeModalBtn={() => this.closeModalBtn()}
        ></CancelOrderModal>
      </div>
    );
  }
}
