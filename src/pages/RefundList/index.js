/*
 * @Description: 退票列表
 * @Author: mzr
 * @Date: 2021-06-21 16:16:31
 * @LastEditTime: 2021-07-01 18:08:38
 * @LastEditors: wish.WuJunLong
 */
import React, { Component } from 'react'

import './RefundList.scss'

import { Base64 } from "js-base64";

import { Button, Pagination, Table, message} from "antd";

import CancelOrderModal from "../../components/cancelOrderModal"; // 取消/退票确认弹窗

const { Column } = Table;

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {

      refundList: [], // 订单列表
      tableLoading: true, //  表格加载

      orderStatusList:["全部","退票中","已退票","已取消","退票失败"],
      orderStatusActive: "全部",
      orderNumberData: {}, // 订单状态数量

      orderSearch: {
        status:"", // 退票状态
      },

      isSegmentsModal: false, // 取消订单弹窗
      isSegmentsModalData: {}, // 弹窗数据
      isSegmentsModalType: "", // 弹窗状态
      isSegmentsModalBtnStatus: false, // 弹窗按钮状态
    }
  }

  componentDidMount() {

    this.getRefundList();
    this.getRefundDataCount();
  
  }

  // 获取退票列表
  getRefundList() {
    let data = this.state.orderSearch
    this.$axios.post("/train/order/refund/list",data).then((res) => {
      if(res.code === 0) {
        this.setState({
          refundList: res.data,
          tableLoading: false
        })
        console.log('退票列表',this.state.refundList)
      }else {
        message.warning(res.msg);
      }
    })
  }

  // 头部状态切换
  async isActiveHeader(val) {
    console.log('头部状态',val)
    let data = this.state.orderSearch;
    data.status =
      val === "退票中" ? "1" : val === "已退票" ? "2" : val === "已取消" ? "3" : val === "退票失败" ? "5" : "";
    await this.setState({
      orderSearch: data,
      orderStatusActive: val,
    });
    await this.getRefundList();
  }

  // 获取退票列表数量
  getRefundDataCount() {
    this.$axios.get("/train/order/refund/count").then((res) => {
      if(res.code === 0) {
        this.setState({
          orderNumberData: res.data
        })
      }else {
        message.warning(res.msg)
      }
    })
  }

  // 列表分页切换
  changePagination = async (page, pageSize) => {
    let data = this.state.orderSearch
    data.page = page;
    data.limit = pageSize;
    await this.setState({
      orderSearch: data,
    });
  };


  // 跳转退票详情
  jumpDetail(val) {
    this.props.history.push({ pathname: "/refundDetail/" + val.refund_no });
  }

  // 打开确认取消弹窗
  orderCancel(val) {
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
    console.log('退票',val)
    let data = {
      channel: "Di", //类型：String  必有字段  备注：渠道
      source: val.source, //类型：String  必有字段  备注：数据源
      order: {
        //类型：Object  必有字段  备注：订单信息
        order_no: val.train_order_no, //类型：String  必有字段  备注：订单号
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
        this.getRefundList();
        this.getRefundDataCount();
      } else {
        message.warning(res.msg);
      }
    });
  }

  render() {
    return (
      <div className="refund_list">

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
                  ? this.state.refundList.total || 0
                  : item === "退票中"
                  ? this.state.orderNumberData['apply'] || 0
                  : item === "已退票"
                  ? this.state.orderNumberData['over'] || 0
                  : item === "已取消"
                  ? this.state.orderNumberData['channel'] || 0
                  : item === "退票失败"
                  ? this.state.orderNumberData['fail'] || 0
                  : 0}
              </span>
            </div>
          ))}
        </div>

        <div className="order_main">
          <div className="main_search"></div>

          <div className="main_table">
            <Table
              dataSource={this.state.refundList.data}
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
                title="票号"
                dataIndex="ticket_number"
                render={(text) => text || "-"}
              />
              <Column
                title="票价"
                dataIndex="ticket_price"
                render={(text) => text || "-"}
              />
              <Column
                title="保险"
                dataIndex="inurance_price"
                render={(text) => text || "-"}
              />
              <Column
                title="服务费"
                dataIndex="service_price"
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
              <Column
                title="退款时间"
                dataIndex="refund_time"
                render={(text) => text || "-"}
              />
              <Column
                title="退票状态"
                dataIndex="status"
                render={(text) => (
                  <span
                    style={{
                      color:
                        text === 1
                          ? "#0070E2"
                          : text === 5
                          ? "#FF0000"
                          : "#333333",
                    }}
                  >
                    {text === 1 ? (
                      "退票中"
                    ) : text === 2 ? (
                      "已退票"
                    ) : text === 3 ? (
                      "已取消"
                    ) : text === 5 ? (
                      "退票失败"
                    ) : (
                      text
                    )}
                  </span>
                )}
              />
              <Column
                title="申请人"
                render={(text,render) => render.train_order.book_user || "-"}
              />
              <Column
                title="申请时间"
                dataIndex="created_at"
                render={(text) => this.$moment(text).format("YY-MM-DD HH:mm") || "-"}
              />
            </Table>

            <div className="table_pagination">
              <Pagination
                current={this.state.refundList.current_page}
                total={this.state.refundList.total}
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
    )
  }
}
