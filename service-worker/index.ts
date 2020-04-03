import { get, set } from 'idb-keyval';

const check = async () => {
  const accessToken = await get('access_token');
  const expires = await get('expires');
  return !!accessToken && Date.now() < expires;
};

self.addEventListener('message', async e => {
  const {
    data: { accessToken, expiresIn, type, url, ...opts },
    ports: [port]
  } = e;
  switch (type) {
    case 'store':
      await set('access_token', accessToken);
      await set('expires', Date.now() + expiresIn * 1000);
      port.postMessage({});
      break;
    case 'check':
      port.postMessage({ success: await check() });
      break;
    case 'fetch':
      if (!(await check())) {
        port.postMessage({ error: 'Expired access_token' });
      }
      const authorization = `Bearer ${await get('access_token')}`;
      const _opts = Object.assign({}, opts);
      _opts.headers = Object.assign(_opts.headers || {}, { authorization });
      const response = await fetch(url, _opts);
      port.postMessage(await response.json());
      break;
    default:
      throw new Error(`Unrecognized type: ${type}`);
  }
});
