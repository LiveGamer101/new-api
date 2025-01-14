import React, { useEffect, useState } from 'react';
import {
  API,
  copy,
  showError,
  showSuccess,
  timestamp2string,
} from '../helpers';

import { ITEMS_PER_PAGE } from '../constants';
import { renderQuota } from '../helpers/render';
import {
  Button, Divider,
  Form,
  Modal,
  Popconfirm,
  Popover,
  Table,
  Tag,
} from '@douyinfe/semi-ui';
import EditRedemption from '../pages/Redemption/EditRedemption';
import { useTranslation } from 'react-i18next';

function renderTimestamp(timestamp) {
  return <>{timestamp2string(timestamp)}</>;
}

const RedemptionsTable = () => {
  const { t } = useTranslation();

  const renderStatus = (status) => {
    switch (status) {
      case 1:
        return (
          <Tag color='green' size='large'>
            {t('Not YetUseUse')}
          </Tag>
        );
      case 2:
        return (
          <Tag color='red' size='large'>
            {t('AlreadyDisable')}
          </Tag>
        );
      case 3:
        return (
          <Tag color='grey' size='large'>
            {t('AlreadyUseUse')}
          </Tag>
        );
      default:
        return (
          <Tag color='black' size='large'>
            {t('UnknownStatus')}
          </Tag>
        );
    }
  };

  const columns = [
    {
      title: t('ID'),
      dataIndex: 'id',
    },
    {
      title: t('Name'),
      dataIndex: 'name',
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      key: 'status',
      render: (text, record, index) => {
        return <div>{renderStatus(text)}</div>;
      },
    },
    {
      title: t('Quota'),
      dataIndex: 'quota',
      render: (text, record, index) => {
        return <div>{renderQuota(parseInt(text))}</div>;
      },
    },
    {
      title: t('CreateTime'),
      dataIndex: 'created_time',
      render: (text, record, index) => {
        return <div>{renderTimestamp(text)}</div>;
      },
    },
    {
      title: t('RedeemerID'),
      dataIndex: 'used_user_id',
      render: (text, record, index) => {
        return <div>{text === 0 ? t('None') : text}</div>;
      },
    },
    {
      title: '',
      dataIndex: 'operate',
      render: (text, record, index) => (
        <div>
          <Popover content={record.key} style={{ padding: 20 }} position='top'>
            <Button theme='light' type='tertiary' style={{ marginRight: 1 }}>
              {t('View')}
            </Button>
          </Popover>
          <Button
            theme='light'
            type='secondary'
            style={{ marginRight: 1 }}
            onClick={async (text) => {
              await copyText(record.key);
            }}
          >
            {t('Copy')}
          </Button>
          <Popconfirm
            title={t('Confirm whether toDeleteThis redemption code？')}
            content={t('ThisModification will be irreversible')}
            okType={'danger'}
            position={'left'}
            onConfirm={() => {
              manageRedemption(record.id, 'delete', record).then(() => {
                removeRecord(record.key);
              });
            }}
          >
            <Button theme='light' type='danger' style={{ marginRight: 1 }}>
              {t('Delete')}
            </Button>
          </Popconfirm>
          {record.status === 1 ? (
            <Button
              theme='light'
              type='warning'
              style={{ marginRight: 1 }}
              onClick={async () => {
                manageRedemption(record.id, 'disable', record);
              }}
            >
              {t('Disable')}
            </Button>
          ) : (
            <Button
              theme='light'
              type='secondary'
              style={{ marginRight: 1 }}
              onClick={async () => {
                manageRedemption(record.id, 'enable', record);
              }}
              disabled={record.status === 3}
            >
              {t('Enable')}
            </Button>
          )}
          <Button
            theme='light'
            type='tertiary'
            style={{ marginRight: 1 }}
            onClick={() => {
              setEditingRedemption(record);
              setShowEdit(true);
            }}
            disabled={record.status !== 1}
          >
            {t('Edit')}
          </Button>
        </div>
      ),
    },
  ];

  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [tokenCount, setTokenCount] = useState(ITEMS_PER_PAGE);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [editingRedemption, setEditingRedemption] = useState({
    id: undefined,
  });
  const [showEdit, setShowEdit] = useState(false);

  const closeEdit = () => {
    setShowEdit(false);
  };

  const setRedemptionFormat = (redeptions) => {
    setRedemptions(redeptions);
  };

  const loadRedemptions = async (startIdx, pageSize) => {
    const res = await API.get(`/api/redemption/?p=${startIdx}&page_size=${pageSize}`);
    const { success, message, data } = res.data;
    if (success) {
        const newPageData = data.items;
        setActivePage(data.page);
        setTokenCount(data.total);
        setRedemptionFormat(newPageData);
    } else {
        showError(message);
    }
    setLoading(false);
  };

  const removeRecord = (key) => {
    let newDataSource = [...redemptions];
    if (key != null) {
      let idx = newDataSource.findIndex((data) => data.key === key);

      if (idx > -1) {
        newDataSource.splice(idx, 1);
        setRedemptions(newDataSource);
      }
    }
  };

  const copyText = async (text) => {
    if (await copy(text)) {
      showSuccess(t('AlreadyCopyTo clipboard！'));
    } else {
      // setSearchKeyword(text);
      Modal.error({ title: t('NoneMethodCopyTo clipboard，PleaseManualCopy'), content: text });
    }
  };

  const onPaginationChange = (e, { activePage }) => {
    (async () => {
      if (activePage === Math.ceil(redemptions.length / pageSize) + 1) {
        await loadRedemptions(activePage - 1, pageSize);
      }
      setActivePage(activePage);
    })();
  };

  useEffect(() => {
    loadRedemptions(0, pageSize)
      .then()
      .catch((reason) => {
        showError(reason);
      });
  }, []);

  const refresh = async () => {
    await loadRedemptions(activePage - 1, pageSize);
  };

  const manageRedemption = async (id, action, record) => {
    let data = { id };
    let res;
    switch (action) {
      case 'delete':
        res = await API.delete(`/api/redemption/${id}/`);
        break;
      case 'enable':
        data.status = 1;
        res = await API.put('/api/redemption/?status_only=true', data);
        break;
      case 'disable':
        data.status = 2;
        res = await API.put('/api/redemption/?status_only=true', data);
        break;
    }
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('OperationSuccessDone！'));
      let redemption = res.data.data;
      let newRedemptions = [...redemptions];
      // let realIdx = (activePage - 1) * ITEMS_PER_PAGE + idx;
      if (action === 'delete') {
      } else {
        record.status = redemption.status;
      }
      setRedemptions(newRedemptions);
    } else {
      showError(message);
    }
  };

  const searchRedemptions = async (keyword, page, pageSize) => {
    if (searchKeyword === '') {
        await loadRedemptions(page, pageSize);
        return;
    }
    setSearching(true);
    const res = await API.get(`/api/redemption/search?keyword=${keyword}&p=${page}&page_size=${pageSize}`);
    const { success, message, data } = res.data;
    if (success) {
        const newPageData = data.items;
        setActivePage(data.page);
        setTokenCount(data.total);
        setRedemptionFormat(newPageData);
    } else {
        showError(message);
    }
    setSearching(false);
  };

  const handleKeywordChange = async (value) => {
    setSearchKeyword(value.trim());
  };

  const sortRedemption = (key) => {
    if (redemptions.length === 0) return;
    setLoading(true);
    let sortedRedemptions = [...redemptions];
    sortedRedemptions.sort((a, b) => {
      return ('' + a[key]).localeCompare(b[key]);
    });
    if (sortedRedemptions[0].id === redemptions[0].id) {
      sortedRedemptions.reverse();
    }
    setRedemptions(sortedRedemptions);
    setLoading(false);
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    if (searchKeyword === '') {
      loadRedemptions(page, pageSize).then();
    } else {
      searchRedemptions(searchKeyword, page, pageSize).then();
    }
  };

  let pageData = redemptions;
  const rowSelection = {
    onSelect: (record, selected) => {},
    onSelectAll: (selected, selectedRows) => {},
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedKeys(selectedRows);
    },
  };

  const handleRow = (record, index) => {
    if (record.status !== 1) {
      return {
        style: {
          background: 'var(--semi-color-disabled-border)',
        },
      };
    } else {
      return {};
    }
  };

  return (
    <>
      <EditRedemption
        refresh={refresh}
        editingRedemption={editingRedemption}
        visiable={showEdit}
        handleClose={closeEdit}
      ></EditRedemption>
      <Form onSubmit={()=> {
        searchRedemptions(searchKeyword, activePage, pageSize).then();
      }}>
        <Form.Input
          label={t('SearchKeyword')}
          field='keyword'
          icon='search'
          iconPosition='left'
          placeholder={t('Keyword(idToo many requestsPersonName)')}
          value={searchKeyword}
          loading={searching}
          onChange={handleKeywordChange}
        />
      </Form>
      <Divider style={{margin:'5px 0 15px 0'}}/>
      <div>
        <Button
            theme='light'
            type='primary'
            style={{ marginRight: 8 }}
            onClick={() => {
              setEditingRedemption({
                id: undefined,
              });
              setShowEdit(true);
            }}
        >
          {t('AddRedemption code')}
        </Button>
        <Button
            label={t('CopySelectedRedemption code')}
            type='warning'
            onClick={async () => {
              if (selectedKeys.length === 0) {
                showError(t('PleaseAt leastSelectOneItemsRedemption code！'));
                return;
              }
              let keys = '';
              for (let i = 0; i < selectedKeys.length; i++) {
                keys += selectedKeys[i].name + '    ' + selectedKeys[i].key + '\n';
              }
              await copyText(keys);
            }}
        >
          {t('CopySelectedRedemption codeTo clipboard')}
        </Button>
      </div>

      <Table
        style={{ marginTop: 20 }}
        columns={columns}
        dataSource={pageData}
        pagination={{
          currentPage: activePage,
          pageSize: pageSize,
          total: tokenCount,
          showSizeChanger: true,
          pageSizeOpts: [10, 20, 50, 100],
          formatPageText: (page) =>
            t('The {{start}} - {{end}} Item，Total {{total}} Item', {
              start: page.currentStart,
              end: page.currentEnd,
              total: tokenCount
            }),
          onPageSizeChange: (size) => {
            setPageSize(size);
            setActivePage(1);
            if (searchKeyword === '') {
              loadRedemptions(1, size).then();
            } else {
              searchRedemptions(searchKeyword, 1, size).then();
            }
          },
          onPageChange: handlePageChange,
        }}
        loading={loading}
        rowSelection={rowSelection}
        onRow={handleRow}
      ></Table>
    </>
  );
};

export default RedemptionsTable;
