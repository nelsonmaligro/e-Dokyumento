const temp = require('temp');
const path = require('path');
const exec = require('child_process').exec;
const fs = require('fs');

module.exports = function (inputPath, options, callback) {
    if (!callback || typeof callback !== 'function') {
        callback = options;
        options = [];
    }

    fs.exists(inputPath, (exists) => {
        if (!exists) {
            return callback(`error, no file exists at the path you specified: ${inputPath}`);
        }

        const outputPath = temp.path({ prefix: 'ocr_output' });
        const cmd = 'tesseract "' + inputPath + '" "' + outputPath + '" ' + options.join(' ');
        const child = exec(cmd, (err) => {
            if (err) {
                return callback(err);
            }

            const textOutputPath = `${outputPath}.txt`;
            fs.readFile(textOutputPath, 'utf8', (err, output) => {
                if (err) { 
                    return callback(err); 
                }

                fs.unlink(textOutputPath, (err) => {
                    if (err) { 
                        return callback(err);
                    }
                    
                    callback(null, output);
                });
            });
        });
    });
}
