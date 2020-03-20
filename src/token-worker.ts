self.addEventListener('message', (e: MessageEvent) => {
  console.log('WEB WORKER', e);

  self.postMessage({ id: e.data.id, payload: e.data }, undefined);
});
