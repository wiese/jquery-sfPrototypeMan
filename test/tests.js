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

module('Plugin');

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

module('Manager');

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

module('Container');

test('add class', 1, function() {
	var dom = jQuery(getFixture('formAnimals'));
	var containerDom = jQuery('*[data-prototype]', dom);
	var container = new $.fn.sfPrototypeMan.classes.SfPrototypeContainer(containerDom, $.fn.sfPrototypeMan.defaultOptions);
	ok(jQuery(container.getDomElement()).hasClass('sfPrototypeMan'));
});

test('extended dom', 5, function() {
	var dom = jQuery(getFixture('formAnimals'));
	var containerDom = jQuery('*[data-prototype]', dom);
	var container = new $.fn.sfPrototypeMan.classes.SfPrototypeContainer(containerDom, $.fn.sfPrototypeMan.defaultOptions);

	var children = jQuery(container.getDomElement()).children();
	equal(children.length, 1);

	var rmButtons = jQuery('> a.rmElement', children[0]);
	equal(rmButtons.length, 1);
	equal(jQuery._data(rmButtons[0], 'events')['click'].length, 1);

	var addButtons = jQuery('#MyFormType_animals + a.addPrototype', dom);
	equal(addButtons.length, 1);
	equal(jQuery._data(addButtons[0], 'events')['click'].length, 1);
});

/*
var lifecycle = {
	teardown: function () {
		$.cookie.defaults = {};
		delete $.cookie.raw;
		delete $.cookie.json;
		$.each($.cookie(), $.removeCookie);
	}};


module('read', lifecycle);

asyncTest('malformed cookie value in IE (#88, #117)', function() {
	expect(1);
	// Sandbox in an iframe so that we can poke around with document.cookie.
	var iframe = $('<iframe src="malformed_cookie.html"></iframe>')[0];
	$(iframe).on('load', function() {
		start();
		if (iframe.contentWindow.ok) {
			strictEqual(iframe.contentWindow.testValue, 'two', 'reads all cookie values, skipping duplicate occurences of "; "');
		} else {
			// Skip the test where we can't stub document.cookie using
			// Object.defineProperty. Seems to work fine in
			// Chrome, Firefox and IE 8+.
			ok(true, 'N/A');
		}
	});
	document.body.appendChild(iframe);
});

test('call without arguments', function() {
	$.cookie('c', 'v');
	$.cookie('foo', 'bar');
	deepEqual($.cookie(), {
		c: 'v',
		foo: 'bar'
	}, 'should return all cookies');
	$.each($.cookie(), $.removeCookie);

	$.cookie.json = true;
	$.cookie('c', { foo: 'bar' });
	deepEqual($.cookie(), {
		c: { foo: 'bar' }
	}, 'returns all cookies with JSON parsed');
});
*/