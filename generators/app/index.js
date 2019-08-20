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
            this.parseSteps(child.scenario.steps, language)
          );
        }
      });

      return parsedFeature;
    }
  }

  parseSteps(steps, language) {
    if (steps) {
      let parsedSteps = [];
      let parsedStepsDict = {};
      const currentDictionary = directory[language];

      steps.map(step => {
        const {keyword, text} = step;
        let options = {
          keyword: null,
          regexp: null,
          parameters: []
        };

        let stepData = this.parseStepString(text);

        Object.keys(currentDictionary).map(key => {
          if (currentDictionary[key] instanceof Array) {
            if (currentDictionary[key].includes(keyword)) {
              const keyword = key === 'and' ? 'when' : key;
              options = Object.assign(options, {
                keyword: keyword.charAt(0).toUpperCase() + keyword.slice(1, keyword.length),
                regexp: stepData.regexp,
                parameters: stepData.parameters
              });
            }
          }
        });

        // To avoid repetitions, same steps should be reusable.
        if (!parsedStepsDict[options.regexp]) {
          parsedSteps = parsedSteps.concat(options);
          parsedStepsDict[options.regexp] = true;
        }
      });

      return parsedSteps;
    }
  }

  parseStepString(stepString) {
    if (stepString) {
      const paramRegexp = /"(.*?(\W*).*?)"/gm;
      let stepData = {
        parameters: []
      };

      if (paramRegexp.test(stepString)) {
        const stepRegexp = stepString.replace(paramRegexp, '{string}');
        let i = 1;
        stepData = Object.assign(stepData, {
          regexp: stepRegexp
        });
        while (i <= stepString.match(paramRegexp).length) {
          stepData = Object.assign(stepData, {
            parameters: stepData.parameters.concat(`param${i}`)
          });
          i++;
        }
      } else {
        stepData = Object.assign(stepData, {
          regexp: `${stepString}`
        });
      }

      return stepData;
    }
  }
};
