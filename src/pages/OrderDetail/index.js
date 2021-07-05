/*
 * @Description: 订单详情
 * @Author: wish.WuJunLong
 * @Date: 2021-05-25 14:19:39
 * @LastEditTime: 2021-07-01 16:58:53
 * @LastEditors: wish.WuJunLong
 */
import React, { Component } from "react";

import { Button, message, Table, Popover, Input, Spin } from "antd";

import TicketIcon from "../../static/trip_icon.png"; // 行程图标
import InsuranceIcon from "../../static/insurance_icon.png"; // 保险图标

import ViaStopPopover from "../../components/viaStopPopover"; // 经停站组件

import CancelOrderModal from "../../components/cancelOrderModal"; // 取消/退票确认弹窗

import { Base64 } from "js-base64";

import "./OrderDetail.scss";

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
    };
  }
  async componentDidMount() {
    await this.setState({
      orderNo: this.props.match.params.id || "",
    });
    await this.getDetailData();
  }

  // 获取订单详情
  getDetailData() {
    if (!this.state.orderNo) {
      return message.warning("订单获取失败，请返回列表页重新进入");
    }
    this.$axios.post(`/train/order/detail/${this.state.orderNo}`).then((res) => {
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
        setTimeout(() => {
          this.setState({
            pageLoading: false,
          });
        }, 500);
      } else {
        message.warning(res.data);
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

  // 刷新页面
  async refreshData() {
    await this.setState({
      pageLoading: true,
    });
    await this.getDetailData();
  }

  imageBase(val) {
    return Base64.encode(val);
  }

  // 跳转改签页面
  jumpChangePage() {
    this.props.history.push({
      pathname: "/orderChange/" + this.state.orderNo,
      query: { changeType: true },
    });
  }
  // 跳转退票页面
  jumpRefundPage() {
    this.props.history.push({
      pathname: "/orderRefund/" + this.state.orderNo,
      query: { changeType: true },
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
    this.$axios.post("/train/order/cancel", data).then((res) => {
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
      order_no: this.state.detailData.order_no,
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

  render() {
    return (
      <div className="order_detail">
        <Spin spinning={this.state.pageLoading} tip="获取数据中...">
          <div className="detail_template detail_header">
            <div className="header_left">
              <div className="left_no">
                <div className="header_title">订单编号</div>
                <p>{this.state.orderNo}</p>
              </div>

              <div className="left_box">
                <p>
                  <span className="header_title">订票员</span>
                  {this.state.detailData.book_user || "-"}
                </p>
                <p>
                  <span className="header_title">预定时间</span>
                  {this.state.detailData.created_at || "-"}
                </p>
                <p>
                  <span className="header_title">订单状态</span>
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
                            this.state.detailData.refund_order === null &&
                            this.state.detailData.change_order === null
                          ? "#0070E2"
                          : this.state.detailData.status === 4 &&
                            this.state.detailData.refund_order === null &&
                            this.state.detailData.change_order !== null
                          ? "#fb9826"
                          : this.state.detailData.status === 4 &&
                            this.state.detailData.refund_order !== null &&
                            this.state.detailData.change_order === null
                          ? "#FF0000"
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
                      this.state.detailData.refund_order === null &&
                      this.state.detailData.change_order === null ? (
                      "已出票"
                    ) : this.state.detailData.status === 4 &&
                      this.state.detailData.refund_order !== null ? (
                      "已退票"
                    ) : this.state.detailData.status === 4 &&
                      this.state.detailData.change_order !== null ? (
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
                      this.state.detailData.refund_order === null ? (
                      "出票失败"
                    ) : this.state.detailData.status === 7 &&
                      this.state.detailData.refund_order !== null ? (
                      "已退票"
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
                      href={`${this.$parentUrl}pay/${this.imageBase(
                        this.state.detailData.order_no
                      )}`}
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
                      ? this.$moment(
                          this.state.detailData.segments[0].arrive_time
                        ).format("HH:mm")
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

          <div className="detail_template detail_passenger">
            <div className="template_title">
              <p>乘客信息</p>
              {this.state.detailData.ticket_number ? (
                <div className="title_option">
                  取票号{this.state.detailData.ticket_number}
                </div>
              ) : (
                ""
              )}
            </div>
            <div className="passenger_main">
              {this.state.detailData.passengers &&
                this.state.detailData.passengers.map((item, index) => (
                  <div className="main_list" key={index}>
                    {item.PassengerType === "ADT" ? (
                      <>
                        <div className="list_type">成</div>
                        <div className="list_item">
                          <p className="list_title">姓名</p>
                          {item.PassengerName}
                        </div>
                        <div className="list_item">
                          <p className="list_title">身份证</p>
                          {item.CredentialNo}
                        </div>
                        <div className="list_item">
                          <p className="list_title">手机号</p>
                          {item.phone}
                        </div>
                        {this.state.detailData.status !== 1 &&
                        this.state.detailData.status !== 6 ? (
                          <>
                            <div className="list_item">
                              <p className="list_title">票号</p>
                              {item.ticket_no}
                            </div>
                            <div className="list_item">
                              <p className="list_title">座位</p>
                              {item.seat_info}
                            </div>
                          </>
                        ) : (
                          ""
                        )}
                      </>
                    ) : item.PassengerType === "CHD" ? (
                      <>
                        <div className="list_type">童</div>
                        <div className="list_item">
                          <p className="list_title">姓名</p>
                          {item.PassengerName}
                        </div>
                        <div className="list_item">
                          <p className="list_title">出生日期</p>
                          {item.Birthday}
                        </div>
                        {this.state.detailData.status !== 1 &&
                        this.state.detailData.status !== 6 ? (
                          <>
                            <div className="list_item">
                              <p className="list_title">票号</p>
                              {item.ticket_no}
                            </div>
                            <div className="list_item">
                              <p className="list_title">座位</p>
                              {item.seat_info}
                            </div>
                          </>
                        ) : (
                          ""
                        )}
                      </>
                    ) : (
                      ""
                    )}
                  </div>
                ))}
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

          <div className="detail_template detail_price_info">
            <div className="template_title">
              <p>价格明细</p>
            </div>
            <div className="price_info_main">
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
                <Column title="票面价" dataIndex="ticket_price" />
                <Column title="服务费" dataIndex="service_price" />
                <Column title="保险" dataIndex="insurance_price" />
                <Column title="结算价" dataIndex="total_price" />
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
                手机号：{this.state.detailData.phone || "-"}
              </div>
              <div className="main_list">邮箱：{this.state.detailData.mail || "-"}</div>
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
            {this.state.detailData.status === 1 || this.state.detailData.status === 2 ? (
              <Button className="detail_btn" onClick={() => this.orderCancel("取消")}>
                取消订单
              </Button>
            ) : (
              ""
            )}
            {(this.state.detailData.status === 4 || this.state.detailData.status === 7) &&
            this.state.detailData.refund_order === null &&
            this.state.detailData.change_order === null ? (
              <Button className="detail_btn" onClick={() => this.jumpRefundPage()}>
                退票
              </Button>
            ) : (
              ""
            )}
            {this.state.detailData.status === 4 &&
            this.state.detailData.change_order === null &&
            this.state.detailData.refund_order === null ? (
              <Button className="detail_btn" onClick={() => this.jumpChangePage()}>
                改签
              </Button>
            ) : (
              ""
            )}
          </div>

          <CancelOrderModal
            isSegmentsModalType={this.state.isSegmentsModalType}
            isSegmentsModal={this.state.isSegmentsModal}
            isSegmentsModalData={this.state.isSegmentsModalData}
            isSegmentsModalBtnStatus={this.state.isSegmentsModalBtnStatus}
            submitModalBtn={() => this.submitModalBtn()}
            closeModalBtn={() => this.closeModalBtn()}
          ></CancelOrderModal>
        </Spin>
      </div>
    );
  }
}
