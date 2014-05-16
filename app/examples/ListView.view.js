Class('%viewName%::STView', {

	template: '%viewClassName%',

	%viewName%: function() {
		this.model = [
			{
				label: 'Item 1'
			},
			{
				label: 'Item 2'
			},
			{
				label: 'Item 3'
			},
			{
				label: 'Item 4'
			}
		];
	},

	render: function() {
		for (var i = 0; i < this.model.length; i++) {
			this.addView(new ListItemView({model: this.model[i]}));
		}
	}
});