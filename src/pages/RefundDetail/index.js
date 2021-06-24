/*
 * @Description: 退票详情
 * @Author: mzr
 * @Date: 2021-06-21 16:18:48
 * @LastEditTime: 2021-06-23 18:41:06
 * @LastEditors: mzr
 */
import React, { Component } from 'react'

import { message, Table , Button } from "antd";

import InsuranceIcon from "../../static/insurance_icon.png"; // 保险图标
import TicketIcon from "../../static/trip_icon.png"; // 行程图标

import ViaStopPopover from "../../components/viaStopPopover"; // 经停站组件

import "./RefundDetail.scss";

const { Column } = Table;

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state= {
      orderNo: "", // 订单号
      detailData: {}, // 订单详情
      
      viaStopPopoverMessage: {}, // 组装信息
      viaStopPopover: "", // 经停站信息弹窗
      viaStopData: [], // 经停站数据
    }
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
        this.setState({
          detailData: res.data,
        });
        console.log("详情",this.state.detailData)
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
        pathname: "/renfundList/",
      });
    }
  }

  render() {
    return (
      <div className="refund_detail">
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
                    "退票失败"
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
              ):("")}
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
          ):("")}
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
                render={(text) => text || "-"}
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
              <Column 
                title="票号" 
                dataIndex="ticket_no"
                render={(text) => text || "-"}
              />
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
        </div>
        
        <div className="button_box">
          <Button className="back_btn" onClick={() => this.jumpBack()}>
            返回
          </Button>
        </div>
      </div>
    )
  }
}
