const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('../configs/BaseConfig');
const green = '\x1b[32m%s\x1b[0m';
const red = '\x1b[31m%s\x1b[0m';
// const { SaucelabsSession } = require('./WebdriverSauceLabs');
// const { LocalSession } = require('./WebdriverLocal');
// const { emitMetric } = require('./CloudWatch');

class WebDriverFactory {
  constructor() {
    const test = JSON.parse(process.env.TEST);
    const client = JSON.parse(process.env.CLIENT);
    const host = process.env.HOST;
    const testType = process.env.TEST_TYPE;

    this.testName = test.name;
    if (client.platform == 'IOS' || client.platform == 'ANDROID') {
      this.testName = 'Mobile' + test.name;
    }
    this.host = host;
    this.testType = testType;

    if (host === 'local') {
      this.url = 'http://127.0.0.1:9000/';
      this.baseUrl = this.url;
    } else {
      this.url = 'https://ondemand.saucelabs.com/wd/hub';
      this.baseUrl = this.url;
    }
    this.seleniumSessions = [];

    if (['Video', 'Audio'].includes(this.testName)) {
      this.url = this.getTransformedURL(this.url, 'attendee-presence-timeout-ms', 5000);
      // Allows us to easily treat unexpected reconnects as failures
      this.url = this.getTransformedURL(this.url, 'abort-on-reconnect', 'true');
      this.url = this.getTransformedURL(this.url, 'fatal', '1');
    }

    this.originalURL = this.url;
    this.cwNamespaceInfix = test.cwNamespaceInfix === undefined ? '' : test.cwNamespaceInfix;

    this.generateStereoTones = !!test.generateStereoTones;
    this.useStereoMusicAudioProfile = !!test.useStereoMusicAudioProfile;

    this.useVideoProcessor = !!test.useVideoProcessor;
    if (this.useVideoProcessor) {
      this.testName += 'Processor';
    }
  }

  configure() {
    let builder = new Builder();

    switch (this.host) {
      case 'local':
        break;

      case 'saucelabs':
        builder.usingServer(this.url);
        builder.withCapabilities({
          ...config.sauceOptions,
        });
        break;

      default:
        console.log(`Invalid host: ${host}, use local host instead.`);
        break;
    }

    switch (this.testType) {
      case 'integration-test':
        console.log(`Using integration test default settings`);
        builder.forBrowser('chrome');
        builder.withCapabilities({
          ...config.chromeOptions,
        });
        break;

      case `browser-compatibility`:
        console.log('TODO');
        break;

      default:
        console.log(`Using default Chrome lates on Mac settings`);
        builder.forBrowser('chrome');
        builder.withCapabilities({
          ...config.chromeOptions,
        });
        break;
    }

    return builder;
  }

  async build() {
    const service = new chrome.ServiceBuilder('/Users/kunalnan/Downloads/chromedriver');
    this.driver = await this.configure().setChromeService(service).build();
    const { id_ } = await this.driver.getSession();
    this.sessionId = id_;
    this.driver.executeScript('sauce:job-name=' + this.testName);
  }

  async quit(testResult) {
    if (this.host.startsWith('sauce')) {
      this.driver.executeScript('sauce:job-result=' + testResult);
      console.log(
        '\x1b[33m%s\x1b[0m',
        'See a video of the run at https://saucelabs.com/tests/' + this.sessionId
      );
    }
    await this.driver.quit();
  }
}

module.exports = WebDriverFactory;
