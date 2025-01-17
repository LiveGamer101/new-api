import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/User';
import { useSetTheme, useTheme } from '../context/Theme';
import { useTranslation } from 'react-i18next';

import { API, getLogo, getSystemName, isMobile, showSuccess } from '../helpers';
import '../index.css';

import fireworks from 'react-fireworks';

import {
  IconClose,
  IconHelpCircle,
  IconHome,
  IconHomeStroked, IconIndentLeft,
  IconComment,
  IconKey, IconMenu,
  IconNoteMoneyStroked,
  IconPriceTag,
  IconUser,
  IconLanguage
} from '@douyinfe/semi-icons';
import { Avatar, Button, Dropdown, Layout, Nav, Switch } from '@douyinfe/semi-ui';
import { stringToColor } from '../helpers/render';
import Text from '@douyinfe/semi-ui/lib/es/typography/text';
import { StyleContext } from '../context/Style/index.js';

const HeaderBar = () => {
  const { t, i18n } = useTranslation();
  const [userState, userDispatch] = useContext(UserContext);
  const [styleState, styleDispatch] = useContext(StyleContext);
  let navigate = useNavigate();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const systemName = getSystemName();
  const logo = getLogo();
  const currentDate = new Date();
  const isNewYear = (currentDate.getMonth() === 0 && currentDate.getDate() === 1);

  const navItems = [
    {
      itemKey: 'home',
      text: t('Home'),
    },
    {
      itemKey: 'pricing',
      text: t('Pricing'),
    },
    {
      itemKey: 'about',
      text: t('About'),
    }
  ];

  async function logout() {
    await API.get('/api/user/logout');
    showSuccess(t('Logged out successfully!'));
    userDispatch({ type: 'logout' });
    localStorage.removeItem('user');
    navigate('/login');
  }

  const handleNewYearClick = () => {
    fireworks.init('root', {});
    fireworks.start();
    setTimeout(() => {
      fireworks.stop();
      setTimeout(() => {
        window.location.reload();
      }, 10000);
    }, 3000);
  };

  const theme = useTheme();
  const setTheme = useSetTheme();

  useEffect(() => {
    if (theme === 'dark') {
      document.body.setAttribute('theme-mode', 'dark');
    } else {
      document.body.removeAttribute('theme-mode');
    }
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.contentWindow.postMessage({ themeMode: theme }, '*');
    }
  }, [theme]);

  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setCurrentLang(lng);
      const iframe = document.querySelector('iframe');
      if (iframe) {
        iframe.contentWindow.postMessage({ lang: lng }, '*');
      }
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div style={{ width: '100%' }}>
      <Nav
        className={'topnav'}
        mode={'horizontal'}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <Nav.Header style={{ marginRight: '24px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src={logo} alt={systemName} style={{ height: '32px' }} />
          </Link>
        </Nav.Header>
        
        {navItems.map(item => (
          <Nav.Item
            key={item.itemKey}
            itemKey={item.itemKey}
          >
            <Link
              to={item.itemKey === 'home' ? '/' : `/${item.itemKey}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              {item.text}
            </Link>
          </Nav.Item>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          {isNewYear && (
            <Dropdown
              position='bottomRight'
              render={
                <Dropdown.Menu>
                  <Dropdown.Item onClick={handleNewYearClick}>
                    Happy New Year!!!
                  </Dropdown.Item>
                </Dropdown.Menu>
              }
            >
              <Nav.Item itemKey={'new-year'} text={'🎉'} />
            </Dropdown>
          )}
          <Switch
            checkedText='🌞'
            size={styleState.isMobile ? 'default' : 'large'}
            checked={theme === 'dark'}
            uncheckedText='🌙'
            onChange={(checked) => {
              setTheme(checked ? 'dark' : 'light');
            }}
            style={{
              marginRight: '12px',
              marginLeft: '12px',
              backgroundColor: theme === 'dark' ? 'var(--semi-color-primary)' : 'var(--semi-color-tertiary)',
            }}
          />
          <Dropdown
            position='bottomRight'
            render={
              <Dropdown.Menu>
                <Dropdown.Item
                  onClick={() => handleLanguageChange('zh')}
                  type={currentLang === 'zh' ? 'primary' : 'tertiary'}
                >
                  Chinese
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => handleLanguageChange('en')}
                  type={currentLang === 'en' ? 'primary' : 'tertiary'}
                >
                  English
                </Dropdown.Item>
              </Dropdown.Menu>
            }
          >
            <Nav.Item
              itemKey={'language'}
              icon={<IconLanguage />}
            />
          </Dropdown>
          {userState.user ? (
            <Dropdown
              position='bottomRight'
              trigger="hover"
              render={
                <Dropdown.Menu>
                  <Dropdown.Item
                    icon={<IconUser />}
                    onClick={() => navigate('/setting/personal')}
                  >
                    {t('Profile')}
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item
                    icon={<IconClose />}
                    type="danger"
                    onClick={logout}
                  >
                    {t('Logout')}
                  </Dropdown.Item>
                </Dropdown.Menu>
              }
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}>
                <Avatar
                  size='small'
                  color={stringToColor(userState.user.username)}
                >
                  {userState.user.username[0]}
                </Avatar>
                {!styleState.isMobile && (
                  <Text strong style={{ color: 'var(--semi-color-text-0)' }}>
                    {userState.user.username}
                  </Text>
                )}
              </div>
            </Dropdown>
          ) : (
            <>
              <Nav.Item
                itemKey={'login'}
                text={!styleState.isMobile ? t('Login') : null}
                icon={<IconUser />}
              />
              {!styleState.isMobile && (
                <Nav.Item
                  itemKey={'register'}
                  text={t('Register')}
                  icon={<IconKey />}
                />
              )}
            </>
          )}
        </div>
      </Nav>
    </div>
  );
};

export default HeaderBar;
