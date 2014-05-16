Class('BuildModel', {

	zip: null,

	BuildModel: function() {
		this.zip = new JSZip();
	},

	file: function(path, data) {
		return this.zip.file(path, data);
	},

	folder: function(path) {
		return this.zip.folder(path);
	},

	generate: function(params) {
		return this.zip.generate(params);
	}
});