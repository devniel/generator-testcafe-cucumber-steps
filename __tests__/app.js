var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');
var fs = require('fs');

describe('Creates step file without paramaters', () => {
  beforeAll(() => {
    return helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({
        featurePath: path.resolve(__dirname, 'features/withoutArguments.feature'),
        stepsPath: path.resolve(__dirname, 'steps/generated')
      })
      .catch(reason => {
        throw reason;
      });
  });

  it('creates step file', () => {
    assert.file([
      path.resolve(__dirname, 'steps/generated', 'withoutArguments.steps.js')
    ]);
  });

  // It('creates step file equals to expected file', () => {
  //   const withoutArgumentsSteps = fs.readFileSync(
  //     path.resolve(__dirname, 'features/withoutArguments.steps.js'),
  //     'utf-8'
  //   );
  //   assert.fileContent('withoutArguments.steps.js', withoutArgumentsSteps);
  // });
});

describe('Creates step file with paramaters', () => {
  beforeAll(() => {
    return helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({
        featurePath: path.resolve(__dirname, 'features/withArguments.feature'),
        stepsPath: path.resolve(__dirname, 'steps/generated')
      })
      .catch(reason => {
        throw reason;
      });
  });

  it('creates step file', () => {
    assert.file([
      path.resolve(__dirname, 'steps/generated', 'withArguments.steps.js')
    ]);
  });

  it('creates step file equals to expected file', () => {
    const withArgumentsSteps = fs.readFileSync(
      path.resolve(__dirname, 'steps/generated/withArguments.steps.js'),
      'utf-8'
    );

    const expectedwithArgumentsSteps = fs.readFileSync(
      path.resolve(__dirname, 'steps/expected/withArguments.steps.js'),
      'utf-8'
    );

    expect(expectedwithArgumentsSteps).toMatch(withArgumentsSteps);
  });
});

describe('Create step file with repetitions', () => {
  beforeAll(() => {
    return helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({
        featurePath: path.resolve(__dirname, 'features/withRepetitions.feature'),
        stepsPath: path.resolve(__dirname, 'steps/generated')
      })
      .catch(reason => {
        throw reason;
      });
  });

  it('creates step file', () => {
    assert.file([
      path.resolve(__dirname, 'steps/generated', 'withRepetitions.steps.js')
    ]);
  });

  it('creates step file equals to expected file', () => {
    const withRepetitionsSteps = fs.readFileSync(
      path.resolve(__dirname, 'steps/generated/withRepetitions.steps.js'),
      'utf-8'
    );

    const expectedWithRepetitionsSteps = fs.readFileSync(
      path.resolve(__dirname, 'steps/expected/withRepetitions.steps.js'),
      'utf-8'
    );

    expect(expectedWithRepetitionsSteps).toMatch(withRepetitionsSteps);
  });
});
