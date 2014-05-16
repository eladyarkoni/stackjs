Class('TitlebarView::STView', {

	template: 'titlebar-view',

	messageEl: null,
	messageBoxEl: null,
	model: null,
	versionEl: null,

	render: function() {
		this.versionEl.innerHTML = "version: " + App.config.version;
	},

	enabled: function(enabled) {
		if (enabled) {
			this.element.className = 'titlebar-view';
		} else {
			this.element.className = 'titlebar-view disabled';
		}
	},

	TitlebarView: function() {
		App.notificationCenter.addObserver(this, this.showMessage, 'message');
	},

	getStarted: function() {
		this.addView(new GetStartedView(), document.body);
	},

	api: function() {
		this.addView(new APIView(), document.body);
	},

	// project actions
	projectAddView: function() {
		this.addView(new DialogView({
			title: 'New Project View',
			fields: [
				{
					type: 'text',
					id: 'viewName',
					placeholder: 'Enter view name...'
				},
				{
					type: 'view',
					view: 'ViewTemplateList',
					id: 'viewTemplate'
				}
			],
			buttons: [
				{
					type: 'ok',
					label: 'Ok'
				},
				{
					type: 'cancel',
					label: 'Cancel'
				}
			],
			callback: function(data, bType) {
				if (bType === 'ok') {
					this.model.addViewObject(data.viewTemplate.name, data.viewName);
					if (data.viewTemplate.subviews) {
						for (var i = 0; i < data.viewTemplate.subviews.length; i++) {
							this.model.addViewObject(data.viewTemplate.subviews[i], data.viewTemplate.subviews[i]);
						}
					}
					App.view.projectView.render();
				}
			},
			context: this
		}), document.body);
	},

	projectAddServer: function() {
		this.addView(new DialogView({
			title: 'New Server',
			fields: [
				{
					type: 'text',
					id: 'className',
					placeholder: 'Class name...'
				},
				{
					type: 'text',
					id: 'domain',
					placeholder: 'Server domain (default: this domain)'
				}
			],
			buttons: [
				{
					type: 'ok',
					label: 'Ok'
				},
				{
					type: 'cancel',
					label: 'Cancel'
				}
			],
			callback: function(data, bType) {
				if (bType === 'ok') {
					this.model.addServerObject(data.className, data.domain);
					App.view.projectView.render();
				}
			},
			context: this
		}), document.body);
	},

	projectAddDatabase: function() {
		this.addView(new DialogView({
			title: 'New Database',
			fields: [
				{
					type: 'text',
					id: 'className',
					placeholder: 'Class name...'
				},
				{
					type: 'text',
					id: 'name',
					placeholder: 'Database name (default: Database)'
				},
				{
					type: 'number',
					id: 'size',
					placeholder: 'Database size (default: 10MB)'
				}
			],
			buttons: [
				{
					type: 'ok',
					label: 'Ok'
				},
				{
					type: 'cancel',
					label: 'Cancel'
				}
			],
			callback: function(data, bType) {
				if (bType === 'ok') {
					this.model.addDatabaseObject(data.className, data.name, data.size);
					App.view.projectView.render();
				}
			},
			context: this
		}), document.body);
	},

	projectNew: function() {
		this.callDelegate('newProjectCreatedDelegate');
	},

	projectSave: function() {
		this.callDelegate('saveProjectDelegate');
	},

	projectLoad: function() {
		var self = this;
		DB().getProjects(this.context(function(data){
			if (data.length) {
				this.addView(new DialogView({
					title: 'Load Project',
					fields: [
						{
							type: 'view',
							view: 'SavedProjectView',
							id: 'savedProject'
						}
					],
					buttons: [
						{
							type: 'ok',
							label: 'Ok'
						},
						{
							type: 'cancel',
							label: 'Cancel'
						}
					],
					callback: function(data, bType) {
						if (bType === 'ok') {
							DB().getProject(data.savedProject.id, function(project){
								self.callDelegate('loadProjectDelegate', [project[0]]);
							});
						}
					},
					context: this
				}), document.body);
			} else {
				App.notificationCenter.postNotification('message', "You didn't save any project yet.");
			}
		}));
	},

	runProject: function() {
		this.model.build({
			success: function(url) {
				window.open(url, "buildwindow", "height=480,width=320");
			}
		});
	},

	projectDownload: function() {
		var self = this;
		var downloadingDialog = new DialogView({
			title: "Downloading...",
			fields: [
				{
					type: 'bar'
				}
			]
		});
		this.addView(downloadingDialog, document.body);
		downloadingDialog.updateBar(0);
		this.model.download({
			success: function(url) {
				downloadingDialog.updateData({
					fields: [
						{
							type: 'link',
							href: url,
							label: 'Click here to download the file.',
							id: 'download',
							download: self.model.generateProjectFileName('zip')
						}
					]
				});
			},
			error: function(err){
				downloadingDialog.remove();
				if (err.type === 'NoMainViewFound') {
					self.showMessage("No project main view is found");
				}
			},
			progress: function(percetage) {
				downloadingDialog.updateBar(percetage);
			}
		});
	},

	projectExport: function() {
		var self = this;
		var exportingDialog = new DialogView({
			title: "Exporting...",
			fields: [
				{
					type: 'bar'
				}
			]
		});
		this.addView(exportingDialog, document.body);
		exportingDialog.updateBar(0);
		this.model.exportProject({
			success: function(url) {
				exportingDialog.updateBar(100);
				exportingDialog.updateData({
					fields: [
						{
							type: 'link',
							href: url,
							label: 'Click here to download the file.',
							id: 'download',
							download: self.model.generateProjectFileName('stk')
						}
					]
				});
			}
		});
	},

	projectImport: function() {
		var importDialog = new DialogView({
			title: "Import Project",
			fields: [
				{
					type: 'view',
					view: 'DropFileZoneView',
					id: 'dropFileZone'
				}
			],
			buttons: [
				{
					type: 'ok',
					label: 'Ok'
				},
				{
					type: 'cancel',
					label: 'Cancel'
				}
			],
			callback: function(data, bType) {
				if (bType === 'ok') {
					var fileData = data['dropFileZone'];
					try {
						var object = JSON.parse(atob(fileData));
						this.callDelegate('loadProjectDelegate', [object]);
					} catch (ex) {
						App.notificationCenter.postNotification('message', 'Project file is corrupted.');
					}
				}
			},
			context: this
		});
		this.addView(importDialog, document.body);
	},

	// Device actions
	changeDevice: function(evt) {
		var type = evt.currentTarget.getAttribute('type');
		App.notificationCenter.postNotification('ChangeDeviceNotification', {type: type});
	},

	showMessage: function(text) {
		this.messageBoxEl.className += ' open';
		this.messageEl.innerHTML = text;
		var self = this;
		setTimeout(function(){
			self.messageEl.innerHTML = "";
			self.messageBoxEl.className = self.messageBoxEl.className.replace(' open', '');
		},2000);
	},

	openUrl: function(evt) {
		window.open(evt.currentTarget.getAttribute('rel'));
	}

	// openStackStore: function() {
	// 	this.showDialog(new StackStoreView());
	// },

	// publishToStore: function() {
	// 	this.showDialog(new DialogView({
	// 		title: 'Publish To Store',
	// 		fields: [
	// 			{
	// 				type: 'view',
	// 				view: 'PublishView',
	// 				id: 'publish'
	// 			}
	// 		]
	// 	}));
	// }
});