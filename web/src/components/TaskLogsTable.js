import React, { useEffect, useState } from 'react';
import { Label } from 'semantic-ui-react';
import { API, copy, isAdmin, showError, showSuccess, timestamp2string } from '../helpers';

import {
    Table,
    Tag,
    Form,
    Button,
    Layout,
    Modal,
    Typography, Progress, Card
} from '@douyinfe/semi-ui';
import { ITEMS_PER_PAGE } from '../constants';

const colors = ['amber', 'blue', 'cyan', 'green', 'grey', 'indigo',
    'light-blue', 'lime', 'orange', 'pink',
    'purple', 'red', 'teal', 'violet', 'yellow'
]


const renderTimestamp = (timestampInSeconds) => {
    const date = new Date(timestampInSeconds * 1000); // Retrieve the last used fromSecondsConvertForMilliseconds

    const year = date.getFullYear(); // ObtainYear
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // ObtainMonth，Retrieve the last used from0StartQuota needed+1，AndGuarantee twoDigitsNumber
    const day = ('0' + date.getDate()).slice(-2); // ObtainDate，AndGuarantee twoDigitsNumber
    const hours = ('0' + date.getHours()).slice(-2); // ObtainSmallWhen，AndGuarantee twoDigitsNumber
    const minutes = ('0' + date.getMinutes()).slice(-2); // ObtainMinute，AndGuarantee twoDigitsNumber
    const seconds = ('0' + date.getSeconds()).slice(-2); // ObtainSecondsClock，AndGuarantee twoDigitsNumber

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // Format output
};

function renderDuration(submit_time, finishTime) {
    // EnsurestartTimeAndfinishTimeAllIsConfirm reset.TheTimeTimestamp
    if (!submit_time || !finishTime) return 'N/A';

    // ConvertTimeTimestampConvertForDateObject
    const start = new Date(submit_time);
    const finish = new Date(finishTime);

    // CalculateTimeDifference（Milliseconds）
    const durationMs = finish - start;

    // ConvertTimeDifferenceConvertForSeconds，AndRetainOneDigitsSmallNumber
    const durationSec = (durationMs / 1000).toFixed(1);

    // SettingsColor：Greater than60SecondsThenForRed，Less than or equal to60SecondsThenForGreen
    const color = durationSec > 60 ? 'red' : 'green';

    // ReturnWithHaveStyleTheColorTag
    return (
        <Tag color={color} size="large">
            {durationSec} Seconds
        </Tag>
    );
}

