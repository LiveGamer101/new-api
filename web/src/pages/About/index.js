import React, { useEffect, useState } from 'react';
import { API, showError } from '../../helpers';
import { marked } from 'marked';
import { Layout } from '@douyinfe/semi-ui';

const About = () => {
  const [about, setAbout] = useState('');
  const [aboutLoaded, setAboutLoaded] = useState(false);

  const displayAbout = async () => {
    setAbout(localStorage.getItem('about') || '');
    const res = await API.get('/api/about');
    const { success, message, data } = res.data;
    if (success) {
      let aboutContent = data;
      if (!data.startsWith('https://')) {
        aboutContent = marked.parse(data);
      }
      setAbout(aboutContent);
      localStorage.setItem('about', aboutContent);
    } else {
      showError(message);
      setAbout('Available inAboutAny webpage asFailed...');
    }
    setAboutLoaded(true);
  };

  useEffect(() => {
    displayAbout().then();
  }, []);

  return (
    <>
      {aboutLoaded && about === '' ? (
        <>
          <Layout>
            <Layout.Content>
              <h3 style={{ marginBottom: '16px' }}>About</h3>
              <p>Project repositorySettingsRemoveSettingsAboutAny webpage as，Support HTML & Markdown</p>
              New-APIBased onAddress：
              <a href='https://github.com/Calcium-Ion/new-api'>
                https://github.com/Calcium-Ion/new-api
              </a>
              <p>
                NewAPI © 2023 CalciumIon | This project is licensed under One API v0.5.4 © 2023
                JustSong。
              </p>
              <p>
                This projectUseMITMust comply with，Use under the terms of the agreementApache-2.0ProtocolTheFrontMentionDownUseUse。
              </p>
            </Layout.Content>
          </Layout>
        </>
      ) : (
        <>
          {about.startsWith('https://') ? (
            <iframe
              src={about}
              style={{
                width: '100%',
                height: '100vh',
                border: 'none'
              }}
            />
          ) : (
            <div
              style={{ fontSize: 'larger' }}
              dangerouslySetInnerHTML={{ __html: about }}
            ></div>
          )}
        </>
      )}
    </>
  );
};

export default About;
