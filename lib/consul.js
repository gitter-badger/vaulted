var
  Vaulted = {},
  Promise = require('bluebird'),
  _ = require('lodash');

module.exports = function extend(Proto) {
  Vaulted.getConsulRolesEndpoint = _.partial(Proto.validateEndpoint, 'consul/roles/:id');
  Vaulted.getConsulCredsEndpoint = _.partial(Proto.validateEndpoint, 'consul/creds/:id');
  Vaulted.getConsulAccessEndpoint = _.partial(Proto.validateEndpoint, 'consul/config/access');
  _.extend(Proto, Vaulted);
};

/**
 * Configures the access information for Consul secret backend
 *
 * @param  {Object} options Hash of options to send to API request, key "body" required.
 * @return {Promise<Object>}         Promise which resolves with status of configuration
 */
Vaulted.configConsulAccess = function configConsulAccess(options) {
  options = options || {};
  if (_.isUndefined(options.body) || !options.body) {
    return Promise.reject(new Error('You must provide Consul configurations.'));
  }

  // the Vault API seems to allow an empty address vaule but that really does
  // not really make sense; so verify here.
  if (_.isUndefined(options.body.address) || !options.body.address) {
    return Promise.reject(new Error('You must provide Consul address (host:port).'));
  }

  if (_.isUndefined(options.body.token) || !options.body.token) {
    // need the root token to be able to manage the ACLs
    options.body.token = this.token;
  }

  return this.getConsulAccessEndpoint().post({
    headers: this.headers,
    body: options.body
  });
};

/**
 * Creates or updates the Consul role definition
 *
 * @param  {Object} options Hash of options to send to API request, keys "id" and "body" required.
 * @return {Promise<Object>}         Promise which resolves with status of role creation
 */
Vaulted.createConsulRole = function createConsulRole(options) {
  options = options || {};
  if (_.isUndefined(options.body) || !options.body) {
    return Promise.reject(new Error('You must provide Consul role definition.'));
  }
  if (!_.isString(options.body.policy)) {
    return Promise.reject(new Error('Consul role definition must be a string.'));
  }
  // According to documentation the policy must be base64 encoded; easier to handle this
  // here vs. each user having to do this manually.
  options.body.policy = new Buffer(options.body.policy).toString('base64');

  return this.getConsulRolesEndpoint().post({
    headers: this.headers,
    id: options.id,
    body: options.body
  });
};

/**
 * Retrieve a specified Consul role definition
 *
 * @param  {Object} options Hash of options to send to API request, key "id" required.
 * @return {Promise<Object>}         Promise which resolves with role definition object returned from consul
 */
Vaulted.getConsulRole = function getConsulRole(options) {
  options = options || {};

  return this.getConsulRolesEndpoint().get({
    headers: this.headers,
    id: options.id
  });
};

/**
 * Removes a specified Consul role definition
 *
 * @param  {Object} options Hash of options to send to API request, key "id" required.
 * @return {Promise<Object>}         Promise which resolves with status of role deletion
 */
Vaulted.deleteConsulRole = function deleteConsulRole(options) {
  options = options || {};

  return this.getConsulRolesEndpoint().delete({
    headers: this.headers,
    id: options.id
  });
};

/**
 * Generate a dynamic Consul token based on the role definition
 *
 * @param  {Object} options Hash of options to send to API request, key "id" required.
 * @return {Promise<Object>}         Promise which resolves with token object returned from consul
 */
Vaulted.generateConsulRoleToken = function generateConsulRoleToken(options) {
  options = options || {};

  return this.getConsulCredsEndpoint().get({
    headers: this.headers,
    id: options.id
  });
};
