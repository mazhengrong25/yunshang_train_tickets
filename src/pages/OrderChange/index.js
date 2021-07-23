/*
 * @Description: 改签详情
 * @Author: wish.WuJunLong
 * @Date: 2021-06-08 10:49:01
 * @LastEditors: wish.WuJunLong
 * @LastEditTime: 2021-07-15 15:59:59
 */

import React, { Component } from "react";

import { Button, message, Table, Popover, DatePicker, Modal } from "antd";

import TicketSearchPage from "../TicketInquiry/index"; // 机票列表
import ChangeOrderModal from "../../components/cancelOrderModal"; // 改签确认弹窗

import OccupySeatModal from "../../components/occupySeatModal"; // 占座弹窗

import { Base64 } from "js-base64";

import "./OrderChange.scss";

const { Column } = Table;

let child;

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      changeType: false, //  改签
      orderNo: "", // 订单号
      detailData: {}, // 订单详情

      selectPassengerList: [], // 选中乘客

      newTicketTime: null, // 新车次时间
      newTicketModal: false, // 新车次弹窗
      newChangeTicketData: {}, // 查询车次完整数据
      changeTicketData: {}, // 新车次信息

      isSegmentsModal: false, // 取消订单弹窗
      isSegmentsModalData: {}, // 弹窗数据
      isSegmentsModalType: "", // 弹窗状态
      isSegmentsModalBtnStatus: false, // 弹窗按钮状态

      // 占座中弹窗
      isOccupyNo: "",
      isOccupyModal: false,
      isOccupyStatus: 0,
    };
  }

  async componentDidMount() {
    await this.setState({
      orderNo: this.props.match.params.id || "",
    });
    if (this.props.location.query && this.props.location.query.changeType) {
      await this.setState({
        changeType: this.props.location.query.changeType,
      });
    } else {
    }
    await this.getDetailData();
  }

  // 获取改签详情
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

  // 查询新车次
  searchNewTicket() {
    if (!this.state.newTicketTime) {
      return message.warning("请选择出发日期");
    }

    let data = {
      departure: this.state.detailData.from_station,
      arrive: this.state.detailData.to_station,
      departure_date: this.$moment(this.state.newTicketTime).format("YYYY-MM-DD"),
      is_change: true,
      change_time: this.state.detailData.train_date,
    };

    this.setState({
      newTicketModal: true,
      newTicketSearchData: data,
    });
  }
  // 改签时间
  changeNewTime = (time) => {
    this.setState({
      newTicketTime: time,
    });
  };

  // 新车次数据
  getNewTicketData = (val, oval) => {
    console.log(val, oval);
    if (val && oval) {
      let data = {
        change:
          this.state.detailData.segments[0].departure_time ===
            val.station.departure_name &&
          this.state.detailData.segments[0].arrive_name === val.station.arrive_name, //类型：Boolean  必有字段  备注：是否变更站点，默认否
        departure: val.station.departure_name, //类型：String  必有字段  备注：出发地
        arrive: val.station.arrive_name, //类型：String  必有字段  备注：到达地
        departure_code: val.station.departure_code, //类型：String  必有字段  备注：出发点三字码
        arrive_code: val.station.arrive_code, //类型：String  必有字段  备注：到达地三字码
        code: val.train.code, //类型：String  必有字段  备注：车次
        number: val.train.number, //类型：String  必有字段  备注：列车号
        departure_date: `${this.$moment(val.train.departure_date).format("YYYY-MM-DD")} ${
          val.train.departure
        }`, //类型：String  必有字段  备注：出发日期
        arrive_date: `${this.$moment(val.train.departure_date)
          .add(val.train.days, "days")
          .format("YYYY-MM-DD")} ${val.train.arrive}`, //类型：String  必有字段  备注：到达日期
        seat_number: "", //类型：String  必有字段  备注：无
        travel_time: val.train.run_minute, //类型：String  必有字段  备注：行程时长
        seat: oval.name, //类型：String  必有字段  备注：座位等级中文
        seat_level: oval.code, //类型：String  必有字段  备注：座位等级
        train_level: val.train.type, //类型：String  必有字段  备注：火车类型
      };
      console.log(data);

      this.setState({
        newTicketModal: false,
        changeTicketData: data,
        newChangeTicketData: oval,
      });
    }
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

  // 组装改签数据
  getChangeData() {
    if (this.state.selectPassengerList.length < 1) {
      return message.warning("请选择需要改签的乘客");
    }
    if (JSON.stringify(this.state.changeTicketData) === "{}") {
      return message.warning("请选择新车次");
    }

    let data = {
      segments: [
        {
          departure_time: this.state.changeTicketData.departure_date,
          train_number: this.state.changeTicketData.code,
          from_city: this.state.changeTicketData.departure,
          arrive_time: this.state.changeTicketData.arrive_date,
          to_city: this.state.changeTicketData.arrive,
          seat: this.state.changeTicketData.seat,
        },
      ],
      passengers: this.state.selectPassengerList,
    };

    console.log(data);
    this.setState({
      isSegmentsModal: true,
      isSegmentsModalType: "改签",
      isSegmentsModalData: data,
      isSegmentsModalBtnStatus: false,
    });
  }

  // 关闭改签弹窗
  closeModalBtn() {
    this.setState({
      isSegmentsModal: false,
    });
  }

  // 确认改签提交
  submitModalBtn() {
    this.setState({
      isSegmentsModalBtnStatus: true,
    });
    let passengerId = [];
    let newsSeat_info = {};
    this.state.selectPassengerList.forEach((item) => {
      passengerId.push(item.id);
      if (item.id && item.seat_info) {
        newsSeat_info[item.id] = item.seat_info;
      }
    });

    let data = {
      channel: "Di", //类型：String  必有字段  备注：渠道
      source: "YunKu", //类型：String  必有字段  备注：数据源
      order: {
        //类型：Object  必有字段  备注：订单详情
        order_no: this.state.detailData.order_no, //类型：String  必有字段  备注：正常单订单号号
        out_trade_no: this.state.detailData.out_trade_no, //类型：String  必有字段  备注：正常单第三方订单号
        standing: false, //类型：Boolean  必有字段  备注：是否接受无座，默认否
        is_choose_seat: false, //类型：Boolean  必有字段  备注：是否占座，默认否
        choose_seat: "", //类型：String  必有字段  备注：占座内容
      },
      train: this.state.changeTicketData,
      segment_id: this.state.detailData.segments[0].id, //类型：Number  必有字段  备注：原航段ID
      passengers: passengerId,
      seat_info: newsSeat_info,
      price: this.state.newChangeTicketData.price, //类型：Number  必有字段  备注：票价
    };

    console.log(data);

    this.$axios.post("/train/order/change/reserve", data).then((res) => {
      if (res.code === 0) {
        this.setState({
          isSegmentsModalBtnStatus: false,
          isSegmentsModal: false,
        });

        this.openOccupy(res.data.change_order_no);

        // this.getDetailData();
        // message.success(res.msg);
        // this.props.history.push({
        //   pathname: "/changeDetail/" + res.data.change_order_no,
        // });
      } else {
        this.setState({
          isSegmentsModalBtnStatus: false,
        });
        message.warning(res.msg);
      }
    });
  }

  // 占座成功
  orderSuccess = () => {
    window.location.href = `/pay/${Base64.encode(this.state.isOccupyNo)}`;
  };

  onRef(ref) {
    child = ref;
  }

  // 打开占座弹窗
  async openOccupy(val) {
    await this.setState({
      isOccupyNo: val,
      isOccupyModal: true,
      isOccupyStatus: Math.floor(Math.random() * 100) + 20,
    });
    await child.startTime();
  }

  // 跳转详情
  closeOccupy = () => {
    this.props.history.push({ pathname: "/changeDetail/" + this.state.isOccupyNo });
  };
  // 重选车次
  jumpOccupy = () => {
    this.props.history.goBack();
  };

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
      <div className="order_change">
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
                        : this.state.detailData.status === 4 &&
                          this.state.detailData.refund_orders.length < 1 &&
                          this.state.detailData.change_orders.length < 1
                        ? "#0070E2"
                        : this.state.detailData.status === 4 &&
                          this.state.detailData.refund_orders.length > 0
                        ? "#FF0000"
                        : this.state.detailData.status === 4 &&
                          this.state.detailData.change_orders.length > 0
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
                    "出票中"
                  ) : this.state.detailData.status === 4 &&
                    this.state.detailData.refund_orders.length < 1 &&
                    this.state.detailData.change_orders.length < 1 ? (
                    "已出票"
                  ) : this.state.detailData.status === 4 &&
                    this.state.detailData.refund_orders.length > 0 ? (
                    "已退票"
                  ) : this.state.detailData.status === 4 &&
                    this.state.detailData.change_orders.length > 0 ? (
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
              <Column title="结算价" dataIndex="total_price" />
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
                      color: "#0070E2",
                      backgroundColor: "#DFEEFE",
                    }}
                  >
                    原车次
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

            <div className="change_new_ticket">
              <div className="select_new_data">
                <div
                  className="list_type"
                  style={{
                    color: "#FF0000",
                    backgroundColor: "#FFE1E1",
                  }}
                >
                  新车次
                </div>

                <div className="select_new_time">
                  <p>出发日期</p>
                  <DatePicker
                    value={this.state.newTicketTime}
                    onChange={this.changeNewTime}
                    showToday={false}
                    disabledDate={(current) => {
                      return (
                        (current &&
                          current < this.$moment().subtract(1, "days").endOf("day")) ||
                        (current && current > this.$moment().add(15, "days").endOf("day"))
                      );
                    }}
                  />
                </div>
                <Button
                  type="primary"
                  className="search_btn"
                  onClick={() => this.searchNewTicket()}
                >
                  查询车次
                </Button>
              </div>
              {JSON.stringify(this.state.changeTicketData) !== "{}" ? (
                <div className="ticket_data">
                  <div className="ticket_title_i">已选：</div>
                  <div className="list_number">{this.state.changeTicketData.code}</div>
                  <div className="list_time">
                    {this.$moment(this.state.changeTicketData.departure_date).format(
                      "YYYY-MM-DD"
                    )}
                    {`（${this.$moment(this.state.changeTicketData.departure_date).format(
                      "ddd"
                    )}）`}
                  </div>
                  <div className="list_info">
                    <div className="info_status">始</div>
                    <div className="info_date">
                      {this.$moment(this.state.changeTicketData.departure_date).format(
                        "hh:mm"
                      )}
                    </div>
                    <div className="info_address">
                      {this.state.changeTicketData.departure}
                    </div>
                    <div className="info_icon"></div>
                    <div className="info_status">终</div>
                    <div className="info_date">
                      {this.$moment(this.state.changeTicketData.arrive_date).format(
                        "hh:mm"
                      )}
                    </div>
                    <div className="info_address">
                      {this.state.changeTicketData.arrive}
                    </div>
                  </div>
                  <div className="list_cabin">
                    席别：
                    {this.state.changeTicketData.seat}
                  </div>

                  <div
                    className="remove_new_ticket"
                    onClick={() => this.setState({ changeTicketData: {} })}
                  >
                    <span></span>
                    删除
                  </div>
                </div>
              ) : (
                ""
              )}
            </div>
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
            onClick={() => this.getChangeData()}
          >
            提交改签
          </Button>
        </div>

        <Modal
          title="选择新车次"
          centered
          visible={this.state.newTicketModal}
          onCancel={() => this.setState({ newTicketModal: false })}
          destroyOnClose={true}
          footer={false}
          width={1000}
          getContainer={false}
          maskClosable={false}
          keyboard={false}
        >
          <div className="new_ticket_box">
            <TicketSearchPage
              type={this.state.newTicketSearchData}
              getNewTicketData={this.getNewTicketData}
            ></TicketSearchPage>
          </div>
        </Modal>

        {/* 订单确认弹窗 */}
        <ChangeOrderModal
          isSegmentsModalType="改签"
          isSegmentsModal={this.state.isSegmentsModal}
          isSegmentsModalData={this.state.isSegmentsModalData}
          isSegmentsModalBtnStatus={this.state.isSegmentsModalBtnStatus}
          submitModalBtn={() => this.submitModalBtn()}
          closeModalBtn={() => this.closeModalBtn()}
        ></ChangeOrderModal>

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
