import React, { useEffect, useState } from 'react';
import { API, showError, showSuccess } from '../helpers';
import {
  Button,
  Form,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
} from '@douyinfe/semi-ui';
import { ITEMS_PER_PAGE } from '../constants';
import { renderGroup, renderNumber, renderQuota } from '../helpers/render';
import AddUser from '../pages/User/AddUser';
import EditUser from '../pages/User/EditUser';
import { useTranslation } from 'react-i18next';

const UsersTable = () => {
  const { t } = useTranslation();

  function renderRole(role) {
    switch (role) {
      case 1:
        return <Tag size='large'>{t('CommonThroughUseUser')}</Tag>;
      case 10:
        return (
          <Tag color='yellow' size='large'>
            {t('Administrator')}
          </Tag>
        );
      case 100:
        return (
          <Tag color='orange' size='large'>
            {t('SuperAdministrator')}
          </Tag>
        );
      default:
        return (
          <Tag color='red' size='large'>
            {t('UnknownIdentity')}
          </Tag>
        );
    }
  }
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: t('Username'),
      dataIndex: 'username',
    },
    {
      title: t('Group'),
      dataIndex: 'group',
      render: (text, record, index) => {
        return <div>{renderGroup(text)}</div>;
      },
    },
    {
      title: t('StatisticsInfo'),
      dataIndex: 'info',
      render: (text, record, index) => {
        return (
          <div>
            <Space spacing={1}>
              <Tooltip content={t('RemainingQuota')}>
                <Tag color='white' size='large'>
                  {renderQuota(record.quota)}
                </Tag>
              </Tooltip>
              <Tooltip content={t('AlreadyUseQuota')}>
                <Tag color='white' size='large'>
                  {renderQuota(record.used_quota)}
                </Tag>
              </Tooltip>
              <Tooltip content={t('AdjustUseNextNumber')}>
                <Tag color='white' size='large'>
                  {renderNumber(record.request_count)}
                </Tag>
              </Tooltip>
            </Space>
          </div>
        );
      },
    },
    {
      title: t('InviteInfo'),
      dataIndex: 'invite',
      render: (text, record, index) => {
        return (
          <div>
            <Space spacing={1}>
              <Tooltip content={t('InvitePersonNumber')}>
                <Tag color='white' size='large'>
                  {renderNumber(record.aff_count)}
                </Tag>
              </Tooltip>
              <Tooltip content={t('InviteTotal Earnings')}>
                <Tag color='white' size='large'>
                  {renderQuota(record.aff_history_quota)}
                </Tag>
              </Tooltip>
              <Tooltip content={t('InvitePersonID')}>
                {record.inviter_id === 0 ? (
                  <Tag color='white' size='large'>
                    {t('None')}
                  </Tag>
                ) : (
                  <Tag color='white' size='large'>
                    {record.inviter_id}
                  </Tag>
                )}
              </Tooltip>
            </Space>
          </div>
        );
      },
    },
    {
      title: t('Role'),
      dataIndex: 'role',
      render: (text, record, index) => {
        return <div>{renderRole(text)}</div>;
      },
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      render: (text, record, index) => {
        return (
          <div>
            {record.DeletedAt !== null ? (
              <Tag color='red'>{t('AlreadyDeactivate')}</Tag>
            ) : (
              renderStatus(text)
            )}
          </div>
        );
      },
    },
    {
      title: '',
      dataIndex: 'operate',
      render: (text, record, index) => (
        <div>
          {record.DeletedAt !== null ? (
            <></>
          ) : (
            <>
              <Popconfirm
                title={t('When passing through？')}
                okType={'warning'}
                onConfirm={() => {
                  manageUser(record.id, 'promote', record);
                }}
              >
                <Button theme='light' type='warning' style={{ marginRight: 1 }}>
                  {t('Promote')}
                </Button>
              </Popconfirm>
              <Popconfirm
                title={t('When passing through？')}
                okType={'warning'}
                onConfirm={() => {
                  manageUser(record.id, 'demote', record);
                }}
              >
                <Button theme='light' type='secondary' style={{ marginRight: 1 }}>
                  {t('Demote')}
                </Button>
              </Popconfirm>
              {record.status === 1 ? (
                <Button
                  theme='light'
                  type='warning'
                  style={{ marginRight: 1 }}
                  onClick={async () => {
                    manageUser(record.id, 'disable', record);
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
                    manageUser(record.id, 'enable', record);
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
                  setEditingUser(record);
                  setShowEditUser(true);
                }}
              >
                {t('Edit')}
              </Button>
              <Popconfirm
                title={t('Confirm whether toDeactivateThisUseUser？')}
                content={t('Equivalent toDeleteUseUser，ThisModification will be irreversible')}
                okType={'danger'}
                position={'left'}
                onConfirm={() => {
                  manageUser(record.id, 'delete', record).then(() => {
                    removeRecord(record.id);
                  });
                }}
              >
                <Button theme='light' type='danger' style={{ marginRight: 1 }}>
                  {t('Deactivate')}
                </Button>
              </Popconfirm>
            </>
          )}
        </div>
      ),
    },
  ];

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchGroup, setSearchGroup] = useState('');
  const [groupOptions, setGroupOptions] = useState([]);
  const [userCount, setUserCount] = useState(ITEMS_PER_PAGE);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState({
    id: undefined,
  });

  const removeRecord = (key) => {
    let newDataSource = [...users];
    if (key != null) {
      let idx = newDataSource.findIndex((data) => data.id === key);

      if (idx > -1) {
        // update deletedAt
        newDataSource[idx].DeletedAt = new Date();
        setUsers(newDataSource);
      }
    }
  };

  const setUserFormat = (users) => {
    for (let i = 0; i < users.length; i++) {
      users[i].key = users[i].id;
    }
    setUsers(users);
  }

  const loadUsers = async (startIdx, pageSize) => {
    const res = await API.get(`/api/user/?p=${startIdx}&page_size=${pageSize}`);
    const { success, message, data } = res.data;
    if (success) {
      const newPageData = data.items;
      setActivePage(data.page);
      setUserCount(data.total);
      setUserFormat(newPageData);
    } else {
      showError(message);
    }
    setLoading(false);
  };


  useEffect(() => {
    loadUsers(0, pageSize)
      .then()
      .catch((reason) => {
        showError(reason);
      });
    fetchGroups().then();
  }, []);

  const manageUser = async (userId, action, record) => {
    const res = await API.post('/api/user/manage', {
      id: userId,
      action,
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess('OperationSuccessDone！');
      let user = res.data.data;
      let newUsers = [...users];
      if (action === 'delete') {
      } else {
        record.status = user.status;
        record.role = user.role;
      }
      setUsers(newUsers);
    } else {
      showError(message);
    }
  };

  const renderStatus = (status) => {
    switch (status) {
      case 1:
        return <Tag size='large'>{t('AlreadyActivate')}</Tag>;
      case 2:
        return (
          <Tag size='large' color='red'>
            {t('AlreadyBan')}
          </Tag>
        );
      default:
        return (
          <Tag size='large' color='grey'>
            {t('UnknownStatus')}
          </Tag>
        );
    }
  };

  const searchUsers = async (startIdx, pageSize, searchKeyword, searchGroup) => {
    if (searchKeyword === '' && searchGroup === '') {
        // if keyword is blank, load files instead.
        await loadUsers(startIdx, pageSize);
        return;
    }
    setSearching(true);
    const res = await API.get(`/api/user/search?keyword=${searchKeyword}&group=${searchGroup}&p=${startIdx}&page_size=${pageSize}`);
    const { success, message, data } = res.data;
    if (success) {
        const newPageData = data.items;
        setActivePage(data.page);
        setUserCount(data.total);
        setUserFormat(newPageData);
    } else {
        showError(message);
    }
    setSearching(false);
  };

  const handleKeywordChange = async (value) => {
    setSearchKeyword(value.trim());
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    if (searchKeyword === '' && searchGroup === '') {
        loadUsers(page, pageSize).then();
    } else {
        searchUsers(page, pageSize, searchKeyword, searchGroup).then();
    }
  };

  const closeAddUser = () => {
    setShowAddUser(false);
  };

  const closeEditUser = () => {
    setShowEditUser(false);
    setEditingUser({
      id: undefined,
    });
  };

  const refresh = async () => {
    setActivePage(1)
    if (searchKeyword === '') {
      await loadUsers(activePage, pageSize);
    } else {
      await searchUsers(searchKeyword, searchGroup);
    }
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
          value: group,
        })),
      );
    } catch (error) {
      showError(error.message);
    }
  };

  const handlePageSizeChange = async (size) => {
    localStorage.setItem('page-size', size + '');
    setPageSize(size);
    setActivePage(1);
    loadUsers(activePage, size)
      .then()
      .catch((reason) => {
        showError(reason);
      });
  };

  return (
    <>
      <AddUser
        refresh={refresh}
        visible={showAddUser}
        handleClose={closeAddUser}
      ></AddUser>
      <EditUser
        refresh={refresh}
        visible={showEditUser}
        handleClose={closeEditUser}
        editingUser={editingUser}
      ></EditUser>
      <Form
        onSubmit={() => {
          searchUsers(activePage, pageSize, searchKeyword, searchGroup);
        }}
        labelPosition='left'
      >
        <div style={{ display: 'flex' }}>
          <Space>
            <Tooltip content={t('SupportSearchUseUserThe ID、Username、DisplayNameAndEmailAddress')}>
              <Form.Input
                label={t('SearchKeyword')}
                icon='search'
                field='keyword'
                iconPosition='left'
                placeholder={t('SearchKeyword')}
                value={searchKeyword}
                loading={searching}
                onChange={(value) => handleKeywordChange(value)}
              />
            </Tooltip>
            
            <Form.Select
              field='group'
              label={t('Group')}
              optionList={groupOptions}
              onChange={(value) => {
                setSearchGroup(value);
                searchUsers(activePage, pageSize, searchKeyword, value);
              }}
            />
            <Button
              label={t('Query')}
              type='primary'
              htmlType='submit'
              className='btn-margin-right'
            >
              {t('Query')}
            </Button>
            <Button
              theme='light'
              type='primary'
              onClick={() => {
                setShowAddUser(true);
              }}
            >
              {t('AddUseUser')}
            </Button>
          </Space>
        </div>
      </Form>

      <Table
        columns={columns}
        dataSource={users}
        pagination={{
          formatPageText: (page) =>
            t('The {{start}} - {{end}} Item，Total {{total}} Item', {
              start: page.currentStart,
              end: page.currentEnd,
              total: users.length
            }),
          currentPage: activePage,
          pageSize: pageSize,
          total: userCount,
          pageSizeOpts: [10, 20, 50, 100],
          showSizeChanger: true,
          onPageSizeChange: (size) => {
            handlePageSizeChange(size);
          },
          onPageChange: handlePageChange,
        }}
        loading={loading}
      />
    </>
  );
};

export default UsersTable;
