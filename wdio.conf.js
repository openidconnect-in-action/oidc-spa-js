exports.config = {
  runner: 'local',
  specs: ['./wdio/**/*.js'],
  capabilities: [
    {
      browserName: 'chrome',
    },
  ],
  logLevel: 'trace',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,
  services: ['chromedriver'],
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
};
