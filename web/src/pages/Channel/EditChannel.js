import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  API,
  isMobile,
  showError,
  showInfo,
  showSuccess,
  verifyJSON
} from '../../helpers';
import { CHANNEL_OPTIONS } from '../../constants';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import {
  SideSheet,
  Space,
  Spin,
  Button,
  Tooltip,
  Input,
  Typography,
  Select,
  TextArea,
  Checkbox,
  Banner
} from '@douyinfe/semi-ui';
import { Divider } from 'semantic-ui-react';
import { getChannelModels, loadChannelModels } from '../../components/utils.js';
import axios from 'axios';

const MODEL_MAPPING_EXAMPLE = {
  'gpt-3.5-turbo': 'gpt-3.5-turbo-0125'
};

const STATUS_CODE_MAPPING_EXAMPLE = {
  400: '500'
};

const REGION_EXAMPLE = {
  'default': 'us-central1',
  'claude-3-5-sonnet-20240620': 'europe-west1'
};

const fetchButtonTips = '1. NewBuildChannelWhen，PleaseRequestVerification is requiredCurrentBrowserSend out；2. EditAlreadyHaveChannel，PleaseRequestVerification is requiredBackendServerSend out';

function type2secretPrompt(type) {
  // inputs.type === 15 ? 'PressAs followsFormatInput：APIKey|SecretKey' : (inputs.type === 18 ? 'PressAs followsFormatInput：APPID|APISecret|APIKey' : 'Please enterChannelCorrespondingTheAuthenticationKey')
  switch (type) {
    case 15:
      return 'PressAs followsFormatInput：APIKey|SecretKey';
    case 18:
      return 'PressAs followsFormatInput：APPID|APISecret|APIKey';
    case 22:
      return 'PressAs followsFormatInput：APIKey-AppId，For example：fastgpt-0sp2gtvfdgyi4k30jwlgwf1i-64f335d84283f05518e9e041';
    case 23:
      return 'PressAs followsFormatInput：AppId|SecretId|SecretKey';
    case 33:
      return 'PressAs followsFormatInput：Ak|Sk|Region';
    default:
      return 'Please enterChannelCorrespondingTheAuthenticationKey';
  }
}

