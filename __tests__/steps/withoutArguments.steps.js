const {defineSupportCode} = require('cucumber');

defineSupportCode(function ({Given, When, Then}) {
  Given(/^precondition$/, function () {
    return true;
  });
  When(/^action$/, function () {
    return true;
  });
  When(/^addition$/, function () {
    return true;
  });
  Then(/^testable outcome$/, function () {
    return true;
  });
});
