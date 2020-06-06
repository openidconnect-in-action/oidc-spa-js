export class OAuthError extends Error {
  constructor(
    public error: string,
    public error_description?: string,
    public url?: string,
    public status?: string,
    public statusText?: string
  ) {
    super(error_description || error);

    Object.setPrototypeOf(this, OAuthError.prototype);
  }
}

export class HandleRedirectError extends OAuthError {
  constructor(
    error: string,
    error_description: string,
    public state: string,
    public appState: any = null
  ) {
    super(error, error_description);
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, HandleRedirectError.prototype);
  }
}

export class FetchError extends Error {
  /**
   * For backwards compatibility
   * @deprecated
   */
  public error: string;

  constructor(
    public url: string,
    public status?: string,
    public statusText?: string
  ) {
    super(statusText || `HTTP error. Unable to fetch ${url}`);
    this.error = 'request_error';
    Object.setPrototypeOf(this, FetchError.prototype);
  }
}

export class TimeoutError extends Error {
  /**
   * @deprecated
   */
  private error: string;
  /**
   * deprecated
   */
  private error_description: string;
  constructor() {
    super('Operation timed out.');

    this.error = 'timeout';
    this.error_description = 'Timeout';
    Object.setPrototypeOf(this, OAuthError.prototype);
  }
}

export class MissingRefreshTokenError extends Error {
  constructor() {
    super('Missing refresh token');

    Object.setPrototypeOf(this, MissingRefreshTokenError.prototype);
  }
}

/**
 * @deprecated Use OAuthError
 */
export const GenericError = OAuthError;

/**
 * @deprecated Use HandleRedirectError
 */
export const AuthenticationError = HandleRedirectError;
