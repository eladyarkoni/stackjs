Class('DeviceView::STView', {

	template: 'device',

	styleElement: null,
	allStyleElement: null,
	welcomeElement: null,

	DeviceView: function() {
		window.addEventListener('message', this.context(this.onPlayEvent), false);
	},

	render: function() {
		setTimeout(this.ready, 5000);
	},

	ready: function() {
		window.parent.postMessage({type: 'device:ready'}, '*');
	},

	onPlayEvent: function(evt) {
		switch (evt.data.type) {
			case 'load':
				this.load(evt.data.data);
			break;
			case 'play':
				this.play(evt.data.data);
			break;
			case 'change':
				this.change(evt.data.data);
			break;
		}
	},

	load: function(files) {
		var i,
			view,
			viewClass;
		this.reset();
		this.allStyleElement.innerHTML = "";
		// load views
		for (i = 0; i < files[0].files.length; i++) {
			view = files[0].files[i];
			// load style
			this.allStyleElement.innerHTML += view.data.style;
			// load template
			StackJS.attachTemplate(view.name, view.data.template);
			// load class
			try {
				eval(view.data.view);
				window.parent.postMessage({type: 'device:messages', data: []}, '*');
			} catch (ex) {
				window.parent.postMessage({type: 'device:messages', data: [ex.toString()]}, '*');
			}
		}
		// load services
		for (i = 0; i < files[1].files.length; i++) {
			service = files[1].files[i];
			try {
				eval(service.data.service);
				window.parent.postMessage({type: 'device:messages', data: []}, '*');
			} catch (ex) {
				window.parent.postMessage({type: 'device:messages', data: [ex.toString()]}, '*');	
			}
		}
	},

	play: function(data) {
		var viewClass,viewObject;
		this.welcomeElement.style.display = 'none';
		this.styleElement.innerHTML = data.style;
		this.subviews = [];
		try {
			viewClass = eval(data.view);
			viewObject = new viewClass();
			viewObject.initTemplate(data.template);
			this.addView(viewObject);
			window.parent.postMessage({type: 'device:messages', data: []}, '*');
		} catch (ex) {
			window.parent.postMessage({type: 'device:messages', data: [ex.toString()]}, '*');
		} 
	},

	change: function(data) {
		var viewClass, viewObject;
		if (data.type === 'style') {
			this.styleElement.innerHTML = data.value;
		} else if (data.type === 'view') {
			try {
				viewClass = eval(data.value);
				if (this.subviews.length) {
					this.subviews[0].remove();
					this.subviews = [];
				}
				viewObject = new viewClass();
				this.addView(viewObject);
				window.parent.postMessage({type: 'device:messages', data: []}, '*');
			} catch (ex) {
				window.parent.postMessage({type: 'device:messages', data: [ex.toString()]}, '*');
				if (this.subviews.length) {
					this.subviews[0].remove();
					this.subviews = [];
				}
			}
		} else if ((data.type === 'template') && (this.subviews.length)) {
			if (this.subviews.length) {
				var currentView = this.subviews[0];
				currentView.remove();
				this.subviews = [];
				StackJS.attachTemplate(currentView._class, data.value);
				viewObject = new window[currentView._class]();
				this.addView(viewObject);
			}
			// this.subviews[0].initTemplate(data.value);
		}
	}
});