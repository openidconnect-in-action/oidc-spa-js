const assert = require('assert');
const browserstack = require('browserstack-local');

const BROWSERSTACK_USER = process.env.BROWSERSTACK_USER;
const BROWSERSTACK_KEY = process.env.BROWSERSTACK_KEY;

assert(
  BROWSERSTACK_USER && BROWSERSTACK_KEY,
  'You must provide BROWSERSTACK_USER and BROWSERSTACK_KEY env variables.'
);

exports.config = {
  user: process.env.BROWSERSTACK_USER,
  key: process.env.BROWSERSTACK_KEY,
  specs: ['./wdio/**/*.js'],
  maxInstances: 1,
  capabilities: [
    {
      name: 'auth0-spa-js chrome',
      browserName: 'Chrome',
      'browserstack.local': true,
    },
    {
      name: 'auth0-spa-js firefox',
      browserName: 'Firefox',
      'browserstack.local': true,
    },
    {
      name: 'auth0-spa-js ie11',
      os: 'Windows',
      os_version: '10',
      browserName: 'IE',
      browser_version: '11.0',
      'browserstack.local': true,
    },
    {
      name: 'auth0-spa-js edge',
      os: 'Windows',
      os_version: '10',
      browserName: 'Edge',
      browser_version: '80.0',
      'browserstack.local': true,
    },
    {
      name: 'auth0-spa-js safari',
      os: 'OS X',
      browserName: 'Safari',
      browser_version: '13.0',
      'browserstack.local': true,
    },
  ],
  logLevel: 'info', // trace | debug | info | warn | error | silent
  waitforTimeout: 10000, // Default timeout for all waitFor* commands.
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
  onPrepare: function (config, capabilities) {
    console.log('Connecting local');
    return new Promise(function (resolve, reject) {
      exports.bs_local = new browserstack.Local();
      exports.bs_local.start({ key: exports.config.key }, function (error) {
        if (error) return reject(error);
        console.log('Connected. Now testing...');
        resolve();
      });
    });
  },
  onComplete: function (capabilties, specs) {
    exports.bs_local.stop(function () {});
  },
};
