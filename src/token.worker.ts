import { MISSING_REFRESH_TOKEN_ERROR_MESSAGE } from './constants';

enum WorkerResponseType {
  MissingRefreshToken,
  FetchTimeout,
  NetworkFailure,
  FetchResponse
}

type WorkerResponse =
  | { type: WorkerResponseType.MissingRefreshToken }
  | { type: WorkerResponseType.FetchTimeout };

/**
 * @ignore
 */
let refreshToken;

/**
 * @ignore
 */
const wait: any = time => new Promise(resolve => setTimeout(resolve, time));

/**
 * @ignore
 */
const messageHandler = async ({
  data: { url, timeout, ...opts },
  ports: [port]
}) => {
  let json;
  try {
    const body = JSON.parse(opts.body);
    if (!body.refresh_token && body.grant_type === 'refresh_token') {
      if (!refreshToken) {
        port.postMessage({
          type: WorkerResponseType.MissingRefreshToken
        });
        return;
      }
      opts.body = JSON.stringify({ ...body, refresh_token: refreshToken });
    }

    const abortController = new AbortController();
    const { signal } = abortController;

    let response;
    try {
      response = await Promise.race([
        wait(timeout),
        fetch(url, { ...opts, signal })
      ]);
    } catch (error) {
      port.postMessage({
        type: WorkerResponseType.NetworkFailure
      });
      return;
    }

    if (!response) {
      // If the request times out, abort it and let `fetchWithTimeout` raise the error.
      abortController.abort();
      return;
    }

    json = await response.json();

    if (json.refresh_token) {
      refreshToken = json.refresh_token;
      delete json.refresh_token;
    } else {
      refreshToken = null;
    }

    port.postMessage({
      type: WorkerResponseType.FetchResponse,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      json
    });
  } catch (error) {
    port.postMessage({
      ok: false,
      error: error.message
    });
  }
};

// Don't run `addEventListener` in our tests (this is replaced in rollup)
/* istanbul ignore else  */
if (process.env.NODE_ENV === 'test') {
  module.exports = { messageHandler };
} else {
  // @ts-ignore
  addEventListener('message', messageHandler);
}
