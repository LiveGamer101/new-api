import React, { useEffect, useState } from 'react';
import {
  Button,
  Divider,
  Form,
  Grid,
  Header,
  Message,
  Modal,
} from 'semantic-ui-react';
import { API, removeTrailingSlash, showError, verifyJSON } from '../helpers';

import { useTheme } from '../context/Theme';

const SystemSetting = () => {
  let [inputs, setInputs] = useState({
    PasswordLoginEnabled: '',
    PasswordRegisterEnabled: '',
    EmailVerificationEnabled: '',
    GitHubOAuthEnabled: '',
    GitHubClientId: '',
    GitHubClientSecret: '',
    Notice: '',
    SMTPServer: '',
    SMTPPort: '',
    SMTPAccount: '',
    SMTPFrom: '',
    SMTPToken: '',
    ServerAddress: '',
    WorkerUrl: '',
    WorkerValidKey: '',
    EpayId: '',
    EpayKey: '',
    Price: 7.3,
    MinTopUp: 1,
    TopupGroupRatio: '',
    PayAddress: '',
    CustomCallbackAddress: '',
    Footer: '',
    WeChatAuthEnabled: '',
    WeChatServerAddress: '',
    WeChatServerToken: '',
    WeChatAccountQRCodeImageURL: '',
    TurnstileCheckEnabled: '',
    TurnstileSiteKey: '',
    TurnstileSecretKey: '',
    RegisterEnabled: '',
    EmailDomainRestrictionEnabled: '',
    EmailAliasRestrictionEnabled: '',
    SMTPSSLEnabled: '',
    EmailDomainWhitelist: [],
    // telegram login
    TelegramOAuthEnabled: '',
    TelegramBotToken: '',
    TelegramBotName: '',
    LinuxDOOAuthEnabled: '',
    LinuxDOClientId: '',
    LinuxDOClientSecret: '',
  });
  const [originInputs, setOriginInputs] = useState({});
  let [loading, setLoading] = useState(false);
  const [EmailDomainWhitelist, setEmailDomainWhitelist] = useState([]);
  const [restrictedDomainInput, setRestrictedDomainInput] = useState('');
  const [showPasswordWarningModal, setShowPasswordWarningModal] =
    useState(false);

  const theme = useTheme();
  const isDark = theme === 'dark';

  const getOptions = async () => {
    const res = await API.get('/api/option/');
    const { success, message, data } = res.data;
    if (success) {
      let newInputs = {};
      data.forEach((item) => {
        if (item.key === 'TopupGroupRatio') {
          item.value = JSON.stringify(JSON.parse(item.value), null, 2);
        }
        newInputs[item.key] = item.value;
      });
      setInputs({
        ...newInputs,
        EmailDomainWhitelist: newInputs.EmailDomainWhitelist.split(','),
      });
      setOriginInputs(newInputs);

      setEmailDomainWhitelist(
        newInputs.EmailDomainWhitelist.split(',').map((item) => {
          return { key: item, text: item, value: item };
        }),
      );
    } else {
      showError(message);
    }
  };

  useEffect(() => {
    getOptions().then();
  }, []);
  useEffect(() => {}, [inputs.EmailDomainWhitelist]);

  const updateOption = async (key, value) => {
    setLoading(true);
    switch (key) {
      case 'PasswordLoginEnabled':
      case 'PasswordRegisterEnabled':
      case 'EmailVerificationEnabled':
      case 'GitHubOAuthEnabled':
      case 'LinuxDOOAuthEnabled':
      case 'WeChatAuthEnabled':
      case 'TelegramOAuthEnabled':
      case 'TurnstileCheckEnabled':
      case 'EmailDomainRestrictionEnabled':
      case 'EmailAliasRestrictionEnabled':
      case 'SMTPSSLEnabled':
      case 'RegisterEnabled':
        value = inputs[key] === 'true' ? 'false' : 'true';
        break;
      default:
        break;
    }
    const res = await API.put('/api/option/', {
      key,
      value,
    });
    const { success, message } = res.data;
    if (success) {
      if (key === 'EmailDomainWhitelist') {
        value = value.split(',');
      }
      if (key === 'Price') {
        value = parseFloat(value);
      }
      setInputs((inputs) => ({
        ...inputs,
        [key]: value,
      }));
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const handleInputChange = async (e, { name, value }) => {
    if (name === 'PasswordLoginEnabled' && inputs[name] === 'true') {
      // block disabling password login
      setShowPasswordWarningModal(true);
      return;
    }
    if (
      name === 'Notice' ||
      (name.startsWith('SMTP') && name !== 'SMTPSSLEnabled') ||
      name === 'ServerAddress' ||
      name === 'WorkerUrl' ||
      name === 'WorkerValidKey' ||
      name === 'EpayId' ||
      name === 'EpayKey' ||
      name === 'Price' ||
      name === 'PayAddress' ||
      name === 'GitHubClientId' ||
      name === 'GitHubClientSecret' ||
      name === 'WeChatServerAddress' ||
      name === 'WeChatServerToken' ||
      name === 'WeChatAccountQRCodeImageURL' ||
      name === 'TurnstileSiteKey' ||
      name === 'TurnstileSecretKey' ||
      name === 'EmailDomainWhitelist' ||
      name === 'TopupGroupRatio' ||
      name === 'TelegramBotToken' ||
      name === 'TelegramBotName' ||
      name === 'LinuxDOClientId' ||
      name === 'LinuxDOClientSecret'
    ) {
      setInputs((inputs) => ({ ...inputs, [name]: value }));
    } else {
      await updateOption(name, value);
    }
  };

  const submitServerAddress = async () => {
    let ServerAddress = removeTrailingSlash(inputs.ServerAddress);
    await updateOption('ServerAddress', ServerAddress);
  };

  const submitWorker = async () => {
    let WorkerUrl = removeTrailingSlash(inputs.WorkerUrl);
    await updateOption('WorkerUrl', WorkerUrl);
    if (inputs.WorkerValidKey !== '') {
      await updateOption('WorkerValidKey', inputs.WorkerValidKey);
    }
  };

  const submitPayAddress = async () => {
    if (inputs.ServerAddress === '') {
      showError('Please fill in the server firstAddress');
      return;
    }
    if (originInputs['TopupGroupRatio'] !== inputs.TopupGroupRatio) {
      if (!verifyJSON(inputs.TopupGroupRatio)) {
        showError('ChargeAllGroupMultiplierNotIsTogetherMethodThe JSON String');
        return;
      }
      await updateOption('TopupGroupRatio', inputs.TopupGroupRatio);
    }
    let PayAddress = removeTrailingSlash(inputs.PayAddress);
    await updateOption('PayAddress', PayAddress);
    if (inputs.EpayId !== '') {
      await updateOption('EpayId', inputs.EpayId);
    }
    if (inputs.EpayKey !== undefined && inputs.EpayKey !== '') {
      await updateOption('EpayKey', inputs.EpayKey);
    }
    await updateOption('Price', '' + inputs.Price);
  };

  const submitSMTP = async () => {
    if (originInputs['SMTPServer'] !== inputs.SMTPServer) {
      await updateOption('SMTPServer', inputs.SMTPServer);
    }
    if (originInputs['SMTPAccount'] !== inputs.SMTPAccount) {
      await updateOption('SMTPAccount', inputs.SMTPAccount);
    }
    if (originInputs['SMTPFrom'] !== inputs.SMTPFrom) {
      await updateOption('SMTPFrom', inputs.SMTPFrom);
    }
    if (
      originInputs['SMTPPort'] !== inputs.SMTPPort &&
      inputs.SMTPPort !== ''
    ) {
      await updateOption('SMTPPort', inputs.SMTPPort);
    }
    if (
      originInputs['SMTPToken'] !== inputs.SMTPToken &&
      inputs.SMTPToken !== ''
    ) {
      await updateOption('SMTPToken', inputs.SMTPToken);
    }
  };

  const submitEmailDomainWhitelist = async () => {
    if (
      originInputs['EmailDomainWhitelist'] !==
        inputs.EmailDomainWhitelist.join(',') &&
      inputs.SMTPToken !== ''
    ) {
      await updateOption(
        'EmailDomainWhitelist',
        inputs.EmailDomainWhitelist.join(','),
      );
    }
  };

  const submitWeChat = async () => {
    if (originInputs['WeChatServerAddress'] !== inputs.WeChatServerAddress) {
      await updateOption(
        'WeChatServerAddress',
        removeTrailingSlash(inputs.WeChatServerAddress),
      );
    }
    if (
      originInputs['WeChatAccountQRCodeImageURL'] !==
      inputs.WeChatAccountQRCodeImageURL
    ) {
      await updateOption(
        'WeChatAccountQRCodeImageURL',
        inputs.WeChatAccountQRCodeImageURL,
      );
    }
    if (
      originInputs['WeChatServerToken'] !== inputs.WeChatServerToken &&
      inputs.WeChatServerToken !== ''
    ) {
      await updateOption('WeChatServerToken', inputs.WeChatServerToken);
    }
  };

  const submitGitHubOAuth = async () => {
    if (originInputs['GitHubClientId'] !== inputs.GitHubClientId) {
      await updateOption('GitHubClientId', inputs.GitHubClientId);
    }
    if (
      originInputs['GitHubClientSecret'] !== inputs.GitHubClientSecret &&
      inputs.GitHubClientSecret !== ''
    ) {
      await updateOption('GitHubClientSecret', inputs.GitHubClientSecret);
    }
  };

  const submitTelegramSettings = async () => {
    // await updateOption('TelegramOAuthEnabled', inputs.TelegramOAuthEnabled);
    await updateOption('TelegramBotToken', inputs.TelegramBotToken);
    await updateOption('TelegramBotName', inputs.TelegramBotName);
  };

  const submitTurnstile = async () => {
    if (originInputs['TurnstileSiteKey'] !== inputs.TurnstileSiteKey) {
      await updateOption('TurnstileSiteKey', inputs.TurnstileSiteKey);
    }
    if (
      originInputs['TurnstileSecretKey'] !== inputs.TurnstileSecretKey &&
      inputs.TurnstileSecretKey !== ''
    ) {
      await updateOption('TurnstileSecretKey', inputs.TurnstileSecretKey);
    }
  };

  const submitNewRestrictedDomain = () => {
    const localDomainList = inputs.EmailDomainWhitelist;
    if (
      restrictedDomainInput !== '' &&
      !localDomainList.includes(restrictedDomainInput)
    ) {
      setRestrictedDomainInput('');
      setInputs({
        ...inputs,
        EmailDomainWhitelist: [...localDomainList, restrictedDomainInput],
      });
      setEmailDomainWhitelist([
        ...EmailDomainWhitelist,
        {
          key: restrictedDomainInput,
          text: restrictedDomainInput,
          value: restrictedDomainInput,
        },
      ]);
    }
  };

  const submitLinuxDOOAuth = async () => {
    if (originInputs['LinuxDOClientId'] !== inputs.LinuxDOClientId) {
      await updateOption('LinuxDOClientId', inputs.LinuxDOClientId);
    }
    if (
      originInputs['LinuxDOClientSecret'] !== inputs.LinuxDOClientSecret &&
      inputs.LinuxDOClientSecret !== ''
    ) {
      await updateOption('LinuxDOClientSecret', inputs.LinuxDOClientSecret);
    }
  };

  return (
    <Grid columns={1}>
      <Grid.Column>
        <Form loading={loading} inverted={isDark}>
          <Header as='h3' inverted={isDark}>
            ThroughUseSettings
          </Header>
          <Form.Group widths='equal'>
            <Form.Input
              label='ServerAddress'
              placeholder='For example：https://yourdomain.com'
              value={inputs.ServerAddress}
              name='ServerAddress'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Button onClick={submitServerAddress}>
            UpdateServerAddress
          </Form.Button>
          <Header as='h3' inverted={isDark}>
            ProxySettings（Support{' '}
            <a
              href='https://github.com/Calcium-Ion/new-api-worker'
              target='_blank'
              rel='noreferrer'
            >
              new-api-worker
            </a>
            ）
          </Header>
          <Form.Group widths='equal'>
            <Form.Input
              label='WorkerAddress，Leave blank if notEnableProxy'
              placeholder='For example：https://workername.yourdomain.workers.dev'
              value={inputs.WorkerUrl}
              name='WorkerUrl'
              onChange={handleInputChange}
            />
            <Form.Input
              label='WorkerKey，UseYouDeployThe Worker Fill in'
              placeholder='For example：your_secret_key'
              value={inputs.WorkerValidKey}
              name='WorkerValidKey'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Button onClick={submitWorker}>UpdateWorkerSettings</Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            PaymentSettings（CurrentOnlySupportEasyPaymentInterface，DefaultUseUseAboveServerAddressOperateForCallbackAddress！）
          </Header>
          <Form.Group widths='equal'>
            <Form.Input
              label='PaymentAddress，Leave blank if notEnableHandle filtering and pagination logic first.LinePayment'
              placeholder='For example：https://yourdomain.com'
              value={inputs.PayAddress}
              name='PayAddress'
              onChange={handleInputChange}
            />
            <Form.Input
              label='EasyPaymentBusinessUserID'
              placeholder='For example：0001'
              value={inputs.EpayId}
              name='EpayId'
              onChange={handleInputChange}
            />
            <Form.Input
              label='EasyPaymentBusinessUserKey'
              placeholder='SensitiveInfoWill not be sent to the front-end display'
              value={inputs.EpayKey}
              name='EpayKey'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group widths='equal'>
            <Form.Input
              label='CallbackAddress，NotFill inThenUseUseAboveServerAddressOperateForCallbackAddress'
              placeholder='For example：https://yourdomain.com'
              value={inputs.CustomCallbackAddress}
              name='CustomCallbackAddress'
              onChange={handleInputChange}
            />
            <Form.Input
              label='ChargeAllPrice（xYuan/USD）'
              placeholder='For example：7，That is7Yuan/USD'
              value={inputs.Price}
              name='Price'
              min={0}
              onChange={handleInputChange}
            />
            <Form.Input
              label='MinimumChargeAllDollarNumberQuantity（UsedUSDForUnit，IfUseUseQuotaPleaseConvert on your own！）'
              placeholder='For example：2，That isMinimumChargeAll2$'
              value={inputs.MinTopUp}
              name='MinTopUp'
              min={1}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group widths='equal'>
            <Form.TextArea
              label='ChargeAllGroupMultiplier'
              name='TopupGroupRatio'
              onChange={handleInputChange}
              style={{ minHeight: 250, fontFamily: 'JetBrains Mono, Consolas' }}
              autoComplete='new-password'
              value={inputs.TopupGroupRatio}
              placeholder='ForOneItems JSON Text，KeyForGroupName，AllForMultiplier'
            />
          </Form.Group>
          <Form.Button onClick={submitPayAddress}>UpdatePaymentSettings</Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            ConfigurationLoginRegister
          </Header>
          <Form.Group inline>
            <Form.Checkbox
              checked={inputs.PasswordLoginEnabled === 'true'}
              label='Allow throughPasswordProceedLogin'
              name='PasswordLoginEnabled'
              onChange={handleInputChange}
            />
            {showPasswordWarningModal && (
              <Modal
                open={showPasswordWarningModal}
                onClose={() => setShowPasswordWarningModal(false)}
                size={'tiny'}
                style={{ maxWidth: '450px' }}
              >
                <Modal.Header>Warning</Modal.Header>
                <Modal.Content>
                  <p>
                    CancelPasswordLoginConvertCauseAre overwrite operationsNot YetBindA new oneLoginMethodTheUseUser（IncludeAdministrator）NoneMethodVerification is requiredPasswordLogin，ConfirmCancel？
                  </p>
                </Modal.Content>
                <Modal.Actions>
                  <Button onClick={() => setShowPasswordWarningModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    color='yellow'
                    onClick={async () => {
                      setShowPasswordWarningModal(false);
                      await updateOption('PasswordLoginEnabled', 'false');
                    }}
                  >
                    When passing through
                  </Button>
                </Modal.Actions>
              </Modal>
            )}
            <Form.Checkbox
              checked={inputs.PasswordRegisterEnabled === 'true'}
              label='Allow throughPasswordProceedRegister'
              name='PasswordRegisterEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.EmailVerificationEnabled === 'true'}
              label='Verification is requiredPasswordRegisterWhenQuota neededProceedEmailAllow through WeChat'
              name='EmailVerificationEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.GitHubOAuthEnabled === 'true'}
              label='Allow through GitHub Allow new usersLogin & Register'
              name='GitHubOAuthEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.LinuxDOOAuthEnabled === 'true'}
              label='Allow through LinuxDO Allow new usersLogin & Register'
              name='LinuxDOOAuthEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.WeChatAuthEnabled === 'true'}
              label='Allow throughWeChatLogin & Register'
              name='WeChatAuthEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.TelegramOAuthEnabled === 'true'}
              label='Allow through Telegram ProceedLogin'
              name='TelegramOAuthEnabled'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group inline>
            <Form.Checkbox
              checked={inputs.RegisterEnabled === 'true'}
              label='AllowNewUseUserRegister（ThisItemForNoWhen，NewUseUserConvertNoneMethodUsedAnyMethodProceedRegister）'
              name='RegisterEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.TurnstileCheckEnabled === 'true'}
              label='Enable Turnstile UseUserCheck'
              name='TurnstileCheckEnabled'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Divider />
          <Header as='h3' inverted={isDark}>
            ConfigurationEmailBatch
            <Header.Subheader>
              UseUsedPrevent maliciousUseUserProfitUseTemporaryWhenEmailAllowedRegister
            </Header.Subheader>
          </Header>
          <Form.Group widths={3}>
            <Form.Checkbox
              label='EnableEmailBatch'
              name='EmailDomainRestrictionEnabled'
              onChange={handleInputChange}
              checked={inputs.EmailDomainRestrictionEnabled === 'true'}
            />
          </Form.Group>
          <Form.Group widths={3}>
            <Form.Checkbox
              label='EnableEmailDomains（For example：ab.cd@gmail.com）'
              name='EmailAliasRestrictionEnabled'
              onChange={handleInputChange}
              checked={inputs.EmailAliasRestrictionEnabled === 'true'}
            />
          </Form.Group>
          <Form.Group widths={2}>
            <Form.Dropdown
              label='AllowTheEmailFill in'
              placeholder='AllowTheEmailFill in'
              name='EmailDomainWhitelist'
              required
              fluid
              multiple
              selection
              onChange={handleInputChange}
              value={inputs.EmailDomainWhitelist}
              autoComplete='new-password'
              options={EmailDomainWhitelist}
            />
            <Form.Input
              label='AddNewTheAllowTheEmailFill in'
              action={
                <Button
                  type='button'
                  onClick={() => {
                    submitNewRestrictedDomain();
                  }}
                >
                  Used to support the system's email sending
                </Button>
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  submitNewRestrictedDomain();
                }
              }}
              autoComplete='new-password'
              placeholder='InputNewTheAllowTheEmailFill in'
              value={restrictedDomainInput}
              onChange={(e, { value }) => {
                setRestrictedDomainInput(value);
              }}
            />
          </Form.Group>
          <Form.Button onClick={submitEmailDomainWhitelist}>
            SaveEmailBatchSettings
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            Configuration SMTP
            <Header.Subheader>UseUsedSupportSystemTheEmail sent</Header.Subheader>
          </Header>
          <Form.Group widths={3}>
            <Form.Input
              label='SMTP ServerAddress'
              name='SMTPServer'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.SMTPServer}
              placeholder='For example：smtp.qq.com'
            />
            <Form.Input
              label='SMTP Port'
              name='SMTPPort'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.SMTPPort}
              placeholder='Default: 587'
            />
            <Form.Input
              label='SMTP Allow new users'
              name='SMTPAccount'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.SMTPAccount}
              placeholder='Usually isEmailAddress'
            />
          </Form.Group>
          <Form.Group widths={3}>
            <Form.Input
              label='SMTP SenderEmail'
              name='SMTPFrom'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.SMTPFrom}
              placeholder='Usually consistent withEmailAddressKeep consistent'
            />
            <Form.Input
              label='SMTP Access credentials'
              name='SMTPToken'
              onChange={handleInputChange}
              type='password'
              autoComplete='new-password'
              checked={inputs.RegisterEnabled === 'true'}
              placeholder='SensitiveInfoWill not be sent to the front-end display'
            />
          </Form.Group>
          <Form.Group widths={3}>
            <Form.Checkbox
              label='EnableSMTP SSL（465PortStrongControlEnable）'
              name='SMTPSSLEnabled'
              onChange={handleInputChange}
              checked={inputs.SMTPSSLEnabled === 'true'}
            />
          </Form.Group>
          <Form.Button onClick={submitSMTP}>Save SMTP Settings</Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            Configuration GitHub OAuth App
            <Header.Subheader>
              UseUsedSupportVerification is required GitHub ProceedLoginRegister，
              <a
                href='https://github.com/settings/developers'
                target='_blank'
                rel='noreferrer'
              >
                ClickThisPlace
              </a>
              RedirectingYouThe GitHub OAuth App
            </Header.Subheader>
          </Header>
          <Message>
            Homepage URL Fill <code>{inputs.ServerAddress}</code>
            ，Authorization callback URL Fill{' '}
            <code>{`${inputs.ServerAddress}/oauth/github`}</code>
          </Message>
          <Form.Group widths={3}>
            <Form.Input
              label='GitHub Client ID'
              name='GitHubClientId'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.GitHubClientId}
              placeholder='InputYouRegisterThe GitHub OAuth APP The ID'
            />
            <Form.Input
              label='GitHub Client Secret'
              name='GitHubClientSecret'
              onChange={handleInputChange}
              type='password'
              autoComplete='new-password'
              value={inputs.GitHubClientSecret}
              placeholder='SensitiveInfoWill not be sent to the front-end display'
            />
          </Form.Group>
          <Form.Button onClick={submitGitHubOAuth}>
            Save GitHub OAuth Settings
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            Configuration WeChat Server
            <Header.Subheader>
              UseUsedSupportVerification is requiredWeChatProceedLoginRegister，
              <a
                href='https://github.com/songquanpeng/wechat-server'
                target='_blank'
                rel='noreferrer'
              >
                ClickThisPlace
              </a>
              Learn WeChat Server
            </Header.Subheader>
          </Header>
          <Form.Group widths={3}>
            <Form.Input
              label='WeChat Server ServerAddress'
              name='WeChatServerAddress'
              placeholder='For example：https://yourdomain.com'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.WeChatServerAddress}
            />
            <Form.Input
              label='WeChat Server Access credentials'
              name='WeChatServerToken'
              type='password'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.WeChatServerToken}
              placeholder='SensitiveInfoWill not be sent to the front-end display'
            />
            <Form.Input
              label='WeChatPublic account QR codeCodeImageUnit dollar amount'
              name='WeChatAccountQRCodeImageURL'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.WeChatAccountQRCodeImageURL}
              placeholder='InputOneItemsImageUnit dollar amount'
            />
          </Form.Group>
          <Form.Button onClick={submitWeChat}>
            Save WeChat Server Settings
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            Configuration Telegram Login
          </Header>
          <Form.Group inline>
            <Form.Input
              label='Telegram Bot Token'
              name='TelegramBotToken'
              onChange={handleInputChange}
              value={inputs.TelegramBotToken}
              placeholder='InputYouThe Telegram Bot Token'
            />
            <Form.Input
              label='Telegram Bot Name'
              name='TelegramBotName'
              onChange={handleInputChange}
              value={inputs.TelegramBotName}
              placeholder='InputYouThe Telegram Bot Name'
            />
          </Form.Group>
          <Form.Button onClick={submitTelegramSettings}>
            Save Telegram LoginSettings
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            Configuration Turnstile
            <Header.Subheader>
              UseUsedSupportUseUserCheck，
              <a
                href='https://dash.cloudflare.com/'
                target='_blank'
                rel='noreferrer'
              >
                ClickThisPlace
              </a>
              RedirectingYouThe Turnstile Sites，RecommendSelect Invisible Widget Type
            </Header.Subheader>
          </Header>
          <Form.Group widths={3}>
            <Form.Input
              label='Turnstile Site Key'
              name='TurnstileSiteKey'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.TurnstileSiteKey}
              placeholder='InputYouRegisterThe Turnstile Site Key'
            />
            <Form.Input
              label='Turnstile Secret Key'
              name='TurnstileSecretKey'
              onChange={handleInputChange}
              type='password'
              autoComplete='new-password'
              value={inputs.TurnstileSecretKey}
              placeholder='SensitiveInfoWill not be sent to the front-end display'
            />
          </Form.Group>
          <Form.Button onClick={submitTurnstile}>
            Save Turnstile Settings
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            Configuration LinuxDO OAuth App
            <Header.Subheader>
              UseUsedSupportVerification is required LinuxDO ProceedLoginRegister，
              <a
                href='https://connect.linux.do/'
                target='_blank'
                rel='noreferrer'
              >
                ClickThisPlace
              </a>
              RedirectingYouThe LinuxDO OAuth App
            </Header.Subheader>
          </Header>
          <Message>
            Homepage URL Fill <code>{inputs.ServerAddress}</code>
            ，Authorization callback URL Fill{' '}
            <code>{`${inputs.ServerAddress}/oauth/linuxdo`}</code>
          </Message>
          <Form.Group widths={3}>
            <Form.Input
              label='LinuxDO Client ID'
              name='LinuxDOClientId'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.LinuxDOClientId}
              placeholder='InputYouRegisterThe LinuxDO OAuth APP The ID'
            />
            <Form.Input
              label='LinuxDO Client Secret'
              name='LinuxDOClientSecret'
              onChange={handleInputChange}
              type='password'
              autoComplete='new-password'
              value={inputs.LinuxDOClientSecret}
              placeholder='SensitiveInfoWill not be sent to the front-end display'
            />
          </Form.Group>
          <Form.Button onClick={submitLinuxDOOAuth}>
            Save LinuxDO OAuth Settings
          </Form.Button>
        </Form>
      </Grid.Column>
    </Grid>
  );
};

export default SystemSetting;
