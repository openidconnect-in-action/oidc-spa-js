import { get, set } from 'idb-keyval';

var secret;

self.addEventListener('message', async function(e) {
  const {
    data,
    ports: [port]
  } = e;
  if (data.type === 'put') {
    secret = data.secret;
    await set('secret', secret);
  } else if (data.type === 'get') {
    port.postMessage({
      global: secret,
      idb: await get('secret')
    });
  }
});
