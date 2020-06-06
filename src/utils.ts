import fetch from 'unfetch';

import {
  AuthenticationResult,
  GetTokenWorkerRequest,
  PopupConfigOptions,
  WorkerRequestType,
  WorkerResponse,
  WorkerResponseType
} from './global';

import {
  CLEANUP_IFRAME_TIMEOUT_IN_SECONDS,
  DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS
} from './constants';
import { TimeoutError } from './errors';

export const parseQueryResult = (queryString: string) => {
  if (queryString.indexOf('#') > -1) {
    queryString = queryString.substr(0, queryString.indexOf('#'));
  }

  let queryParams = queryString.split('&');

  let parsedQuery: any = {};
  queryParams.forEach(qp => {
    let [key, val] = qp.split('=');
    parsedQuery[key] = decodeURIComponent(val);
  });

  return <AuthenticationResult>{
    ...parsedQuery,
    expires_in: parseInt(parsedQuery.expires_in)
  };
};

export const runIframe = (
  authorizeUrl: string,
  eventOrigin: string,
  timeoutInSeconds: number = DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS
) => {
  return new Promise<AuthenticationResult>((res, rej) => {
    var iframe = window.document.createElement('iframe');
    iframe.setAttribute('width', '0');
    iframe.setAttribute('height', '0');
    iframe.style.display = 'none';

    const removeIframe = () => {
      if (window.document.body.contains(iframe)) {
        window.document.body.removeChild(iframe);
      }
    };

    const timeoutSetTimeoutId = setTimeout(() => {
      rej(new TimeoutError());
      removeIframe();
    }, timeoutInSeconds * 1000);

    const iframeEventHandler = function (e: MessageEvent) {
      if (e.origin != eventOrigin) return;
      if (!e.data || e.data.type !== 'authorization_response') return;
      const eventSource = e.source;
      if (eventSource) {
        (<any>eventSource).close();
      }
      e.data.response.error ? rej(e.data.response) : res(e.data.response);
      clearTimeout(timeoutSetTimeoutId);
      window.removeEventListener('message', iframeEventHandler, false);
      // Delay the removal of the iframe to prevent hanging loading status
      // in Chrome: https://github.com/auth0/auth0-spa-js/issues/240
      setTimeout(removeIframe, CLEANUP_IFRAME_TIMEOUT_IN_SECONDS * 1000);
    };
    window.addEventListener('message', iframeEventHandler, false);
    window.document.body.appendChild(iframe);
    iframe.setAttribute('src', authorizeUrl);
  });
};

const openPopup = url => {
  const width = 400;
  const height = 600;
  const left = window.screenX + (window.innerWidth - width) / 2;
  const top = window.screenY + (window.innerHeight - height) / 2;

  return window.open(
    url,
    'auth0:authorize:popup',
    `left=${left},top=${top},width=${width},height=${height},resizable,scrollbars=yes,status=1`
  );
};

export const runPopup = (authorizeUrl: string, config: PopupConfigOptions) => {
  let popup = config.popup;

  if (popup) {
    popup.location.href = authorizeUrl;
  } else {
    popup = openPopup(authorizeUrl);
  }

  if (!popup) {
    throw new Error('Could not open popup');
  }

  return new Promise<AuthenticationResult>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new TimeoutError());
    }, (config.timeoutInSeconds || DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS) * 1000);
    window.addEventListener('message', e => {
      if (!e.data || e.data.type !== 'authorization_response') {
        return;
      }
      clearTimeout(timeoutId);
      popup.close();
      if (e.data.response.error) {
        return reject(e.data.response);
      }
      resolve(e.data.response);
    });
  });
};

export const createRandomString = () => {
  const charset =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.';
  let random = '';
  const randomValues = Array.from(
    getCrypto().getRandomValues(new Uint8Array(43))
  );
  randomValues.forEach(v => (random += charset[v % charset.length]));
  return random;
};

export const encode = (value: string) => btoa(value);
export const decode = (value: string) => atob(value);

export const createQueryParams = (params: any) => {
  return Object.keys(params)
    .filter(k => typeof params[k] !== 'undefined')
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
    .join('&');
};

