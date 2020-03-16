const inspect = require('eyespect').inspector({ maxLength: 20000 });
const path = require('path');
const should = require('should');
const assert = require('assert')
const fs = require('fs');
const async = require('async');
const split = require('../lib/splitPdf.js');

describe('02 Split PDF File Test', () => {
    it('should split multi-page pdf in single page pdf files', function (done) {
        this.timeout(10 * 1000);
        this.slow(2 * 1000);

        const fileName = 'multipage.pdf';
        const relativePath = path.join('testData', fileName);
        const pdfPath = path.join(__dirname, relativePath);
        const scanOptions = { scanFirstPageOnly: false };

        split(pdfPath, scanOptions, (err, output) => {
            should.not.exist(err);
            should.exist(output);
            output.should.have.property('folder');
            output.should.have.property('files');
            
            const files = output.files;
            
            files.length.should.equal(2, `wrong number of pages after splitting pdf with name: ${fileName}`);

            async.forEach(files, (file, cb) => {
                file.should.have.property('fileName');
                file.should.have.property('filePath');
                fs.exists(file.filePath, (exists) => {
                    assert.ok(exists, `file does not exist like it should at path: ${file.filePath}`);
                    cb();
                });
            }, (err) => {
                should.not.exist(err);
                done();
            });
        });
    });

    it('should split single page pdf into a new single page pdf files', function (done) {
        this.timeout(10 * 1000);
        this.slow(2 * 1000);

        const fileName = 'single_page.pdf';
        const relativePath = path.join('testData', fileName);
        const pdfPath = path.join(__dirname, relativePath);
        const scanOptions = { scanFirstPageOnly: false };

        split(pdfPath, scanOptions, (err, output) => {
            should.not.exist(err);
            should.exist(output);
            output.should.have.property('folder');
            output.should.have.property('files');
            
            const files = output.files;
            
            files.length.should.equal(1, `wrong number of pages after splitting searchable pdf with name: ${fileName}`);

            async.forEach(files, (file, cb) => {
                file.should.have.property('fileName');
                file.should.have.property('filePath');
                
                fs.exists(file.filePath, (exists) => {
                    assert.ok(exists, `file does not exist like it should at path: ${file.filePath}`);
                    cb();
                });
            }, (err) => {
                should.not.exist(err);
                done();
            });
        });
    });
});