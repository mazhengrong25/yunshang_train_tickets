/*
 * @Description: 退票改签确认弹窗
 * @Author: wish.WuJunLong
 * @Date: 2021-05-27 10:50:40
 * @LastEditTime: 2021-05-27 10:58:48
 * @LastEditors: wish.WuJunLong
 */

import React, { Component } from "react";

import { Button, Modal } from "antd";

import TicketIcon from "../../static/trip_icon.png"; // 行程图标

import "./cancelOrderModal.scss";

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    return (
      <Modal
        title={`确认${this.props.isSegmentsModalType}`}
        wrapClassName="segments_modal"
        visible={this.props.isSegmentsModal}
        footer={false}
        width={700}
        onCancel={() => this.props.closeModalBtn()}
      >
        {this.props.isSegmentsModalType === "退票" ? (
          <div className="modal_waring">退票金额以实际退款金额为准，可参考退票规则</div>
        ) : this.props.isSegmentsModalType === "改签" ? (
          <div className="modal_waring">改签费以占位成功后实际价格为准，可参考退票规则</div>
        ) : (
          ""
        )}

        <div className="modal_main">
          <div className="main_title">
            <p>{this.props.isSegmentsModalType}行程</p>
            <span>
              {this.props.isSegmentsModalData.segments
                ? this.$moment(
                    this.props.isSegmentsModalData.segments[0].departure_time
                  ).format("YYYY-MM-DD")
                : "-"}
              （
              {this.props.isSegmentsModalData.segments
                ? this.$moment(
                    this.props.isSegmentsModalData.segments[0].departure_time
                  ).format("ddd")
                : "-"}
              ）
            </span>
          </div>

          <div className="main_segment">
            <p>
              {this.props.isSegmentsModalData.segments
                ? this.props.isSegmentsModalData.segments[0].train_number
                : "-"}
            </p>
            <div className="address_box">
              <div className="address">
                <span>
                  {this.props.isSegmentsModalData.segments
                    ? this.$moment(
                        this.props.isSegmentsModalData.segments[0].departure_time
                      ).format("HH:mm")
                    : "-"}
                </span>
                {this.props.isSegmentsModalData.segments
                  ? this.props.isSegmentsModalData.segments[0].from_city
                  : "-"}
              </div>
              <img src={TicketIcon} alt="行程图标"></img>
              <div className="address">
                <span>
                  {this.props.isSegmentsModalData.segments
                    ? this.$moment(
                        this.props.isSegmentsModalData.segments[0].arrive_time
                      ).format("HH:mm")
                    : "-"}
                </span>
                {this.props.isSegmentsModalData.segments
                  ? this.props.isSegmentsModalData.segments[0].to_city
                  : "-"}
              </div>
            </div>
            <p>
              {this.props.isSegmentsModalData.segments
                ? this.props.isSegmentsModalData.segments[0].seat
                : "-"}
            </p>
          </div>

          <div className="main_title">
            <p>{this.props.isSegmentsModalType}乘车人</p>
          </div>

          <div className="main_passenger">
            {this.props.isSegmentsModalData.passengers &&
              this.props.isSegmentsModalData.passengers.map((item, index) => (
                <div className="passenger_list" key={index}>
                  <div className="list_number">{index + 1}</div>
                  <p>
                    {item.PassengerName}（
                    {item.PassengerType === "ADT"
                      ? "成人"
                      : item.PassengerType === "CHD"
                      ? "儿童"
                      : item.PassengerType}
                    ）
                  </p>
                  <p>座位号：{item.seat_info}</p>
                  <p>票号：{item.ticket_no}</p>
                </div>
              ))}
          </div>
        </div>
        <div className="modal_option">
          <Button
            loading={this.props.isSegmentsModalBtnStatus}
            type="primary"
            onClick={() => this.props.closeModalBtn()}
          >
            取消
          </Button>
          <Button
            loading={this.props.isSegmentsModalBtnStatus}
            type="primary"
            onClick={() => this.props.submitModalBtn()}
          >
            确认{this.props.isSegmentsModalType}
          </Button>
        </div>
      </Modal>
    );
  }
}