export const sha256 = async (s: string) => {
  const digestOp = getCryptoSubtle().digest(
    { name: 'SHA-256' },
    new TextEncoder().encode(s)
  );

  // msCrypto (IE11) uses the old spec, which is not Promise based
  // https://msdn.microsoft.com/en-us/expression/dn904640(v=vs.71)
  // Instead of returning a promise, it returns a CryptoOperation
  // with a result property in it.
  // As a result, the various events need to be handled in the event that we're
  // working in IE11 (hence the msCrypto check). These events just call resolve
  // or reject depending on their intention.
  if ((<any>window).msCrypto) {
    return new Promise((res, rej) => {
      digestOp.oncomplete = e => {
        res(e.target.result);
      };

      digestOp.onerror = (e: ErrorEvent) => {
        rej(e.error);
      };

      digestOp.onabort = () => {
        rej('The digest operation was aborted');
      };
    });
  }

  return await digestOp;
};

const urlEncodeB64 = (input: string) => {
  const b64Chars = { '+': '-', '/': '_', '=': '' };
  return input.replace(/[\+\/=]/g, (m: string) => b64Chars[m]);
};

// https://stackoverflow.com/questions/30106476/
const decodeB64 = input =>
  decodeURIComponent(
    atob(input)
      .split('')
      .map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );

export const urlDecodeB64 = (input: string) =>
  decodeB64(input.replace(/_/g, '/').replace(/-/g, '+'));

export const bufferToBase64UrlEncoded = input => {
  const ie11SafeInput = new Uint8Array(input);
  return urlEncodeB64(
    window.btoa(String.fromCharCode(...Array.from(ie11SafeInput)))
  );
};

const sendMessage = (
  message: GetTokenWorkerRequest,
  to
): Promise<WorkerResponse> =>
  new Promise(function (resolve, reject) {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = function (event) {
      // Only for fetch errors, as these get retried
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data);
      }
    };
    to.postMessage(message, [messageChannel.port2]);
  });

export const fetchWithWorker = async (
  url: string,
  opts: ResponseInit,
  timeout,
  onTimeout,
  worker
): Promise<WorkerResponse> => {
  if (worker) {
    onTimeout(() =>
      worker.postMessage({ type: WorkerRequestType.AbortRequest })
    );
    const response = await sendMessage({ url, timeout, ...opts }, worker);
    if (response.type === WorkerResponseType.NetworkFailure) {
      throw new Error('Network failure');
    }
    return response;
  } else {
    const controller = new AbortController();
    const signal = controller.signal;
    const response = await fetch(url, { ...opts, signal });
    onTimeout(() => controller.abort());
    return {
      type: WorkerResponseType.FetchResponse,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      json: await response.json()
    };
  }
};

export const retry = async (fn, attempts) => {
  let result;
  let error;
  for (let i = 0; i < attempts; i++) {
    try {
      result = await fn();
      error = null;
      break;
    } catch (e) {
      error = e;
    }
  }
  return [result, error];
};

export const withTimeout = async (fn, timeout) => {
  let timeoutId;
  let onTimeout;
  return Promise.race([
    fn(cb => (onTimeout = cb)),
    new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Timeout when executing 'fetch'"));
      }, timeout);
    })
  ]).finally(() => {
    onTimeout && onTimeout();
    clearTimeout(timeoutId);
  });
};

export const getCrypto = () => {
  //ie 11.x uses msCrypto
  return <Crypto>(window.crypto || (<any>window).msCrypto);
};

export const getCryptoSubtle = () => {
  const crypto = getCrypto();
  //safari 10.x uses webkitSubtle
  return crypto.subtle || (<any>crypto).webkitSubtle;
};

export const validateCrypto = () => {
  if (!getCrypto()) {
    throw new Error(
      'For security reasons, `window.crypto` is required to run `auth0-spa-js`.'
    );
  }
  if (typeof getCryptoSubtle() === 'undefined') {
    throw new Error(`
      auth0-spa-js must run on a secure origin.
      See https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md#why-do-i-get-auth0-spa-js-must-run-on-a-secure-origin 
      for more information.
    `);
  }
};
