const temp = require('temp');
const path = require('path');
const exec = require('child_process').exec
const fs = require('fs');
let pdfConvertQuality = 400; // default to density 400 for the convert command

module.exports = (inputPath, quality, callback) => {
    if (!callback || typeof callback !== 'function') {
        callback = quality;   // callback must be the second parameter
        quality = undefined;  // no option passed
    }

    fs.exists(inputPath, (exists) => {
        if (!exists) { 
            return callback(`error, no file exists at the path: ${inputPath}`); 
        }

        const outputPath = temp.path({ prefix: 'tif_output', suffix: '.tif' });

        if (quality) {
            if (typeof (quality) !== 'string' && typeof (quality) !== 'number') {
                return callback(`error, pdf quality option must be a string, currently set as: ${typeof (quality)}`);
            }

            pdfConvertQuality = quality;
        }

        const cmd = 'gs -sDEVICE=tiffgray -r720x720 -g6120x7920 -sCompression=lzw -o "' + outputPath + '" "' + inputPath + '"';
        const child = exec(cmd, (err, stderr, stdout) => {
            if (err) {
                return callback(err);
            }

            return callback(null, outputPath);
        });
    });
}
