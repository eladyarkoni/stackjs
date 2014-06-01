/*
 TodoService is interact with the localStorage (aka STUserSettings StackJS Service)
*/
Class('TodoService', {

	data: null,

	TodoService: function() {
		this.data = App.settings.get('todos') || [];
	},

	add: function(model, callback) {
		this.data.push(model);
		App.settings.set('todos', this.data);
		return callback(this.data);
	},

	remove: function(model, callback) {
		for (var i = 0; i < this.data.length; i++) {
			if (this.data[i] == model) {
				this.data.splice(i, 1);
				break;
			}
		}
		App.settings.set('todos', this.data);
		return callback(this.data);
	},

	update: function(model, callback) {
		for (var i = 0; i < this.data.length; i++) {
			if (this.data[i] == model) {
				this.data[i] = model;
				break;
			}
		}
		App.settings.set('todos', this.data);
		return callback(this.data);
	},

	getAll: function(callback) {
		return callback(this.data);
	},

	clearCompleted: function(callback) {
		var newdata = [];
		for (var i = 0; i < this.data.length; i++) {
			if (!this.data[i].completed) {
				newdata.push(this.data[i]);
			}
		}
		this.data = newdata;
		App.settings.set('todos', this.data);
		return callback(this.data);
	}
});