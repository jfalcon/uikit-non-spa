import webpack from 'webpack'; // bundler being used to bundle files
import path from 'path';       // path utilities provided by Node

import ExtractTextPlugin from 'extract-text-webpack-plugin';
import StyleLintPlugin from 'stylelint-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import { config, browserslist } from '../package.json';    // configuration info
import { NODE_ENV, NODE_DEV, NODE_PROD } from './utility'; // help determine the build mode

const DIR_SITE = config.directories.source;
const DIR_DIST = config.directories.output;
const DIR_NODE = config.directories.modules;

const PATH_SITE = path.resolve(__dirname, '..', DIR_SITE);
const PATH_DIST = path.resolve(__dirname, '..', DIR_DIST);

const SCRIPT_CHUNK = 'bundle.[name].js';
const SCRIPT_OUTPUT = '[name].js';
const STYLE_OUTPUT = '[name].css';

/*/
/ / Since we make such a big deal about fonts below, it's worth explaining them a bit.
/ /
/ / WOFF is essentially a wrapper that contains SFNT-based fonts (TrueType or OpenType) that have been
/ / compressed using a WOFF encoding tool to enable them to be embedded in a Web page. The format uses
/ / zlib compression typically resulting in a file size reduction from TTF of over 40%. Like OpenType
/ / fonts, WOFF supports both PostScript and TrueType outlines for the glyphs.
/ /
/ / WOFF2 is a newer version of WOFF that provides for better compression.
/ /
/ / Embedded OpenType (EOT) fonts are a compact form of OpenType fonts designed by Microsoft for use
/ / as embedded fonts on web pages. They are supported only by Microsoft Internet Explorer.
/ /
/ / SVG fonts are a subset of the Scalable Vector Graphics (SVG) 1.1 specification, which is an XML-based
/ / vector image format for two-dimensional graphics with support for animation. It was developed by the
/ / World Wide Web Consortium (W3C) in 1999. Use of this as a standalone font is now deprecated since
/ / most browsers support embedding of SVG fonts inside the OpenType and WOFF supersets. As such, all
/ / SVG files included here should really be actual images rather than a font file.
/*/

