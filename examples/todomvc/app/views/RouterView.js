'use strict';
/*
	RouterView extends STRouterView to support hash navigation
*/
Class('RouterView::STRouterView', {

	html: '<div class="router-view"></div>',

	routes: {
		'/': {view: 'MainView', method: 'showAll', default: true},
		'/active': {view: 'MainView', method: 'showActive'},
		'/completed': {view: 'MainView', method: 'showCompleted'}
	}
});