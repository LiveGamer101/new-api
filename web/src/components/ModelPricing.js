import React, { useContext, useEffect, useRef, useMemo, useState } from 'react';
import { API, copy, showError, showInfo, showSuccess } from '../helpers';
import { useTranslation } from 'react-i18next';

import {
  Banner,
  Input,
  Layout,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  Popover,
  ImagePreview,
  Button,
} from '@douyinfe/semi-ui';
import {
  IconMore,
  IconVerify,
  IconUploadError,
  IconHelpCircle,
} from '@douyinfe/semi-icons';
import { UserContext } from '../context/User/index.js';
import Text from '@douyinfe/semi-ui/lib/es/typography/text';

const ModelPricing = () => {
  const { t } = useTranslation();
  const [filteredValue, setFilteredValue] = useState([]);
  const compositionRef = useRef({ isComposition: false });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [isModalOpenurl, setIsModalOpenurl] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('default');

  const rowSelection = useMemo(
      () => ({
          onChange: (selectedRowKeys, selectedRows) => {
            setSelectedRowKeys(selectedRowKeys);
          },
      }),
      []
  );

  const handleChange = (value) => {
    if (compositionRef.current.isComposition) {
      return;
    }
    const newFilteredValue = value ? [value] : [];
    setFilteredValue(newFilteredValue);
  };
  const handleCompositionStart = () => {
    compositionRef.current.isComposition = true;
  };

  const handleCompositionEnd = (event) => {
    compositionRef.current.isComposition = false;
    const value = event.target.value;
    const newFilteredValue = value ? [value] : [];
    setFilteredValue(newFilteredValue);
  };
  
  function renderQuotaType(type) {
    // Ensure all cases are string literals by adding quotes.
    switch (type) {
      case 1:
        return (
          <Tag color='teal' size='large'>
            {t('Pay-per-use')}
          </Tag>
        );
      case 0:
        return (
          <Tag color='violet' size='large'>
            {t('Pay-as-you-go')}
          </Tag>
        );
      default:
        return t('Unknown');
    }
  }
  
  function renderAvailable(available) {
    return (
      <Popover
        content={
          <div style={{ padding: 8 }}>{t('YouTheGroupCanUsedUseUseThisModel')}</div>
        }
        position='top'
        key={available}
        style={{
          backgroundColor: 'rgba(var(--semi-blue-4),1)',
          borderColor: 'rgba(var(--semi-blue-4),1)',
          color: 'var(--semi-color-white)',
          borderWidth: 1,
          borderStyle: 'solid',
        }}
      >
        <IconVerify style={{ color: 'green' }}  size="large" />
      </Popover>
    )
  }

  const columns = [
    {
      title: t('CanUsePossibility'),
      dataIndex: 'available',
      render: (text, record, index) => {
         // if record.enable_groups contains selectedGroup, then available is true
        return renderAvailable(record.enable_groups.includes(selectedGroup));
      },
      sorter: (a, b) => a.available - b.available,
    },
    {
      title: t('ModelName'),
      dataIndex: 'model_name',
      render: (text, record, index) => {
        return (
          <>
            <Tag
              color='green'
              size='large'
              onClick={() => {
                copyText(text);
              }}
            >
              {text}
            </Tag>
          </>
        );
      },
      onFilter: (value, record) =>
        record.model_name.toLowerCase().includes(value.toLowerCase()),
      filteredValue,
    },
    {
      title: t('BillingType'),
      dataIndex: 'quota_type',
      render: (text, record, index) => {
        return renderQuotaType(parseInt(text));
      },
      sorter: (a, b) => a.quota_type - b.quota_type,
    },
    {
      title: t('CanUseGroup'),
      dataIndex: 'enable_groups',
      render: (text, record, index) => {
        
        // enable_groups is a string array
        return (
          <Space>
            {text.map((group) => {
              if (usableGroup[group]) {
                if (group === selectedGroup) {
                  return (
                    <Tag
                      color='blue'
                      size='large'
                      prefixIcon={<IconVerify />}
                    >
                      {group}
                    </Tag>
                  );
                } else {
                  return (
                    <Tag
                      color='blue'
                      size='large'
                      onClick={() => {
                        setSelectedGroup(group);
                        showInfo(t('CurrentViewTheGroupFor：{{group}}，MultiplierFor：{{ratio}}', {
                          group: group,
                          ratio: groupRatio[group]
                        }));
                      }}
                    >
                      {group}
                    </Tag>
                  );
                }
              }
            })}
          </Space>
        );
      },
    },
    {
      title: () => (
        <span style={{'display':'flex','alignItems':'center'}}>
          {t('Multiplier')}
          <Popover
            content={
              <div style={{ padding: 8 }}>
                {t('MultiplierIsForFor convenient conversion of differentPriceTheModel')}<br/>
                {t('ClickViewMultiplierExplanation')}
              </div>
            }
            position='top'
            style={{
                backgroundColor: 'rgba(var(--semi-blue-4),1)',
                borderColor: 'rgba(var(--semi-blue-4),1)',
                color: 'var(--semi-color-white)',
                borderWidth: 1,
                borderStyle: 'solid',
            }}
          >
            <IconHelpCircle
              onClick={() => {
                setModalImageUrl('/ratio.png');
                setIsModalOpenurl(true);
              }}
            />
          </Popover>
        </span>
      ),
      dataIndex: 'model_ratio',
      render: (text, record, index) => {
        let content = text;
        let completionRatio = parseFloat(record.completion_ratio.toFixed(3));
        content = (
          <>
            <Text>{t('ModelMultiplier')}：{record.quota_type === 0 ? text : t('None')}</Text>
            <br />
            <Text>{t('CompleteMultiplier')}：{record.quota_type === 0 ? completionRatio : t('None')}</Text>
            <br />
            <Text>{t('GroupMultiplier')}：{groupRatio[selectedGroup]}</Text>
          </>
        );
        return <div>{content}</div>;
      },
    },
    {
      title: t('ModelPrice'),
      dataIndex: 'model_price',
      render: (text, record, index) => {
        let content = text;
        if (record.quota_type === 0) {
          // Here *2 IsBecauseFor 1Multiplier=0.002Knife，Do notDelete
          let inputRatioPrice = record.model_ratio * 2 * groupRatio[selectedGroup];
          let completionRatioPrice =
            record.model_ratio *
            record.completion_ratio * 2 *
            groupRatio[selectedGroup];
          content = (
            <>
              <Text>{t('Prompt')} ${inputRatioPrice} / 1M tokens</Text>
              <br />
              <Text>{t('Complete')} ${completionRatioPrice} / 1M tokens</Text>
            </>
          );
        } else {
          let price = parseFloat(text) * groupRatio[selectedGroup];
          content = <>${t('ModelPrice')}：${price}</>;
        }
        return <div>{content}</div>;
      },
    },
  ];

  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userState, userDispatch] = useContext(UserContext);
  const [groupRatio, setGroupRatio] = useState({});
  const [usableGroup, setUsableGroup] = useState({});

  const setModelsFormat = (models, groupRatio) => {
    for (let i = 0; i < models.length; i++) {
      models[i].key = models[i].model_name;
      models[i].group_ratio = groupRatio[models[i].model_name];
    }
    // sort by quota_type
    models.sort((a, b) => {
      return a.quota_type - b.quota_type;
    });

    // sort by model_name, start with gpt is max, other use localeCompare
    models.sort((a, b) => {
      if (a.model_name.startsWith('gpt') && !b.model_name.startsWith('gpt')) {
        return -1;
      } else if (
        !a.model_name.startsWith('gpt') &&
        b.model_name.startsWith('gpt')
      ) {
        return 1;
      } else {
        return a.model_name.localeCompare(b.model_name);
      }
    });

    setModels(models);
  };

  const loadPricing = async () => {
    setLoading(true);

    let url = '';
    url = `/api/pricing`;
    const res = await API.get(url);
    const { success, message, data, group_ratio, usable_group } = res.data;
    if (success) {
      setGroupRatio(group_ratio);
      setUsableGroup(usable_group);
      setSelectedGroup(userState.user ? userState.user.group : 'default')
      setModelsFormat(data, group_ratio);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const refresh = async () => {
    await loadPricing();
  };

  const copyText = async (text) => {
    if (await copy(text)) {
      showSuccess('AlreadyCopy：' + text);
    } else {
      // setSearchKeyword(text);
      Modal.error({ title: 'NoneMethodCopyTo clipboard，PleaseManualCopy', content: text });
    }
  };

  useEffect(() => {
    refresh().then();
  }, []);

  return (
    <>
      <Layout>
        {userState.user ? (
          <Banner
            type="success"
            fullMode={false}
            closeIcon="null"
            description={t('YouTheDefaultGroupFor：{{group}}，GroupMultiplierFor：{{ratio}}', {
              group: userState.user.group,
              ratio: groupRatio[userState.user.group]
            })}
          />
        ) : (
          <Banner
            type='warning'
            fullMode={false}
            closeIcon="null"
            description={t('You are not logged in，DisplayThePriceForDefaultGroupMultiplier: {{ratio}}', {
              ratio: groupRatio['default']
            })}
          />
        )}
        <br/>
        <Banner 
            type="info"
            fullMode={false}
            description={<div>{t('Pay-as-you-goCostUse = GroupMultiplier × ModelMultiplier × （PrompttokenNumber + CompletetokenNumber × CompleteMultiplier）/ 500000 （Unit：Dollar）')}</div>}
            closeIcon="null"
        />
        <br/>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder={t('BlurSearchModelName')}
            style={{ width: 200 }}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onChange={handleChange}
            showClear
          />
          <Button
            theme='light'
            type='tertiary'
            style={{width: 150}}
            onClick={() => {
              copyText(selectedRowKeys);
            }}
            disabled={selectedRowKeys == ""}
          >
            {t('CopySelectUse predefined colorsModel')}
          </Button>
        </Space>
        <Table
          style={{ marginTop: 5 }}
          columns={columns}
          dataSource={models}
          loading={loading}
          pagination={{
            formatPageText: (page) =>
              t('The {{start}} - {{end}} Item，Total {{total}} Item', {
                start: page.currentStart,
                end: page.currentEnd,
                total: models.length
              }),
            pageSize: models.length,
            showSizeChanger: false,
          }}
          rowSelection={rowSelection}
        />
        <ImagePreview
          src={modalImageUrl}
          visible={isModalOpenurl}
          onVisibleChange={(visible) => setIsModalOpenurl(visible)}
        />
      </Layout>
    </>
  );
};

export default ModelPricing;
