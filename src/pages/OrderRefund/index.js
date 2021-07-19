/*
 * @Description: 退票详情
 * @Author: mzr
 * @Date: 2021-06-21 10:38:35
 * @LastEditTime: 2021-07-15 15:00:27
 * @LastEditors: wish.WuJunLong
 */

import React, { Component } from "react";

import "./OrderRefund.scss";

import { message, Button, Table, Popover } from "antd";

import InsuranceIcon from "../../static/insurance_icon.png"; // 保险图标
import TicketIcon from "../../static/trip_icon.png"; // 行程图标

import ViaStopPopover from "../../components/viaStopPopover"; // 经停站组件

import RefundOrderModal from "../../components/cancelOrderModal"; // 退票确认弹窗

const { Column } = Table;

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      orderNo: "", // 订单号
      detailData: {}, // 详情数据

      selectPassengerList: [], // 选中乘客

      viaStopPopoverMessage: {}, // 组装信息
      viaStopPopover: "", // 经停站信息弹窗
      viaStopData: [], // 经停站数据

      isSegmentsModal: false, // 取消订单弹窗
      isSegmentsModalData: {}, // 弹窗数据
      isSegmentsModalType: "", // 弹窗状态
      isSegmentsModalBtnStatus: false, // 弹窗按钮状态
    };
  }

  async componentDidMount() {
    await this.setState({
      orderNo: this.props.match.params.id || "",
    });
    await this.getDetailData();
  }

  // 获取退票详情
  getDetailData() {
    if (!this.state.orderNo) {
      return message.warning("订单获取失败，请返回列表页重新进入");
    }
    this.$axios.post(`/train/order/detail/${this.state.orderNo}`).then((res) => {
      if (res.code === 0) {
        let apiData = res.data;

        let changePassenger = [];
        let refundPassenger = [];

        if (apiData.change_orders && apiData.change_orders.length > 0) {
          changePassenger = apiData.change_orders;
        }
        if (apiData.refund_orders && apiData.refund_orders.length > 0) {
          refundPassenger = apiData.refund_orders;
        }

        // 处理乘客是否改退
        apiData.passenger = this.passengerStatus(
          changePassenger,
          refundPassenger,
          apiData.passengers
        );

        this.setState({
          detailData: apiData,
        });
      } else {
        message.warning(res.msg);
      }
    });
  }

  // 处理乘客状态
  passengerStatus(change, refund, passenger) {
    console.log(change, refund, passenger);
    if (change.length > 0) {
      change.forEach((item) => {
        item.passengers.forEach((titem) => {
          passenger.forEach((oitem) => {
            if (
              titem.PassengerName === oitem.PassengerName &&
              titem.CredentialNo === oitem.CredentialNo
            ) {
              oitem.status = "change";
            }
          });
        });
      });
    }

    if (refund.length > 0) {
      refund.forEach((item) => {
        item.passengers.forEach((titem) => {
          passenger.forEach((oitem) => {
            if (
              titem.PassengerName === oitem.PassengerName &&
              titem.CredentialNo === oitem.CredentialNo
            ) {
              oitem.status = "refund";
            }
          });
        });
      });
    }

    return passenger;
  }

  // 获取经停站信息
  openViaStopMessage = () => {
    this.setState({
      viaStopPopover: 0,
      viaStopData: [],
    });
    let data = {
      departure: this.state.detailData.segments[0].from_city, //类型：String  必有字段  备注：出发站点
      arrive: this.state.detailData.segments[0].to_city, //类型：String  必有字段  备注：到达站
      ticket: "ADT", //类型：String  必有字段  备注：票类型
      departure_date: this.$moment(
        this.state.detailData.segments[0].departure_time
      ).format("YYYY-MM-DD"), //类型：String  必有字段  备注：出发日期
      code: this.state.detailData.segments[0].train_number, //类型：String  必有字段  备注：车次
      number: this.state.detailData.segments[0].train_code, //类型：String  必有字段  备注：列车号
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

  // 返回订单列表
  jumpBack() {
    try {
      this.props.history.goBack();
    } catch (error) {
      this.props.history.push({
        pathname: "/orderList/",
      });
    }
  }

  // 组装退票数据
  getRefundData() {
    if (this.state.selectPassengerList.length < 1) {
      return message.warning("请选择需要退票的乘客");
    }

    let data = {
      segments: [
        {
          departure_time: this.state.detailData.segments[0].departure_time,
          train_number: this.state.detailData.segments[0].train_number,
          from_city: this.state.detailData.segments[0].from_city,
          to_city: this.state.detailData.segments[0].to_city,
          seat: this.state.detailData.segments[0].seat,
        },
      ],
      passengers: this.state.selectPassengerList,
    };

    this.setState({
      isSegmentsModal: true,
      isSegmentsModalType: "退票",
      isSegmentsModalData: data,
      isSegmentsModalBtnStatus: false,
    });
  }

  // 关闭退票弹窗
  closeModalBtn() {
    this.setState({
      isSegmentsModal: false,
    });
  }

  // 确认退票提交
  submitModalBtn() {
    this.setState({
      isSegmentsModalBtnStatus: true,
    });
    let passenger = [];
    this.state.selectPassengerList.forEach((item) => {
      passenger.push(item.id);
    });
    let data = {
      order_no: this.state.orderNo, //类型：String  必有字段  备注：订单号
      is_change: false, //类型：Boolean  必有字段  备注：是否是改签订单退票 1：是 0：否
      passenger_ids: passenger,
      is_voluntary: 1, //类型：Number  必有字段  备注：时候自愿 1是 2 否
      reason: "", //类型：String  可有字段  备注：不自愿理由
    };
    this.$axios.post("/train/order/refund", data).then((res) => {
      if (res.code === 0) {
        this.setState({
          isSegmentsModalBtnStatus: false,
          isSegmentsModal: false,
        });
        message.success(res.msg);
        this.props.history.push({
          pathname: "/refundDetail/" + res.data.refund_no,
          query: { changeType: true },
        });
      } else {
        message.warning(res.msg);
        this.setState({
          isSegmentsModalBtnStatus: false,
        });
      }
    });
  }

  render() {
    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        this.setState({
          selectPassengerList: selectedRows,
        });
      },
      getCheckboxProps: (record) => {
        if (record.status) {
          return { disabled: true };
        }
      },
    };
    return (
      <div className="order_refund">
        <div className="detail_template detail_header">
          <div className="header_left">
            <div className="left_no">
              <div className="header_title">订单编号</div>
              <p>{this.state.orderNo}</p>
            </div>

            <div className="left_box">
              <p>
                <span className="header_title">申请人</span>
                {this.state.detailData.book_user || "-"}
              </p>
              <p>
                <span className="header_title">预定时间</span>
                {this.state.detailData.created_at || "-"}
              </p>
              <p>
                <span className="header_title">退票状态</span>
                <span
                  style={{
                    color:
                      this.state.detailData.status === 1
                        ? "#FB9826"
                        : this.state.detailData.status === 2
                        ? "#FF0000"
                        : this.state.detailData.status === 3
                        ? "#5AB957"
                        : this.state.detailData.status === 4 &&
                          this.state.detailData.refund_orders.length < 1 
                        ? "#0070E2"
                        : this.state.detailData.status === 4 &&
                          this.state.detailData.refund_orders.length > 0
                        ? "#FF0000"
                        : this.state.detailData.status === 4 
                        ? "#fb9826"
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
                    "占座中"
                  ) : this.state.detailData.status === 2 ? (
                    "待支付"
                  ) : this.state.detailData.status === 3 ? (
                    "待出票"
                  ) : this.state.detailData.status === 4 &&
                    this.state.detailData.refund_orders.length < 1 ? (
                    "已出票"
                  ) : this.state.detailData.status === 4 &&
                    this.state.detailData.refund_orders.length > 0 ? (
                    "已退票"
                  ) : this.state.detailData.status === 4 ? (
                    "已改签"
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
                  ) : this.state.detailData.status === 7 &&
                    this.state.detailData.refund_orders.length > 0 ? (
                    "已退票"
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
                    href={`/pay/${this.imageBase(this.state.detailData.order_no)}`}
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

        <div className="detail_template detail_ticket_info">
          <div className="template_title">
            <p>车次信息</p>
            <div className="title_option"></div>
          </div>

          <div className="ticket_info">
            <div className="info_box">
              <p>{this.state.detailData.train_number || "-"}</p>
              <ViaStopPopover
                data={this.state.viaStopPopoverMessage}
                popoverStatus={this.state.viaStopPopover}
                popoverData={this.state.viaStopData}
                popoverPosition="bottomLeft"
                close={this.closeViaStopPopover}
                open={this.openViaStopMessage}
              ></ViaStopPopover>
            </div>

            <div className="info_date">
              {this.state.detailData.segments
                ? `${this.$moment(
                    this.state.detailData.segments[0].departure_time
                  ).format("YYYY-MM-DD")}（${this.$moment(
                    this.state.detailData.segments[0].departure_time
                  ).format("ddd")}）`
                : "-"}
            </div>

            <div className="info_address">
              <div className="address_list">
                <span>始</span>
                <p>
                  {this.state.detailData.segments
                    ? this.$moment(
                        this.state.detailData.segments[0].departure_time
                      ).format("HH:mm")
                    : "-"}
                </p>
                {this.state.detailData.segments
                  ? this.state.detailData.segments[0].from_city
                  : "-"}
              </div>
              <div className="address_icon">
                <img src={TicketIcon} alt="航程图标"></img>
              </div>
              <div className="address_list">
                <span>终</span>
                <p>
                  {this.state.detailData.segments
                    ? this.$moment(this.state.detailData.segments[0].arrive_time).format(
                        "HH:mm"
                      )
                    : "-"}
                </p>
                {this.state.detailData.segments
                  ? this.state.detailData.segments[0].to_city
                  : "-"}
              </div>
            </div>

            <div className="info_time">
              行程：
              {this.state.detailData.segments
                ? `${Math.floor(
                    Number(this.state.detailData.segments[0].travel_time) / 60
                  )}小时${Math.floor(
                    Number(this.state.detailData.segments[0].travel_time) % 60
                  )}分`
                : "-"}
            </div>

            <div className="info_cabin">
              席别：
              {this.state.detailData.segments
                ? this.state.detailData.segments[0].seat
                : "-"}
            </div>
          </div>
        </div>

        <div className="detail_template detail_insurance">
          <div className="template_title">
            <p>
              <img src={InsuranceIcon} alt="保险图标"></img>
              保险服务
            </p>
          </div>
          <div className="insurance_main">
            {Number(this.state.detailData.insurance_price) > 10 ? (
              <>
                <div className="main_title">已选保险</div>
                <div className="main_info">
                  {this.state.detailData.insurance_msg
                    ? this.state.detailData.insurance_msg.insure_desc
                    : "-"}
                </div>
                <div className="main_price">
                  <span>
                    &yen;
                    {this.state.detailData.insurance_price || "-"}
                  </span>
                  元/人
                </div>
              </>
            ) : (
              "未购买保险"
            )}
          </div>
        </div>

        <div className="detail_template detail_passenger">
          <div className="template_title">
            <p>乘车人选择</p>
          </div>
          <div className="passenger_main">
            <Table
              size="small"
              pagination={false}
              dataSource={this.state.detailData.passengers}
              rowKey="id"
              rowSelection={{
                ...rowSelection,
              }}
            >
              <Column
                title="乘车人"
                render={(render) => (
                  <>
                    {render.PassengerName}
                    {render.status ? (
                      <div
                        className="passenger_status_mask"
                        style={{
                          color:
                            render.status === "change"
                              ? "#fb9826"
                              : render.status === "refund"
                              ? "#FF0000"
                              : "#FF0000",
                        }}
                      >
                        {render.status === "change"
                          ? "已改签"
                          : render.status === "refund"
                          ? "已退票"
                          : "订单状态已修改"}
                      </div>
                    ) : (
                      ""
                    )}
                  </>
                )}
              />
              <Column
                title="乘客类型"
                dataIndex="PassengerType"
                render={(text) =>
                  text === "ADT" ? "成人" : text === "CHD" ? "儿童" : text
                }
              />
              <Column title="座位号" dataIndex="seat_info" />
              <Column title="票号" dataIndex="ticket_no" />
              <Column title="票面价" dataIndex="ticket_price" />
              <Column title="服务费" dataIndex="service_price" />
              <Column title="保险" dataIndex="insurance_price" />
              <Column title="结算价" dataIndex="need_pay_amount" />
            </Table>
          </div>
        </div>

        <div className="detail_template detail_order_info">
          <div className="template_title">
            <p>订单信息</p>
          </div>
          <div className="order_info_main">
            <div className="main_list">
              联系人：
              {this.state.detailData.book_user_name || "-"}
            </div>
            <div className="main_list">
              手机号：
              {this.state.detailData.phone || "-"}
            </div>
            <div className="main_list">
              邮箱：
              {this.state.detailData.mail || "-"}
            </div>
          </div>
        </div>

        <div className="button_box">
          <Button className="back_btn" onClick={() => this.jumpBack()}>
            返回
          </Button>
          <Button
            className="submit_box"
            type="primary"
            onClick={() => this.getRefundData()}
          >
            提交退票
          </Button>
        </div>

        <RefundOrderModal
          isSegmentsModalType="退票"
          isSegmentsModal={this.state.isSegmentsModal}
          isSegmentsModalData={this.state.isSegmentsModalData}
          isSegmentsModalBtnStatus={this.state.isSegmentsModalBtnStatus}
          submitModalBtn={() => this.submitModalBtn()}
          closeModalBtn={() => this.closeModalBtn()}
        ></RefundOrderModal>
      </div>
    );
  }
}
