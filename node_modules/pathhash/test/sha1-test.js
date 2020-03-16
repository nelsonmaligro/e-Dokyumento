var should = require('should');
var path = require('path');
var inspect = require('eyespect').inspector();
var pathhash = require('../index');
describe('hash file at path', function() {
  var filePath = path.join(__dirname, 'test.txt');
  it('should get sha1 hash of file', function(done) {
    pathhash(filePath, function (err, reply) {
      should.not.exist(err, 'error hashing file at path: ' + err);
      should.exist(reply, 'no hash returned');
      reply.should.eql('6ed4756b3f5cfdef1b48fba9c28241af11b04d29', 'wrong sha1 hash returned');
      done();
    });
  });
});