Class('GetStartedView::STView', {

	template: 'get-started',

	render: function() {
		setTimeout(this.context(function(){
			var textAreas = this.select('textarea');
			textAreas = (textAreas.length) ? textAreas : [textAreas];
			for (var i = 0; i < textAreas.length; i++) {
				CodeMirror.fromTextArea(textAreas[i], {theme: "monokai", readOnly: true, fixedGutter: false});	
			}
		}),50);
	},

	close: function() {
		this.remove({timeout: 300});
	}
});