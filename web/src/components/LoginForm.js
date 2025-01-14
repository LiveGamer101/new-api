import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserContext } from '../context/User';
import {
  API,
  getLogo,
  showError,
  showInfo,
  showSuccess,
  updateAPI,
} from '../helpers';
import { onGitHubOAuthClicked, onLinuxDOOAuthClicked } from './utils';
import Turnstile from 'react-turnstile';
import {
  Button,
  Card,
  Divider,
  Form,
  Icon,
  Layout,
  Modal,
} from '@douyinfe/semi-ui';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import Text from '@douyinfe/semi-ui/lib/es/typography/text';
import TelegramLoginButton from 'react-telegram-login';

import { IconGithubLogo, IconAlarm } from '@douyinfe/semi-icons';
import WeChatIcon from './WeChatIcon';
import { setUserData } from '../helpers/data.js';
import LinuxDoIcon from './LinuxDoIcon.js';
import { useTranslation } from 'react-i18next';

const LoginForm = () => {
  const [inputs, setInputs] = useState({
    username: '',
    password: '',
    wechat_verification_code: '',
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const { username, password } = inputs;
  const [userState, userDispatch] = useContext(UserContext);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  let navigate = useNavigate();
  const [status, setStatus] = useState({});
  const [showWeChatLoginModal, setShowWeChatLoginModal] = useState(false);
  const { t } = useTranslation();

  const logo = getLogo();

  let affCode = new URLSearchParams(window.location.search).get('aff');
  if (affCode) {
    localStorage.setItem('aff', affCode);
  }

  useEffect(() => {
    if (searchParams.get('expired')) {
      showError(t('NotLoginOrLoginExpired，Please retryLogin'));
    }
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      setStatus(status);
      if (status.turnstile_check) {
        setTurnstileEnabled(true);
        setTurnstileSiteKey(status.turnstile_site_key);
      }
    }
  }, []);


  const onWeChatLoginClicked = () => {
    setShowWeChatLoginModal(true);
  };

  const onSubmitWeChatVerificationCode = async () => {
    if (turnstileEnabled && turnstileToken === '') {
      showInfo('Please try again in a few seconds，Turnstile Checking user environment！');
      return;
    }
    const res = await API.get(
      `/api/oauth/wechat?code=${inputs.wechat_verification_code}`,
    );
    const { success, message, data } = res.data;
    if (success) {
      userDispatch({ type: 'login', payload: data });
      localStorage.setItem('user', JSON.stringify(data));
      setUserData(data);
      updateAPI();
      navigate('/');
      showSuccess('LoginSuccess！');
      setShowWeChatLoginModal(false);
    } else {
      showError(message);
    }
  };

  function handleChange(name, value) {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  }

  async function handleSubmit(e) {
    if (turnstileEnabled && turnstileToken === '') {
      showInfo('Please try again in a few seconds，Turnstile Checking user environment！');
      return;
    }
    setSubmitted(true);
    if (username && password) {
      const res = await API.post(
        `/api/user/login?turnstile=${turnstileToken}`,
        {
          username,
          password,
        },
      );
      const { success, message, data } = res.data;
      if (success) {
        userDispatch({ type: 'login', payload: data });
        setUserData(data);
        updateAPI();
        showSuccess('LoginSuccess！');
        if (username === 'root' && password === '123456') {
          Modal.error({
            title: 'You are using the defaultPassword！',
            content: 'Please modify the default immediatelyPassword！',
            centered: true,
          });
        }
        navigate('/token');
      } else {
        showError(message);
      }
    } else {
      showError('Please enterUsernameAndPassword！');
    }
  }

  // AddTelegramLoginHandler function
  const onTelegramLoginClicked = async (response) => {
    const fields = [
      'id',
      'first_name',
      'last_name',
      'username',
      'photo_url',
      'auth_date',
      'hash',
      'lang',
    ];
    const params = {};
    fields.forEach((field) => {
      if (response[field]) {
        params[field] = response[field];
      }
    });
    const res = await API.get(`/api/oauth/telegram/login`, { params });
    const { success, message, data } = res.data;
    if (success) {
      userDispatch({ type: 'login', payload: data });
      localStorage.setItem('user', JSON.stringify(data));
      showSuccess('LoginSuccess！');
      setUserData(data);
      updateAPI();
      navigate('/');
    } else {
      showError(message);
    }
  };

  return (
    <div>
      <Layout>
        <Layout.Content>
          <div
            style={{
              justifyContent: 'center',
              display: 'flex',
              marginTop: 120,
            }}
          >
            <div style={{ width: 500 }}>
              <Card>
                <Title heading={2} style={{ textAlign: 'center' }}>
                  {t('UserLogin')}
                </Title>
                <Form>
                  <Form.Input
                    field={'username'}
                    label={t('Username/Email')}
                    placeholder={t('Username/Email')}
                    name='username'
                    onChange={(value) => handleChange('username', value)}
                  />
                  <Form.Input
                    field={'password'}
                    label={t('Password')}
                    placeholder={t('Password')}
                    name='password'
                    type='password'
                    onChange={(value) => handleChange('password', value)}
                  />

                  <Button
                    theme='solid'
                    style={{ width: '100%' }}
                    type={'primary'}
                    size='large'
                    htmlType={'submit'}
                    onClick={handleSubmit}
                  >
                    {t('Login')}
                  </Button>
                </Form>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 20,
                  }}
                >
                  <Text>
                    {t('No account？')} <Link to='/register'>{t('ClickRegister')}</Link>
                  </Text>
                  <Text>
                    {t('ForgotPassword？')} <Link to='/reset'>{t('ClickReset')}</Link>
                  </Text>
                </div>
                {status.github_oauth ||
                status.wechat_login ||
                status.telegram_oauth ||
                status.linuxdo_oauth ? (
                  <>
                    <Divider margin='12px' align='center'>
                      {t('Third partyLogin')}
                    </Divider>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: 20,
                      }}
                    >
                      {status.github_oauth ? (
                        <Button
                          type='primary'
                          icon={<IconGithubLogo />}
                          onClick={() =>
                            onGitHubOAuthClicked(status.github_client_id)
                          }
                        />
                      ) : (
                        <></>
                      )}
                      {status.linuxdo_oauth ? (
                        <Button
                          icon={<LinuxDoIcon />}
                          onClick={() =>
                            onLinuxDOOAuthClicked(status.linuxdo_client_id)
                          }
                        />
                      ) : (
                        <></>
                      )}
                      {status.wechat_login ? (
                        <Button
                          type='primary'
                          style={{ color: 'rgba(var(--semi-green-5), 1)' }}
                          icon={<Icon svg={<WeChatIcon />} />}
                          onClick={onWeChatLoginClicked}
                        />
                      ) : (
                        <></>
                      )}
                    </div>
                    {status.telegram_oauth ? (
                      <>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginTop: 5,
                          }}
                        >
                          <TelegramLoginButton
                            dataOnauth={onTelegramLoginClicked}
                            botName={status.telegram_bot_name}
                          />
                        </div>
                      </>
                    ) : (
                      <></>
                    )}
                  </>
                ) : (
                  <></>
                )}
                <Modal
                  title={t('Scan with WeChatLogin')}
                  visible={showWeChatLoginModal}
                  maskClosable={true}
                  onOk={onSubmitWeChatVerificationCode}
                  onCancel={() => setShowWeChatLoginModal(false)}
                  okText={t('Login')}
                  size={'small'}
                  centered={true}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItem: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <img src={status.wechat_qrcode} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p>
                      {t('Scan with WeChatFollow the public account，Input「Verification Code」ObtainVerification Code（Valid for three minutes）')}
                    </p>
                  </div>
                  <Form size='large'>
                    <Form.Input
                      field={'wechat_verification_code'}
                      placeholder={t('Verification Code')}
                      label={t('Verification Code')}
                      value={inputs.wechat_verification_code}
                      onChange={(value) =>
                        handleChange('wechat_verification_code', value)
                      }
                    />
                  </Form>
                </Modal>
              </Card>
              {turnstileEnabled ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: 20,
                  }}
                >
                  <Turnstile
                    sitekey={turnstileSiteKey}
                    onVerify={(token) => {
                      setTurnstileToken(token);
                    }}
                  />
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
        </Layout.Content>
      </Layout>
    </div>
  );
};

export default LoginForm;
