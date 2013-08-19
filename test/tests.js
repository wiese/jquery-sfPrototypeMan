var lifecycle = {};

/**
 * @param string name
 *
 * @return HTMLElement The plain DOM element - w/o jQuery extension (!)
 */
function getFixture(name) {
	var fixtures = {
		'animals':
			'<div>'+
				'<label>Animals</label>'+
				'<div data-prototype="&lt;div&gt;&lt;label class=&quot;required&quot;&gt;__name__label__&lt;/label&gt;&lt;div id=&quot;MyFormType_animals___name__&quot;&gt;&lt;div&gt;&lt;label for=&quot;MyFormType_animals___name___name&quot; class=&quot;required&quot;&gt;Name&lt;/label&gt;&lt;input type=&quot;text&quot; id=&quot;MyFormType_animals___name___name&quot; name=&quot;MyFormType[animals][__name__][name]&quot; required=&quot;required&quot; /&gt;&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;" id="MyFormType_animals">'+
					'<div>'+
						'<label class="required">0</label>'+
						'<div id="MyFormType_animals_0">'+
							'<div>'+
								'<label class="required" for="MyFormType_animals_0_name">Name</label>'+
								'<input type="text" required="required" name="MyFormType[animals][0][name]" id="MyFormType_animals_0_name" value="Lion">'+
							'</div>'+
						'</div>'+
					'</div>'+
				'</div>'+
			'</div>',
		'plants':
			'<div>'+
				'<label>Plants</label>'+
				'<div data-prototype="&lt;div&gt;&lt;label class=&quot;required&quot;&gt;__name__label__&lt;/label&gt;&lt;div id=&quot;NotherFormType_plants___name__&quot;&gt;&lt;div&gt;&lt;label for=&quot;NotherFormType_plants___name___name&quot; class=&quot;required&quot;&gt;Name&lt;/label&gt;&lt;input type=&quot;text&quot; id=&quot;NotherFormType_plants___name___name&quot; name=&quot;NotherFormType[plants][__name__][name]&quot; required=&quot;required&quot; /&gt;&lt;/div&gt;&lt;/div&gt;&lt;/div&gt;" id="NotherFormType_plants">'+
					'<div>'+
						'<label class="required">0</label>'+
						'<div id="NotherFormType_plants_0">'+
							'<div>'+
								'<label class="required" for="NotherFormType_plants_0_name">Name</label>'+
								'<input type="text" required="required" name="NotherFormType[plants][0][name]" id="NotherFormType_plants_0_name" value="Lion">'+
							'</div>'+
						'</div>'+
					'</div>'+
				'</div>'+
			'</div>'
	};
	fixtures['formAnimals'] = '<form>'+fixtures['animals']+'</form>';
	fixtures['formPlants'] = '<form>'+fixtures['plants']+'</form>';
	fixtures['twoOneForm'] = '<form>'+fixtures['animals']+fixtures['plants']+'</form>';
	fixtures['twoTwoForms'] = '<form>'+fixtures['animals']+'</form><form>'+fixtures['plants']+'</form>';
	var html = '<div>' + fixtures[name] + '</div>';	// incl a root element
	return jQuery.parseHTML(html)[0];
}

function assertType(variable, type, message) {
	return equal(jQuery.type(variable), type, message);
}

module('Plugin', lifecycle);

test('plugged in', 1, function () {
	assertType(jQuery.fn.sfPrototypeMan, 'function');
});

test('default options set', 12, function () {
	var defaultOptions = jQuery.fn.sfPrototypeMan.defaultOptions;
	assertType(defaultOptions, 'object');
	assertType(defaultOptions.prototypeDataKey, 'string');
	assertType(defaultOptions.containerSelector, 'string');
	assertType(defaultOptions.containerClass, 'string');
	assertType(defaultOptions.fieldLabelPattern, 'regexp');
	assertType(defaultOptions.fieldNamePattern, 'regexp');
	assertType(defaultOptions.allInputsSelector, 'string');
	assertType(defaultOptions.addButtonMarkup, 'string');
	assertType(defaultOptions.addButtonText, 'string');
	assertType(defaultOptions.rmButtonMarkup, 'string');
	assertType(defaultOptions.rmButtonText, 'string');
	assertType(defaultOptions.containerListeners, 'object');
});

module('Manager', lifecycle);

test('no matches w/o proper dom', 1, function() {
	var man = new $.fn.sfPrototypeMan.classes.SfPrototypeMan(document, $.fn.sfPrototypeMan.defaultOptions);
	equal(man.getContainers().length, 0, 'nothing in test (qunit) dom');
});

// @todo fixture of defaultOptions
test('getting containers', 6, function() {
	var dom = getFixture('twoOneForm');
	var man = new $.fn.sfPrototypeMan.classes.SfPrototypeMan(dom, $.fn.sfPrototypeMan.defaultOptions);
	var containers = man.getContainers();
	assertType(containers, 'array');
	equal(containers.length, 2);
	equal(containers[0].getDomElement(), jQuery('form *[data-prototype]', dom)[0]);
	equal(containers[1].getDomElement(), jQuery('form *[data-prototype]', dom)[1]);
	equal(jQuery(containers[0].getDomElement()).attr('id'), 'MyFormType_animals');
	equal(jQuery(containers[1].getDomElement()).attr('id'), 'NotherFormType_plants');
});

