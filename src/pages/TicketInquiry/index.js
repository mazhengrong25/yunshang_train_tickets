/*
 * @Description: 车票查询
 * @Author: wish.WuJunLong
 * @Date: 2021-05-06 11:06:03
 * @LastEditTime: 2021-07-09 17:14:33
 * @LastEditors: wish.WuJunLong
 */

import React, { Component } from "react";

import { Button, Table, message, Checkbox, DatePicker } from "antd";

import { DownOutlined, UpOutlined } from "@ant-design/icons";

import "./TicketInquiry.scss";

import CitySelect from "../../components/citySelect"; // 火车站选择

import TripIcon from "../../static/trip_icon.png"; // 行程icon
import ArrowIcon from "../../static/arrow_icon.png"; // 箭头icon

import ViaStopPopover from "../../components/viaStopPopover"; // 经停站组件

const { Column } = Table;

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ticketMessage: {},

      searchCollapse: false, // 是否展开筛选条件

      start: "", // 出发城市
      end: "", // 到达城市
      time: "", // 时间

      only: false, // 是否只看高铁动车

      searchData: {
        onlyStatus: 0, // 只看有票
        type: 0, // 车型
        startDate: 0, // 出发时段
        endDate: 0, // 到达时段
        startStation: 0, // 出发车站
        endStation: 0, // 到达车站
        status: 0, // 是否始发
        typeList: [], // 车型列表
        startStationList: [], // 出发车站
        endStationList: [], // 到达车站
      },

      ticketList: [], // 班次列表
      ticketListLoading: true, // 班次表格加载

      notTicketList: [], // 异常预售无票等班次数据

      showNotTicketList: false, // 显示预售无票班次数据

      dateList: [
        {
          time: this.$moment().format("YYYY-MM-DD"),
        },
      ], // 获取一周日期

      viaStopPopover: "", // 经停站信息弹窗
      viaStopData: [], // 经停站数据

      submitLoading: false, // 预定功能加载
    };
  }
  async componentWillMount() {
    if (this.props.type) {
      await this.setState({
        ticketMessage: this.props.type,
      });
      await this.setState({
        start: this.props.type.departure,
        end: this.props.type.arrive,
        time: this.$moment(this.props.type.departure_date),
      });
    } else {
      await this.setState({
        ticketMessage: React.$filterUrlParams(decodeURI(this.props.location.search)),
      });
      await this.setState({
        start: this.state.ticketMessage.departure,
        end: this.state.ticketMessage.arrive,
        time: this.$moment(this.state.ticketMessage.departure_date),
        only: this.state.ticketMessage.only === "true",
      });
    }

    await this.getTicketList();
    await this.getDateList();
  }

  // 获取车次列表
  getTicketList() {
    this.setState({
      ticketList: [],
      ticketListLoading: true,
      showNotTicketList: false,
      notTicketList: [],
    });
    let data = this.state.ticketMessage; // 车次信息
    data["ticket"] = "ADT";

    if (data["only"]) {
      delete data["only"];
    }

    let searchData = this.state.searchData; // 列表筛选信息
    let typeList = []; // 车型列表
    let startStationList = []; // 出发车站列表
    let endStationList = []; // 到达车站列表
    this.$axios.post("/train/query", data).then((res) => {
      console.log(res);
      if (res.code === 0) {
        // 组装数据key
        let data = res.data;
        let newData = [];
        let notData = [];
        data.forEach((item, index) => {
          item["key"] = `index${index}`;
          item["typeStatus"] = true;
          item["startDateStatus"] = true;
          item["endDateStatus"] = true;
          item["startStationStatus"] = true;
          item["endStationStatus"] = true;
          item["status"] = true;

          typeList.push(item.train.type + "-" + item.train.type_name);
          startStationList.push(item.station.departure_name);
          endStationList.push(item.station.arrive_name);
          if (item.is_reserve) {
            newData.push(item);
          } else {
            notData.push(item);
          }
        });
        // newData = newData.concat(notData); // 组装列表 末尾合并无法订票车次

        searchData["typeList"] = [...new Set(typeList)];
        searchData["startStationList"] = [...new Set(startStationList)];
        searchData["endStationList"] = [...new Set(endStationList)];

        this.setState({
          ticketList: newData,
          searchData: searchData,
          ticketListLoading: false,
          notTicketList: notData,
        });

        if (this.state.only) {
          let newSearchStatus = this.state.searchData;
          newSearchStatus.type = "G";
          this.setState({
            searchData: newSearchStatus,
          });
          this.changeDataStatus();
        }
      } else {
        this.setState({
          ticketList: [],
          ticketListLoading: false,
        });
        message.warning(res.msg);
      }
    });
  }

  // 获取城市
  getCity = (start, end) => {
    console.log(start, end);
    this.setState({
      start: start,
      end: end,
    });
  };

  // 出发时间
  changeTime = (val) => {
    this.setState({
      time: val,
    });
  };

  // 修改查询信息
  async editTicketMessage() {
    if (!this.state.start || !this.state.end || !this.state.time) {
      return message.warning("请完整搜索信息");
    }
    if (!this.props.type) {
      let url = `/ticketInquiry?departure=${this.state.start}&arrive=${
        this.state.end
      }&departure_date=${this.$moment(this.state.time).format("YYYY-MM-DD")}`;
      await this.props.history.push(encodeURI(url));
    }
    let data = {
      departure: this.state.start,
      arrive: this.state.end,
      departure_date: this.$moment(this.state.time).format("YYYY-MM-DD"),
    };

    if (this.props.type && this.props.type.is_change) {
      data["is_change"] = this.props.type.is_change;
    }

    await this.setState({
      ticketMessage: data,
    });
    await this.getTicketList();
    await this.getDateList();
  }

  // 列表筛选条件状态修改
  async changeSearchGroup(label, val) {
    if (label === "type") {
      this.setState({
        only: false,
      });
    }
    let searchData = this.state.searchData;
    if (label === "onlyStatus") {
      searchData[label] = val.target.checked ? 1 : 0;
    } else {
      searchData[label] = val[val.length - 1];
    }
    for (const k in searchData) {
      if (!searchData[k]) {
        searchData[k] = 0;
      }
    }
    console.log(searchData);
    await this.setState({
      searchData: searchData,
    });
    await this.changeDataStatus();
  }

  // 列表筛选状态添加
  changeDataStatus() {
    let data = this.state.ticketList;
    let type = this.state.searchData;

    data.forEach((item) => {
      item["typeStatus"] = type.type !== 0 ? type.type === item.train.type : true; // 判断车型

      item["startDateStatus"] =
        type.startDate !== 0
          ? this.dateBetween(type.startDate, item.train.departure)
          : true; // 判断是否处于筛选时间段内

      item["endDateStatus"] =
        type.endDate !== 0 ? this.dateBetween(type.endDate, item.train.arrive) : true;

      item["startStationStatus"] =
        type.startStation !== 0
          ? type.startStation === item.station.departure_name
          : true; // 判断出发车站

      item["endStationStatus"] =
        type.endStation !== 0 ? type.endStation === item.station.arrive_name : true; // 判断到达车站

      item["status"] =
        type.status === 1
          ? item.station.departure_name === item.station.start
          : type.status === 2
          ? item.station.departure_name !== item.station.start
          : true; // 判断车型
    });

    console.log(data);

    this.setState({
      ticketList: data,
    });
  }

  // 判断是否处于某时间段之间
  dateBetween(type, val) {
    let date =
      type === 1
        ? ["00:00", "06:00"]
        : type === 2
        ? ["06:00", "12:00"]
        : type === 3
        ? ["12:00", "18:00"]
        : type === 4
        ? ["18:00", "24:00"]
        : "";
    return date
      ? this.$moment(`2021-01-01 ${val}`).isBetween(
          `2021-01-01 ${date[0]}`,
          `2021-01-01 ${date[1]}`,
          "minute",
          "[)"
        )
      : false;
  }

  // 获取今日至之后20天日期切换
  getDateList(type) {
    let thisDate = this.$moment();
    let searchDate = this.$moment(this.state.ticketMessage.departure_date);

    // 判断今日+20天后日期 与 当前查询日期 相差天数，如 当前日期+20天日期 小于 查询日期 则时间定位至当前日期后17天（遍历日期时会在时间前增加三天）
    if (
      Math.ceil(
        this.$moment()
          .add(15, "d")
          .diff(this.$moment(searchDate).add(3, "d"), "days", true)
      ) < 0
    ) {
      searchDate = this.$moment().add(12, "d");
    }

    // 判断翻页按钮
    if (type === "previous") {
      searchDate = this.$moment(this.state.dateList[0].time).subtract(3, "d");
    } else if (type === "next") {
      if (
        Math.ceil(
          this.$moment()
            .add(15, "d")
            .diff(
              this.$moment(this.state.dateList[this.state.dateList.length - 1].time).add(
                6,
                "d"
              ),
              "days",
              true
            )
        ) > 0
      ) {
        searchDate = this.$moment(this.state.dateList[0].time).add(9, "d");
      } else {
        searchDate = this.$moment().add(12, "d");
      }
    }

    let data = [];

    // 判断查询日期是否大于今日三天 如小于三天 则减去相差天数
    if (Math.ceil(searchDate.diff(thisDate, "days", true)) >= 3) {
      searchDate = this.$moment(searchDate).subtract(3, "d");
    } else {
      searchDate = this.$moment(searchDate).subtract(
        Math.ceil(searchDate.diff(thisDate, "days", true)),
        "d"
      );
    }
    for (let i = 0; i < 7; i++) {
      data.push({
        time: this.$moment(searchDate).add(i, "d").format("YYYY-MM-DD"),
        week: this.$moment(searchDate).add(i, "d").format("ddd"),
      });
    }

    this.setState({
      dateList: data,
    });
  }

  // 切换日期查询
  async changeTicketTime(val) {
    let data = this.state.ticketMessage;
    data.departure_date = val.time;
    await this.setState({
      ticketMessage: data,
    });
    if (!this.props.type) {
      let url = `/ticketInquiry?departure=${this.state.ticketMessage.departure}&arrive=${
        this.state.ticketMessage.arrive
      }&departure_date=${this.$moment(this.state.ticketMessage.departure_date).format(
        "YYYY-MM-DD"
      )}`;
      await this.props.history.push(encodeURI(url));
    }
    await this.getTicketList();
  }

  // 处理车票列表席别数组
  seabedListData(val) {
    let data = [];
    if (!val.is_reserve || val.seat.length < 1) {
      return false;
    } else {
      for (let i in val.seat) {
        if (this.state.searchData.onlyStatus === 1 && Number(val.seat[i].number) > 0) {
          data.push(val.seat[i]);
        } else if (
          Number(val.seat[i].number) >= 0 &&
          this.state.searchData.onlyStatus === 0
        ) {
          data.push(val.seat[i]);
        }
      }
    }

    return data.sort(this.sortTicketPrice("price"));
  }

  // 车票价格排序 降序
  sortTicketPrice(p) {
    return (m, n) => {
      let a = m[p];
      let b = n[p];
      return a - b;
    };
  }

  // 获取经停站信息
  openViaStopMessage = (val) => {
    this.setState({
      viaStopPopover: val.key,
      viaStopData: [],
    });
    let data = {
      departure: val.station.departure_name, //类型：String  必有字段  备注：出发站点
      arrive: val.station.arrive_name, //类型：String  必有字段  备注：到达站
      ticket: "ADT", //类型：String  必有字段  备注：票类型
      departure_date: this.state.ticketMessage.departure_date, //类型：String  必有字段  备注：出发日期
      code: val.train.code, //类型：String  必有字段  备注：车次
      number: val.train.number, //类型：String  必有字段  备注：列车号
    };

    this.$axios.post("/train/station", data).then((res) => {
      if (res.code === 0) {
        this.setState({
          viaStopPopover: val.key,
          viaStopData: res.data,
        });
      } else {
        message.warning(res.msg);
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

  //  跳转预定详情
  jumpDetails(val, oval) {
    this.setState({
      submitLoading: true,
    });
    let data = {
      card_in: val.card_in,
      is_reserve: val.is_reserve,
      seat: val.seat,
      source: val.source,
      station: val.station,
      train: val.train,
    };
    if (this.props.type) {
      this.props.getNewTicketData(val, oval);
      this.setState({
        submitLoading: false,
      });
    } else {
      this.$axios.post("/train/check", data).then((res) => {
        this.setState({
          submitLoading: false,
        });
        if (res.code === 0) {
          // let uData = this.state.ticketMessage;
          // let url = `/ticketReservation?d=${uData.departure}&a=${uData.arrive}&t=${uData.ticket}&e=${uData.departure_date}&k=${res.data.key}&c=${oval.code}`;
          let url = `/ticketReservation?k=${res.data.key}&c=${oval.code}`;
          this.props.history.push(encodeURI(url));
        } else {
          message.warning(res.msg);
        }
      });
    }
  }

  render() {
    return (
      <div className="ticket_inquiry">
        <div className="search_ticket_header">
          <CitySelect
            start={this.state.ticketMessage.departure}
            end={this.state.ticketMessage.arrive}
            cityData={this.getCity}
          ></CitySelect>

          <div className="content_list">
            <div className="list_item">
              <div className="item_title">出发日期</div>
              <div className="item_input">
                <DatePicker
                  onChange={this.changeTime}
                  showToday={false}
                  value={this.state.time}
                  disabledDate={(current) => {
                    return (
                      (current &&
                        current < this.$moment().subtract(1, "days").endOf("day")) ||
                      (current && current > this.$moment().add(15, "days").endOf("day"))
                    );
                  }}
                />
              </div>
            </div>
          </div>

          <Button
            type="primary"
            className="jump_btn"
            onClick={() => this.editTicketMessage()}
          >
            搜索
          </Button>
        </div>
        <div className="date_Switch">
          <Button
            disabled={this.$moment(this.state.dateList[0].time).isSameOrBefore(
              this.$moment()
            )}
            className="date_btn"
            onClick={() => this.getDateList("previous")}
          >
            <img src={ArrowIcon} alt="日期切换箭头"></img>
          </Button>
          {this.state.dateList.map((item, index) => (
            <div
              onClick={() => this.changeTicketTime(item)}
              className={`date_list${
                item.time ===
                this.$moment(this.state.ticketMessage.departure_date).format("YYYY-MM-DD")
                  ? " active"
                  : ""
              }`}
              key={index}
            >
              <p>{item.time}</p>
              <span>{item.week}</span>
            </div>
          ))}
          <Button
            className="date_btn"
            disabled={
              Math.ceil(
                this.$moment(
                  this.state.dateList[this.state.dateList.length - 1].time
                ).diff(this.$moment().add(15, "d"), "days", true)
              ) >= 0
            }
            onClick={() => this.getDateList("next")}
          >
            <img src={ArrowIcon} alt="日期切换箭头"></img>
          </Button>
        </div>

        <div className="ticket_main">
          <div className="search_main">
            <div className="only_ticket">
              <Checkbox
                checked={this.state.searchData.onlyStatus === 1}
                onChange={this.changeSearchGroup.bind(this, "onlyStatus")}
              >
                只看有票
              </Checkbox>
            </div>
            <div
              className={`search_collapse${this.state.searchCollapse ? " open" : ""}`}
              onClick={() =>
                this.setState({ searchCollapse: !this.state.searchCollapse })
              }
            >
              <span></span>
              {this.state.searchCollapse ? "收起" : "更多"}筛选条件
            </div>

            <div className="search_list">
              <div className="list_title">车型：</div>
              <div className="list_item">
                <Checkbox.Group
                  value={[this.state.searchData.type]}
                  onChange={this.changeSearchGroup.bind(this, "type")}
                >
                  <Checkbox value={0}>不限</Checkbox>
                  {this.state.searchData.typeList.map((item, index) => (
                    <Checkbox value={item[0]} key={index}>
                      {item}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </div>
            </div>
            <div className="search_list">
              <div className="list_title">出发时段：</div>
              <div className="list_item">
                <Checkbox.Group
                  value={[this.state.searchData.startDate]}
                  onChange={this.changeSearchGroup.bind(this, "startDate")}
                >
                  <Checkbox value={0}>不限</Checkbox>
                  <Checkbox value={1}>0-6点</Checkbox>
                  <Checkbox value={2}>6-12点</Checkbox>
                  <Checkbox value={3}>12-18点</Checkbox>
                  <Checkbox value={4}>18-24点</Checkbox>
                </Checkbox.Group>
              </div>
            </div>

            {this.state.searchCollapse ? (
              <>
                <div className="search_list">
                  <div className="list_title">到达时段：</div>
                  <div className="list_item">
                    <Checkbox.Group
                      value={[this.state.searchData.endDate]}
                      onChange={this.changeSearchGroup.bind(this, "endDate")}
                    >
                      <Checkbox value={0}>不限</Checkbox>
                      <Checkbox value={1}>0-6点</Checkbox>
                      <Checkbox value={2}>6-12点</Checkbox>
                      <Checkbox value={3}>12-18点</Checkbox>
                      <Checkbox value={4}>18-24点</Checkbox>
                    </Checkbox.Group>
                  </div>
                </div>
                <div className="search_list">
                  <div className="list_title">出发车站：</div>
                  <div className="list_item">
                    <Checkbox.Group
                      value={[this.state.searchData.startStation]}
                      onChange={this.changeSearchGroup.bind(this, "startStation")}
                    >
                      <Checkbox value={0}>不限</Checkbox>
                      {this.state.searchData.startStationList.map((item, index) => (
                        <Checkbox value={item} key={index}>
                          {item}
                        </Checkbox>
                      ))}
                    </Checkbox.Group>
                  </div>
                </div>
                <div className="search_list">
                  <div className="list_title">到达车站：</div>
                  <div className="list_item">
                    <Checkbox.Group
                      value={[this.state.searchData.endStation]}
                      onChange={this.changeSearchGroup.bind(this, "endStation")}
                    >
                      <Checkbox value={0}>不限</Checkbox>
                      {this.state.searchData.endStationList.map((item, index) => (
                        <Checkbox value={item} key={index}>
                          {item}
                        </Checkbox>
                      ))}
                    </Checkbox.Group>
                  </div>
                </div>
                <div className="search_list">
                  <div className="list_title">是否始发：</div>
                  <div className="list_item">
                    <Checkbox.Group
                      value={[this.state.searchData.status]}
                      onChange={this.changeSearchGroup.bind(this, "status")}
                    >
                      <Checkbox value={0}>不限</Checkbox>
                      <Checkbox value={1}>始发</Checkbox>
                      <Checkbox value={2}>过路</Checkbox>
                    </Checkbox.Group>
                  </div>
                </div>
              </>
            ) : (
              ""
            )}
          </div>

          <div className="ticket_table">
            {/* 正常售票车次数据 */}

            <Table
              dataSource={this.state.ticketList.filter(
                (item) =>
                  item.typeStatus &&
                  item.startDateStatus &&
                  item.endDateStatus &&
                  item.startStationStatus &&
                  item.endStationStatus &&
                  item.status &&
                  (this.state.searchData.onlyStatus === 1
                    ? item.is_reserve && this.seabedListData(item).length > 0
                    : true)
              )}
              loading={this.state.ticketListLoading}
              size="small"
              pagination={false}
            >
              <Column
                width="9%"
                title="车次"
                render={(render) => (
                  <div className="train_number">{render.train.code}</div>
                )}
              />
              <Column
                width="13%"
                title="出发"
                align="center"
                sorter={(a, b) =>
                  this.$moment(
                    `${this.$moment().format("YYYY-MM-DD")} ${a.train.departure}`
                  ).format("X") -
                  this.$moment(
                    `${this.$moment().format("YYYY-MM-DD")} ${b.train.departure}`
                  ).format("X")
                }
                render={(render) => (
                  <div className="train_time">
                    <div className="time">{render.train.departure}</div>
                    <div className="address">
                      <span
                        style={{
                          background:
                            render.station.start === render.station.departure_name
                              ? "#F89292"
                              : "#85CD83",
                        }}
                      >
                        {render.station.start === render.station.departure_name
                          ? "始"
                          : "过"}
                      </span>
                      {render.station.departure_name}
                    </div>
                  </div>
                )}
              />
              <Column
                width="13%"
                title="运行时长"
                align="center"
                sorter={(a, b) => Number(a.train.run_minute) - Number(b.train.run_minute)}
                render={(render) => (
                  <div className="train_operation">
                    <div className="run_minute">
                      {`${Math.floor(
                        Number(render.train.run_minute) / 60
                      )}小时${Math.floor(Number(render.train.run_minute) % 60)}分`}
                    </div>

                    <img src={TripIcon} alt="行程图标"></img>

                    <ViaStopPopover
                      data={render}
                      popoverStatus={this.state.viaStopPopover}
                      popoverData={this.state.viaStopData}
                      close={this.closeViaStopPopover}
                      open={this.openViaStopMessage}
                    ></ViaStopPopover>
                  </div>
                )}
              />
              <Column
                width="13%"
                title="到达"
                align="center"
                sorter={(a, b) =>
                  this.$moment(
                    `${this.$moment().format("YYYY-MM-DD")} ${a.train.arrive}`
                  ).format("X") -
                  this.$moment(
                    `${this.$moment().format("YYYY-MM-DD")} ${b.train.arrive}`
                  ).format("X")
                }
                render={(render) => (
                  <div className="train_time">
                    <div className="time">{render.train.arrive}</div>
                    <div className="address">
                      <span
                        style={{
                          background:
                            render.station.end === render.station.arrive_name
                              ? "#1E8BF9"
                              : "#85CD83",
                        }}
                      >
                        {render.station.end === render.station.arrive_name ? "终" : "过"}
                      </span>
                      {render.station.arrive_name}
                    </div>
                  </div>
                )}
              />
              <Column
                width="12%"
                title="席别/票价"
                render={(render) => {
                  const obj = {
                    children: (
                      <>
                        <div className="seabed">
                          {this.seabedListData(render) &&
                            this.seabedListData(render).map((item, index) => (
                              <p className="table_list" key={index}>
                                <span>{item.name}</span>{" "}
                                {item.price ? <>&yen;{item.price}</> : "--"}
                              </p>
                            ))}
                        </div>
                        <div className="not_train_note">{render.train.note}</div>
                      </>
                    ),
                    props: {},
                  };
                  obj.props.colSpan = this.seabedListData(render).length > 0 ? 1 : 4;
                  return obj;
                }}
              />
              <Column
                width="12%"
                title="服务费"
                render={(render) => {
                  const obj = {
                    children: (
                      <>
                        {this.seabedListData(render) &&
                          this.seabedListData(render).map((item, index) => (
                            <p className="table_list" key={index}>
                              {item.service_fee ? <>&yen;{item.service_fee}</> : "--"}
                            </p>
                          ))}
                      </>
                    ),
                    props: {},
                  };
                  obj.props.colSpan = this.seabedListData(render).length > 0 ? 1 : 0;
                  return obj;
                }}
              />
              <Column
                width="12%"
                title="结算价"
                render={(render) => {
                  const obj = {
                    children: (
                      <>
                        {this.seabedListData(render) &&
                          this.seabedListData(render).map((item, index) => (
                            <p className="price table_list" key={index}>
                              {item.price ? <>&yen;{item.price}</> : "--"}
                            </p>
                          ))}
                      </>
                    ),
                    props: {},
                  };
                  obj.props.colSpan = this.seabedListData(render).length > 0 ? 1 : 0;
                  return obj;
                }}
              />
              <Column
                width="16%"
                title="操作"
                align="center"
                render={(render) => {
                  const obj = {
                    children: (
                      <>
                        {this.seabedListData(render) &&
                          this.seabedListData(render).map((item, index) => (
                            <p key={index} className="table_option table_list">
                              {Number(item.number) >= 20 ? (
                                <span className="remaining_tickets">充足</span>
                              ) : Number(item.number) <= 0 ? (
                                <span className="remaining_tickets">无票</span>
                              ) : (
                                <span className="remaining_tickets">
                                  余
                                  <span style={{ color: "#FB8226" }}>{item.number}</span>
                                  张
                                </span>
                              )}
                              <Button
                                className="pay_submit"
                                type="primary"
                                size="small"
                                loading={
                                  render.is_reserve &&
                                  Number(item.number) > 0 &&
                                  this.state.submitLoading
                                }
                                disabled={!render.is_reserve || Number(item.number) <= 0}
                                onClick={() => this.jumpDetails(render, item)}
                              >
                                购票
                              </Button>
                            </p>
                          ))}
                      </>
                    ),
                    props: {},
                  };
                  obj.props.colSpan = this.seabedListData(render).length > 0 ? 1 : 0;
                  return obj;
                }}
              />
            </Table>

            {/* 异常或无票预售车票数据 */}

            {this.state.notTicketList.length > 0 ? (
              <>
                <div className="not_ticket_list_info">
                  以下以为您收起 {this.state.notTicketList.length} 条暂停发售车次{" "}
                  <Button
                    type="link"
                    onClick={() =>
                      this.setState({
                        showNotTicketList: !this.state.showNotTicketList,
                      })
                    }
                  >
                    {this.state.showNotTicketList ? (
                      <>
                        收起 <UpOutlined />
                      </>
                    ) : (
                      <>
                        查看 <DownOutlined />
                      </>
                    )}
                  </Button>
                </div>

                <Table
                  style={{
                    display: this.state.showNotTicketList ? "block" : "none",
                  }}
                  dataSource={this.state.notTicketList.filter(
                    (item) =>
                      item.typeStatus &&
                      item.startDateStatus &&
                      item.endDateStatus &&
                      item.startStationStatus &&
                      item.endStationStatus &&
                      item.status &&
                      (this.state.searchData.onlyStatus === 1
                        ? item.is_reserve && this.seabedListData(item).length > 0
                        : true)
                  )}
                  loading={this.state.ticketListLoading}
                  size="small"
                  pagination={false}
                  showHeader={false}
                >
                  <Column
                    width="9%"
                    title="车次"
                    render={(render) => (
                      <div className="train_number">{render.train.code}</div>
                    )}
                  />
                  <Column
                    width="13%"
                    title="出发"
                    align="center"
                    sorter={(a, b) =>
                      this.$moment(
                        `${this.$moment().format("YYYY-MM-DD")} ${a.train.departure}`
                      ).format("X") -
                      this.$moment(
                        `${this.$moment().format("YYYY-MM-DD")} ${b.train.departure}`
                      ).format("X")
                    }
                    render={(render) => (
                      <div className="train_time">
                        <div className="time">{render.train.departure}</div>
                        <div className="address">
                          <span
                            style={{
                              background:
                                render.station.start === render.station.departure_name
                                  ? "#F89292"
                                  : "#85CD83",
                            }}
                          >
                            {render.station.start === render.station.departure_name
                              ? "始"
                              : "过"}
                          </span>
                          {render.station.departure_name}
                        </div>
                      </div>
                    )}
                  />
                  <Column
                    width="13%"
                    title="运行时长"
                    align="center"
                    sorter={(a, b) =>
                      Number(a.train.run_minute) - Number(b.train.run_minute)
                    }
                    render={(render) => (
                      <div className="train_operation">
                        <div className="run_minute">
                          {`${Math.floor(
                            Number(render.train.run_minute) / 60
                          )}小时${Math.floor(Number(render.train.run_minute) % 60)}分`}
                        </div>

                        <img src={TripIcon} alt="行程图标"></img>

                        <ViaStopPopover
                          data={render}
                          popoverStatus={this.state.viaStopPopover}
                          popoverData={this.state.viaStopData}
                          close={this.closeViaStopPopover}
                          open={this.openViaStopMessage}
                        ></ViaStopPopover>
                      </div>
                    )}
                  />
                  <Column
                    width="13%"
                    title="到达"
                    align="center"
                    sorter={(a, b) =>
                      this.$moment(
                        `${this.$moment().format("YYYY-MM-DD")} ${a.train.arrive}`
                      ).format("X") -
                      this.$moment(
                        `${this.$moment().format("YYYY-MM-DD")} ${b.train.arrive}`
                      ).format("X")
                    }
                    render={(render) => (
                      <div className="train_time">
                        <div className="time">{render.train.arrive}</div>
                        <div className="address">
                          <span
                            style={{
                              background:
                                render.station.end === render.station.arrive_name
                                  ? "#1E8BF9"
                                  : "#85CD83",
                            }}
                          >
                            {render.station.end === render.station.arrive_name
                              ? "终"
                              : "过"}
                          </span>
                          {render.station.arrive_name}
                        </div>
                      </div>
                    )}
                  />
                  <Column
                    width="12%"
                    title="席别/票价"
                    render={(render) => {
                      const obj = {
                        children: (
                          <>
                            {render.train.type === "G" || render.train.type === "D" ? (
                              <div className="seabed">
                                <p className="table_list">
                                  <span>二等座</span> &yen; *
                                </p>
                                <p className="table_list">
                                  <span>一等座</span> &yen; *
                                </p>
                                <p className="table_list">
                                  <span>商务座</span> &yen; *
                                </p>
                              </div>
                            ) : (
                              <div className="seabed">
                                <p className="table_list">
                                  <span>硬座</span> &yen; *
                                </p>
                                <p className="table_list">
                                  <span>硬卧</span> &yen; *
                                </p>
                                <p className="table_list">
                                  <span>软卧</span> &yen; *
                                </p>
                              </div>
                            )}
                          </>
                        ),
                        props: {},
                      };
                      return obj;
                    }}
                  />
                  <Column
                    width="12%"
                    title="服务费"
                    render={(render) => {
                      const obj = {
                        children: (
                          <>
                            <div className="seabed">
                              <p className="table_list">&yen; *</p>
                              <p className="table_list">&yen; *</p>
                              <p className="table_list">&yen; *</p>
                            </div>
                          </>
                        ),
                        props: {},
                      };
                      return obj;
                    }}
                  />
                  <Column
                    width="12%"
                    title="结算价"
                    render={(render) => {
                      const obj = {
                        children: (
                          <>
                            <div className="seabed">
                              <p className="price table_list">&yen; *</p>
                              <p className="price table_list">&yen; *</p>
                              <p className="price table_list">&yen; *</p>
                            </div>
                          </>
                        ),
                        props: {},
                      };
                      return obj;
                    }}
                  />
                  <Column
                    width="16%"
                    title="操作"
                    align="center"
                    render={(render) => {
                      const obj = {
                        children: (
                          <>
                            <div className="not_train_note">{render.train.note}</div>
                          </>
                        ),
                        props: {},
                      };
                      return obj;
                    }}
                  />
                </Table>
              </>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
    );
  }
}
