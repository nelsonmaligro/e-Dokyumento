var path = require('path');
var temp = require('temp');
var exec = require('child_process').exec;
var fs = require('fs');
var walk = require('walk');
var async = require('async');

module.exports = (pdfPath, options, callback) => {

    options.scanFirstPageOnly = options.scanFirstPageOnly || false;

    function fileExist(filePath, callback) {
        fs.exists(filePath, (exists) => {
            if (!exists) {
                return callback(`no file at path: ${filePath}`);
            }

            return callback();
        });
    }

    function deleteDocData(callback) {
        const folder = path.join(__dirname, '..');
        const docDataPath = path.join(folder, 'doc_data.txt');
        
        fs.exists(docDataPath, (exists) => {
            if (!exists) {
                return callback();
            }

            fs.unlink(docDataPath, callback);
        });
    }

    function getPdfs(directoryPath, onlyFirstPage, callback) {
        const filePaths = [];
        const walker = walk.walk(directoryPath, { followLinks: false });
        let files = null;
    
        walker.on('file', (root, stat, next) => {
            if (onlyFirstPage) {
                if (stat.name.toLowerCase().endsWith('0001.pdf')) {
                    const filePath = path.join(directoryPath, stat.name);
                    filePaths.push({ filePath, fileName: stat.name });
                }
            } else {
                if (stat.name.match(/\.pdf$/i)) {
                    const filePath = path.join(directoryPath, stat.name);
                    filePaths.push({ filePath, fileName: stat.name });
                }
            }
    
            next();
        });
    
        walker.on('end', () => {
            filePaths.sort((a, b) => {
                if (a.fileName < b.fileName) {
                    return -1;
                }
    
                if (a.fileName == b.fileName) {
                    return 0;
                }
    
                return 1;
            });
    
            const output = {
                folder: directoryPath,
                files: filePaths
            }
    
            callback(null, output);
            
            return;
        });
    }

    fileExist(pdfPath, (err) => {
        if (err) {
            return callback(err);
        }

        var outputDir = temp.path({}, 'pdfPages');

        fs.mkdir(outputDir, (err) => {
            if (err) {
                return callback(err, null);
            }

            const outputName = 'page%05d.pdf';
            const outputPath = path.join(outputDir, outputName);
            const cmd = `pdftk "${pdfPath}" burst output "${outputPath}"`;

            const child = exec(cmd, (err, stdout, stderr) => {
                if (err) {
                    const outputErr = {
                        message: 'an error occurred while splitting pdf into single pages with the pdftk burst command',
                        error: err
                    }

                    return callback(outputErr, null);
                }

                deleteDocData((err, reply) => {
                    if (err) { 
                        return callback(err);
                    }

                    return getPdfs(outputDir, options.scanFirstPageOnly, callback);
                });
            });
        });
    });
}
