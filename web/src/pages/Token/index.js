import React from 'react';
import TokensTable from '../../components/TokensTable';
import { Banner, Layout } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
const Token = () => {
  const { t } = useTranslation();
  return (
    <>
      <Layout>
        <Layout.Content>
          <Banner
            type='warning'
            description={t('TokenNoneMethodPrecisionControlControlUseUseQuota，OnlyAllowSelfUse，Do notDirectConvertTokenDistributeToHePerson。')}
            style={{ marginBottom: '16px' }}
          />
          <TokensTable />
        </Layout.Content>
      </Layout>
    </>
  );
};

export default Token;
