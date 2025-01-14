import React, { lazy, Suspense, useContext, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { useTheme } from './context/Theme';
import { applyTheme } from './theme';

// Components
import Loading from './components/Loading';
import { PrivateRoute } from './components/PrivateRoute';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import NotFound from './pages/NotFound';
import PasswordResetForm from './components/PasswordResetForm';
import PasswordResetConfirm from './components/PasswordResetConfirm';
import OAuth2Callback from "./components/OAuth2Callback.js";
import HeaderBar from './components/HeaderBar';

// Pages
import User from './pages/User';
import Setting from './pages/Setting';
import EditUser from './pages/User/EditUser';
import Channel from './pages/Channel';
import Token from './pages/Token';
import EditChannel from './pages/Channel/EditChannel';
import Redemption from './pages/Redemption';
import TopUp from './pages/TopUp';
import Log from './pages/Log';
import Chat from './pages/Chat';
import Chat2Link from './pages/Chat2Link';
import Midjourney from './pages/Midjourney';
import Pricing from './pages/Pricing';
import Task from "./pages/Task";
import Playground from './pages/Playground/Playground';

// Context and Helpers
import { UserContext } from './context/User';
import { StatusContext } from './context/Status';
import { setStatusData } from './helpers/data';
import { API, showError, getLogo, getSystemName } from './helpers';

// Lazy loaded components
const Home = lazy(() => import('./pages/Home'));
const Detail = lazy(() => import('./pages/Detail'));
const About = lazy(() => import('./pages/About'));

function App() {
  const theme = useTheme();
  const { t } = useTranslation();

  // Initialize theme
  useEffect(() => {
    applyTheme(theme === 'dark');
  }, [theme]);

  return (
    <Layout style={{
      minHeight: '100vh',
      background: 'var(--semi-color-bg-0)',
      transition: 'background-color 0.3s ease'
    }}>
      <Layout.Header>
        <div style={{ 
          position: 'fixed',
          top: 0,
          width: '100%',
          zIndex: 999,
          background: 'var(--semi-color-bg-0)'
        }}>
          <HeaderBar />
        </div>
      </Layout.Header>
      <Layout.Content style={{ 
        padding: '24px',
        maxWidth: '1200px',
        width: '100%',
        margin: '64px auto 0',
        transition: 'all 0.3s ease'
      }}>
        <Routes>
          <Route
            path='/'
            element={
              <Suspense fallback={<Loading />}>
                <Home />
              </Suspense>
            }
          />
          <Route
            path='/channel'
            element={
              <PrivateRoute>
                <Channel />
              </PrivateRoute>
            }
          />
          <Route
            path='/channel/edit/:id'
            element={
              <Suspense fallback={<Loading />}>
                <EditChannel />
              </Suspense>
            }
          />
          <Route
            path='/channel/add'
            element={
              <Suspense fallback={<Loading />}>
                <EditChannel />
              </Suspense>
            }
          />
          <Route
            path='/token'
            element={
              <PrivateRoute>
                <Token />
              </PrivateRoute>
            }
          />
          <Route
            path='/playground'
            element={
              <PrivateRoute>
                <Playground />
              </PrivateRoute>
            }
          />
          <Route
            path='/redemption'
            element={
              <PrivateRoute>
                <Redemption />
              </PrivateRoute>
            }
          />
          <Route
            path='/user'
            element={
              <PrivateRoute>
                <User />
              </PrivateRoute>
            }
          />
          <Route
            path='/user/edit/:id'
            element={
              <Suspense fallback={<Loading />}>
                <EditUser />
              </Suspense>
            }
          />
          <Route
            path='/user/edit'
            element={
              <Suspense fallback={<Loading />}>
                <EditUser />
              </Suspense>
            }
          />
          <Route
            path='/user/reset'
            element={
              <Suspense fallback={<Loading />}>
                <PasswordResetConfirm />
              </Suspense>
            }
          />
          <Route
            path='/login'
            element={
              <Suspense fallback={<Loading />}>
                <LoginForm />
              </Suspense>
            }
          />
          <Route
            path='/register'
            element={
              <Suspense fallback={<Loading />}>
                <RegisterForm />
              </Suspense>
            }
          />
          <Route
            path='/reset'
            element={
              <Suspense fallback={<Loading />}>
                <PasswordResetForm />
              </Suspense>
            }
          />
          <Route
            path='/oauth/github'
            element={
              <Suspense fallback={<Loading />}>
                <OAuth2Callback type='github' />
              </Suspense>
            }
          />
          <Route
            path='/oauth/linuxdo'
            element={
              <Suspense fallback={<Loading />}>
                <OAuth2Callback type='linuxdo' />
              </Suspense>
            }
          />
          <Route
            path='/setting'
            element={
              <PrivateRoute>
                <Suspense fallback={<Loading />}>
                  <Setting />
                </Suspense>
              </PrivateRoute>
            }
          />
          <Route
            path='/topup'
            element={
              <PrivateRoute>
                <Suspense fallback={<Loading />}>
                  <TopUp />
                </Suspense>
              </PrivateRoute>
            }
          />
          <Route
            path='/log'
            element={
              <PrivateRoute>
                <Log />
              </PrivateRoute>
            }
          />
          <Route
            path='/detail'
            element={
              <PrivateRoute>
                <Suspense fallback={<Loading />}>
                  <Detail />
                </Suspense>
              </PrivateRoute>
            }
          />
          <Route
            path='/midjourney'
            element={
              <PrivateRoute>
                <Suspense fallback={<Loading />}>
                  <Midjourney />
                </Suspense>
              </PrivateRoute>
            }
          />
          <Route
            path='/task'
            element={
              <PrivateRoute>
                <Suspense fallback={<Loading />}>
                  <Task />
                </Suspense>
              </PrivateRoute>
            }
          />
          <Route
            path='/pricing'
            element={
              <Suspense fallback={<Loading />}>
                <Pricing />
              </Suspense>
            }
          />
          <Route
            path='/about'
            element={
              <Suspense fallback={<Loading />}>
                <About />
              </Suspense>
            }
          />
          <Route
            path='/chat/:id?'
            element={
              <Suspense fallback={<Loading />}>
                <Chat />
              </Suspense>
            }
          />
          <Route
            path='/chat2link'
            element={
              <PrivateRoute>
                <Suspense fallback={<Loading />}>
                  <Chat2Link />
                </Suspense>
              </PrivateRoute>
            }
          />
          <Route path='*' element={<NotFound />} />
        </Routes>
      </Layout.Content>
    </Layout>
  );
}

export default App;
