const URI = 'http://localhost:3000?automated';

const DOMAIN = 'brucke.auth0.com';
const CLIENT_ID = 'wLSIP47wM39wKdDmOj6Zb5eSEw3JVhVp';
const AUDIENCE = '';
const USE_CONSTRUCTOR = true;

const USERNAME = 'johnfoo+integration@gmail.com';
const PASSWORD = '1234';

const BTN_LOGIN_REDIRECT = '#login_redirect';
const BTN_LOGIN_REDIRECT_CALLBACK = '#handle_redirect_callback';
const BTN_GET_ACCESS_TOKEN = '[data-cy=get-token]';

const LOCK_INPUT_USERNAME = '[name=username]';
const LOCK_INPUT_PASSWORD = '[name=password]';
const LOCK_BUTTON_SUBMIT = '.auth0-lock-submit';

const CONTAINER_IS_AUTHENTICATED = '#is-authenticated';
const CONTAINER_ACCESS_TOKEN = '[data-cy=access-token]';

const SETTINGS_LOCAL_STORAGE_KEY = 'spa-playground-data';

const getPermutations = (nums) => {
  const combinations = [];
  for (let i = 0; i < 1 << nums; i++) {
    let boolArr = [];
    for (let j = nums - 1; j >= 0; j--) {
      boolArr.push(Boolean(i & (1 << j)));
    }
    combinations.push(boolArr);
  }
  return combinations;
};

const init = async (browser, key, config) => {
  browser.execute(
    (key, value) => {
      localStorage.setItem(key, value);
      startApp();
    },
    key,
    JSON.stringify(config)
  );
};

const expectIsAuthenticated = async (browser, isAuthenticated) => {
  const isAuthenticatedEl = await browser.$(CONTAINER_IS_AUTHENTICATED);
  const isAuthenticatedText = await isAuthenticatedEl.getText();
  console.log(isAuthenticatedText === 'true', isAuthenticated);
  expect(isAuthenticatedText === 'true').toEqual(isAuthenticated);
};

const expectAccessTokens = async (browser, numToken) => {
  const accessTokens = await browser.$$(CONTAINER_ACCESS_TOKEN);
  const displayed = await accessTokens[numToken].isDisplayed();
  expect(displayed).toBeTruthy();
  const token = await accessTokens[numToken].getText();
  expect(token).toMatch(/.+/); // TODO Better token check
};

describe('basic test', () => {
  getPermutations(3).forEach(
    ([useLocalStorage, useRefreshTokens, useCache]) => {
      it(`should login and get access token for useLocalStorage: ${useLocalStorage}, useRefreshTokens: ${useRefreshTokens}, useCache: ${useCache}`, async () => {
        await browser.reloadSession();
        const settings = {
          domain: DOMAIN,
          clientId: CLIENT_ID,
          useConstructor: USE_CONSTRUCTOR,
          audience: AUDIENCE,
          redirectUri: URI,
          useLocalStorage,
          useRefreshTokens,
          useCache,
        };
        await browser.url(URI);
        await init(browser, SETTINGS_LOCAL_STORAGE_KEY, settings);
        await expectIsAuthenticated(browser, false);
        await (await browser.$(BTN_LOGIN_REDIRECT)).click();
        // on auth0
        const username = await browser.$(LOCK_INPUT_USERNAME);
        await username.waitForClickable();
        await username.setValue(USERNAME);
        await (await browser.$(LOCK_INPUT_PASSWORD)).setValue(PASSWORD);
        await (await browser.$(LOCK_BUTTON_SUBMIT)).click();
        // on playground
        await browser.pause(2000); // TODO better waiter
        await init(browser, SETTINGS_LOCAL_STORAGE_KEY, settings);
        await expectIsAuthenticated(browser, false);
        await (await browser.$(BTN_LOGIN_REDIRECT_CALLBACK)).click();
        await browser.pause(5000); // TODO better waiter
        await expectIsAuthenticated(browser, true);
        await expectAccessTokens(browser, 0);
        await (await browser.$(BTN_GET_ACCESS_TOKEN)).click();
        await browser.pause(2000); // TODO better waiter
        await expectAccessTokens(browser, 1);
      });
    }
  );
});
