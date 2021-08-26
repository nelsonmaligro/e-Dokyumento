/*
Helper Modules for PDF Operations
- Handles signing, drawing, merging, and annotating PDF

@module PDFLib
@author Nelson Maligro
@dependency PDF-lib from github.com/Hopding/pdf-lib
@copyright 2020
@license GPL
*/
const fs = require('fs');
const qrcode = require('qrcode');
const path = require('path');
const dateformat = require('dateformat');
//import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
const  { degrees, PDFDocument, rgb, StandardFonts}  = require('pdf-lib');
const dbhandle = require('./dbhandle');
var drive = 'D:/Drive/';
dbhandle.settingDis((setting)=>{
  drive = setting.maindrive;
  //Get page from selected page number and save to PDF-temp
  exports.mergePDF = async function (srcPath, dstPath, pagePath, num, callback) {
    const url = srcPath
    //calculate line nr
    if ((fs.existsSync(url)) && (fs.existsSync(pagePath))){
      let logFileSrc = pagePath.split('/'); let logFileDst = url.split('/');
      dbhandle.actlogFilterOne(logFileSrc[logFileSrc.length-1],()=>{
        dbhandle.actlogSignEdit(logFileSrc[logFileSrc.length-1], logFileDst[logFileDst.length-1]);
      });
      var existingPdfBytes = fs.readFileSync(path.resolve(url));
      const pdfDoc = await PDFDocument.load(existingPdfBytes, {ignoreEncryption: true});
      var pagePdfBytes = fs.readFileSync(path.resolve(pagePath));
      const pagepdfDoc = await PDFDocument.load(pagePdfBytes, {ignoreEncryption: true});

      const newpdfDoc = await PDFDocument.create()
      const pages = pdfDoc.getPages();
      for (var x=0; x < pages.length; x++){
        let disPage = null;
        if (x != num) [disPage] = await newpdfDoc.copyPages(pdfDoc,[x]);
        else [disPage] = await newpdfDoc.copyPages(pagepdfDoc,[0]);
        newpdfDoc.addPage(disPage);
      }
      const pdfBytes = await newpdfDoc.save();
      fs.writeFileSync(dstPath, pdfBytes);
    } else console.log('sign PDF not found');
    callback();
  };
  //Get page from selected page number and save to PDF-temp
  exports.returnPage = async function (srcPath, dstPath, num, callback) {
    const url = srcPath
    if (fs.existsSync(url)){
      var existingPdfBytes = fs.readFileSync(path.resolve(url));
      const pdfDoc = await PDFDocument.load(existingPdfBytes, {ignoreEncryption: true});
      const newpdfDoc = await PDFDocument.create()
      //const pages = pdfDoc.getPages();
      //const firstPage = pages[num];
      const [disPage] =  await newpdfDoc.copyPages(pdfDoc,[num]);
      newpdfDoc.addPage(disPage);
      const pdfBytes = await newpdfDoc.save();
      fs.writeFileSync(dstPath, pdfBytes);
      callback();
    } else console.log('error');
  };
  //add signature into main documents
  exports.addSignMainDoc = async function (group, id, srcPath, dstPath, disX, disY, nodate, diswidth, disheight, callback) {
    const url = srcPath; var serDate = Date.now().toString();
    if (fs.existsSync(url)){
      //generate QR Code and save to file
      if (!fs.existsSync(drive+group+'/Signature')) fs.mkdirSync(drive+group+'/Signature');
      if (!fs.existsSync(drive+group+'/Signature/' + id +'.png')) fs.copyFileSync('temp/signature/default.png',drive+group+'/Signature/' + id +'.png');
      if (!fs.existsSync(drive+group+'/Signature/' + id +'.qr.png')) fs.copyFileSync('temp/signature/default.qr.png',drive+group+'/Signature/' + id +'.qr.png');

      qrcode.toFile(drive+group+'/Signature/' + id +'.qr.png', serDate, { color: {dark: '#00F', light: '#0000' } }, async function (err) {
        var existingPdfBytes = fs.readFileSync(path.resolve(url));
        const pdfDoc = await PDFDocument.load(existingPdfBytes, {ignoreEncryption: true});
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();
        //get QR Code file image
        const pngImgQRBytes = fs.readFileSync(drive+group+'/Signature/' + id +'.qr.png')
        const pngImgQR = await pdfDoc.embedPng(pngImgQRBytes)
        //get Signature file Image
        const pngImageBytes = fs.readFileSync(drive+group+'/Signature/' + id +'.png')
        const pngImage = await pdfDoc.embedPng(pngImageBytes)
        const pngDims = pngImage.scale(0.5)
        var varX = (width/parseInt(diswidth,10));
        var varY = (height/parseInt(disheight,10));
        let logfile = dstPath.split('/');
        dbhandle.actlogsCreate(id, Date.now(), 'Sign document with e-signature', logfile[logfile.length-1], serDate);
        firstPage.drawText(serDate, { //insert date serial for document record number
          x: (parseInt(disX, 10) * varX) -5, //- pngDims.width / 2 + 75,
          y: ((height - (parseInt(disY, 10)  * varY)) - (90 * varY))  + 60, //- pngDims.height,
          size: 5,
          font: helveticaFont,
          color: rgb(0, 0.53, 0.71),
        });
        firstPage.drawImage(pngImgQR, {//draw QR into page
          x: (parseInt(disX, 10) * varX) - 52, //x: 5,
          y: ((height - (parseInt(disY, 10)  * varY)) - (90 * varY)) + 20, //y: varY,
          width: 50,
          height: 50,
        });
        if (nodate!='true'){
          firstPage.drawText(dateformat(Date.now(),"dd mmm yyyy"), { //date signee
            x: (parseInt(disX, 10) * varX) + 90,
            y: ((height - (parseInt(disY, 10) * varY)) - (90 * varY)) + 35,
            size: 11,
            font: helveticaFont,
            color: rgb(0, 0.10, 0.50),
          });
        }
        firstPage.drawImage(pngImage, {
          x: (parseInt(disX, 10) * varX) - 17, //- pngDims.width / 2 + 75,
          y: (height - (parseInt(disY, 10) * varY)) - (90 * varY), //- pngDims.height,
          width: pngDims.width,
          height: pngDims.height,
        })
        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(dstPath, pdfBytes);
        callback();
      });
    } else console.log('error');


  };
  //add signature into main documents
  exports.addLineDoc = async function (group, id, srcPath, tmpPath,  callback) {
    const url = srcPath;
    if (fs.existsSync(url)){
      var existingPdfBytes = fs.readFileSync(path.resolve(url));
      const pdfDoc = await PDFDocument.load(existingPdfBytes, {ignoreEncryption: true});
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      //save drawn image
      const pngImageBytes = fs.readFileSync(tmpPath+id+'.new.drw.png')
      const pngImage = await pdfDoc.embedPng(pngImageBytes)

      firstPage.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      })
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(tmpPath+id+'.res.pdf', pdfBytes);
      callback();
    } else console.log('error');


  };
  //Add signature into routing slip
  exports.addSignRoutePDF = async function (level, cnt, srcPath, dstPath, req, group, callback) {
    var url = srcPath; var actBr = req.body.branch;
    if ((req.body.view == 'openroute') && (level.toUpperCase()!='SECRETARY')) actBr = group;
    let disFrom = group.toUpperCase();
    if (level.toUpperCase()=='SECRETARY') disFrom = 'Admin';
    //calculate line nr
    var disX = 250 ;
    var disY = 469 + 87;
    //if ((level.toUpperCase()=='CO') || (level.toUpperCase()=='GM')){
    //  disY = disY + 87;
    //} else if ((level.toUpperCase()=='DEP') || (level.toUpperCase()=='EAGM')){
    //  disY = disY + 58;
    //}else {
      for (x=1; x<cnt; x++){
        disY = disY - 29;
      }
    //}
    if (fs.existsSync(url)){
      var existingPdfBytes = fs.readFileSync(path.resolve(url));
      const pdfDoc = await PDFDocument.load(existingPdfBytes, {ignoreEncryption: true});
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      const textSize = 12;
      const textWidth = helveticaFont.widthOfTextAtSize(req.body.user, textSize);
      const textHeight = helveticaFont.heightAtSize(textSize);
      if ((cnt==1)) {
        firstPage.drawText(req.body.subject, { //subject
          x: 140,
          y: 680,
          size: textSize,
          font: helveticaFont,
          color: rgb(0, 0.53, 0.71),
        });
        firstPage.drawText(actBr.toString().toUpperCase(), { //action branch
          x: 160,
          y: 625,
          size: textSize,
          font: helveticaFont,
          color: rgb(0, 0.53, 0.71),
        });
      }
      firstPage.drawText(dateformat(Date.now(),"dd mmm yyyy"), { //date signee
        x: disX - 190,
        y: disY,
        size: textSize,
        font: helveticaFont,
        color: rgb(0, 0.53, 0.71),
      });
      firstPage.drawText(disFrom, { //from
        x: disX - 120,
        y: disY,
        size: textSize-3,
        font: helveticaFont,
        color: rgb(0, 0.53, 0.71),
      });
      if (req.body.branch.toString().toUpperCase().includes('ALL BRANCHES')){
        firstPage.drawText('All Branches', { //to branches
          x: disX - 50,
          y: disY + 13,
          size: textSize -3,
          font: helveticaFont,
          color: rgb(0, 0.53, 0.71),
        }); let newTo = req.body.branch.toString().toUpperCase().replace('ALL BRANCHES','');
        newTo = newTo.substring(0,10);
        firstPage.drawText(newTo, { //to
          x: disX - 50,
          y: disY,
          size: textSize - 3,
          font: helveticaFont,
          color: rgb(0, 0.53, 0.71),
        });
      } else {
        firstPage.drawText(req.body.branch.toString().substring(0,10), { //to
          x: disX - 50,
          y: disY,
          size: textSize -3,
          font: helveticaFont,
          color: rgb(0, 0.53, 0.71),
        });
      }
      firstPage.drawText(req.body.action.toString(), { //action required
        x: disX + 125,
        y: disY,
        size: textSize,
        font: helveticaFont,
        color: rgb(0, 0.53, 0.71),
      });
      if (req.body.remark.length > 30){
        firstPage.drawText(req.body.remark.substring(0,35), { //remark
          x: disX + 150,
          y: disY + 13,
          size: textSize,
          font: helveticaFont,
          color: rgb(0, 0.53, 0.71),
        });
        firstPage.drawText(req.body.remark.substring(35), { //remark
          x: disX + 150,
          y: disY,
          size: textSize,
          font: helveticaFont,
          color: rgb(0, 0.53, 0.71),
        });
      }else {
        firstPage.drawText(req.body.remark, { //remark
          x: disX + 150,
          y: disY,
          size: textSize,
          font: helveticaFont,
          color: rgb(0, 0.53, 0.71),
        });
      }

      firstPage.drawText(req.body.user, {//branch chief
        x: disX + 22,
        y: disY + 13,
        size: textSize,
        font: helveticaFont,
        color: rgb(0, 0.53, 0.71),
      });
      firstPage.drawText(Date.now().toString(), { //date for record number
        x: disX + 20,
        y: disY,
        size: textSize,
        font: helveticaFont,
        color: rgb(0, 0.53, 0.71),
      });
      firstPage.drawRectangle({ //draw rectangle on signature
        x: disX + 20,
        y: disY + 13,
        width: 80,
        height: textHeight,
        borderColor: rgb(1, 0, 0),
        borderWidth: 1.5,
      });
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(dstPath, pdfBytes);

    } else console.log('Routing Slip not found');
    callback();
  };
});
