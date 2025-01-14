import React, {useContext, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    API,
    copy,
    isRoot,
    showError,
    showInfo,
    showSuccess,
} from '../helpers';
import Turnstile from 'react-turnstile';
import {UserContext} from '../context/User';
import {onGitHubOAuthClicked, onLinuxDOOAuthClicked} from './utils';
import {
    Avatar,
    Banner,
    Button,
    Card,
    Descriptions,
    Image,
    Input,
    InputNumber,
    Layout,
    Modal,
    Space,
    Tag,
    Typography,
    Collapsible,
} from '@douyinfe/semi-ui';
import {
    getQuotaPerUnit,
    renderQuota,
    renderQuotaWithPrompt,
    stringToColor,
} from '../helpers/render';
import TelegramLoginButton from 'react-telegram-login';
import { useTranslation } from 'react-i18next';

const PersonalSetting = () => {
    const [userState, userDispatch] = useContext(UserContext);
    let navigate = useNavigate();
    const { t } = useTranslation();

    const [inputs, setInputs] = useState({
        wechat_verification_code: '',
        email_verification_code: '',
        email: '',
        self_account_deletion_confirmation: '',
        set_new_password: '',
        set_new_password_confirmation: '',
    });
    const [status, setStatus] = useState({});
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showWeChatBindModal, setShowWeChatBindModal] = useState(false);
    const [showEmailBindModal, setShowEmailBindModal] = useState(false);
    const [showAccountDeleteModal, setShowAccountDeleteModal] = useState(false);
    const [turnstileEnabled, setTurnstileEnabled] = useState(false);
    const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
    const [turnstileToken, setTurnstileToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [disableButton, setDisableButton] = useState(false);
    const [countdown, setCountdown] = useState(30);
    const [affLink, setAffLink] = useState('');
    const [systemToken, setSystemToken] = useState('');
    const [models, setModels] = useState([]);
    const [openTransfer, setOpenTransfer] = useState(false);
    const [transferAmount, setTransferAmount] = useState(0);
    const [isModelsExpanded, setIsModelsExpanded] = useState(false);
    const MODELS_DISPLAY_COUNT = 10;  // DefaultDisplayTheModelNumberQuantity

    useEffect(() => {
        // let user = localStorage.getItem('user');
        // if (user) {
        //   userDispatch({ type: 'login', payload: user });
        // }
        // console.log(localStorage.getItem('user'))

        let status = localStorage.getItem('status');
        if (status) {
            status = JSON.parse(status);
            setStatus(status);
            if (status.turnstile_check) {
                setTurnstileEnabled(true);
                setTurnstileSiteKey(status.turnstile_site_key);
            }
        }
        getUserData().then((res) => {
            console.log(userState);
        });
        loadModels().then();
        getAffLink().then();
        setTransferAmount(getQuotaPerUnit());
    }, []);

    useEffect(() => {
        let countdownInterval = null;
        if (disableButton && countdown > 0) {
            countdownInterval = setInterval(() => {
                setCountdown(countdown - 1);
            }, 1000);
        } else if (countdown === 0) {
            setDisableButton(false);
            setCountdown(30);
        }
        return () => clearInterval(countdownInterval); // Clean up on unmount
    }, [disableButton, countdown]);

    const handleInputChange = (name, value) => {
        setInputs((inputs) => ({...inputs, [name]: value}));
    };

    const generateAccessToken = async () => {
        const res = await API.get('/api/user/token');
        const {success, message, data} = res.data;
        if (success) {
            setSystemToken(data);
            await copy(data);
            showSuccess(t('TokenAlreadyResetAndAlreadyCopyTo clipboard'));
        } else {
            showError(message);
        }
    };

    const getAffLink = async () => {
        const res = await API.get('/api/user/aff');
        const {success, message, data} = res.data;
        if (success) {
            let link = `${window.location.origin}/register?aff=${data}`;
            setAffLink(link);
        } else {
            showError(message);
        }
    };

    const getUserData = async () => {
        let res = await API.get(`/api/user/self`);
        const {success, message, data} = res.data;
        if (success) {
            userDispatch({type: 'login', payload: data});
        } else {
            showError(message);
        }
    };

    const loadModels = async () => {
        let res = await API.get(`/api/user/models`);
        const {success, message, data} = res.data;
        if (success) {
            if (data != null) {
                setModels(data);
            }
        } else {
            showError(message);
        }
    };

    const handleAffLinkClick = async (e) => {
        e.target.select();
        await copy(e.target.value);
        showSuccess(t('Invitation LinkAlreadyCopyThe path before.Clipboard'));
    };

    const handleSystemTokenClick = async (e) => {
        e.target.select();
        await copy(e.target.value);
        showSuccess(t('SystemTokenAlreadyCopyThe path before.Clipboard'));
    };

    const deleteAccount = async () => {
        if (inputs.self_account_deletion_confirmation !== userState.user.username) {
            showError(t('Please enterYouTheAllow new usersNameUsedConfirmDelete！'));
            return;
        }

        const res = await API.delete('/api/user/self');
        const {success, message} = res.data;

        if (success) {
            showSuccess(t('Account hasDelete！'));
            await API.get('/api/user/logout');
            userDispatch({type: 'logout'});
            localStorage.removeItem('user');
            navigate('/login');
        } else {
            showError(message);
        }
    };

    const bindWeChat = async () => {
        if (inputs.wechat_verification_code === '') return;
        const res = await API.get(
            `/api/oauth/wechat/bind?code=${inputs.wechat_verification_code}`,
        );
        const {success, message} = res.data;
        if (success) {
            showSuccess(t('WeChatAllow new usersBindSuccess！'));
            setShowWeChatBindModal(false);
        } else {
            showError(message);
        }
    };

    const changePassword = async () => {
        if (inputs.set_new_password !== inputs.set_new_password_confirmation) {
            showError(t('TwiceInputThePasswordInconsistent！'));
            return;
        }
        const res = await API.put(`/api/user/self`, {
            password: inputs.set_new_password,
        });
        const {success, message} = res.data;
        if (success) {
            showSuccess(t('PasswordModifySuccess！'));
            setShowWeChatBindModal(false);
        } else {
            showError(message);
        }
        setShowChangePasswordModal(false);
    };

    const transfer = async () => {
        if (transferAmount < getQuotaPerUnit()) {
            showError(t('TransferAmountMinimumFor') + ' ' + renderQuota(getQuotaPerUnit()));
            return;
        }
        const res = await API.post(`/api/user/aff_transfer`, {
            quota: transferAmount,
        });
        const {success, message} = res.data;
        if (success) {
            showSuccess(message);
            setOpenTransfer(false);
            getUserData().then();
        } else {
            showError(message);
        }
    };

    const sendVerificationCode = async () => {
        if (inputs.email === '') {
            showError(t('Please enterEmail！'));
            return;
        }
        setDisableButton(true);
        if (turnstileEnabled && turnstileToken === '') {
            showInfo('Please try again in a few seconds，Turnstile In progressIf it already existsUseUser environment！');
            return;
        }
        setLoading(true);
        const res = await API.get(
            `/api/verification?email=${inputs.email}&turnstile=${turnstileToken}`,
        );
        const {success, message} = res.data;
        if (success) {
            showSuccess(t('Verification code sentSuccess，Please checkEmail！'));
        } else {
            showError(message);
        }
        setLoading(false);
    };

    const bindEmail = async () => {
        if (inputs.email_verification_code === '') {
            showError(t('Please enterEmailVerification code！'));
            return;
        }
        setLoading(true);
        const res = await API.get(
            `/api/oauth/email/bind?email=${inputs.email}&code=${inputs.email_verification_code}`,
        );
        const {success, message} = res.data;
        if (success) {
            showSuccess(t('EmailAllow new usersBindSuccess！'));
            setShowEmailBindModal(false);
            userState.user.email = inputs.email;
        } else {
            showError(message);
        }
        setLoading(false);
    };

    const getUsername = () => {
        if (userState.user) {
            return userState.user.username;
        } else {
            return 'null';
        }
    };

    const handleCancel = () => {
        setOpenTransfer(false);
    };

    const copyText = async (text) => {
        if (await copy(text)) {
            showSuccess(t('AlreadyCopy：') + text);
        } else {
            // setSearchKeyword(text);
            Modal.error({title: t('NoneMethodCopyTo clipboard，PleaseManualCopy'), content: text});
        }
    };

    return (
        <div>
            <Layout>
                <Layout.Content>
                    <Modal
                        title={t('Please enterWantTransferTheNumberQuantity')}
                        visible={openTransfer}
                        onOk={transfer}
                        onCancel={handleCancel}
                        maskClosable={false}
                        size={'small'}
                        centered={true}
                    >
                        <div style={{marginTop: 20}}>
                            <Typography.Text>{t('CanUseQuota')}{renderQuotaWithPrompt(userState?.user?.aff_quota)}</Typography.Text>
                            <Input
                                style={{marginTop: 5}}
                                value={userState?.user?.aff_quota}
                                disabled={true}
                            ></Input>
                        </div>
                        <div style={{marginTop: 20}}>
                            <Typography.Text>
                                {t('TransferQuota')}{renderQuotaWithPrompt(transferAmount)} {t('Minimum') + renderQuota(getQuotaPerUnit())}
                            </Typography.Text>
                            <div>
                                <InputNumber
                                    min={0}
                                    style={{marginTop: 5}}
                                    value={transferAmount}
                                    onChange={(value) => setTransferAmount(value)}
                                    disabled={false}
                                ></InputNumber>
                            </div>
                        </div>
                    </Modal>
                    <div style={{marginTop: 20}}>
                        <Card
                            title={
                                <Card.Meta
                                    avatar={
                                        <Avatar
                                            size='default'
                                            color={stringToColor(getUsername())}
                                            style={{marginRight: 4}}
                                        >
                                            {typeof getUsername() === 'string' &&
                                                getUsername().slice(0, 1)}
                                        </Avatar>
                                    }
                                    title={<Typography.Text>{getUsername()}</Typography.Text>}
                                    description={
                                        isRoot() ? (
                                            <Tag color='red'>{t('Administrator')}</Tag>
                                        ) : (
                                            <Tag color='blue'>{t('CommonThroughUseUser')}</Tag>
                                        )
                                    }
                                ></Card.Meta>
                            }
                            headerExtraContent={
                                <>
                                    <Space vertical align='start'>
                                        <Tag color='green'>{'ID: ' + userState?.user?.id}</Tag>
                                        <Tag color='blue'>{userState?.user?.group}</Tag>
                                    </Space>
                                </>
                            }
                            footer={
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Typography.Title heading={6}>{t('CanUseModel')}</Typography.Title>
                                </div>
                                <div style={{marginTop: 10}}>
                                    {models.length <= MODELS_DISPLAY_COUNT ? (
                                        <Space wrap>
                                            {models.map((model) => (
                                                <Tag
                                                    key={model}
                                                    color='cyan'
                                                    onClick={() => {
                                                        copyText(model);
                                                    }}
                                                >
                                                    {model}
                                                </Tag>
                                            ))}
                                        </Space>
                                    ) : (
                                        <>
                                            <Collapsible isOpen={isModelsExpanded}>
                                                <Space wrap>
                                                    {models.map((model) => (
                                                        <Tag
                                                            key={model}
                                                            color='cyan'
                                                            onClick={() => {
                                                                copyText(model);
                                                            }}
                                                        >
                                                            {model}
                                                        </Tag>
                                                    ))}
                                                    <Tag 
                                                        color='blue' 
                                                        type="light"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => setIsModelsExpanded(false)}
                                                    >
                                                        {t('Collapse')}
                                                    </Tag>
                                                </Space>
                                            </Collapsible>
                                            {!isModelsExpanded && (
                                                <Space wrap>
                                                    {models.slice(0, MODELS_DISPLAY_COUNT).map((model) => (
                                                        <Tag
                                                            key={model}
                                                            color='cyan'
                                                            onClick={() => {
                                                                copyText(model);
                                                            }}
                                                        >
                                                            {model}
                                                        </Tag>
                                                    ))}
                                                    <Tag 
                                                        color='blue'
                                                        type="light"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => setIsModelsExpanded(true)}
                                                    >
                                                        {t('More')} {models.length - MODELS_DISPLAY_COUNT} {t('ItemsModel')}
                                                    </Tag>
                                                </Space>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>

                            }
                        >
                            <Descriptions row>
                                <Descriptions.Item itemKey={t('CurrentBalance')}>
                                    {renderQuota(userState?.user?.quota)}
                                </Descriptions.Item>
                                <Descriptions.Item itemKey={t('Historical Consumption')}>
                                    {renderQuota(userState?.user?.used_quota)}
                                </Descriptions.Item>
                                <Descriptions.Item itemKey={t('PleaseRequest timesNumber')}>
                                    {userState.user?.request_count}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                        <Card
                            style={{marginTop: 10}}
                            footer={
                                <div>
                                    <Typography.Text>{t('Invitation Link')}</Typography.Text>
                                    <Input
                                        style={{marginTop: 10}}
                                        value={affLink}
                                        onClick={handleAffLinkClick}
                                        readOnly
                                    />
                                </div>
                            }
                        >
                            <Typography.Title heading={6}>{t('InviteInfo')}</Typography.Title>
                            <div style={{marginTop: 10}}>
                                <Descriptions row>
                                    <Descriptions.Item itemKey={t('WaitUseUseEarnings')}>
                                        <span style={{color: 'rgba(var(--semi-red-5), 1)'}}>
                                            {renderQuota(userState?.user?.aff_quota)}
                                        </span>
                                        <Button
                                            type={'secondary'}
                                            onClick={() => setOpenTransfer(true)}
                                            size={'small'}
                                            style={{marginLeft: 10}}
                                        >
                                            {t('Transfer')}
                                        </Button>
                                    </Descriptions.Item>
                                    <Descriptions.Item itemKey={t('Total Earnings')}>
                                        {renderQuota(userState?.user?.aff_history_quota)}
                                    </Descriptions.Item>
                                    <Descriptions.Item itemKey={t('InvitePersonNumber')}>
                                        {userState?.user?.aff_count}
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>
                        </Card>
                        <Card style={{marginTop: 10}}>
                            <Typography.Title heading={6}>{t('ItemsPersonInfo')}</Typography.Title>
                            <div style={{marginTop: 20}}>
                                <Typography.Text strong>{t('Email')}</Typography.Text>
                                <div
                                    style={{display: 'flex', justifyContent: 'space-between'}}
                                >
                                    <div>
                                        <Input
                                            value={
                                                userState.user && userState.user.email !== ''
                                                    ? userState.user.email
                                                    : t('Not YetBind')
                                            }
                                            readonly={true}
                                        ></Input>
                                    </div>
                                    <div>
                                        <Button
                                            onClick={() => {
                                                setShowEmailBindModal(true);
                                            }}
                                        >
                                            {userState.user && userState.user.email !== ''
                                                ? t('ModifyBind')
                                                : t('BindEmail')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div style={{marginTop: 10}}>
                                <Typography.Text strong>{t('WeChat')}</Typography.Text>
                                <div
                                    style={{display: 'flex', justifyContent: 'space-between'}}
                                >
                                    <div>
                                        <Input
                                            value={
                                                userState.user && userState.user.wechat_id !== ''
                                                    ? t('AlreadyBind')
                                                    : t('Not YetBind')
                                            }
                                            readonly={true}
                                        ></Input>
                                    </div>
                                    <div>
                                        <Button
                                            disabled={
                                                (userState.user && userState.user.wechat_id !== '') ||
                                                !status.wechat_login
                                            }
                                        >
                                            {status.wechat_login ? t('Bind') : t('Not YetEnable')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div style={{marginTop: 10}}>
                                <Typography.Text strong>{t('GitHub')}</Typography.Text>
                                <div
                                    style={{display: 'flex', justifyContent: 'space-between'}}
                                >
                                    <div>
                                        <Input
                                            value={
                                                userState.user && userState.user.github_id !== ''
                                                    ? userState.user.github_id
                                                    : t('Not YetBind')
                                            }
                                            readonly={true}
                                        ></Input>
                                    </div>
                                    <div>
                                        <Button
                                            onClick={() => {
                                                onGitHubOAuthClicked(status.github_client_id);
                                            }}
                                            disabled={
                                                (userState.user && userState.user.github_id !== '') ||
                                                !status.github_oauth
                                            }
                                        >
                                            {status.github_oauth ? t('Bind') : t('Not YetEnable')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div style={{marginTop: 10}}>
                                <Typography.Text strong>{t('Telegram')}</Typography.Text>
                                <div
                                    style={{display: 'flex', justifyContent: 'space-between'}}
                                >
                                    <div>
                                        <Input
                                            value={
                                                userState.user && userState.user.telegram_id !== ''
                                                    ? userState.user.telegram_id
                                                    : t('Not YetBind')
                                            }
                                            readonly={true}
                                        ></Input>
                                    </div>
                                    <div>
                                        {status.telegram_oauth ? (
                                            userState.user.telegram_id !== '' ? (
                                                <Button disabled={true}>{t('AlreadyBind')}</Button>
                                            ) : (
                                                <TelegramLoginButton
                                                    dataAuthUrl='/api/oauth/telegram/bind'
                                                    botName={status.telegram_bot_name}
                                                />
                                            )
                                        ) : (
                                            <Button disabled={true}>{t('Not YetEnable')}</Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div style={{marginTop: 10}}>
                                <Typography.Text strong>{t('LinuxDO')}</Typography.Text>
                                <div
                                    style={{display: 'flex', justifyContent: 'space-between'}}
                                >
                                    <div>
                                        <Input
                                            value={
                                                userState.user && userState.user.linux_do_id !== ''
                                                    ? userState.user.linux_do_id
                                                    : t('Not YetBind')
                                            }
                                            readonly={true}
                                        ></Input>
                                    </div>
                                    <div>
                                        <Button
                                            onClick={() => {
                                                onLinuxDOOAuthClicked(status.linuxdo_client_id);
                                            }}
                                            disabled={
                                                (userState.user && userState.user.linux_do_id !== '') ||
                                                !status.linuxdo_oauth
                                            }
                                        >
                                            {status.linuxdo_oauth ? t('Bind') : t('Not YetEnable')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div style={{marginTop: 10}}>
                                <Space>
                                    <Button onClick={generateAccessToken}>
                                        {t('GenerateSystemVisitToken')}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowChangePasswordModal(true);
                                        }}
                                    >
                                        {t('ModifyPassword')}
                                    </Button>
                                    <Button
                                        type={'danger'}
                                        onClick={() => {
                                            setShowAccountDeleteModal(true);
                                        }}
                                    >
                                        {t('DeleteItemsPersonAllow new users')}
                                    </Button>
                                </Space>

                                {systemToken && (
                                    <Input
                                        readOnly
                                        value={systemToken}
                                        onClick={handleSystemTokenClick}
                                        style={{marginTop: '10px'}}
                                    />
                                )}
                                {status.wechat_login && (
                                    <Button
                                        onClick={() => {
                                            setShowWeChatBindModal(true);
                                        }}
                                    >
                                        {t('BindWeChatAccount')}
                                    </Button>
                                )}
                                <Modal
                                    onCancel={() => setShowWeChatBindModal(false)}
                                    // onOpen={() => setShowWeChatBindModal(true)}
                                    visible={showWeChatBindModal}
                                    size={'small'}
                                >
                                    <Image src={status.wechat_qrcode}/>
                                    <div style={{textAlign: 'center'}}>
                                        <p>
                                            WeChatScanCodeFollow the public account，Input「Verification code」ObtainVerification code（ThreeMinuteWithinConfirm reset.）
                                        </p>
                                    </div>
                                    <Input
                                        placeholder='Verification code'
                                        name='wechat_verification_code'
                                        value={inputs.wechat_verification_code}
                                        onChange={(v) =>
                                            handleInputChange('wechat_verification_code', v)
                                        }
                                    />
                                    <Button color='' fluid size='large' onClick={bindWeChat}>
                                        {t('Bind')}
                                    </Button>
                                </Modal>
                            </div>
                        </Card>
                        <Modal
                            onCancel={() => setShowEmailBindModal(false)}
                            // onOpen={() => setShowEmailBindModal(true)}
                            onOk={bindEmail}
                            visible={showEmailBindModal}
                            size={'small'}
                            centered={true}
                            maskClosable={false}
                        >
                            <Typography.Title heading={6}>{t('BindEmailAddress')}</Typography.Title>
                            <div
                                style={{
                                    marginTop: 20,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Input
                                    fluid
                                    placeholder='InputEmailAddress'
                                    onChange={(value) => handleInputChange('email', value)}
                                    name='email'
                                    type='email'
                                />
                                <Button
                                    onClick={sendVerificationCode}
                                    disabled={disableButton || loading}
                                >
                                    {disableButton ? `ResetNewSend (${countdown})` : 'ObtainVerification code'}
                                </Button>
                            </div>
                            <div style={{marginTop: 10}}>
                                <Input
                                    fluid
                                    placeholder='Verification code'
                                    name='email_verification_code'
                                    value={inputs.email_verification_code}
                                    onChange={(value) =>
                                        handleInputChange('email_verification_code', value)
                                    }
                                />
                            </div>
                            {turnstileEnabled ? (
                                <Turnstile
                                    sitekey={turnstileSiteKey}
                                    onVerify={(token) => {
                                        setTurnstileToken(token);
                                    }}
                                />
                            ) : (
                                <></>
                            )}
                        </Modal>
                        <Modal
                            onCancel={() => setShowAccountDeleteModal(false)}
                            visible={showAccountDeleteModal}
                            size={'small'}
                            centered={true}
                            onOk={deleteAccount}
                        >
                            <div style={{marginTop: 20}}>
                                <Banner
                                    type='danger'
                                    description='You AreDeleteSelfTheAccountUser，ConvertClearAre overwrite operationsNumberDataThe name is not emptyNotCanRecover'
                                    closeIcon={null}
                                />
                            </div>
                            <div style={{marginTop: 20}}>
                                <Input
                                    placeholder={`InputYouTheAllow new usersName ${userState?.user?.username} UsedConfirmDelete`}
                                    name='self_account_deletion_confirmation'
                                    value={inputs.self_account_deletion_confirmation}
                                    onChange={(value) =>
                                        handleInputChange(
                                            'self_account_deletion_confirmation',
                                            value,
                                        )
                                    }
                                />
                                {turnstileEnabled ? (
                                    <Turnstile
                                        sitekey={turnstileSiteKey}
                                        onVerify={(token) => {
                                            setTurnstileToken(token);
                                        }}
                                    />
                                ) : (
                                    <></>
                                )}
                            </div>
                        </Modal>
                        <Modal
                            onCancel={() => setShowChangePasswordModal(false)}
                            visible={showChangePasswordModal}
                            size={'small'}
                            centered={true}
                            onOk={changePassword}
                        >
                            <div style={{marginTop: 20}}>
                                <Input
                                    name='set_new_password'
                                    placeholder={t('NewPassword')}
                                    value={inputs.set_new_password}
                                    onChange={(value) =>
                                        handleInputChange('set_new_password', value)
                                    }
                                />
                                <Input
                                    style={{marginTop: 20}}
                                    name='set_new_password_confirmation'
                                    placeholder={t('ConfirmNewPassword')}
                                    value={inputs.set_new_password_confirmation}
                                    onChange={(value) =>
                                        handleInputChange('set_new_password_confirmation', value)
                                    }
                                />
                                {turnstileEnabled ? (
                                    <Turnstile
                                        sitekey={turnstileSiteKey}
                                        onVerify={(token) => {
                                            setTurnstileToken(token);
                                        }}
                                    />
                                ) : (
                                    <></>
                                )}
                            </div>
                        </Modal>
                    </div>
                </Layout.Content>
            </Layout>
        </div>
    );
};

export default PersonalSetting;
