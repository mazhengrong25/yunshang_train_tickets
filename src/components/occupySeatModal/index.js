/*
 * @Description: 占座
 * @Author: mzr
 * @Date: 2021-06-29 14:23:13
 * @LastEditTime: 2021-07-21 11:17:14
 * @LastEditors: wish.WuJunLong
 *
 * isOccupyNo: '',    订单号
 * isOccupyModal: true || false,   Boolean 弹窗开关
 * isOccupyStatus: 500 || null,    Number 剩余时间，null为错误
 * function this.props.closeOccupy(),   关闭弹窗方法
 *
 */

import React, { Component } from "react";

import { Modal, Button, Statistic } from "antd";

import OccupyFail from "../../static/occupy_fail.png";
import OccupySuccess from "../../static/occupy_success.png";

import "./occupySeatModal.scss";

const { Countdown } = Statistic;

let timer;
let orderStatus;

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      remainingTime: new Date(), // 剩余时间

      count: 0, // 剩余时间
      remainingNumber: 0,

      newOrderStatus: "",
    };
  }

  componentDidMount() {
    this.props.onRef(this);
  }

  
// 进度条
  startTime() {
    this.setState({
      remainingTime: this.$moment().add(this.props.isOccupyStatus, "s"),  // 倒计时组件计算倒计时时间
      count: this.props.isOccupyStatus,  // 父级设定随机秒数
    });

    // 进度条开始计算
    timer = setInterval(() => {
      this.setState({
        count: --this.state.count,  // 每1000毫秒 随机秒数开始减一
        remainingNumber:
          ((this.props.isOccupyStatus - this.state.count) / this.props.isOccupyStatus) *
          99,  // 计算每秒运行距离 百分比
      });
      if (this.state.count < 1) {
        clearInterval(timer);
      }
    }, 1000);

    orderStatus = setInterval(() => {
      this.$axios.post("/train/order/detail/" + this.props.isOccupyNo).then((res) => {
        if (res.code === 0) {
          if (res.data.status === 2) {
            this.setState({
              remainingTime: new Date(),
              newOrderStatus: res.data.status_remark,
              remainingNumber: 100,
            });
            clearInterval(timer);
            clearInterval(orderStatus);
            setTimeout(() => {
              this.props.orderSuccess();
            }, 1000);
          }
          if (res.data.status === 6) {
            this.setState({
              remainingTime: new Date(),
              newOrderStatus: res.data.status_remark,
              remainingNumber: 100,
              count: null,
            });
            clearInterval(timer);
            clearInterval(orderStatus);
          }
        }
      });
    }, 10000);
  }

  jumpDetails() {
    clearInterval(timer);
    clearInterval(orderStatus);
    this.props.closeOccupy();
  }

  jumpOccupy() {
    clearInterval(timer);
    clearInterval(orderStatus);
    this.props.jumpOccupy();
  }

  componentWillUnmount() {
    clearInterval(timer);
    clearInterval(orderStatus);
  }

  render() {
    return (
      <Modal
        width={600}
        title={false}
        wrapClassName="occupy_modal"
        footer={null}
        keyboard={false}
        closable={false}
        centered={true}
        maskClosable={false}
        visible={this.props.isOccupyModal}
        onCancel={() => this.props.closeOccupy()}
      >
        {this.state.count !== null ? (
          <div className="success_content">
            <div className="content_top">占座中,请稍后...</div>
            <div className="top_time">
              <div className="time_title">预计剩余时间</div>

              <div className="time_value">
                <Countdown
                  valueStyle={{ fontSize: 12, color: "#0070E2" }}
                  value={this.state.remainingTime}
                  format="m分ss秒"
                />
              </div>
            </div>
            <div className="content_process">
              <div className="process_item">
                <p style={{ right: `${100 - this.state.remainingNumber}%` }}>
                  <img
                    className="occupy_icon"
                    src={OccupySuccess}
                    alt="火车进度条图标"
                  ></img>
                </p>
              </div>
              <p
                style={{ width: this.state.remainingNumber + "%" }}
                className="remaining_number"
              >
                <span>{this.state.remainingNumber.toFixed(0)}%</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="fail_content">
            <div className="fail_img">
              <img src={OccupyFail} alt="占座失败" />
            </div>
            <div className="fail_title">占座失败</div>
            <div className="fail_message">{this.state.newOrderStatus}</div>
          </div>
        )}
        {/* 底部按钮 */}
        <div className="occupy_buttons">
          {this.state.count !== null ? (
            <Button className="button_detail" onClick={() => this.jumpDetails()}>
              订单详情
            </Button>
          ) : (
            <>
              <Button className="button_cancel" onClick={() => this.jumpDetails()}>
                订单详情
              </Button>
              <Button
                className="button_detail"
                type="primary"
                onClick={() => this.jumpOccupy()}
              >
                重选车次
              </Button>
            </>
          )}
        </div>
      </Modal>
    );
  }
}
