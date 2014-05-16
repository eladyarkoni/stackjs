Class('%className%::STDatabase', {

	name: '%dbName%',
	size: %dbSize%,

	saveItem: function(id, data, callback) {
		this.save('items', {id: id, data: data}, callback);
	},

	getItem: function(id, callback) {
		this.save('items', {id: id}, callback);
	},

	deleteItem: function(id, callback) {
		this.delete('items', {id: id}, callback);
	}
});