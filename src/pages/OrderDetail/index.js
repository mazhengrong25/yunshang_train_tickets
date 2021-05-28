/*
 * @Description: 订单详情
 * @Author: wish.WuJunLong
 * @Date: 2021-05-25 14:19:39
 * @LastEditTime: 2021-05-26 18:07:25
 * @LastEditors: wish.WuJunLong
 */

import React, { Component } from "react";

import { Button, message, Table, Popover } from "antd";

import TicketIcon from "../../static/trip_icon.png"; // 行程图标
import InsuranceIcon from "../../static/insurance_icon.png"; // 保险图标

import ViaStopPopover from "../../components/viaStopPopover"; // 经停站组件

import { Base64 } from "js-base64";

import "./OrderDetail.scss";

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
  refreshData() {
    this.getDetailData();
  }

  render() {
    return (
      <div className="order_detail">
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
                        ? "#0070E2"
                        : this.state.detailData.status === 2
                        ? "#FF0000"
                        : this.state.detailData.status === 3
                        ? "#5AB957"
                        : this.state.detailData.status === 4
                        ? "#333333"
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
                    type="primary"
                    className="jump_order_pay"
                    type="link"
                    href={`http://192.168.0.187/pay/${Base64.encode(
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
              {this.state.detailData.created_at
                ? `${this.$moment(this.state.detailData.created_at).format(
                    "YYYY-MM-DD"
                  )}（${this.$moment(this.state.detailData.created_at).format("ddd")}）`
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
            <div className="main_list">手机号：{this.state.detailData.phone || "-"}</div>
            <div className="main_list">邮箱：{this.state.detailData.mail || "-"}</div>
          </div>
        </div>

        {/* <div className="detail_bottom_box">
          <Button>取消订单</Button>






        </div> */}
      </div>
    );
  }
}
