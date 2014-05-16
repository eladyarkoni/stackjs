Class('DropFileZoneView::STView', {

	template: 'drop-file-zone',
	id: null,
	dropCallback: null,

	DropFileZoneView: function(callback) {
		this.dropCallback = callback;
	},

	render: function() {
		var holder = this.element;
		var self = this;
		holder.ondragover = function () { self.toggleClass(self.element, 'hover', true); return false; };
		holder.ondragend = function () { self.toggleClass(self.element, 'hover', false); return false; };
		holder.ondrop = function (e) {
			e.preventDefault();
			self.toggleClass(self.element, 'hover', false);
			var file = e.dataTransfer.files[0],
				reader = new FileReader();
			self.select('.text').innerHTML = file.name;
			reader.onload = function (event) {
				self.dropCallback({id: self.id, model: event.target.result});
			};
			reader.readAsText(file);
			return false;
		};
	}
});