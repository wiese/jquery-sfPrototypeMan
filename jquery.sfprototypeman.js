/**
 * jQuery sfPrototypeMan Plugin
 *
 * @todo Revealing Module pattern testable?
 *
 * @see https://github.com/wiese/jquery-sfPrototypeMan
 */
(function($, document) {
	/**
	 * @param jQuery context
	 * @param object settings
	 */
	var SfPrototypeMan = function(context, settings) {
		context = $(context);

		// is the given context usable?
		if(context.length == 0) {
			context = document;
		}

		var config = $.extend({}, $.fn.sfPrototypeMan.defaultOptions, settings);

		var containers = [];

		this.getContainers = function() {
			return containers;
		};

		$(config.containerSelector, context).each(function() {
			var container = new SfPrototypeContainer($(this), config);
			containers.push(container);
		});
	};

	/**
	 * @param jQuery container jQuery extended dom element to be used
	 * @param object config    Configuration value object
	 */
	var SfPrototypeContainer = function(container, config) {
		this._container = container;
		this._config = config;

		this.init();
	};

	SfPrototypeContainer.prototype = {
		init: function() {
			this._checkParams();
			this._extendContainer();
			this._extendFields();
		},

		orderChanged: function() {
			this._reindexFields();
		},

		/**
		 * @tutorial Container in this scope is the jQuery extended version of the
		 * DOM element, which holds the element as its the first (and only) content
		 *
		 * @return HTMLElement
		 */
		getDomElement: function() {
			return this._container[0];
		},

		_checkParams: function() {
			if (!this._container.jquery || this._container.length != 1) {
				throw 'Container has to be _one_ jQuery extended element';
			}
			if (!this._container.data(this._config.prototypeDataKey)) {
				throw 'Container lacks configured prototype data key';
			}
		},

		_getExisting: function() {
			return this._container.children();
		},

		_getText: function(txt, data) {
			if (typeof data == 'object') {
				$.each(data, function(variable, value) {
					txt = txt.replace('%%' + variable + '%%', value);
				});
			}
			return txt;
		},

		_extendContainer: function() {
			this._container.addClass(this._config.containerClass);

			var containerRef = this._container;
			$.each(this._config.containerListeners, $.proxy(function(eventName, callback) {
				containerRef.on(eventName, $.proxy(callback, this));
			}, this));

			this._addAddButton();
		},

		_addAddButton: function() {
			var addMe = $(this._config.addButtonMarkup);
			var containerId = this._container.attr('id');
			addMe.html(this._getText(this._config.addButtonText, { field: containerId }));
			addMe.click($.proxy(this._addButtonCallback, this));
			addMe.insertAfter(this._container);
			return addMe;
		},

		_addButtonCallback: function(event) {
			event.preventDefault();

			var counter = this._getExisting().length;
			newElement = this._createField(counter);
			newElement.appendTo(this._container);

			this._container.trigger('prototype.added');
		},

		_getFieldHtml: function(fieldNumber) {
			var html = this._container.data(this._config.prototypeDataKey);

			html = html
				.replace(this._config.fieldLabelPattern, fieldNumber)
				.replace(this._config.fieldNamePattern, fieldNumber);

			return html;
		},

		_createField: function(fieldNumber) {
			var html = this._getFieldHtml(fieldNumber);
			var field = $($.parseHTML(html));
			this._extendField(field);
			return field;
		},

		_extendFields: function() {
			this._getExisting().each($.proxy(function(index, field) {
				this._extendField(field);
			}, this));
		},

		_rmButtonCallback: function(event) {
			event.preventDefault();

			var field = $(event.delegateTarget).parent();

			// rm last field doesn't change order - save some performance
			var doReindex =! this._getExisting().last().is(field);

			field.remove();

			if (doReindex) {
				this._reindexFields();
			}

			this._container.trigger('prototype.elementremoved');
		},

		_extendField: function(field) {
			var minus = $($.parseHTML(this._config.rmButtonMarkup));
			minus.html(this._getText(this._config.rmButtonText));

			minus.click($.proxy(this._rmButtonCallback, this));

			$(field).append(minus);
		},

		_reindexFields: function() {
			this._getExisting().each($.proxy(function(index, field) {
				field = $(field);

				// collecting data currently present inside field
				var data = $(this._config.allInputsSelector, field).serializeArray();

				var newField = this._createField(index);
				// we trust that order of inputs will be identical every time
				// field names can not be relied on as they contain the index we change
				$(this._config.allInputsSelector, newField).val(function(j, value) {
					return data[j].value;
				});

				field.replaceWith(newField);
			}, this));
		}
	};

	$.fn.sfPrototypeMan = function(settings) {
		return new SfPrototypeMan(this, settings);
	};

	$.fn.sfPrototypeMan.defaultOptions = {
		prototypeDataKey: 'prototype',
		containerSelector: 'form *[data-prototype]',
		containerClass: 'sfPrototypeMan',
		fieldLabelPattern: /__name__label__/g,
		fieldNamePattern: /__name__/g,	// Symfony's "protoype_name"
		allInputsSelector: ':input',
		addButtonMarkup: '<a href="#" class="addPrototype" />',
		addButtonText: 'Add a %%field%%',
		rmButtonMarkup: '<a href="#" class="rmElement" />',
		rmButtonText: 'Remove entry',
		/**
		 * Callbacks that will be attached to each individual container
		 *
		 * @tutorial Expects jQuery event object as first parameter
		 * @tutorial The container object is 'this'
		 */
		containerListeners: {
			/**
			 * jQuery UI Sortable Widget reorder callback - post DOM position change
			 * @see http://api.jqueryui.com/sortable/#event-update
			 */
			'sortupdate': function(event, ui) {
				this.orderChanged();
			}
		}
	};

	$.fn.sfPrototypeMan.classes = {
		SfPrototypeMan: SfPrototypeMan,
		SfPrototypeContainer: SfPrototypeContainer
	};
})(jQuery, document);
