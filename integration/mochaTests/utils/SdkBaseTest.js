class SdkBaseTest {
  constructor() {
    const test = JSON.parse(process.env.TEST);
    const client = JSON.parse(process.env.CLIENT);
    const host = process.env['HOST'];
    this.testName = test.name;
    if (client.platform == 'IOS' || client.platform == 'ANDROID') {
      this.testName = 'Mobile' + test.name;
    }
    this.useSimulcast = test.useSimulcast === undefined ? false : test.useSimulcast;
    if (this.useSimulcast) {
      this.testName += 'Simulcast';
    }

    if (host === 'local') {
      this.url = 'http://localhost:8080/';
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
    // if (process.env.STAGE !== undefined) {
    //   if (this.cwNamespaceInfix !== '') {
    //     this.capabilities[
    //       'name'
    //     ] = `${this.testName}-${this.cwNamespaceInfix}-${process.env.TEST_TYPE}-${process.env.STAGE}`;
    //   } else {
    //     this.capabilities[
    //       'name'
    //     ] = `${this.testName}-${process.env.TEST_TYPE}-${process.env.STAGE}`;
    //   }
    // } else {
    //   if (this.cwNamespaceInfix !== '') {
    //     this.capabilities[
    //       'name'
    //     ] = `${this.testName}-${this.cwNamespaceInfix}-${process.env.TEST_TYPE}`;
    //   } else {
    //     this.capabilities['name'] = `${this.testName}-${process.env.TEST_TYPE}`;
    //   }
    // }

    this.timeout = !!test.timeout ? test.timeout : 60;
  }

  getTransformedURL = (url, key, value) => {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  };
}

module.exports = SdkBaseTest;
