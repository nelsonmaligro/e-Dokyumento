var fs = require('fs');

module.exports = {
 /**
   * Browse directory
   *
   * @param  {String} path
   * @param  {String} level
  */
  browse: function(path, level, tree, dirs) {
  	if(path){
	  	if(!tree)
	  		var tree = {};
	  	if(!level)
	  		var level = path;
	  	if(!dirs){
	  		var dirs = [];
	  		dirs.push(path);
	  	}


	  	var inputs = fs.readdirSync(path);
		var dir = dirs;
		var key = level.name?level.name:level;
		tree[key] = [];

		for(var i=0;i<inputs.length;i++){
			var stats = fs.statSync(path+"/"+inputs[i]);
			var element = {type: stats.isFile()?"file":"dir", name:inputs[i], src:path+"/"+inputs[i]};
			tree[key].push(element);

			if(!stats.isFile()){
				dir.push(element);
			}
		}


		if(dirs.length == dir.length && dirs.indexOf(level) == dirs.length-1){
			return tree;
		}
		else{
			dirs = dir;

			return this.browse(dirs[dirs.indexOf(level)+1].src, dirs[dirs.indexOf(level)+1], tree, dirs);
		}
	}
    
  },

  // Get All files into a directory
  browseFiles: function(path, level, tree, dirs) {
  	if(path){
	  	if(!tree)
	  		var tree = [];
	  	if(!level)
	  		var level = path;
	  	if(!dirs){
	  		var dirs = [];
	  		dirs.push(path);
	  	}


	  	var inputs = fs.readdirSync(path);
		var dir = dirs;
		var key = level.name?level.name:level;

		for(var i=0;i<inputs.length;i++){
			var stats = fs.statSync(path+"/"+inputs[i]);
			var element = {type: stats.isFile()?"file":"dir", name:inputs[i], src:path+"/"+inputs[i]};

			if(element.type == "file")
				tree.push(element);

			if(!stats.isFile()){
				dir.push(element);
			}
		}


		if(dirs.length == dir.length && dirs.indexOf(level) == dirs.length-1){
			return tree;
		}
		else{
			dirs = dir;

			return this.browseFiles(dirs[dirs.indexOf(level)+1].src, dirs[dirs.indexOf(level)+1], tree, dirs);
		}
	}
    
  },

   // Get All directories into a directory
  browseDirs: function(path, level, tree, dirs) {
  	if(path){
	  	if(!tree)
	  		var tree = [];
	  	if(!level)
	  		var level = path;
	  	if(!dirs){
	  		var dirs = [];
	  		dirs.push(path);
	  	}


	  	var inputs = fs.readdirSync(path);
		var dir = dirs;
		var key = level.name?level.name:level;

		for(var i=0;i<inputs.length;i++){
			var stats = fs.statSync(path+"/"+inputs[i]);
			var element = {type: stats.isFile()?"file":"dir", name:inputs[i], src:path+"/"+inputs[i]};

			if(element.type == "dir")
				tree.push(element);

			if(!stats.isFile()){
				dir.push(element);
			}
		}


		if(dirs.length == dir.length && dirs.indexOf(level) == dirs.length-1){
			return tree;
		}
		else{
			dirs = dir;

			return this.browseDirs(dirs[dirs.indexOf(level)+1].src, dirs[dirs.indexOf(level)+1], tree, dirs);
		}
	}
    
  },

  /**
   * Show Tree
   *
   * @param  {Object} tree
   * 
   */
  showTree: function(tree) {
    for(var id in tree){
		console.log("\n\n Level ==> "+id+"\n")
		console.log("  # Contains : ");
		for(var i in tree[id]){
			console.log("    - "+JSON.stringify(tree[id][i]));

			if(tree[id][i].type == "dir"){
				console.log("\n    * "+tree[id][i].src+" ---> "+JSON.stringify(tree[tree[id][i].src]))
			}
		}

	}
  }
};