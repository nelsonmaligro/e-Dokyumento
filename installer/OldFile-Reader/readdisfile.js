var fs = require('fs');
//var PdfReader = require("pdfreader").PdfReader;
var filereader = require('./filereader');
var XLSX = require('xlsx');
exports.readFilesHandler = function readFilesHandler(fileName, path){

        var filecontent = "";
        fs.readFile(path + fileName, function(err, data){
            let filePath = path + fileName;
            let filebuffer = data;
            let filename = fileName;
            var fileextension = filereader.getFileExtension(filename);
            switch (fileextension) {
                case '.pdf':
                    filereader.readPDFFile(filePath, filebuffer, function(res){
                    if (err) {}
                    filecontent = res;
                  });
                    break;
                case '.doc':
                case '.docx':
                    filereader.extract(filePath).then(function(res, err) {
                        if (err) {}
                        filecontent = res;
                    });
                    break;
                case '.xls':
                case '.xlsx':
                    var result = {};
                    data = new Uint8Array(data);
                    var workbook = XLSX.read(data, {
                        type: 'array'
                    });
                    workbook.SheetNames.forEach(function(sheetName) {
                        var roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
                            header: 1
                        });
                        if (roa.length) result[sheetName] = roa;
                    });
                    filecontent = JSON.stringify(result);
                    break;
                case '.txt':
                case '.csv':
                    filecontent = data;
                    break;
                default:
                    filecontent = filename;
            }
            console.log(`This is file content ==> ${filecontent}`);
        });
};
