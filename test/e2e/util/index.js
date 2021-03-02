const jwt = require('jsonwebtoken');

function initBrowser(browser) {
  browser
    .pause(5000)
    .windowHandles(function func(res) {
      res.value.forEach((val, i) => {
        this.switchWindow(val);
        if (i !== res.value.length - 1) {
          this.closeWindow();
        }
      });
    });
}

function jwtSign(user, wallet) {
  return jwt.sign({
    permissions: ['read', 'write'],
    user,
    wallet,
  }, 'likecoin', {
    expiresIn: '7d',
    audience: 'rinkeby.like.co',
    issuer: 'rinkeby.like.co',
  });
}

function setAuthCookie(browser, url, user, wallet) {
  const auth = jwtSign(user, wallet);
  browser
    .url(url)
    .setCookie({
      name: 'likecoin_auth',
      value: auth,
    });
}

module.exports = { initBrowser, setAuthCookie };
