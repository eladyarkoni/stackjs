'use strict';

Class('TodoListDetailsView::STView', {

	template: 'todolistdetails_template',

	// linked by outlet
	itemLeftEl: null,
	clearCompletedButton: null,
	selected: null,

	render: function() {
		var items = this.callDelegate('getAllItemsCount');
		var itemCompleted = this.callDelegate('getCompletedItemsCount');
		this.toggleClass(this.element, 'hide', (items === 0 && this.selected === 'all'));
		this.itemLeftEl.innerHTML = items - itemCompleted;
		this.clearCompletedButton.innerHTML = (itemCompleted) ? 'Clear completed ('+itemCompleted+')' : '';
		
	},

	updateSelected: function(selected) {
		this.selected = selected;
		this.toggleClass('.filter-all', 'selected', this.selected === 'all');
		this.toggleClass('.filter-active', 'selected', this.selected === 'active');
		this.toggleClass('.filter-completed', 'selected', this.selected === 'completed');
	},

	// linked by action
	clearCompleted: function() {
		this.callDelegate('onClearCompletedAction');
	}
});