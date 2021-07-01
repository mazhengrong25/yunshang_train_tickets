/*
 * @Description: 占座
 * @Author: mzr
 * @Date: 2021-06-29 14:23:13
 * @LastEditTime: 2021-07-01 14:31:56
 * @LastEditors: mzr
 */

import React, { Component } from 'react'

import { Modal , Button , Progress } from 'antd';

import OccupyFail from '../../static/occupy_fail.png';

import './occupySeatModal.scss'

export default class index extends Component {

  constructor(props) {
    super(props);
    this.state = {

    };

  }
  componentDidMount() {
    
  }

  render() {
    return (
      <Modal 
        width={600}
        title={false}
        wrapClassName="occupy_modal"
        footer={null}
        visible={this.props.isOccupyModal}
        onCancel={() => this.props.closeOccupy()}
      > 
        {this.props.isOccupyStatus === 'success' ? (
          

          <div className="success_content">
            <div className="content_top">占座中,请稍后...</div>
            <div className="top_time">
              <div className="time_title">预计剩余时间</div>
              <div className="time_value">2分57秒</div>
            </div>
            <div className="content_process">
              <div className="process_item">
                <div className="process_img"></div>
                <div className="process_value">52%</div>
              </div>
            </div>
            <Progress percent={30} />
          </div>
        ):(

          <div className="fail_content">
              <div className="fail_img"><img src={OccupyFail} alt="占座失败" /></div>
              <div className="fail_title">占座失败</div>
              <div className="fail_message">该车次余票不足，建议选择其它车次或席别购票</div>
          </div>
        )}
        {/* 底部按钮 */}
        <div className="occupy_buttons">
          <Button 
            className="button_cancel"
            onClick={() => this.props.closeOccupy()}
          >
            {this.props.isOccupyStatus === 'success' ? '取消':'订单详情'}
          </Button>
          <Button className="button_detail" type="primary">
            {this.props.isOccupyStatus === 'success' ? '订单详情':'重选车次'}
          </Button>
        </div>
      </Modal>
    )
  }
}
