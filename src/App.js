/*
 * @Description: 配置页
 * @Author: wish.WuJunLong
 * @Date: 2021-05-06 10:36:06
 * @LastEditTime: 2021-07-13 09:10:19
 * @LastEditors: wish.WuJunLong
 */
import React, { Fragment } from "react";

import { ConfigProvider } from "antd";

import { Route, Switch, Redirect, BrowserRouter } from "react-router-dom";

import locale from "antd/lib/locale/zh_CN";

import Home from "./pages/Home"; // 首页
import TicketInquiry from "./pages/TicketInquiry"; // 查询列表页
import TicketReservation from "./pages/TicketReservation"; // 车票预定页
import OrderList from "./pages/OrderList"; // 订单列表
import OrderDetail from "./pages/OrderDetail"; // 订单详情
import ChangeList from "./pages/ChangeList"; // 改签列表
import ChangeDetail from "./pages/ChangeDetail"; // 改签详情
import OrderChange from "./pages/OrderChange"; // 改签页
import RefundList from "./pages/RefundList"; // 退票列表
import RefundDetail from "./pages/RefundDetail"; //  退票详情
import OrderRefund from "./pages/OrderRefund"; // 退票页

function App() {
  return (
    <ConfigProvider locale={locale}>
      <BrowserRouter basename="/web/train">
        <Fragment>
          <Switch>
            <Route path="/orderRefund/:id" component={OrderRefund}></Route>
            <Route path="/refundDetail/:id" component={RefundDetail}></Route>
            <Route path="/refundList" component={RefundList}></Route>
            <Route path="/orderChange/:id" component={OrderChange}></Route>
            <Route path="/changeDetail/:id" component={ChangeDetail}></Route>
            <Route path="/changeList" component={ChangeList}></Route>
            <Route path="/orderDetail/:id" component={OrderDetail}></Route>
            <Route path="/orderList" component={OrderList}></Route>
            <Route path="/ticketReservation" component={TicketReservation}></Route>
            <Route path="/ticketInquiry" component={TicketInquiry}></Route>
            <Route path="/home" component={Home} />
            <Route path="/" component={Home} />
            <Redirect to={"/home"} />
          </Switch>
        </Fragment>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
