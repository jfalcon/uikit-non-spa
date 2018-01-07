/**
 * Files in the tools folder are not meant to be included into the
 * website directly as they contain ancillary code used by Node.
 */

/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable quotes */

import colors from 'colors';    // allows us to colorize console output
import express from 'express';  // middleware framework used for working with HTTP
import webpack from 'webpack';  // bundler being used to combine files
import open from 'open';        // opens a file or URL in the default application
import path from 'path';        // path utilities provided by Node

import { getPages, isProdMode, NODE_PROD, NODE_DEV } from './utility'; // useful utility functions
import { config } from '../package.json';                              // configuration info

const DIR_DIST = config.directories.output;
const FILE_DEFAULT = 'index';
const HTTP_HOST = 'http://localhost';
const HTTP_PORT = 8080;
const PATH_DIST = path.resolve(__dirname, '..', DIR_DIST);

const fileName = (process.argv[2] || '').toLowerCase();
console.log(`Serving ${(fileName || FILE_DEFAULT)}...`.bold.green);

const server = express();

if (isProdMode()) {
  // simply serve up static files if they exist in the output folder, nothing fancy required
  server.use(express.static(PATH_DIST));

  // invalid requests will simply return the original file from the output folder
  server.get('*', function(req, res) {
    res.sendFile(path.join(PATH_DIST, `${fileName}.html`));
  });
} else {
  let compiler = webpack(config);

  // we have to filter through webpack in development mode
  const middleware = require('webpack-dev-middleware')(compiler, {
    logLevel: 'silent',                  // don't clutter up the console with a wall of text
    publicPath: config.output.publicPath // specified in the webpack configuration
  });

  // tell express to run webpack before doing anything
  server.use(middleware);

  // tell express to use hot module reloading as well
  server.use(require('webpack-hot-middleware')(compiler));

  // tell express to serve the index file for any invalid request, since this is for a
  // development build, we have to serve it from the webpack in-memory file system
  server.get('*', function(req, res) {
    const indexFile = path.join(PATH_DIST, `${fileName}.html`);

    try {
      res.set('Content-Type', 'text/html');
      res.write(middleware.fileSystem.readFileSync(indexFile));
    } catch (e) {
      console.error(('Memory File System ' + e.toString() + `\n${indexFile}`).bold.red);

      res.set('Content-Type', 'text/plain');
      res.write(e.toString());
    }

    res.end();
  });
}

// now we open up the user's default browser and tell express to listen to HTTP traffic
server.listen(HTTP_PORT, function(err) {
  if (err) {
    console.error(err);
  } else {
    open(`${HTTP_HOST}:${HTTP_PORT}`);
  }
});
