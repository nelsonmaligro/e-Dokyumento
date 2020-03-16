const inspect = require('eyespect').inspector({ maxLength: 20000 });
const path = require('path');
const should = require('should');
const assert = require('assert');
const fs = require('fs');
const async = require('async');
const convert = require('../lib/convertToTiff.js');

describe('05 Convert Test', function () {

    it('should convert raw single page pdf to tif file', function (done) {
        this.timeout(10 * 1000);

        const fileName = 'single_page.pdf';
        const relativePath = path.join('testData', fileName);
        const pdfPath = path.join(__dirname, relativePath);

        fs.exists(pdfPath, (exists) => {
            assert.ok(exists, `file does not exist at path: ${pdfPath}`);

            convert(pdfPath, (err, tiffPath) => {
                should.not.exist(err);
                should.exist(tiffPath);
                
                fs.exists(tiffPath, (exists) => {
                    assert.ok(exists, `tiff file does not exist at path: ${tiffPath}`);
                    done();
                });
            });
        });
    });
});
