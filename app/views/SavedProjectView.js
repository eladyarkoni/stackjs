Class('SavedProjectView::STView', {

	template: 'saved-projects',
	changeCallback: null,
	id: null,
	selectionEl: null,
	descriptionEl: null,
	selectedEl: null,

	SavedProjectView: function(callback) {
		this.changeCallback = callback;
	},

	render: function() {
		var container = this.selectionEl;
		var self = this;
		container.innerHTML = "";
		this.descriptionEl.innerHTML = "";
		DB().getProjects(this.context(function(data) {
			if (data.length == 0) {
				this.parentview.remove({timeout: 300});
			}
			for (var i = 0; i < data.length; i++) {
				var divEl = document.createElement('div');
				divEl.innerHTML = data[i].name;
				divEl.id = data[i].id;
				divEl.addEventListener('click', this.context(self.onSelect), false);
				container.appendChild(divEl);
			}
			if (data) {
				this.onSelect({currentTarget: this.select('.selection > div:first-child')});
			}
		}));
	},

	onSelect: function(evt) {
		if (this.selectedEl) {
			this.selectedEl.className = "";
		}
		this.selectedEl = evt.currentTarget;
		var id = this.selectedEl.id;
		this.selectedEl.className = 'selected';
		this.descriptionEl.innerHTML = "Project ID: " + this.selectedEl.id + "<br>" + 
										"Project Name: " + this.selectedEl.innerHTML;
		this.changeCallback({id: this.id, model: {id: id}});
	},

	deleteSelectedProject: function(evt) {
		var projectId = this.selectedEl.id;
		DB().deleteProject(projectId, this.context(function(){
			this.render();
		}));
	}
});