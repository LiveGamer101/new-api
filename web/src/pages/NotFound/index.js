import React from 'react';
import { Message } from 'semantic-ui-react';

const NotFound = () => (
  <>
    <Message negative>
      <Message.Header>RemoveNotExistence</Message.Header>
      <p>Please checkYouTheBrowserAddressIsNoCorrect</p>
    </Message>
  </>
);

export default NotFound;
