const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const fs = require('fs');
const gherkin = require('@devniel/gherkin');
const directory = require('./gherkin-languages');

async function streamToArray(readableStream) {
  return new Promise(
    (resolve, reject) => {
      const items = [];
      readableStream.on('data', items.push.bind(items));
      readableStream.on('error', err => reject(err));
      readableStream.on('end', () => resolve(items));
    }
  );
}

module.exports = class extends Generator {
  prompting() {
    this.log(yosay(
      'Welcome to the doozie ' + chalk.red('generator-testcafe-cucumber-steps') + ' generator!'
    ));

    const prompts = [
      {
        type: 'input',
        name: 'featurePath',
        message: 'Specify the path to the target .feature file (test.feature || path/to/test):',
        default: null,
        required: true
      },
      {
        type: 'input',
        name: 'stepsPath',
        message: 'Specify the path to the directory where the steps file will be created:',
        default: '.'
      },
      {
        type: 'input',
        name: 'templatePath',
        message: 'Specify the path to the template that will be used to generate the files:',
        default: null
      }
    ];

    return this.prompt(prompts)
      .then(props => {
        this.props = props;
      });
  }

  async writing() {
    const {featurePath, stepsPath, templatePath} = this.props;

    if (!featurePath) {
      throw new Error('Features path must not be empty!');
    }

    const featureFilePath = /\.feature$/.test(featurePath) ? featurePath : `${featurePath}.feature`;

    const parsedFeature = await this.parseFeature(featureFilePath);
    let featureName = featurePath.split('/');
    featureName = featureName[featureName.length - 1];
    featureName = /\.feature$/.test(featureName) ? featureName : `${featureName}.feature`;
    featureName = featureName.slice(0, featureName.indexOf('.'));

    const destinationPath = `${stepsPath}/${featureName}.steps.js`;

    this.fs.copyTpl(
      templatePath || this.templatePath('bootstrap.ejs'),
      this.destinationPath(destinationPath),
      {
        steps: parsedFeature
      }
    );
  }

  async parseFeature(featureFile) {
    if (featureFile) {
      let parsedFeature = [];
      let parsedStepsDict = {};
      const options = {
        includeSource: true,
        includeGherkinDocument: true,
        includePickles: true
      };

      const parsed = await streamToArray(gherkin.fromPaths([featureFile], options));
      const feature = parsed[1].gherkinDocument.feature;
      const {
        language,
        children
      } = feature;

      children.map(child => {
        if (child.scenario) {
          parsedFeature = parsedFeature.concat(
            this.parseSteps(child.scenario.steps, language, parsedStepsDict)
          );
        }
      });

      return parsedFeature;
    }
  }

  parseSteps(steps, language, parsedStepsDict) {
    if (steps) {
      let parsedSteps = [];
      const currentDictionary = directory[language];

      steps.map(step => {
        const {keyword, text} = step;
        let options = {
          keyword: null,
          expression: null,
          parameters: []
        };

        let stepData = this.parseStepString(text);

        Object.keys(currentDictionary).map(key => {
          if (currentDictionary[key] instanceof Array) {
            if (currentDictionary[key].includes(keyword)) {
              const keyword = key === 'and' ? 'when' : key;
              options = Object.assign(options, {
                keyword: keyword.charAt(0).toUpperCase() + keyword.slice(1, keyword.length),
                expression: stepData.expression,
                parameters: stepData.parameters
              });
            }
          }
        });

        // To avoid repetitions, same steps should be reusable.
        if (!parsedStepsDict[options.expression]) {
          parsedSteps = parsedSteps.concat(options);
          parsedStepsDict[options.expression] = true;
        }
      });

      return parsedSteps;
    }
  }

  parseStepString(expression) {
    if (expression) {
      const paramRegexp = /(\W+?(\d+)\W+?|"(.*?(\W*).*?)")/gm;
      const stringRegexp = /"(.*?(\W*).*?)"/gm;
      const intParamRegexp = /(\W+?)(\d+)(\W+?)/gm;
      let stepData = {
        parameters: []
      };

      if (paramRegexp.test(expression)) {
        let expressionWithParams = expression.replace(stringRegexp, '{string}');
        expressionWithParams = expressionWithParams.replace(intParamRegexp, function (match, p1, p2, p3) {
          return [p1, '{int}', p3].join('');
        });
        let i = 1;
        stepData = Object.assign(stepData, {
          expression: expressionWithParams
        });
        while (i <= expression.match(paramRegexp).length) {
          stepData = Object.assign(stepData, {
            parameters: stepData.parameters.concat(`param${i}`)
          });
          i++;
        }
      } else {
        stepData = Object.assign(stepData, {
          expression: `${expression}`
        });
      }

      return stepData;
    }
  }
};
