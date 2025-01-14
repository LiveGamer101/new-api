import React, { useContext, useEffect, useState } from 'react';
import { Dimmer, Loader, Segment } from 'semantic-ui-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API, showError, showSuccess, updateAPI } from '../helpers';
import { UserContext } from '../context/User';
import { setUserData } from '../helpers/data.js';

const OAuth2Callback = (props) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [userState, userDispatch] = useContext(UserContext);
    const [prompt, setPrompt] = useState('Processing...');
    const [processing, setProcessing] = useState(true);

    let navigate = useNavigate();

    const sendCode = async (code, state, count) => {
        const res = await API.get(`/api/oauth/${props.type}?code=${code}&state=${state}`);
        const { success, message, data } = res.data;
        if (success) {
            if (message === 'bind') {
                showSuccess('BindSuccess！');
                navigate('/setting');
            } else {
                userDispatch({ type: 'login', payload: data });
                localStorage.setItem('user', JSON.stringify(data));
                setUserData(data);
                updateAPI()
                showSuccess('LoginSuccess！');
                navigate('/token');
            }
        } else {
            showError(message);
            if (count === 0) {
                setPrompt(`OperationFailed，Redirect toLoginIn the interface...`);
                navigate('/setting'); // in case this is failed to bind GitHub
                return;
            }
            count++;
            setPrompt(`AppearedError，The ${count} Retrying...`);
            await new Promise((resolve) => setTimeout(resolve, count * 2000));
            await sendCode(code, state, count);
        }
    };

    useEffect(() => {
        let code = searchParams.get('code');
        let state = searchParams.get('state');
        sendCode(code, state, 0).then();
    }, []);

    return (
        <Segment style={{ minHeight: '300px' }}>
            <Dimmer active inverted>
                <Loader size='large'>{prompt}</Loader>
            </Dimmer>
        </Segment>
    );
};

export default OAuth2Callback;
