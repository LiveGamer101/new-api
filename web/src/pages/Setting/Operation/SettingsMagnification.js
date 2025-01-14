import React, { useEffect, useState, useRef } from 'react';
import { Button, Col, Form, Popconfirm, Row, Space, Spin } from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
  verifyJSON,
  verifyJSONPromise
} from '../../../helpers';

export default function SettingsMagnification(props) {
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    ModelPrice: '',
    ModelRatio: '',
    CompletionRatio: '',
    GroupRatio: '',
    UserUsableGroups: ''
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  async function onSubmit() {
    try {
      console.log('Starting validation...');
      await refForm.current.validate().then(() => {
        console.log('Validation passed');
        const updateArray = compareObjects(inputs, inputsRow);
        if (!updateArray.length) return showWarning('YouIt seemsAndNoHaveModifyWhat');
        const requestQueue = updateArray.map((item) => {
          let value = '';
          if (typeof inputs[item.key] === 'boolean') {
            value = String(inputs[item.key]);
          } else {
            value = inputs[item.key];
          }
          return API.put('/api/option/', {
            key: item.key,
            value
          });
        });
        setLoading(true);
        Promise.all(requestQueue)
          .then((res) => {
            if (requestQueue.length === 1) {
              if (res.includes(undefined)) return;
            } else if (requestQueue.length > 1) {
              if (res.includes(undefined))
                return showError('Part.SaveFailed，PleaseRetry');
            }
            for (let i = 0; i < res.length; i++) {
              if (!res[i].data.success) {
                return showError(res[i].data.message)
              }
            }
            showSuccess('SaveSuccess');
            props.refresh();
          })
          .catch(error => {
            console.error('Unexpected error in Promise.all:', error);

            showError('SaveFailed，PleaseRetry');
          })
          .finally(() => {
            setLoading(false);
          });
      }).catch((error) => {
        console.error('Validation failed:', error);
        showError('Please checkInput');
      });
    } catch (error) {
      showError('Please checkInput');
      console.error(error);
    }
  }

  async function resetModelRatio() {
    try {
      let res = await API.post(`/api/option/rest_model_ratio`);
      // return {success, message}
      if (res.data.success) {
        showSuccess(res.data.message);
        props.refresh();
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(error);
    }
  }

  useEffect(() => {
    const currentInputs = {};
    for (let key in props.options) {
      if (Object.keys(inputs).includes(key)) {
        currentInputs[key] = props.options[key];
      }
    }
    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    refForm.current.setValues(currentInputs);
  }, [props.options]);

  return (
    <Spin spinning={loading}>
      <Form
        values={inputs}
        getFormApi={(formAPI) => (refForm.current = formAPI)}
        style={{ marginBottom: 15 }}
      >
        <Form.Section text={'MultiplierSettings'}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.TextArea
                label={'ModelSolid.PricingStrict.'}
                extraText={'OneNextAdjustUseHow much consumptionKnife，PriorityGreater thanModelMultiplier'}
                placeholder={
                  'ForOneItems JSON Text，KeyForModelName，AllForOneNextAdjustUseHow much consumptionKnife，For example. "gpt-4-gizmo-*": 0.1，One-time consumption.0.1Knife'
                }
                field={'ModelPrice'}
                autosize={{ minRows: 6, maxRows: 12 }}
                trigger='blur'
                stopValidateWithError
                rules={[
                  {
                    validator: (rule, value) => {
                      return verifyJSON(value);
                    },
                    message: 'NotIsTogetherMethodThe JSON String'
                  }
                ]}
                onChange={(value) =>
                  setInputs({
                    ...inputs,
                    ModelPrice: value
                  })
                }
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={16}>
              <Form.TextArea
                label={'ModelMultiplier'}
                extraText={''}
                placeholder={'ForOneItems JSON Text，KeyForModelName，AllForMultiplier'}
                field={'ModelRatio'}
                autosize={{ minRows: 6, maxRows: 12 }}
                trigger='blur'
                stopValidateWithError
                rules={[
                  {
                    validator: (rule, value) => {
                      return verifyJSON(value);
                    },
                    message: 'NotIsTogetherMethodThe JSON String'
                  }
                ]}
                onChange={(value) =>
                  setInputs({
                    ...inputs,
                    ModelRatio: value
                  })
                }
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={16}>
              <Form.TextArea
                label={'ModelCompleteMultiplier（OnlyCorrectCustomModelConfirm reset.）'}
                extraText={'OnlyCorrectCustomModelConfirm reset.'}
                placeholder={'ForOneItems JSON Text，KeyForModelName，AllForMultiplier'}
                field={'CompletionRatio'}
                autosize={{ minRows: 6, maxRows: 12 }}
                trigger='blur'
                stopValidateWithError
                rules={[
                  {
                    validator: (rule, value) => {
                      return verifyJSON(value);
                    },
                    message: 'NotIsTogetherMethodThe JSON String'
                  }
                ]}
                onChange={(value) =>
                  setInputs({
                    ...inputs,
                    CompletionRatio: value
                  })
                }
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={16}>
              <Form.TextArea
                label={'GroupMultiplier'}
                extraText={''}
                placeholder={'ForOneItems JSON Text，KeyForGroupName，AllForMultiplier'}
                field={'GroupRatio'}
                autosize={{ minRows: 6, maxRows: 12 }}
                trigger='blur'
                stopValidateWithError
                rules={[
                  {
                    validator: (rule, value) => {
                      return verifyJSON(value);
                    },
                    message: 'NotIsTogetherMethodThe JSON String'
                  }
                ]}
                onChange={(value) =>
                  setInputs({
                    ...inputs,
                    GroupRatio: value
                  })
                }
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={16}>
              <Form.TextArea
                  label={'UseUserOptionalGroup'}
                  extraText={''}
                  placeholder={'ForOneItems JSON Text，KeyForGroupName，AllForMultiplier'}
                  field={'UserUsableGroups'}
                  autosize={{ minRows: 6, maxRows: 12 }}
                  trigger='blur'
                  stopValidateWithError
                  rules={[
                    {
                      validator: (rule, value) => {
                        return verifyJSON(value);
                      },
                      message: 'NotIsTogetherMethodThe JSON String'
                    }
                  ]}
                  onChange={(value) =>
                      setInputs({
                        ...inputs,
                        UserUsableGroups: value
                      })
                  }
              />
            </Col>
          </Row>
        </Form.Section>
      </Form>
      <Space>
        <Button onClick={onSubmit}>
          SaveMultiplierSettings
        </Button>
        <Popconfirm
          title='When passing throughResetModelMultiplier?？'
          content='ThisModification will be irreversible'
          okType={'danger'}
          position={'top'}
          onConfirm={() => {
            resetModelRatio();
          }}
        >
          <Button type={'danger'}>
            ResetModelMultiplier
          </Button>
        </Popconfirm>
      </Space>
    </Spin>
  );
}
