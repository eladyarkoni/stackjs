Class('DB::STDatabase', {

	name: 'StackDB',

	saveProject: function(model) {
		this.save('projects', {
			id: model.id,
			version: model.version,
			name: model.name,
			type: model.type,
			files: model.files
		});
	},

	saveProjectIfNotExists: function(model) {
		var self = this;
		this.getProject(model.id, function(items){
			if (items.length === 0) {
				self.saveProject(model);
			}
		});
	},

	getProject: function(id, callback) {
		this.get('projects', {id: id}, callback);
	},

	getProjects: function(callback) {
		this.get('projects', {}, callback);
	},

	deleteProject: function(id, callback) {
		this.delete('projects', {id: id}, callback);
	}
});