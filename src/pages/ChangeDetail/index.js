/*
 * @Description: 改签详情
 * @Author: wish.WuJunLong
 * @Date: 2021-06-08 10:49:01
 * @LastEditTime: 2021-07-01 18:08:53
 * @LastEditors: wish.WuJunLong
 */

import React, { Component } from "react";

import { Button, message, Table, Popover, Spin } from "antd";

import "./ChangeDetail.scss";

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

  render() {
    return (
      <div className="change_detail">
        <Spin spinning={this.state.pageLoading} tip="获取数据中...">
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
                  <span className="header_title">申请时间</span>
                  {this.state.detailData.created_at || "-"}
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
                      "改签中"
                    ) : this.state.detailData.status === 2 ? (
                      "待支付"
                    ) : this.state.detailData.status === 3 ? (
                      "改签成功"
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
                      "出票失败"
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
              {this.state.detailData.train_order &&
                this.state.detailData.train_order.segments.map((item, index) => (
                  <div className="box_list" key={index}>
                    <div
                      className="list_type"
                      style={{
                        color: index === 0 ? "#FF0000" : "#0070E2",
                        backgroundColor: index === 0 ? "#FFE1E1" : "#DFEEFE",
                      }}
                    >
                      {index === 0 ? "新车次" : "原车次"}
                    </div>
                    <div className="list_number">{item.train_number}</div>
                    <div className="list_time">
                      {this.$moment(item.departure_time).format("YYYY-MM-DD")}
                      {`（${this.$moment(item.departure_time).format("ddd")}）`}
                    </div>
                    <div className="list_info">
                      <div className="info_status">始</div>
                      <div className="info_date">
                        {this.$moment(item.departure_time).format("hh:mm")}
                      </div>
                      <div className="info_address">{item.from_city}</div>
                      <div className="info_icon"></div>
                      <div className="info_status">终</div>
                      <div className="info_date">
                        {this.$moment(item.arrive_time).format("hh:mm")}
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
          </div>
        </Spin>
      </div>
    );
  }
}
