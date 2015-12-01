var
  _ = require('lodash'),
  Promise = require('bluebird'),
  mkdirp = Promise.promisifyAll(require("mkdirp")),
  fs = Promise.promisifyAll(require("fs")),
  path = require('path'),
  debuglog = require('util').debuglog('vaulted');


var internal = module.exports;

internal.loadState = function loadState(vault) {

  return this.recover(vault).then(function () {
    return vault.getInitStatus().then(function (status) {

      if (status.initialized && _.isArray(vault.keys) && vault.keys.length > 0) {
        return vault.getSealedStatus().then(function () {
          return vault.getMounts().then(function () {
            return vault;
          }).then(null, function (err) {
            debuglog('failed to retrieve mounts: %s', err.message);
            return vault;
          });
        }).then(null, function (err) {
          // failed to get sealed status
          debuglog('failed to get sealed status: %s', err.message);
          return vault;
        });
      }
      debuglog('either vault not initialized or no keys found');
      return vault;
    }).then(null, function (err) {
      debuglog('failed to get initialized status: %s', err.message);
      return vault;
    });
  });

};

internal.backup = function backup(vault) {
  var backupFile = path.join(vault.config.get('backup_dir'), 'keys.json');
  var ownmode = {mode: parseInt('0700', 8)};
  var data = JSON.stringify({root: vault.token, keys: vault.keys});

  if (!_.isString(vault.token) || !_.isArray(vault.keys) || vault.keys.length == 0) {
    debuglog('no data to backup');
    debuglog(vault.token, vault.keys);
    return Promise.resolve(vault);
  }

  return mkdirp.mkdirpAsync(vault.config.get('backup_dir'), ownmode).then(function () {
    return fs.writeFileAsync(backupFile, data, ownmode).then(function () {
      debuglog('backup file written');
      return vault;
    });
  }).catch(function (err) {
    debuglog('failed to save keys: %s', err.message);
    return vault;
  });
};


internal.recover = function recover(vault) {
  var backupFile = path.join(vault.config.get('backup_dir'), 'keys.json');

  return fs.readFileAsync(backupFile).then(JSON.parse).then(function (data) {
    if (_.isString(data.root) && _.isArray(data.keys) && data.keys.length > 0) {
      vault.setToken(data.root);
      vault.setKeys(data.keys);
      debuglog('recover successful');
    }
    return vault;
  }).catch(SyntaxError, function (err) {
    // invalid file (someone been modifying it?)
    debuglog('failed to recover backup: %s', err.message);
    return vault;
  }).catch(function (err) {
    // file most likely does not exist so just ignore it.
    if (err.code !== 'ENOENT') {
      debuglog('unable to read backup: %s', err.message);
    }
    return vault;
  });
};