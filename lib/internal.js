var
  _ = require('lodash'),
  Promise = require('bluebird'),
  mkdirp = Promise.promisifyAll(require('mkdirp')),
  fs = Promise.promisifyAll(require('fs')),
  path = require('path'),
  debuglog = require('util').debuglog('vaulted');


var internal = module.exports;

function checkStatus(vault, status) {
  if (!status.initialized || !_.isArray(vault.keys) || vault.keys.length === 0) {
    debuglog('either vault not initialized or no keys found');
    return vault;
  }
  return vault.getSealedStatus().bind(vault)
    .then(vault.getMounts)
    .then(function () {
      debuglog('internal state loaded');
      return vault;
    }).
    catch(function onError(err) {
      debuglog('failed to retrieve mounts: %s', err.message);
      return vault;
    });
}


/**
 * Load retrieve the current state of the vault and sets internal properties accordingly
 *
 * @param  {Vaulted} vault an instance of Vaulted.
 * @return {Promise<Vaulted>} Promise which is resolved with current instance of Vaulted.
 */
internal.loadState = function loadState(vault) {
  return this.recover(vault).bind(vault)
    .then(vault.getInitStatus)
    .then(_.partial(checkStatus, vault));
};

/**
 * Save the internal state to a file.
 *
 * @param  {Vaulted} vault an instance of Vaulted.
 * @return {Promise<Vaulted>} Promise which is resolved with current instance of Vaulted.
 */
internal.backup = function backup(vault) {
  var backupFile = path.join(vault.config.get('backup_dir'), 'keys.json');
  var ownmode = {mode: parseInt('0700', 8)};
  var data = JSON.stringify({root: vault.token, keys: vault.keys});

  if (!_.isString(vault.token) || !_.isArray(vault.keys) || vault.keys.length === 0) {
    debuglog('no data to backup');
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

/**
 * Retrieve the internal state from backup file.
 *
 * @param  {Vaulted} vault an instance of Vaulted.
 * @return {Promise<Vaulted>} Promise which is resolved with current instance of Vaulted.
 */
internal.recover = function recover(vault) {
  var backupFile = path.join(vault.config.get('backup_dir'), 'keys.json');

  return fs.readFileAsync(backupFile)
  .then(JSON.parse)
  .then(function (data) {
    if (_.isString(data.root) && _.isArray(data.keys) && data.keys.length > 0) {
      vault.setToken(data.root);
      vault.setKeys(data.keys);
      debuglog('recover successful');
    }
    return vault;
  })
  .catch(SyntaxError, function (err) {
    // invalid file (someone been modifying it?)
    debuglog('failed to recover backup: %s', err.message);
    return vault;
  })
  .catch(function (err) {
    // file most likely does not exist so just ignore it.
    if (err.code !== 'ENOENT') {
      debuglog('unable to read backup: %s', err.message);
    }
    return vault;
  });
};
