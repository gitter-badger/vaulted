require('./helpers.js').should;

var
  debuglog = require('util').debuglog('vaulted-tests'),
  chai = require('./helpers').chai,
  assert = require('./helpers').assert,
  Vault = require('../lib/vaulted');

chai.use(require('./helpers').cap);

// if running within container the HOME is fixed; else running locally so assume
// that consul and vault are also running locally.
var CONSUL_HOST = '127.0.0.1:8500';
var VAULT_HOST = process.env.HOME === '/home/appy' ? 'vault' : '127.0.0.1';


describe('consul', function () {
  var myVault = null;

  before(function () {
    myVault = new Vault({
      // debug: 1,
      vault_host: VAULT_HOST,
      vault_port: 8200,
      vault_ssl: 0
    });
    return myVault.prepare().then(function () {
      return myVault.init().then(function () {
        return myVault.unSeal().then(function () {
          return myVault.createMount({
            id: 'consul',
            body: {
              type: 'consul'
            }
          });
        });
      });
    }).then(null, function (err) {
      debuglog('(before) vault setup of consul backend failed: %s', err.message);
    });
  });

  it('configure failed - no options', function () {
    return myVault.configConsulAccess().then(function () {
      assert.notOk(true, 'configure successful!');
    }).then(null, function (err) {
      err.should.be.an.instanceof(Error);
      err.message.should.equal('You must provide Consul configurations.');
    });
  });

  it('configure failed - no body', function () {
    return myVault.configConsulAccess({}).then(function () {
      assert.notOk(true, 'configure successful!');
    }).then(null, function (err) {
      err.should.be.an.instanceof(Error);
      err.message.should.equal('You must provide Consul configurations.');
    });
  });

  it('configure failed - missing address', function () {
    return myVault.configConsulAccess({
      body: {
        address: ''
      }
    }).then(function () {
      assert.notOk(true, 'configure successful!');
    }).then(null, function (err) {
      err.should.be.an.instanceof(Error);
      err.message.should.equal('You must provide Consul address (host:port).');
      // err.statusCode.should.equal(400);
    });
  });

  it('configure success', function () {
    return myVault.configConsulAccess({
      body: {
        address: CONSUL_HOST
      }
    }).should.be.fulfilled;
  });

  it('create role failed - no options', function () {
    return myVault.createConsulRole().then(function () {
      assert.notOk(true, 'no policy options successfully created!');
    }).then(null, function (err) {
      err.should.be.an.instanceof(Error);
      err.message.should.equal('You must provide Consul role definition.');
    });
  });

  it('create role failed - no body', function () {
    return myVault.createConsulRole({}).then(function () {
      assert.notOk(true, 'no policy body successfully created!');
    }).then(null, function (err) {
      err.should.be.an.instanceof(Error);
      err.message.should.equal('You must provide Consul role definition.');
    });
  });

  it('create role failed - no policy', function () {
    return myVault.createConsulRole({
      body: {
        policy: null
      }
    }).then(function () {
      assert.notOk(true, 'no policy successfully created!');
    }).then(null, function (err) {
      err.should.be.an.instanceof(Error);
      err.message.should.equal('Consul role definition must be a string.');
    });
  });

  it('create role failed - policy not string', function () {
    return myVault.createConsulRole({
      body: {
        policy: {}
      }
    }).then(function () {
      assert.notOk(true, 'policy not string successfully created!');
    }).then(null, function (err) {
      err.should.be.an.instanceof(Error);
      err.message.should.equal('Consul role definition must be a string.');
    });
  });

  it('create role success', function () {
    var policy = 'key "" { policy = "read" }';
    return myVault.createConsulRole({
      id: 'readonly',
      body: {
        policy: policy
      }
    }).should.be.fulfilled;
  });

  it('get role - no options', function () {
    return myVault.getConsulRole().then(function () {
      assert.notOk(true, 'get role successful!');
    }).then(null, function (err) {
      err.should.be.an.instanceof(Error);
      err.message.should.equal('Endpoint GET consul/roles/:id requires an id, none was given.');
    });
  });

  it('get role - not found', function () {
    return myVault.getConsulRole({id: 'fakeRole'}).then(function () {
      assert.notOk(true, 'get role successful!');
    }).then(null, function (err) {
      err.should.be.an.instanceof(Error);
      err.should.have.property('statusCode');
      err.statusCode.should.equal(404);
    });
  });

  it('get role - readonly', function () {
    return myVault.getConsulRole({id: 'readonly'}).then(function (role) {
      role.should.have.property('data');
      role.data.should.have.property('policy');
      role.data.policy.should.be.a('string');
      debuglog('readonly role: %s', role.data.policy);
      debuglog(new Buffer(role.data.policy, 'base64').toString('ascii'));
    });
  });

  it('delete role - no options', function () {
    return myVault.deleteConsulRole().then(function () {
      assert.notOk(true, 'delete role successful!');
    }).then(null, function (err) {
      err.should.be.an.instanceof(Error);
      err.message.should.equal('Endpoint DELETE consul/roles/:id requires an id, none was given.');
    });
  });

  // the Vault API seems to always return 204 whether the specified
  // item exists or not. skip the test for now.
  it.skip('delete role - not found', function () {
    return myVault.deleteConsulRole({id: 'fakeRole'}).then(function () {
      assert.notOk(true, 'delete role successful!');
    }).then(null, function (err) {
      err.should.be.an.instanceof(Error);
      err.should.have.property('statusCode');
      err.statusCode.should.equal(404);
    });
  });

  it('delete role successful', function () {
    var policy = 'key "" { policy = "write" }';
    return myVault.createConsulRole({
      id: 'writer',
      body: {
        policy: policy
      }
    }).then(function () {
      return myVault.deleteConsulRole({id: 'writer'}).should.be.fulfilled;
    });
  });

  it('generate token - no options', function () {
    return myVault.generateConsulRoleToken().then(function () {
      assert.notOk(true, 'generate token successful!');
    }).then(null, function (err) {
      err.should.be.an.instanceof(Error);
      err.message.should.equal('Endpoint GET consul/creds/:id requires an id, none was given.');
    });
  });

  it('generate token - not found', function () {
    return myVault.generateConsulRoleToken({id: 'fakeRole'}).then(function () {
      assert.notOk(true, 'generate token successful!');
    }).then(null, function (err) {
      err.should.be.an.instanceof(Error);
      err.should.have.property('statusCode');
      err.statusCode.should.equal(400);
    });
  });

  // WIP; not sure why it is not currently working
  it.skip('generate token - readonly', function () {
    return myVault.generateConsulRoleToken({id: 'readonly'}).then(function (role) {
      role.should.have.property('data');
      role.data.should.have.property('token');
      role.data.token.should.be.a('string');
    }).then(null, function (err) {
      debuglog(err.error);
      err.should.be.undefined;
    });
  });

  after(function () {
    // need to fix the fact that passing in 'consul' would result in
    // an error when removing the item from the mounts list.
    return myVault.deleteMount({id: 'consul/'}).then(function () {
      if (!myVault.status.sealed) {
        return myVault.seal().then(function () {
          debuglog('vault sealed: %s', myVault.status.sealed);
        }).then(null, function (err) {
          debuglog(err);
          debuglog('failed to seal vault: %s', err.message);
        });
      }
    }).then(null, function (err) {
      debuglog(err);
      debuglog('failed to remove consul mount: %s', err.message);
    });
  });

});
