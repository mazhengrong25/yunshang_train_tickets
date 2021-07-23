/*
 * @Description: 退票列表
 * @Author: mzr
 * @Date: 2021-06-21 16:16:31
 * @LastEditTime: 2021-07-23 13:46:38
 * @LastEditors: wish.WuJunLong
 */
import React, { Component } from "react";

import "./RefundList.scss";

// import { Base64 } from "js-base64";

import {
  Button,
  Pagination,
  Table,
  message,
  Popover,
  Input,
  Select,
  DatePicker,
} from "antd";

// import CancelOrderModal from "../../components/cancelOrderModal"; // 取消/退票确认弹窗

let timeout;
let currentValue;

const { Column } = Table;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      refundList: [], // 订单列表
      tableLoading: true, //  表格加载

      orderStatusList: ["全部", "退票中", "已退票", "已取消", "退票失败"],
      orderStatusActive: "全部",
      orderNumberData: {}, // 订单状态数量

      orderSearch: {
        orderType: "订单号",
        status: "", // 退票状态
        limit: 20, //类型：String  必有字段  备注：无
        page: 1, //类型：String  必有字段  备注：无
      },

      isSegmentsModal: false, // 取消订单弹窗
      isSegmentsModalData: {}, // 弹窗数据
      isSegmentsModalType: "", // 弹窗状态
      isSegmentsModalBtnStatus: false, // 弹窗按钮状态

      isAdmin: false, // 管理员状态

      disDataList: [], // 分销商列表
    };
  }

  componentDidMount() {
    this.getRefundList();
  }

  // 获取退票列表
  getRefundList() {
    this.setState({
      refundList: [],
      tableLoading: true,
    });
    let data = {
      refund_no: this.state.orderSearch.order_no, //类型：String  必有字段  备注：订单号
      passenger: this.state.orderSearch.passenger,
      ticket_number: this.state.orderSearch.ticket_number,
      dis_id: this.state.orderSearch.dis_id, //类型：Number  必有字段  备注：分销商
      start_date: this.state.orderSearch.start_date, //类型：String  必有字段  备注：生单时间start
      end_date: this.state.orderSearch.end_date, //类型：String  必有字段  备注：生单时间end
      limit: this.state.orderSearch.limit, //类型：String  必有字段  备注：无
      page: this.state.orderSearch.page, //类型：String  必有字段  备注：无
    };
    data["status"] = this.state.orderSearch.status ? [this.state.orderSearch.status] : [];
    this.$axios.post("/train/order/refund/list", data).then((res) => {
      if (res.code === 0) {
        this.getRefundDataCount();
        this.setState({
          refundList: res.data,
          tableLoading: false,
          isAdmin: res.is_admin,
        });
        console.log("退票列表", this.state.refundList);
      } else {
        message.warning(res.msg);
      }
    });
  }

  // 组装筛选数据
  async searchSubmit() {
    let data = this.state.orderSearch;

    if (data.timeData) {
      data.start_date = this.$moment(data.timeData[0]).format("YYYY-MM-DD");
      data.end_date = this.$moment(data.timeData[1]).format("YYYY-MM-DD");
    } else {
      data.start_date = "";
      data.end_date = "";
    }

    if (data.orderType === "订单号" && data.orderNo) {
      data.order_no = data.orderNo;
      data.ticket_number = "";
    } else if (data.orderType === "取票号" && data.orderNo) {
      data.ticket_number = data.orderNo;
      data.order_no = "";
    } else if (!data.orderNo) {
      data.ticket_number = "";
      data.order_no = "";
    }

    data.page = 1;

    await this.setState({
      orderSearch: data,
    });

    await this.getRefundList();
  }

  // 筛选数据输入框
  searchInput = (label, val) => {
    let data = this.state.orderSearch;
    data[label] = val.target.value;

    this.setState({
      orderSearch: data,
    });
  };

  // 筛选数据选择器
  searchSelect = (label, val) => {
    console.log(val);
    let data = this.state.orderSearch;
    data[label] = val;

    this.setState({
      orderSearch: data,
    });
  };

  // 分销商搜索
  handleSearch = (value) => {
    // if (this.delayedChange(value)) {
    if (value) {
      this.fetch(value, (data) => this.setState({ disDataList: data }));
    } else {
      this.setState({ disDataList: [] });
    }
  };

  fetch(value, callback) {
    let _that = this;
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    currentValue = value;

    function fake() {
      let data = {
        key: value,
      };
      _that.$axios.get("/searchDis", { params: data }).then((res) => {
        if (currentValue === value) {
          console.log(res);
          const data = [];
          res.forEach((r) => {
            data.push({
              value: r.id,
              text: r.company_name,
            });
          });
          callback(data);
        }
      });
    }

    timeout = setTimeout(fake, 300);
  }

  // 头部状态切换
  async isActiveHeader(val) {
    console.log("头部状态", val);
    let data = this.state.orderSearch;
    data.status =
      val === "退票中"
        ? 1
        : val === "已退票"
        ? 2
        : val === "已取消"
        ? 3
        : val === "退票失败"
        ? 5
        : "";
    await this.setState({
      orderSearch: data,
      orderStatusActive: val,
    });
    await this.getRefundList();
  }

  // 获取退票列表数量
  getRefundDataCount() {
    this.$axios.get("/train/order/refund/count").then((res) => {
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
    await this.getRefundList();
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
    console.log("退票", val);
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
      } else {
        message.warning(res.msg);
      }
    });
  }

  // 表单下载
  downloadExcel() {
    let data = {
      refund_no: this.state.orderSearch.order_no, //类型：String  必有字段  备注：订单号
      passenger: this.state.orderSearch.passenger,
      ticket_number: this.state.orderSearch.ticket_number,
      dis_id: this.state.orderSearch.dis_id, //类型：Number  必有字段  备注：分销商
      start_date: this.state.orderSearch.start_date, //类型：String  必有字段  备注：生单时间start
      end_date: this.state.orderSearch.end_date, //类型：String  必有字段  备注：生单时间end

      page: this.state.orderSearch.page,
      limit: this.state.orderSearch.limit,

      order_type: "3", //类型：String  必有字段  备注：1正常单 2改签单 3退票单
      download: "1", //类型：String  必有字段  备注：默认1
      report_type: "7",
    };

    /*
     *功能： 模拟form表单的提交
     *参数： URL 跳转地址 PARAMTERS 参数 function Post(URL, PARAMTERS ,Type){
     */
    //创建form表单
    var temp_form = document.createElement("form");
    temp_form.action = "/log/train/order_excel";
    //如需当前窗口打开，form的target属性要设置为'_self'
    temp_form.target = "_blank";
    temp_form.method = "post";
    temp_form.style.display = "none";
    //添加参数
    for (var item in data) {
      var opt = document.createElement("input");
      if (data[item]) {
        opt.name = item;
        opt.value = data[item];
        temp_form.appendChild(opt);
      }
    }
    document.body.appendChild(temp_form);
    //提交数据
    temp_form.submit();
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
                  ? this.state.orderNumberData["total"] || 0
                  : item === "退票中"
                  ? this.state.orderNumberData["apply"] || 0
                  : item === "已退票"
                  ? this.state.orderNumberData["over"] || 0
                  : item === "已取消"
                  ? this.state.orderNumberData["channel"] || 0
                  : item === "退票失败"
                  ? this.state.orderNumberData["fail"] || 0
                  : 0}
              </span>
            </div>
          ))}
        </div>

        <div className="order_main">
          <div className="main_search">
            <div className="search_list">
              <div className="list_title" style={{ width: 74 }}>
                乘车人
              </div>
              <div className="list_item">
                <Input
                  onChange={this.searchInput.bind(this, "passenger")}
                  allowClear
                  placeholder="请输入"
                  value={this.state.orderSearch.passenger}
                ></Input>
              </div>
            </div>

            <div className="search_list">
              <div className="list_title" style={{ width: 88 }}>
                退票状态
              </div>
              <div className="list_item">
                <Select
                  onChange={this.searchSelect.bind(this, "status")}
                  placeholder="请选择"
                  value={this.state.orderSearch.status}
                >
                  <Option value={""}>全部</Option>
                  <Option value={1}>退票中</Option>
                  <Option value={2}>已退票</Option>
                  <Option value={3}>已取消</Option>
                  <Option value={5}>退票失败</Option>
                </Select>
              </div>
            </div>

            <div className="search_list">
              <div className="list_title" style={{ width: 74 }}>
                <Select
                  onChange={this.searchSelect.bind(this, "orderType")}
                  value={this.state.orderSearch.orderType}
                >
                  <Option value="订单号">订单号</Option>
                  <Option value="取票号">取票号</Option>
                </Select>
              </div>
              <div className="list_item">
                <Input
                  onChange={this.searchInput.bind(this, "orderNo")}
                  allowClear
                  placeholder="订单号/取票号"
                  value={this.state.orderSearch.orderNo}
                ></Input>
              </div>
            </div>

            <div className="search_list">
              <div className="list_title" style={{ width: 74 }}>
                申请时间
              </div>
              <div className="list_item" style={{ width: 280 }}>
                <RangePicker
                  onChange={this.searchSelect.bind(this, "timeData")}
                  placeholder={["请选择", "请选择"]}
                  value={this.state.orderSearch.timeData}
                />
              </div>
            </div>

            {this.state.isAdmin ? (
              <div className="search_list">
                <div className="list_title" style={{ width: 74 }}>
                  分销商
                </div>
                <div className="list_item">
                  <Select
                    showSearch
                    value={this.state.orderSearch.dis_id}
                    placeholder="输入中文进行选择"
                    defaultActiveFirstOption={false}
                    showArrow={false}
                    filterOption={false}
                    onSearch={this.handleSearch}
                    onChange={this.searchSelect.bind(this, "dis_id")}
                    notFoundContent={null}
                    allowClear
                  >
                    {this.state.disDataList.map((d) => (
                      <Option key={d.value} value={d.value}>
                        {d.text}
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>
            ) : (
              ""
            )}

            <Button
              className="search_submit"
              type="primary"
              onClick={() => this.searchSubmit()}
            >
              搜索
            </Button>

            <Button
              className="search_submit"
              type="primary"
              onClick={() => this.downloadExcel()}
            >
              表单下载
            </Button>
          </div>

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
                    {/* {render.status === 1 || render.status === 2 ? (
                      <Button
                        size="small"
                        className="option_cancel"
                        onClick={() => this.orderCancel(render)}
                      >
                        消
                      </Button>
                    ) : (
                      ""
                    )} */}
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
              {this.state.isAdmin ? (
                <Column
                  title="分销商"
                  render={(render) =>
                    render.distributor_user ? render.distributor_user.company_name : "-"
                  }
                />
              ) : (
                ""
              )}
              <Column
                title="取票号"
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
                render={(render) => (
                  <span
                    style={{
                      color:
                        render.status === 1
                          ? "#0070E2"
                          : render.status === 5
                          ? "#FF0000"
                          : "#333333",
                    }}
                  >
                    {render.status === 1 ? (
                      "退票中"
                    ) : render.status === 2 ? (
                      "已退票"
                    ) : render.status === 3 ? (
                      "已取消"
                    ) : render.status === 5 ? (
                      <Popover
                        content={render.status_remark}
                        title={false}
                        trigger="hover"
                      >
                        <span style={{ cursor: "pointer" }}>退票失败</span>
                      </Popover>
                    ) : (
                      render.status
                    )}
                  </span>
                )}
              />
              <Column
                title="申请人"
                render={(text, render) => render.train_order.book_user || "-"}
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
                pageSize={this.state.orderSearch.limit}
                onChange={this.changePagination}
              />
            </div>
          </div>
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
