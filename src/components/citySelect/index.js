/*
 * @Description: 城市选择组件
 * @Author: wish.WuJunLong
 * @Date: 2021-05-06 13:52:05
 * @LastEditTime: 2021-05-24 16:51:57
 * @LastEditors: wish.WuJunLong
 */
import React, { Component } from "react";

import { Button, Popover, Select, Tabs } from "antd";

import "./citySelect.scss";

import stationData from "../../tools/station_name";

import SwitchIcon from "../../static/switch_address.png"; // 切换去回程

const { Option } = Select;
const { TabPane } = Tabs;

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cityStartName: null, // 出发
      cityEndName: null, // 返回

      hotCities: [
        "北京",
        "上海",
        "天津",
        "重庆",
        "长沙",
        "长春",
        "成都",
        "福州",
        "广州",
        "贵阳",
        "呼和浩特",
        "哈尔滨",
        "合肥",
        "杭州",
        "海口",
        "济南",
        "昆明",
        "拉萨",
        "兰州",
        "南宁",
        "南京",
        "南昌",
        "沈阳",
        "石家庄",
        "太原",
        "乌鲁木齐",
        "武汉",
        "西宁",
        "西安",
        "银川",
        "郑州",
        "深圳",
        "厦门",
      ],

      startPopover: "", // 城市选中弹窗

      codeCitiesList: [], // A-Z城市数组

      allCitiesList: [], // 完整城市列表

      searchCitiesList: [], // 筛选城市列表

      startIndex: 0,
      endIndex: 13,

      longLength: 0, // 条数
    };
  }

  componentDidMount() {
    this.sortingCityData();
  }

  // 组装城市信息
  sortingCityData() {
    let cities = stationData.split("@"); // 拆分城市数据

    let city_name_character = [...Array(26).keys()].map((i) =>
      String.fromCharCode(i + 65)
    ); // 生成A-Z数组

    let array_cities = []; // 完整城市列表

    let liarray_cities_array = []; // A-Z城市列表

    for (let k = 0; k < 26; k++) {
      liarray_cities_array[k] = [];
    }

    for (let i = 0; i < cities.length; i++) {
      let titem = cities[i];
      let raha = titem.toString().charAt(0).toUpperCase();

      for (let k in city_name_character) {
        if (raha === city_name_character[k]) {
          liarray_cities_array[k].push(titem.split("|"));
        }
      }
      if (titem.length > 0) {
        titem = titem.split("|");
        // if (favcityID != "" && titem[2] == favcityID) {
        //   favcity = titem;
        //   array_cities.unshift(titem);
        //   // 当fav城市位于第一页时，避免重复显示
        //   if (i > 6) {
        //     array_cities.push(titem);
        //   }
        // } else {
        array_cities.push(titem);
        // }
      }
    }

    // 组装A-E数组
    let code_cities_list = [
      {
        code: "ABCDE",
        data: [
          liarray_cities_array[0],
          liarray_cities_array[1],
          liarray_cities_array[2],
          liarray_cities_array[3],
          liarray_cities_array[4],
        ],
      },
      {
        code: "FGHIJ",
        data: [
          liarray_cities_array[5],
          liarray_cities_array[6],
          liarray_cities_array[7],
          liarray_cities_array[8],
          liarray_cities_array[9],
        ],
      },
      {
        code: "KLMNO",
        data: [
          liarray_cities_array[10],
          liarray_cities_array[11],
          liarray_cities_array[12],
          liarray_cities_array[13],
          liarray_cities_array[14],
        ],
      },
      {
        code: "PQRST",
        data: [
          liarray_cities_array[15],
          liarray_cities_array[16],
          liarray_cities_array[17],
          liarray_cities_array[18],
          liarray_cities_array[19],
        ],
      },
      {
        code: "UVWXYZ",
        data: [
          liarray_cities_array[20],
          liarray_cities_array[21],
          liarray_cities_array[22],
          liarray_cities_array[23],
          liarray_cities_array[24],
          liarray_cities_array[25],
        ],
      },
    ];

    console.log(code_cities_list);
    this.setState({
      allCitiesList: array_cities,
      codeCitiesList: code_cities_list,
    });
  }

  // 选中城市选择器
  focusSelect(val) {
    this.setState({
      startIndex: 0,
      endIndex: 13,
      startPopover: val,
    });

    this.focusCitySelect(val);
  }

  // 获取焦点
  focusCitySelect(val) {
    let cityListModalSet;
    clearTimeout(cityListModalSet);
    cityListModalSet = setTimeout(() => {
      if (val === "start") {
        this.citySelectStart.focus();
      } else {
        this.citySelectEnd.focus();
      }
      clearTimeout(cityListModalSet);
    }, 1);
  }

  // 搜索
  handleSearch = (type, val) => {
    if (val.length > 1) {
      this.clearModal();
      this.setState({
        searchCitiesList: this.state.allCitiesList.filter(
          (item) => String(item).indexOf(val) !== -1
        ),
      });
    } else {
      this.setState({
        searchCitiesList: [],
        startPopover: type,
      });
    }
  };

  // 选中城市
  selectCity = async (type, val) => {
    console.log(val, type);
    if (type === "start") {
      await this.setState({
        cityStartName: val[1],
      });
    } else {
      await this.setState({
        cityEndName: val[1],
      });
    }
    await this.pushCityData();
  };

  // 关闭弹窗
  clearModal() {
    this.setState({
      startPopover: "",
    });
  }

  // 翻页
  nextCityList(type) {
    let start = this.state.startIndex;
    let end = this.state.endIndex;
    if (type === "up") {
      this.setState({
        startIndex: start + 13,
        endIndex: end + 13,
      });
    } else {
      this.setState({
        startIndex: start - 13,
        endIndex: end - 13,
      });
    }
  }

  // 选中城市
  async checkedCity(val, type) {
    this.clearModal();
    if (type === "start") {
      await this.setState({
        cityStartName: val[1],
      });
    } else {
      await this.setState({
        cityEndName: val[1],
      });
    }

    await this.pushCityData();
  }
  // 城市传值
  pushCityData() {
    this.props.cityData(this.state.cityStartName, this.state.cityEndName);
  }

  // 交往去回城市
  async switchCity() {
    let start = this.state.cityStartName;
    let end = this.state.cityEndName;
    await this.setState({
      cityStartName: end,
      cityEndName: start,
    });
    await this.pushCityData();
  }

  clickTab = (val) => {
    let longLength = 0;
    this.state.codeCitiesList.forEach((item) => {
      if (item.code === val) {
        item.data.forEach((oitem) => {
          if (longLength <= oitem.length) {
            longLength = oitem.length;
          }
        });
      }
    });

    this.setState({
      startIndex: 0,
      endIndex: 13,
      longLength: longLength,
    });
  };

  render() {
    return (
      <div className="content_list">
        <div className="list_item">
          <div className="item_title">出发城市</div>
          <div className="item_input">
            <div className="city_select">
              <Popover
                trigger="click"
                overlayClassName="city_list_modal"
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                onCancel={() => this.clearModal()}
                placement="bottomRight"
                destroyTooltipOnHide={true}
                visible={this.state.startPopover === "start"}
                zIndex={3000}
                content={() => (
                  <>
                    <div className="modal_title">
                      <span>支持中文/拼音/简拼/三字码输入</span>
                      <p className="clear_modal" onClick={() => this.clearModal()}></p>
                    </div>

                    <div className="modal_city">
                      <Tabs defaultActiveKey="1" onTabClick={this.clickTab}>
                        <TabPane tab="热门" key="1">
                          <div className="city_box">
                            <div className="city_list">
                              {this.state.hotCities.map((item, index) => (
                                <div
                                  key={index}
                                  onClick={() => this.checkedCity(["", item], "start")}
                                  className="list_item"
                                >
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabPane>
                        {this.state.codeCitiesList.map((item, index) => (
                          <TabPane tab={item.code} key={item.code}>
                            {item.data &&
                              item.data.map((oitem, oindex) => {
                                if (oitem[this.state.startIndex]) {
                                  return (
                                    <div className="city_box" key={oindex}>
                                      <p className="city_unit">
                                        {oitem[0] ? oitem[0][0][0].toUpperCase() : ""}
                                      </p>
                                      <div className="city_list" key={oindex}>
                                        {oitem.map((pitem, pindex) => {
                                          if (
                                            pindex > this.state.startIndex &&
                                            pindex < this.state.endIndex
                                          ) {
                                            return (
                                              <div
                                                onClick={() =>
                                                  this.checkedCity(pitem, "start")
                                                }
                                                className="list_item"
                                                key={pindex}
                                              >
                                                {pitem[1]}
                                              </div>
                                            );
                                          }
                                        })}
                                      </div>
                                    </div>
                                  );
                                }
                              })}
                            <div className="pagination_box">
                              <Button
                                size="small"
                                disabled={this.state.startIndex < 1}
                                onClick={() => this.nextCityList("down")}
                              >
                                上一页
                              </Button>
                              <Button
                                size="small"
                                disabled={this.state.endIndex >= this.state.longLength}
                                onClick={() => this.nextCityList("up")}
                              >
                                下一页
                              </Button>
                            </div>
                          </TabPane>
                        ))}
                      </Tabs>
                    </div>
                  </>
                )}
              >
                <Select
                  ref={(input) => {
                    this.citySelectStart = input;
                  }}
                  showSearch
                  defaultActiveFirstOption={false}
                  showArrow={false}
                  filterOption={false}
                  notFoundContent={null}
                  placeholder="请选择城市"
                  value={this.state.cityStartName}
                  onChange={this.selectCity.bind(this, "start")}
                  onSearch={this.handleSearch.bind(this, "start")}
                  onFocus={() => this.focusSelect("start")}
                >
                  {this.state.searchCitiesList &&
                    this.state.searchCitiesList.map((item, index) => (
                      <Option value={item} key={index}>
                        {item[1]}
                      </Option>
                    ))}
                </Select>
              </Popover>
            </div>
          </div>
        </div>

        <Button className="switch_address_btn" onClick={() => this.switchCity()}>
          <img src={SwitchIcon} alt="切换去回程图标"></img>
        </Button>

        <div className="list_item">
          <div className="item_title">到达城市</div>
          <div className="item_input">
            <div className="city_select">
              <Popover
                trigger="click"
                overlayClassName="city_list_modal"
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                onCancel={() => this.clearModal()}
                placement="bottomRight"
                destroyTooltipOnHide={true}
                visible={this.state.startPopover === "end"}
                zIndex={3000}
                content={() => (
                  <>
                    <div className="modal_title">
                      <span>支持中文/拼音/简拼/三字码输入</span>
                      <p className="clear_modal" onClick={() => this.clearModal()}></p>
                    </div>

                    <div className="modal_city">
                      <Tabs
                        defaultActiveKey="1"
                        onTabClick={() =>
                          this.setState({
                            startIndex: 0,
                            endIndex: 13,
                          })
                        }
                      >
                        <TabPane tab="热门" key="1">
                          <div className="city_box">
                            <div className="city_list">
                              {this.state.hotCities.map((item, index) => (
                                <div
                                  key={index}
                                  onClick={() => this.checkedCity(["", item], "end")}
                                  className="list_item"
                                >
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabPane>
                        {this.state.codeCitiesList.map((item, index) => (
                          <TabPane tab={item.code} key={item.code}>
                            {item.data &&
                              item.data.map((oitem, oindex) => {
                                if (oitem[this.state.startIndex]) {
                                  return (
                                    <div className="city_box" key={oindex}>
                                      <p className="city_unit">
                                        {oitem[0] ? oitem[0][0][0].toUpperCase() : ""}
                                      </p>
                                      <div className="city_list" key={oindex}>
                                        {oitem.map((pitem, pindex) => {
                                          if (
                                            pindex > this.state.startIndex &&
                                            pindex < this.state.endIndex
                                          ) {
                                            return (
                                              <div
                                                onClick={() =>
                                                  this.checkedCity(pitem, "end")
                                                }
                                                className="list_item"
                                                key={pindex}
                                              >
                                                {pitem[1]}
                                              </div>
                                            );
                                          }
                                        })}
                                      </div>
                                    </div>
                                  );
                                }
                              })}
                            <div className="pagination_box">
                              <Button
                                size="small"
                                disabled={this.state.startIndex < 1}
                                onClick={() => this.nextCityList("down")}
                              >
                                上一页
                              </Button>
                              <Button
                                size="small"
                                disabled={this.state.endIndex >= this.state.longLength}
                                onClick={() => this.nextCityList("up")}
                              >
                                下一页
                              </Button>
                            </div>
                          </TabPane>
                        ))}
                      </Tabs>
                    </div>
                  </>
                )}
              >
                <Select
                  ref={(input) => {
                    this.citySelectEnd = input;
                  }}
                  showSearch
                  defaultActiveFirstOption={false}
                  showArrow={false}
                  filterOption={false}
                  notFoundContent={null}
                  value={this.state.cityEndName}
                  placeholder="请选择城市"
                  onChange={this.selectCity.bind(this, "end")}
                  onSearch={this.handleSearch.bind(this, "end")}
                  onFocus={() => this.focusSelect("end")}
                >
                  {this.state.searchCitiesList &&
                    this.state.searchCitiesList.map((item, index) => (
                      <Option value={item} key={index}>
                        {item[1]}
                      </Option>
                    ))}
                </Select>
              </Popover>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
