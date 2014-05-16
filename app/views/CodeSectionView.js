Class('CodeSectionView::STView', {

	template: 'code-section',

	editor: null,
	editorEl: null,

	render: function() {
		setTimeout(this.context(function(){
			this.editor = new CodeMirror(this.editorEl, {
				lineNumbers: true,
				matchBrackets: true,
				theme: "monokai",
				model: this.mode,
				value: ""
			});
			this.editor.on("focus", this.context(this.editorOnFocus), false);
			this.editor.on("blur", this.context(this.editorOnBlur), false);
			this.editor.on("change", this.context(this.editorOnChange), false);
		}), 100);
	},

	editorOnFocus: function() {
		this.element.parentNode.className += ' focus';
		this.callDelegate('tabOnFocusDelegate', [this]);
	},

	editorOnBlur: function() {
		this.element.parentNode.className = this.element.parentNode.className.replace(' focus', '');	
	},

	editorOnChange: function() {
		var type = this.type,
			value = this.editor.getValue();
		App.notificationCenter.postNotification('CodeChangeNotification', {
			type: type,
			value: value
		});
		this.callDelegate('codeDidChanged', [type, value]);
	},

	setData: function(data) {
		this.editor.setValue(data);
	}
});