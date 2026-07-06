import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import client from './graphql/client.js';
import './index.css';

// Keep-Alive Frontend Ping Loop
const startFrontendPing = () => {
  const graphqlUrl = import.meta.env.VITE_GRAPHQL_API_URL || 'http://localhost:4000/graphql';
  const pingUrl = graphqlUrl.replace(/\/graphql$/, '/ping');

  const doPing = () => {
    fetch(pingUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log('[Keep-Alive] Ping-Pong response:', data);
      })
      .catch((err) => {
        console.warn('[Keep-Alive] Ping to backend failed:', err.message);
      });
  };

  // Ping immediately, then every 5 minutes
  doPing();
  setInterval(doPing, 5 * 60 * 1000);
};

startFrontendPing();


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>
);
