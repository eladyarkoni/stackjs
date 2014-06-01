Class('TodoListItem::STView', {

	template: 'todolistitem_template',

	model: null,

	//outlets
	labelEl: null,
	checkbox: null,

	TodoListItem: function(todo) {
		this.model = todo;
	},

	render: function() {
		this.labelEl.innerHTML = this.model.label;
		this.toggleClass(this.element, 'completed', this.model.completed);
		if (this.model.completed) {
			this.checkbox.setAttribute('checked', true);
		}
	},

	// linked inside the template
	onCheckboxChange: function(event) {
		this.model.completed = event.target.checked;
		this.toggleClass(this.element, 'completed', this.model.completed);
		this.callDelegate('itemUpdated', [this.model]);
	},

	onDestroy: function(event) {
		this.remove();
		this.callDelegate('itemDeleted', [this.model]);
	}
});