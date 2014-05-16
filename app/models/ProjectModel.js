Class('ProjectModel', {

	id: null,
	name: null,
	version: null,
	mainView: null,
	type: null,
	files: null,

	ProjectModel: function(projectObject) {
		if (projectObject) {
			this.id = projectObject.id;
			this.version = projectObject.version || "1.0";
			this.name = projectObject.name;
			this.type = projectObject.type;
			this.files = projectObject.files;
		} else {
			this.id = "com.stackjs.sample-project";
			this.name = "Sample project";
			this.version = "1.0";
			this.type = "root";
			this.files = [
				{
					name: 'Views',
					type: 'folder',
					files: []
				},
				{
					name: 'Services',
					type: 'folder',
					files: []
				}
			];
			this.addViewObject('empty', 'SampleView', true);
			this.addDatabaseObject('MyDatabase', 'MyDatabase', 10 * 1024 * 1024);
		}
	},

	addViewObject: function(templateName, viewName, mainView) {
		var self = this;

		Server().getExample(templateName, 'view', function(example) {

			example.style = example.style.replace(/%viewClassName%/g, viewName);
			example.style = example.style.replace(/%viewName%/g, viewName);
			example.template = example.template.replace(/%viewClassName%/g, viewName);
			example.template = example.template.replace(/%viewName%/g, viewName);
			example.view = example.view.replace(/%viewName%/g, viewName);
			example.view = example.view.replace(/%viewClassName%/g, viewName);

			self.files[0].files.push({
				name: viewName,
				templateName: templateName,
				type: 'view',
				data: example
			});

			if (mainView) {
				self.mainView = viewName;
			}
		});
	},

	deleteObject: function(name) {
		for (var j = 0; j < this.files.length; j++) {
			for (var i = 0; i < this.files[j].files.length; i++) {
				if (this.files[j].files[i].name === name) {
					this.files[j].files.splice(i, 1);
					if (name === this.mainView) {
						this.mainView = null;
					}
				}
			}
		}
	},

	addServerObject: function(className, domain) {
		var self = this;
		Server().getExample('server', 'service', function(example) {
			example.service = example.service.replace(/%className%/g, className);
			example.service = example.service.replace(/%domain%/g, domain);
			self.files[1].files.push({
				name: className,
				templateName: 'server',
				type: 'service',
				data: example
			});
		});
	},

	addDatabaseObject: function(className, name, size) {
		var self = this;
		Server().getExample('database', 'service', function(example) {
			example.service = example.service.replace(/%className%/g, className);
			example.service = example.service.replace(/%dbName%/g, name);
			example.service = example.service.replace(/%dbSize%/g, size);
			self.files[1].files.push({
				name: className,
				templateName: 'database',
				type: 'service',
				data: example
			});
		});
	},

	generateProjectFileName: function(extension) {
		return this.id + "_" + this.version + "v." + extension;
	},

	exportProject: function(params) {
		var object = {
			id: this.id,
			version: this.version,
			name: this.name,
			type: this.type,
			files: this.files
		};

		App.filemanager.writeFile(this.generateProjectFileName("stk"), btoa(JSON.stringify(object)), function(file) {
			var url = file.toURL();
			params.success(url);
		}, function(){});
	},

	download: function(options) {
		options = options || {};
		options.rootDirectory = options.rootDirectory || 'project';
		options.success = options.success || function(){};
		options.error = options.error || function(){};
		options.progress = options.progress || function(){};
		var self = this;

		if (self.mainView === null) {
			return options.error({type: 'NoMainViewFound'});
		}
		
		var createProjectDirs = function(build, dirs, success, error) {
			if (dirs.length) {
				var dir = dirs.pop();
				build.folder(dir);
				createProjectDirs(build, dirs, success, error);
			} else {
				success();
			}
		};

		var createProjectBaseFiles = function(build, baseFiles, success, error) {
			if (baseFiles.length) {
				var fileName = baseFiles.pop();
				var fileCreator = baseFiles.pop();
				fileCreator(function(data){
					build.file(fileName, data);
					createProjectBaseFiles(build, baseFiles, success, error);
				}, error);
			} else {
				success();
			}
		};

		var createProjectViewFiles = function(build, files, success, error) {
			if (files.length) {
				var file = files.pop();
				build.file(options.rootDirectory + '/app/views/' + file.name + ".js", file.data.view);
				build.file(options.rootDirectory + '/app/templates/' + file.name + ".html", file.data.template);
				build.file(options.rootDirectory + '/css/' + file.name + ".css", file.data.style);
				createProjectViewFiles(build, files, success, error);
			} else {
				success();
			}
		};

		var createProjectServicesFiles = function(build, files, success, error) {
			if (files.length) {
				var file = files.pop();
				build.file(options.rootDirectory + '/app/services/' + file.name + ".js", file.data.service);
				createProjectViewFiles(build, files, success, error);
			} else {
				success();
			}
		};

		var projectDirectories = [
			options.rootDirectory,
			options.rootDirectory + "/lib",
			options.rootDirectory + "/config",
			options.rootDirectory + "/assets",
			options.rootDirectory + "/assets/images",
			options.rootDirectory + "/assets/sounds",
			options.rootDirectory + "/css",
			options.rootDirectory + "/app",
			options.rootDirectory + "/app/services",
			options.rootDirectory + "/app/views",
			options.rootDirectory + "/app/templates"
		];

		var projectBaseFiles = [
			options.rootDirectory + "/lib/stackjs.mobile.js", function(success, error) {
				Server().getLibrary(function(data){
					success(CodeService().minifyCode(data));
				}, error);
			},
			options.rootDirectory + "/config/config.json", function(success, error) {
				success("{}");
			},
			options.rootDirectory + "/css/style.css", function(success, error) {
				var mainCss = "";
				for (var i = 0; i < self.files[0].files.length; i++) {
					if (self.files[0].files[i].type === 'view') {
						mainCss += "@import url("+self.files[0].files[i].name +".css"+");";
					}
				}
				Server().getStyleTemplate(success, mainCss, options.error);
			},
			options.rootDirectory + "/app/main.js", function(success, error) {
				Server().getMainTemplate(self.mainView, success, error);
			},
			options.rootDirectory + "/index.html", function(success, error) {
				var allJSScripts = [];
				allJSScripts.push('<script type="text/javascript" src="lib/stackjs.mobile.js"></script>');
				for (var i = 0; i < self.files[1].files.length; i++) {
					allJSScripts.push('<script type="text/javascript" src="app/services/'+self.files[1].files[i].name+'.js"></script>');
				}
				for (var i = 0; i < self.files[0].files.length; i++) {
					if (self.files[0].files[i].type === 'view') {
						allJSScripts.push('<script type="text/javascript" src="app/views/'+self.files[0].files[i].name+'.js"></script>');
					}
				}
				Server().getHtmlTemplate(success, self.name, allJSScripts.join("\n"), options.error);
			}
		];

		var build = new BuildModel();
		// create project directories
		createProjectDirs(build, projectDirectories.reverse(), function(){
			options.progress(20);
			// create project base files
			createProjectBaseFiles(build, projectBaseFiles.reverse(), function(){
				options.progress(40);
				// create view files
				createProjectViewFiles(build, self.files[0].files.slice(0), function(){
					options.progress(60);
					createProjectServicesFiles(build, self.files[1].files.slice(0), function(){
						options.progress(80);
						setTimeout(function() {
							options.progress(100);
							App.filemanager.writeFile(self.generateProjectFileName("zip"), build.getArchiveBlob(), function(file) {
								var url = file.toURL();
								options.success(url, build, file);
							}, options.error);
						}, 500);
					}, options.error);
				}, options.error); 
			}, options.error);
		}, options.error);
	},

	build: function(params) {
		params.success = params.success || function(){};
		this.download({
			success: function(url, build) {
				build.open('/build/', function(buildUrl){
					params.success(buildUrl);
				});
			}
		});
	}
});