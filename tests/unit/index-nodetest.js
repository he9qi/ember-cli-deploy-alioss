'use strict';

var chai  = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

var assert = chai.assert;
var RSVP = require('rsvp');
var Promise = RSVP.Promise;

describe('alioss plugin', function() {
  var subject;
  var mockUi;
  var context;

  before(function() {
    subject = require('../../index');
  });

  beforeEach(function() {
    mockUi = {
      verbose: true,
      messages: [],
      write: function() {},
      writeLine: function(message) {
        this.messages.push(message);
      }
    };

    context = {
      distDir: process.cwd() + '/tests/fixtures/dist',
      distFiles: ['app.css', 'app.js'],
      ui: mockUi,
      uploadClient: {
        upload: function(options) {
          return Promise.resolve(['app.css', 'app.js']);
        }
      },
      config: {
        alioss: {
          accessKeyId: 'aaaa',
          secretAccessKey: 'bbbb',
          bucket: 'cccc',
          region: 'dddd',
          filePattern: '*.{css,js}',
          acl: 'authenticated-read',
          prefix: '',
          distDir: function(context) {
            return context.distDir;
          },
          distFiles: function(context) {
            return context.distFiles || [];
          },
          gzippedFiles: function(context) {
            return context.gzippedFiles || []; // e.g. from ember-cli-deploy-gzip
          },
          manifestPath: function(context) {
            return context.manifestPath; // e.g. from ember-cli-deploy-manifest
          },
          uploadClient: function(context) {
            return context.uploadClient; // if you want to provide your own upload client to be used instead of one from this addon
          },
          aliossClient: function(context) {
            return context.aliossClient; // if you want to provide your own alioss client to be used instead of one from aws-sdk
          }
        }
      }
    };
  });

  it('has a name', function() {
    var plugin = subject.createDeployPlugin({
      name: 'alioss'
    });

    assert.equal(plugin.name, 'alioss');
  });

  it('implements the correct hooks', function() {
    var plugin = subject.createDeployPlugin({
      name: 'alioss'
    });

    assert.typeOf(plugin.configure, 'function');
    assert.typeOf(plugin.upload, 'function');
  });

  describe('configure hook', function() {
    it('does not throw if config is ok', function() {
      var plugin = subject.createDeployPlugin({
        name: 'alioss'
      });
      plugin.beforeHook(context);
      plugin.configure(context);
      assert.ok(true); // it didn't throw
    });

    it('throws if config is not valid', function() {
      var plugin = subject.createDeployPlugin({
        name: 'alioss'
      });

      context.config.alioss = {};

      plugin.beforeHook(context);
      assert.throws(function(){
        plugin.configure(context);
      });
    });

    it('warns about missing optional config', function() {
      delete context.config.alioss.filePattern;
      delete context.config.alioss.prefix;

      var plugin = subject.createDeployPlugin({
        name: 'alioss'
      });
      plugin.beforeHook(context);
      plugin.configure(context);
      var messages = mockUi.messages.reduce(function(previous, current) {
        if (/- Missing config:\s.*, using default:\s/.test(current)) {
          previous.push(current);
        }

        return previous;
      }, []);

      assert.equal(messages.length, 2);
    });

    describe('required config', function() {
      it('warns about missing accessKeyId', function() {
        delete context.config.alioss.accessKeyId;

        var plugin = subject.createDeployPlugin({
          name: 'alioss'
        });
        plugin.beforeHook(context);
        assert.throws(function(error){
          plugin.configure(context);
        });
        var messages = mockUi.messages.reduce(function(previous, current) {
          if (/- Missing required config: `accessKeyId`/.test(current)) {
            previous.push(current);
          }

          return previous;
        }, []);

        assert.equal(messages.length, 1);
      });

      it('warns about missing secretAccessKey', function() {
        delete context.config.alioss.secretAccessKey;

        var plugin = subject.createDeployPlugin({
          name: 'alioss'
        });
        plugin.beforeHook(context);
        assert.throws(function(error){
          plugin.configure(context);
        });
        var messages = mockUi.messages.reduce(function(previous, current) {
          if (/- Missing required config: `secretAccessKey`/.test(current)) {
            previous.push(current);
          }

          return previous;
        }, []);

        assert.equal(messages.length, 1);
      });

      it('warns about missing bucket', function() {
        delete context.config.alioss.bucket;

        var plugin = subject.createDeployPlugin({
          name: 'alioss'
        });
        plugin.beforeHook(context);
        assert.throws(function(error){
          plugin.configure(context);
        });
        var messages = mockUi.messages.reduce(function(previous, current) {
          if (/- Missing required config: `bucket`/.test(current)) {
            previous.push(current);
          }

          return previous;
        }, []);

        assert.equal(messages.length, 1);
      });

      it('warns about missing region', function() {
        delete context.config.alioss.region;

        var plugin = subject.createDeployPlugin({
          name: 'alioss'
        });
        plugin.beforeHook(context);
        assert.throws(function(error){
          plugin.configure(context);
        });
        var messages = mockUi.messages.reduce(function(previous, current) {
          if (/- Missing required config: `region`/.test(current)) {
            previous.push(current);
          }

          return previous;
        }, []);

        assert.equal(messages.length, 1);
      });
    });

    it('adds default config to the config object', function() {
      delete context.config.alioss.filePattern;
      delete context.config.alioss.prefix;

      assert.isUndefined(context.config.alioss.filePattern);
      assert.isUndefined(context.config.alioss.prefix);

      var plugin = subject.createDeployPlugin({
        name: 'alioss'
      });
      plugin.beforeHook(context);
      plugin.configure(context);

      assert.isDefined(context.config.alioss.filePattern);
      assert.isDefined(context.config.alioss.prefix);
    });
  });

  describe('#upload hook', function() {
    it('prints the begin message', function() {
      var plugin = subject.createDeployPlugin({
        name: 'alioss'
      });

      plugin.beforeHook(context);
      return assert.isFulfilled(plugin.upload(context))
        .then(function() {
          assert.equal(mockUi.messages.length, 2);
          assert.match(mockUi.messages[0], /preparing to upload to alioss bucket `cccc`/);
        });
    });

    it('prints success message when files successully uploaded', function() {
      var plugin = subject.createDeployPlugin({
        name: 'alioss'
      });

      plugin.beforeHook(context);
      return assert.isFulfilled(plugin.upload(context))
        .then(function() {
          assert.equal(mockUi.messages.length, 2);

          var messages = mockUi.messages.reduce(function(previous, current) {
            if (/- uploaded 2 files ok/.test(current)) {
              previous.push(current);
            }

            return previous;
          }, []);

          assert.equal(messages.length, 1);
        });
    });

    it('prints an error message if the upload errors', function() {
      var plugin = subject.createDeployPlugin({
        name: 'alioss'
      });

      context.uploadClient = {
        upload: function(opts) {
          return Promise.reject(new Error('something bad went wrong'));
        }
      };

      plugin.beforeHook(context);
      return assert.isRejected(plugin.upload(context))
        .then(function() {
          assert.equal(mockUi.messages.length, 3);
          assert.match(mockUi.messages[1], /- Error: something bad went wrong/);
        });
    });

    it('sets the appropriate header if the file is inclued in gzippedFiles list', function(done) {
      var plugin = subject.createDeployPlugin({
        name: 'alioss'
      });

      context.gzippedFiles = ['app.css'];
      var assertionCount = 0;
      context.uploadClient = null;
      context.aliossClient = {
        put: function(key, data, params) {
          if (key === 'app.css') {
            assert.equal(params.headers['Content-Encoding'], 'gzip');
            assertionCount++;
          } else {
            assert.isUndefined(params.headers['Content-Encoding']);
            assertionCount++;
          }
          return Promise.resolve();
        },
        get: function(key){
          return Promise.reject(new Error("File not found"));
        }
      };

      plugin.beforeHook(context);
      return assert.isFulfilled(plugin.upload(context)).then(function(){
        assert.equal(assertionCount, 2);
        done();
      }).catch(function(reason){
        done(reason.actual.stack);
      });
    });
  });
});
