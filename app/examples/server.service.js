Class('%className%::STServer', {

	domain: '%domain%',

	login: function(username, password, callback) {
		this.post('/login', {username: username, password: password}, {}, callback);
	}
});