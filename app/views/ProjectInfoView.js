Class('ProjectInfoView::STView', {

	template: 'project-info',
	projectId: null,
	projectName: null,
	projectMainView: null,
	projectVersion: null,
	model: null,

	render: function() {
		if (!this.model) {
			return;
		}
		this.projectId.value = this.model.id;
		this.projectName.value = this.model.name;
		this.projectVersion.value = this.model.version;
		this.projectMainView.innerHTML = "";
		var mainViewFound = false;
		for (var i = 0; i < this.model.files[0].files.length; i++) {
			var option = document.createElement("option");
			option.innerHTML = this.model.files[0].files[i].name;
			option.setAttribute("value", this.model.files[0].files[i].name);
			if (this.model.files[0].files[i].name === this.model.mainView) {
				option.setAttribute("selected", true);
				mainViewFound = true;
			}
			this.projectMainView.appendChild(option);	
		}

		if (!mainViewFound && this.model.files[0].files[0]) {
			this.model.mainView = this.model.files[0].files[0].name;
		}
	},

	change: function(evt) {
		if (evt.currentTarget == this.projectId) {
			this.model.id = evt.currentTarget.value;
		} else if (evt.currentTarget == this.projectName) {
			this.model.name = evt.currentTarget.value;
		} else if (evt.currentTarget == this.projectVersion) {
			this.model.version = evt.currentTarget.value;
		} else if (evt.currentTarget == this.projectMainView) {
			this.model.mainView = evt.currentTarget.options[evt.currentTarget.selectedIndex].value;
		}
		this.callDelegate('projectInfoChanged');
	},
	
	show: function() {
		this.element.className += ' open';
		this.render();
	},

	hide: function() {
		this.element.className = this.element.className.replace(/ open/g, ''); 
	}
});