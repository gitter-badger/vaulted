var should = require('./helpers.js').should;

var Vault = require('../lib/vaulted.js');

describe('Vaulted', function() {

  describe('#init', function() {

    var old_VAULT_ADDR = null;

    before(function() {
      if (process.env.VAULT_ADDR) {
        old_VAULT_ADDR = process.env.VAULT_ADDR;
        delete process.env.VAULT_ADDR;
      }
    });

    after(function() {
      if (old_VAULT_ADDR) {
        process.env.VAULT_ADDR = old_VAULT_ADDR;
      }
    });

    it('should create a new instance', function() {
      var vault = new Vault();
      vault.should.be.instanceof(Vault);
    });

    it('should take an empty options hash', function() {
      var
        options = {},
        vault = new Vault(options);

      vault.should.be.an.instanceof(Vault);
    });

    it('should take an options hash, and override any default settings', function() {
      var
        options = {
          'addr': 'https://some.other.host:1234',
          'env': 'prod'
        },
        vault = new Vault(options);

      vault.config.get('addr').should.equal(options.addr);
    });

    it('should throw an error when it can\'t fine an api definition', function() {
      function shouldThrow() {
        return new Vault({
          'prefix': 'vdfsdf4'
        });
      }
      shouldThrow.should.throw(Error);
    });

  });

});