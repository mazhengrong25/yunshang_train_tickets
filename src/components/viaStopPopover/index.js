/*
 * @Description: 经停站弹窗组件
 * @Author: wish.WuJunLong
 * @Date: 2021-05-13 10:34:48
 * @LastEditTime: 2021-05-14 11:59:44
 * @LastEditors: wish.WuJunLong
 */

import React, { Component } from "react";

import { Popover, Table } from "antd";

import "./viaStopPopover.scss";

const { Column } = Table;

export default class index extends Component {
  render() {
    return (
      <Popover
        title={false}
        trigger="click"
        overlayClassName="via_stop_popover"
        getPopupContainer={(triggerNode) => triggerNode.parentNode}
        placement={this.props.popoverPosition ? this.props.popoverPosition : "bottom"}
        visible={this.props.popoverStatus === this.props.data.key}
        content={() => (
          <div className="via_stop_main">
            <div className="via_stop_title">
              <p>经停站信息</p>
              <span onClick={() => this.props.close()}></span>
            </div>
            <div className="via_stop_table_body">
              <Table
                size="small"
                dataSource={this.props.popoverData}
                loading={this.props.popoverData.length < 1}
                pagination={false}
                sticky={true}
                rowKey="no"
                rowClassName={(record) =>
                  record.station === this.props.data.station.departure_name
                    ? "startAddress"
                    : record.station === this.props.data.station.arrive_name
                    ? "endAddress"
                    : ""
                }
              >
                <Column title="站序" dataIndex="no" />
                <Column title="站名" dataIndex="station" />
                <Column title="到达" dataIndex="arrive" />
                <Column title="出发" dataIndex="start" />
                <Column title="停留" dataIndex="stop" />
              </Table>
            </div>
          </div>
        )}
      >
        <div className="via_stop" onClick={() => this.props.open(this.props.data)}>
          经停站 <span></span>
        </div>
      </Popover>
    );
  }
}
