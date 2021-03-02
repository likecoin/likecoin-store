// For authoring Nightwatch tests, see
// http://nightwatchjs.org/guide#usage

const { initBrowser } = require('../util/index.js');

module.exports = {
  beforeEach: (browser) => {
    initBrowser(browser);
  },

  /* eslint quote-props: "off" */
  'Route /. Whitepaper exists.': function test(browser) {
    const devServer = browser.globals.devServerURL;

    browser
      .url(`${devServer}/in/whitepaper`)
      .waitForElementVisible('ul.document-list > li:nth-child(2) div.lc-document-wrapper button', 3000)
      .click('ul.document-list > li:nth-child(2) div.lc-document-wrapper button')
      .pause(1000)
      .windowHandles(function func(result) {
        this.verify.equal(result.value.length, 2, 'There should be 2 windows open');
        const newWindow = result.value[1];
        this.switchWindow(newWindow);
        this.verify.urlContains('likecoin-whitepaper-en.pdf');
      })
      .end();
  },

};
