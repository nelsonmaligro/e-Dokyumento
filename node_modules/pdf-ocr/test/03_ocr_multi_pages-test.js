const assert = require('assert');
const inspect = require('eyespect').inspector({ maxLength: 20000 });
const path = require('path');
const should = require('should');
const fs = require('fs');
const async = require('async');
const pathHash = require('pathhash');
const pdf = require('../index.js');

describe('03 Multipage all pages OCR test', function () {
    const fileName = 'multipage.pdf';
    const relativePath = path.join('testData', fileName);
    const pdfPath = path.join(__dirname, relativePath);

    const options = {
        clean: false,
        scanFirstPageOnly: false
    };

    let hash;

    before((done) => {
        pathHash(pdfPath, (err, reply) => {
            should.not.exist(err, 'error getting sha1 hash of pdf file at path: ' + pdfPath + '. ' + err);
            should.exist(reply, 'error getting sha1 hash of pdf file at path: ' + pdfPath + '. No hash returned from hashDataAtPath');
            hash = reply;
            done();
        });
    });

    it('should extract array of text pages from multipage raw scan pdf', function (done) {
        this.timeout(240 * 1000);
        this.slow(120 * 1000);

        const processor = pdf(pdfPath, options, (err) => should.not.exist(err));

        processor.on('complete', (data) => {
            data.should.have.property('textPages');
            data.should.have.property('pdfPath');
            data.should.have.property('singlePagePdfFilePaths');
            data.textPages.length.should.eql(2, `wrong number of pages after extracting from mulitpage searchable pdf with name: ${fileName}`);

            assert.ok(pageEventFired, 'page event not fired');
            async.forEach(data.singlePagePdfFilePaths, (filePath, cb) => {
                fs.exists(filePath, (exists) => {
                    assert.ok(exists, `single page pdf file does not exist at the path: ${filePath}`);
                    cb();
                });
            }, (err) => {
                should.not.exist(err, `error in raw processing: ${err}`);
                done();
            });
        });

        processor.on('log', (data) => inspect(data, 'log data'));

        var pageEventFired = false;

        processor.on('page', (data) => {
            pageEventFired = true;
            data.should.have.property('index');
            data.should.have.property('pdfPath');
            data.should.have.property('text');
            data.pdfPath.should.eql(pdfPath);
            data.text.length.should.above(0);
        });
    });
});
