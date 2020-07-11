// @ts-check

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import '../assets/application.scss';
import faker from 'faker';
// @ts-ignore
import gon from 'gon';
import cookies from 'js-cookie';
// eslint-disable-next-line import/no-extraneous-dependencies
import io from 'socket.io-client';
import { configureStore } from '@reduxjs/toolkit';

import App from './components/App';
import { reducers, actions } from './slices';
import UserContext from './context';

export default () => {
  if (process.env.NODE_ENV !== 'production') {
    localStorage.debug = 'chat:*';
  }

  const { channels, messages, currentChannelId } = gon;

  const preloadedState = {
    channels,
    messages,
    currentChannelId,
    modalError: false,
    modalInfo: { channel: null, type: null },
  };

  const store = configureStore({ preloadedState, reducer: reducers });

  if (!cookies.get('username')) {
    const newUsername = faker.internet.userName();
    cookies.set('username', newUsername);
  }

  const socket = io();

  socket.on('newMessage', (data) => {
    store.dispatch(actions.messages.addMessage(data));
  });

  socket.on('newChannel', (data) => {
    store.dispatch(actions.channels.addChannel(data));
  });

  socket.on('removeChannel', (channel) => {
    const { id } = channel.data;

    store.dispatch(actions.channels.removeChannel(id));

    const state = store.getState();
    if (id === state.currentChannelId) {
      const [lastChannel] = state.channels.slice(-1);
      store.dispatch(actions.currentChannelId.switchChannel(lastChannel.id));
    }
  });

  socket.on('renameChannel', (data) => {
    store.dispatch(actions.channels.renameChannel(data));
  });

  const username = cookies.get('username');
  const mountNode = document.querySelector('.container');

  render(
    <Provider store={store}>
      <UserContext.Provider value={username}>
        <App />
      </UserContext.Provider>
    </Provider>,
    mountNode,
  );
};
