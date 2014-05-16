Class('DialogView::STView', {

	template: 'dialog-view',

	titleEl: null,
	bodyEl: null,
	footerEl: null,

	data: null,

	DialogView: function(model) {
		this.data = {};
		this.model = model;
	},

	render: function() {
		var i;
		this.titleEl.innerHTML = this.model.title;
		if (this.model.message) {
			var message = document.createElement('div');
			message.className = 'message';
			message.innerHTML = this.model.message;
			this.bodyEl.appendChild(message);
			this.bodyEl.innerHTML += '<br><br>';
		}
		// body
		for (i = 0; this.model.fields && i < this.model.fields.length; i++) {
			if (this.model.fields[i].type === 'view') {
				var view = new window[this.model.fields[i].view](this.context(function(obj){
					this.data[obj.id] = obj.model;
				}));
				view.setId(this.model.fields[i].id);
				this.addView(view, this.bodyEl);
			} else if (this.model.fields[i].type === "bar") {
				var barEl = document.createElement("div");
				barEl.id = "bar";
				barEl.innerHTML = "<span></span>";
				this.bodyEl.appendChild(barEl);
			} else if (this.model.fields[i].type === "link") {
				var a = document.createElement('a');
				a.setAttribute("href", this.model.fields[i].href);
				a.setAttribute("download", this.model.fields[i].download);
				a.id = this.model.fields[i].id;
				a.innerHTML = this.model.fields[i].label;
				a.addEventListener('click', this.context(function(){
					this.remove({timeout: 500});
				}), false);
				this.bodyEl.appendChild(a);
				this.bodyEl.appendChild(document.createElement('br'));	
			} else {
				var input = document.createElement('input');
				input.setAttribute('type', this.model.fields[i].type);
				input.setAttribute('placeholder', this.model.fields[i].placeholder);
				input.id = this.model.fields[i].id;
				input.addEventListener('change', this.context(function(evt){
					this.data[evt.currentTarget.id] = evt.currentTarget.value;
				}), false);
				this.bodyEl.appendChild(input);
				this.bodyEl.appendChild(document.createElement('br'));
			}
		}
		// buttons
		for (i = 0; this.model.buttons && i < this.model.buttons.length; i++) {
			var btn = document.createElement('div');
			btn.className = 'btn';
			btn.setAttribute('type', this.model.buttons[i].type);
			btn.innerHTML = this.model.buttons[i].label;
			btn.addEventListener('click', this.context(this.buttonClicked), false);
			this.footerEl.appendChild(btn);
		}

		// center dialog
		setTimeout(this.context(function() {
			var dialogScreen = this.select('.dialog-view');
			dialogScreen.style.left = (window.innerWidth - dialogScreen.offsetWidth)/2 + 'px';
		}),0);
	},

	buttonClicked: function(evt) {
		var buttonType = evt.currentTarget.getAttribute('type');
		this.model.callback.apply(this.model.context, [this.data, buttonType]);
		this.remove({timeout: 500});
	},


	updateBar: function(percetage) {
		var progressEl = this.select("#bar > span");
		if (progressEl) {
			progressEl.style.width = percetage + "%";
		}
	},

	updateData: function(model) {
		for (var key in model) {
			this.model[key] = model[key];
		}
		this.titleEl.innerHTML = "";
		this.bodyEl.innerHTML = "";
		this.footerEl.innerHTML = "";
		this.render();
	}
});