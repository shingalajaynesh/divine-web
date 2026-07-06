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
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
export default client;
