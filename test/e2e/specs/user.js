const { initBrowser } = require('../util/index.js');

module.exports = {
  beforeEach: (browser) => {
    initBrowser(browser);
    browser.pause(1000);
  },

  'Embed widget': (browser) => {
    const devServer = browser.globals.devServerURL;
    const testUser = 'testing';

    browser
      .url(`${devServer}/in/embed/${testUser}`)
      .waitForElementVisible('.text-content__title--display-name > a', 5000)
      .verify.containsText('.text-content__title--display-name > a', testUser)
      .end();
  },
};
