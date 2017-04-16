/**
 * jQuery sfPrototypeMan Plugin
 *
 * Released under the MIT license
 *
 * @see https://github.com/wiese/jquery-sfPrototypeMan
 */
(function($, document) {
	var SfPrototypeMan, SfPrototypeContainer;

	/**
	 * @param {jQuery} context
	 * @param {Object} settings
	 */
	SfPrototypeMan = function(context, settings) {
		context = $(context);

		// is the given context usable?
		if(context.length === 0) {
			context = document;
		}

		var config = $.extend({}, $.fn.sfPrototypeMan.defaultOptions, settings),
			containers = [];

		this.getContainers = function() {
			return containers;
		};

		$(config.containerSelector, context).each(function() {
			var container = new SfPrototypeContainer($(this), config);
			container.applyExtensions();
            container.applySizeConstraints();
			containers.push(container);
		});
	};

	/**
	 * @param {jQuery} container jQuery extended dom element to be used
	 * @param {Object} config    Configuration value object
	 */
	SfPrototypeContainer = function(container, config) {
		this._container = container;
		this._config = config;
        this._fieldConfig = {};

		if (!this._container.jquery || this._container.length !== 1) {
			throw "Container has to be _one_ jQuery extended element";
		}
		if (!this._container.data(this._config.prototypeDataKey)) {
			throw "Container lacks configured prototype data key";
		}
	};

	SfPrototypeContainer.prototype = {
		/**
		 * Apply DOM modifications and other changes as per configuration
		 *
		 * @return void
		 */
		applyExtensions: function() {
			this._extendContainer();
			this._extendFields();
		},

		applySizeConstraints: function() {
			var data = this._container.data(),
				counter = this._getExisting().length;
			if (data.constrainedCollectionMinSize) {
				this._fieldConfig.minSize = data.constrainedCollectionMinSize;
			}
			if (data.constrainedCollectionMaxSize) {
				this._fieldConfig.maxSize = data.constrainedCollectionMaxSize;
			}

			if (this._fieldConfig.minSize){
				for (var i = counter, l= this._fieldConfig.minSize; i<l; i++){
					this.addField();
				}
			}
        },

		/**
		 * Notify the object that the order of existing children was changed
		 *
		 * @return void
		 */
		orderChanged: function() {
			this._reindexFields();
		},

		/**
		 * Get the DOM element representing the container
		 *
		 * @tutorial this._container in this scope is the jQuery extended version of
		 * the DOM element, which holds the element as first (and only) content
		 *
		 * @return HTMLElement
		 */
		getDomElement: function() {
			return this._container[0];
		},

		/**
		 * Add another (empty) field to the end of the collection
		 *
		 * @return void
		 */
		addField: function() {
			var counter = this._getExisting().length,
				maxSize = this._fieldConfig.maxSize,
				mustAppend = true;

			if (typeof maxSize != "undefined") {
				if (counter >= maxSize){
					mustAppend = false;
					this._container.trigger("prototype.maxsize-already-reached", [this]);
				}
			}

			if (mustAppend){
				var newElement = this._createField(counter);
				newElement.appendTo(this._container);

				this._container.trigger("prototype.added", [this]);

				if (maxSize && counter - maxSize === 1){
					this._container.trigger("prototype.maxsize-reached", [this]);
				}
			}
		},

		/**
		 * Get the instantiations of the prototype, that is sub-forms/fields
		 *
		 * @return jQuery
		 */
		_getExisting: function() {
			return this._container.children();
		},

		/**
		 * Get txt with %%variables%% replaced by { "varibles": "data object" }
		 *
		 * @todo Potentially move into config as anonymous/changeable function
		 *
		 * @example _getText("%%a%% hive", { a: "bee" }) // yields "bee hive"
		 *
		 * @param {String} txt  A template string
		 * @param {Object} data A key-value object what to replace (by key) in txt
		 *
		 * @return {String}
		 */
		_getText: function(txt, data) {
			if ($.isPlainObject(data)) {
				$.each(data, function(variable, value) {
					txt = txt.replace("%%" + variable + "%%", value);
				});
			}
			return txt;
		},

		/**
		 * Perform the key container modifications
		 *
		 * @return void
		 */
		_extendContainer: function() {
			this._container.addClass(this._config.containerClass);

			var containerRef = this._container;
			$.each(this._config.containerListeners, $.proxy(function(eventName, callback) {
				containerRef.on(eventName, $.proxy(callback, this));
			}, this));

			this._addAddButton();
		},

		/**
		 * Add the button responsible for adding another instance of prototype
		 *
		 * @return HTMLElement The button object
		 */
		_addAddButton: function() {
			var	addMe = $(this._config.addButtonMarkup),
				containerId = this._container.attr("id");
			addMe.html(this._getText(this._config.addButtonText, { field: containerId }));
			addMe.click($.proxy(function(event) {
				event.preventDefault();
				this.addField();
			}, this));
			addMe.insertAfter(this._container);
			return addMe[0];	// returning the element, not the jQuery of it
		},

		/**
		 * Get the data-less HTML source of the prototype instance of given index
		 *
		 * @param {Int} position The position (index) of the prototype instance
		 *
		 * @return string
		 */
		_getFieldHtml: function(position) {
			var html = this._container.data(this._config.prototypeDataKey);

			return html
				.replace(this._config.fieldLabelPattern, position)
				.replace(this._config.fieldNamePattern, position);
		},

		/**
		 * Perform the key container modifications
		 *
		 * @param {Int} position The position (index) of the prototype instance
		 *
		 * @return {jQuery}
		 */
		_createField: function(position) {
			var html = this._getFieldHtml(position),
				field = $($.parseHTML(html));
			this._extendField(field);
			return field;
		},

		/**
		 * Perform the modifications of all prototype instances
		 *
		 * @return void
		 */
		_extendFields: function() {
			this._getExisting().each($.proxy(function(index, field) {
				this._extendField(field);
			}, this));
		},

		/**
		 * Callback performed on triggering of a prototype instance's remove button
		 *
		 * @param {jQuery.Event} event The jQuery event
		 *
		 * @return void
		 */
		_rmButtonCallback: function(event) {
			event.preventDefault();

			var field = $(event.delegateTarget).parent(),
				// rm last field doesn't change order - save some performance
				doReindex =! this._getExisting().last().is(field);

			field.remove();

			if (doReindex) {
				this._reindexFields();
			}

			this._container.trigger("prototype.elementremoved", [this]);
		},

		/**
		 * Perform the modifications of a prototype instance
		 *
		 * @param {jQuery} field The DOM element of the prototype instance to change
		 *
		 * @return void
		 */
		_extendField: function(field) {
			var minus = $($.parseHTML(this._config.rmButtonMarkup));
			minus.html(this._getText(this._config.rmButtonText));

			minus.click($.proxy(this._rmButtonCallback, this));

			$(field).append(minus);
		},

		/**
		 * Update the index (position in the list) of all prototype instances
		 *
		 * @return void
		 */
		_reindexFields: function() {
			this._getExisting().each($.proxy(function(index, field) {
				field = $(field);

				// collecting data currently present inside field
				var data = $(this._config.allInputsSelector, field).serializeArray(),
					newField = this._createField(index);
				/**
				 * We trust that order of inputs will be identical every time
				 * field names can not be relied on as they contain the index we change
				 * @tutorial Omitting callback's 'value' parameter we don't use
				 */
				$(this._config.allInputsSelector, newField).val(function(j) {
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
		prototypeDataKey: "prototype",
		containerSelector: "form *[data-prototype]",
		containerClass: "sfPrototypeMan",
		fieldLabelPattern: /__name__label__/g,
		fieldNamePattern: /__name__/g,	// Symfony's "protoype_name"
		allInputsSelector: ":input",
		addButtonMarkup: "<a href='#' class='addPrototype' />",
		addButtonText: "Add a %%field%%",
		rmButtonMarkup: "<a href='#' class='rmElement' />",
		rmButtonText: "Remove entry",
		/**
		 * Callbacks that will be attached to each individual container
		 *
		 * @tutorial Expects {jQuery.Event} as first parameter
		 * @tutorial The container object is bound to be 'this'
		 */
		containerListeners: {
			/**
			 * jQuery UI Sortable Widget reorder callback - post DOM position change
			 * @tutorial We omit the parameters 'event'&'ui' as we don't use them
			 * @see http://api.jqueryui.com/sortable/#event-update
			 */
			"sortupdate": function() {
				this.orderChanged();
			}
		}
	};

	// handle for unit tests to get direct access to the classes
	$.fn.sfPrototypeMan.classes = {
		SfPrototypeMan: SfPrototypeMan,
		SfPrototypeContainer: SfPrototypeContainer
	};
})(jQuery, document);
