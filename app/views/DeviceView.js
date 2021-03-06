Class('DeviceView::STView', {

	template: "device-view",

	deviceIframe: null,

	DeviceView: function() {
		App.notificationCenter.addObserver(this, this.onChangeDevice, 'ChangeDeviceNotification');
		App.notificationCenter.addObserver(this, this.onCodeChangeNotification, 'CodeChangeNotification');
		window.addEventListener('message', this.onDeviceEvent);
	},

	render: function() {
		setTimeout(this.context(function(){
			this.deviceIframe.src = "device/index.html";
		}),500);
	},

	getDevice: function() {
		return this.deviceIframe.contentWindow;
	},

	onDeviceEvent: function(evt) {
		var messageType = evt.data.type;
		var data = evt.data.data;
		switch (messageType) {
			case 'device:ready':
				console.log("device is ready");
			break;
			case 'device:messages':
				var messages = (data && data.length) ? data : [];
				App.notificationCenter.postNotification('DeviceMessagesNotification', data);
			break;
		}
	},

	restart: function() {
		this.getDevice().document.location.reload();
	},

	play: function(model) {
		this.getDevice().postMessage({type: 'play', data: model.data}, '*');
	},

	load: function(projectModel) {
		this.getDevice().postMessage({type: 'load', data: projectModel.files}, '*');
	},

	onCodeChangeNotification: function(object) {
		this.getDevice().postMessage({type: 'change', data: object}, '*');
	},

	onChangeDevice: function(object) {
		this.element.className = "device-view " + object.type;
	}
});