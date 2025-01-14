import React, { useEffect, useState, useRef } from 'react';
import { Button, Col, Form, Row, Spin, Tag } from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function SettingsDrawing(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    DrawingEnabled: false,
    MjNotifyEnabled: false,
    MjAccountFilterEnabled: false,
    MjForwardUrlEnabled: false,
    MjModeClearEnabled: false,
    MjActionCheckSuccessEnabled: false,
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

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
    localStorage.setItem('mj_notify_enabled', String(inputs.MjNotifyEnabled));
  }, [props.options]);

  return (
    <>
      <Spin spinning={loading}>
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={t('DrawingSettings')}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Switch
                  field={'DrawingEnabled'}
                  label={t('EnableDrawingFunction')}
                  size='default'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) => {
                    setInputs({
                      ...inputs,
                      DrawingEnabled: value,
                    });
                  }}
                />
              </Col>
              <Col span={8}>
                <Form.Switch
                  field={'MjNotifyEnabled'}
                  label={t('AllowCallback（Will leakServer IP Address）')}
                  size='default'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      MjNotifyEnabled: value,
                    })
                  }
                />
              </Col>
              <Col span={8}>
                <Form.Switch
                  field={'MjAccountFilterEnabled'}
                  label={t('Allow AccountFilter ParameterNumber')}
                  size='default'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      MjAccountFilterEnabled: value,
                    })
                  }
                />
              </Col>
              <Col span={8}>
                <Form.Switch
                  field={'MjForwardUrlEnabled'}
                  label={t('EnableOfAfterConvertUpstreamAddressReplaceForServerAddress')}
                  size='default'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      MjForwardUrlEnabled: value,
                    })
                  }
                />
              </Col>
              <Col span={8}>
                <Form.Switch
                  field={'MjModeClearEnabled'}
                  label={
                    <>
                      {t('EnableOfAfterWill clearRemoveUseUserPromptWordUse predefined colorsThe')} <Tag>--fast</Tag> 、
                      <Tag>--relax</Tag> {t('UsedAnd')} <Tag>--turbo</Tag> {t('ParameterNumber')}
                    </>
                  }
                  size='default'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      MjModeClearEnabled: value,
                    })
                  }
                />
              </Col>
              <Col span={8}>
                <Form.Switch
                  field={'MjActionCheckSuccessEnabled'}
                  label={t('DetectionMustWaitDrawingSuccessToProceedReleaseBigWaitOperation')}
                  size='default'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      MjActionCheckSuccessEnabled: value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Button size='default' onClick={onSubmit}>
                {t('SaveDrawingSettings')}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}
