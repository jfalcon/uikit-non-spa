/**
 * Files in the tools folder are not meant to be included into the
 * website directly as they contain ancillary code used by Node.
 */

import fs from 'fs';                      // file system utilities provided by Node
import { join } from 'path';              // path utilities provided by Node
import { config } from '../package.json'; // configuration info

export const NODE_ENV = 'NODE_ENV';
export const NODE_DEV = 'development';
export const NODE_PROD = 'production';
export const NODE_TEST = 'test';

const _isArgSet = (value) => {
  const count = process.argv ? process.argv.length : 0;
  let result = false;

  // skip through the first two indexes since they don't contain extra arguments
  for (let index = 2; index < count; index++) {
    let argument = process.argv[index].trim().toLowerCase();
    if (argument === value) { result = true; break; }
  }

  return result;
};

const _isEnvSetToValue = (variable, value) => {
  // we can't use the process.env.MY_VAR syntax for this, also keep
  // in mind environment variables are always stored as a string
  return (process.env && (process.env[variable] === value.toString())) ? true : false;
};

// this will return an object containing data in regards to pages available
export function getPages(path, filter) {
  let result = {};

  let modules = fs.readdirSync(path).filter(item => {
    let ok = !filter || (filter === item);
    return fs.statSync(join(path, item)).isDirectory() && ok;
  });

  for(let x in modules) {
    let scriptFile = join(path, modules[x], `${config.defaults.filename}.js`);
    let templateFile = join(path, modules[x], `${config.defaults.filename}.ejs`);

    result[modules[x]] = {
      script: fs.existsSync(scriptFile) ? scriptFile : null,
      template: fs.existsSync(templateFile) ? templateFile : null
    };
  }

  return result;
};

// development mode is the default, so anything not set to production or test is considered true
export function isDevMode() {
  return !isProdMode() && !isTestMode();
}

// we can set production mode via the command line or environment variables
export function isProdMode() {
  // the command line argument will take priority over the environment variable
  return _isArgSet(NODE_PROD) || _isEnvSetToValue(NODE_ENV, NODE_PROD);
}

// we can set test mode either via the command line or environment variables
export function isTestMode() {
  // the command line argument will take priority over the environment variable
  return _isArgSet(NODE_TEST) || _isEnvSetToValue(NODE_ENV, NODE_TEST);
}
