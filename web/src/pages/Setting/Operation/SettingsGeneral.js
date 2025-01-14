import React, { useEffect, useState, useRef } from 'react';
import { Banner, Button, Col, Form, Row, Spin } from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function GeneralSettings(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    TopUpLink: '',
    ChatLink: '',
    ChatLink2: '',
    QuotaPerUnit: '',
    RetryTimes: '',
    DisplayInCurrencyEnabled: false,
    DisplayTokenStatEnabled: false,
    DefaultCollapseSidebar: false,
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  function onChange(value, e) {
    const name = e.target.id;
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  }

  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow);
    if (!updateArray.length) return showWarning(t('YouIt seemsAndNoHaveModifyWhat'));
    const requestQueue = updateArray.map((item) => {
      let value = '';
      if (typeof inputs[item.key] === 'boolean') {
        value = String(inputs[item.key]);
      } else {
        value = inputs[item.key];
      }
      return API.put('/api/option/', {
        key: item.key,
        value,
      });
    });
    setLoading(true);
    Promise.all(requestQueue)
      .then((res) => {
        if (requestQueue.length === 1) {
          if (res.includes(undefined)) return;
        } else if (requestQueue.length > 1) {
          if (res.includes(undefined)) return showError(t('Part.SaveFailed，PleaseRetry'));
        }
        showSuccess(t('SaveSuccess'));
        props.refresh();
      })
      .catch(() => {
        showError(t('SaveFailed，PleaseRetry'));
      })
      .finally(() => {
        setLoading(false);
      });
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
    <>
      <Spin spinning={loading}>
        <Banner
          type='warning'
          description={t('ChatUnit dollar amountFunctionAlreadyAbandonedUse，PleaseUseUseBelowChatSettingsFunction')}
        />
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={t('ThroughUseSettings')}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Input
                  field={'TopUpLink'}
                  label={t('ChargeAllUnit dollar amount')}
                  initValue={''}
                  placeholder={t('For exampleCard issuing websiteThePurchaseUnit dollar amount')}
                  onChange={onChange}
                  showClear
                />
              </Col>
              <Col span={8}>
                <Form.Input
                  field={'ChatLink'}
                  label={t('DefaultChatRemoveUnit dollar amount')}
                  initValue={''}
                  placeholder={t('For example ChatGPT Next Web TheDeployAddress')}
                  onChange={onChange}
                  showClear
                />
              </Col>
              <Col span={8}>
                <Form.Input
                  field={'ChatLink2'}
                  label={t('ChatRemove 2 Unit dollar amount')}
                  initValue={''}
                  placeholder={t('For example ChatGPT Next Web TheDeployAddress')}
                  onChange={onChange}
                  showClear
                />
              </Col>
              <Col span={8}>
                <Form.Input
                  field={'QuotaPerUnit'}
                  label={t('UnitDollarQuota')}
                  initValue={''}
                  placeholder={t('OneUnitCurrency canExchangeTheQuota')}
                  onChange={onChange}
                  showClear
                />
              </Col>
              <Col span={8}>
                <Form.Input
                  field={'RetryTimes'}
                  label={t('FailedRetryNextNumber')}
                  initValue={''}
                  placeholder={t('FailedRetryNextNumber')}
                  onChange={onChange}
                  showClear
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Switch
                  field={'DisplayInCurrencyEnabled'}
                  label={t('UsedCurrency formDisplayQuota')}
                  size='default'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) => {
                    setInputs({
                      ...inputs,
                      DisplayInCurrencyEnabled: value,
                    });
                  }}
                />
              </Col>
              <Col span={8}>
                <Form.Switch
                  field={'DisplayTokenStatEnabled'}
                  label={t('QuotaQueryInterfaceReturnTokenQuotaAndNonUseUserQuota')}
                  size='default'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      DisplayTokenStatEnabled: value,
                    })
                  }
                />
              </Col>
              <Col span={8}>
                <Form.Switch
                  field={'DefaultCollapseSidebar'}
                  label={t('Default Collapsed Sidebar')}
                  size='default'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      DefaultCollapseSidebar: value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Button size='default' onClick={onSubmit}>
                {t('SaveThroughUseSettings')}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}
