/*
 * @Description: 改签列表
 * @Author: wish.WuJunLong
 * @Date: 2021-06-08 09:26:48
 * @LastEditTime: 2021-07-19 17:56:52
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

import "./ChangeList.scss";

import CancelOrderModal from "../../components/cancelOrderModal"; // 取消/退票确认弹窗

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
      orderStatusList: ["全部", "待支付", "改签占座中", "已出票", "已取消"],
      orderStatusActive: "全部",
      orderNumberData: {}, // 订单状态数量
      orderList: [], // 订单列表

      orderSearch: {
        orderType: "订单号",
        status: "",
        limit: 20, //类型：String  必有字段  备注：无
        page: 1, //类型：String  必有字段  备注：无
      },

      tableLoading: true, //  表格加载

      isSegmentsModal: false, // 取消订单弹窗
      isSegmentsModalData: {}, // 弹窗数据
      isSegmentsModalType: "", // 弹窗状态
      isSegmentsModalBtnStatus: false, // 弹窗按钮状态

      isAdmin: false, // 管理员状态

      disDataList: [], // 分销商列表
    };
  }

  // 获取改签列表
  getChangeList() {
    this.setState({
      orderList: [],
      tableLoading: true,
    });
    let data = {
      change_no: this.state.orderSearch.order_no || "", //类型：String  必有字段  备注：订单号
      passenger: this.state.orderSearch.passenger,
      ticket_number: this.state.orderSearch.ticket_number,
      dis_id: this.state.orderSearch.dis_id, //类型：Number  必有字段  备注：分销商
      created_at_start: this.state.orderSearch.start_date, //类型：String  必有字段  备注：生单时间start
      created_at_end: this.state.orderSearch.end_date, //类型：String  必有字段  备注：生单时间end
      limit: this.state.orderSearch.limit, //类型：String  必有字段  备注：无
      page: this.state.orderSearch.page, //类型：String  必有字段  备注：无
    };

    data["status"] = this.state.orderSearch.status
      ? this.state.orderSearch.status === 1
        ? [1, 3, 6]
        : [this.state.orderSearch.status]
      : [];

    this.$axios.post("/train/order/change/list", data).then((res) => {
      if (res.code === 0) {
        this.getChangeDataCount();
        this.setState({
          orderList: res.data,
          tableLoading: false,
          isAdmin: res.is_admin,
        });
      } else {
        message.warning(res.msg);
      }
    });
  }

  // 组装筛选数据
  async searchSubmit() {
    let data = this.state.orderSearch;

    if (data.timeData) {
      data.start_date = this.$moment(data.timeData[0]).format("YYYY-MM-DD");
      data.end_date = this.$moment(data.timeData[1]).format("YYYY-MM-DD");
    } else {
      data.start_date = "";
      data.end_date = "";
    }

    if (data.orderType === "订单号" && data.orderNo) {
      data.order_no = data.orderNo;
      data.ticket_number = "";
    } else if (data.orderType === "取票号" && data.orderNo) {
      data.ticket_number = data.orderNo;
      data.order_no = "";
    } else if (!data.orderNo) {
      data.ticket_number = "";
      data.order_no = "";
    }

    data.page = 1;

    await this.setState({
      orderSearch: data,
    });

    await this.getChangeList();
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

  // 头部状态切换
  async isActiveHeader(val) {
    let data = this.state.orderSearch;
    data.status =
      val === "待支付"
        ? 2
        : val === "改签占座中"
        ? 1
        : val === "已出票"
        ? 4
        : val === "已取消"
        ? 5
        : "";

    data.page = 1;
    await this.setState({
      orderSearch: data,
      orderStatusActive: val,
    });
    await this.getChangeList();
  }

  // 获取改签列表数量
  getChangeDataCount() {
    this.$axios.get("/train/order/change/count").then((res) => {
      if (res.code === 0) {
        this.setState({
          orderNumberData: res.data,
        });
      } else {
        message.warning(res.msg);
      }
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
    await this.getChangeList();
  };

  // 跳转详情页
  jumpDetail(val) {
    console.log(val);
    this.props.history.push({ pathname: "/changeDetail/" + val.change_no });
  }

  // 打开确认取消弹窗
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
      source: "YunKu", //类型：String  必有字段  备注：数据源
      order: {
        //类型：Object  必有字段  备注：订单信息
        order_no: val.change_no, //类型：String  必有字段  备注：订单号
        out_trade_no: val.out_trade_no, //类型：String  必有字段  备注：外部订单号
      },
    };
    this.$axios.post("/train/order/change/cancel", data).then((res) => {
      this.setState({
        isSegmentsModalBtnStatus: false,
      });
      if (res.code === 0) {
        message.success(res.data);
        this.setState({
          isSegmentsModal: false,
        });
        this.getChangeList();
      } else {
        message.warning(res.msg);
      }
    });
  }

  // 退票单跳转
  jumpRefundPage(val) {
    this.props.history.push({
      pathname: "/orderRefund/" + val.change_no,
      query: { changeType: true },
    });
  }

  componentDidMount() {
    this.getChangeList();
  }

  render() {
    return (
      <div className="change_list">
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
                  ? this.state.orderNumberData["total"] || 0
                  : item === "改签占座中"
                  ? this.state.orderNumberData["changing"] || 0
                  : item === "待支付"
                  ? this.state.orderNumberData["wait_pay"] || 0
                  : item === "已出票"
                  ? this.state.orderNumberData["finish"] || 0
                  : item === "已取消"
                  ? this.state.orderNumberData["cancel"] || 0
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
              <div className="list_title" style={{ width: 88 }}>
                改签状态
              </div>
              <div className="list_item">
                <Select
                  onChange={this.searchSelect.bind(this, "status")}
                  placeholder="请选择"
                  value={this.state.orderSearch.status}
                >
                  <Option value={""}>全部</Option>
                  <Option value={1}>改签占座中</Option>
                  <Option value={2}>待支付</Option>
                  <Option value={4}>已出票</Option>
                  <Option value={5}>已取消</Option>
                </Select>
              </div>
            </div>

            <div className="search_list">
              <div className="list_title" style={{ width: 74 }}>
                <Select
                  onChange={this.searchSelect.bind(this, "orderType")}
                  value={this.state.orderSearch.orderType}
                >
                  <Option value="订单号">订单号</Option>
                  <Option value="取票号">取票号</Option>
                </Select>
              </div>
              <div className="list_item">
                <Input
                  onChange={this.searchInput.bind(this, "orderNo")}
                  allowClear
                  placeholder="订单号/取票号"
                  value={this.state.orderSearch.orderNo}
                ></Input>
              </div>
            </div>

            <div className="search_list">
              <div className="list_title" style={{ width: 74 }}>
                申请时间
              </div>
              <div className="list_item" style={{ width: 280 }}>
                <RangePicker
                  onChange={this.searchSelect.bind(this, "timeData")}
                  placeholder={["请选择", "请选择"]}
                  value={this.state.orderSearch.timeData}
                />
              </div>
            </div>

            {this.state.isAdmin ? (
              <div className="search_list">
                <div className="list_title" style={{ width: 74 }}>
                  分销商
                </div>
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

            <Button
              className="search_submit"
              type="primary"
              onClick={() => this.searchSubmit()}
            >
              搜索
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
                        href={`/pay/${Base64.encode(render.change_no)}`}
                      >
                        付
                      </Button>
                    ) : (
                      ""
                    )}
                    {(render.status === 4 || render.status === 7) &&
                    render.refund_orders.length < 1 ? (
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
                title="取票号"
                dataIndex="ticket_number"
                render={(text) => text || "-"}
              />
              <Column
                title="行程时间"
                render={(text, render) => (
                  <>
                    <p>
                      {render.segments[0]
                        ? this.$moment(render.segments[0].departure_time).format(
                            "YY-MM-DD HH:mm"
                          )
                        : ""}
                      -
                    </p>
                    <p>
                      {render.segments[0]
                        ? this.$moment(render.segments[0].arrive_time).format(
                            "YY-MM-DD HH:mm"
                          )
                        : ""}
                    </p>
                  </>
                )}
              />
              <Column
                title="改签费用"
                dataIndex="ticket_price"
                render={(text) => text || "-"}
              />
              <Column
                title="需支付"
                dataIndex="need_pay_amount"
                render={(text) => text || "-"}
              />
              <Column
                title="支付时间"
                dataIndex="pay_time"
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
                          ? "#5AB957"
                          : text === 4 && render.refund_orders.length > 0
                          ? "#FF0000"
                          : text === 4
                          ? "#0070E2"
                          : text === 5
                          ? "#333333"
                          : text === 6
                          ? "#FF0000"
                          : text === 7
                          ? "#FF0000"
                          : "#333333",
                    }}
                  >
                    {text === 1 ? (
                      "改签占座中"
                    ) : text === 2 ? (
                      "待支付"
                    ) : text === 3 ? (
                      "出票中"
                    ) : text === 4 && render.refund_orders.length > 0 ? (
                      // <>
                      //   <p style={{ color: "#FB9826" }}>已改签</p>
                      //   <p style={{ color: "#FF0000" }}>已退票</p>
                      // </>
                      "已退票"
                    ) : text === 4 ? (
                      "已出票"
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
                title="申请人"
                dataIndex="book_user"
                render={(text) => text || "-"}
              />
              <Column
                title="申请时间"
                dataIndex="created_at"
                render={(text) => this.$moment(text).format("YY-MM-DD HH:mm") || "-"}
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
          isSegmentsModalType={this.state.isSegmentsModalType}
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
