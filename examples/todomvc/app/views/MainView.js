'use strict';

Class('MainView::STView', {

	template: 'main_template',

	listView: null,
	listDetailsView: null,

	todoService: null,

	/*
		Outlets, see attribute 'outlet' inside the view template
	*/
	inputEl: null,
	listViewContainer: null,
	listDetailsContainer: null,
	listInputContainer: null,

	/*
		Data List
	*/
	todos: [],

	/*
		MainView C'tor
	*/
	MainView: function() {
		this.todoService = new TodoService();
		this.listView = new TodoListView();
		this.listDetailsView = new TodoListDetailsView();
		// define the MainView controller as a delegate for the two subviews
		this.listView.setDelegate(this);
		this.listDetailsView.setDelegate(this);
	},


	render: function() {
		this.addView(this.listView, this.listViewContainer);
		this.addView(this.listDetailsView, this.listDetailsContainer);
	},

	/*
		Routes Methods
	*/
	showAll: function() {
		this.listDetailsView.updateSelected('all');
		this.filter = function(todos){ return todos;}
		this.todoService.getAll(this.context(function(todos){
			this.todos = this.filter(todos);
			this.listDetailsView.render();
			this.listView.render();
		}));
	},

	showActive: function() {
		this.listDetailsView.updateSelected('active');
		this.filter = function(todos){ var ret = []; for (var key in todos) {if (!todos[key].completed) {ret.push(todos[key]);}} return ret;}
		this.todoService.getAll(this.context(function(todos){
			this.todos = this.filter(todos);
			this.listDetailsView.render();
			this.listView.render();
		}));
	},

	showCompleted: function() {
		this.listDetailsView.updateSelected('completed');
		this.filter = function(todos){ var ret = []; for (var key in todos) {if (todos[key].completed) {ret.push(todos[key]);}} return ret;}
		this.todoService.getAll(this.context(function(todos){
			this.todos = this.filter(todos);
			this.listDetailsView.render();
			this.listView.render();
		}));
	},

	/*
		TodoListView Delegate
	*/
	getCount: function() {
		return this.todos.length;
	},

	getView: function(position) {
		var todo = this.todos[position];
		var view = new TodoListItem(todo);
		view.setDelegate(this);
		return view;
	},

	/*
		TodoListItem Delegate
	*/
	itemDeleted: function(model) {
		this.todoService.remove(model, this.context(function(todos){
			this.todos = this.filter(todos);
			this.listView.render();
			this.listDetailsView.render();
		}));
	},

	itemUpdated: function(model) {
		this.todoService.update(model, this.context(function(todos){
			this.todos = this.filter(todos);
			this.listView.render();
			this.listDetailsView.render();
		}));
	},

	/*
		TodoListDetailsView Delegate
	*/
	getCompletedItemsCount: function() {
		var count = 0;
		for (var i = 0; i < this.todos.length; i++) {
			if (this.todos[i].completed) {
				count++;
			}
		}
		return count;
	},

	getAllItemsCount: function() {
		return this.todos.length;
	},

	onClearCompletedAction: function() {
		this.todoService.clearCompleted(this.context(function(todos){
			this.todos = this.filter(todos);
			this.listDetailsView.render();
			this.listView.render();
		}));
	},

	/*
		Linked inside the view template: onkeyup="@onKeyUp"
	*/
	onKeyUp: function(event) {
		// The enter key code is defined inside the app config config/config.json
		if (event.keyCode === App.config.enterKeyCode) {
			var model = {label: this.inputEl.value, completed: false};
			this.todoService.add(model, this.context(function(todos){
				this.todos = this.filter(todos);
				this.listDetailsView.render();
				this.listView.render();
			}));
			this.inputEl.value = '';
		}
	}
});