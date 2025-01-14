import React, { useEffect, useState, useRef } from 'react';
import { Button, Col, Form, Row, Spin } from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
  verifyJSON,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function GroupRatioSettings(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    GroupRatio: '',
    UserUsableGroups: ''
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

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
        <Form.Section text={t('GroupSettings')}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.TextArea
                label={t('GroupMultiplier')}
                placeholder={t('ForOneItems JSON Text，KeyForGroupName，AllForMultiplier')}
                field={'GroupRatio'}
                autosize={{ minRows: 6, maxRows: 12 }}
                trigger='blur'
                stopValidateWithError
                rules={[
                  {
                    validator: (rule, value) => verifyJSON(value),
                    message: t('NotIsTogetherMethodThe JSON String')
                  }
                ]}
                onChange={(value) => setInputs({ ...inputs, GroupRatio: value })}
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={16}>
              <Form.TextArea
                label={t('UseUserOptionalGroup')}
                placeholder={t('ForOneItems JSON Text，KeyForGroupName，AllForGroupDescription')}
                field={'UserUsableGroups'}
                autosize={{ minRows: 6, maxRows: 12 }}
                trigger='blur'
                stopValidateWithError
                rules={[
                  {
                    validator: (rule, value) => verifyJSON(value),
                    message: t('NotIsTogetherMethodThe JSON String')
                  }
                ]}
                onChange={(value) => setInputs({ ...inputs, UserUsableGroups: value })}
              />
            </Col>
          </Row>
        </Form.Section>
      </Form>
      <Button onClick={onSubmit}>{t('SaveGroupMultiplierSettings')}</Button>
    </Spin>
  );
} 