const inspect = require('eyespect').inspector({ maxLength: 20000 });
const path = require('path');
const should = require('should');
const assert = require('assert');
const fs = require('fs');
const ocr = require('../lib/ocr.js');

describe('06 OCR Test', function () {
    it('should extract text from tiff file via tesseract ocr', function (done) {
        this.timeout(100 * 1000);
        this.slow(20 * 1000);

        const fileName = 'single_page.tif';
        const relativePath = path.join('testData', fileName);
        const tiffPath = path.join(__dirname, relativePath);

        fs.exists(tiffPath, function (exists) {
            assert.ok(exists, `tiff file does not exist at path: ${tiffPath}`);

            ocr(tiffPath, (err, extract) => {
                should.not.exist(err);
                should.exist(extract);
                extract.length.should.be.above(20, 'wrong ocr output');
                done();
            });
        });
    });
});
