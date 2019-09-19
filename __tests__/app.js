var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');
var fs = require('fs');

describe('Creates step file with the given paramaters', () => {
  beforeAll(() => {

    return helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({
        featurePath: path.resolve(__dirname, 'features/withArguments.feature'),
        stepsPath: path.resolve(__dirname, 'steps'),
        stepFilename: 'withArguments',
        templatePath: path.resolve(__dirname, 'templates/step_definition.ejs')
      })
      .catch(reason => {
        throw reason;
      });
  });

  it('creates step file', () => {
    assert.file([
      path.resolve(__dirname, 'steps', 'withArguments.steps.js')
    ]);
  });

  it('creates step file equals to expected file', () => {
    const withArgumentsSteps = fs.readFileSync(
      path.resolve(__dirname, 'steps/withArguments.steps.js'),
      'utf-8'
    );

    const expectedwithArgumentsSteps = fs.readFileSync(
      path.resolve(__dirname, 'steps_expected/withArguments.steps.js'),
      'utf-8'
    );

    console.log({
      withArgumentsSteps,
      expectedwithArgumentsSteps
    })

    expect(expectedwithArgumentsSteps).toEqual(withArgumentsSteps);
  });

  afterAll(() => {
    fs.unlinkSync(path.resolve(__dirname, 'steps/withArguments.steps.js'));
  });
});

describe('Create step file based on feature file with repetitions', () => {
  beforeAll(() => {
    return helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({
        featurePath: path.resolve(__dirname, 'features/withRepetitions.feature'),
        stepsPath: path.resolve(__dirname, 'steps'),
        stepFilename: 'withRepetitions',
        templatePath: path.resolve(__dirname, 'templates/step_definition.ejs')
      })
      .catch(reason => {
        throw reason;
      });
  });

  afterAll(() => {
    fs.unlinkSync(path.resolve(__dirname, 'steps/withRepetitions.steps.js'));
  });

  it('creates step file', () => {
    assert.file([
      path.resolve(__dirname, 'steps', 'withRepetitions.steps.js')
    ]);
  });

  it('creates step file equals to expected file', () => {
    const withRepetitionsSteps = fs.readFileSync(
      path.resolve(__dirname, 'steps/withRepetitions.steps.js'),
      'utf-8'
    );

    const expectedWithRepetitionsSteps = fs.readFileSync(
      path.resolve(__dirname, 'steps_expected/withRepetitions.steps.js'),
      'utf-8'
    );

    expect(expectedWithRepetitionsSteps).toEqual(withRepetitionsSteps);
  });
});

describe('Create step file based on feature file with repetitions and already implemented steps.', () => {
  beforeAll(() => {

    helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({
        featurePath: path.resolve(__dirname, 'features/withArguments.feature'),
        stepsPath: path.resolve(__dirname, 'steps'),
        stepFilename: 'withArguments',
        templatePath: path.resolve(__dirname, 'templates/step_definition.ejs')
      })
      .catch(reason => {
        throw reason;
      });

    helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({
        featurePath: path.resolve(__dirname, 'features/withRepetitions.feature'),
        stepsPath: path.resolve(__dirname, 'steps'),
        stepFilename: 'withRepetitions',
        templatePath: path.resolve(__dirname, 'templates/step_definition.ejs')
      })
      .catch(reason => {
        throw reason;
      });

    return helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({
        featurePath: path.resolve(__dirname, 'features/withoutAlreadyImplementedSteps.feature'),
        stepsPath: path.resolve(__dirname, 'steps'),
        stepFilename: 'withoutAlreadyImplementedSteps',
        templatePath: path.resolve(__dirname, 'templates/step_definition.ejs')
      })
      .catch(reason => {
        throw reason;
      });

  });

  afterAll(() => {
    fs.unlinkSync(path.resolve(__dirname, 'steps/withArguments.steps.js'));
    fs.unlinkSync(path.resolve(__dirname, 'steps/withoutAlreadyImplementedSteps.steps.js'));
    fs.unlinkSync(path.resolve(__dirname, 'steps/withRepetitions.steps.js'));
  });

  it('creates step file', () => {
    assert.file([
      path.resolve(__dirname, 'steps', 'withoutAlreadyImplementedSteps.steps.js')
    ]);
  });

  it('creates step file equals to expected file', () => {
    const withRepetitionsSteps = fs.readFileSync(
      path.resolve(__dirname, 'steps/withoutAlreadyImplementedSteps.steps.js'),
      'utf-8'
    );

    const expectedWithRepetitionsSteps = fs.readFileSync(
      path.resolve(__dirname, 'steps_expected/withoutAlreadyImplementedSteps.steps.js'),
      'utf-8'
    );

    expect(expectedWithRepetitionsSteps).toEqual(withRepetitionsSteps);
  });
});