var fs = require('fs');
var crypto = require('crypto');
module.exports = function(filePath, callback) {
  var readStream = fs.createReadStream(filePath);
  var sha1_hash;
  var shasum = crypto.createHash('sha1');
  readStream.on('data', function (data) {
    shasum.update(data);
  });
  readStream.on('close', function (data) {
    sha1_hash = shasum.digest('hex');
    return callback(null, sha1_hash);
  });
  readStream.on('error', function (err) {
    return callback(err, null);
  });
}
