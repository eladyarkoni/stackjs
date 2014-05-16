Class('ViewTemplateList::STView', {

	template: 'view-template-list',

	listContainer: null,
	changeCallback: null,
	id: null,

	ViewTemplateList: function(callback) {
		this.changeCallback = callback;
		this.model = TemplatesModel();
	},

	render: function() {
		for (var templateName in this.model.views) {
			this.addView(new ViewTemplateItem({model: this.model.views[templateName], delegate: this}), this.listContainer);
		}
	},

	onSelectDelegate: function(view, name) {
		this.callSubviews('selected', [false]);
		view.selected(true);
		this.changeCallback({id: this.id, model: this.model.views[name]});
	}
});

Class('ViewTemplateItem::STView', {

	template: 'view-template-item',

	onSelect: function(evt) {
		this.callDelegate('onSelectDelegate', [this, evt.currentTarget.getAttribute('value')]);
	},

	render: function() {
		this.select('div').innerHTML = this.model.label;
		this.element.setAttribute('value', this.model.name);
	},

	selected: function(selected) {
		if (selected) {
			this.element.className += ' selected';
		} else {
			this.element.className = this.element.className.replace(/ selected/g, '');
		}
	}
});