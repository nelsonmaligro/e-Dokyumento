# pdf-ocr
node module that will do OCR on PDFs that do not contain searchable text.

## Inspired from pdf-extract
[https://www.npmjs.com/package/pdf-extract] by Noah Isaacson.  Many of the ideas initial design are from this project.

## Differences between pdf-ocr and pdf-extract
- pdf-extract instructions were outdated when it came to installing dependant binaries. I ran into a couple of pitfalls and wanted to make sure others did not if they used this version.
- Removed the instructions to update the trained data for tesseract, since version 3.05.01 was newer then the instructions on pdf-extract.
- Updated code to use ES6 javascript syntax.
- I Needed an option to OCR just the first page of the PDF.
- This version currently does not OCR searchable PDFs.  Plenty of options out there that does this.
- If you need to OCR searchable PDFs, I recommend using pdf-extract instead. (However, use the instructions below to get the dependant binaries.)

## Installation

`npm install pdf-ocr --save` 

After installing pdf-ocr, the following binaries listed below will need to be on your system, as well as in the paths in your environment settings.

### OSX

**pdftk**
- Grab the package installer at [http://www.pdflabs.com/docs/install-pdftk/](http://www.pdflabs.com/docs/install-pdftk/)

- If you're installing on OSX Sierra or High Sierra, you'll need to make sure you use the package installer pdftk_server-2.02-mac_osx-10.11-setup.pkg

- Other versions, seemed to hang the process.  If the tests fail, this could the main reason why.

**ghostscript**
``` bash
brew install gs
```

**tesseract** 

`brew install tesseract`

After tesseract is installed you need to install the alphanumeric config
``` bash
cd <root of this module>
cp "./share/configs/alphanumeric" "/usr/local/Cellar/tesseract/3.05.01/share/tessdata/configs/alphanumeric"
```

### Ubuntu
**pdftk**
```bash
apt-get install pdftk
```

**pdftotext**
``` bash
apt-get install poppler-utils
```

**ghostscript**
``` bash
apt-get install ghostscript
```

**tesseract**
``` bash
apt-get install tesseract-ocr
```

For the OCR to work, you need to have the tesseract-ocr binaries available on your path. If you only need to handle ASCII characters, the accuracy of the OCR process can be increased by limiting the tesseract output. To do this copy the *alphanumeric* file included with this module into the *tess-data* folder on your system.

``` bash
cd <root of this module>
cp "./share/configs/alphanumeric" "/usr/share/tesseract-ocr/tessdata/configs/alphanumeric"
```

### Windows

**pdftk** can be installed using the PDFtk Server installer found here: https://www.pdflabs.com/tools/pdftk-server/

**ghostscript** for Windows can be found at: http://www.ghostscript.com/download/gsdnld.html
- Make sure you download the General Public License and the correct version (32/64bit).

- Install it and go to the installation folder (default: *"C:\Program Files\gs\gs9.19"*) and go into the **bin** folder.

- Rename the *gswin64c* to *gs*, and add the bin folder to your PATH.

**tesseract**
- Download at: [https://sourceforge.net/projects/tesseract-ocr-alt/files/](https://sourceforge.net/projects/tesseract-ocr-alt/files/)

- *tesseract-ocr-setup-3.02.02.exe* is a version that I know works.
