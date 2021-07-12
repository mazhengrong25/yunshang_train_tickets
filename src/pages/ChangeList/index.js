/*
 * @Description: 改签列表
 * @Author: wish.WuJunLong
 * @Date: 2021-06-08 09:26:48
 * @LastEditTime: 2021-07-12 13:40:34
 * @LastEditors: wish.WuJunLong
 */

import React, { Component } from "react";

import { Button, Pagination, Table, Popover, message } from "antd";

import "./ChangeList.scss";

import CancelOrderModal from "../../components/cancelOrderModal"; // 取消/退票确认弹窗

import { Base64 } from "js-base64";

const { Column } = Table;

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      orderStatusList: ["全部", "待支付", "改签中", "已改签", "已取消"],
      orderStatusActive: "全部",
      orderNumberData: {}, // 订单状态数量
      orderList: [], // 订单列表

      orderSearch: {
        dis_id: "", //类型：Number  必有字段  备注：分销商
        order_no: "", //类型：String  必有字段  备注：订单号
        ticket_number: "", //类型：String  必有字段  备注：票号
        from_station: "", //类型：String  必有字段  备注：出发地
        to_station: "", //类型：String  必有字段  备注：到达地
        train_date_start: "", //类型：String  必有字段  备注：出发时间start
        train_date_end: "", //类型：String  必有字段  备注：出发时间end
        pay_status: "", //类型：String  必有字段  备注：支付状态：1:未支付 2:已支付 3:已退款 4:已取消
        pay_type: "", //类型：String  必有字段  备注：支付方式：1:预存款 2：授信支付 3：易宝 4支付宝
        status: "", //类型：String  必有字段  备注：状态 1 占座中 2占座成功待支付 3待出票 4已出票 5已取消 6占座失败 7出票失败
        is_admin_book: "", //类型：String  必有字段  备注：0 否 1 是管理员代订
        is_settle: "", //类型：String  必有字段  备注：是否结算 1 是 0 否
        created_at_start: "", //类型：String  必有字段  备注：生单时间start
        created_at_end: "", //类型：String  必有字段  备注：生单时间end
        limit: "20", //类型：String  必有字段  备注：无
        page: "1", //类型：String  必有字段  备注：无
      },

      tableLoading: true, //  表格加载

      isSegmentsModal: false, // 取消订单弹窗
      isSegmentsModalData: {}, // 弹窗数据
      isSegmentsModalType: "", // 弹窗状态
      isSegmentsModalBtnStatus: false, // 弹窗按钮状态
    };
  }

  // 获取改签列表
  getChangeList() {
    let data = this.state.orderSearch;
    this.$axios.post("/train/order/change/list", data).then((res) => {
      if (res.code === 0) {
        this.setState({
          orderList: res.data,
          tableLoading: false,
        });
      } else {
        message.warning(res.msg);
      }
    });
  }

  // 头部状态切换
  async isActiveHeader(val) {
    let data = this.state.orderSearch;
    data.status =
      val === "待支付"
        ? "1"
        : val === "改签中"
        ? "2"
        : val === "已改签"
        ? "3"
        : val === "已取消"
        ? "5"
        : "";
    await this.setState({
      orderSearch: data,
      orderStatusActive: val,
    });
    await this.getChangeList();
  }

  // 获取改签列表数量
  getChangeDataCount() {
    let data = this.state.orderSearch;
    this.$axios.post("/train/order/change/count", data).then((res) => {
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
    await this.getOrderListData();
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
        order_no: val.train_order_no, //类型：String  必有字段  备注：订单号
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
        this.getChangeDataCount();
        this.getChangeList();
      } else {
        message.warning(res.msg);
      }
    });
  }

  componentDidMount() {
    this.getChangeDataCount();
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
                  ? this.state.orderList.total || 0
                  : item === "改签中"
                  ? this.state.orderNumberData[1] || 0
                  : item === "待支付"
                  ? this.state.orderNumberData[2] || 0
                  : item === "已改签"
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
                        href={`${this.$parentUrl}pay/${Base64.encode(render.order_no)}`}
                      >
                        付
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
                dataIndex="insurance_price"
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
                      "改签中"
                    ) : text === 2 ? (
                      "待支付"
                    ) : text === 3 ? (
                      "改签成功"
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
                      "出票失败"
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
                pageSize={20}
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
