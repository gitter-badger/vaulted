require('./helpers.js').should;

var
  chai = require('./helpers').chai,
  _ = require('lodash'),
  fs = require('fs'),
  Endpoint = require('../lib/endpoint.js')();

chai.use(require('./helpers').cap);

describe('Endpoint', function() {

  var api_def = JSON.parse(fs.readFileSync('tests/configs/api_test.json')).v1;

  before(function() {});

  describe('#init', function() {
    var endpoint;

    beforeEach(function() {
      var options = _.defaults(api_def[0],{ base_url: 'http://localhost:8200'});
      endpoint = new Endpoint(options);
    });

    it('should have a name', function() {
      endpoint.should.have.property('name');
      endpoint.name.should.equal('punts');
    });

    it('should have a hash of verbs', function() {
      endpoint.should.have.property('verbs');
      endpoint.verbs.should.be.an.instanceof(Object);
    });

    it('should throw an exception when there are no verbs', function() {
      (function() {
        endpoint = new Endpoint(api_def[1]);
      }).should.throw(/has no verbs defined/);
    });

    it('should throw an exception when there is no base_url', function () {
      function shouldThrow() {
        endpoint = new Endpoint(api_def[2]);
      }
      shouldThrow.should.throw(/has no base URL defined/);
    });

    it('should throw an exception when no name', function () {
      function shouldThrow() {
        endpoint = new Endpoint();
      }
      shouldThrow.should.throw(/Endpoint has no name defined/);
    });

  });

  describe('#getURI', function() {
    var endpoint, options;

    beforeEach(function() {
      options = _.extend(api_def[0], { base_url: 'https://localhost:8200' });
      endpoint = new Endpoint(options);
    });

    it('should exist', function () {
      endpoint.getURI.should.exist;
      endpoint.getURI.should.be.an.instanceof(Function);
    });

    it('should append the endpoint to the base uri', function () {
      var endpoint_uri = endpoint.getURI();
      endpoint_uri.should.equal('https://localhost:8200/punts');
    });

    it('should replace :id with provided option id', function () {
      options = _.extend(api_def[3], { base_url: 'https://localhost:8200' });
      endpoint = new Endpoint(options);
      var endpoint_uri = endpoint.getURI({id: 'test'});
      endpoint_uri.should.equal('https://localhost:8200/sys/no_get/test');
    });
  });

  describe('#_createRequest', function() {
    var endpoint, options;

    beforeEach(function() {
      options = _.extend(api_def[0], { base_url: 'https://localhost:8200' });
      endpoint = new Endpoint(options);
    });

    it('should have a get method', function() {
      endpoint.get.should.exist;
      endpoint.get.should.be.an.instanceof(Function);
    });

    it('should have a post method', function() {
      endpoint.post.should.exist;
      endpoint.post.should.be.an.instanceof(Function);
    });

    it('should have a put method', function() {
      endpoint.put.should.exist;
      endpoint.put.should.be.an.instanceof(Function);
    });

    it('should have a delete method', function() {
      endpoint.delete.should.exist;
      endpoint.delete.should.be.an.instanceof(Function);
    });

    it('should reject the promise if the endpoint does not support the verb', function() {
      endpoint = new Endpoint(_.extend(api_def[2], { base_url: 'https://localhost:8200' }));
      endpoint.get().should.be.rejectedWith(Error);
    });

    it('should return a promise if the endpoint supports the verb', function() {
      endpoint = new Endpoint(api_def[0]);
      endpoint.get().should.be.fufilled;
    });

    it('should reject promise if endpoint requires id and one is not provided', function () {
      options = _.extend(api_def[3], { base_url: 'https://localhost:8200' });
      endpoint = new Endpoint(options);
      endpoint.put().should.be.rejectedWith(Error);
    });

  });

});



