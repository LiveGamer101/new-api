import React, { useContext, useEffect, useState } from 'react';
import { Card, Col, Row } from '@douyinfe/semi-ui';
import { API, showError, showNotice, timestamp2string } from '../../helpers';
import { StatusContext } from '../../context/Status';
import { marked } from 'marked';
import { StyleContext } from '../../context/Style/index.js';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t, i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [styleState, styleDispatch] = useContext(StyleContext);

  const displayNotice = async () => {
    const res = await API.get('/api/notice');
    const { success, message, data } = res.data;
    if (success) {
      let oldNotice = localStorage.getItem('notice');
      if (data !== oldNotice && data !== '') {
        const htmlNotice = marked(data);
        showNotice(htmlNotice, true);
        localStorage.setItem('notice', data);
      }
    } else {
      showError(message);
    }
  };

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);

      // If content is a URL, send theme mode to iframe
      if (data.startsWith('https://')) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          const theme = localStorage.getItem('theme-mode') || 'light';
          iframe.onload = () => {
            iframe.contentWindow.postMessage({ themeMode: theme }, '*');
            iframe.contentWindow.postMessage({ lang: i18n.language }, '*');
          };
        }
      }
    } else {
      showError(message);
      setHomePageContent('Failed to load homepage content...');
    }
    setHomePageContentLoaded(true);
  };

  const getStartTimeString = () => {
    const timestamp = statusState?.status?.start_time;
    return statusState.status ? timestamp2string(timestamp) : '';
  };

  useEffect(() => {
    displayNotice();
    displayHomePageContent();
  }, []); // Run once on mount

  return (
    <>
      {homePageContentLoaded && homePageContent === '' ? (
        <>
          <Card
            bordered={false}
            headerLine={false}
            title={t('System Status')}
            bodyStyle={{ padding: '10px 20px' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Card
                  title={t('System Information')}
                  headerExtraContent={
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--semi-color-text-1)',
                      }}
                    >
                      {t('System Overview')}
                    </span>
                  }
                >
                  <p>{t('Name')}: {statusState?.status?.system_name}</p>
                  <p>
                    {t('Version')}:
                    {statusState?.status?.version
                      ? statusState?.status?.version
                      : 'unknown'}
                  </p>
                  <p>
                    {t('Source Code')}:
                    <a
                      href='https://github.com/Calcium-Ion/new-api'
                      target='_blank'
                      rel='noreferrer'
                    >
                      https://github.com/Calcium-Ion/new-api
                    </a>
                  </p>
                  <p>
                    {t('License')}:
                    <a
                      href='https://www.apache.org/licenses/LICENSE-2.0'
                      target='_blank'
                      rel='noreferrer'
                    >
                      Apache-2.0 License
                    </a>
                  </p>
                  <p>{t('Launch Time')}: {getStartTimeString()}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  title={t('System Configuration')}
                  headerExtraContent={
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--semi-color-text-1)',
                      }}
                    >
                      {t('Configuration Overview')}
                    </span>
                  }
                >
                  <p>
                    {t('Email Verification')}:
                    {statusState?.status?.email_verification === true
                      ? t('Enabled')
                      : t('Disabled')}
                  </p>
                  <p>
                    {t('GitHub OAuth')}:
                    {statusState?.status?.github_oauth === true
                      ? t('Enabled')
                      : t('Disabled')}
                  </p>
                  <p>
                    {t('WeChat Login')}:
                    {statusState?.status?.wechat_login === true
                      ? t('Enabled')
                      : t('Disabled')}
                  </p>
                  <p>
                    {t('Turnstile Verification')}:
                    {statusState?.status?.turnstile_check === true
                      ? t('Enabled')
                      : t('Disabled')}
                  </p>
                  <p>
                    {t('Telegram OAuth')}:
                    {statusState?.status?.telegram_oauth === true
                      ? t('Enabled')
                      : t('Disabled')}
                  </p>
                  <p>
                    {t('Linux DO OAuth')}:
                    {statusState?.status?.linuxdo_oauth === true
                      ? t('Enabled')
                      : t('Disabled')}
                  </p>
                </Card>
              </Col>
            </Row>
          </Card>
        </>
      ) : (
        <>
          {homePageContent.startsWith('https://') ? (
            <iframe
              src={homePageContent}
              style={{
                width: '100%',
                height: '100vh',
                border: 'none'
              }}
            />
          ) : (
            <div
              style={{ fontSize: 'larger' }}
              dangerouslySetInnerHTML={{ __html: homePageContent }}
            ></div>
          )}
        </>
      )}
    </>
  );
};

export default Home;
