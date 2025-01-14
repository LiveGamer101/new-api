import React, { useEffect, useState } from 'react';
import {
  API,
  copy,
  isAdmin,
  showError,
  showSuccess,
  timestamp2string,
} from '../helpers';

import {
  Banner,
  Button,
  Form,
  ImagePreview,
  Layout,
  Modal,
  Progress,
  Table,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import { ITEMS_PER_PAGE } from '../constants';
import { useTranslation } from 'react-i18next';

const colors = [
  'amber',
  'blue',
  'cyan',
  'green',
  'grey',
  'indigo',
  'light-blue',
  'lime',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
  'violet',
  'yellow',
];

const LogsTable = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  function renderType(type) {
    
    switch (type) {
      case 'IMAGINE':
        return (
          <Tag color='blue' size='large'>
            {t('Plot')}
          </Tag>
        );
      case 'UPSCALE':
        return (
          <Tag color='orange' size='large'>
            {t('Zoom In')}
          </Tag>
        );
      case 'VARIATION':
        return (
          <Tag color='purple' size='large'>
            {t('Transform')}
          </Tag>
        );
      case 'HIGH_VARIATION':
        return (
          <Tag color='purple' size='large'>
            {t('StrongTransform')}
          </Tag>
        );
      case 'LOW_VARIATION':
        return (
          <Tag color='purple' size='large'>
            {t('WeakTransform')}
          </Tag>
        );
      case 'PAN':
        return (
          <Tag color='cyan' size='large'>
            {t('Translate')}
          </Tag>
        );
      case 'DESCRIBE':
        return (
          <Tag color='yellow' size='large'>
            {t('Image-to-Text')}
          </Tag>
        );
      case 'BLEND':
        return (
          <Tag color='lime' size='large'>
            {t('Image Mix')}
          </Tag>
        );
      case 'UPLOAD':
        return (
            <Tag color='blue' size='large'>
              Upload File
            </Tag>
        );
      case 'SHORTEN':
        return (
          <Tag color='pink' size='large'>
            {t('Word Reduction')}
          </Tag>
        );
      case 'REROLL':
        return (
          <Tag color='indigo' size='large'>
            {t('Redraw')}
          </Tag>
        );
      case 'INPAINT':
        return (
          <Tag color='violet' size='large'>
            {t('LocalRedraw-Submit')}
          </Tag>
        );
      case 'ZOOM':
        return (
          <Tag color='teal' size='large'>
            {t('Zoom')}
          </Tag>
        );
      case 'CUSTOM_ZOOM':
        return (
          <Tag color='teal' size='large'>
            {t('CustomZoom-Submit')}
          </Tag>
        );
      case 'MODAL':
        return (
          <Tag color='green' size='large'>
            {t('Window Handling')}
          </Tag>
        );
      case 'SWAP_FACE':
        return (
          <Tag color='light-green' size='large'>
            {t('Face Swap')}
          </Tag>
        );
      default:
        return (
          <Tag color='white' size='large'>
            {t('Unknown')}
          </Tag>
        );
    }
  }
  
  function renderCode(code) {
    
    switch (code) {
      case 1:
        return (
          <Tag color='green' size='large'>
            {t('DoneSubmit')}
          </Tag>
        );
      case 21:
        return (
          <Tag color='lime' size='large'>
            {t('Pending')}
          </Tag>
        );
      case 22:
        return (
          <Tag color='orange' size='large'>
            {t('RepeatSubmit')}
          </Tag>
        );
      case 0:
        return (
          <Tag color='yellow' size='large'>
            {t('NotSubmit')}
          </Tag>
        );
      default:
        return (
          <Tag color='white' size='large'>
            {t('Unknown')}
          </Tag>
        );
    }
  }
  
  function renderStatus(type) {
    
    switch (type) {
      case 'SUCCESS':
        return (
          <Tag color='green' size='large'>
            {t('Success')}
          </Tag>
        );
      case 'NOT_START':
        return (
          <Tag color='grey' size='large'>
            {t('NotLaunch')}
          </Tag>
        );
      case 'SUBMITTED':
        return (
          <Tag color='yellow' size='large'>
            {t('In Queue')}
          </Tag>
        );
      case 'IN_PROGRESS':
        return (
          <Tag color='blue' size='large'>
            {t('Executing')}
          </Tag>
        );
      case 'FAILURE':
        return (
          <Tag color='red' size='large'>
            {t('Failed')}
          </Tag>
        );
      case 'MODAL':
        return (
          <Tag color='yellow' size='large'>
            {t('Window Wait')}
          </Tag>
        );
      default:
        return (
          <Tag color='white' size='large'>
            {t('Unknown')}
          </Tag>
        );
    }
  }
  
  const renderTimestamp = (timestampInSeconds) => {
    const date = new Date(timestampInSeconds * 1000); // Convert Seconds to Milliseconds
  
    const year = date.getFullYear(); // Get Year
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Get Month，From0Start requires+1，And ensure two digits
    const day = ('0' + date.getDate()).slice(-2); // GetDate，And ensure two digits
    const hours = ('0' + date.getHours()).slice(-2); // GetSmallWhen，And ensure two digits
    const minutes = ('0' + date.getMinutes()).slice(-2); // GetMinute，And ensure two digits
    const seconds = ('0' + date.getSeconds()).slice(-2); // GetSecondsClock，And ensure two digits
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // Formatted output
  };
  // ModifyrenderDurationFunction to include color logic
  function renderDuration(submit_time, finishTime) {
    
    if (!submit_time || !finishTime) return 'N/A';

    const start = new Date(submit_time);
    const finish = new Date(finishTime);
    const durationMs = finish - start;
    const durationSec = (durationMs / 1000).toFixed(1);
    const color = durationSec > 60 ? 'red' : 'green';

    return (
      <Tag color={color} size="large">
        {durationSec} {t('Seconds')}
      </Tag>
    );
  }
  const columns = [
    {
      title: t('SubmitTime'),
      dataIndex: 'submit_time',
      render: (text, record, index) => {
        return <div>{renderTimestamp(text / 1000)}</div>;
      },
    },
    {
      title: t('SpentTime'),
      dataIndex: 'finish_time', // Asfinish_timeAssumedataIndex
      key: 'finish_time',
      render: (finish, record) => {
        // Existsrecord.start_timeIsExistenceOf，AndfinishIsDoneTimeOfTimeTap
        return renderDuration(record.submit_time, finish);
      },
    },
    {
      title: t('Channel'),
      dataIndex: 'channel_id',
      className: isAdmin() ? 'tableShow' : 'tableHiddle',
      render: (text, record, index) => {
        return (
          <div>
            <Tag
              color={colors[parseInt(text) % colors.length]}
              size='large'
              onClick={() => {
                copyText(text); // ExistscopyTextIsUseLess thanTextCopyOfFunction
              }}
            >
              {' '}
              {text}{' '}
            </Tag>
          </div>
        );
      },
    },
    {
      title: t('Type'),
      dataIndex: 'action',
      render: (text, record, index) => {
        return <div>{renderType(text)}</div>;
      },
    },
    {
      title: t('TasksID'),
      dataIndex: 'mj_id',
      render: (text, record, index) => {
        return <div>{text}</div>;
      },
    },
    {
      title: t('SubmitResult'),
      dataIndex: 'code',
      className: isAdmin() ? 'tableShow' : 'tableHiddle',
      render: (text, record, index) => {
        return <div>{renderCode(text)}</div>;
      },
    },
    {
      title: t('TasksStatus'),
      dataIndex: 'status',
      className: isAdmin() ? 'tableShow' : 'tableHiddle',
      render: (text, record, index) => {
        return <div>{renderStatus(text)}</div>;
      },
    },
    {
      title: t('Progress'),
      dataIndex: 'progress',
      render: (text, record, index) => {
        return (
          <div>
            {
              // Convert, for example100%To number100，IftextNotDefinition，Return0
              <Progress
                stroke={
                  record.status === 'FAILURE'
                    ? 'var(--semi-color-warning)'
                    : null
                }
                percent={text ? parseInt(text.replace('%', '')) : 0}
                showInfo={true}
                aria-label='drawing progress'
              />
            }
          </div>
        );
      },
    },
    {
      title: t('ResultImage'),
      dataIndex: 'image_url',
      render: (text, record, index) => {
        if (!text) {
          return t('None');
        }
        return (
          <Button
            onClick={() => {
              setModalImageUrl(text); // Update ImageURLStatus
              setIsModalOpenurl(true); // Open Modal
            }}
          >
            {t('View Image')}
          </Button>
        );
      },
    },
    {
      title: 'Prompt',
      dataIndex: 'prompt',
      render: (text, record, index) => {
        // IftextNotDefinition，ReturnAlternative text，such as an empty string''or others
        if (!text) {
          return t('None');
        }

        return (
          <Typography.Text
            ellipsis={{ showTooltip: true }}
            style={{ width: 100 }}
            onClick={() => {
              setModalContent(text);
              setIsModalOpen(true);
            }}
          >
            {text}
          </Typography.Text>
        );
      },
    },
    {
      title: 'PromptEn',
      dataIndex: 'prompt_en',
      render: (text, record, index) => {
        // IftextNotDefinition，ReturnAlternative text，such as an empty string''or others
        if (!text) {
          return t('None');
        }

        return (
          <Typography.Text
            ellipsis={{ showTooltip: true }}
            style={{ width: 100 }}
            onClick={() => {
              setModalContent(text);
              setIsModalOpen(true);
            }}
          >
            {text}
          </Typography.Text>
        );
      },
    },
    {
      title: t('FailedReason'),
      dataIndex: 'fail_reason',
      render: (text, record, index) => {
        // IftextNotDefinition，ReturnAlternative text，such as an empty string''or others
        if (!text) {
          return t('None');
        }

        return (
          <Typography.Text
            ellipsis={{ showTooltip: true }}
            style={{ width: 100 }}
            onClick={() => {
              setModalContent(text);
              setIsModalOpen(true);
            }}
          >
            {text}
          </Typography.Text>
        );
      },
    },
  ];

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [logCount, setLogCount] = useState(ITEMS_PER_PAGE);
  const [logType, setLogType] = useState(0);
  const isAdminUser = isAdmin();
  const [isModalOpenurl, setIsModalOpenurl] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Define modal box imageURLOfStatusAnd update function
  const [modalImageUrl, setModalImageUrl] = useState('');
  let now = new Date();
  // Initializestart_timestampFor the previous day
  const [inputs, setInputs] = useState({
    channel_id: '',
    mj_id: '',
    start_timestamp: timestamp2string(now.getTime() / 1000 - 2592000),
    end_timestamp: timestamp2string(now.getTime() / 1000 + 3600),
  });
  const { channel_id, mj_id, start_timestamp, end_timestamp } = inputs;

  const [stat, setStat] = useState({
    quota: 0,
    token: 0,
  });

  const handleInputChange = (value, name) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const setLogsFormat = (logs) => {
    for (let i = 0; i < logs.length; i++) {
      logs[i].timestamp2string = timestamp2string(logs[i].created_at);
      logs[i].key = '' + logs[i].id;
    }
    // data.key = '' + data.id
    setLogs(logs);
    setLogCount(logs.length + ITEMS_PER_PAGE);
    // console.log(logCount);
  };

  const loadLogs = async (startIdx) => {
    setLoading(true);

    let url = '';
    let localStartTimestamp = Date.parse(start_timestamp);
    let localEndTimestamp = Date.parse(end_timestamp);
    if (isAdminUser) {
      url = `/api/mj/?p=${startIdx}&channel_id=${channel_id}&mj_id=${mj_id}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}`;
    } else {
      url = `/api/mj/self/?p=${startIdx}&mj_id=${mj_id}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}`;
    }
    const res = await API.get(url);
    const { success, message, data } = res.data;
    if (success) {
      if (startIdx === 0) {
        setLogsFormat(data);
      } else {
        let newLogs = [...logs];
        newLogs.splice(startIdx * ITEMS_PER_PAGE, data.length, ...data);
        setLogsFormat(newLogs);
      }
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const pageData = logs.slice(
    (activePage - 1) * ITEMS_PER_PAGE,
    activePage * ITEMS_PER_PAGE,
  );

  const handlePageChange = (page) => {
    setActivePage(page);
    if (page === Math.ceil(logs.length / ITEMS_PER_PAGE) + 1) {
      // In this case we have to load more data and then append them.
      loadLogs(page - 1).then((r) => {});
    }
  };

  const refresh = async () => {
    // setLoading(true);
    setActivePage(1);
    await loadLogs(0);
  };

  const copyText = async (text) => {
    if (await copy(text)) {
      showSuccess('DoneCopy：' + text);
    } else {
      // setSearchKeyword(text);
      Modal.error({ title: 'NoneMethodCopyTo clipboard，Please copy manually', content: text });
    }
  };

  useEffect(() => {
    refresh().then();
  }, [logType]);

  useEffect(() => {
    const mjNotifyEnabled = localStorage.getItem('mj_notify_enabled');
    if (mjNotifyEnabled !== 'true') {
      setShowBanner(true);
    }
  }, []);

  return (
    <>
      <Layout>
        {isAdminUser && showBanner ? (
          <Banner
            type='info'
            description={t('CurrentNotEnableMidjourneyCallback，Some items mayNoneUnable to obtainPlotResult，Can be enabled in operationsSettingsUse predefined colorsEnable。')}
          />
        ) : (
          <></>
        )}
        <Form layout='horizontal' style={{ marginTop: 10 }}>
          <>
            <Form.Input
              field='channel_id'
              label={t('Channel ID')}
              style={{ width: 176 }}
              value={channel_id}
              placeholder={t('Optional Value')}
              name='channel_id'
              onChange={(value) => handleInputChange(value, 'channel_id')}
            />
            <Form.Input
              field='mj_id'
              label={t('Tasks ID')}
              style={{ width: 176 }}
              value={mj_id}
              placeholder={t('Optional Value')}
              name='mj_id'
              onChange={(value) => handleInputChange(value, 'mj_id')}
            />
            <Form.DatePicker
              field='start_timestamp'
              label={t('StartTime')}
              style={{ width: 272 }}
              initValue={start_timestamp}
              value={start_timestamp}
              type='dateTime'
              name='start_timestamp'
              onChange={(value) => handleInputChange(value, 'start_timestamp')}
            />
            <Form.DatePicker
              field='end_timestamp'
              fluid
              label={t('EndTime')}
              style={{ width: 272 }}
              initValue={end_timestamp}
              value={end_timestamp}
              type='dateTime'
              name='end_timestamp'
              onChange={(value) => handleInputChange(value, 'end_timestamp')}
            />

            <Form.Section>
              <Button
                label={t('Search')}
                type='primary'
                htmlType='submit'
                className='btn-margin-right'
                onClick={refresh}
              >
                {t('Search')}
              </Button>
            </Form.Section>
          </>
        </Form>
        <Table
          style={{ marginTop: 5 }}
          columns={columns}
          dataSource={pageData}
          pagination={{
            currentPage: activePage,
            pageSize: ITEMS_PER_PAGE,
            total: logCount,
            pageSizeOpts: [10, 20, 50, 100],
            onPageChange: handlePageChange,
            formatPageText: (page) =>
              t('No. {{start}} - {{end}} of，Total {{total}} of', {
                start: page.currentStart,
                end: page.currentEnd,
                total: logCount
              }),
          }}
          loading={loading}
        />
        <Modal
          visible={isModalOpen}
          onOk={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
          closable={null}
          bodyStyle={{ height: '400px', overflow: 'auto' }} // SettingsModal content area style
          width={800} // SettingsModal width
        >
          <p style={{ whiteSpace: 'pre-line' }}>{modalContent}</p>
        </Modal>
        <ImagePreview
          src={modalImageUrl}
          visible={isModalOpenurl}
          onVisibleChange={(visible) => setIsModalOpenurl(visible)}
        />
      </Layout>
    </>
  );
};

export default LogsTable;
