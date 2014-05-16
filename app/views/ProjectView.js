Class('ProjectView::STView', {
	
	template: 'project-view',

	selectedItem: null,

	projectRootView: null,

	model: null,

	render: function() {
		if (this.projectRootView) {
			this.projectRootView.remove();
		}
		this.projectRootView = new ProjectTreeItem({ model: this.model, delegate: this});
		this.addView(this.projectRootView);
	},

	itemClickedDelegate: function(item) {
		if (this.selectedItem) {
			this.selectedItem.headerTextEl.className = "";
		}
		item.headerTextEl.className = 'selected';
		this.selectedItem = item;
		switch (this.selectedItem.model.type) {
			case 'view':
				this.callDelegate('viewSelectedDelegate', [this.selectedItem.model]);
			break;
			case 'service':
				this.callDelegate('serviceSelectedDelegate', [this.selectedItem.model]);
			break;
			case 'root':
				this.callDelegate('rootSelectedDelegate', [this.selectedItem.model]);
			break;
		}
	},

	itemDeleteDelegate: function(item) {
		var self = this;
		this.addView(new DialogView({
			title: "Delete '"+item.model.name+"'",
			message: 'Are you sure?',
			buttons: [
				{
					type: 'ok',
					label: 'Yes'
				},
				{
					type: 'cancel',
					label: 'No'
				}
			],
			callback: function(data, bType) {
				if (bType === 'ok') {
					self.model.deleteObject(item.model.name);
					item.remove();
					App.notificationCenter.postNotification('message', "'"+item.model.name+"' is deleted.");
				}
			}
		}), document.body);
	}	
});