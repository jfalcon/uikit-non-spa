/**
 * Files in the tools folder are not meant to be included into the
 * website directly as they contain ancillary code used by Node.
 */

/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable quotes */

import colors from 'colors';                                           // colorize console output
import webpack from 'webpack';                                         // bundler used to compile files
import path from 'path';                                               // path utilities provided by Node
import copyFile from 'quickly-copy-file';                              // performs a simple file copy
import { getPages, isProdMode, NODE_PROD, NODE_DEV } from './utility'; // useful utility functions
import { config } from '../package.json';                              // configuration info

const filter = (process.argv[2] || '').toLowerCase();
console.log(`Building ${(filter || 'all')}...`.bold.green);

 // use different configurations depending on if this is a development or production build
const isProd = isProdMode() ? true : false;

const pagesPath = (path.resolve(__dirname, '..', config.directories.source, config.directories.pages));
const pages = getPages(pagesPath, filter);

// transform the data into what webpack expects
let scriptEntryPoints = {};
let templateEntryPoints = {};

for (const item in pages) {
  if (pages[item].script) scriptEntryPoints[item] = pages[item].script;
  if (pages[item].template) templateEntryPoints[item] = pages[item].template;
}

// the compiler must be dynamically included so we can use dynamic data in the config
// we need to specify a build mode dynamically into the webpack configuration as well
const compilerConfig = require('./compile')(isProd ? NODE_PROD : NODE_DEV, {
  scriptEntryPoints: scriptEntryPoints,
  templateEntryPoints: templateEntryPoints
});

const compiler = webpack(compilerConfig);

// run the compilation process
compiler.run((error, stats) => {
  // if a fatal error occurred then bail out early
  if (error) {
    console.log(error.red);
    return 1;
  }

  const jsonStats = stats.toJson();

  // if the stats also report and error we bail out as well
  if (jsonStats.hasErrors) {
    return jsonStats.errors.map(error => console.log(error.bold.red));
  }

  // continue despite warnings, but let somebody know what's up
  if (jsonStats.hasWarnings) {
    jsonStats.warnings.map(warning => console.log(warning));
  }

  if(isProd) {
    const ROBOTS_FILE = 'robots.txt';
    const DIR_SITE = config.directories.source;
    const DIR_DIST = config.directories.output;

    const PATH_SITE = path.resolve(__dirname, '..', DIR_SITE);
    const PATH_DIST = path.resolve(__dirname, '..', DIR_DIST);

    // silently copy over the robots file
    copyFile(path.join(PATH_SITE, ROBOTS_FILE), path.join(PATH_DIST, ROBOTS_FILE))
      .then(function () {}).catch(function () {});
  }

  return 0;
});
