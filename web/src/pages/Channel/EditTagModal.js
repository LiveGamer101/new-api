import React, { useState, useEffect } from 'react';
import { API, showError, showInfo, showSuccess, showWarning, verifyJSON } from '../../helpers';
import { SideSheet, Space, Button, Input, Typography, Spin, Modal, Select, Banner, TextArea } from '@douyinfe/semi-ui';
import TextInput from '../../components/custom/TextInput.js';
import { getChannelModels } from '../../components/utils.js';

const MODEL_MAPPING_EXAMPLE = {
  'gpt-3.5-turbo': 'gpt-3.5-turbo-0125'
};

const EditTagModal = (props) => {
  const { visible, tag, handleClose, refresh } = props;
  const [loading, setLoading] = useState(false);
  const [originModelOptions, setOriginModelOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [basicModels, setBasicModels] = useState([]);
  const [fullModels, setFullModels] = useState([]);
  const [customModel, setCustomModel] = useState('');
  const originInputs = {
    tag: '',
    new_tag: null,
    model_mapping: null,
    groups: [],
    models: [],
  }
  const [inputs, setInputs] = useState(originInputs);

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


  const handleSave = async () => {
    setLoading(true);
    let data = {
      tag: tag,
    }
    if (inputs.model_mapping !== null && inputs.model_mapping !== '') {
      if (inputs.model_mapping !== '' && !verifyJSON(inputs.model_mapping)) {
        showInfo('ModelMapping mustIsTogetherMethodThe JSON Format！');
        setLoading(false);
        return;
      }
      data.model_mapping = inputs.model_mapping
    }
    if (inputs.groups.length > 0) {
      data.groups = inputs.groups.join(',');
    }
    if (inputs.models.length > 0) {
      data.models = inputs.models.join(',');
    }
    data.new_tag = inputs.new_tag;
    // check have any change
    if (data.model_mapping === undefined && data.groups === undefined && data.models === undefined && data.new_tag === undefined) {
      showWarning('NoHaveAnyModify！');
      setLoading(false);
      return;
    }
    await submit(data);
    setLoading(false);
  };

  const submit = async (data) => {
    try {
      const res = await API.put('/api/channel/tag', data);
      if (res?.data?.success) {
        showSuccess('TagUpdateSuccess！');
        refresh();
        handleClose();
      }
    } catch (error) {
      showError(error);
    }
  }

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
    setInputs({
      ...originInputs,
      tag: tag,
      new_tag: tag,
    })
    fetchModels().then();
    fetchGroups().then();
  }, [visible]);

  const addCustomModels = () => {
    if (customModel.trim() === '') return;
    // UseUsePauseNumberSeparationString，HoweverAfterGoRemoveEachItemsModelNameFrontAfterTheEmptyStrict.
    const modelArray = customModel.split(',').map((model) => model.trim());

    let localModels = [...inputs.models];
    let localModelOptions = [...modelOptions];
    let hasError = false;

    modelArray.forEach((model) => {
      // If it already existsModelIsNoAlreadyExistence，The name is not emptyModelNameNonEmpty
      if (model && !localModels.includes(model)) {
        localModels.push(model); // AddThe path before.ModelIf it is in new creation mode
        localModelOptions.push({
          // AddThe path before.DownPullSelectItem
          key: model,
          text: model,
          value: model
        });
      } else if (model) {
        showError('SomeModelAlreadyExistence！');
        hasError = true;
      }
    });

    if (hasError) return; // IfHaveErrorThenTerminateOperation

    // UpdateStatusAll
    setModelOptions(localModelOptions);
    setCustomModel('');
    handleInputChange('models', localModels);
  };


  return (
    <SideSheet
      title="EditTag"
      visible={visible}
      onCancel={handleClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" onClick={handleSave} loading={loading}>Save</Button>
          </Space>
        </div>
      }
    >
      <div style={{ marginTop: 10 }}>
        <Banner
          type={'warning'}
          description={
            <>
              Are overwrite operationsEditAllForOverwriteOperation，Label name
            </>
          }
        ></Banner>
      </div>
      <Spin spinning={loading}>
        <TextInput
          label="TagName，LeaveEmptyThenDissolveTag"
          name="newTag"
          value={inputs.new_tag}
          onChange={(value) => setInputs({ ...inputs, new_tag: value })}
          placeholder="Please enterNewTag"
        />
        <div style={{ marginTop: 10 }}>
          <Typography.Text strong>Model，Label name：</Typography.Text>
        </div>
        <Select
          placeholder={'PleaseSelectThisChannelOfSupportTheModel，Label name'}
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
        <Input
          addonAfter={
            <Button type="primary" onClick={addCustomModels}>
              Used to support the system's email sending
            </Button>
          }
          placeholder="InputCustomModelName"
          value={customModel}
          onChange={(value) => {
            setCustomModel(value.trim());
          }}
        />
        <div style={{ marginTop: 10 }}>
          <Typography.Text strong>Group，Label name：</Typography.Text>
        </div>
        <Select
          placeholder={'PleaseSelectCanUsedUseUseThisChannelTheGroup，Label name'}
          name="groups"
          required
          multiple
          selection
          allowAdditions
          additionLabel={'PleaseHandle filtering and pagination logic first.SystemSettingsRemoveEditGroupMultiplierUsedAddNewTheGroup：'}
          onChange={(value) => {
            handleInputChange('groups', value);
          }}
          value={inputs.groups}
          autoComplete="new-password"
          optionList={groupOptions}
        />
        <div style={{ marginTop: 10 }}>
          <Typography.Text strong>ModelResetOrientation：</Typography.Text>
        </div>
        <TextArea
          placeholder={`ThisItemOptional，UseLess thanModifyPleaseRequestBodyUse predefined colorsTheModelName，ForOneItems JSON String，KeyForPleaseRequestUse predefined colorsModelName，AllForWantReplaceTheModelName，Label name`}
          name="model_mapping"
          onChange={(value) => {
            handleInputChange('model_mapping', value);
          }}
          autosize
          value={inputs.model_mapping}
          autoComplete="new-password"
        />
        <Space>
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
            Used to support the system's email sendingTemplate
          </Typography.Text>
          <Typography.Text
            style={{
              color: 'rgba(var(--semi-blue-5), 1)',
              userSelect: 'none',
              cursor: 'pointer'
            }}
            onClick={() => {
              handleInputChange(
                'model_mapping',
                JSON.stringify({}, null, 2)
              );
            }}
          >
            No changes
          </Typography.Text>
          <Typography.Text
            style={{
              color: 'rgba(var(--semi-blue-5), 1)',
              userSelect: 'none',
              cursor: 'pointer'
            }}
            onClick={() => {
              handleInputChange(
                'model_mapping',
                ""
              );
            }}
          >
            Manage
          </Typography.Text>
        </Space>
      </Spin>
    </SideSheet>
  );
};

export default EditTagModal;