import 'core-js/es/string/starts-with';
import 'core-js/es/array/from';
import 'core-js/es/typed-array/slice';
import 'core-js/es/array/includes';
import 'core-js/es/string/includes';
import 'promise-polyfill/src/polyfill';
import 'fast-text-encoding';
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only';

import Auth0Client from './Auth0Client';
import * as ClientStorage from './storage';
import { Auth0ClientOptions } from './global';
import { CACHE_LOCATION_MEMORY } from './constants';

import './global';
import { getUniqueScopes } from './utils';

export * from './global';

export default async function createAuth0Client(options: Auth0ClientOptions) {
  if (options.useRefreshTokens) {
    options.scope = getUniqueScopes(options.scope, 'offline_access');
  }

  try {
    const { scope } = await navigator.serviceWorker.register(
      options.serviceWorkerPath || '/sw.js'
    );
    console.log('ServiceWorker registration successful with scope: ', scope);
  } catch (error) {
    console.log('ServiceWorker registration failed: ', error);
  }

  const auth0 = new Auth0Client(options);

  if (
    auth0.cacheLocation === CACHE_LOCATION_MEMORY &&
    !ClientStorage.get('auth0.is.authenticated')
  ) {
    return auth0;
  }

  return auth0;
}

export { Auth0Client };
