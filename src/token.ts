import { TokenEndpointOptions, WorkerResponseType } from './global';
import { DEFAULT_SILENT_TOKEN_RETRY_COUNT } from './constants';
import {
  FetchError,
  MissingRefreshTokenError,
  OAuthError,
  TimeoutError
} from './errors';
import { fetchWithWorker, retry, withTimeout } from './utils';

export const oauthToken = async (
  { baseUrl, timeout, ...options }: TokenEndpointOptions,
  worker
) => {
  const url = `${baseUrl}/oauth/token`;
  const opts = {
    method: 'POST',
    body: JSON.stringify({
      redirect_uri: window.location.origin,
      ...options
    }),
    headers: {
      'Content-type': 'application/json'
    }
  };

  const [response, fetchError] = await retry(
    () =>
      withTimeout(
        onTimeout => fetchWithWorker(url, opts, timeout, onTimeout, worker),
        timeout
      ),
    DEFAULT_SILENT_TOKEN_RETRY_COUNT
  );

  if (fetchError) {
    throw new FetchError(url);
  }

  switch (response.type) {
    case WorkerResponseType.FetchResponse:
      const {
        json: { error, error_description, ...success },
        ok,
        status,
        statusText
      } = response;
      if (!ok) {
        if (error) {
          throw new OAuthError(
            error,
            error_description,
            url,
            status,
            statusText
          );
        }
        throw new FetchError(url, status, statusText);
      }
      return success;
    case WorkerResponseType.MissingRefreshToken:
      throw new MissingRefreshTokenError();
    case WorkerResponseType.NetworkFailure:
      throw new FetchError(url);
    case WorkerResponseType.FetchTimeout:
      throw new TimeoutError();
  }
};
