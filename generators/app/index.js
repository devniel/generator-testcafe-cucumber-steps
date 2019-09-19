const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const fs = require('fs');
const gherkin = require('@devniel/gherkin');
const directory = require('./gherkin-languages');
const glob = require('glob');

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
        required: true,
        store: true
      },
      {
        type: 'input',
        name: 'stepsPath',
        message: 'Specify the path to the step_definitions directory:',
        default: './features/step_definitions',
        store: true
      },
      {
        type: 'input',
        name: 'stepFilename',
        message: 'Specify the name of the file (without ".steps.js") where to save the steps:',
        default: null,
        store: true
      },
      {
        type: 'input',
        name: 'templatePath',
        message: 'Specify the path to the template that will be used to generate the files:',
        default: null,
        store: true
      }
    ];

    return this.prompt(prompts)
      .then(props => {
        this.props = props;
      });
  }

  async writing() {
    const {featurePath, stepsPath, stepFilename, templatePath} = this.props;

    if (!featurePath) {
      throw new Error('Features path must not be empty!');
    }

    const featureFilePath = /\.feature$/.test(featurePath) ? featurePath : `${featurePath}.feature`;
    const parsedFeature = await this.parseFeature(featureFilePath);
    const destinationPath = `${stepsPath}/${stepFilename}.steps.js`;

    // Check other step definitions in the same folder.
    glob(stepsPath + '/**/*.js', (err, files) => {
      if (err) {
        throw err;
      }

      let expressions = {};

      for (let file of files) {

        if(this.destinationPath(destinationPath).includes(file)) continue;

        const fileContent = fs.readFileSync(file, {encoding: 'utf-8'});
        const regex = /(?:Given|Then|When)\((["']|\/\^)(?<expression>(?:(?=(\\?))\2.)*?)(\1|\$\/)/igm;
        let m;

        const expressions_file = {};
        while ((m = regex.exec(fileContent)) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (m.index === regex.lastIndex) {
            regex.lastIndex++;
          }
          expressions[m.groups.expression] = true;
          expressions_file[m.groups.expression] = true;
        }

      }

      const expressionsToPersist = [];
      parsedFeature.forEach(p => {
        if (expressions[p.expression]) {
          this.log(yosay(
            `Expression "${p.expression}" is already implemented, ignoring it.`
          ));
        } else {
          expressionsToPersist.push(p);
        }
      });

      this.fs.copyTpl(
        templatePath || this.templatePath('step_definition.ejs'),
        this.destinationPath(destinationPath),
        {
          steps: expressionsToPersist
        }
      );
    });
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
      const paramRegexp = /(\W+?(\d+)\W+?|"(.*?(\W*).*?)"|(\W+?(\d+)\W+?|'(.*?(\W*).*?)'))/gm;
      const stringRegexp = /("(.*?(\W*).*?)"|'(.*?(\W*).*?)')/gm;
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
