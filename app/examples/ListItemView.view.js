Class('%viewName%::STView', {

	template: '%viewClassName%',
	text: null,

	render: function() {
		this.text.innerHTML = this.model.label;
	}
});