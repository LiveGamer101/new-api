import React, { useEffect, useState, useRef } from 'react';
import { Button, Col, Form, Popconfirm, Row, Space, Spin } from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
  verifyJSON,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function ModelRatioSettings(props) {
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    ModelPrice: '',
    ModelRatio: '',
    CompletionRatio: '',
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);
  const { t } = useTranslation();

  async function onSubmit() {
    try {
      await refForm.current.validate().then(() => {
        const updateArray = compareObjects(inputs, inputsRow);
        if (!updateArray.length) return showWarning(t('YouIt seemsAndNoHaveModifyWhat'));
        
        const requestQueue = updateArray.map((item) => {
          const value = typeof inputs[item.key] === 'boolean' 
            ? String(inputs[item.key]) 
            : inputs[item.key];
          return API.put('/api/option/', { key: item.key, value });
        });

        setLoading(true);
        Promise.all(requestQueue)
          .then((res) => {
            if (res.includes(undefined)) {
              return showError(requestQueue.length > 1 ? t('Part.SaveFailed，PleaseRetry') : t('SaveFailed'));
            }
            
            for (let i = 0; i < res.length; i++) {
              if (!res[i].data.success) {
                return showError(res[i].data.message);
              }
            }
            
            showSuccess(t('SaveSuccess'));
            props.refresh();
          })
          .catch(error => {
            console.error('Unexpected error:', error);
            showError(t('SaveFailed，PleaseRetry'));
          })
          .finally(() => {
            setLoading(false);
          });
      }).catch(() => {
        showError(t('Please checkInput'));
      });
    } catch (error) {
      showError(t('Please checkInput'));
      console.error(error);
    }
  }

  async function resetModelRatio() {
    try {
      let res = await API.post(`/api/option/rest_model_ratio`);
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
        <Form.Section>
          <Row gutter={16}>
            <Col span={16}>
              <Form.TextArea
                label={t('ModelSolid.PricingStrict.')}
                extraText={t('OneNextAdjustUseHow much consumptionKnife，PriorityGreater thanModelMultiplier')}
                placeholder={t('ForOneItems JSON Text，KeyForModelName，AllForOneNextAdjustUseHow much consumptionKnife，For example. "gpt-4-gizmo-*": 0.1，One-time consumption.0.1Knife')}
                field={'ModelPrice'}
                autosize={{ minRows: 6, maxRows: 12 }}
                trigger='blur'
                stopValidateWithError
                rules={[
                  {
                    validator: (rule, value) => verifyJSON(value),
                    message: 'NotIsTogetherMethodThe JSON String'
                  }
                ]}
                onChange={(value) => setInputs({ ...inputs, ModelPrice: value })}
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={16}>
              <Form.TextArea
                label={t('ModelMultiplier')}
                placeholder={t('ForOneItems JSON Text，KeyForModelName，AllForMultiplier')}
                field={'ModelRatio'}
                autosize={{ minRows: 6, maxRows: 12 }}
                trigger='blur'
                stopValidateWithError
                rules={[
                  {
                    validator: (rule, value) => verifyJSON(value),
                    message: 'NotIsTogetherMethodThe JSON String'
                  }
                ]}
                onChange={(value) => setInputs({ ...inputs, ModelRatio: value })}
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={16}>
              <Form.TextArea
                label={t('ModelCompleteMultiplier（OnlyCorrectCustomModelConfirm reset.）')}
                extraText={t('OnlyCorrectCustomModelConfirm reset.')}
                placeholder={t('ForOneItems JSON Text，KeyForModelName，AllForMultiplier')}
                field={'CompletionRatio'}
                autosize={{ minRows: 6, maxRows: 12 }}
                trigger='blur'
                stopValidateWithError
                rules={[
                  {
                    validator: (rule, value) => verifyJSON(value),
                    message: 'NotIsTogetherMethodThe JSON String'
                  }
                ]}
                onChange={(value) => setInputs({ ...inputs, CompletionRatio: value })}
              />
            </Col>
          </Row>
        </Form.Section>
      </Form>
      <Space>
        <Button onClick={onSubmit}>{t('SaveModelMultiplierSettings')}</Button>
        <Popconfirm
          title={t('When passing throughResetModelMultiplier?？')}
          content={t('ThisModification will be irreversible')}
          okType={'danger'}
          position={'top'}
          onConfirm={resetModelRatio}
        >
          <Button type={'danger'}>{t('ResetModelMultiplier')}</Button>
        </Popconfirm>
      </Space>
    </Spin>
  );
} 