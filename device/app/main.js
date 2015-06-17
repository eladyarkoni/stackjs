(function() {
	/* StackJS Configuration */
	StackJS.setup({ classOverride: true});
	/*
		run application controller 
	*/
	return new STApplication({ view: FrameDeviceView });	
})();