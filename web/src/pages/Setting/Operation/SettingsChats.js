import React, { useEffect, useState, useRef } from 'react';
import { Banner, Button, Col, Form, Popconfirm, Row, Space, Spin } from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
  verifyJSON,
  verifyJSONPromise
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function SettingsChats(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    Chats: "[]",
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  async function onSubmit() {
    try {
      console.log('Starting validation...');
      await refForm.current.validate().then(() => {
        console.log('Validation passed');
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
                return showError(t('Part.SaveFailed，PleaseRetry'));
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
      }).catch((error) => {
        console.error('Validation failed:', error);
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
        if (key === 'Chats') {
          const obj = JSON.parse(props.options[key]);
          currentInputs[key] = JSON.stringify(obj, null, 2);
        } else {
          currentInputs[key] = props.options[key];
        }
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
        <Form.Section text={t('TokenChatSettings')}>
          <Banner
            type='warning'
            description={t('MustConvertAboveChatUnit dollar amountAllSettingsForEmpty，ToUseUseBelowChatSettingsFunction')}
          />
          <Banner
            type='info'
            description={t('Unit dollar amountUse predefined colorsThe{key}ConvertAutomaticReplaceForsk-xxxx，{address}ConvertAutomaticReplaceForSystemSettingsTheServerAddress，Without trailing/And/v1')}
          />
          <Form.TextArea
            label={t('ChatConfiguration')}
            extraText={''}
            placeholder={t('ForOneItems JSON Text')}
            field={'Chats'}
            autosize={{ minRows: 6, maxRows: 12 }}
            trigger='blur'
            stopValidateWithError
            rules={[
              {
                validator: (rule, value) => {
                  return verifyJSON(value);
                },
                message: t('NotIsTogetherMethodThe JSON String')
              }
            ]}
            onChange={(value) =>
              setInputs({
                ...inputs,
                Chats: value
              })
            }
          />
        </Form.Section>
      </Form>
      <Space>
        <Button onClick={onSubmit}>
          {t('SaveChatSettings')}
        </Button>
      </Space>
    </Spin>
  );
}
