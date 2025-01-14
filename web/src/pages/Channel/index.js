import React from 'react';
import ChannelsTable from '../../components/ChannelsTable';
import { Layout } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

const File = () => {
  const { t } = useTranslation();
  return (
    <>
      <Layout>
        <Layout.Content>
          <h3 style={{ marginBottom: '16px' }}>{t('RedirectingChannel')}</h3>
          <ChannelsTable />
        </Layout.Content>
      </Layout>
    </>
  );
};

export default File;
