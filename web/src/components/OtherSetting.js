import React, { useEffect, useRef, useState } from 'react';
import { Banner, Button, Col, Form, Row } from '@douyinfe/semi-ui';
import { API, showError, showSuccess } from '../helpers';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';

const OtherSetting = () => {
  const { t } = useTranslation();
  let [inputs, setInputs] = useState({
    Notice: '',
    SystemName: '',
    Logo: '',
    Footer: '',
    About: '',
    HomePageContent: '',
  });
  let [loading, setLoading] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    tag_name: '',
    content: '',
  });

  const updateOption = async (key, value) => {
    setLoading(true);
    const res = await API.put('/api/option/', {
      key,
      value,
    });
    const { success, message } = res.data;
    if (success) {
      setInputs((inputs) => ({ ...inputs, [key]: value }));
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const [loadingInput, setLoadingInput] = useState({
    Notice: false,
    SystemName: false,
    Logo: false,
    HomePageContent: false,
    About: false,
    Footer: false,
  });
  const handleInputChange = async (value, e) => {
    const name = e.target.id;
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  // ThroughUseSettings
  const formAPISettingGeneral = useRef();
  // ThroughUseSettings - Notice
  const submitNotice = async () => {
    try {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Notice: true }));
      await updateOption('Notice', inputs.Notice);
      showSuccess(t('Announcement Updated'));
    } catch (error) {
      console.error(t('Announcement UpdateFailed'), error);
      showError(t('Announcement UpdateFailed'));
    } finally {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Notice: false }));
    }
  };
  // PersonalizationSettings
  const formAPIPersonalization = useRef();
  //  PersonalizationSettings - SystemName
  const submitSystemName = async () => {
    try {
      setLoadingInput((loadingInput) => ({
        ...loadingInput,
        SystemName: true,
      }));
      await updateOption('SystemName', inputs.SystemName);
      showSuccess(t('SystemNameUpdated'));
    } catch (error) {
      console.error(t('SystemNameUpdateFailed'), error);
      showError(t('SystemNameUpdateFailed'));
    } finally {
      setLoadingInput((loadingInput) => ({
        ...loadingInput,
        SystemName: false,
      }));
    }
  };

  // PersonalizationSettings - Logo
  const submitLogo = async () => {
    try {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Logo: true }));
      await updateOption('Logo', inputs.Logo);
      showSuccess('Logo Updated');
    } catch (error) {
      console.error('Logo UpdateFailed', error);
      showError('Logo UpdateFailed');
    } finally {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Logo: false }));
    }
  };
  // PersonalizationSettings - Homepage Content
  const submitOption = async (key) => {
    try {
      setLoadingInput((loadingInput) => ({
        ...loadingInput,
        HomePageContent: true,
      }));
      await updateOption(key, inputs[key]);
      showSuccess('Homepage ContentUpdated');
    } catch (error) {
      console.error('Homepage ContentUpdateFailed', error);
      showError('Homepage ContentUpdateFailed');
    } finally {
      setLoadingInput((loadingInput) => ({
        ...loadingInput,
        HomePageContent: false,
      }));
    }
  };
  // PersonalizationSettings - About
  const submitAbout = async () => {
    try {
      setLoadingInput((loadingInput) => ({ ...loadingInput, About: true }));
      await updateOption('About', inputs.About);
      showSuccess('AboutAny webpage asUpdated');
    } catch (error) {
      console.error('AboutAny webpage asUpdateFailed', error);
      showError('AboutAny webpage asUpdateFailed');
    } finally {
      setLoadingInput((loadingInput) => ({ ...loadingInput, About: false }));
    }
  };
  // PersonalizationSettings - Footer
  const submitFooter = async () => {
    try {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Footer: true }));
      await updateOption('Footer', inputs.Footer);
      showSuccess('FooterAny webpage asUpdated');
    } catch (error) {
      console.error('FooterAny webpage asUpdateFailed', error);
      showError('FooterAny webpage asUpdateFailed');
    } finally {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Footer: false }));
    }
  };

  const openGitHubRelease = () => {
    window.location = 'https://github.com/songquanpeng/one-api/releases/latest';
  };

  const checkUpdate = async () => {
    const res = await API.get(
      'https://api.github.com/repos/songquanpeng/one-api/releases/latest',
    );
    const { tag_name, body } = res.data;
    if (tag_name === process.env.REACT_APP_VERSION) {
      showSuccess(`Already the Latest Version：${tag_name}`);
    } else {
      setUpdateData({
        tag_name: tag_name,
        content: marked.parse(body),
      });
      setShowUpdateModal(true);
    }
  };
  const getOptions = async () => {
    const res = await API.get('/api/option/');
    const { success, message, data } = res.data;
    if (success) {
      let newInputs = {};
      data.forEach((item) => {
        if (item.key in inputs) {
          newInputs[item.key] = item.value;
        }
      });
      setInputs(newInputs);
      formAPISettingGeneral.current.setValues(newInputs);
      formAPIPersonalization.current.setValues(newInputs);
    } else {
      showError(message);
    }
  };

  useEffect(() => {
    getOptions();
  }, []);

  return (
    <Row>
      <Col span={24}>
        {/* ThroughUseSettings */}
        <Form
          values={inputs}
          getFormApi={(formAPI) => (formAPISettingGeneral.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={t('ThroughUseSettings')}>
            <Form.TextArea
              label={t('Announcement')}
              placeholder={t('Enter hereNewTheAnnouncementAny webpage as，Support Markdown & HTML Code')}
              field={'Notice'}
              onChange={handleInputChange}
              style={{ fontFamily: 'JetBrains Mono, Consolas' }}
              autosize={{ minRows: 6, maxRows: 12 }}
            />
            <Button onClick={submitNotice} loading={loadingInput['Notice']}>
              {t('SettingsAnnouncement')}
            </Button>
          </Form.Section>
        </Form>
        {/* PersonalizationSettings */}
        <Form
          values={inputs}
          getFormApi={(formAPI) => (formAPIPersonalization.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={t('PersonalizationSettings')}>
            <Form.Input
              label={t('SystemName')}
              placeholder={t('Enter hereSystemName')}
              field={'SystemName'}
              onChange={handleInputChange}
            />
            <Button
              onClick={submitSystemName}
              loading={loadingInput['SystemName']}
            >
              {t('SettingsSystemName')}
            </Button>
            <Form.Input
              label={t('Logo ImageAddress')}
              placeholder={t('Enter here Logo ImageAddress')}
              field={'Logo'}
              onChange={handleInputChange}
            />
            <Button onClick={submitLogo} loading={loadingInput['Logo']}>
              {t('Settings Logo')}
            </Button>
            <Form.TextArea
              label={t('Homepage Content')}
              placeholder={t('Enter hereHomepage Content，Support Markdown & HTML Code，SettingsAfter the homepageStatusInfoWill no longer be displayed。If the input is a link，ThenMeetingUseUseThisUnit dollar amountOperateFor iframe The src Attribute，This allows youSettingsAny webpageOperateForHomepage')}
              field={'HomePageContent'}
              onChange={handleInputChange}
              style={{ fontFamily: 'JetBrains Mono, Consolas' }}
              autosize={{ minRows: 6, maxRows: 12 }}
            />
            <Button
              onClick={() => submitOption('HomePageContent')}
              loading={loadingInput['HomePageContent']}
            >
              {t('SettingsHomepage Content')}
            </Button>
            <Form.TextArea
              label={t('About')}
              placeholder={t('Enter hereNewTheAboutAny webpage as，Support Markdown & HTML Code。If the input is a link，ThenMeetingUseUseThisUnit dollar amountOperateFor iframe The src Attribute，This allows youSettingsAny webpageOperateForAboutRemove')}
              field={'About'}
              onChange={handleInputChange}
              style={{ fontFamily: 'JetBrains Mono, Consolas' }}
              autosize={{ minRows: 6, maxRows: 12 }}
            />
            <Button onClick={submitAbout} loading={loadingInput['About']}>
              {t('SettingsAbout')}
            </Button>
            {/*  */}
            <Banner
              fullMode={false}
              type='info'
              description={t('Authorization must be obtained first to remove One API TheCopyright identification must first obtain authorization，Project maintenance requires significant effort，If this project is meaningful to you，PleaseActiveSupportThis project')}
              closeIcon={null}
              style={{ marginTop: 15 }}
            />
            <Form.Input
              label={t('Footer')}
              placeholder={t('Enter hereNewTheFooter，LeaveEmptyThenUseUseDefaultFooter，Support HTML Code')}
              field={'Footer'}
              onChange={handleInputChange}
            />
            <Button onClick={submitFooter} loading={loadingInput['Footer']}>
              {t('SettingsFooter')}
            </Button>
          </Form.Section>
        </Form>
      </Col>
      {/*<Modal*/}
      {/*  onClose={() => setShowUpdateModal(false)}*/}
      {/*  onOpen={() => setShowUpdateModal(true)}*/}
      {/*  open={showUpdateModal}*/}
      {/*>*/}
      {/*  <Modal.Header>New version：{updateData.tag_name}</Modal.Header>*/}
      {/*  <Modal.Content>*/}
      {/*    <Modal.Description>*/}
      {/*      <div dangerouslySetInnerHTML={{ __html: updateData.content }}></div>*/}
      {/*    </Modal.Description>*/}
      {/*  </Modal.Content>*/}
      {/*  <Modal.Actions>*/}
      {/*    <Button onClick={() => setShowUpdateModal(false)}>Close</Button>*/}
      {/*    <Button*/}
      {/*      content='Details'*/}
      {/*      onClick={() => {*/}
      {/*        setShowUpdateModal(false);*/}
      {/*        openGitHubRelease();*/}
      {/*      }}*/}
      {/*    />*/}
      {/*  </Modal.Actions>*/}
      {/*</Modal>*/}
    </Row>
  );
};

export default OtherSetting;
