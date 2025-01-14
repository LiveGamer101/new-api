import React, { useEffect, useState } from 'react';
import {
  API,
  isMobile,
  shouldShowPrompt,
  showError,
  showInfo,
  showSuccess,
  showWarning,
  timestamp2string
} from '../helpers';

import { CHANNEL_OPTIONS, ITEMS_PER_PAGE } from '../constants';
import {
  getQuotaPerUnit,
  renderGroup,
  renderNumberWithPoint,
  renderQuota, renderQuotaWithPrompt
} from '../helpers/render';
import {
  Button, Divider,
  Dropdown,
  Form, Input,
  InputNumber, Modal,
  Popconfirm,
  Space,
  SplitButtonGroup,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography
} from '@douyinfe/semi-ui';
import EditChannel from '../pages/Channel/EditChannel';
import { IconList, IconTreeTriangleDown } from '@douyinfe/semi-icons';
import { loadChannelModels } from './utils.js';
import EditTagModal from '../pages/Channel/EditTagModal.js';
import TextNumberInput from './custom/TextNumberInput.js';
import { useTranslation } from 'react-i18next';

function renderTimestamp(timestamp) {
  return <>{timestamp2string(timestamp)}</>;
}

const ChannelsTable = () => {
  const { t } = useTranslation();
  
  let type2label = undefined;

  const renderType = (type) => {
    if (!type2label) {
      type2label = new Map();
      for (let i = 0; i < CHANNEL_OPTIONS.length; i++) {
        type2label[CHANNEL_OPTIONS[i].value] = CHANNEL_OPTIONS[i];
      }
      type2label[0] = { value: 0, text: t('UnknownType'), color: 'grey' };
    }
    return (
      <Tag size="large" color={type2label[type]?.color}>
        {type2label[type]?.text}
      </Tag>
    );
  };

  const renderTagType = () => {
    return (
      <Tag
        color='light-blue'
        prefixIcon={<IconList />}
        size='large'
        shape='circle'
        type='light'
      >
        {t('Tag Aggregation')}
      </Tag>
    );
  };

  const renderStatus = (status) => {
    switch (status) {
      case 1:
        return (
          <Tag size="large" color="green">
            {t('YesEnable')}
          </Tag>
        );
      case 2:
        return (
          <Tag size="large" color="yellow">
            {t('YesDisable')}
          </Tag>
        );
      case 3:
        return (
          <Tag size="large" color="yellow">
            {t('AutomaticDisable')}
          </Tag>
        );
      default:
        return (
          <Tag size="large" color="grey">
            {t('UnknownStatus')}
          </Tag>
        );
    }
  };

  const renderResponseTime = (responseTime) => {
    let time = responseTime / 1000;
    time = time.toFixed(2) + t(' Seconds');
    if (responseTime === 0) {
      return (
        <Tag size="large" color="grey">
          {t('Untested')}
        </Tag>
      );
    } else if (responseTime <= 1000) {
      return (
        <Tag size="large" color="green">
          {time}
        </Tag>
      );
    } else if (responseTime <= 3000) {
      return (
        <Tag size="large" color="lime">
          {time}
        </Tag>
      );
    } else if (responseTime <= 5000) {
      return (
        <Tag size="large" color="yellow">
          {time}
        </Tag>
      );
    } else {
      return (
        <Tag size="large" color="red">
          {time}
        </Tag>
      );
    }
  };

  const columns = [
    // {
    //     title: '',
    //     dataIndex: 'checkbox',
    //     className: 'checkbox',
    // },
    {
      title: t('ID'),
      dataIndex: 'id'
    },
    {
      title: t('Name'),
      dataIndex: 'name'
    },
    {
      title: t('Grouping'),
      dataIndex: 'group',
      render: (text, record, index) => {
        return (
          <div>
            <Space spacing={2}>
              {text?.split(',')
                .sort((a, b) => {
                  if (a === 'default') return -1;
                  if (b === 'default') return 1;
                  return a.localeCompare(b);
                })
                .map((item, index) => {
                  return renderGroup(item);
                })}
            </Space>
          </div>
        );
      }
    },
    {
      title: t('Type'),
      dataIndex: 'type',
      render: (text, record, index) => {
        if (record.children === undefined) {
          return <>{renderType(text)}</>;
        } else {
          return <>{renderTagType()}</>;
        }
      }
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      render: (text, record, index) => {
        if (text === 3) {
          if (record.other_info === '') {
            record.other_info = '{}';
          }
          let otherInfo = JSON.parse(record.other_info);
          let reason = otherInfo['status_reason'];
          let time = otherInfo['status_time'];
          return (
            <div>
              <Tooltip content={t('Reason：') + reason + t('，Time：') + timestamp2string(time)}>
                {renderStatus(text)}
              </Tooltip>
            </div>
          );
        } else {
          return renderStatus(text);
        }
      }
    },
    {
      title: t('ResponseTime'),
      dataIndex: 'response_time',
      render: (text, record, index) => {
        return <div>{renderResponseTime(text)}</div>;
      }
    },
    {
      title: t('YesUse/Remaining'),
      dataIndex: 'expired_time',
      render: (text, record, index) => {
        if (record.children === undefined) {
          return (
            <div>
              <Space spacing={1}>
                <Tooltip content={t('YesUseQuota')}>
                  <Tag color="white" type="ghost" size="large">
                    {renderQuota(record.used_quota)}
                  </Tag>
                </Tooltip>
                <Tooltip content={t('RemainingQuota') + record.balance + t('，Click to Update')}>
                  <Tag
                    color="white"
                    type="ghost"
                    size="large"
                    onClick={() => {
                      updateChannelBalance(record);
                    }}
                  >
                    ${renderNumberWithPoint(record.balance)}
                  </Tag>
                </Tooltip>
              </Space>
            </div>
          );
        } else {
          return <Tooltip content={t('YesUseQuota')}>
            <Tag color="white" type="ghost" size="large">
              {renderQuota(record.used_quota)}
            </Tag>
          </Tooltip>;
        }
      }
    },
    {
      title: t('Priority'),
      dataIndex: 'priority',
      render: (text, record, index) => {
        if (record.children === undefined) {
          return (
            <div>
              <InputNumber
                style={{ width: 70 }}
                name="priority"
                onBlur={(e) => {
                  manageChannel(record.id, 'priority', record, e.target.value);
                }}
                keepFocus={true}
                innerButtons
                defaultValue={record.priority}
                min={-999}
              />
            </div>
          );
        } else {
          return <>
            <InputNumber
              style={{ width: 70 }}
              name="priority"
              keepFocus={true}
              onBlur={(e) => {
                Modal.warning({
                  title: t('Modify SubChannelPriority'),
                  content: t('Are you sure you want to change all subChannelPriorityFor ') + e.target.value + t(' ?？'),
                  onOk: () => {
                    if (e.target.value === '') {
                      return;
                    }
                    submitTagEdit('priority', {
                      tag: record.key,
                      priority: e.target.value
                    })
                  },
                })
              }}
              innerButtons
              defaultValue={record.priority}
              min={-999}
            />
          </>;
        }
      }
    },
    {
      title: t('Weight'),
      dataIndex: 'weight',
      render: (text, record, index) => {
        if (record.children === undefined) {
          return (
            <div>
              <InputNumber
                style={{ width: 70 }}
                name="weight"
                onBlur={(e) => {
                  manageChannel(record.id, 'weight', record, e.target.value);
                }}
                keepFocus={true}
                innerButtons
                defaultValue={record.weight}
                min={0}
              />
            </div>
          );
        } else {
          return (
            <InputNumber
              style={{ width: 70 }}
              name="weight"
              keepFocus={true}
              onBlur={(e) => {
                Modal.warning({
                  title: t('Modify SubChannelWeight'),
                  content: t('Are you sure you want to change all subChannelWeightFor ') + e.target.value + t(' ?？'),
                  onOk: () => {
                    if (e.target.value === '') {
                      return;
                    }
                    submitTagEdit('weight', {
                      tag: record.key,
                      weight: e.target.value
                    })
                  },
                })
              }}
              innerButtons
              defaultValue={record.weight}
              min={-999}
            />
          );
        }
      }
    },
    {
      title: '',
      dataIndex: 'operate',
      render: (text, record, index) => {
        if (record.children === undefined) {
          return (
            <div>
              <SplitButtonGroup
                style={{ marginRight: 1 }}
                aria-label={t('Test SingleChannelOperation Project Group')}
              >
                <Button
                  theme="light"
                  onClick={() => {
                    testChannel(record, '');
                  }}
                >
                  {t('Test')}
                </Button>
                <Dropdown
                  trigger="click"
                  position="bottomRight"
                  menu={record.test_models}
                >
                  <Button
                    style={{ padding: '8px 4px' }}
                    type="primary"
                    icon={<IconTreeTriangleDown />}
                  ></Button>
                </Dropdown>
              </SplitButtonGroup>
              <Popconfirm
                title={t('Confirm whether toDeleteThisChannel？')}
                content={t('ThisModification will be irreversible')}
                okType={'danger'}
                position={'left'}
                onConfirm={() => {
                  manageChannel(record.id, 'delete', record).then(() => {
                    removeRecord(record);
                  });
                }}
              >
                <Button theme="light" type="danger" style={{ marginRight: 1 }}>
                  {t('Delete')}
                </Button>
              </Popconfirm>
              {record.status === 1 ? (
                <Button
                  theme="light"
                  type="warning"
                  style={{ marginRight: 1 }}
                  onClick={async () => {
                    manageChannel(record.id, 'disable', record);
                  }}
                >
                  {t('Disable')}
                </Button>
              ) : (
                <Button
                  theme="light"
                  type="secondary"
                  style={{ marginRight: 1 }}
                  onClick={async () => {
                    manageChannel(record.id, 'enable', record);
                  }}
                >
                  {t('Enable')}
                </Button>
              )}
              <Button
                theme="light"
                type="tertiary"
                style={{ marginRight: 1 }}
                onClick={() => {
                  setEditingChannel(record);
                  setShowEdit(true);
                }}
              >
                {t('Edit')}
              </Button>
              <Popconfirm
                title={t('Confirm whether toCopyThisChannel？')}
                content={t('CopyChannelAll ofInfo')}
                okType={'danger'}
                position={'left'}
                onConfirm={async () => {
                  copySelectedChannel(record);
                }}
              >
                <Button theme="light" type="primary" style={{ marginRight: 1 }}>
                  {t('Copy')}
                </Button>
              </Popconfirm>
            </div>
          );
        } else {
          return (
            <>
              <Button
                theme="light"
                type="secondary"
                style={{ marginRight: 1 }}
                onClick={async () => {
                  manageTag(record.key, 'enable');
                }}
              >
                {t('EnableAll')}
              </Button>
              <Button
                theme="light"
                type="warning"
                style={{ marginRight: 1 }}
                onClick={async () => {
                  manageTag(record.key, 'disable');
                }}
              >
                {t('DisableAll')}
              </Button>
              <Button
                theme="light"
                type="tertiary"
                style={{ marginRight: 1 }}
                onClick={() => {
                  setShowEditTag(true);
                  setEditingTag(record.key);
                }}
              >
                {t('Edit')}
              </Button>
            </>
          );
        }
      }
    }
  ];

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [idSort, setIdSort] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchGroup, setSearchGroup] = useState('');
  const [searchModel, setSearchModel] = useState('');
  const [searching, setSearching] = useState(false);
  const [updatingBalance, setUpdatingBalance] = useState(false);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [showPrompt, setShowPrompt] = useState(
    shouldShowPrompt('channel-test')
  );
  const [channelCount, setChannelCount] = useState(pageSize);
  const [groupOptions, setGroupOptions] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [enableBatchDelete, setEnableBatchDelete] = useState(false);
  const [editingChannel, setEditingChannel] = useState({
    id: undefined
  });
  const [showEditTag, setShowEditTag] = useState(false);
  const [editingTag, setEditingTag] = useState('');
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [showEditPriority, setShowEditPriority] = useState(false);
  const [enableTagMode, setEnableTagMode] = useState(false);
  const [showBatchSetTag, setShowBatchSetTag] = useState(false);
  const [batchSetTagValue, setBatchSetTagValue] = useState('');


  const removeRecord = (record) => {
    let newDataSource = [...channels];
    if (record.id != null) {
      let idx = newDataSource.findIndex((data) => {
        if (data.children !== undefined) {
          for (let i = 0; i < data.children.length; i++) {
            if (data.children[i].id === record.id) {
              data.children.splice(i, 1);
              return false;
            }
          }
        } else {
          return data.id === record.id
        }
      });

      if (idx > -1) {
        newDataSource.splice(idx, 1);
        setChannels(newDataSource);
      }
    }
  };

  const setChannelFormat = (channels, enableTagMode) => {
    let channelDates = [];
    let channelTags = {};
    for (let i = 0; i < channels.length; i++) {
      channels[i].key = '' + channels[i].id;
      let test_models = [];
      channels[i].models.split(',').forEach((item, index) => {
        test_models.push({
          node: 'item',
          name: item,
          onClick: () => {
            testChannel(channels[i], item);
          }
        });
      });
      channels[i].test_models = test_models;
      if (!enableTagMode) {
        channelDates.push(channels[i]);
      } else {
        let tag = channels[i].tag?channels[i].tag:"";
        // find from channelTags
        let tagIndex = channelTags[tag];
        let tagChannelDates = undefined;
        if (tagIndex === undefined) {
          // not found, create a new tag
          channelTags[tag] = 1;
          tagChannelDates = {
            key: tag,
            id: tag,
            tag: tag,
            name: 'Tags：' + tag,
            group: '',
            used_quota: 0,
            response_time: 0,
            priority: -1,
            weight: -1,
          };
          tagChannelDates.children = [];
          channelDates.push(tagChannelDates);
        } else {
          // found, add to the tag
          tagChannelDates = channelDates.find((item) => item.key === tag);
        }
        if (tagChannelDates.priority === -1) {
          tagChannelDates.priority = channels[i].priority;
        } else {
          if (tagChannelDates.priority !== channels[i].priority) {
            tagChannelDates.priority = '';
          }
        }
        if (tagChannelDates.weight === -1) {
          tagChannelDates.weight = channels[i].weight;
        } else {
          if (tagChannelDates.weight !== channels[i].weight) {
            tagChannelDates.weight = '';
          }
        }

        if (tagChannelDates.group === '') {
          tagChannelDates.group = channels[i].group;
        } else {
          let channelGroupsStr = channels[i].group;
          channelGroupsStr.split(',').forEach((item, index) => {
            if (tagChannelDates.group.indexOf(item) === -1) {
              // join
              tagChannelDates.group += ',' + item;
            }
          });
        }

        tagChannelDates.children.push(channels[i]);
        if (channels[i].status === 1) {
          tagChannelDates.status = 1;
        }
        tagChannelDates.used_quota += channels[i].used_quota;
        tagChannelDates.response_time += channels[i].response_time;
        tagChannelDates.response_time = tagChannelDates.response_time / 2;
      }

    }
    // data.key = '' + data.id
    setChannels(channelDates);
    if (channelDates.length >= pageSize) {
      setChannelCount(channelDates.length + pageSize);
    } else {
      setChannelCount(channelDates.length);
    }
  };

  const loadChannels = async (startIdx, pageSize, idSort, enableTagMode) => {
    setLoading(true);
    const res = await API.get(
      `/api/channel/?p=${startIdx}&page_size=${pageSize}&id_sort=${idSort}&tag_mode=${enableTagMode}`
    );
    if (res === undefined) {
      return;
    }
    const { success, message, data } = res.data;
    if (success) {
      if (startIdx === 0) {
        setChannelFormat(data, enableTagMode);
      } else {
        let newChannels = [...channels];
        newChannels.splice(startIdx * pageSize, data.length, ...data);
        setChannelFormat(newChannels, enableTagMode);
      }
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const copySelectedChannel = async (record) => {
    const channelToCopy = record
    channelToCopy.name += t('_Copy');
    channelToCopy.created_time = null;
    channelToCopy.balance = 0;
    channelToCopy.used_quota = 0;
    if (!channelToCopy) {
      showError(t('ChannelNot found，PleaseRefreshRetry after the page。'));
      return;
    }
    try {
      const newChannel = { ...channelToCopy, id: undefined };
      const response = await API.post('/api/channel/', newChannel);
      if (response.data.success) {
        showSuccess(t('ChannelCopySuccess'));
        await refresh();
      } else {
        showError(response.data.message);
      }
    } catch (error) {
      showError(t('ChannelCopyFailed: ') + error.message);
    }
  };

  const refresh = async () => {
    await loadChannels(activePage - 1, pageSize, idSort, enableTagMode);
  };

  useEffect(() => {
    // console.log('default effect')
    const localIdSort = localStorage.getItem('id-sort') === 'true';
    const localPageSize =
      parseInt(localStorage.getItem('page-size')) || ITEMS_PER_PAGE;
    setIdSort(localIdSort);
    setPageSize(localPageSize);
    loadChannels(0, localPageSize, localIdSort, enableTagMode)
      .then()
      .catch((reason) => {
        showError(reason);
      });
    fetchGroups().then();
    loadChannelModels().then();
  }, []);

  const manageChannel = async (id, action, record, value) => {
    let data = { id };
    let res;
    switch (action) {
      case 'delete':
        res = await API.delete(`/api/channel/${id}/`);
        break;
      case 'enable':
        data.status = 1;
        res = await API.put('/api/channel/', data);
        break;
      case 'disable':
        data.status = 2;
        res = await API.put('/api/channel/', data);
        break;
      case 'priority':
        if (value === '') {
          return;
        }
        data.priority = parseInt(value);
        res = await API.put('/api/channel/', data);
        break;
      case 'weight':
        if (value === '') {
          return;
        }
        data.weight = parseInt(value);
        if (data.weight < 0) {
          data.weight = 0;
        }
        res = await API.put('/api/channel/', data);
        break;
    }
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('ActionSuccessDone！'));
      let channel = res.data.data;
      let newChannels = [...channels];
      if (action === 'delete') {
      } else {
        record.status = channel.status;
      }
      setChannels(newChannels);
    } else {
      showError(message);
    }
  };

  const manageTag = async (tag, action) => {
    console.log(tag, action);
    let res;
    switch (action) {
      case 'enable':
        res = await API.post('/api/channel/tag/enabled', {
          tag: tag
        });
        break;
      case 'disable':
        res = await API.post('/api/channel/tag/disabled', {
          tag: tag
        });
        break;
    }
    const { success, message } = res.data;
    if (success) {
      showSuccess('ActionSuccessDone！');
      let newChannels = [...channels];
      for (let i = 0; i < newChannels.length; i++) {
        if (newChannels[i].tag === tag) {
          let status = action === 'enable' ? 1 : 2;
          newChannels[i]?.children?.forEach((channel) => {
            channel.status = status;
          });
          newChannels[i].status = status;
        }
      }
      setChannels(newChannels);
    } else {
      showError(message);
    }
  };

  const searchChannels = async (searchKeyword, searchGroup, searchModel, enableTagMode) => {
    if (searchKeyword === '' && searchGroup === '' && searchModel === '') {
      await loadChannels(0, pageSize, idSort, enableTagMode);
      setActivePage(1);
      return;
    }
    setSearching(true);
    const res = await API.get(
      `/api/channel/search?keyword=${searchKeyword}&group=${searchGroup}&model=${searchModel}&id_sort=${idSort}&tag_mode=${enableTagMode}`
    );
    const { success, message, data } = res.data;
    if (success) {
      setChannelFormat(data, enableTagMode);
      setActivePage(1);
    } else {
      showError(message);
    }
    setSearching(false);
  };

  const testChannel = async (record, model) => {
    const res = await API.get(`/api/channel/test/${record.id}?model=${model}`);
    const { success, message, time } = res.data;
    if (success) {
      record.response_time = time * 1000;
      record.test_time = Date.now() / 1000;
      showInfo(t('Channel ${name} TestSuccess，Elapsed Time ${time.toFixed(2)} Seconds。').replace('${name}', record.name).replace('${time.toFixed(2)}', time.toFixed(2)));
    } else {
      showError(message);
    }
  };

  const testAllChannels = async () => {
    const res = await API.get(`/api/channel/test`);
    const { success, message } = res.data;
    if (success) {
      showInfo(t('YesSuccessStartTestAllYesEnableChannel，PleaseRefreshPage to view results。'));
    } else {
      showError(message);
    }
  };

  const deleteAllDisabledChannels = async () => {
    const res = await API.delete(`/api/channel/disabled`);
    const { success, message, data } = res.data;
    if (success) {
      showSuccess(t('YesDeleteAllDisableChannel，Total ${data} Items').replace('${data}', data));
      await refresh();
    } else {
      showError(message);
    }
  };

  const updateChannelBalance = async (record) => {
    const res = await API.get(`/api/channel/update_balance/${record.id}/`);
    const { success, message, balance } = res.data;
    if (success) {
      record.balance = balance;
      record.balance_updated_time = Date.now() / 1000;
      showInfo(t('Channel ${name} Balance UpdateSuccess！').replace('${name}', record.name));
    } else {
      showError(message);
    }
  };

  const updateAllChannelsBalance = async () => {
    setUpdatingBalance(true);
    const res = await API.get(`/api/channel/update_balance`);
    const { success, message } = res.data;
    if (success) {
      showInfo(t('YesUpdateCompleteAllYesEnableChannelBalance！'));
    } else {
      showError(message);
    }
    setUpdatingBalance(false);
  };

  const batchDeleteChannels = async () => {
    if (selectedChannels.length === 0) {
      showError(t('PleaseSelect firstRequired  DeleteofChannel！'));
      return;
    }
    setLoading(true);
    let ids = [];
    selectedChannels.forEach((channel) => {
      ids.push(channel.id);
    });
    const res = await API.post(`/api/channel/batch`, { ids: ids });
    const { success, message, data } = res.data;
    if (success) {
      showSuccess(t('YesDelete ${data} ItemsChannel！').replace('${data}', data));
      await refresh();
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const fixChannelsAbilities = async () => {
    const res = await API.post(`/api/channel/fix`);
    const { success, message, data } = res.data;
    if (success) {
      showSuccess(t('YesRepair ${data} ItemsChannel！').replace('${data}', data));
      await refresh();
    } else {
      showError(message);
    }
  };

  let pageData = channels.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize
  );

  const handlePageChange = (page) => {
    setActivePage(page);
    if (page === Math.ceil(channels.length / pageSize) + 1) {
      // In this case we have to load more data and then append them.
      loadChannels(page - 1, pageSize, idSort, enableTagMode).then((r) => {
      });
    }
  };

  const handlePageSizeChange = async (size) => {
    localStorage.setItem('page-size', size + '');
    setPageSize(size);
    setActivePage(1);
    loadChannels(0, size, idSort, enableTagMode)
      .then()
      .catch((reason) => {
        showError(reason);
      });
  };

  const fetchGroups = async () => {
    try {
      let res = await API.get(`/api/group/`);
      // add 'all' option
      // res.data.data.unshift('all');
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

  const submitTagEdit = async (type, data) => {
    switch (type) {
      case 'priority':
        if (data.priority === undefined || data.priority === '') {
          showInfo('PriorityMust be an integer！');
          return;
        }
        data.priority = parseInt(data.priority);
        break;
      case 'weight':
        if (data.weight === undefined || data.weight < 0 || data.weight === '') {
          showInfo('WeightMust be a non-negative integer！');
          return;
        }
        data.weight = parseInt(data.weight);
        break
    }

    try {
      const res = await API.put('/api/channel/tag', data);
      if (res?.data?.success) {
        showSuccess('UpdateSuccess！');
        await refresh();
      }
    } catch (error) {
      showError(error);
    }
  }

  const closeEdit = () => {
    setShowEdit(false);
  };

  const handleRow = (record, index) => {
    if (record.status !== 1) {
      return {
        style: {
          background: 'var(--semi-color-disabled-border)'
        }
      };
    } else {
      return {};
    }
  };

  const batchSetChannelTag = async () => {
    if (selectedChannels.length === 0) {
      showError(t('PleaseSelect firstRequired  SettingsTagsofChannel！'));
      return;
    }
    if (batchSetTagValue === '') {
      showError(t('TagsCannot be empty！'));
      return;
    }
    let ids = selectedChannels.map(channel => channel.id);
    const res = await API.post('/api/channel/batch/tag', {
      ids: ids,
      tag: batchSetTagValue === '' ? null : batchSetTagValue
    });
    if (res.data.success) {
      showSuccess(t('YesFor ${count} ItemsChannelSettingsTags！').replace('${count}', res.data.data));
      await refresh();
      setShowBatchSetTag(false);
    } else {
      showError(res.data.message);
    }
  };

  return (
    <>
      <EditTagModal
        visible={showEditTag}
        tag={editingTag}
        handleClose={() => setShowEditTag(false)}
        refresh={refresh}
      />
      <EditChannel
        refresh={refresh}
        visible={showEdit}
        handleClose={closeEdit}
        editingChannel={editingChannel}
      />
      <Form
        onSubmit={() => {
          searchChannels(searchKeyword, searchGroup, searchModel, enableTagMode);
        }}
        labelPosition="left"
      >
        <div style={{ display: 'flex' }}>
          <Space>
            <Form.Input
              field="search_keyword"
              label={t('SearchChannelKeywords')}
              placeholder={t('SearchChannelof ID，NameAnd key ...')}
              value={searchKeyword}
              loading={searching}
              onChange={(v) => {
                setSearchKeyword(v.trim());
              }}
            />
            <Form.Input
              field="search_model"
              label={t('Model')}
              placeholder={t('ModelKeyword')}
              value={searchModel}
              loading={searching}
              onChange={(v) => {
                setSearchModel(v.trim());
              }}
            />
            <Form.Select
              field="group"
              label={t('Grouping')}
              optionList={[{ label: t('SelectGrouping'), value: null }, ...groupOptions]}
              initValue={null}
              onChange={(v) => {
                setSearchGroup(v);
                searchChannels(searchKeyword, v, searchModel, enableTagMode);
              }}
            />
            <Button
              label={t('Query')}
              type="primary"
              htmlType="submit"
              className="btn-margin-right"
              style={{ marginRight: 8 }}
            >
              {t('Query')}
            </Button>
          </Space>
        </div>
      </Form>
      <Divider style={{ marginBottom: 15 }} />
      <div
        style={{
          display: isMobile() ? '' : 'flex',
          marginTop: isMobile() ? 0 : -45,
          zIndex: 999,
          pointerEvents: 'none'
        }}
      >
        <Space
          style={{ pointerEvents: 'auto', marginTop: isMobile() ? 0 : 45 }}
        >
          <Typography.Text strong>{t('UseIDSort')}</Typography.Text>
          <Switch
            checked={idSort}
            label={t('UseIDSort')}
            uncheckedText={t('Close')}
            aria-label={t('Use or notIDSort')}
            onChange={(v) => {
              localStorage.setItem('id-sort', v + '');
              setIdSort(v);
              loadChannels(0, pageSize, v, enableTagMode)
                .then()
                .catch((reason) => {
                  showError(reason);
                });
            }}
          ></Switch>
          <Button
            theme="light"
            type="primary"
            style={{ marginRight: 8 }}
            onClick={() => {
              setEditingChannel({
                id: undefined
              });
              setShowEdit(true);
            }}
          >
            {t('AddChannel')}
          </Button>
          <Popconfirm
            title={t('Confirm？')}
            okType={'warning'}
            onConfirm={testAllChannels}
            position={isMobile() ? 'top' : 'top'}
          >
            <Button theme="light" type="warning" style={{ marginRight: 8 }}>
              {t('TestAllChannel')}
            </Button>
          </Popconfirm>
          <Popconfirm
            title={t('Confirm？')}
            okType={'secondary'}
            onConfirm={updateAllChannelsBalance}
          >
            <Button theme="light" type="secondary" style={{ marginRight: 8 }}>
              {t('UpdateAllYesEnableChannelBalance')}
            </Button>
          </Popconfirm>
          <Popconfirm
            title={t('Confirm whether toDeleteDisableChannel？')}
            content={t('ThisModification will be irreversible')}
            okType={'danger'}
            onConfirm={deleteAllDisabledChannels}
          >
            <Button theme="light" type="danger" style={{ marginRight: 8 }}>
              {t('DeleteDisableChannel')}
            </Button>
          </Popconfirm>

          <Button
            theme="light"
            type="primary"
            style={{ marginRight: 8 }}
            onClick={refresh}
          >
            {t('Refresh')}
          </Button>
        </Space>
      </div>
      <div style={{ marginTop: 20 }}>
        <Space>
          <Typography.Text strong>{t('EnableBatchAction')}</Typography.Text>
          <Switch
            label={t('EnableBatchAction')}
            uncheckedText={t('Close')}
            aria-label={t('YesEnableBatchAction')}
            onChange={(v) => {
              setEnableBatchDelete(v);
            }}
          ></Switch>
          <Popconfirm
            title={t('Confirm whether toDeleteSelectedChannel？')}
            content={t('ThisModification will be irreversible')}
            okType={'danger'}
            onConfirm={batchDeleteChannels}
            disabled={!enableBatchDelete}
            position={'top'}
          >
            <Button
              disabled={!enableBatchDelete}
              theme="light"
              type="danger"
              style={{ marginRight: 8 }}
            >
              {t('DeleteSelectedChannel')}
            </Button>
          </Popconfirm>
          <Popconfirm
            title={t('Confirm whether toFix Database Consistency？')}
            content={t('Perform thisActionWhen，It may causeChannelAccessError，PleaseOnlyHandle filtering and pagination logic first.NumberDatabaseAppearedProblemWhenUse')}
            okType={'warning'}
            onConfirm={fixChannelsAbilities}
            position={'top'}
          >
            <Button theme="light" type="secondary" style={{ marginRight: 8 }}>
              {t('Fix Database Consistency')}
            </Button>
          </Popconfirm>
        </Space>
      </div>
      <div style={{ marginTop: 20 }}>
      <Space>
          <Typography.Text strong>{t('Tag AggregationMode')}</Typography.Text>
          <Switch
            checked={enableTagMode}
            label={t('Tag AggregationMode')}
            uncheckedText={t('Close')}
            aria-label={t('YesEnableTag Aggregation')}
            onChange={(v) => {
              setEnableTagMode(v);
              loadChannels(0, pageSize, idSort, v);
            }}
          />
          <Button
        disabled={!enableBatchDelete}
        theme="light"
        type="primary"
        style={{ marginRight: 8 }}
        onClick={() => setShowBatchSetTag(true)}
      >
        {t('BatchSettingsTags')}
      </Button>
        </Space>

      </div>


      <Table
        className={'channel-table'}
        style={{ marginTop: 15 }}
        columns={columns}
        dataSource={pageData}
        pagination={{
          currentPage: activePage,
          pageSize: pageSize,
          total: channelCount,
          pageSizeOpts: [10, 20, 50, 100],
          showSizeChanger: true,
          formatPageText: (page) => '',
          onPageSizeChange: (size) => {
            handlePageSizeChange(size).then();
          },
          onPageChange: handlePageChange
        }}
        loading={loading}
        onRow={handleRow}
        rowSelection={
          enableBatchDelete
            ? {
              onChange: (selectedRowKeys, selectedRows) => {
                // console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
                setSelectedChannels(selectedRows);
              }
            }
            : null
        }
      />
      <Modal
        title={t('BatchSettingsTags')}
        visible={showBatchSetTag}
        onOk={batchSetChannelTag}
        onCancel={() => setShowBatchSetTag(false)}
        maskClosable={false}
        centered={true}
      >
        <div style={{ marginBottom: 20 }}>
          <Typography.Text>{t('Please enterRequired  SettingsofTagsName')}</Typography.Text>
        </div>
        <Input
          placeholder={t('Please enterTagsName')}
          value={batchSetTagValue}
          onChange={(v) => setBatchSetTagValue(v)}
        />
      </Modal>
    </>
  );
};

export default ChannelsTable;