module.exports = (env, argv) => {
  // use different configurations depending on if this is a development or production build
  const isProd = (env === NODE_PROD) ? true : false;

  // keep the original source for mappings with development builds
  const sourceMap = isProd ? '(none)' : 'inline-source-map';

  // specifies the directory where the application resides
  const contentBase = isProd ? PATH_DIST : PATH_SITE;

  // we should always use the utility functions rather than set this directly, however
  // since libraries such as React are unaware of our custom code we still need to pass
  // it along so they can perform whatever steps are necessary for production builds
  let environment = {};
  environment[`process.env.${NODE_ENV}`] = JSON.stringify(isProd ? NODE_PROD : NODE_DEV);

  // defines the base dependences that will end up in the vendor output file
  // order is important with these and they will be included globally
  const vendorBase = [
    'babel-polyfill',     // necessary for a full ES6 implementation through Babel
    'whatwg-fetch',       // a windows.fetch polyfill for older browsers
    'flexibility',        // a flexbox polyfill for older browsers
    'react',              // the main include for React
    'react-dom',          // the main include for React over the web
    'react-redux',        // bindings for Redux with React
    'react-router',       // a router implementation for React
    'react-router-dom',   // a router implementation for React over the web
    'react-router-redux', // bindings for Redux with the React router
    'redux',              // main include for Redux
    'sprintf-js',         // globally make available string formatting routines
    'uikit'               // uikit front-end web framework
  ];

  // the vendor portion of the script entry point includes
  let scriptEntryPoints = isProd ? {
    vendor: vendorBase.concat([
      'react-hot-loader'                           // add this also in prod, but disabled, so syntax isn't messed up
    ])
  } : {
    vendor: vendorBase.concat([
      'react-hot-loader/patch',                    // allows components to be hot reloaded without loss of state
      'eventsource-polyfill',                      // necessary for hot module reloading with IE
      'webpack-hot-middleware/client?reload=true', // this will reload the page if hot module reloading fails
    ])
  };

  // the named modules portion of the script entry points
  Object.assign(scriptEntryPoints, argv.scriptEntryPoints);

  let htmlWebpackPlugins = [];
  if (isProd) {
    for (const item in argv.templateEntryPoints) {
      // automatically create production html files from EJS templates
      htmlWebpackPlugins.push(new HtmlWebpackPlugin({
        chunks: ['vendor', item],
        customData: config,
        filename: `${item}.html`,
        inject: true,
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,                          // this is just a fallback setting, uglify does this too
          minifyCSS: true,                         // this is just a fallback setting, css-loader does this too
          minifyURLs: true
        },
        template: argv.templateEntryPoints[item]
      }));
    }
  } else {
    for (const entry in argv.templateEntryPoints) {
      // automatically create development html files from EJS templates
      htmlWebpackPlugins.push(new HtmlWebpackPlugin({
        chunks: ['vendor', item],
        customData: config,
        filename: `${item}.html`,
        inject: true,
        template: argv.templateEntryPoints[item]
      }));
    }
  }

  // which webpack plug-ins to load for the build (more will be added below)
  const webpackPlugins = isProd ? [
    new webpack.optimize.OccurrenceOrderPlugin(),  // prioritize often used modules by assigning them the smallest ids
    new webpack.DefinePlugin(environment),         // setting this here tells React, etc. to do a production build
    new ExtractTextPlugin({                        // extract styles from the bundle into a separate file
      filename: STYLE_OUTPUT,
      allChunks: true
    }),
    new webpack.optimize.DedupePlugin(),           // eliminate duplicate packages in the final bundle
    ...htmlWebpackPlugins,                         // automatically create html files from templates
    new webpack.optimize.UglifyJsPlugin({          // remove dead code and minifies the final JavaScript output
      sourceMap: true,
      test: /\.jsx?$/
    })
  ] : [
    new webpack.DefinePlugin(environment),         // setting this here tells React, etc. to do a development build
    new webpack.HotModuleReplacementPlugin(),      // enables Hot Module Replacement (HMR)
    new StyleLintPlugin(),                         // enable in-browser linting for styles
    new webpack.NoEmitOnErrorsPlugin(),            // ensures that no assets are emitted that include errors
    ...htmlWebpackPlugins                          // automatically create html files from templates
  ];

  // this will be used below when we preprocess styles in vanilla CSS
  const postCssPlugins = () => {
    return [
      require('postcss-flexbugs-fixes'),
      require('autoprefixer')({ browsers: browserslist })
    ];
  };

  // loader configurations to preprocess styles into vanilla CSS with vendor prefixes
  const preprocessStyleLoaders = [{
    loader: 'css-loader',                          // treats @import and url() as CommonJS modules
      options: {
        importLoaders: 2,                          // use both sass and postcss loaders when importing
        minimize: isProd,
        sourceMap: false
      }
    },{
      loader: 'postcss-loader',                    // allows us to transform styles via scripts
      options: {
        plugins: postCssPlugins,
        sourceMap: false
      }
    },{
      loader: 'sass-loader',                       // compiles SASS to CSS
      options: { sourceMap: false }
  }];

  // for production builds we put the styles in a separate file
  const styleLoaderConfig = isProd ?
  ExtractTextPlugin.extract({
    fallback: 'style-loader',                      // fall back to injecting CSS into the page via a style tag
    use: preprocessStyleLoaders
  }) : [
    { loader: 'style-loader' },                    // injects CSS into a page via a style tag
    ...preprocessStyleLoaders                      // order is very important for this
  ];

  // the actual configuration object
  return {
    devtool: sourceMap,                            // tells webpack how to handle source mappings
    target: 'web',                                 // compiles for usage in a browser-like environment
    entry: scriptEntryPoints,                      // the application entry points webpack will use
    output: {
      path: PATH_DIST,                             // where physical files will be placed for production builds
      publicPath: '/',                             // required for hot reloading to work with nested routes
      filename: SCRIPT_OUTPUT,                     // main script filename(s) for in-memory or production builds
      chunkFilename: SCRIPT_CHUNK                  // chunk script filename(s) for in-memory or production builds
    },
    devServer: {
      contentBase: contentBase,                    // specifies the directory where the application resides
      stats: 'errors-only'                         // only show error information output to the console
    },
    plugins: webpackPlugins.concat([               // webpackPlugins is defined above
      new webpack.ProvidePlugin({                  // auto load these modules instead of importing everywhere
        fetch: ['isomorphic-fetch', 'fetch'],      // required for global fetch usage
        sprintf: ['sprintf', 'sprintf'],           // required for global sprintf usage
        vsprintf: ['sprintf', 'vsprintf']          // required for global vsprintf usage
    })]),
    module: {
      loaders: [{
        test: /\.(css|scss|sass)$/,
        use: styleLoaderConfig
      },{
        test: /\.jsx?$/,
        exclude: `/${DIR_NODE}/`,
        include: PATH_SITE,
        use: ['babel-loader']
      },{
        test: /\.(jpe?g|png|gif|ico)((\?|(\??#))[.a-z0-9]+)?$/i,
        use: [{
          loader: 'file-loader',
          options: {
            context: `${DIR_SITE}/`,                   // requires an ending slash to create a directory
            name: '[path][name].[ext]'                 // used with the context to keep directory structure
          }
        }]
      },{
        test: /\.svg((\?|(\??#))[.a-z0-9]+)?$/i,
        use: [{
          loader: 'url-loader',
          options: {
            context: `${DIR_SITE}/`,                   // requires an ending slash to create a directory
            limit: 10240,                              // anything under 10 KiB is embedded as a data url
            mimetype: 'image/svg+xml',                 // established circa August 2011 by W3C
            name: '[path][name].[ext]'                 // used with the context to keep directory structure
          }
        }]
      },{
        test: /\.eot((\?|(\??#))[.a-z0-9]+)?$/i,
        use: [{
          loader: 'url-loader',
          options: {
            context: `${DIR_SITE}/`,                   // requires an ending slash to create a directory
            limit: 10240,                              // anything under 10 KiB is embedded as a data url
            mimetype: 'application/vnd.ms-fontobject', // established circa December 2005 by IANA
            name: '[path][name].[ext]'                 // used with the context to keep directory structure
          }
        }]
      },{
        test: /\.woff((\?|(\??#))[.a-z0-9]+)?$/i,
        use: [{
          loader: 'url-loader',
          options: {                                   // Web Open Font Format (WOFF)
            context: `${DIR_SITE}/`,                   // requires an ending slash to create a directory
            limit: 10240,                              // anything under 10 KiB is embedded as a data url
            mimetype: 'application/font-woff',         // font/woff isn't widely supported yet (Feb 2017 IETF)
            name: '[path][name].[ext]'                 // used with the context to keep directory structure
          }
        }]
      },{
        test: /\.woff2((\?|(\??#))[.a-z0-9]+)?$/i,
        use: [{
          loader: 'url-loader',
          options: {                                   // Web Open Font Format (WOFF) 2.0
            context: `${DIR_SITE}/`,                   // requires an ending slash to create a directory
            limit: 10240,                              // anything under 10 KiB is embedded as a data url
            mimetype: 'application/font-woff2',        // font/woff2 isn't widely supported yet (Feb 2017 IETF)
            name: '[path][name].[ext]'                 // used with the context to keep directory structure
          }
        }]
      },{
        test: /\.otf((\?|(\??#))[.a-z0-9]+)?$/i,
        use: [{
          loader: 'url-loader',
          options: {                                   // OpenType Font Format (Adobe and Microsoft 1996)
            context: `${DIR_SITE}/`,                   // requires an ending slash to create a directory
            limit: 10240,                              // anything under 10 KiB is embedded as a data url
            mimetype: 'application/x-font-opentype',   // font/otf isn't widely supported yet (Feb 2017 IETF)
            name: '[path][name].[ext]'                 // used with the context to keep directory structure
          }
        }]
      },{
        test: /\.ttf((\?|(\??#))[.a-z0-9]+)?$/i,
        use: [{
          loader: 'url-loader',
          options: {                                   // TrueType Font Format (Apple and Microsoft 1980s)
            context: `${DIR_SITE}/`,                   // requires an ending slash to create a directory
            limit: 10240,                              // anything under 10 KiB is embedded as a data url
            mimetype: 'application/x-font-truetype',   // font/ttf isn't widely supported yet (Feb 2017 IETF)
            name: '[path][name].[ext]'                 // used with the context to keep directory structure
          }
        }]
      }]
    }
  }
};
