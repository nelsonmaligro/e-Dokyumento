
  const path = require('path')
  const pdf_extract = require('pdf-extract')

  const absolute_path_to_pdf = path.resolve(process.argv.splice(2)[0]);
  //const absolute_path_to_pdf = path.resolve(pathPDF);


  const options = {
    type: 'text', // perform ocr to get the text within the scanned image
    ocr_flags: ['--psm 1'], // automatically detect page orientation

  }

  const processor = pdf_extract(absolute_path_to_pdf, options, ()=>console.log("Starting…"));
  processor.on('complete', data => callback(null, data));
  processor.on('error', callback);
  var strTxt ='';
  function callback (error, data) { error ? console.error(error) :
     data.text_pages.forEach(function(data){
       strTxt+=data;
   });
   console.log(strTxt);
  };
