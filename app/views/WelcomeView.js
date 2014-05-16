Class('WelcomeView::STView',{

	template: 'welcome-view',

	createNewProject: function() {
		this.remove({timeout: 500});
		setTimeout(this.context(function(){
			this.callDelegate('showWorkspaceDelegate');
			this.callDelegate('newProjectCreatedDelegate');
		}),500);
	},

	getStarted: function() {
		this.addView(new GetStartedView(), document.body);
	},

	showAPI: function() {
		this.addView(new APIView(), document.body);
	}
}); 