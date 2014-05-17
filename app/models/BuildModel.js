Class('BuildModel', {

	zip: null,
	dirs: [],
	files: [],
	BUILD_DIR: '/build',
	INDEX_FILE_NAME: 'index.html',
	indexFilePath: null,
	date: null,
	currentBuildDir: null,

	BuildModel: function() {
		this.date = new Date();
		this.zip = new JSZip();
		this.currentBuildDir = this.BUILD_DIR + '/' + 'build_' + this.date.getTime();
		this.dirs.push(this.BUILD_DIR);
		this.dirs.push(this.currentBuildDir);
	},

	file: function(path, data) {
		if (path.indexOf(this.INDEX_FILE_NAME) !== -1) {
			this.indexFilePath = path;
		}
		this.files.push([this.currentBuildDir + "/" + path, data]);
		return this.zip.file(path, data);
	},

	folder: function(path) {
		this.dirs.push(this.currentBuildDir + "/" + path);
		return this.zip.folder(path);
	},

	getArchiveBlob: function() {
		return this.zip.generate({type: 'blob'});
	},

	open: function(success) {
		var self = this;
		var dirhelper = function(dirs, position, callback) {
			var dir;
			if (position < dirs.length) {
				dir = dirs[position];
				App.filemanager.createDir(dir, function(){
					dirhelper(dirs, position + 1, callback);
				});
			} else {
				callback();
			}
		};
		var filehelper = function(files, position, callback) {
			var file;
			if (position < files.length) {
				file = files[position];
				App.filemanager.writeFile(file[0], file[1], function(){
					filehelper(files, position + 1, callback);
				});
			} else {
				callback();
			}
		};
		dirhelper(self.dirs, 0, function(){
			filehelper(self.files, 0, function(){
				App.filemanager.readFile(self.currentBuildDir + "/" + self.indexFilePath, function(content, entry){
					success(entry.toURL());
				});
			});
		});
		
	}
});