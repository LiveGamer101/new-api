import React from 'react';
import UsersTable from '../../components/UsersTable';
import { Layout } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

const User = () => {
  const { t } = useTranslation();
  return (
    <>
      <Layout>
        <Layout.Content>
          <h3 style={{ marginBottom: '16px' }}>{t('RedirectingUseUser')}</h3>
          <UsersTable />
        </Layout.Content>
      </Layout>
    </>
  );
};

export default User;