const EditChannel = (props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const channelId = props.editingChannel.id;
  const isEdit = channelId !== undefined;
  const [loading, setLoading] = useState(isEdit);
  const handleCancel = () => {
    props.handleClose();
  };
  const originInputs = {
    name: '',
    type: 1,
    key: '',
    openai_organization: '',
    max_input_tokens: 0,
    base_url: '',
    other: '',
    model_mapping: '',
    status_code_mapping: '',
    models: [],
    auto_ban: 1,
    test_model: '',
    groups: ['default'],
    priority: 0,
    weight: 0,
    tag: ''
  };
  const [batch, setBatch] = useState(false);
  const [autoBan, setAutoBan] = useState(true);
  // const [autoBan, setAutoBan] = useState(true);
  const [inputs, setInputs] = useState(originInputs);
  const [originModelOptions, setOriginModelOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [basicModels, setBasicModels] = useState([]);
  const [fullModels, setFullModels] = useState([]);
  const [customModel, setCustomModel] = useState('');
  const handleInputChange = (name, value) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
    if (name === 'type') {
      let localModels = [];
      switch (value) {
        case 2:
          localModels = [
            'mj_imagine',
            'mj_variation',
            'mj_reroll',
            'mj_blend',
            'mj_upscale',
            'mj_describe',
            'mj_uploads'
          ];
          break;
        case 5:
          localModels = [
            'swap_face',
            'mj_imagine',
            'mj_variation',
            'mj_reroll',
            'mj_blend',
            'mj_upscale',
            'mj_describe',
            'mj_zoom',
            'mj_shorten',
            'mj_modal',
            'mj_inpaint',
            'mj_custom_zoom',
            'mj_high_variation',
            'mj_low_variation',
            'mj_pan',
            'mj_uploads'
          ];
          break;
        case 36:
          localModels = [
            'suno_music',
            'suno_lyrics'
          ];
          break;
        default:
          localModels = getChannelModels(value);
          break;
      }
      if (inputs.models.length === 0) {
        setInputs((inputs) => ({ ...inputs, models: localModels }));
      }
      setBasicModels(localModels);
    }
    //setAutoBan
  };

  const loadChannel = async () => {
    setLoading(true);
    let res = await API.get(`/api/channel/${channelId}`);
    if (res === undefined) {
      return;
    }
    const { success, message, data } = res.data;
    if (success) {
      if (data.models === '') {
        data.models = [];
      } else {
        data.models = data.models.split(',');
      }
      if (data.group === '') {
        data.groups = [];
      } else {
        data.groups = data.group.split(',');
      }
      if (data.model_mapping !== '') {
        data.model_mapping = JSON.stringify(
          JSON.parse(data.model_mapping),
          null,
          2
        );
      }
      setInputs(data);
      if (data.auto_ban === 0) {
        setAutoBan(false);
      } else {
        setAutoBan(true);
      }
      setBasicModels(getChannelModels(data.type));
      // console.log(data);
    } else {
      showError(message);
    }
    setLoading(false);
  };


  const fetchUpstreamModelList = async (name) => {
    // if (inputs['type'] !== 1) {
    //   showError(t('OnlySupport OpenAI If it is'));
    //   return;
    // }
    setLoading(true);
    const models = inputs['models'] || [];
    let err = false;

    if (isEdit) {
      // IfIsEditMode，UseUseAlreadyHaveThechannel idObtainModelIf it is in new creation mode
      const res = await API.get('/api/channel/fetch_models/' + channelId);
      if (res.data && res.data?.success) {
        models.push(...res.data.data);
      } else {
        err = true;
      }
    } else {
      // IfIsNewBuildMode，Verification is requiredBackendProxyObtainModelIf it is in new creation mode
      if (!inputs?.['key']) {
        showError(t('PleaseFill inKey'));
        err = true;
      } else {
        try {
          const res = await API.post('/api/channel/fetch_models', {
            base_url: inputs['base_url'],
            key: inputs['key']
          });
          
          if (res.data && res.data.success) {
            models.push(...res.data.data);
          } else {
            err = true;
          }
        } catch (error) {
          console.error('Error fetching models:', error);
          err = true;
        }
      }
    }

    if (!err) {
      handleInputChange(name, Array.from(new Set(models)));
      showSuccess(t('ObtainModelIf it is in new creation modeSuccess'));
    } else {
      showError(t('ObtainModelIf it is in new creation modeFailed'));
    }
    setLoading(false);
  };

  const fetchModels = async () => {
    try {
      let res = await API.get(`/api/channel/models`);
      let localModelOptions = res.data.data.map((model) => ({
        label: model.id,
        value: model.id
      }));
      setOriginModelOptions(localModelOptions);
      setFullModels(res.data.data.map((model) => model.id));
      setBasicModels(
        res.data.data
          .filter((model) => {
            return model.id.startsWith('gpt-') || model.id.startsWith('text-');
          })
          .map((model) => model.id)
      );
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchGroups = async () => {
    try {
      let res = await API.get(`/api/group/`);
      if (res === undefined) {
        return;
      }
      setGroupOptions(
        res.data.data.map((group) => ({
          label: group,
          value: group
        }))
      );
    } catch (error) {
      showError(error.message);
    }
  };

  useEffect(() => {
    let localModelOptions = [...originModelOptions];
    inputs.models.forEach((model) => {
      if (!localModelOptions.find((option) => option.label === model)) {
        localModelOptions.push({
          label: model,
          value: model
        });
      }
    });
    setModelOptions(localModelOptions);
  }, [originModelOptions, inputs.models]);

  useEffect(() => {
    fetchModels().then();
    fetchGroups().then();
    if (isEdit) {
      loadChannel().then(() => {});
    } else {
      setInputs(originInputs);
      let localModels = getChannelModels(inputs.type);
      setBasicModels(localModels);
      setInputs((inputs) => ({ ...inputs, models: localModels }));
    }
  }, [props.editingChannel.id]);

  const submit = async () => {
    if (!isEdit && (inputs.name === '' || inputs.key === '')) {
      showInfo(t('PleaseFill inChannelNameAndChannelKey！'));
      return;
    }
    if (inputs.models.length === 0) {
      showInfo(t('PleaseAt leastSelectOneItemsModel！'));
      return;
    }
    if (inputs.model_mapping !== '' && !verifyJSON(inputs.model_mapping)) {
      showInfo(t('ModelMapping mustIsTogetherMethodThe JSON Format！'));
      return;
    }
    let localInputs = { ...inputs };
    if (localInputs.base_url && localInputs.base_url.endsWith('/')) {
      localInputs.base_url = localInputs.base_url.slice(
        0,
        localInputs.base_url.length - 1
      );
    }
    if (localInputs.type === 3 && localInputs.other === '') {
      localInputs.other = '2023-06-01-preview';
    }
    if (localInputs.type === 18 && localInputs.other === '') {
      localInputs.other = 'v2.1';
    }
    let res;
    if (!Array.isArray(localInputs.models)) {
      showError(t('SubmitFailed，Do notResetReplySubmit！'));
      handleCancel();
      return;
    }
    localInputs.auto_ban = autoBan ? 1 : 0;
    localInputs.models = localInputs.models.join(',');
    localInputs.group = localInputs.groups.join(',');
    if (isEdit) {
      res = await API.put(`/api/channel/`, {
        ...localInputs,
        id: parseInt(channelId)
      });
    } else {
      res = await API.post(`/api/channel/`, localInputs);
    }
    const { success, message } = res.data;
    if (success) {
      if (isEdit) {
        showSuccess(t('ChannelUpdateSuccess！'));
      } else {
        showSuccess(t('ChannelCreateSuccess！'));
        setInputs(originInputs);
      }
      props.refresh();
      props.handleClose();
    } else {
      showError(message);
    }
  };

  const addCustomModels = () => {
    if (customModel.trim() === '') return;
    const modelArray = customModel.split(',').map((model) => model.trim());

    let localModels = [...inputs.models];
    let localModelOptions = [...modelOptions];
    let hasError = false;

    modelArray.forEach((model) => {
      if (model && !localModels.includes(model)) {
        localModels.push(model);
        localModelOptions.push({
          key: model,
          text: model,
          value: model
        });
      } else if (model) {
        showError(t('SomeModelAlreadyExistence！'));
        hasError = true;
      }
    });

    if (hasError) return;

    setModelOptions(localModelOptions);
    setCustomModel('');
    handleInputChange('models', localModels);
  };


  return (
    <>
      <SideSheet
        maskClosable={false}
        placement={isEdit ? 'right' : 'left'}
        title={
          <Title level={3}>{isEdit ? t('UpdateChannelInfo') : t('CreateNewTheChannel')}</Title>
        }
        headerStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
        bodyStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
        visible={props.visible}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button theme="solid" size={'large'} onClick={submit}>
                {t('Submit')}
              </Button>
              <Button
                theme="solid"
                size={'large'}
                type={'tertiary'}
                onClick={handleCancel}
              >
                {t('Cancel')}
              </Button>
            </Space>
          </div>
        }
        closeIcon={null}
        onCancel={() => handleCancel()}
        width={isMobile() ? '100%' : 600}
      >
        <Spin spinning={loading}>
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>{t('Type')}：</Typography.Text>
          </div>
          <Select
            name="type"
            required
            optionList={CHANNEL_OPTIONS}
            value={inputs.type}
            onChange={(value) => handleInputChange('type', value)}
            style={{ width: '50%' }}
          />
          {inputs.type === 3 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Banner
                  type={'warning'}
                  description={t('Note，ModelDeployNameMustAndModelNameKeep consistent，BecauseFor One API Will putPleaseRequestBodyUse predefined colorsThe model ParameterNumberReplaceForYouTheDeployName（ModelNameUse predefined colorsThePoints will be removed）')}
                ></Banner>
              </div>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>
                  AZURE_OPENAI_ENDPOINT：
                </Typography.Text>
              </div>
              <Input
                label="AZURE_OPENAI_ENDPOINT"
                name="azure_base_url"
                placeholder={t('Please enter AZURE_OPENAI_ENDPOINT，For example：https://docs-test-001.openai.azure.com')}
                onChange={(value) => {
                  handleInputChange('base_url', value);
                }}
                value={inputs.base_url}
                autoComplete="new-password"
              />
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>{t('Default API This configuration can be overridden by actual request query parameters')}：</Typography.Text>
              </div>
              <Input
                label={t('Default API This configuration can be overridden by actual request query parameters')}
                name="azure_other"
                placeholder={t('Please enterDefault API This configuration can be overridden by actual request query parameters，For example：2023-06-01-preview，ThisConfigurationCanUsedActuallyThePleaseRequestQueryParameterNumberCovered by')}
                onChange={(value) => {
                  handleInputChange('other', value);
                }}
                value={inputs.other}
                autoComplete="new-password"
              />
            </>
          )}
          {inputs.type === 8 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Banner
                  type={'warning'}
                  description={t('IfYouDockingTheIsUpstreamOne APIToo many requestsPersonNew APIPlease use，PleaseUseUseOpenAIType，NotWantUseUseThisType，RemoveNonYouKnowYouHandle filtering and pagination logic first.Do what。')}
                ></Banner>
              </div>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>
                  {t('CompleteThe Base URL，SupportVariable{model}')}：
                </Typography.Text>
              </div>
              <Input
                name="base_url"
                placeholder={t('Please enterCompleteTheURL，For example：https://api.openai.com/v1/chat/completions')}
                onChange={(value) => {
                  handleInputChange('base_url', value);
                }}
                value={inputs.base_url}
                autoComplete="new-password"
              />
            </>
          )}
          {inputs.type !== 3 && inputs.type !== 8 && inputs.type !== 22 && inputs.type !== 36 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>{t('Proxy')}：</Typography.Text>
              </div>
              <Input
                label={t('Proxy')}
                name="base_url"
                placeholder={t('ThisItemOptional，UseLess thanVerification is requiredProxySite toProceed API AdjustUse')}
                onChange={(value) => {
                  handleInputChange('base_url', value);
                }}
                value={inputs.base_url}
                autoComplete="new-password"
              />
            </>
          )}
          {inputs.type === 22 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>{t('Note nonAddress')}：</Typography.Text>
              </div>
              <Input
                name="base_url"
                placeholder={t('Please enterNote nonAddress，FormatFor：https://fastgpt.run/api/openapi')}
                onChange={(value) => {
                  handleInputChange('base_url', value);
                }}
                value={inputs.base_url}
                autoComplete="new-password"
              />
            </>
          )}
          {inputs.type === 36 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>
                  {t('NoteNonChat API，PleaseBe sureFill inCorrectTheAPIAddress，NoThenCanAbleCauseNoneMethodUseUse')}
                </Typography.Text>
              </div>
              <Input
                name="base_url"
                placeholder={t('Please enterThe path before. /suno FrontThePath，ThroughOftenThat isFill in，For example：https://api.example.com')}
                onChange={(value) => {
                  handleInputChange('base_url', value);
                }}
                value={inputs.base_url}
                autoComplete="new-password"
              />
            </>
          )}
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>{t('Name')}：</Typography.Text>
          </div>
          <Input
            required
            name="name"
            placeholder={t('PleaseForChannelPlease set the system.')}
            onChange={(value) => {
              handleInputChange('name', value);
            }}
            value={inputs.name}
            autoComplete="new-password"
          />
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>{t('Group')}：</Typography.Text>
          </div>
          <Select
            placeholder={t('PleaseSelectCanUsedUseUseThisChannelTheGroup')}
            name="groups"
            required
            multiple
            selection
            allowAdditions
            additionLabel={t('PleaseHandle filtering and pagination logic first.SystemSettingsRemoveEditGroupMultiplierUsedAddNewTheGroup：')}
            onChange={(value) => {
              handleInputChange('groups', value);
            }}
            value={inputs.groups}
            autoComplete="new-password"
            optionList={groupOptions}
          />
          {inputs.type === 18 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>ModelThis configuration can be overridden by actual request query parameters：</Typography.Text>
              </div>
              <Input
                name="other"
                placeholder={
                  'Please enterSupports using.ModelThis configuration can be overridden by actual request query parameters，NoteIsInterfaceAddressUse predefined colorsTheThis configuration can be overridden by actual request query parametersNumber，For example：v2.1'
                }
                onChange={(value) => {
                  handleInputChange('other', value);
                }}
                value={inputs.other}
                autoComplete="new-password"
              />
            </>
          )}
          {inputs.type === 41 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>{t('Knowledge base.')}：</Typography.Text>
              </div>
              <TextArea
                name="other"
                placeholder={t('Please enterKnowledge base.，For example：us-central1\nSupportUseUseModelMappingFormat\n' +
                  '{\n' +
                  '    "default": "us-central1",\n' +
                  '    "claude-3-5-sonnet-20240620": "europe-west1"\n' +
                  '}')}
                autosize={{ minRows: 2 }}
                onChange={(value) => {
                  handleInputChange('other', value);
                }}
                value={inputs.other}
                autoComplete="new-password"
              />
              <Typography.Text
                style={{
                  color: 'rgba(var(--semi-blue-5), 1)',
                  userSelect: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  handleInputChange(
                    'other',
                    JSON.stringify(REGION_EXAMPLE, null, 2)
                  );
                }}
              >
                {t('Used to support the system's email sendingTemplate')}
              </Typography.Text>
            </>
          )}
          {inputs.type === 21 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>��Fill in all. ID：</Typography.Text>
              </div>
              <Input
                label="Knowledge base ID"
                name="other"
                placeholder={'Please enterKnowledge base ID，For example：123456'}
                onChange={(value) => {
                  handleInputChange('other', value);
                }}
                value={inputs.other}
                autoComplete="new-password"
              />
            </>
          )}
          {inputs.type === 39 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>Account ID：</Typography.Text>
              </div>
              <Input
                name="other"
                placeholder={
                  'Please enterAccount ID，For example：d6b5da8hk1awo8nap34ube6gh'
                }
                onChange={(value) => {
                  handleInputChange('other', value);
                }}
                value={inputs.other}
                autoComplete="new-password"
              />
            </>
          )}
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>{t('Model')}：</Typography.Text>
          </div>
          <Select
            placeholder={'PleaseSelectThisChannelOfSupportTheModel'}
            name="models"
            required
            multiple
            selection
            filter
            searchPosition='dropdown'
            onChange={(value) => {
              handleInputChange('models', value);
            }}
            value={inputs.models}
            autoComplete="new-password"
            optionList={modelOptions}
          />
          <div style={{ lineHeight: '40px', marginBottom: '12px' }}>
            <Space>
              <Button
                type="primary"
                onClick={() => {
                  handleInputChange('models', basicModels);
                }}
              >
                {t('Used to support the system's email sendingRelatedModel')}
              </Button>
              <Button
                type="secondary"
                onClick={() => {
                  handleInputChange('models', fullModels);
                }}
              >
                {t('Used to support the system's email sendingAre overwrite operationsModel')}
              </Button>
              <Tooltip content={t('NewBuildChannelWhen，PleaseRequestVerification is requiredCurrentBrowserSend out；EditAlreadyHaveChannel，PleaseRequestVerification is requiredBackendServerSend out')}>
                <Button
                  type="tertiary"
                  onClick={() => {
                    fetchUpstreamModelList('models');
                  }}
                >
                  {t('ObtainModelIf it is in new creation mode')}
                </Button>
              </Tooltip>
              <Button
                type="warning"
                onClick={() => {
                  handleInputChange('models', []);
                }}
              >
                {t('Key is in the request.Model')}
              </Button>
            </Space>
            <Input
              addonAfter={
                <Button type="primary" onClick={addCustomModels}>
                  {t('Used to support the system's email sending')}
                </Button>
              }
              placeholder={t('InputCustomModelName')}
              value={customModel}
              onChange={(value) => {
                setCustomModel(value.trim());
              }}
            />
          </div>
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>{t('ModelResetOrientation')}：</Typography.Text>
          </div>
          <TextArea
            placeholder={t('ThisItemOptional，UseLess thanModifyPleaseRequestBodyUse predefined colorsTheModelName，ForOneItems JSON String，KeyForPleaseRequestUse predefined colorsModelName，AllForWantReplaceTheModelName，For example：') + `\n${JSON.stringify(MODEL_MAPPING_EXAMPLE, null, 2)}`}
            name="model_mapping"
            onChange={(value) => {
              handleInputChange('model_mapping', value);
            }}
            autosize
            value={inputs.model_mapping}
            autoComplete="new-password"
          />
          <Typography.Text
            style={{
              color: 'rgba(var(--semi-blue-5), 1)',
              userSelect: 'none',
              cursor: 'pointer'
            }}
            onClick={() => {
              handleInputChange(
                'model_mapping',
                JSON.stringify(MODEL_MAPPING_EXAMPLE, null, 2)
              );
            }}
          >
            {t('Used to support the system's email sendingTemplate')}
          </Typography.Text>
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>{t('Key')}：</Typography.Text>
          </div>
          {batch ? (
            <TextArea
              label={t('Key')}
              name="key"
              required
              placeholder={t('Please enterKey，OneLineOneItems')}
              onChange={(value) => {
                handleInputChange('key', value);
              }}
              value={inputs.key}
              style={{ minHeight: 150, fontFamily: 'JetBrains Mono, Consolas' }}
              autoComplete="new-password"
            />
          ) : (
            <>
              {inputs.type === 41 ? (
                <TextArea
                  label={t('Authenticationjson')}
                  name="key"
                  required
                  placeholder={'{\n' +
                    '  "type": "service_account",\n' +
                    '  "project_id": "abc-bcd-123-456",\n' +
                    '  "private_key_id": "123xxxxx456",\n' +
                    '  "private_key": "-----BEGIN PRIVATE KEY-----xxxx\n' +
                    '  "client_email": "xxx@developer.gserviceaccount.com",\n' +
                    '  "client_id": "111222333",\n' +
                    '  "auth_uri": "https://accounts.google.com/o/oauth2/auth",\n' +
                    '  "token_uri": "https://oauth2.googleapis.com/token",\n' +
                    '  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",\n' +
                    '  "client_x509_cert_url": "https://xxxxx.gserviceaccount.com",\n' +
                    '  "universe_domain": "googleapis.com"\n' +
                    '}'}
                  onChange={(value) => {
                    handleInputChange('key', value);
                  }}
                  autosize={{ minRows: 10 }}
                  value={inputs.key}
                  autoComplete="new-password"
                />
              ) : (
                <Input
                  label={t('Key')}
                  name="key"
                  required
                  placeholder={t(type2secretPrompt(inputs.type))}
                  onChange={(value) => {
                    handleInputChange('key', value);
                  }}
                  value={inputs.key}
                  autoComplete="new-password"
                />
              )}
            </>
          )}
          {!isEdit && (
            <div style={{ marginTop: 10, display: 'flex' }}>
              <Space>
                <Checkbox
                  checked={batch}
                  label={t('AllowedCreate')}
                  name="batch"
                  onChange={() => setBatch(!batch)}
                />
                <Typography.Text strong>{t('AllowedCreate')}</Typography.Text>
              </Space>
            </div>
          )}
          {inputs.type === 1 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>{t('Organization')}：</Typography.Text>
              </div>
              <Input
                label={t('Organization，Optional，NotFillThenForDefaultOrganization')}
                name="openai_organization"
                placeholder={t('Please enterOrganizationorg-xxx')}
                onChange={(value) => {
                  handleInputChange('openai_organization', value);
                }}
                value={inputs.openai_organization}
              />
            </>
          )}
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>{t('DefaultTestModel')}：</Typography.Text>
          </div>
          <Input
            name="test_model"
            placeholder={t('NotFillThenForModelIf it is in new creation modeTheOneItems')}
            onChange={(value) => {
              handleInputChange('test_model', value);
            }}
            value={inputs.test_model}
          />
          <div style={{ marginTop: 10, display: 'flex' }}>
            <Space>
              <Checkbox
                name="auto_ban"
                checked={autoBan}
                onChange={() => {
                  setAutoBan(!autoBan);
                }}
              />
              <Typography.Text strong>
                {t('IsNoAutomaticDisable（Only effective when automationDisableEnableWhenConfirm reset.），CloseAfterNotMeetingAutomaticDisableThisChannel：')}
              </Typography.Text>
            </Space>
          </div>
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>
              {t('StatusCode override（Only affects local judgment，NotModifyReturnThe path before.UpstreamTheStatusCode）')}：
            </Typography.Text>
          </div>
          <TextArea
            placeholder={t('ThisItemOptional，UseLess thanOverwriteReturnTheStatusCode，For example.ConvertclaudeChannelThe400ErrorOverwriteFor500（UseLess thanRetry），Do notAbuseUseThisFunction，For example：') + 
              '\n' + JSON.stringify(STATUS_CODE_MAPPING_EXAMPLE, null, 2)}
            name="status_code_mapping"
            onChange={(value) => {
              handleInputChange('status_code_mapping', value);
            }}
            autosize
            value={inputs.status_code_mapping}
            autoComplete="new-password"
          />
          <Typography.Text
            style={{
              color: 'rgba(var(--semi-blue-5), 1)',
              userSelect: 'none',
              cursor: 'pointer'
            }}
            onClick={() => {
              handleInputChange(
                'status_code_mapping',
                JSON.stringify(STATUS_CODE_MAPPING_EXAMPLE, null, 2)
              );
            }}
          >
            {t('Used to support the system's email sendingTemplate')}
          </Typography.Text>
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>
              {t('ChannelTag')}
            </Typography.Text>
          </div>
          <Input
            label={t('ChannelTag')}
            name="tag"
            placeholder={t('ChannelTag')}
            onChange={(value) => {
              handleInputChange('tag', value);
            }}
            value={inputs.tag}
            autoComplete="new-password"
          />
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>
              {t('ChannelPriority')}
            </Typography.Text>
          </div>
          <Input
            label={t('ChannelPriority')}
            name="priority"
            placeholder={t('ChannelPriority')}
            onChange={(value) => {
              const number = parseInt(value);
              if (isNaN(number)) {
                handleInputChange('priority', value);
              } else {
                handleInputChange('priority', number);
              }
            }}
            value={inputs.priority}
            autoComplete="new-password"
          />
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>
              {t('ChannelWeight')}
            </Typography.Text>
          </div>
          <Input
            label={t('ChannelWeight')}
            name="weight"
            placeholder={t('ChannelWeight')}
            onChange={(value) => {
              const number = parseInt(value);
              if (isNaN(number)) {
                handleInputChange('weight', value);
              } else {
                handleInputChange('weight', number);
              }
            }}
            value={inputs.weight}
            autoComplete="new-password"
          />
          {inputs.type === 8 && (
          <>
            <div style={{ marginTop: 10 }}>
              <Typography.Text strong>
                {t('ChannelExtraSettings')}：
              </Typography.Text>
            </div>
            <TextArea
              placeholder={t('ThisItemOptional，UseLess thanConfigurationChannelSpecificSettings，ForOneItems JSON String，For example：') + '\n{\n  "force_format": true\n}'}
              name="setting"
              onChange={(value) => {
                handleInputChange('setting', value);
              }}
              autosize
              value={inputs.setting}
              autoComplete="new-password"
            />
            <Typography.Text
              style={{
                color: 'rgba(var(--semi-blue-5), 1)', 
                userSelect: 'none',
                cursor: 'pointer'
              }}
              onClick={() => {
                handleInputChange(
                  'setting',
                  JSON.stringify({
                    force_format: true
                  }, null, 2)
                );
              }}
            >
              {t('Used to support the system's email sendingTemplate')}
              </Typography.Text>
            </>
          )}  
        </Spin>
      </SideSheet>
    </>
  );
};

export default EditChannel;
