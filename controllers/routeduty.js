exports.routeThis = function routeThis(req, res, drivetmp, drive){
  var path = require('path');
  var fs = require('fs');
  var oldsrc =path.resolve(drivetmp+"/" + req.body.fileroute);
  var newsrc =path.resolve(drivetmp+"/" + req.body.newfile);
  var dstincoming = drive + "incoming/" + req.body.newfile;
  //Auto rename files
  fs.rename(oldsrc, newsrc, function(err) {
    if (err) throw err;
      console.log('Rename complete!');
      //copy to incoming
      fs.copyFile(newsrc, dstincoming, function(err) {
        if (err) throw err;
          console.log("Successfully copied to incoming!");
          //remove from temp after copy to incoming
          fs.unlink(newsrc, function(err) {
            if (err) throw err;
              console.log('File was removed from temp');
              fs.readdir(drivetmp, function(err,items){
                if (err) throw err;var def="empty";
                if (items.length > 0) {def=items[0];}
                res.json({layout:'layout-user', files:items, disp:def});
              });
          });
          //copy to Branches after incoming
          var dst =  "";
          for (var i = 0; i < req.body.branch.length; i++){
            if (!req.body.branch.includes('All Branches')){
              dst = drive + req.body.branch[i] +"/"+ req.body.newfile;
              fs.copyFile(dstincoming, dst, function(err) {
                if (err) throw err;
                  console.log("Successfully copied to branches");
              });
            };
          };
          //if all branches
          allbranch = ['n6a','n6b','n6c','n6d','n6e','n6f'];
          if (req.body.branch.includes('All Branches')){
            for (var i = 0; i< allbranch.length; i++){
              if (!req.body.branch.includes(allbranch[i])){
                dst = drive + allbranch[i] +"/"+ req.body.newfile;
                fs.copyFile(dstincoming, dst, function(err) {
                  if (err) throw err;
                    console.log("Successfully copied to branches");
                });
              };
            };
          };
        });
      });

};
