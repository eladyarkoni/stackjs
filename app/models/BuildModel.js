Class('BuildModel', {

	zip: null,
	dirs: [],
	files: [],
	BUILD_DIR: '/build',
	INDEX_FILE_NAME: 'index.html',
	indexFilePath: null,

	BuildModel: function() {
		this.zip = new JSZip();
		this.dirs.push(this.BUILD_DIR);
	},

	file: function(path, data) {
		if (path.search(/index\.html/) !== -1) {
			this.indexFilePath = path;
		}
		this.files.push([this.BUILD_DIR + "/" + path, data]);
		return this.zip.file(path, data);
	},

	folder: function(path) {
		this.dirs.push(this.BUILD_DIR + "/" + path);
		return this.zip.folder(path);
	},

	getArchiveBlob: function() {
		return this.zip.generate({type: 'blob'});
	},

	open: function(directory, success) {
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
		dirhelper(this.dirs, 0, function(){
			filehelper(self.files, 0, function(){
				App.filemanager.readFile(self.BUILD_DIR + "/" + self.indexFilePath, function(content, entry){
					success(entry.toURL());
				});
			});
		});
	}
});