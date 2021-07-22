/*
 * @Description: 改签详情
 * @Author: wish.WuJunLong
 * @Date: 2021-06-08 10:49:01
 * @LastEditTime: 2021-07-20 17:24:12
 * @LastEditors: wish.WuJunLong
 */

import React, { Component } from "react";

import { Button, message, Table, Popover, Spin, Input } from "antd";

import CancelOrderModal from "../../components/cancelOrderModal"; // 取消确认弹窗

import "./ChangeDetail.scss";

import { Base64 } from "js-base64";

const { Column } = Table;

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pageLoading: false,

      orderNo: "", // 订单号
      detailData: {}, // 订单详情

      viaStopPopoverMessage: {}, // 组装信息
      viaStopPopover: "", // 经停站信息弹窗
      viaStopData: [], // 经停站数据

      isSegmentsModal: false, // 取消订单弹窗
      isSegmentsModalData: {}, // 弹窗数据
      isSegmentsModalType: "", // 弹窗状态
      isSegmentsModalBtnStatus: false, // 弹窗按钮状态

      orderRemark: "", // 订单备注
    };
  }

  async componentDidMount() {
    await this.setState({
      orderNo: this.props.match.params.id || "",
    });
    await this.getDetailData();
  }

  // 获取改签详情
  getDetailData() {
    if (!this.state.orderNo) {
      return message.warning("订单获取失败，请返回列表页重新进入");
    }
    this.$axios.post(`/train/order/change/detail/${this.state.orderNo}`).then((res) => {
      if (res.code === 0) {
        this.setState({
          detailData: res.data,
        });
        setTimeout(() => {
          this.setState({
            pageLoading: false,
          });
        }, 500);
      }
    });
  }

  // 刷新数据
  async refreshData() {
    await this.setState({
      pageLoading: true,
    });
    await this.getDetailData();
  }

  // 返回订单列表
  jumpBack() {
    try {
      this.props.history.goBack();
    } catch (error) {
      this.props.history.push({
        pathname: "/changeList/",
      });
    }
  }

  // 订单备注修改
  changeRemark = (val) => {
    this.setState({
      orderRemark: val.target.value,
    });
  };

  // 保存备注
  saveRemarkBtn() {
    if (!this.state.orderRemark) {
      return message.warning("请填写备注信息");
    }
    this.setState({
      remarkLoading: true,
    });
    let data = {
      order_no: this.state.orderNo,
      remark: this.state.orderRemark,
    };
    this.$axios.post("/train/remark/save", data).then((res) => {
      this.setState({
        remarkLoading: false,
      });
      if (res.code === 0) {
        message.success(res.data);
        this.getDetailData();
      } else {
        message.warning(res.data);
      }
    });
  }

  // 打开取消订单弹窗
  orderCancel(val) {
    this.setState({
      isSegmentsModal: true,
      isSegmentsModalType: val,
      isSegmentsModalData: this.state.detailData,
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
    let data = {
      channel: this.state.detailData.channel, //类型：String  必有字段  备注：渠道
      source: this.state.detailData.source, //类型：String  必有字段  备注：数据源
      order: {
        //类型：Object  必有字段  备注：订单信息
        order_no: this.state.detailData.change_no, //类型：String  必有字段  备注：订单号
        out_trade_no: this.state.detailData.out_trade_no, //类型：String  必有字段  备注：外部订单号
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
        this.getDetailData();
      } else {
        message.warning(res.msg);
      }
    });
  }

  // 跳转退票页面
  jumpRefundPage() {
    this.props.history.push({
      pathname: "/orderRefund/" + this.state.orderNo,
      query: { changeType: true },
    });
  }

  // 发送短信
  sendMessage() {
    try {
      window.parent.addTab("发送信息", `/msg/sendMsg/${this.state.orderNo}`);
    } catch (e) {
      console.log(e);
    }
  }

  render() {
    return (
      <div className="change_detail">
        <Spin spinning={this.state.pageLoading} tip="获取数据中...">
          <div className="detail_template detail_header">
            <div className="header_left">
              <div className="left_no">
                <div className="header_title">订单编号</div>
                <p>{this.state.orderNo}</p>
                <div className="header_title">原订单号</div>
                <p>{this.state.detailData.train_order_no}</p>
              </div>

              <div className="left_box">
                <p>
                  <span className="header_title">申请人</span>
                  {this.state.detailData.book_user || "-"}
                </p>
                <p>
                  <span className="header_title">申请时间</span>
                  {this.state.detailData.created_at || "-"}
                </p>
                <p>
                  <span className="header_title">电子取票号</span>
                  {this.state.detailData.ticket_number || "-"}
                </p>
                <p>
                  <span className="header_title">改签状态</span>
                  <span
                    style={{
                      color:
                        this.state.detailData.status === 1
                          ? "#FB9826"
                          : this.state.detailData.status === 2
                          ? "#FF0000"
                          : this.state.detailData.status === 3
                          ? "#5AB957"
                          : this.state.detailData.status === 4
                          ? "#0070E2"
                          : this.state.detailData.status === 5
                          ? "#333333"
                          : this.state.detailData.status === 6
                          ? "#FF0000"
                          : this.state.detailData.status === 7
                          ? "#FF0000"
                          : "#333333",
                    }}
                  >
                    {this.state.detailData.status === 1 ? (
                      "改签占座中"
                    ) : this.state.detailData.status === 2 ? (
                      "待支付"
                    ) : this.state.detailData.status === 3 ? (
                      "出票中"
                    ) : this.state.detailData.status === 4 ? (
                      "已出票"
                    ) : this.state.detailData.status === 5 ? (
                      "已取消"
                    ) : this.state.detailData.status === 6 ? (
                      <Popover
                        content={this.state.detailData.status_remark}
                        title={false}
                        trigger="hover"
                      >
                        <span style={{ cursor: "pointer" }}>占座失败</span>
                      </Popover>
                    ) : this.state.detailData.status === 7 ? (
                      <Popover
                        content={this.state.detailData.status_remark}
                        title={false}
                        trigger="hover"
                      >
                        <span style={{ cursor: "pointer" }}>出票失败</span>
                      </Popover>
                    ) : (
                      this.state.detailData.status || "-"
                    )}
                  </span>
                </p>
              </div>
            </div>

            <div className="header_right">
              <div className="right_price_box">
                <p className="price">
                  &yen; {this.state.detailData.need_pay_amount || 0}
                  {this.state.detailData.status === 2 ? (
                    <Button
                      className="jump_order_pay"
                      type="link"
                      href={`/pay/${Base64.encode(this.state.detailData.change_no)}`}
                    >
                      立即支付
                    </Button>
                  ) : (
                    ""
                  )}
                </p>
              </div>
              {this.state.detailData.status === 1 ? (
                <div className="seat_status">
                  预计在
                  {this.$moment(this.state.detailData.created_at)
                    .add(30, "m")
                    .format("HH:mm")}
                  分前完成占座{" "}
                  <Button size="small" type="text" onClick={() => this.refreshData()}>
                    刷新
                  </Button>
                </div>
              ) : (
                ""
              )}
            </div>
          </div>

          <div className="detail_template detail_passenger">
            <div className="template_title">
              <p>乘车人信息</p>
            </div>
            <div className="passenger_main">
              <Table
                size="small"
                pagination={false}
                dataSource={this.state.detailData.passengers}
                rowKey="id"
              >
                <Column title="乘车人" dataIndex="PassengerName" />
                <Column
                  title="乘客类型"
                  dataIndex="PassengerType"
                  render={(text) =>
                    text === "ADT" ? "成人" : text === "CHD" ? "儿童" : text
                  }
                />
                <Column
                  title="座位号"
                  dataIndex="seat_info"
                  render={(text) => (text ? text : "-")}
                />
                <Column title="原票号" dataIndex="old_ticket_no" />
                <Column
                  title="新票号"
                  dataIndex="ticket_no"
                  render={(text) => (text ? text : "-")}
                />
                <Column title="原票面价" dataIndex="old_ticket_price" />
                <Column title="新票面价" dataIndex="ticket_price" />
                <Column title="服务费" dataIndex="service_price" />
                <Column title="保险" dataIndex="insurance_price" />
                <Column title="改签费" dataIndex="change_price" />
                <Column title="需支付" dataIndex="need_pay_amount" />
              </Table>
            </div>
          </div>

          <div className="detail_template detail_ticket">
            <div className="template_title">
              <p>车次信息</p>
            </div>

            <div className="ticket_box">
              {this.state.detailData.segments &&
                this.state.detailData.segments.map((item, index) => (
                  <div className="box_list" key={index}>
                    <div
                      className="list_type"
                      style={{
                        color: index === 0 ? "#FF0000" : "#0070E2",
                        backgroundColor: index === 0 ? "#FFE1E1" : "#DFEEFE",
                      }}
                    >
                      新车次
                    </div>
                    <div className="list_number">{item.train_number}</div>
                    <div className="list_time">
                      {this.$moment(item.departure_time).format("YYYY-MM-DD")}
                      {`（${this.$moment(item.departure_time).format("ddd")}）`}
                    </div>
                    <div className="list_info">
                      <div className="info_status">始</div>
                      <div className="info_date">
                        {this.$moment(item.departure_time).format("HH:mm")}
                      </div>
                      <div className="info_address">{item.from_city}</div>
                      <div className="info_icon"></div>
                      <div className="info_status">终</div>
                      <div className="info_date">
                        {this.$moment(item.arrive_time).format("HH:mm")}
                      </div>
                      <div className="info_address">{item.to_city}</div>
                    </div>
                    <div className="list_cabin">
                      席别：
                      {item.seat}
                    </div>
                  </div>
                ))}
              {this.state.detailData.train_order &&
                this.state.detailData.train_order.segments.map((item, index) => (
                  <div className="box_list" key={index}>
                    <div
                      className="list_type"
                      style={{
                        color: "#0070E2",
                        backgroundColor: "#DFEEFE",
                      }}
                    >
                      旧车次
                    </div>
                    <div className="list_number">{item.train_number}</div>
                    <div className="list_time">
                      {this.$moment(item.departure_time).format("YYYY-MM-DD")}
                      {`（${this.$moment(item.departure_time).format("ddd")}）`}
                    </div>
                    <div className="list_info">
                      <div className="info_status">始</div>
                      <div className="info_date">
                        {this.$moment(item.departure_time).format("HH:mm")}
                      </div>
                      <div className="info_address">{item.from_city}</div>
                      <div className="info_icon"></div>
                      <div className="info_status">终</div>
                      <div className="info_date">
                        {this.$moment(item.arrive_time).format("HH:mm")}
                      </div>
                      <div className="info_address">{item.to_city}</div>
                    </div>
                    <div className="list_cabin">
                      席别：
                      {item.seat}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="detail_template detail_order_info">
            <div className="template_title">
              <p>订单信息</p>
            </div>
            <div className="order_info_main">
              <div className="main_list">
                联系人：
                {this.state.detailData.train_order
                  ? this.state.detailData.train_order.book_user_name
                  : "-"}
              </div>
              <div className="main_list">
                手机号：
                {this.state.detailData.train_order
                  ? this.state.detailData.train_order.phone
                  : "-"}
              </div>
              <div className="main_list">
                邮箱：
                {this.state.detailData.train_order
                  ? this.state.detailData.train_order.mail
                  : "-"}
              </div>
            </div>
            <div className="order_info_main">
              <div className="main_list remark">
                <p>备注：</p>
                {!this.state.detailData.remark ? (
                  <Input
                    placeholder="请输入"
                    value={this.state.orderRemark}
                    onChange={this.changeRemark}
                  ></Input>
                ) : (
                  this.state.detailData.remark
                )}
              </div>
            </div>
          </div>

          <div className="detail_bottom_box">
            <Button className="back_btn" onClick={() => this.jumpBack()}>
              返回
            </Button>
            {!this.state.detailData.remark ? (
              <Button
                loading={this.state.remarkLoading}
                className="detail_btn"
                onClick={() => this.saveRemarkBtn()}
              >
                保存
              </Button>
            ) : (
              ""
            )}
            <Button className="detail_btn" onClick={() => this.sendMessage()}>
              发送短信
            </Button>
            {this.state.detailData.status === 2 ? (
              <Button className="detail_btn" onClick={() => this.orderCancel("取消")}>
                取消订单
              </Button>
            ) : (
              ""
            )}
            {this.state.detailData.status === 4 || this.state.detailData.status === 7 ? (
              <Button className="detail_btn" onClick={() => this.jumpRefundPage()}>
                退票
              </Button>
            ) : (
              ""
            )}
          </div>
        </Spin>

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
