const inspect = require('eyespect').inspector({ maxLength: 20000 });
const should = require('should');
const exec = require('child_process').exec;

describe('01 Command Test', () => {
    it('should have ghostscript (gs) binary on path', (done) => {
        const cmd = 'which gs';
        const child = exec(cmd, (err, stdout, stderr) => {
            should.not.exist(err, 'ghostscript not found. You will not be able to perform ocr and extract text from pdfs with scanned image. install GhostScript on your system');
            stderr.length.should.equal(0);
            should.exist(stdout);
            stdout.length.should.be.above(8);
            done();
        });
    });

    it('should have tesseract binary on path', (done) => {
        const cmd = 'which tesseract';
        
        const child = exec(cmd, (err, stdout, stderr) => {
            should.not.exist(err, 'tesseract not found. You will not be able to perform ocr and extract from pdfs with scanned images.');
            stderr.length.should.equal(0);
            should.exist(stdout);
            stdout.length.should.be.above(8);
            done();
        });
    });
});