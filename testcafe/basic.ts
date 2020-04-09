import { Selector } from 'testcafe';

fixture`Getting Started`.page`http://localhost:3000`;

const DOMAIN = 'brucke.auth0.com';
const CLIENT_ID = 'wLSIP47wM39wKdDmOj6Zb5eSEw3JVhVp';
const AUDIENCE = 'default';

const BTN_LOGIN_REDIRECT = '#login_redirect';
const BTN_LOGIN_REDIRECT_CALLBACK = '#handle_redirect_callback';
const BTN_GET_ACCESS_TOKEN = '[data-cy=get-token]';

const CONTAINER_IS_AUTHENTICATED = '#is-authenticated';
const CONTAINER_ACCESS_TOKEN = '[data-cy=access-token]';

const SETTINGS_LOCAL_STORAGE_KEY = 'spa-playground-data';

const foo = {
  domain: 'brucke.auth0.com',
  clientId: 'wLSIP47wM39wKdDmOj6Zb5eSEw3JVhVp',
  useLocalStorage: true,
  useRefreshTokens: true,
  useConstructor: false,
  useCache: true,
  audience: '',
};

test('My first test', async (t) => {
  // Test code
});
