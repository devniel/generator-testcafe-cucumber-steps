const {Given, When, Then} = require('cucumber');

Given('precondition with {string} and {string}', function (param1, param2) {
  return 'pending';
});

Given('precondition with {int} and {string} and {int} and {int}.', function (param1, param2, param3, param4) {
  return 'pending';
});

Given('precondition with {string} and {string} and {int} and {string}.', function (param1, param2, param3, param4) {
  return 'pending';
});

When('action', function () {
  return 'pending';
});

When('addition', function () {
  return 'pending';
});

Then('testable outcome equals {string}', function (param1) {
  return 'pending';
});

