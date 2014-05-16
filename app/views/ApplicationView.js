Class('ApplicationView::STView', {

	template: 'application_view',

	codeContainerEl: null,

	//views
	codeView: null,
	tutorialView: null,

	render: function() {
		this.titleBarView = new TitlebarView();
		this.titleBarView.setDelegate(this);
		this.addView(this.titleBarView, '.title-bar');
		this.addView(new WelcomeView({ delegate: this}), '.code-container');
		if (!window.chrome) {
			this.addView(new DialogView({
				title: "Sorry :(",
				message: 'The StackJS IDE supports only Chrome Browser right now.'
			}), document.body);
		} else {
			if (!App.settings.get('visited')) {
				this.addView(new DialogView({
					title: 'Welcome',
					message: 'Welcome to StackJS IDE for mobile.<br><br>Please visit the "get started" section before you begin.',
					buttons: [
						{
							label: 'Ok',
							type: 'ok'
						}
					],
					callback: function(){}
				}), document.body);
				App.settings.set('visited', true);
			}
		}
		this.loadDemoProjects();
	},

	loadDemoProjects: function() {
		Server().getDemoProjects(function(demoProjects){
			for (var i = 0; i < demoProjects.length; i++) {
				try {
					var object = JSON.parse(atob(demoProjects[i]));
					DB().saveProjectIfNotExists(object);
				} catch (ex) {}
			}
		});
	},

	showWorkspaceDelegate: function() {
		this.titleBarView.enabled(true);
		this.codeView = new CodeView();
		this.deviceView = new DeviceView();
		this.projectView = new ProjectView({delegate: this});
		this.projectInfoView = new ProjectInfoView({delegate: this});

		this.addView(this.deviceView, '.view-container');
		this.addView(this.projectView,'.project-container');
		this.addView(this.codeView,'.code-container');
		this.addView(this.projectInfoView,'.code-container');

		setTimeout(this.context(function(){
			this.toggleClass(this.codeContainerEl, 'collapsed', true);
		}),500);
	},

	newProjectCreatedDelegate: function() {
		var self = this;
		if (this.model) {
			this.addView(new DialogView({
				title: 'Save Current Project',
				message: 'Do you want to save the current project?',
				buttons: [{type: 'ok',label: 'Yes'},{type: 'cancel',label: 'No'}],
				callback: function(data, bType) {
					if (bType === 'ok') {
						self.saveProjectDelegate();
					}
					self.newProjectOnWorkspace();
				}
			}), document.body);
		} else {
			this.newProjectOnWorkspace();
		}
	},

	loadProjectDelegate: function(projectObject) {
		var self = this;
		if (this.model) {
			this.addView(new DialogView({
				title: 'Save Current Project',
				message: 'Do you want to save the current project?',
				buttons: [{type: 'ok',label: 'Yes'},{type: 'cancel',label: 'No'}],
				callback: function(data, buttonType) {
					if (buttonType === 'ok') {
						self.saveProjectDelegate();
					}
					self.loadProjectOnWorkspace(projectObject);
				}
			}), document.body);
		} else {
			this.loadProjectOnWorkspace(projectObject);
		}
	},

	newProjectOnWorkspace: function() {
		this.model = new ProjectModel();
		this.updateWorkspace();
		App.notificationCenter.postNotification('message', 'New project is created!');
	},

	loadProjectOnWorkspace: function(projectObject) {
		this.model = new ProjectModel(projectObject);
		this.updateWorkspace();
		App.notificationCenter.postNotification('message', 'Project is loaded!');
	},

	saveProjectDelegate: function() {
		DB().saveProject(this.model);
		App.notificationCenter.postNotification('message', 'Project is saved!');
	},

	updateWorkspace: function() {
		this.titleBarView.setModel(this.model);
		this.titleBarView.render();
		this.projectView.setModel(this.model);
		this.projectView.render();
		this.projectInfoView.setModel(this.model);
		this.projectInfoView.render();
		this.deviceView.restart();
	},

	viewSelectedDelegate: function(model) {
		this.projectInfoView.hide();
		this.codeView.setData(model);
		this.deviceView.load(this.model);
		this.deviceView.play(model);
	},

	serviceSelectedDelegate: function(model) {
		this.projectInfoView.hide();
		this.codeView.setData(model);
	},

	rootSelectedDelegate: function(model) {
		this.projectInfoView.show();
	},

	expandCollapseCodeContainer: function() {
		this.toggleClass(this.codeContainerEl, 'collapsed');
	}
});