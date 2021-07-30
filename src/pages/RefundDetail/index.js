/*
 * @Description: 退票详情
 * @Author: mzr
 * @Date: 2021-06-21 16:18:48
 * @LastEditTime: 2021-07-30 10:53:57
 * @LastEditors: wish.WuJunLong
 */
import React, { Component } from "react";

import { message, Table, Button, Input, Popover } from "antd";

import InsuranceIcon from "../../static/insurance_icon.png"; // 保险图标
import TicketIcon from "../../static/trip_icon.png"; // 行程图标

import ViaStopPopover from "../../components/viaStopPopover"; // 经停站组件

// import CancelOrderModal from "../../components/cancelOrderModal"; // 取消确认弹窗

import "./RefundDetail.scss";

const { Column } = Table;
export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
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

  // 获取退票详情
  getDetailData() {
    if (!this.state.orderNo) {
      return message.warning("订单获取失败，请返回列表页重新进入");
    }
    this.$axios.get(`/train/order/refund/detail/${this.state.orderNo}`).then((res) => {
      if (res.code === 0) {
        let newViaStop = {
          key: 0,
          station: {
            departure_name: res.data.segments[0].from_city,
            arrive_name: res.data.segments[0].to_city,
          },
        };
        let newData = res.data;
        newData["key"] = 0;
        this.setState({
          viaStopPopoverMessage: newViaStop,
          detailData: newData,
        });
        console.log("详情", this.state.detailData);
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
        pathname: "/refundList/",
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
        order_no: this.state.detailData.order_no, //类型：String  必有字段  备注：订单号
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

  render() {
    return (
      <div className="refund_detail">
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
                <span className="header_title">退票状态</span>
                <span
                  style={{
                    color:
                      this.state.detailData.status === 1
                        ? "#0070E2"
                        : this.state.detailData.status === 5
                        ? "#FF0000"
                        : "#333333",
                  }}
                >
                  {this.state.detailData.status === 1 ? (
                    "退票中"
                  ) : this.state.detailData.status === 2 ? (
                    "已退票"
                  ) : this.state.detailData.status === 3 ? (
                    "已取消"
                  ) : this.state.detailData.status === 5 ? (
                    <Popover
                      content={this.state.detailData.status_remark}
                      title={false}
                      trigger="hover"
                    >
                      <span style={{ cursor: "pointer" }}>退票失败</span>
                    </Popover>
                  ) : (
                    this.state.detailData.status || "-"
                  )}
                </span>
              </p>
              {this.state.detailData.status === 2 ? (
                <p>
                  <span className="header_title">退票实际时间</span>
                  {this.state.detailData.refund_time || "-"}
                </p>
              ) : (
                ""
              )}
            </div>
          </div>

          {this.state.detailData.status === 2 ? (
            <div className="header_right">
              <div className="right_price_box">
                <p className="price">
                  <span className="price_title">退款金额</span>
                  &yen; {this.state.detailData.refund_total || 0}
                </p>
              </div>
            </div>
          ) : (
            ""
          )}
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
            {String(this.state.detailData.insurance_msg).length > 10 ? (
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
                    {this.state.detailData.insurance_msg
                      ? this.state.detailData.insurance_msg.default_dis_price
                      : "-"}
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
            <p>退票信息</p>
          </div>
          <div className="passenger_main">
            <Table
              size="small"
              pagination={false}
              dataSource={this.state.detailData.passengers}
              rowKey="id"
            >
              <Column
                title="乘车人"
                dataIndex="PassengerName"
                render={(text, render) => (
                  <>
                    {text}
                    <span
                      style={{
                        fontSize: 12,
                        marginLeft: 5,
                        color:
                          render.refund_status === 1
                            ? "#0070E2"
                            : render.refund_status === 2
                            ? "#5AB957"
                            : render.refund_status === 3
                            ? "#FF0000"
                            : "#333333",
                      }}
                    >
                      [
                      {render.refund_status === 1
                        ? "申请中"
                        : render.refund_status === 2
                        ? "成功"
                        : render.refund_status === 3
                        ? "失败"
                        : render.refund_status === 4
                        ? "已取消"
                        : render.refund_status}
                      ]
                    </span>
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
              <Column
                title="座位号"
                dataIndex="seat_info"
                render={(text) => text || "-"}
              />
              <Column title="票号" dataIndex="ticket_no" render={(text) => text || "-"} />
              <Column
                title="票面价"
                dataIndex="ticket_price"
                render={(text) => text || "-"}
              />
              <Column
                title="服务费"
                dataIndex="service_price"
                render={(text) => text || "-"}
              />
              <Column
                title="保险"
                dataIndex="insurance_price"
                render={(text) => text || "-"}
              />
              <Column
                title="结算价"
                dataIndex="total_price"
                render={(text) => text || "-"}
              />
              <Column
                title="退票费"
                dataIndex="refund_money"
                render={(text) => text || "-"}
              />
              <Column
                title="退款金额"
                dataIndex="refund_total"
                render={(text) => text || "-"}
              />
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

        <div className="button_box">
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
          {/* {this.state.detailData.status === 1 || this.state.detailData.status === 2 ? (
            <Button className="detail_btn" onClick={() => this.orderCancel("取消")}>
              取消订单
            </Button>
          ) : (
            ""
          )} */}
        </div>

        {/* <CancelOrderModal
          isSegmentsModalType={this.state.isSegmentsModalType}
          isSegmentsModal={this.state.isSegmentsModal}
          isSegmentsModalData={this.state.isSegmentsModalData}
          isSegmentsModalBtnStatus={this.state.isSegmentsModalBtnStatus}
          submitModalBtn={() => this.submitModalBtn()}
          closeModalBtn={() => this.closeModalBtn()}
        ></CancelOrderModal> */}
      </div>
    );
  }
}
