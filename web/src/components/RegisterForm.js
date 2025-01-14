import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API, getLogo, showError, showInfo, showSuccess, updateAPI } from '../helpers';
import Turnstile from 'react-turnstile';
import { Button, Card, Divider, Form, Icon, Layout, Modal } from '@douyinfe/semi-ui';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import Text from '@douyinfe/semi-ui/lib/es/typography/text';
import { IconGithubLogo } from '@douyinfe/semi-icons';
import { onGitHubOAuthClicked, onLinuxDOOAuthClicked } from './utils.js';
import LinuxDoIcon from './LinuxDoIcon.js';
import WeChatIcon from './WeChatIcon.js';
import TelegramLoginButton from 'react-telegram-login/src';
import { setUserData } from '../helpers/data.js';
import { UserContext } from '../context/User/index.js';
import { useTranslation } from 'react-i18next';

const RegisterForm = () => {
  const { t } = useTranslation();
  const [inputs, setInputs] = useState({
    username: '',
    password: '',
    password2: '',
    email: '',
    verification_code: ''
  });
  const { username, password, password2 } = inputs;
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [userState, userDispatch] = useContext(UserContext);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWeChatLoginModal, setShowWeChatLoginModal] = useState(false);
  const [status, setStatus] = useState({});
  let navigate = useNavigate();
  const logo = getLogo();

  let affCode = new URLSearchParams(window.location.search).get('aff');
  if (affCode) {
    localStorage.setItem('aff', affCode);
  }

  useEffect(() => {
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      setStatus(status);
      setShowEmailVerification(status.email_verification);
      if (status.turnstile_check) {
        setTurnstileEnabled(true);
        setTurnstileSiteKey(status.turnstile_site_key);
      }
    }
  });


  const onWeChatLoginClicked = () => {
    setShowWeChatLoginModal(true);
  };

  const onSubmitWeChatVerificationCode = async () => {
    if (turnstileEnabled && turnstileToken === '') {
      showInfo('Please try again in a few seconds，Turnstile In progressIf it already existsUseUser environment！');
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
    if (password.length < 8) {
      showInfo('PasswordLength must not be less than 8 Digits！');
      return;
    }
    if (password !== password2) {
      showInfo('TwiceInputThePasswordInconsistent');
      return;
    }
    if (username && password) {
      if (turnstileEnabled && turnstileToken === '') {
        showInfo('Please try again in a few seconds，Turnstile In progressIf it already existsUseUser environment！');
        return;
      }
      setLoading(true);
      if (!affCode) {
        affCode = localStorage.getItem('aff');
      }
      inputs.aff_code = affCode;
      const res = await API.post(
        `/api/user/register?turnstile=${turnstileToken}`,
        inputs
      );
      const { success, message } = res.data;
      if (success) {
        navigate('/login');
        showSuccess('RegisterSuccess！');
      } else {
        showError(message);
      }
      setLoading(false);
    }
  }

  const sendVerificationCode = async () => {
    if (inputs.email === '') return;
    if (turnstileEnabled && turnstileToken === '') {
      showInfo('Please try again in a few seconds，Turnstile In progressIf it already existsUseUser environment！');
      return;
    }
    setLoading(true);
    const res = await API.get(
      `/api/verification?email=${inputs.email}&turnstile=${turnstileToken}`
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess('Verification code sentSuccess，Please checkYouTheEmail！');
    } else {
      showError(message);
    }
    setLoading(false);
  };

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
              marginTop: 120
            }}
          >
            <div style={{ width: 500 }}>
              <Card>
                <Title heading={2} style={{ textAlign: 'center' }}>
                  {t('NewUseUserRegister')}
                </Title>
                <Form size="large">
                  <Form.Input
                    field={'username'}
                    label={t('Username')}
                    placeholder={t('Username')}
                    name="username"
                    onChange={(value) => handleChange('username', value)}
                  />
                  <Form.Input
                    field={'password'}
                    label={t('Password')}
                    placeholder={t('InputPassword，Shortest 8 Digits，Longest 20 Digits')}
                    name="password"
                    type="password"
                    onChange={(value) => handleChange('password', value)}
                  />
                  <Form.Input
                    field={'password2'}
                    label={t('ConfirmPassword')}
                    placeholder={t('ConfirmPassword')}
                    name="password2"
                    type="password"
                    onChange={(value) => handleChange('password2', value)}
                  />
                  {showEmailVerification ? (
                    <>
                      <Form.Input
                        field={'email'}
                        label={t('Email')}
                        placeholder={t('InputEmailAddress')}
                        onChange={(value) => handleChange('email', value)}
                        name="email"
                        type="email"
                        suffix={
                          <Button onClick={sendVerificationCode} disabled={loading}>
                            {t('ObtainVerification code')}
                          </Button>
                        }
                      />
                      <Form.Input
                        field={'verification_code'}
                        label={t('Verification code')}
                        placeholder={t('InputVerification code')}
                        onChange={(value) => handleChange('verification_code', value)}
                        name="verification_code"
                      />
                    </>
                  ) : (
                    <></>
                  )}
                  <Button
                    theme='solid'
                    style={{ width: '100%' }}
                    type={'primary'}
                    size='large'
                    htmlType={'submit'}
                    onClick={handleSubmit}
                  >
                    {t('Register')}
                  </Button>
                </Form>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 20
                  }}
                >
                  <Text>
                    {t('AlreadyHaveAllow new users？')}
                    <Link to="/login">
                      {t('ClickLogin')}
                    </Link>
                  </Text>
                </div>
                {status.github_oauth ||
                status.wechat_login ||
                status.telegram_oauth ||
                status.linuxdo_oauth ? (
                  <>
                    <Divider margin='12px' align='center'>
                      {t('TheThreeSquareLogin')}
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
              </Card>
              <Modal
                title={t('WeChatScanCodeLogin')}
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
                    {t('WeChatScanCodeFollow the public account，Input「Verification code」ObtainVerification code（ThreeMinuteWithinConfirm reset.）')}
                  </p>
                </div>
                <Form size='large'>
                  <Form.Input
                    field={'wechat_verification_code'}
                    placeholder={t('Verification code')}
                    label={t('Verification code')}
                    value={inputs.wechat_verification_code}
                    onChange={(value) =>
                      handleChange('wechat_verification_code', value)
                    }
                  />
                </Form>
              </Modal>
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

export default RegisterForm;
