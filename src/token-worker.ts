import { oauthToken } from './utils';
import { TokenTaskError } from './errors';

let refreshToken;

self.addEventListener('message', (e: MessageEvent) => {
  console.log('WEB WORKER', e);

  const endpointArgs = e.data.args;

  if (!refreshToken) {
    throw new TokenTaskError(
      'missing_refresh_token',
      'The refresh token was missing',
      e.data.id
    );
  }

  endpointArgs.refresh_token = refreshToken;

  oauthToken(endpointArgs).then(result => {
    const { refresh_token, ...rest } = result;

    refreshToken = refresh_token;

    self.postMessage({ id: e.data.id, payload: rest }, undefined);
  });
});
