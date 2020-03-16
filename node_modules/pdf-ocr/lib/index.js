const events = require('events');
const pathHash = require('pathhash');
const fs = require('fs');
const async = require('async');
const splitPdf = require('./splitPdf.js');
const convertToTiff = require('./convertToTiff.js');
const ocr = require('./ocr.js');

module.exports = class PdfOcr extends events.EventEmitter {
    constructor(options) {
        super();
        this.scanOptions = options || this.scanOptions;
    }

    process(pdfPath, options) {
        const self = this;
        const textPages = [];
        let splitOutput;
    
        options = options || { scanFirstPageOnly : false };
        options.clean = options.clean || true;
    
        fs.exists(pdfPath, (exists) => {
            if (!exists) {
                var error = `file does not exist at path: ${pdfPath}`;
                self.emit('error', { error, pdfPath });
                return;
            }
    
            pathHash(pdfPath, (error, hash) => {
                if (error) {
                    error = `error hashing file at path: ${pdfPath}. ${error}`;
                    self.emit('error', { error, pdfPath });
                    return;
                }
    
                splitPdf(pdfPath, this.scanOptions, (error, output) => {
                    if (error) {
                        self.emit('error', { error, pdfPath });
                        return;
                    }
    
                    if (!output) {
                        error = 'no files returned from split';
                        self.emit('error', { error, pdfPath });
                        return;
                    }
    
                    self.emit('log', `finished splitting pages for file at path: ${pdfPath}`);
                    splitOutput = output;
                    
                    const pdfFiles = output.files;
                    
                    if (!pdfFiles || !pdfFiles.length) {
                        error = 'error, no pages where found in pdf document';
                        self.emit('error', { error, pdfPath });
                        return;
                    }
    
                    let index = 0;
                    let numPages = pdfFiles.length;
                    const singlePagePdfFilePaths = [];
                    
                    async.forEachSeries(pdfFiles, (pdfFile, cb) => {
                        const quality = options.quality ? options.quality : 300;
    
                        convertToTiff(pdfFile.filePath, quality, (err, tiffPath) => {
                            const zeroBasedNumPages = numPages - 1;
                            
                            self.emit('log', `converted page to tiff file, page ${index} of ${zeroBasedNumPages}`);
                            
                            if (err) { 
                                return cb(err); 
                            }
                            
                            const ocrFlags = options.ocrFlags ? options.ocrFlags : ['-psm 6'];
    
                            ocr(tiffPath, ocrFlags, (err, text) => {
                                fs.unlink(tiffPath, (tiffError, reply) => {
                                    if (tiffError) {
                                        err += `, error removing tif file: ${tiffError}`;
                                    }
    
                                    if (err) { 
                                        return cb(err); 
                                    }
                                    
                                    self.emit('log', `raw ocr: page ${index} of ${zeroBasedNumPages} complete`);
                                    
                                    singlePagePdfFilePaths.push(pdfFile.filePath);
                                    self.emit('page', { hash, text, index, numPages, pdfPath, singlePagePdfPath: pdfFile.filePath });
                                    textPages.push(text);
                                    index++;
                                    cb();
                                });
                            });
                        });
                    }, (err) => {
                        if (err) {
                            self.emit('error', err);
                            return;
                        }
    
                        self.emit('complete', { hash, textPages, pdfPath, singlePagePdfFilePaths });
                    });
                });
            });
        });
    }
}
