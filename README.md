# generator-testcafe-cucumber-steps

### How to use
```
npm install -g yo
npm install -g generator-testcafe-cucumber-steps

yo testcafe-cucumber-steps
```

### Options

- `featurePath`: Path to the target, the `.feature` file.
- `stepsPath`: Path of the steps directory (the `.steps.js` file will be generated here).
- `stepFilename`: Filename of the steps' file (without `.steps.js`), it could have the form of a path (`/subdirectory/stepFilename`) that will create the proper folders inside the `stepsPath`.
- `templatePath`: Path to the filename to use for create the `.steps.js` file.


### Template:

The template should be a EJS file, the default one is:

```ejs
const {Given, When, Then} = require('cucumber');

<% steps.forEach(function(step) { -%>
<%= step.keyword %>('<%- step.expression %>', function (<%= step.parameters.join(', ') %>) {
  return 'pending';
});

<% }); 

-%>
```

The `steps` object is an array with the steps to be used for the file generation, each `step` has the following properties:

- `keyword`: The captured keyword (When, Then, Given).
- `expression`: The expression content without `"`, `'`, `/^` and `$/`.
- `parameters`: An array of the generated paramenter names, it should be `param1`, `param2`, `param3` and so on based on the detected parameters (any string between `'` or `"`) in the expression.


### Notes

Based on https://github.com/lamartire/generator-cucumber-steps but with the updated modules and for Testcafé environments.