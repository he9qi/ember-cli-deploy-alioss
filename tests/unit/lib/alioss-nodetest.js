var chai  = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

var assert = chai.assert;

describe('alioss', function() {
  var ALYOSS, mockUi, aliossClient, plugin, subject;

  before(function() {
    ALIOSS = require('../../../lib/alioss');
  });

  beforeEach(function() {
    aliossClient = {
      put: function(key, data, params) {
        return Promise.resolve();
      },
      get: function(key) {
        return Promise.reject(new Error("File not found"));
      }
    };
    mockUi = {
      messages: [],
      write: function() {},
      writeLine: function(message) {
        this.messages.push(message);
      }
    };
    plugin = {
      ui: mockUi,
      readConfig: function(propertyName) {
        if (propertyName === 'aliossClient') {
          return aliossClient;
        }
      },
      log: function(message, opts) {
        this.ui.write('|    ');
        this.ui.writeLine('- ' + message);
      }
    };
    subject = new ALIOSS({
      plugin: plugin
    });
  });

  describe('#upload', function() {
    it('resolves if all uploads succeed', function() {
      var options = {
        filePaths: ['app.js', 'app.css'],
        cwd: process.cwd() + '/tests/fixtures/dist',
        prefix: 'js-app'
      };

      var promises = subject.upload(options);

      return assert.isFulfilled(promises)
        .then(function() {
          assert.equal(mockUi.messages.length, 2);

          var messages = mockUi.messages.reduce(function(previous, current) {
            if (/- ✔  js-app\/app\.[js|css]/.test(current)) {
              previous.push(current);
            }

            return previous;
          }, []);

          assert.equal(messages.length, 2);
        });
    });

    it('rejects if an upload fails', function() {
      aliossClient.put = function(key) {
        return Promise.reject('error uploading');
      };

      var options = {
        filePaths: ['app.js', 'app.css'],
        cwd: process.cwd() + '/tests/fixtures/dist',
        prefix: 'js-app'
      };

      var promises = subject.upload(options);

      return assert.isRejected(promises)
        .then(function() {
        });
    });

    describe('sending the object to alioss', function() {
      it('sends the correct params', function() {
        var aliossParams, aliossData, aliossKey;
        aliossClient.put = function(key, data, params, cb) {
          aliossKey = key;
          aliossData = data;
          aliossParams = params;
          return Promise.resolve();
        };

        var options = {
          filePaths: ['app.css'],
          cwd: process.cwd() + '/tests/fixtures/dist',
          prefix: 'js-app',
          acl: 'public-read',
          bucket: 'some-bucket'
        };

        var promises = subject.upload(options);

        return assert.isFulfilled(promises)
          .then(function() {
            assert.equal(aliossKey, 'js-app/app.css');
            assert.equal(aliossData.toString(), 'body: {}\n');
            assert.equal(aliossParams.mime, 'text/css; charset=utf-8');
            assert.equal(aliossParams.headers["Cache-Control"], 'max-age=63072000, public');
            assert.deepEqual(aliossParams.headers["Expires"], new Date('2030'));
          });
      });
    });

    describe('with a manifestPath specified', function () {
      it('uploads all files when manifest is missing from server', function (done) {
        var options = {
          filePaths: ['app.js', 'app.css'],
          cwd: process.cwd() + '/tests/fixtures/dist',
          prefix: 'js-app',
          manifestPath: 'manifest.txt'
        };

        var promise = subject.upload(options);

        return assert.isFulfilled(promise)
          .then(function() {
            assert.equal(mockUi.messages.length, 5);
            assert.match(mockUi.messages[0], /- Downloading manifest for differential deploy.../);
            assert.match(mockUi.messages[1], /- Manifest not found. Disabling differential deploy\./);
            assert.match(mockUi.messages[2], /- ✔  js-app\/app\.js/);
            assert.match(mockUi.messages[3], /- ✔  js-app\/app\.css/);
            assert.match(mockUi.messages[4], /- ✔  js-app\/manifest\.txt/);
            done();
          }).catch(function(reason){
            done(reason);
          });
      });

      it('only uploads missing files when manifest is present on server', function (done) {
        aliossClient.get = function(key, data, params){
          return Promise.resolve({
            content: "app.js"
          });
        };

        var options = {
          filePaths: ['app.js', 'app.css'],
          cwd: process.cwd() + '/tests/fixtures/dist',
          prefix: 'js-app',
          manifestPath: 'manifest.txt'
        };

        var promise = subject.upload(options);

        return assert.isFulfilled(promise)
          .then(function() {
            assert.equal(mockUi.messages.length, 4);
            assert.match(mockUi.messages[0], /- Downloading manifest for differential deploy.../);
            assert.match(mockUi.messages[1], /- Manifest found. Differential deploy will be applied\./);
            assert.match(mockUi.messages[2], /- ✔  js-app\/app\.css/);
            assert.match(mockUi.messages[3], /- ✔  js-app\/manifest\.txt/);
            done();
          }).catch(function(reason){
            done(reason);
          });
      });
    });
  });
});
