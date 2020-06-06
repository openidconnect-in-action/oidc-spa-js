import {
  WorkerRequest,
  WorkerRequestType,
  WorkerResponse,
  WorkerResponseType
} from './global';

interface WorkerMessageEvent extends MessageEvent {
  data: WorkerRequest;
}

/**
 * @ignore
 */
let refreshToken;

/**
 * @ignore
 */
let abortController;

/**
 * @ignore
 */
const messageHandler = async ({ data, ports: [port] }: WorkerMessageEvent) => {
  const postBack = (msg: WorkerResponse) => port.postMessage(msg);

  switch (data.type) {
    case WorkerRequestType.AbortRequest:
      abortController && abortController.abort();
      postBack({
        type: WorkerResponseType.AbortResponse
      });
      return;
    case WorkerRequestType.GetToken:
      const bodyObj = JSON.parse(data.body);
      if (!bodyObj.refresh_token && bodyObj.grant_type === 'refresh_token') {
        if (!refreshToken) {
          postBack({ type: WorkerResponseType.MissingRefreshToken });
          return;
        }
        const body = JSON.stringify({
          ...bodyObj,
          refresh_token: refreshToken
        });
        abortController = new AbortController();
        const { signal } = abortController;
        const { headers, method } = data;
        let response;
        try {
          response = await fetch(data.url, { body, headers, method, signal });
        } catch (e) {
          postBack({
            type: WorkerResponseType.NetworkFailure
          });
          return;
        }
        const json = await response.json();
        refreshToken = json.refresh_token;
        delete json.refresh_token;
        postBack({
          type: WorkerResponseType.FetchResponse,
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          json
        });
      }
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
