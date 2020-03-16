const path = require('path');
const fs = require('fs');
const PdfOcr = require('./lib');

module.exports = function (pdfPath, options, cb) {
    options = options || {};

    if (!pdfPath) {
        return cb('you must supply a pdf path as the first parameter and options for the second parameter.');
    }

    options.scanFirstPageOnly = options.scanFirstPageOnly || false;

    const processor = new PdfOcr(options);

    fs.exists(pdfPath, (exists) => {
        if (!exists) {
            return cb('no file exists at the path specified.');
        }

        processor.process(pdfPath, options);
        cb();
    });

    return processor;
}
