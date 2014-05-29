Class('APIView::STView', {

	template: 'api-view',

	apiContainerEl: null,

	render: function() {
		this.loadAPI('lib/stackjs.api.json', this.apiContainerEl);
		setTimeout(this.context(function(){
			var textAreas = this.select('textarea');
			if (textAreas === this.element) { return; }
			textAreas = (textAreas.length) ? textAreas : [textAreas];
			for (var i = 0; i < textAreas.length; i++) {
				CodeMirror.fromTextArea(textAreas[i], {theme: "monokai", readOnly: true, fixedGutter: false});	
			}
		}),100);
	},

	close: function() {
		this.remove({timeout: 300});
	},

	loadAPI: function(file, container) {
		var html = "";
		STServer().request(file, 'get', null, null, this.context(function(api) {
			html += "<h1>"+api.name+"</h1>";
			html += "<p>API Version: "+api.version+"</p>";
			html += "<ul>";
			html += "<li>";
			for (var className in api.classes) {
				html += "<h2>"+className+" Class</h2>";
				html += "<hr>";
				html += "<p>"+api.classes[className].description+"</p>";
				if (api.classes[className].configuration) {
					html += "<p><u>Config:</u> "+api.classes[className].configuration+"</p>";
				}
				if (api.classes[className].properties) {
					html += "<ul>";
					for (var propertyName in api.classes[className].properties) {
						html += "<li>";
						html += '<h3>this.'+propertyName+'</h3>';
						html += '<a>Type: '+api.classes[className].properties[propertyName].type+'</a>';
						html += '<p>'+api.classes[className].properties[propertyName].description+'</p>';
						html += "</li>";
					}
					html += "</ul>";
				}
				if (api.classes[className].methods) {
					html += "<ul>";
					for (var methodName in api.classes[className].methods) {
						html += "<li>";
						html += '<h3>' +api.classes[className].methods[methodName].output + ' function '+methodName + '(' + api.classes[className].methods[methodName].input + ');</h3>';
						html += '<p>'+api.classes[className].methods[methodName].description+'</p>';
						var example = api.classes[className].methods[methodName].example;
						if (example) {
							html += '<textarea>'+example.join('\n')+'</textarea>';
						}
						html += "</li>";
					}
					html += "</ul>";
				}
			}
			html += '</li>';
			html += '</ul>';
			this.apiContainerEl.innerHTML = html;
		}));
	}
});