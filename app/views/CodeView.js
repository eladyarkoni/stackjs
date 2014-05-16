Class('CodeView::STView', {
	
	template: 'code-view',
	textEl: null,
	model: null,
	optionsContainer: null,

	styleSectionContainer: null,
	templateSectionContainer: null,
	codeSectionContainer: null,

	CodeView: function() {
		App.notificationCenter.addObserver(this, this.onDeviceErrors, 'DeviceMessagesNotification');
	},

	render: function() {
		this.styleSection = new CodeSectionView({type: 'style', label: 'Style', mode: 'text/css'});
		this.templateSection = new CodeSectionView({type: 'template', label: 'Template', mode: 'htmlmixed'});
		this.classSection = new CodeSectionView({type: 'view', label: 'View Controller', mode: 'javascript'});

		this.addTabView(this.styleSection, this.styleSectionContainer);
		this.addTabView(this.templateSection, this.templateSectionContainer);
		this.addTabView(this.classSection, this.codeSectionContainer);
		this.textEl.innerHTML = 'Template';
	},

	addTabView: function(view, selector) {
		view.setDelegate(this);
		this.addView(view, selector);
	},

	tabOnFocusDelegate: function(tab) {
		this.textEl.innerHTML = tab.label;
	},

	setData: function(model) {
		this.model = model;
		if (model.type === 'view') {
			this.classSection.type = 'view';
			this.classSection.label = 'View Controller';
			this.styleSectionContainer.style.display = "block";
			this.templateSectionContainer.style.display = "block";
			this.styleSection.setData(this.model.data.style);
			this.classSection.setData(this.model.data.view);
			this.templateSection.setData(this.model.data.template);
		} else if (model.type === 'service') {
			this.classSection.type = 'service';
			this.classSection.label = 'Service Controller';
			this.styleSectionContainer.style.display = "none";
			this.templateSectionContainer.style.display = "none";
			this.classSection.setData(this.model.data.service);
		}
	},

	codeDidChanged: function(type, value) {
		this.model.data[type] = value;
	},

	onDeviceErrors: function(errors) {
		var container = this.select('.messages .content');
		container.innerHTML = "";
		if (errors.length) {
			this.select('.messages').className = "messages errors";
		} else {
			this.select('.messages').className = "messages";
		}
		for (var i = 0; i < errors.length; i++) {
			var message = document.createElement('div');
			message.innerHTML = "<span class='icon'></span><span class='module'>"+this.model.name+"</span><span class='message'>"+errors[i]+"</span>";
			container.appendChild(message);
		}
	},

	expandCollapse: function() {
		
	}
});