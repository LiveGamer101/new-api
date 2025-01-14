import React, { useContext, useEffect, useRef, useState } from 'react';
import { initVChartSemiTheme } from '@visactor/vchart-semi-theme';

import { Button, Card, Col, Descriptions, Form, Layout, Row, Spin, Tabs } from '@douyinfe/semi-ui';
import { VChart } from "@visactor/react-vchart";
import {
  API,
  isAdmin,
  showError,
  timestamp2string,
  timestamp2string1,
} from '../../helpers';
import {
  getQuotaWithUnit,
  modelColorMap,
  renderNumber,
  renderQuota,
  renderQuotaNumberWithDigit,
  stringToColor,
  modelToColor,
} from '../../helpers/render';
import { UserContext } from '../../context/User/index.js';
import { StyleContext } from '../../context/Style/index.js';
import { useTranslation } from 'react-i18next';

const Detail = (props) => {
  const { t } = useTranslation();
  const formRef = useRef();
  let now = new Date();
  const [userState, userDispatch] = useContext(UserContext);
  const [styleState, styleDispatch] = useContext(StyleContext);
  const [inputs, setInputs] = useState({
    username: '',
    token_name: '',
    model_name: '',
    start_timestamp:
      localStorage.getItem('data_export_default_time') === 'hour'
        ? timestamp2string(now.getTime() / 1000 - 86400)
        : localStorage.getItem('data_export_default_time') === 'week'
          ? timestamp2string(now.getTime() / 1000 - 86400 * 30)
          : timestamp2string(now.getTime() / 1000 - 86400 * 7),
    end_timestamp: timestamp2string(now.getTime() / 1000 + 3600),
    channel: '',
    data_export_default_time: '',
  });
  const { username, model_name, start_timestamp, end_timestamp, channel } =
    inputs;
  const isAdminUser = isAdmin();
  const initialized = useRef(false);
  const [loading, setLoading] = useState(false);
  const [quotaData, setQuotaData] = useState([]);
  const [consumeQuota, setConsumeQuota] = useState(0);
  const [consumeTokens, setConsumeTokens] = useState(0);
  const [times, setTimes] = useState(0);
  const [dataExportDefaultTime, setDataExportDefaultTime] = useState(
    localStorage.getItem('data_export_default_time') || 'hour',
  );
  const [pieData, setPieData] = useState([{ type: 'null', value: '0' }]);
  const [lineData, setLineData] = useState([]);
  const [spec_pie, setSpecPie] = useState({
    type: 'pie',
    data: [{
      id: 'id0',
      values: pieData
    }],
    outerRadius: 0.8,
    innerRadius: 0.5,
    padAngle: 0.6,
    valueField: 'value',
    categoryField: 'type',
    pie: {
      style: {
        cornerRadius: 10,
      },
      state: {
        hover: {
          outerRadius: 0.85,
          stroke: '#000',
          lineWidth: 1,
        },
        selected: {
          outerRadius: 0.85,
          stroke: '#000',
          lineWidth: 1,
        },
      },
    },
    title: {
      visible: true,
      text: t('ModelAdjustUseNextNumberProportion'),
      subtext: `${t('Consumption distribution')}：${renderNumber(times)}`,
    },
    legends: {
      visible: true,
      orient: 'left',
    },
    label: {
      visible: true,
    },
    tooltip: {
      mark: {
        content: [
          {
            key: (datum) => datum['type'],
            value: (datum) => renderNumber(datum['value']),
          },
        ],
      },
    },
    color: {
      specified: modelColorMap,
    },
  });
  const [spec_line, setSpecLine] = useState({
    type: 'bar',
    data: [{
      id: 'barData',
      values: lineData
    }],
    xField: 'Time',
    yField: 'Usage',
    seriesField: 'Model',
    stack: true,
    legends: {
      visible: true,
      selectMode: 'single',
    },
    title: {
      visible: true,
      text: t('ModelOthers'),
      subtext: `${t('Consumption distribution')}：${renderQuota(consumeQuota, 2)}`,
    },
    bar: {
      state: {
        hover: {
          stroke: '#000',
          lineWidth: 1,
        },
      },
    },
    tooltip: {
      mark: {
        content: [
          {
            key: (datum) => datum['Model'],
            value: (datum) => renderQuota(datum['rawQuota'] || 0, 4),
          },
        ],
      },
      dimension: {
        content: [
          {
            key: (datum) => datum['Model'],
            value: (datum) => datum['rawQuota'] || 0,
          },
        ],
        updateContent: (array) => {
          array.sort((a, b) => b.value - a.value);
          let sum = 0;
          for (let i = 0; i < array.length; i++) {
            if (array[i].key == "A new one") {
              continue;
            }
            let value = parseFloat(array[i].value);
            if (isNaN(value)) {
              value = 0;
            }
            if (array[i].datum && array[i].datum.TimeSum) {
              sum = array[i].datum.TimeSum;
            }
            array[i].value = renderQuota(value, 4);
          }
          array.unshift({
            key: t('Consumption distribution'),
            value: renderQuota(sum, 4),
          });
          return array;
        },
      },
    },
    color: {
      specified: modelColorMap,
    },
  });

  // AddOneItemsNewTheStatusTo storeModel-ColorMapping
  const [modelColors, setModelColors] = useState({});

  const handleInputChange = (value, name) => {
    if (name === 'data_export_default_time') {
      setDataExportDefaultTime(value);
      return;
    }
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const loadQuotaData = async () => {
    setLoading(true);
    try {
      let url = '';
      let localStartTimestamp = Date.parse(start_timestamp) / 1000;
      let localEndTimestamp = Date.parse(end_timestamp) / 1000;
      if (isAdminUser) {
        url = `/api/data/?username=${username}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}&default_time=${dataExportDefaultTime}`;
      } else {
        url = `/api/data/self/?start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}&default_time=${dataExportDefaultTime}`;
      }
      const res = await API.get(url);
      const { success, message, data } = res.data;
      if (success) {
        setQuotaData(data);
        if (data.length === 0) {
          data.push({
            count: 0,
            model_name: 'NoneNumberData',
            quota: 0,
            created_at: now.getTime() / 1000,
          });
        }
        // sort created_at
        data.sort((a, b) => a.created_at - b.created_at);
        updateChartData(data);
      } else {
        showError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await loadQuotaData();
  };

  const initChart = async () => {
    await loadQuotaData();
  };

  const updateChartData = (data) => {
    let newPieData = [];
    let newLineData = [];
    let totalQuota = 0;
    let totalTimes = 0;
    let uniqueModels = new Set();
    let totalTokens = 0;

    // CollectAre overwrite operationsOnlyOneTheModelName
    data.forEach(item => {
      uniqueModels.add(item.model_name);
      totalTokens += item.token_used;
      totalQuota += item.quota;
      totalTimes += item.count;
    });

    // PlaceReasonColorMapping
    const newModelColors = {};
    Array.from(uniqueModels).forEach((modelName) => {
      newModelColors[modelName] = modelColorMap[modelName] || 
        modelColors[modelName] || 
        modelToColor(modelName);
    });
    setModelColors(newModelColors);

    // PressTimeAndModelAggregateNumberData
    let aggregatedData = new Map();
    data.forEach(item => {
      const timeKey = timestamp2string1(item.created_at, dataExportDefaultTime);
      const modelKey = item.model_name;
      const key = `${timeKey}-${modelKey}`;

      if (!aggregatedData.has(key)) {
        aggregatedData.set(key, {
          time: timeKey,
          model: modelKey,
          quota: 0,
          count: 0
        });
      }
      
      const existing = aggregatedData.get(key);
      existing.quota += item.quota;
      existing.count += item.count;
    });

    // PlacePie ChartNumberData
    let modelTotals = new Map();
    for (let [_, value] of aggregatedData) {
      if (!modelTotals.has(value.model)) {
        modelTotals.set(value.model, 0);
      }
      modelTotals.set(value.model, modelTotals.get(value.model) + value.count);
    }

    newPieData = Array.from(modelTotals).map(([model, count]) => ({
      type: model,
      value: count
    }));

    // GenerateTimePoint sequence
    let timePoints = Array.from(new Set([...aggregatedData.values()].map(d => d.time)));
    if (timePoints.length < 7) {
      const lastTime = Math.max(...data.map(item => item.created_at));
      const interval = dataExportDefaultTime === 'hour' ? 3600 
                      : dataExportDefaultTime === 'day' ? 86400 
                      : 604800;
      
      timePoints = Array.from({length: 7}, (_, i) => 
        timestamp2string1(lastTime - (6-i) * interval, dataExportDefaultTime)
      );
    }

    // GenerateBar chartNumberData
    timePoints.forEach(time => {
      // ForEachItemsTimePointCollectAre overwrite operationsModelTheNumberData
      let timeData = Array.from(uniqueModels).map(model => {
        const key = `${time}-${model}`;
        const aggregated = aggregatedData.get(key);
        return {
          Time: time,
          Model: model,
          rawQuota: aggregated?.quota || 0,
          Usage: aggregated?.quota ? getQuotaWithUnit(aggregated.quota, 4) : 0
        };
      });
      
      // CalculateThisTimePointTheConsumption distribution
      const timeSum = timeData.reduce((sum, item) => sum + item.rawQuota, 0);
      
      // PressPhoto rawQuota Retrieve the last used fromBigThe path before.SmallUpdate chart configuration and data
      timeData.sort((a, b) => b.rawQuota - a.rawQuota);
      
      // ForEachItemsNumberDataPointAddThisTimeTheConsumption distribution
      timeData = timeData.map(item => ({
        ...item,
        TimeSum: timeSum
      }));
      
      // ConvertUpdate chart configuration and dataAfterTheNumberDataAddThe path before. newLineData
      newLineData.push(...timeData);
    });

    // Update chart configuration and data
    newPieData.sort((a, b) => b.value - a.value);
    newLineData.sort((a, b) => a.Time.localeCompare(b.Time));

    // UpdateChartConfigurationAndNumberData
    setSpecPie(prev => ({
      ...prev,
      data: [{ id: 'id0', values: newPieData }],
      title: {
        ...prev.title,
        subtext: `${t('Consumption distribution')}：${renderNumber(totalTimes)}`
      },
      color: {
        specified: newModelColors
      }
    }));

    setSpecLine(prev => ({
      ...prev,
      data: [{ id: 'barData', values: newLineData }],
      title: {
        ...prev.title,
        subtext: `${t('Consumption distribution')}：${renderQuota(totalQuota, 2)}`
      },
      color: {
        specified: newModelColors
      }
    }));
    
    setPieData(newPieData);
    setLineData(newLineData);
    setConsumeQuota(totalQuota);
    setTimes(totalTimes);
    setConsumeTokens(totalTokens);
  };

  const getUserData = async () => {
    let res = await API.get(`/api/user/self`);
    const {success, message, data} = res.data;
    if (success) {
      userDispatch({type: 'login', payload: data});
    } else {
      showError(message);
    }
  };

  useEffect(() => {
    getUserData()
    if (!initialized.current) {
      initVChartSemiTheme({
        isWatchingThemeSwitch: true,
      });
      initialized.current = true;
      initChart();
    }
  }, []);

  return (
    <>
      <Layout>
        <Layout.Header>
          <h3>{t('NumberDashboard')}</h3>
        </Layout.Header>
        <Layout.Content>
          <Form ref={formRef} layout='horizontal' style={{ marginTop: 10 }}>
            <>
              <Form.DatePicker
                field='start_timestamp'
                label={t('StartTime')}
                style={{ width: 272 }}
                initValue={start_timestamp}
                value={start_timestamp}
                type='dateTime'
                name='start_timestamp'
                onChange={(value) =>
                  handleInputChange(value, 'start_timestamp')
                }
              />
              <Form.DatePicker
                field='end_timestamp'
                fluid
                label={t('EndTime')}
                style={{ width: 272 }}
                initValue={end_timestamp}
                value={end_timestamp}
                type='dateTime'
                name='end_timestamp'
                onChange={(value) => handleInputChange(value, 'end_timestamp')}
              />
              <Form.Select
                field='data_export_default_time'
                label={t('TimeDay')}
                style={{ width: 176 }}
                initValue={dataExportDefaultTime}
                placeholder={t('TimeDay')}
                name='data_export_default_time'
                optionList={[
                  { label: t('SmallWhen'), value: 'hour' },
                  { label: t('Week'), value: 'day' },
                  { label: t('Name'), value: 'week' },
                ]}
                onChange={(value) =>
                  handleInputChange(value, 'data_export_default_time')
                }
              ></Form.Select>
              {isAdminUser && (
                <>
                  <Form.Input
                    field='username'
                    label={t('UsernameCount')}
                    style={{ width: 176 }}
                    value={username}
                    placeholder={t('Optional values')}
                    name='username'
                    onChange={(value) => handleInputChange(value, 'username')}
                  />
                </>
              )}
              <Button
                label={t('Query')}
                type='primary'
                htmlType='submit'
                className='btn-margin-right'
                onClick={refresh}
                loading={loading}
                style={{ marginTop: 24 }}
              >
                {t('Query')}
              </Button>
              <Form.Section>
              </Form.Section>
            </>
          </Form>
          <Spin spinning={loading}>
            <Row gutter={{ xs: 16, sm: 16, md: 16, lg: 24, xl: 24, xxl: 24 }} style={{marginTop: 20}} type="flex" justify="space-between">
              <Col span={styleState.isMobile?24:8}>
                <Card className='panel-desc-card'>
                  <Descriptions row size="small">
                    <Descriptions.Item itemKey={t('CurrentBalance')}>
                      {renderQuota(userState?.user?.quota)}
                    </Descriptions.Item>
                    <Descriptions.Item itemKey={t('Historical Consumption')}>
                      {renderQuota(userState?.user?.used_quota)}
                    </Descriptions.Item>
                    <Descriptions.Item itemKey={t('PleaseRequest timesNumber')}>
                      {userState.user?.request_count}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={styleState.isMobile?24:8}>
                <Card>
                  <Descriptions row size="small">
                    <Descriptions.Item itemKey={t('StatisticsQuota')}>
                      {renderQuota(consumeQuota)}
                    </Descriptions.Item>
                    <Descriptions.Item itemKey={t('StatisticsTokens')}>
                      {consumeTokens}
                    </Descriptions.Item>
                    <Descriptions.Item itemKey={t('StatisticsNextNumber')}>
                      {times}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={styleState.isMobile ? 24 : 8}>
                <Card>
                  <Descriptions row size='small'>
                    <Descriptions.Item itemKey={t('Call frequency distributionRPM')}>
                      {(times /
                        ((Date.parse(end_timestamp) -
                          Date.parse(start_timestamp)) /
                          60000)).toFixed(3)}
                    </Descriptions.Item>
                    <Descriptions.Item itemKey={t('Call frequency distributionTPM')}>
                      {(consumeTokens /
                        ((Date.parse(end_timestamp) -
                          Date.parse(start_timestamp)) /
                          60000)).toFixed(3)}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
            <Card style={{marginTop: 20}}>
              <Tabs type="line" defaultActiveKey="1">
                <Tabs.TabPane tab={t('Others')} itemKey="1">
                  <div style={{ height: 500 }}>
                    <VChart
                      spec={spec_line}
                      option={{ mode: "desktop-browser" }}
                    />
                  </div>
                </Tabs.TabPane>
                <Tabs.TabPane tab={t('AdjustUseNextNumberDistribution')} itemKey="2">
                  <div style={{ height: 500 }}>
                    <VChart
                      spec={spec_pie}
                      option={{ mode: "desktop-browser" }}
                    />
                  </div>
                </Tabs.TabPane>

              </Tabs>
            </Card>
          </Spin>
        </Layout.Content>
      </Layout>
    </>
  );
};

export default Detail;
