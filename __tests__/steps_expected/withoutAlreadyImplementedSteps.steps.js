const {Given, When, Then} = require('cucumber');

Then('non implemented step.', function () {
  return 'pending';
});

