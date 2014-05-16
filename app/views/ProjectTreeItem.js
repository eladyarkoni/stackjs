Class('ProjectTreeItem::STView', {

	template: 'project-tree-item',

	headerTextEl: null,
	filesContainerEl: null,
	headerEl: null,

	render: function() {
		if (!this.model) {
			return;
		}
		this.headerTextEl.innerHTML = (this.model.type === 'root') ? 'Project' : this.model.name;
		this.headerEl.className = 'header ' + this.model.type;
		this.headerEl.setAttribute('type', this.model.type);
		for (var i = 0; ((this.model.files) && (i < this.model.files.length)); i++) {
			this.addView(new ProjectTreeItem({model: this.model.files[i], delegate: this.delegate}), this.filesContainerEl);
		}
	},

	onClick: function() {
		if (this.model.type === 'view' || 
			this.model.type === 'root' ||
			this.model.type === 'service') {
			this.callDelegate('itemClickedDelegate', [this]);
		}
	},

	onDelete: function() {
		if (this.model.type === 'view' ||
			this.model.type === 'service') {
			this.callDelegate('itemDeleteDelegate', [this]);
		}
	}
});