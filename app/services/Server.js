Class('Server::STServer', {

	getExample: function(name, type, callback) {
		var example = {},
			urlTemplate = 'app/examples/:file.:type.:ext';

		if (type === 'view') {
			this.get(urlTemplate, {file: name, type: type, ext: 'css'}, null, function(data){
				example.style = data;
			},null,{sync:true});

			this.get(urlTemplate, {file: name, type: type, ext: 'html'}, null, function(data){
				example.template = data;
			},null,{sync:true});

			this.get(urlTemplate, {file: name, type: type, ext: 'js'}, null, function(data){
				example.view = data;
			},null,{sync:true});
		} else if (type === 'service') {
			this.get(urlTemplate, {file: name, type: type, ext: 'js'}, null, function(data){
				example.service = data;
			},null,{sync:true});
		}
		callback(example);
	},

	getLibrary: function(success, error) {
		this.get('lib/stackjs.mobile.js', null, null, function(data){
			success(data);
		},error,{sync:true});
	},

	getMainTemplate: function(mainViewString, success, error) {
		this.get('app/examples/main.js', null, null, function(data) {
			data = data.replace(/%mainView%/g, mainViewString);
			success(data);
		},error,{sync:true});
	},

	getHtmlTemplate: function(success, projectName, allJSScripts, error) {
		this.get('app/examples/index.html', null, null, function(data){
			data = data.replace(/%projectName%/g, projectName);
			data = data.replace(/%allJSScripts%/g, allJSScripts);
			success(data);
		},error,{sync:true});
	},

	getStyleTemplate: function(success, allCssFiles, error) {
		this.get('app/examples/style.css', null, null, function(data){
			data = data.replace(/%allCssFiles%/g, allCssFiles);
			success(data);
		},error,{sync:true});
	},

	getDemoProjects: function(success, error) {
		this.get('app/demos/todos.stk', null, null, function(data){
			success([data]);
		}, error);
	}

});