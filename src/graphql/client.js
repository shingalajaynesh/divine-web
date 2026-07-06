import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_API_URL || 'http://localhost:4000/graphql',
});

// Shared reference to resolve Clerk token getter function asynchronously
let getClerkTokenFn = null;

export const setClerkTokenProvider = (fn) => {
  getClerkTokenFn = fn;
};

// Generate/retrieve a persistent device ID
let deviceId = localStorage.getItem('divine_device_id');
if (!deviceId) {
  deviceId = window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
  localStorage.setItem('divine_device_id', deviceId);
}

// Generate device name helper
const getDeviceName = () => {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
};

const deviceName = getDeviceName();

const authLink = setContext(async (_, { headers }) => {
  let token = null;
  if (getClerkTokenFn) {
    token = await getClerkTokenFn();
  } else if (window.Clerk?.session) {
    token = await window.Clerk.session.getToken();
  }

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'x-device-id': deviceId,
      'x-device-name': deviceName,
      'x-device-type': 'web',
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
export default client;
