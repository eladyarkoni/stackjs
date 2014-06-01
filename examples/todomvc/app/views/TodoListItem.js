Class('TodoListItem::STView', {

	template: 'todolistitem_template',

	model: null,

	//outlets
	labelEl: null,
	checkbox: null,
	editInput: null,

	TodoListItem: function(todo) {
		this.model = todo;
	},

	render: function() {
		this.labelEl.innerHTML = this.model.label;
		this.editInput.value = this.model.label;
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

	onEditInputBlur: function() {
		this.toggleClass(this.element, 'editing', false);
		this.labelEl.innerHTML = this.editInput.value;
		this.model.label = this.editInput.value;
		this.callDelegate('itemUpdated', [this.model]);
	},

	onDoubleClick: function() {
		this.toggleClass(this.element, 'editing', true);
	},

	onDestroy: function(event) {
		this.remove();
		this.callDelegate('itemDeleted', [this.model]);
	},

	onEditInputKeyUp: function(event) {
		if (event.keyCode === App.config.enterKeyCode) {
			this.toggleClass(this.element, 'editing', false);
		}
	}
});