/*
 * @Description: 首页 - 火车票查询页
 * @Author: wish.WuJunLong
 * @Date: 2021-05-06 11:04:50
 * @LastEditTime: 2021-05-22 20:20:44
 * @LastEditors: wish.WuJunLong
 */

import React, { Component } from "react";

import { Button, DatePicker, message } from "antd";

import TrainIcon from "../../static/train_icon.png"; // 火车票图标

import CitySelect from "../../components/citySelect"; // 火车站选择

import "./Home.scss";

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      start: "",
      end: "",
      time: "",
    };
  }
  componentDidMount() {}

  // 出发时间
  changeTime = (val) => {
    this.setState({
      time: val,
    });
  };
  // 获取城市
  getCity = (start, end) => {
    console.log(start, end);
    this.setState({
      start: start,
      end: end,
    });
  };
  // 搜索火车票
  jumpTicketPage() {
    if (!this.state.start || !this.state.end || !this.state.time) {
      return message.warning("请完善信息");
    }
    console.log(
      this.state.start,
      this.state.end,
      this.$moment(this.state.time).format("YYYY-MM-DD")
    );

    let url = `/ticketInquiry?departure=${this.state.start}&arrive=${
      this.state.end
    }&departure_date=${this.$moment(this.state.time).format("YYYY-MM-DD")}`;
    this.props.history.push(encodeURI(url));
  }
  render() {
    return (
      <div className="home">
        <div className="banner">
          <div className="search_box">
            <div className="box_title">
              <img className="title_icon" src={TrainIcon} alt="火车票图标"></img>
              火车票查询
            </div>
            <div className="box_content">
              <CitySelect cityData={this.getCity}></CitySelect>

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
                          (current &&
                            current > this.$moment().add(15, "days").endOf("day"))
                        );
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="submit_box">
                <div></div>
                <Button
                  type="primary"
                  className="jump_btn"
                  onClick={() => this.jumpTicketPage()}
                >
                  搜索
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
