Class('TemplatesModel', {

	views: {
		
		empty: {
			name: 'empty',
			label: 'Empty'
		},

		ListView: {
			name: 'ListView',
			label: 'List View',
			subviews: ['ListItemView']
		}
	}
});