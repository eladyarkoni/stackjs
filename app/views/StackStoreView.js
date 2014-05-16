Class('StackStoreView::STView', {

	template: 'stack-store-view',

	close: function() {
		this.remove({timeout: 300});
	}
});