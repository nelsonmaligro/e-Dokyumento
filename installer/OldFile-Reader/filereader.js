const StreamZip = require('node-stream-zip');
var PdfReader = require("pdfreader").PdfReader;
exports.extract = function(filePath) {
    return new Promise(
        function(resolve, reject) {
            open(filePath).then(function(res, err) {
                if (err) reject(err);
                var body = '';
                var components = res.toString().split('<w:t');
                for (var i = 0; i < components.length; i++) {
                    var tags = components[i].split('>');
                    var content = tags[1].replace(/<.*$/, "");
                    body += content + ' ';
                }
                resolve(body);
            })
        }
    )
};

function open(filePath) {
    return new Promise(
        function(resolve, reject) {
            const zip = new StreamZip({
                file: filePath,
                storeEntries: true
            })
            zip.on('ready', () => {
                var chunks = [];
                var content = '';
                zip.stream('word/document.xml', (err, stream) => {

                    if (err) reject(err);
                    stream.on('data', function(chunk) {
                        console.log(chunk);
                        chunks.push(chunk);
                    })
                    stream.on('end', function() {
                        content = Buffer.concat(chunks);
                        zip.close();
                        resolve(content.toString());
                    });
                });
            });
        }
      );
};
exports.getFileExtension = function(filename) {
    if (filename.length == 0)
        return "";
    var dot = filename.lastIndexOf(".");
    if (dot == -1)
        return "";
    var extension = filename.substr(dot, filename.length);
    return extension;
};
exports.readPDFFile = function(pdfFilePath, pdfBuffer) {
    return new Promise(
        function(resolve, reject) {
            var content = ''
            new PdfReader().parseBuffer(pdfBuffer, function(err, item) {
                if (err) reject(err);
                else if (!item) reject(err);
                else if (item.text) {
                    console.log(item.text);
                    content += item.text;
                    resolve(content);
                }
            });
        }
    );
};
