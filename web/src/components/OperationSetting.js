import React, { useEffect, useState } from 'react';
import { Card, Spin, Tabs } from '@douyinfe/semi-ui';
import SettingsGeneral from '../pages/Setting/Operation/SettingsGeneral.js';
import SettingsDrawing from '../pages/Setting/Operation/SettingsDrawing.js';
import SettingsSensitiveWords from '../pages/Setting/Operation/SettingsSensitiveWords.js';
import SettingsLog from '../pages/Setting/Operation/SettingsLog.js';
import SettingsDataDashboard from '../pages/Setting/Operation/SettingsDataDashboard.js';
import SettingsMonitoring from '../pages/Setting/Operation/SettingsMonitoring.js';
import SettingsCreditLimit from '../pages/Setting/Operation/SettingsCreditLimit.js';
import SettingsMagnification from '../pages/Setting/Operation/SettingsMagnification.js';
import ModelSettingsVisualEditor from '../pages/Setting/Operation/ModelSettingsVisualEditor.js';
import GroupRatioSettings from '../pages/Setting/Operation/GroupRatioSettings.js';
import ModelRatioSettings from '../pages/Setting/Operation/ModelRatioSettings.js';


import { API, showError, showSuccess } from '../helpers';
import SettingsChats from '../pages/Setting/Operation/SettingsChats.js';
import { useTranslation } from 'react-i18next';

const OperationSetting = () => {
  const { t } = useTranslation();
  let [inputs, setInputs] = useState({
    QuotaForNewUser: 0,
    QuotaForInviter: 0,
    QuotaForInvitee: 0,
    QuotaRemindThreshold: 0,
    PreConsumedQuota: 0,
    StreamCacheQueueLength: 0,
    ModelRatio: '',
    CompletionRatio: '',
    ModelPrice: '',
    GroupRatio: '',
    UserUsableGroups: '',
    TopUpLink: '',
    ChatLink: '',
    ChatLink2: '', // AddNewStatusVariable
    QuotaPerUnit: 0,
    AutomaticDisableChannelEnabled: false,
    AutomaticEnableChannelEnabled: false,
    ChannelDisableThreshold: 0,
    LogConsumeEnabled: false,
    DisplayInCurrencyEnabled: false,
    DisplayTokenStatEnabled: false,
    CheckSensitiveEnabled: false,
    CheckSensitiveOnPromptEnabled: false,
    CheckSensitiveOnCompletionEnabled: '',
    StopOnSensitiveEnabled: '',
    SensitiveWords: '',
    MjNotifyEnabled: false,
    MjAccountFilterEnabled: false,
    MjModeClearEnabled: false,
    MjForwardUrlEnabled: false,
    MjActionCheckSuccessEnabled: false,
    DrawingEnabled: false,
    DataExportEnabled: false,
    DataExportDefaultTime: 'hour',
    DataExportInterval: 5,
    DefaultCollapseSidebar: false, // Default Collapsed Sidebar
    RetryTimes: 0,
    Chats: "[]",
  });

  let [loading, setLoading] = useState(false);

  const getOptions = async () => {
    const res = await API.get('/api/option/');
    const { success, message, data } = res.data;
    if (success) {
      let newInputs = {};
      data.forEach((item) => {
        if (
          item.key === 'ModelRatio' ||
          item.key === 'GroupRatio' ||
          item.key === 'UserUsableGroups' ||
          item.key === 'CompletionRatio' ||
          item.key === 'ModelPrice'
        ) {
          item.value = JSON.stringify(JSON.parse(item.value), null, 2);
        }
        if (
          item.key.endsWith('Enabled') ||
          ['DefaultCollapseSidebar'].includes(item.key)
        ) {
          newInputs[item.key] = item.value === 'true' ? true : false;
        } else {
          newInputs[item.key] = item.value;
        }
      });

      setInputs(newInputs);
    } else {
      showError(message);
    }
  };
  async function onRefresh() {
    try {
      setLoading(true);
      await getOptions();
      // showSuccess('RefreshSuccess');
    } catch (error) {
      showError('RefreshFailed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    onRefresh();
  }, []);

  return (
    <>
      <Spin spinning={loading} size='large'>
        {/* ThroughUseSettings */}
        <Card style={{ marginTop: '10px' }}>
          <SettingsGeneral options={inputs} refresh={onRefresh} />
        </Card>
        {/* DrawingSettings */}
        <Card style={{ marginTop: '10px' }}>
          <SettingsDrawing options={inputs} refresh={onRefresh} />
        </Card>
        {/* Blocked Word FilterSettings */}
        <Card style={{ marginTop: '10px' }}>
          <SettingsSensitiveWords options={inputs} refresh={onRefresh} />
        </Card>
        {/* LogsSettings */}
        <Card style={{ marginTop: '10px' }}>
          <SettingsLog options={inputs} refresh={onRefresh} />
        </Card>
        {/* NumberDashboard */}
        <Card style={{ marginTop: '10px' }}>
          <SettingsDataDashboard options={inputs} refresh={onRefresh} />
        </Card>
        {/* MonitoringSettings */}
        <Card style={{ marginTop: '10px' }}>
          <SettingsMonitoring options={inputs} refresh={onRefresh} />
        </Card>
        {/* QuotaSettings */}
        <Card style={{ marginTop: '10px' }}>
          <SettingsCreditLimit options={inputs} refresh={onRefresh} />
        </Card>
        {/* ChatSettings */}
        <Card style={{ marginTop: '10px' }}>
          <SettingsChats options={inputs} refresh={onRefresh} />
        </Card>
        {/* GroupMultiplierSettings */}
        <Card style={{ marginTop: '10px' }}>
          <GroupRatioSettings options={inputs} refresh={onRefresh} />
        </Card>
        {/* MergeModelMultiplierSettingsAndCanVisualizationMultiplierSettings */}
        <Card style={{ marginTop: '10px' }}>
          <Tabs type="line">
            <Tabs.TabPane tab={t('ModelMultiplierSettings')} itemKey="model">
              <ModelRatioSettings options={inputs} refresh={onRefresh} />
            </Tabs.TabPane>
            <Tabs.TabPane tab={t('CanVisualizationMultiplierSettings')} itemKey="visual">
              <ModelSettingsVisualEditor options={inputs} refresh={onRefresh} />
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </Spin>
    </>
  );
};

export default OperationSetting;