const LogsTable = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const isAdminUser = isAdmin();
    const columns = [
        {
            title: "SubmitTime",
            dataIndex: 'submit_time',
            render: (text, record, index) => {
                return (
                    <div>
                        {text ? renderTimestamp(text) : "-"}
                    </div>
                );
            },
        },
        {
            title: "EndTime",
            dataIndex: 'finish_time',
            render: (text, record, index) => {
                return (
                    <div>
                        {text ? renderTimestamp(text) : "-"}
                    </div>
                );
            },
        },
        {
            title: 'Progress',
            dataIndex: 'progress',
            width: 50,
            render: (text, record, index) => {
                return (
                    <div>
                        {
                            // ConvertFor example100%ForNumberWord100，IftextNot YetDefinition，Return0
                            isNaN(text.replace('%', '')) ? text : <Progress width={42} type="circle" showInfo={true} percent={Number(text.replace('%', '') || 0)} aria-label="drawing progress" />
                        }
                    </div>
                );
            },
        },
        {
            title: 'SpentTime',
            dataIndex: 'finish_time', // Usedfinish_timeOperateFordataIndex
            key: 'finish_time',
            render: (finish, record) => {
                // Assumerecord.start_timeIsExistenceThe，AndfinishIsDoneTimeTheTimeTimestamp
                return <>
                    {
                        finish ? renderDuration(record.submit_time, finish) : "-"
                    }
                </>
            },
        },
        {
            title: "Channel",
            dataIndex: 'channel_id',
            className: isAdminUser ? 'tableShow' : 'tableHiddle',
            render: (text, record, index) => {
                return (
                    <div>
                        <Tag
                            color={colors[parseInt(text) % colors.length]}
                            size='large'
                            onClick={() => {
                                copyText(text); // AssumecopyTextIsUseLess thanTextCopyTheFunction
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
            title: "Platform",
            dataIndex: 'platform',
            render: (text, record, index) => {
                return (
                    <div>
                        {renderPlatform(text)}
                    </div>
                );
            },
        },
        {
            title: 'Type',
            dataIndex: 'action',
            render: (text, record, index) => {
                return (
                    <div>
                        {renderType(text)}
                    </div>
                );
            },
        },
        {
            title: 'TasksID（ClickViewDetails）',
            dataIndex: 'task_id',
            render: (text, record, index) => {
                return (<Typography.Text
                    ellipsis={{ showTooltip: true }}
                    //style={{width: 100}}
                    onClick={() => {
                        setModalContent(JSON.stringify(record, null, 2));
                        setIsModalOpen(true);
                    }}
                >
                    <div>
                        {text}
                    </div>
                </Typography.Text>);
            },
        },
        {
            title: 'TasksStatus',
            dataIndex: 'status',
            render: (text, record, index) => {
                return (
                    <div>
                        {renderStatus(text)}
                    </div>
                );
            },
        },

        {
            title: 'FailedReason',
            dataIndex: 'fail_reason',
            render: (text, record, index) => {
                // IftextNot YetDefinition，ReturnAlternative text，For exampleEmptyString''Or others
                if (!text) {
                    return 'None';
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
            }
        }
    ];

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activePage, setActivePage] = useState(1);
    const [logCount, setLogCount] = useState(ITEMS_PER_PAGE);
    const [logType] = useState(0);

    let now = new Date();
    // Initializestart_timestampForFrontOneWeek
    let zeroNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [inputs, setInputs] = useState({
        channel_id: '',
        task_id: '',
        start_timestamp: timestamp2string(zeroNow.getTime() /1000),
        end_timestamp: '',
    });
    const { channel_id, task_id, start_timestamp, end_timestamp } = inputs;

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
    }

    const loadLogs = async (startIdx) => {
        setLoading(true);

        let url = '';
        let localStartTimestamp = parseInt(Date.parse(start_timestamp) / 1000);
        let localEndTimestamp = parseInt(Date.parse(end_timestamp) / 1000 );
        if (isAdminUser) {
            url = `/api/task/?p=${startIdx}&channel_id=${channel_id}&task_id=${task_id}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}`;
        } else {
            url = `/api/task/self?p=${startIdx}&task_id=${task_id}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}`;
        }
        const res = await API.get(url);
        let { success, message, data } = res.data;
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

    const pageData = logs.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE);

    const handlePageChange = page => {
        setActivePage(page);
        if (page === Math.ceil(logs.length / ITEMS_PER_PAGE) + 1) {
            // In this case we have to load more data and then append them.
            loadLogs(page - 1).then(r => {
            });
        }
    };

    const refresh = async () => {
        // setLoading(true);
        setActivePage(1);
        await loadLogs(0);
    };

    const copyText = async (text) => {
        if (await copy(text)) {
            showSuccess('AlreadyCopy：' + text);
        } else {
            // setSearchKeyword(text);
            Modal.error({ title: "NoneMethodCopyTo clipboard，PleaseManualCopy", content: text });
        }
    }

    useEffect(() => {
        refresh().then();
    }, [logType]);

    const renderType = (type) => {
        switch (type) {
            case 'MUSIC':
                return <Label basic color='grey'> Generate music </Label>;
            case 'LYRICS':
                return <Label basic color='pink'> Generate lyrics </Label>;

            default:
                return <Label basic color='black'> Unknown </Label>;
        }
    }

    const renderPlatform = (type) => {
        switch (type) {
            case "suno":
                return <Label basic color='green'> Suno </Label>;
            default:
                return <Label basic color='black'> Unknown </Label>;
        }
    }

    const renderStatus = (type) => {
        switch (type) {
            case 'SUCCESS':
                return <Label basic color='green'> Success </Label>;
            case 'NOT_START':
                return <Label basic color='black'> Not YetLaunch </Label>;
            case 'SUBMITTED':
                return <Label basic color='yellow'> In the queue </Label>;
            case 'IN_PROGRESS':
                return <Label basic color='blue'> Executing </Label>;
            case 'FAILURE':
                return <Label basic color='red'> Failed </Label>;
            case 'QUEUED':
                return <Label basic color='red'> Queued </Label>;
            case 'UNKNOWN':
                return <Label basic color='red'> Unknown </Label>;
            case '':
                return <Label basic color='black'> In progressSubmit </Label>;
            default:
                return <Label basic color='black'> Unknown </Label>;
        }
    }

    return (
        <>

            <Layout>
                <Form layout='horizontal' labelPosition='inset'>
                    <>
                        {isAdminUser && <Form.Input field="channel_id" label='Channel ID' style={{ width: '236px', marginBottom: '10px' }} value={channel_id}
                                                    placeholder={'Optional values'} name='channel_id'
                                                    onChange={value => handleInputChange(value, 'channel_id')} />
                        }
                        <Form.Input field="task_id" label={"Tasks ID"} style={{ width: '236px', marginBottom: '10px' }} value={task_id}
                            placeholder={"Optional values"}
                            name='task_id'
                            onChange={value => handleInputChange(value, 'task_id')} />

                        <Form.DatePicker field="start_timestamp" label={"StartTime"} style={{ width: '236px', marginBottom: '10px' }}
                            initValue={start_timestamp}
                            value={start_timestamp} type='dateTime'
                            name='start_timestamp'
                            onChange={value => handleInputChange(value, 'start_timestamp')} />
                        <Form.DatePicker field="end_timestamp" fluid label={"EndTime"} style={{ width: '236px', marginBottom: '10px' }}
                            initValue={end_timestamp}
                            value={end_timestamp} type='dateTime'
                            name='end_timestamp'
                            onChange={value => handleInputChange(value, 'end_timestamp')} />
                        <Button label={"Query"} type="primary" htmlType="submit" className="btn-margin-right"
                            onClick={refresh}>Query</Button>
                    </>
                </Form>
                <Card>
                    <Table columns={columns} dataSource={pageData} pagination={{
                        currentPage: activePage,
                        pageSize: ITEMS_PER_PAGE,
                        total: logCount,
                        pageSizeOpts: [10, 20, 50, 100],
                        onPageChange: handlePageChange,
                    }} loading={loading} />
                </Card>
                <Modal
                    visible={isModalOpen}
                    onOk={() => setIsModalOpen(false)}
                    onCancel={() => setIsModalOpen(false)}
                    closable={null}
                    bodyStyle={{ height: '400px', overflow: 'auto' }} // SettingsModal boxAny webpage asArea style
                    width={800} // SettingsModal width
                >
                    <p style={{ whiteSpace: 'pre-line' }}>{modalContent}</p>
                </Modal>
            </Layout>
        </>
    );
};

export default LogsTable;
