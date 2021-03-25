/* jshint node: true */
'use strict';

var CoreObject = require('core-object');
var RSVP = require('rsvp');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var _ = require('lodash');

var EXPIRE_IN_2030 = new Date("2030");
var TWO_YEAR_CACHE_PERIOD_IN_SEC = 60 * 60 * 24 * 365 * 2;

module.exports = CoreObject.extend({
  init: function(options) {
    this._super();
    this._plugin = options.plugin;
    var OSS = require('ali-oss');
    this._client = this._plugin.readConfig('aliossClient') || OSS({
      accessKeyId: this._plugin.readConfig('accessKeyId'),
      accessKeySecret: this._plugin.readConfig('secretAccessKey'),
      region: this._plugin.readConfig('region'),
      bucket: this._plugin.readConfig('bucket')
    });
  },

  upload: function(options) {
    options = options || {};
    return this._determineFilePaths(options).then(function(filePaths){
      return RSVP.Promise.all(this._putObjects(filePaths, options));
    }.bind(this));
  },

  _determineFilePaths: function(options) {
    var plugin = this._plugin;
    var filePaths = options.filePaths || [];
    if (typeof filePaths === 'string') {
      filePaths = [filePaths];
    }
    var prefix       = options.prefix;
    var manifestPath = options.manifestPath;
    if (manifestPath) {
      var key = path.join(prefix, manifestPath);
      plugin.log('Downloading manifest for differential deploy from `' + key + '`...', { verbose: true });
      return new RSVP.Promise(function(resolve, reject){
        this._client.get(key).then( (res) => {
          resolve(res.content.toString().split('\n'));
        }, (error) => {
          reject(error);
        });
      }.bind(this)).then(function(manifestEntries){
        plugin.log("Manifest found. Differential deploy will be applied.", { verbose: true });
        return _.difference(filePaths, manifestEntries);
      }).catch(function(/* reason */){
        plugin.log("Manifest not found. Disabling differential deploy.", { color: 'yellow', verbose: true });
        return RSVP.Promise.resolve(filePaths);
      });
    } else {
      return RSVP.Promise.resolve(filePaths);
    }
  },

  _mimeCharsetsLookup: function(mimeType, fallback) {
    // the node-mime library removed this method in v 2.0. This is the replacement
    // code for what was formerly mime.charsets.lookup
    return (/^text\/|^application\/(javascript|json)/).test(mimeType) ? 'UTF-8' : fallback;
  },

  _putObjects: function(filePaths, options) {
    var plugin           = this._plugin;
    var cwd              = options.cwd;
    var prefix           = options.prefix;
    var gzippedFilePaths = options.gzippedFilePaths || [];
    var cacheControl     = 'max-age='+TWO_YEAR_CACHE_PERIOD_IN_SEC+', public';
    var expires          = EXPIRE_IN_2030;

    var manifestPath = options.manifestPath;
    var pathsToUpload = filePaths;
    if (manifestPath) {
      pathsToUpload.push(manifestPath);
    }

    return pathsToUpload.map(function(filePath) {
      var basePath    = path.join(cwd, filePath);
      var data        = fs.readFileSync(basePath);
      var contentType = mime.getType(basePath);
      var encoding    = this._mimeCharsetsLookup(contentType);
      var key         = path.join(prefix, filePath);
      var isGzipped   = gzippedFilePaths.indexOf(filePath) !== -1;

      if (encoding) {
        contentType += '; charset=';
        contentType += encoding.toLowerCase();
      }

      var params = {
        mime: contentType,
        headers: {
          'Expires': expires,
          'Cache-Control': cacheControl
        }
      }
      if (isGzipped) {
        params.headers['Content-Encoding'] = 'gzip';
      }

      return new RSVP.Promise(function(resolve, reject) {
        this._client.put(key, data, params).then( () => {
          plugin.log('✔  ' + key, { verbose: true });
          resolve(filePath);
        }, (error) => {
          reject(error);
        });
      }.bind(this));
    }.bind(this));
  }
});
