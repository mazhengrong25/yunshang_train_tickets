/*
 * @Description: 订单列表
 * @Author: wish.WuJunLong
 * @Date: 2021-05-25 13:46:24
 * @LastEditTime: 2021-07-01 12:04:40
 * @LastEditors: wish.WuJunLong
 */

import React, { Component } from "react";

import { Button, Pagination, Table, Popover, message } from "antd";

import CancelOrderModal from "../../components/cancelOrderModal"; // 取消/退票确认弹窗

import "./OrderList.scss";

import { Base64 } from "js-base64";

const { Column } = Table;

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      orderStatusList: ["全部", "占座中", "待支付", "待出票", "已取消"],
      orderStatusActive: "全部",
      orderNumberData: {}, // 订单状态数量
      orderList: [], // 订单列表
      tableLoading: false, // 订单表格加载
      orderSearch: {
        channel: "1", //类型：String  必有字段  备注：渠道1 web 2 miniapp 3 wechat
        order_no: "", //类型：String  必有字段  备注：订单号
        out_trade_no: "", //类型：String  必有字段  备注：外部订单号
        ticket_number: "", //类型：String  必有字段  备注：取票号（电子单号）
        from_station: "", //类型：String  必有字段  备注：出发
        to_station: "", //类型：String  必有字段  备注：到达
        pay_status: "", //类型：String  必有字段  备注：支付状态：1:未支付 2:已支付 3:已退款 4:已取消
        pay_type: "", //类型：String  必有字段  备注：支付方式：1:预存款 2：授信支付 3：易宝 4支付宝
        status: "", //类型：String  必有字段  备注：状态 1 占座中 2占座成功待支付 3已支付 4已出票 4已取消 5占座失败 6出票失败
        pro_center_id: "", //类型：String  必有字段  备注：利润中心ID
        is_admin_book: "", //类型：String  必有字段  备注：管理员代订 0否 1是
        is_settle: "", //类型：String  必有字段  备注：是否结算 1 是 0 否
        train_date_start: "", //类型：String  必有字段  备注：起飞开始
        train_date_end: "", //类型：String  必有字段  备注：起飞结束
        pay_time_start: "", //类型：String  必有字段  备注：支付开始
        pay_time_end: "", //类型：String  必有字段  备注：支付结束
        page: 1,
        limit: 20,
      },

      isSegmentsModal: false, // 取消订单弹窗
      isSegmentsModalData: {}, // 弹窗数据
      isSegmentsModalType: "", // 弹窗状态
      isSegmentsModalBtnStatus: false, // 弹窗按钮状态
    };
  }

  componentDidMount() {
    this.getOrderListData();
    this.getOrderNumber();
  }

  // 获取订单列表
  getOrderListData() {
    this.setState({
      orderList: [],
      tableLoading: true,
    });
    this.$axios.post("/train/order/list", this.state.orderSearch).then((res) => {
      if (res.code === 0) {
        this.setState({
          orderList: res.data,
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
      val === "占座中"
        ? "1"
        : val === "待支付"
        ? "2"
        : val === "待出票"
        ? "3"
        : val === "已取消"
        ? "5"
        : "";
    await this.setState({
      orderSearch: data,
      orderStatusActive: val,
    });
    await this.getOrderListData();
  }

  // 获取订单状态数量
  getOrderNumber() {
    this.$axios.post("/train/order/count", this.state.orderSearch).then((res) => {
      if (res.code === 0) {
        this.setState({
          orderNumberData: res.data,
        });
      }
    });
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
        this.getOrderNumber();
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
                  ? this.state.orderList.total || 0
                  : item === "占座中"
                  ? this.state.orderNumberData[1] || 0
                  : item === "待支付"
                  ? this.state.orderNumberData[2] || 0
                  : item === "待出票"
                  ? this.state.orderNumberData[3] || 0
                  : item === "已取消"
                  ? this.state.orderNumberData[5] || 0
                  : 0}
              </span>
            </div>
          ))}
        </div>

        <div className="order_main">
          <div className="main_search"></div>

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
                    {render.status === 1 || render.status === 2 ? (
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
                        href={`${this.$parentUrl}pay/${Base64.encode(
                          render.order_no
                        )}`}
                      >
                        付
                      </Button>
                    ) : (
                      ""
                    )}
                    {(render.status === 4 || render.status === 7) &&
                    render.refund_order === null &&
                    render.change_order === null ? (
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
                    {render.status === 4 &&
                    render.change_order === null &&
                    render.refund_order === null ? (
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
                    <p>
                      {this.$moment(render.segments[0].departure_time).format(
                        "YYYY-MM-DD HH:mm"
                      )}
                      -
                    </p>
                    <p>
                      {this.$moment(render.segments[0].arrive_time).format(
                        "YYYY-MM-DD HH:mm"
                      )}
                    </p>
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
                          ? "#5AB957"
                          : text === 4 &&
                            render.refund_order === null &&
                            render.change_order === null
                          ? "#0070E2"
                          : text === 4 &&
                            render.refund_order === null &&
                            render.change_order !== null
                          ? "#fb9826"
                          : text === 4 &&
                            render.refund_order !== null &&
                            render.change_order === null
                          ? "#FF0000"
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
                      "占座中"
                    ) : text === 2 ? (
                      "待支付"
                    ) : text === 3 ? (
                      "待出票"
                    ) : text === 4 &&
                      render.refund_order === null &&
                      render.change_order === null ? (
                      "已出票"
                    ) : text === 4 && render.refund_order !== null ? (
                      "已退票"
                    ) : text === 4 && render.change_order !== null ? (
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
                    ) : text === 7 && render.refund_order === null ? (
                      "出票失败"
                    ) : text === 7 && render.refund_order !== null ? (
                      "已退票"
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
                pageSize={20}
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
