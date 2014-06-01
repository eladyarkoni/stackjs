/**
*
*	StackJS Framework Version 1.0 01/06/2014
*	Author: Elad Yarkoni
*
*/
(function(global){

	var Defaults = {
		staticPrefix: "$",
		defaultObjectName: "STObject",
		extendsSeperator: "::",
		stackSize: 100,
		viewOutletAttribute: 'outlet',
		classOverride: false,
		jquery: false,
		styleInjection: true,
		httpSuccessCode: 200,
		logEnabled: true
	};

	var isTouchDevice = function() {
		return (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
	};

	var DomEvents = {
		'onclick': 'click',
		'onclickstart': isTouchDevice() ? 'touchstart' : 'mousedown',
		'onclickend': isTouchDevice() ? 'touchend' : 'mouseup',
		'onkeydown': 'keydown',
		'onkeyup': 'keyup',
		'onmousedown': 'mousedown',
		'onmouseup': 'mouseup',
		'ontouchstart': 'touchstart',
		'ontouchend': 'touchend',
		'onchange': 'change'
	};

	var _cached_templates = {};
	var _classes = {};
	var _interfaces = {};
	var _sharedObjects = {};

	/*==================================================================================
	*	shared methods
	*==================================================================================*/
	var parseClassName = function(classStr) {
		var classNameArray = classStr.split(Defaults.extendsSeperator),
			className = classNameArray[0],
			extend = classNameArray[1];
		return {
			name: className,
			extend: extend
		};
	};

	var getterMethodBuilder = function (name, originalProperty, methodName) {
		return function(){
			Stack.push(name, this, methodName);
			var retValue = this[originalProperty];
			Stack.pop();
			return retValue;
		};
	};

	var setterMethodBuilder = function(name, originalProperty, methodName) {
		return function(object){
			Stack.push(name, this, methodName);
			this[originalProperty] = object;
			Stack.pop();
		};
	};

	var classMethodBuilder = function(methodName, method) {
		var myFunction = this[method];
		return function(object){
			Stack.push(methodName, this, method);
			var retValue = myFunction.apply(this,arguments);
			Stack.pop();
			return retValue;
		};
	};

	var staticMethodBuilder = function(className, context, methodName, method) {
		return function() {
			return function() {
				Stack.push(className, context.prototype, methodName);
				var retValue = method.apply(context.prototype,arguments);
				Stack.pop();
				return retValue;
			};
		};
	};

	var staticPropertyGetterBuilder = function(context, propName) {
		return function(){
			return context[propName];
		};
	};

	var staticPropertySetterBuilder = function(context, propName) {
		return function(val){
			context[propName] = val;
		};
	};

	var getGetterSetterName = function(action, propertyName) {
		return action + propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
	};

	var ajax = function(config) {
		var xmlhttp,
			url = (config.url) ? config.url : '',
			method = (config.method) ? config.method : 'GET',
			success = (config.success) ? config.success : function(){},
			error = (config.error) ? config.error : function(){},
			sync = (config.sync) ? config.sync : false,
			headers = (config.headers) ? config.headers : {},
			context = (config.context) ? config.context : window;

		if (window.XMLHttpRequest) {
			xmlhttp = new XMLHttpRequest();
		} else {
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4) {
				if (xmlhttp.status === Defaults.httpSuccessCode) {
					success.apply(context, [xmlhttp.responseText, xmlhttp]);
				} else {
					error.apply(context, [xmlhttp.responseText, xmlhttp]);
				}
			}
		};
		xmlhttp.open(method,url,!sync);
		for (var key in headers) {
			xmlhttp.setRequestHeader(key, headers[key]);
		}
		return xmlhttp.send(config.data ? JSON.stringify(config.data) : null);
	};

	var createMethodWithContext = function(context, method) {
		return function() {
			return context[method].apply(context, arguments);
		};
	};

	var prefetchTemplate = function(cls) {
		if (_cached_templates[cls.prototype._class]) {
			return;
		}
		ajax({
			url: 'app/templates/' + cls.prototype.template + ".html",
			success: function(html){ _cached_templates[cls.prototype._class] = html; },
			context: cls.prototype,
			sync: true
		});
	};

	var attachTemplate = function(className, html) {
		_cached_templates[className] = html;
	};

	var generateViewElement = function(context, oldElement) {
		var el = (oldElement) ? oldElement : document.createElement('div'),outlets,outletAttrVal,eventName,actions,method,elementattr,i;
		if (_cached_templates[context._class]) {
			el.innerHTML = _cached_templates[context._class];
			// attach strings
			if (window.Strings) {
				var str_matches = el.innerHTML.match(/@strings\.([\w\_\-\d\.]*)/g);
				for (i = 0; str_matches && i < str_matches.length; i++) {
					var key = str_matches[i].replace(/@strings./, '');
					el.innerHTML = el.innerHTML.replace('@strings.' + key, Strings.get(key));
				}
			}
			el = el.firstChild;
			// attach events
			for (eventName in DomEvents) {
				actions = el.querySelectorAll("["+eventName+"]");
				if (!actions.length) {
					elementattr = el.getAttribute(eventName);
					actions = (elementattr) ? [el] : [];
				}
				for (i = 0; i < actions.length; i++) {
					method = actions[i].getAttribute(eventName);
					if (method.charAt(0) === '@') {
						actions[i].setAttribute(eventName, null);
						actions[i].addEventListener(DomEvents[eventName], createMethodWithContext(context, method.substr(1, method.length)), false);
					}
				}
			}
			// attach outlets
			outlets = el.querySelectorAll("["+Defaults.viewOutletAttribute+"]");
			if (outlets && outlets.length) {
				for (i = 0; i < outlets.length; i++) {
					outletAttrVal = outlets[i].getAttribute(Defaults.viewOutletAttribute);
					if (outletAttrVal.charAt(0) === '@') {
						context[outletAttrVal.substr(1, outletAttrVal.length)] = outlets[i];
					}
				}
			}
		}
		return el;
	};

	var checkImplementation = function(className, classObject, interfaceName) {
		var interfacePrototype = _interfaces[interfaceName];
		for (var methodName in interfacePrototype) {
			if (typeof(interfacePrototype[methodName]) === 'function') {
				if (typeof(classObject[methodName]) !== 'function') {
					Throw(className + " must implements method: " + methodName + ": " + interfacePrototype[methodName].toString() + " of " + interfaceName);
				}
			}
		}
	};

	var encodeDBValue = function(obj) {
		var dataStr;
		if ((typeof(obj) === 'undefined') || (obj === null)){
			return obj;
		}
		switch (typeof(obj)) {
			case 'object':
				dataStr = JSON.stringify(obj);
			break;
			default:
				dataStr = obj;
			break;
		}
		return dataStr;
	};

	var decodeDBValue = function(value) {
		var dataObj;
		if ((typeof(value) === 'undefined') || (value === null)) {
			return value;
		}
		try {
			dataObj = JSON.parse(value);
		} catch (e) {
			dataObj = value;
		}
		return dataObj;
	};

	var isEmpty = function(val) {
		if ((typeof(val) === 'undefined') || (val === null) || (val === "")) {
			return true;
		}
		return false;
	};

	/*==================================================================================
	*	The reporter
	*==================================================================================*/
	var Report = {
		_errors: [
			'Not supported.',
			'Module error callback'
		],
		message: function(text, type) {
			var date = new Date(),
				msgType = type || 'MESSAGE';
			if (Defaults.logEnabled) {
				console.log("STACKJS (" + msgType + "): " + date.toString() + " : " + text);
			}
		},
		error: function(code, err) {
			this.message(this._errors[code] + ', error: ' + err);
		}
	};

	/*==================================================================================
	*	The Stack
	*==================================================================================*/
	var Stack = {
		_stack: [],
		push: function(className, objectRef, methodName) {
			if (Defaults.stackSize == this._stack.length) {
				this._stack.shift();
			}
			this._stack.push({
				className: className,
				objectRef: objectRef,
				methodName: methodName
			});
		},
		pop: function() {
			return this._stack.pop();
		},
		clear: function() {
			this._stack = [];
		},
		trace: function(exceptionObject) {
			var traceStr = "";
			for (var i = 0; i < this._stack.length; i++) {
				var stackObect = this._stack[i];
				traceStr += stackObect.className + " : " + stackObect.methodName + " -> ";
			}
			traceStr += exceptionObject.toString();
			Report.message(traceStr);
			return traceStr;
		}
	};

	/*==================================================================================
	*	Builders
	*==================================================================================*/
	var baseClassBuilder = function(name, extendedClasses) {
		var BaseClass = function() {
			if (arguments[0] && arguments[0].disableConstructors) {
				return;
			}
			if (this.constructor.name === 'Window' || this.constructor.name === 'DOMWindow' || typeof(this.constructor) === 'object') {
				if (typeof(_sharedObjects[name]) === 'undefined') {
					_sharedObjects[name] = new _classes[name]();
				}
				return _sharedObjects[name];
			}
			for (var i = 0; extendedClasses && i < extendedClasses.length; i++) {
				if (typeof(this[extendedClasses[i]]) !== 'undefined') {
					this[extendedClasses[i]].apply(this,arguments);
				}
			}
			if (typeof(this[name]) !== 'undefined') {
				this[name].apply(this,arguments);
			} else {
				if (arguments.length) {
					for (var key in arguments[0]) {
						this[key] = arguments[0][key];
					}
				}
			}
		};
		BaseClass.toString = function(){return name;};
		return BaseClass;
	};

	var classBuilder = function(descriptor, data, options) {
		var classNameObject = parseClassName(descriptor),
			extendsClassName = classNameObject.extend,
			extendsTemp,
			name = classNameObject.name,
			extendedClasses = [],
			propertyName,
			getterName,
			setterName,
			statics = {};

		options = options || {};
		options.interfaceArray = options.interfaceArray || [];

		if ((typeof(_classes[name]) !== 'undefined') && (!Defaults.classOverride)) {
			return _classes[name];
		}
		if (typeof(extendsClassName) === 'undefined') {
			extendsClassName = Defaults.defaultObjectName;
		}

		extendsTemp = extendsClassName;
		while (extendsTemp !== Defaults.defaultObjectName) {
			extendedClasses.push(extendsTemp);
			extendsTemp = _classes[extendsTemp].prototype._extends;
		}
		extendedClasses.reverse();
		_classes[name] = baseClassBuilder(name, extendedClasses);
		_classes[name].prototype = new _classes[extendsClassName]({disableConstructors: true});

		for (var i = 0; i < options.interfaceArray.length; i++) {
			checkImplementation(name, data, options.interfaceArray[i]);
		}

		for (propertyName in data) {
			if (propertyName.charAt(0) === Defaults.staticPrefix) {
				statics[propertyName.substr(1, propertyName.length)] = data[propertyName];
				delete data[propertyName];
			} else if ((typeof(data[propertyName]) !== 'function')) {
				getterName = getGetterSetterName("get",propertyName);
				setterName = getGetterSetterName("set",propertyName);
				if ((typeof(data[getterName]) !== 'function') && (propertyName.charAt(0) !== '_')) {
					data[getterName] = getterMethodBuilder.apply(data,[name, propertyName, getterName]);
				}
				if ((typeof(data[setterName]) !== 'function') && (propertyName.charAt(0) !== '_')) {
					data[setterName] = setterMethodBuilder.apply(data,[name, propertyName, setterName]);
				}
			} else {
				data[propertyName] = classMethodBuilder.apply(data,[name, propertyName]);
			}
		}

		for (propertyName in data) {
			_classes[name].prototype[propertyName] = data[propertyName];
		}

		for (var staticProperty in statics) {
			if (typeof(statics[staticProperty]) !== 'function') {
				_classes[name].prototype[staticProperty] = statics[staticProperty];
				_classes[name].__defineGetter__(staticProperty, staticPropertyGetterBuilder(_classes[name].prototype, staticProperty));
				_classes[name].__defineSetter__(staticProperty, staticPropertySetterBuilder(_classes[name].prototype, staticProperty));
			} else {
				_classes[name].__defineGetter__(staticProperty, staticMethodBuilder(name, _classes[name], staticProperty, statics[staticProperty]));
			}
		}

		_classes[name].prototype._implements = options.interfaceArray;
		_classes[name].prototype._extends = extendsClassName;
		_classes[name].prototype._extendsList = extendedClasses;
		_classes[name].prototype._class = name;
		if (!options.local) {
			global[name] = _classes[name];
		}
		// prefetching template
		if (_classes[name].prototype.template) {
			prefetchTemplate(_classes[name]);
		} else if (_classes[name].prototype.html) {
			attachTemplate(name, _classes[name].prototype.html);
			delete _classes[name].prototype.html;
		}
		return _classes[name];
	};

	/*==================================================================================
	*	Public Methods
	*==================================================================================*/
	var Throw = function(exceptionObject) {
		Stack.trace(exceptionObject);
		throw exceptionObject;
	};

	var Class = function() {
		var name = arguments[0],
			interfaceArray = Array.isArray(arguments[1]) ? arguments[1] : null,
			data = interfaceArray ? arguments[2] : arguments[1];
		return classBuilder(name, data, {interfaceArray: interfaceArray});
	};

	var Interface = function(name, data) {
		_interfaces[name] = data;
	};

	var StackJS = {

		setup: function(object) {
			for (var key in object) {
				Defaults[key] = object[key];
			}
		},

		attachTemplate: attachTemplate
	};

	/*==================================================================================
	*	Define default object
	*==================================================================================*/
	Class(Defaults.defaultObjectName, {

		delegate: null,

		isExtends: function(classStr) {
			for (var i = 0; i < this._extendsList.length; i++) {
				if (this._extendsList[i] === classStr) {
					return true;
				}
			}
			return false;
		},

		isImplements: function(interfaceStr) {
			for (var i = 0; i < this._implements.length; i++) {
				if (this._implements[i] === interfaceStr) {
					return true;
				}
			}
			return false;
		},

		callDelegate: function(methodName, params, defaultReturnValue) {
			if ((this.delegate) && (typeof(this.delegate[methodName]) !== 'undefined')) {
				var ret = this.delegate[methodName].apply(this.delegate, params);
				if (ret || ret === 0) {
					return ret;
				} else {
					return defaultReturnValue;
				}
			}
		},

		clone: function() {
			return Object.create(this);
		},

		toString: function() {
			return this._class;
		},

		context: function(callback) {
			var self = this;
			return function(){ callback.apply(self, arguments);};
		}
	});

	/*==================================================================================
	*	Mobile Framework
	*==================================================================================*/
	Class('STApplication', {

		config: null,
		view: null,

		STApplication: function(params) {
			var self = this;
			window.App = this;
			var loadApp = function(){
				ajax({
					url: 'config/config.json',
					success: function(res) {
						self.config = JSON.parse(res);
						window.Log = new STLog((self.config && self.config.logger && self.config.logger.level) ? self.config.logger.level : 0);
						self.notificationCenter = new STNotificationCenter();
						self.settings = new STUserSettings();
						if (self.config.strings) {
							window.Strings = new STStrings(self.config.strings);
						}
						self.filemanager = new STFileManager((self.config && self.config.filesystem) ? self.config.filesystem.size : null);
						self.view = new params.view();
						self.setDelegate(self.view);
						document.body.appendChild(self.view.element);
						if (Defaults.styleInjection) {
							setTimeout(function(){self.view.element.className += ' in';},0);
						}
						self.view.render();
					},
					context: this
				});
			};
			if (params.onload === false) {
				return loadApp();
			}
			window.addEventListener('load', function() {
				if (window.device) {
					document.addEventListener('deviceready', loadApp, false);
				} else {
					loadApp();
				}
			}, false);
		}
	});

	Class('STUserSettings', {

		set: function(key, value) {
			try {
				value = JSON.stringify(value)
			} catch (ex) {

			} finally {
				window.localStorage.setItem(key, value);
			}
		},

		get: function(key) {
			var value;
			try {
				value = window.localStorage.getItem(key);
				value = JSON.parse(value);
			} catch (ex) {

			} finally {
				return value;
			}
		},

		remove: function(key) {
			window.localStorage.removeItem(key);
		}
	});

	Class('STServer', {

		domain: null,

		post: function(url, data, headers, success, error, options) {
			this.request(url, 'POST', data, headers, success, error, options);
		},

		get: function(url, data, headers, success, error, options) {
			this.request(url, 'GET', data, headers, success, error, options);
		},

		request: function(url, method, data, headers, success, error, options) {
			var val,key,rx;
			options = options || {};
			options.sync = options.sync || false;
			headers = headers || {};
			headers["Content-type"] = (headers && headers["Content-type"]) ? headers["Content-type"] : "application/json";
			if (data) { for (key in data) { val = data[key]; rx = new RegExp(":"+key,'g'); url = url.replace(rx,val);}}
			ajax({
				url: (this.domain) ? this.domain + url : url,
				success: function(data) {
					try {
						data = JSON.parse(data);
					} catch (ex) { } 
					finally {
						success(data);
					}
				},
				error: error,
				sync: options.sync,
				method: method,
				data: data,
				headers: headers
			});
		}
	});

	Class('STView', {

		element: null,
		subviews: null,
		parentview: null,

		STView: function() {
			this.element = generateViewElement(this);
			this.subviews = [];
		},

		initTemplate: function(htmlString) {
			_cached_templates[this._class] = htmlString;
			this.element = generateViewElement(this, this.element);
		},

		render: function() {},

		callSubviews: function(methodName, params) {
			var subview;
			for (var i = this.subviews.length-1; i >= 0; i--) {
				subview = this.subviews[i];
				if (subview[methodName]) {
					subview[methodName].apply(subview, params);
				}
			}
		},

		toggleClass: function(element, className, condition) {
			var el;
			if (typeof(element) === 'object') {
				el = element;
			} else if (typeof(element) === 'string') {
				el = this.element.querySelector(element);
			}
			var re = new RegExp("\s*" + className + "\s*", "g");
			if (typeof(condition) === 'undefined') {
				el.className = (el.className.match(re)) ? el.className.replace(re, "") : el.className + " " + className;
			} else if (condition === true) {
				el.className = (el.className.match(re)) ? el.className : el.className + " " + className;
			} else if (condition === false) {
				el.className = (el.className.match(re)) ? el.className.replace(re, "") : el.className;
			}
		},

		addView: function(stview, container) {
			var containerEl = null;
			if (typeof(container) === 'object') {
				containerEl = container;
			} else if (typeof(container) === 'string') {
				containerEl = this.element.querySelector(container);
			}
			if (!containerEl) {
				containerEl = this.element;
			}
			stview.parent = this;
			stview.render.apply(stview);
			if (Defaults.styleInjection) {
				setTimeout(function() {stview.element.className += " in";}, 0);
			}
			stview.parentview = this;
			this.subviews.push(stview);
			containerEl.appendChild(stview.element);
		},

		beforeRemove: function(options) {},

		remove: function() {
			var subview, options = { wait: 0, remove: true }, self = this;
			this.beforeRemove(options);
			if (options.remove) {
				if (Defaults.styleInjection) {
					this.element.className = this.element.className.replace(' in', ' out');
				}
				var doRemove = function() {
					if (self.parentview) {
						for (var i = 0; i < self.parentview.subviews.length; i++) {
							if (self.parentview.subviews[i] === self) {
								self.parentview.subviews.splice(i, 1);
								break;
							}
						}
						// remove dom element
						if (self.element.parentNode) {
							self.element.parentNode.removeChild(self.element);
						}
						// remove all subviews
						while (typeof(subview = self.subviews.pop()) != 'undefined') {
							subview.remove();
						}
						self.parentview = null;
						if (Defaults.styleInjection) {
							self.element.className = self.element.className.replace(' out', '');
						}
					}
				};
				if (options.wait) {
					setTimeout(doRemove,options.wait);
				} else {
					doRemove();
				}
				return true;
			}
			return false;
		},

		select: function(selector) {
			var elements = this.element.querySelectorAll(selector);
			if (elements.length === 0) {
				return this.element;
			} else if (elements.length === 1) {
				return elements[0];
			} else {
				return elements;
			}
		}
	});

	Class('STRouterView::STView', {

		_current_view: null,
		_current_path: null,
		routes: {},

		STRouterView: function() {
			window.addEventListener('hashchange',this.context(function(){
				this.onRoute(document.location.hash.substr(1,document.location.hash.length-1));
			}), true);
		},

		render: function() {
			this.onRoute(document.location.hash.substr(1,document.location.hash.length-1));
		},

		route: function(path) {
			document.location.hash = path;
		},

		onRoute: function(path) {
			var r = null,m = null,def_match = null,def_match_matches = null,best_match = null,best_match_matches = null,match_score = 0;
			if (this._current_path === path) {return;}
			for (r in this.routes) {
				m = path.match(r);
				if (this.routes[r].default) {
					def_match = r;
					def_match_matches = m;
				}
				if (m && m.length && r.length >= match_score) {
					match_score = r.length;
					best_match_matches = m;
					best_match = r;
				}
			}
			r = best_match ? best_match : def_match;
			m = best_match ? best_match_matches : def_match_matches;
			if (r) {
				var view = _classes[this.routes[r].view];
				this._current_path = path;
				if ((this._current_view) && (view.prototype._class == this._current_view._class)) {
					if (this.routes[r].method && typeof(this._current_view[this.routes[r].method]) === 'function') {
						this._current_view[this.routes[r].method].apply(this._current_view, m);
					}
				} else {
					if (this._current_view !== null) {
						this._current_view.remove();
					}
					this._current_view = new view();
					this.addView(this._current_view, this.routes[r].container);
					if (this.routes[r].method && typeof(this._current_view[this.routes[r].method]) === 'function') {
						this._current_view[this.routes[r].method].apply(this._current_view, m);
					}
				}
				return;
			}
		}
	});

	Class('STNavigationView::STView', {

		views: null,
		hash_timestamp: null,

		STNavigationView: function() {
			this.hash_timestamp = (new Date()).getTime();
			document.location.hash = this.hash_timestamp;
			var self = this;
			window.addEventListener('hashchange',function(){
				var timestamp = Number(document.location.hash.substr(1,document.location.hash.length)),
					currentView = (self.views && self.views.length) ? self.views[self.views.length-1] : null;
				if ((timestamp < self.hash_timestamp) && (currentView)){
					var removed = currentView.remove();
					if (removed) {
						self.views.pop();
						if (self.views[self.views.length-1]) {
							self.views[self.views.length-1].element.style.display = "block";
							self.views[self.views.length-1].render();
						}
					} else {
						window.history.forward();
					}
				}
			}, false);
		},

		navigate: function(view, container) {
			if (this.views === null) {
				this.views = [];
			} else if (this.views.length) {
				this.views[this.views.length - 1].element.style.display = "none";
			}
			view.navigationView = this;
			this.views.push(view);
			this.addView(view, container);
			this.hash_timestamp = (new Date()).getTime();
			document.location.hash = this.hash_timestamp;
		},

		back: function() {
			window.history.back();
		}
	});

	Class('STNotificationCenter', {

		listeners: null,

		addObserver: function(observer, method, name) {
			if (this.listeners == null) {this.listeners = {};}
			if (typeof(this.listeners[name]) === 'undefined') {
				this.listeners[name] = [];
			}
			this.listeners[name].push({observer: observer, method: method});
		},

		removeObserver: function(observer, method, name) {
			if (this.listeners == null) { return; }
			for (var i = 0; (this.listeners[name]) && (this.listeners[name].length) && (i < this.listeners[name].length); i++) {
				if ((this.listeners[name][i].observer == observer) && (this.listeners[name][i].method == method)) {
					this.listeners[name][i].splice(i, 1);
				}
			}
		},

		postNotification: function(name, object) {
			if (this.listeners == null) { return;}
			for (var i = 0; (this.listeners[name]) && (this.listeners[name].length) && (i < this.listeners[name].length); i++) {
				this.listeners[name][i].method.apply(this.listeners[name][i].observer, [object]);
			}
		}
	});

	Class('STDatabase', {

		name: 'Database',
		size: (10 * 1024 * 1024),
		version: '1.0',
		description: 'StackJS Application DB',
		db: null,

		STDatabase: function() {
			if (this.db == null) {
				this.db = openDatabase(this.name, this.version, this.description, this.size);
			}
		},

		save: function(tableName, data, callback) {
			callback = callback || function(){};
			var createQuery = 'CREATE TABLE IF NOT EXISTS ' + tableName + ' ',
				insertQuery = 'INSERT OR REPLACE INTO ' + tableName + ' ',
				key, keys = [], values = [], q = [];
			for (key in data) {
				keys.push(key); q.push('?'); values.push(encodeDBValue(data[key]));
			}
			createQuery += '(' + keys.join(',') + (data.id ? ', PRIMARY KEY (id)' : '') + ')';
			insertQuery += '('+keys.join(',')+') VALUES ('+q.join(',')+')';

			this.db.transaction(function(tx) {
				tx.executeSql(createQuery);
				tx.executeSql(insertQuery, values);
				callback([]);
			},function(err){
				callback([]);
			});
		},

		get: function(tableName, data, callback) {
			callback = callback || function(){};
			var selectQuery = "SELECT * from " + tableName,
				key, conditions = [], value;
			for (key in data) {
				value = encodeDBValue(data[key]);
				conditions.push(key + ' = ' + ((typeof(value) === 'string') ? '"' + value + '"' : value));
			}
			selectQuery += (conditions.length) ? ' WHERE ' + conditions.join(' AND '): '';
			this.db.transaction(function(tx){
				tx.executeSql(selectQuery, [], function(tx, results){
					var items = [];
					for (var i = 0; i < results.rows.length; i++) {
						items[i] = {};
						for (key in results.rows.item(i)) {
							items[i][key] = decodeDBValue(results.rows.item(i)[key]);
						}
					}
					callback(items);
				});
			}, function(err) {
				callback([]);
			});
		},

		delete: function(tableName, data, callback) {
			callback = callback || function(){};
			var deleteQuery = "DELETE FROM " + tableName,
				key, conditions = [], value;
			for (key in data) {
				value = encodeDBValue(data[key]);
				conditions.push(key + ' = ' + ((typeof(value) === 'string') ? '"' + value + '"' : value));
			}
			deleteQuery += (conditions.length) ? ' WHERE ' + conditions.join(' AND '): '';
			this.db.transaction(function(tx){
				tx.executeSql(deleteQuery, [], function(tx, results){
					callback();
				});
			}, function(err) {
				callback([]);
			});
		}
	});

	Class('STFileManager', {

		size: 5 * 1024 * 1024,
		_fs: null,

		STFileManager: function(size) {
			var PERSISTENT = window.PERSISTENT || 1;
			this.size = size || this.size;
			if (window.webkitStorageInfo) {
				window.webkitStorageInfo.requestQuota(PERSISTENT, this.size, this.context(function(grantedBytes){
					window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
					window.requestFileSystem(PERSISTENT, grantedBytes, this.context(function(fs){
						this._fs = fs;
					}),function(err){
						Report.error(1, err);
					});
				}), function(err){
					Report.error(1, err);
				});
			} else if (window.requestFileSystem) {
				window.requestFileSystem(PERSISTENT, this.size, this.context(function(fs){
					this._fs = fs;
				}),function(err){
					Report.error(1, err);
				});
			} else {
				Report.error(0, null);
			}
		},

		readFile: function(path, success, error) {
			var self = this,
				reader = new FileReader();
			success = success || function(){};
			error = error || function(){};
			this._fs.root.getFile(path, {create: false}, function(entry) {
				entry.file(function(file){
					reader.onloadend = function(e){
						success.apply(self, [this.result, entry]);
					};
					reader.readAsText(file);
				});
			}, function(err){ error.apply(self, [err]);});
		},

		readDir: function(path, success, error) {
			var self = this,
				reader,
				dirContent = [];
			success = success || function(){};
			error = error || function(){};
			this._fs.root.getDirectory(path, {create: false}, function(entry) {
				reader = entry.createReader();
				reader.readEntries(function(entries){
					for (var i = 0; i < entries.length; i++) {
						dirContent.push(entries[i].name);
					}
					success.apply(self, [dirContent, entry]);
				});
			}, function(err){ error.apply(self, [err]);});
		},

		createFile: function(path, success, error) {
			var self = this;
			success = success || function(){};
			error = error || function(){};
			this._fs.root.getFile(path, {create: true}, function(entry) {
				success.apply(self, [entry]);
			}, function(err){ error.apply(self, [err]);});
		},

		createDir: function(path, success, error) {
			var self = this;
			success = success || function(){};
			error = error || function(){};
			this._fs.root.getDirectory(path, {create: true}, function(entry) {
				success.apply(self, [entry]);
			}, function(err){ error.apply(self, [err]);});
		},

		writeFile: function(path, data, success, error) {
			var self = this;
			success = success || function(){};
			error = error || function(){};
			this.createFile(path, function(entry){
				entry.createWriter(function(fileWriter){
					var blob = (window.Blob) ? new Blob([data], {type: 'text/plain'}) : data;
					fileWriter.onwriteend = function(){
						success.apply(self, [entry]);
					};
					fileWriter.write(blob);
				});
			}, error);
		},

		deleteFile: function(path, success, error) {
			var self = this;
			success = success || function(){};
			error = error || function(){};
			this._fs.root.getFile(path, {create: false}, function(entry) {
				entry.remove(function(){success.apply(self);},function(err){error.apply(self,[err]);});
			}, function(err){ error.apply(self, [err]);});
		},

		deleteDir: function(path, success, error) {
			var self = this;
			success = success || function(){};
			error = error || function(){};
			this._fs.root.getDirectory(path, {create: false}, function(entry) {
				entry.removeRecursively(function(){success.apply(self);},function(err){error.apply(self,[err]);});
			}, function(err){ error.apply(self, [err]);});
		}
	});

	Class('STLog', {

		level: 0,

		STLog: function(level) {
			this.level = level;
		},

		print: function(priority, tag, message) {
			if ((priority >= this.level) && (Defaults.logEnabled)) {
				console.log('['+tag.toUpperCase()+']: ' + message);
			}
		},

		d: function(tag, message) {
			this.print(0, tag, message);
		},

		i: function(tag, message) {
			this.print(1, tag, message);
		},

		w: function(tag, message) {
			this.print(2, tag, message);
		},

		e: function(tag, message) {
			this.print(3, tag, message);
		},

		getStackTrace: function() {
			Stack.trace("Trace.");
		}
	});

	Class('STSoundPool', {

		_pool: {},

		STSoundPool: function(object) {
			for (var key in object) {
				this.put(key, object[key]);
			}
		},

		put: function(soundId, url) {
			var el = document.createElement('audio');
			el.id = "stsound_" + soundId;
			el.setAttribute('src', url);
			el.setAttribute('width', 0);
			el.setAttribute('height', 0);
			el.load();
			this._pool[soundId] = el;
		},

		play: function(soundId, options) {
			var el = this._pool[soundId];
			if (el) {
				el.play();
			}
		},

		stop: function(soundId) {
			var el = this._pool[soundId];
			if (el) {
				el.pause();
				try {
					el.currentTime = 0;
				} catch (ex) {}
			}
		},

		pause: function(soundId) {
			var el = this._pool[soundId];
			if (el) {
				el.pause();
			}
		}

	});

	Class('STStrings', {

		langs: {},
		language: null,

		STStrings: function(config) {
			for (var key in config) {
				if (!this.language) {
					this.language = key;
				}
				this.load(key, config[key]);
			}
		},

		load: function(language, file) {
			ajax({
				url: file,
				success: function(res) {
					this.langs[language] = JSON.parse(res);
				},
				error: function() {
					Report.message('strings config file ('+file+') is not existed');
				},
				sync: true,
				context: this
			});
		},

		get: function(key) {
			return (this.langs && this.langs[this.language] && this.langs[this.language][key]) ? this.langs[this.language][key] : key;
		}
	});

	/*==================================================================================
	*	Export globals
	*==================================================================================*/
	global.Class = Class;
	global.Interface = Interface;
	global.Throw = Throw;
	global.StackJS = StackJS;
})(this);