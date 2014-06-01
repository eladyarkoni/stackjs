Class('TodoListView::STView', {

	template: 'todolistview_template',

	// outlets
	listContainer: null,

	render: function() {
		this.callSubviews('remove');
		var count = this.callDelegate('getCount', null, 0);
		for (var i = 0; i < count; i++) {
			var itemView = this.callDelegate('getView', [i]);
			this.addView(itemView, this.listContainer);
		}
		this.toggleClass(this.element, 'hide', count === 0);
	}
});