const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const fs = require('fs');
const gherkin = require('gherkin');
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
      'Welcome to the doozie ' + chalk.red('generator-cucumber-steps') + ' generator!'
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
      }
    ];

    return this.prompt(prompts)
      .then(props => {
        this.props = props;
      });
  }

  async writing() {
    const {featurePath, stepsPath} = this.props;

    if (!featurePath) {
      throw new Error('Features path must not be empty!');
    }

    const featureFile = fs.readFileSync(
      /\.feature$/.test(featurePath) ? featurePath : `${featurePath}.feature`,
      'utf-8'
    );

    const featureFilePath = /\.feature$/.test(featurePath) ? featurePath : `${featurePath}.feature`;

    const parsedFeature = await this.parseFeature(featureFilePath);
    let featureName = featurePath.split('/');
    featureName = featureName[featureName.length - 1];
    featureName = /\.feature$/.test(featureName) ? featureName : `${featureName}.feature`;
    featureName = featureName.slice(0, featureName.indexOf('.'));

    const destinationPath = `${stepsPath}/${featureName}.steps.js`;

    console.log('destinationPath:', destinationPath);

    this.fs.copyTpl(
      this.templatePath('bootstrap.ejs'),
      this.destinationPath(destinationPath),
      {
        steps: parsedFeature
      }
    );
  }

  async parseFeature(featureFile) {
    if (featureFile) {
      let parsedFeature = [];

      console.log('featureFile:', featureFile);

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
        parsedSteps = parsedSteps.concat(options);
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
        const stepRegexp = stepString.replace(paramRegexp, '"(.*)"');
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