module('Container', lifecycle);

test('add class', 2, function() {
	var dom = jQuery(getFixture('formAnimals'));
	var containerDom = jQuery('*[data-prototype]', dom);
	var container = new $.fn.sfPrototypeMan.classes.SfPrototypeContainer(containerDom, $.fn.sfPrototypeMan.defaultOptions);
	equal(jQuery(container.getDomElement()).hasClass('sfPrototypeMan'), false);
	container._extendContainer();
	equal(jQuery(container.getDomElement()).hasClass('sfPrototypeMan'), true);
});

test('prototype instances', 1, function() {
	var dom = jQuery(getFixture('formAnimals'));
	var containerDom = jQuery('*[data-prototype]', dom);
	var container = new $.fn.sfPrototypeMan.classes.SfPrototypeContainer(containerDom, $.fn.sfPrototypeMan.defaultOptions);
	deepEqual(container._getExisting().toArray(), jQuery('> *', containerDom).toArray());
});

test('get container content', 1, function() {
	var dom = jQuery(getFixture('formAnimals'));
	var containerDom = jQuery('*[data-prototype]', dom);
	var container = new $.fn.sfPrototypeMan.classes.SfPrototypeContainer(containerDom, $.fn.sfPrototypeMan.defaultOptions);

	var children = jQuery(container.getDomElement()).children();
	deepEqual(container._getExisting().toArray(), children.toArray());
});

test('rm button added', 5, function() {
	var dom = jQuery(getFixture('formAnimals'));
	var containerDom = jQuery('*[data-prototype]', dom);
	var container = new $.fn.sfPrototypeMan.classes.SfPrototypeContainer(containerDom, $.fn.sfPrototypeMan.defaultOptions);

	var children = container._getExisting();
	equal(children.length, 1);

	equal(jQuery('> a.rmElement', children[0]).length, 0);
	container._extendFields();
	var rmButtons = jQuery('> a.rmElement', children[0]);
	equal(rmButtons.length, 1);
	var callbacks = jQuery._data(rmButtons[0], 'events')['click'];
	equal(callbacks.length, 1);

	jQuery(rmButtons[0]).trigger('click');

	equal(container._getExisting().length, 0);
});

test('add button added', 6, function() {
	var dom = jQuery(getFixture('formAnimals'));
	var containerDom = jQuery('*[data-prototype]', dom);
	var container = new $.fn.sfPrototypeMan.classes.SfPrototypeContainer(containerDom, $.fn.sfPrototypeMan.defaultOptions);

	var children = container._getExisting();
	equal(children.length, 1);

	equal(jQuery('#MyFormType_animals + a.addPrototype', dom).length, 0);
	var button = container._addAddButton();
	var addButtons = jQuery('#MyFormType_animals + a.addPrototype', dom);
	equal(addButtons.length, 1);

	equal(button, addButtons[0]);
	var callbacks = jQuery._data(button, 'events')['click'];
	equal(callbacks.length, 1);

	jQuery(button).trigger('click');

	equal(container._getExisting().length, 2);
});

test('existing elements look "like" prototype generated ones', 2, function() {
	var dom = jQuery(getFixture('formAnimals'));
	var containerDom = jQuery('*[data-prototype]', dom);
	var container = new $.fn.sfPrototypeMan.classes.SfPrototypeContainer(containerDom, $.fn.sfPrototypeMan.defaultOptions);
	container._extendFields();
	var button = container._addAddButton();

	equal(container._getExisting().length, 1);

	jQuery(button).trigger('click');

	var existingAfter = container._getExisting().toArray();
	equal(existingAfter.length, 2);

	// @todo compare elements except for id, label, field name, ...
	//deepEqual(existingAfter[0], existingAfter[1]);
});

test('add click emits event', 1, function() {
	var dom = jQuery(getFixture('formAnimals'));
	var containerDom = jQuery('*[data-prototype]', dom);
	var container = new $.fn.sfPrototypeMan.classes.SfPrototypeContainer(containerDom, $.fn.sfPrototypeMan.defaultOptions);
	var button = container._addAddButton();

	jQuery(container._container).on('prototype.added', function(event, cont) {
		equal(cont, container);
		start();
	});

	jQuery(button).trigger('click');
});

test('rm click emits event', 1, function() {
	var dom = jQuery(getFixture('formAnimals'));
	var containerDom = jQuery('*[data-prototype]', dom);
	var container = new $.fn.sfPrototypeMan.classes.SfPrototypeContainer(containerDom, $.fn.sfPrototypeMan.defaultOptions);
	container._extendFields();

	var rmButton = jQuery('> a.rmElement', container._getExisting())[0];

	jQuery(container._container).on('prototype.elementremoved', function(event, cont) {
		equal(cont, container);
	});

	jQuery(rmButton).trigger('click');
});

test('listeners attached to container', 1, function() {
	var dom = jQuery(getFixture('formAnimals'));
	var containerDom = jQuery('*[data-prototype]', dom);
	var options = $.fn.sfPrototypeMan.defaultOptions;

	options.containerListeners['loremipsum'] = function() {
		equal(this, container);
	};

	var container = new $.fn.sfPrototypeMan.classes.SfPrototypeContainer(containerDom, options);
	container._extendContainer();

	jQuery(container._container).trigger('loremipsum');
});
