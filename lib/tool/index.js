'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var isNode = false;
try {
	isNode = Object.prototype.toString.call(global.process) === '[object process]';
} catch (e) {}

function makeTool(xmlParser, Document, Node, NodeList, scopable) {
	var $ = {
		isNode: isNode,
		parseXML: xmlParser,
		extend: Object.assign,
		isFunction: function isFunction(a) {
			return typeof a === 'function';
		},
		isArray: function isArray(a) {
			return Array.isArray(a);
		},
		each: function each(a, f, ctx) {
			if (Array.isArray(a)) {
				a.forEach(f, ctx);
			} else if ((typeof a === 'undefined' ? 'undefined' : _typeof(a)) === 'object') {
				Object.keys(a).forEach(function (k) {
					f.call(ctx, k, a[k]);
				});
			}
		},
		map: function map(a, f, ctx) {
			return a.map(f, ctx);
		}
	};

	$.extend($, {
		toArray: function toArray(args) {
			var a = [];
			for (var i = 0, len = args.length; i < len; i++) {
				a.push(args[i]);
			}return a;
		}
	});

	var directChildSelector = /((^|,)\s*>)/,
	    id = "sxxx";
	$.extend(Node.prototype, {
		$: function $(selector) {
			if (!directChildSelector.test(selector)) return this.querySelectorAll(selector);else if (scopable) return this.querySelectorAll(selector.split(',').map(function (a) {
				return a.trim().charAt(0) == '>' ? ':scope' + a : a;
			}).join(','));else if (this.id) {
				return this.querySelectorAll(selector.split(',').map(function (a) {
					//return  '#'+this.id+((a=a.trim()).charAt(0)=='>' ? '' : ' ')+a
					return (a = a.trim()).charAt(0) == '>' ? a.substring(1) : a;
				}, this).join(','));
			} else {
				this.id = id;
				var nodes = this.querySelectorAll(selector.split(',').map(function (a) {
					//IE can't find '#xx', @todo: fix it later
					//return  '#'+this.id+((a=a.trim()).charAt(0)=='>' ? '' : ' ')+a
					return (a = a.trim()).charAt(0) == '>' ? a.substring(1) : a;
				}, this).join(','));
				delete this.id;
				return nodes;
			}
		},
		$1: function $1(selector) {
			if (!directChildSelector.test(selector)) return this.querySelector(selector);else if (scopable) return this.querySelector(selector.split(',').map(function (a) {
				return (a = a.trim()).charAt(0) == '>' ? ':scope' + a : a;
			}).join(','));else if (this.id) {
				return this.querySelector(selector.split(',').map(function (a) {
					//return  '#'+this.id+((a=a.trim()).charAt(0)=='>' ? '' : ' ')+a
					return (a = a.trim()).charAt(0) == '>' ? a.substring(1) : a;
				}, this).join(','));
			} else {
				this.id = id;
				var nodes = this.querySelector(selector.split(',').map(function (a) {
					//return  '#'+this.id+((a=a.trim()).charAt(0)=='>' ? '' : ' ')+a
					return (a = a.trim()).charAt(0) == '>' ? a.substring(1) : a;
				}, this).join(','));
				delete this.id;
				return nodes;
			}
		},
		attr: function attr(name, value) {
			if (arguments.length == 1) {
				var attr = this.attributes.getNamedItem(name);
				return attr ? attr.value : undefined;
			} else if (value == null) this.removeAttribute(name);else this.setAttribute(name, value);
		},
		remove: Node.prototype.remove || function () {
			this.parentNode.removeChild(this);
		},
		uptrim: function uptrim() {
			var parent = this.parentNode;
			this.remove();
			if (parent.childNodes.length == 0) parent.uptrim();
		}
	});

	return $;
}

exports.default = function () {
	if (!isNode) {
		return window.$ = makeTool.apply(undefined, _toConsumableArray(function () {
			function parser(x) {
				x = x.trim();
				if (typeof DOMParser != 'undefined') return new DOMParser().parseFromString(x, "text/xml");

				var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
				xmlDoc.async = "false";
				xmlDoc.loadXML(x);
				return xmlDoc;
			}

			function supportScopeSelector() {
				try {
					return document.body.querySelector(':scope>*').length != 0;
				} catch (e) {
					return false;
				}
			}
			document.$1 = document.querySelector;
			document.$ = document.querySelectorAll;
			return [parser, Document, Element, NodeList, supportScopeSelector()];
		}()));
	} else {
		return global.$ = makeTool.apply(undefined, _toConsumableArray(function (xmldom) {
			var DOMParser = xmldom.DOMParser,
			    DOMImplementation = xmldom.DOMImplementation;

			var nwmatcher = require("nwmatcher");

			function parse(x) {
				return new DOMParser().parseFromString(x, "text/xml");
			}

			function addNwmatcher(document) {
				if (!document._nwmatcher) {
					document._nwmatcher = nwmatcher({ document: document });
					document._nwmatcher.configure({ UNIQUE_ID: false });
				}
				return document._nwmatcher;
			}

			var a = parse('<a></a>'),
			    Document = a.constructor,
			    Element = a.documentElement.constructor,
			    NodeList = a.childNodes.constructor;

			Document.prototype.querySelector = Element.prototype.querySelector = function (selector) {
				return addNwmatcher(this.ownerDocument || this).first(selector, this);
			};

			Document.prototype.querySelectorAll = Element.prototype.querySelectorAll = function (selector) {
				return addNwmatcher(this.ownerDocument || this).select(selector, this);
			};

			/**
    * nwwatcher has unexpected result with namespace on nodeName
    */
			var _createElementNS = Document.prototype.createElementNS;
			Document.prototype.createElementNS = function () {
				var el = _createElementNS.apply(this, arguments);
				el.tagName = el.nodeName = el.localName;
				return el;
			};

			Object.defineProperty(Element.prototype, "outerHTML", {
				get: function get() {
					return new xmldom.XMLSerializer().serializeToString(this);
				}
			});

			return [parse, Document, Element, NodeList, false];
		}(require('xmldom'))));
	}
}();

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29sL2luZGV4LmpzIl0sIm5hbWVzIjpbImlzTm9kZSIsIk9iamVjdCIsInByb3RvdHlwZSIsInRvU3RyaW5nIiwiY2FsbCIsImdsb2JhbCIsInByb2Nlc3MiLCJlIiwibWFrZVRvb2wiLCJ4bWxQYXJzZXIiLCJEb2N1bWVudCIsIk5vZGUiLCJOb2RlTGlzdCIsInNjb3BhYmxlIiwiJCIsInBhcnNlWE1MIiwiZXh0ZW5kIiwiYXNzaWduIiwiaXNGdW5jdGlvbiIsImEiLCJpc0FycmF5IiwiQXJyYXkiLCJlYWNoIiwiZiIsImN0eCIsImZvckVhY2giLCJrZXlzIiwiayIsIm1hcCIsInRvQXJyYXkiLCJhcmdzIiwiaSIsImxlbiIsImxlbmd0aCIsInB1c2giLCJkaXJlY3RDaGlsZFNlbGVjdG9yIiwiaWQiLCJzZWxlY3RvciIsInRlc3QiLCJxdWVyeVNlbGVjdG9yQWxsIiwic3BsaXQiLCJ0cmltIiwiY2hhckF0Iiwiam9pbiIsInN1YnN0cmluZyIsIm5vZGVzIiwiJDEiLCJxdWVyeVNlbGVjdG9yIiwiYXR0ciIsIm5hbWUiLCJ2YWx1ZSIsImFyZ3VtZW50cyIsImF0dHJpYnV0ZXMiLCJnZXROYW1lZEl0ZW0iLCJ1bmRlZmluZWQiLCJyZW1vdmVBdHRyaWJ1dGUiLCJzZXRBdHRyaWJ1dGUiLCJyZW1vdmUiLCJwYXJlbnROb2RlIiwicmVtb3ZlQ2hpbGQiLCJ1cHRyaW0iLCJwYXJlbnQiLCJjaGlsZE5vZGVzIiwiYXNBcnJheSIsIm8iLCJ3aW5kb3ciLCJwYXJzZXIiLCJ4IiwiRE9NUGFyc2VyIiwicGFyc2VGcm9tU3RyaW5nIiwieG1sRG9jIiwiQWN0aXZlWE9iamVjdCIsImFzeW5jIiwibG9hZFhNTCIsInN1cHBvcnRTY29wZVNlbGVjdG9yIiwiZG9jdW1lbnQiLCJib2R5IiwiRWxlbWVudCIsInhtbGRvbSIsIkRPTUltcGxlbWVudGF0aW9uIiwibndtYXRjaGVyIiwicmVxdWlyZSIsInBhcnNlIiwiYWRkTndtYXRjaGVyIiwiX253bWF0Y2hlciIsImNvbmZpZ3VyZSIsIlVOSVFVRV9JRCIsImNvbnN0cnVjdG9yIiwiZG9jdW1lbnRFbGVtZW50Iiwib3duZXJEb2N1bWVudCIsImZpcnN0Iiwic2VsZWN0IiwiX2NyZWF0ZUVsZW1lbnROUyIsImNyZWF0ZUVsZW1lbnROUyIsImVsIiwiYXBwbHkiLCJ0YWdOYW1lIiwibm9kZU5hbWUiLCJsb2NhbE5hbWUiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsIlhNTFNlcmlhbGl6ZXIiLCJzZXJpYWxpemVUb1N0cmluZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLElBQUlBLFNBQU8sS0FBWDtBQUNBLElBQUk7QUFDSEEsVUFBU0MsT0FBT0MsU0FBUCxDQUFpQkMsUUFBakIsQ0FBMEJDLElBQTFCLENBQStCQyxPQUFPQyxPQUF0QyxNQUFtRCxrQkFBNUQ7QUFDQSxDQUZELENBRUUsT0FBTUMsQ0FBTixFQUFTLENBRVY7O0FBR0QsU0FBU0MsUUFBVCxDQUFrQkMsU0FBbEIsRUFBNkJDLFFBQTdCLEVBQXVDQyxJQUF2QyxFQUE2Q0MsUUFBN0MsRUFBdURDLFFBQXZELEVBQWdFO0FBQy9ELEtBQUlDLElBQUU7QUFDTGQsZ0JBREs7QUFFTGUsWUFBVU4sU0FGTDtBQUdMTyxVQUFRZixPQUFPZ0IsTUFIVjtBQUlMQyxjQUFZLG9CQUFTQyxDQUFULEVBQVc7QUFDdEIsVUFBTyxPQUFPQSxDQUFQLEtBQVksVUFBbkI7QUFDQSxHQU5JO0FBT0xDLFdBQVMsaUJBQVNELENBQVQsRUFBVztBQUNuQixVQUFPRSxNQUFNRCxPQUFOLENBQWNELENBQWQsQ0FBUDtBQUNBLEdBVEk7QUFVTEcsUUFBTSxjQUFTSCxDQUFULEVBQVdJLENBQVgsRUFBYUMsR0FBYixFQUFpQjtBQUN0QixPQUFHSCxNQUFNRCxPQUFOLENBQWNELENBQWQsQ0FBSCxFQUFvQjtBQUNuQkEsTUFBRU0sT0FBRixDQUFVRixDQUFWLEVBQVlDLEdBQVo7QUFDQSxJQUZELE1BRU0sSUFBRyxRQUFPTCxDQUFQLHlDQUFPQSxDQUFQLE9BQVksUUFB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VCxDQUFtQjJGLGVBQXhDO0FBQ0FuRixZQUFTUixTQUFULENBQW1CMkYsZUFBbkIsR0FBbUMsWUFBVTtBQUM1QyxRQUFJQyxLQUFHRixpQkFBaUJHLEtBQWpCLENBQXVCLElBQXZCLEVBQTRCNUMsU0FBNUIsQ0FBUDtBQUNBMkMsT0FBR0UsT0FBSCxHQUFXRixHQUFHRyxRQUFILEdBQVlILEdBQUdJLFNBQTFCO0FBQ0EsV0FBT0osRUFBUDtBQUNBLElBSkQ7O0FBTUE3RixVQUFPa0csY0FBUCxDQUFzQnRCLFFBQVEzRSxTQUE5QixFQUF3QyxXQUF4QyxFQUFxRDtBQUNwRGtHLFNBQUssZUFBVTtBQUNkLFlBQU8sSUFBSXRCLE9BQU91QixhQUFYLEdBQTJCQyxpQkFBM0IsQ0FBNkMsSUFBN0MsQ0FBUDtBQUNBO0FBSG1ELElBQXJEOztBQU9BLFVBQU8sQ0FBQ3BCLEtBQUQsRUFBUXhFLFFBQVIsRUFBa0JtRSxPQUFsQixFQUEyQmpFLFFBQTNCLEVBQXFDLEtBQXJDLENBQVA7QUFDQSxHQWpEMkIsQ0FpRHpCcUUsUUFBUSxRQUFSLENBakR5QixDQUFaLEVBQWhCO0FBa0RBO0FBQ0QsQ0E3RWMsRSIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBpc05vZGU9ZmFsc2VcbnRyeSB7XG5cdGlzTm9kZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChnbG9iYWwucHJvY2VzcykgPT09ICdbb2JqZWN0IHByb2Nlc3NdJ1xufSBjYXRjaChlKSB7XG5cbn1cblxuXG5mdW5jdGlvbiBtYWtlVG9vbCh4bWxQYXJzZXIsIERvY3VtZW50LCBOb2RlLCBOb2RlTGlzdCwgc2NvcGFibGUpe1xuXHR2YXIgJD17XG5cdFx0aXNOb2RlLFxuXHRcdHBhcnNlWE1MOiB4bWxQYXJzZXIsXG5cdFx0ZXh0ZW5kOiBPYmplY3QuYXNzaWduLFxuXHRcdGlzRnVuY3Rpb246IGZ1bmN0aW9uKGEpe1xuXHRcdFx0cmV0dXJuIHR5cGVvZiBhID09PSdmdW5jdGlvbidcblx0XHR9LFxuXHRcdGlzQXJyYXk6IGZ1bmN0aW9uKGEpe1xuXHRcdFx0cmV0dXJuIEFycmF5LmlzQXJyYXkoYSlcblx0XHR9LFxuXHRcdGVhY2g6IGZ1bmN0aW9uKGEsZixjdHgpe1xuXHRcdFx0aWYoQXJyYXkuaXNBcnJheShhKSl7XG5cdFx0XHRcdGEuZm9yRWFjaChmLGN0eClcblx0XHRcdH1lbHNlIGlmKHR5cGVvZiBhID09PSdvYmplY3QnKXtcblx0XHRcdFx0T2JqZWN0LmtleXMoYSkuZm9yRWFjaChmdW5jdGlvbihrKXtcblx0XHRcdFx0XHRmLmNhbGwoY3R4LGssYVtrXSlcblx0XHRcdFx0fSlcblx0XHRcdH1cblx0XHR9LFxuXHRcdG1hcDogZnVuY3Rpb24oYSxmLGN0eCl7XG5cdFx0XHRyZXR1cm4gYS5tYXAoZixjdHgpXG5cdFx0fVxuXHR9O1xuXG5cdCQuZXh0ZW5kKCQse1xuXHRcdHRvQXJyYXk6IGZ1bmN0aW9uKGFyZ3Mpe1xuXHRcdFx0dmFyIGE9W107XG5cdFx0XHRmb3IodmFyIGk9MCxsZW49YXJncy5sZW5ndGg7aTxsZW47aSsrKVxuXHRcdFx0XHRhLnB1c2goYXJnc1tpXSlcblx0XHRcdHJldHVybiBhXG5cdFx0fVxuXHR9KVxuXG5cdHZhciBkaXJlY3RDaGlsZFNlbGVjdG9yPS8oKF58LClcXHMqPikvLCBpZD1cInN4eHhcIlxuXHQkLmV4dGVuZChOb2RlLnByb3RvdHlwZSx7XG5cdFx0JDogZnVuY3Rpb24oc2VsZWN0b3Ipe1xuXHRcdFx0aWYoIWRpcmVjdENoaWxkU2VsZWN0b3IudGVzdChzZWxlY3RvcikpXG5cdFx0XHRcdHJldHVybiB0aGlzLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXG5cdFx0XHRlbHNlIGlmKHNjb3BhYmxlKVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yLnNwbGl0KCcsJykubWFwKGZ1bmN0aW9uKGEpe1xuXHRcdFx0XHRcdFx0cmV0dXJuIGEudHJpbSgpLmNoYXJBdCgwKT09Jz4nID8gJzpzY29wZScrYSA6IGFcblx0XHRcdFx0XHR9KS5qb2luKCcsJykpXG5cdFx0XHRlbHNlIGlmKHRoaXMuaWQpe1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yLnNwbGl0KCcsJykubWFwKGZ1bmN0aW9uKGEpe1xuXHRcdFx0XHRcdFx0Ly9yZXR1cm4gICcjJyt0aGlzLmlkKygoYT1hLnRyaW0oKSkuY2hhckF0KDApPT0nPicgPyAnJyA6ICcgJykrYVxuXHRcdFx0XHRcdFx0cmV0dXJuIChhPWEudHJpbSgpKS5jaGFyQXQoMCk9PSc+JyA/IGEuc3Vic3RyaW5nKDEpIDogYVxuXHRcdFx0XHRcdH0sdGhpcykuam9pbignLCcpKVxuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdHRoaXMuaWQ9aWRcblx0XHRcdFx0dmFyIG5vZGVzPXRoaXMucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvci5zcGxpdCgnLCcpLm1hcChmdW5jdGlvbihhKXtcblx0XHRcdFx0XHRcdC8vSUUgY2FuJ3QgZmluZCAnI3h4JywgQHRvZG86IGZpeCBpdCBsYXRlclxuXHRcdFx0XHRcdFx0Ly9yZXR1cm4gICcjJyt0aGlzLmlkKygoYT1hLnRyaW0oKSkuY2hhckF0KDApPT0nPicgPyAnJyA6ICcgJykrYVxuXHRcdFx0XHRcdFx0cmV0dXJuIChhPWEudHJpbSgpKS5jaGFyQXQoMCk9PSc+JyA/IGEuc3Vic3RyaW5nKDEpIDogYVxuXHRcdFx0XHRcdH0sdGhpcykuam9pbignLCcpKVxuXHRcdFx0XHRkZWxldGUgdGhpcy5pZFxuXHRcdFx0XHRyZXR1cm4gbm9kZXNcblx0XHRcdH1cblx0XHR9LFxuXHRcdCQxOmZ1bmN0aW9uKHNlbGVjdG9yKXtcblx0XHRcdGlmKCFkaXJlY3RDaGlsZFNlbGVjdG9yLnRlc3Qoc2VsZWN0b3IpKVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKVxuXHRcdFx0ZWxzZSBpZihzY29wYWJsZSlcblx0XHRcdFx0cmV0dXJuIHRoaXMucXVlcnlTZWxlY3RvcihzZWxlY3Rvci5zcGxpdCgnLCcpLm1hcChmdW5jdGlvbihhKXtcblx0XHRcdFx0XHRcdHJldHVybiAoYT1hLnRyaW0oKSkuY2hhckF0KDApPT0nPicgPyAnOnNjb3BlJythIDogYVxuXHRcdFx0XHRcdH0pLmpvaW4oJywnKSlcblx0XHRcdGVsc2UgaWYodGhpcy5pZCl7XG5cdFx0XHRcdHJldHVybiB0aGlzLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3Iuc3BsaXQoJywnKS5tYXAoZnVuY3Rpb24oYSl7XG5cdFx0XHRcdFx0XHQvL3JldHVybiAgJyMnK3RoaXMuaWQrKChhPWEudHJpbSgpKS5jaGFyQXQoMCk9PSc+JyA/ICcnIDogJyAnKSthXG5cdFx0XHRcdFx0XHRyZXR1cm4gKGE9YS50cmltKCkpLmNoYXJBdCgwKT09Jz4nID8gYS5zdWJzdHJpbmcoMSkgOiBhXG5cdFx0XHRcdFx0fSx0aGlzKS5qb2luKCcsJykpXG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0dGhpcy5pZD1pZFxuXHRcdFx0XHR2YXIgbm9kZXM9dGhpcy5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yLnNwbGl0KCcsJykubWFwKGZ1bmN0aW9uKGEpe1xuXHRcdFx0XHRcdFx0Ly9yZXR1cm4gICcjJyt0aGlzLmlkKygoYT1hLnRyaW0oKSkuY2hhckF0KDApPT0nPicgPyAnJyA6ICcgJykrYVxuXHRcdFx0XHRcdFx0cmV0dXJuIChhPWEudHJpbSgpKS5jaGFyQXQoMCk9PSc+JyA/IGEuc3Vic3RyaW5nKDEpIDogYVxuXHRcdFx0XHRcdH0sdGhpcykuam9pbignLCcpKVxuXHRcdFx0XHRkZWxldGUgdGhpcy5pZFxuXHRcdFx0XHRyZXR1cm4gbm9kZXNcblx0XHRcdH1cblx0XHR9LFxuXHRcdGF0dHI6IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKXtcblx0XHRcdGlmKGFyZ3VtZW50cy5sZW5ndGg9PTEpe1xuXHRcdFx0XHR2YXIgYXR0cj10aGlzLmF0dHJpYnV0ZXMuZ2V0TmFtZWRJdGVtKG5hbWUpXG5cdFx0XHRcdHJldHVybiBhdHRyID8gYXR0ci52YWx1ZSA6IHVuZGVmaW5lZFxuXHRcdFx0fWVsc2UgaWYodmFsdWU9PW51bGwpXG5cdFx0XHRcdHRoaXMucmVtb3ZlQXR0cmlidXRlKG5hbWUpXG5cdFx0XHRlbHNlXG5cdFx0XHRcdHRoaXMuc2V0QXR0cmlidXRlKG5hbWUsdmFsdWUpXG5cdFx0fSxcblx0XHRyZW1vdmU6IE5vZGUucHJvdG90eXBlLnJlbW92ZSB8fCBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMpXG5cdFx0fSxcblx0XHR1cHRyaW06IGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgcGFyZW50PXRoaXMucGFyZW50Tm9kZVxuXHRcdFx0dGhpcy5yZW1vdmUoKVxuXHRcdFx0aWYocGFyZW50LmNoaWxkTm9kZXMubGVuZ3RoPT0wKVxuXHRcdFx0XHRwYXJlbnQudXB0cmltKClcblx0XHR9XG5cdH0pXG5cblx0JC5leHRlbmQoTm9kZUxpc3QucHJvdG90eXBlLHtcblx0XHRhc0FycmF5OiBmdW5jdGlvbihvKXtcblx0XHRcdG89b3x8W11cblx0XHRcdGZvcih2YXIgaT0wLGxlbj10aGlzLmxlbmd0aDtpPGxlbjtpKyspXG5cdFx0XHRcdG8ucHVzaCh0aGlzW2ldKVxuXHRcdFx0cmV0dXJuIG9cblx0XHR9LFxuXHRcdGZvckVhY2g6IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLFxuXHRcdG1hcDogQXJyYXkucHJvdG90eXBlLm1hcFxuXHR9KVxuXG5cdHJldHVybiAkXG59XG5cbmV4cG9ydCBkZWZhdWx0ICgoKT0+e1xuXHRpZighaXNOb2RlKXtcblx0XHRyZXR1cm4gd2luZG93LiQ9bWFrZVRvb2woLi4uKGZ1bmN0aW9uKCl7XG5cdFx0ICAgIGZ1bmN0aW9uIHBhcnNlcih4KXtcblx0XHQgICAgICAgIHg9eC50cmltKClcblx0XHQgICAgICAgIGlmKHR5cGVvZihET01QYXJzZXIpIT0ndW5kZWZpbmVkJylcblx0XHQgICAgICAgICAgICByZXR1cm4gKCBuZXcgRE9NUGFyc2VyKCkgKS5wYXJzZUZyb21TdHJpbmcoeCwgXCJ0ZXh0L3htbFwiKTtcblxuXHRcdCAgICAgICAgdmFyIHhtbERvYyA9IG5ldyBBY3RpdmVYT2JqZWN0KFwiTWljcm9zb2Z0LlhNTERPTVwiKTtcblx0XHQgICAgICAgIHhtbERvYy5hc3luYyA9IFwiZmFsc2VcIjtcblx0XHQgICAgICAgIHhtbERvYy5sb2FkWE1MKHgpO1xuXHRcdCAgICAgICAgcmV0dXJuIHhtbERvYztcblx0XHQgICAgfVxuXG5cdFx0ICAgIGZ1bmN0aW9uIHN1cHBvcnRTY29wZVNlbGVjdG9yKCl7XG5cdFx0ICAgICAgICB0cnl7XG5cdFx0ICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcignOnNjb3BlPionKS5sZW5ndGghPTBcblx0XHQgICAgICAgIH1jYXRjaChlKXtcblx0XHQgICAgICAgICAgICByZXR1cm4gZmFsc2Vcblx0XHQgICAgICAgIH1cblx0XHQgICAgfVxuXHRcdCAgICBkb2N1bWVudC4kMT1kb2N1bWVudC5xdWVyeVNlbGVjdG9yXG5cdFx0ICAgIGRvY3VtZW50LiQ9ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbFxuXHRcdCAgICByZXR1cm4gW3BhcnNlciwgRG9jdW1lbnQsIEVsZW1lbnQsIE5vZGVMaXN0LCBzdXBwb3J0U2NvcGVTZWxlY3RvcigpXVxuXHRcdH0pKCkpXG5cdH1lbHNle1xuXHRcdHJldHVybiBnbG9iYWwuJD1tYWtlVG9vbCguLi4oZnVuY3Rpb24oeG1sZG9tKXtcblx0XHRcdHZhciBET01QYXJzZXI9eG1sZG9tLkRPTVBhcnNlcixcblx0XHRcdFx0RE9NSW1wbGVtZW50YXRpb249eG1sZG9tLkRPTUltcGxlbWVudGF0aW9uO1xuXG5cdFx0XHR2YXIgbndtYXRjaGVyID0gcmVxdWlyZShcIm53bWF0Y2hlclwiKTtcblxuXHRcdFx0ZnVuY3Rpb24gcGFyc2UoeCl7XG5cdFx0XHRcdHJldHVybiBuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKHgsIFwidGV4dC94bWxcIilcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gYWRkTndtYXRjaGVyKGRvY3VtZW50KSB7XG5cdFx0XHRcdGlmICghZG9jdW1lbnQuX253bWF0Y2hlcikge1xuXHRcdFx0XHRcdGRvY3VtZW50Ll9ud21hdGNoZXIgPSBud21hdGNoZXIoeyBkb2N1bWVudDogZG9jdW1lbnQgfSk7XG5cdFx0XHRcdFx0ZG9jdW1lbnQuX253bWF0Y2hlci5jb25maWd1cmUoeyBVTklRVUVfSUQ6IGZhbHNlIH0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBkb2N1bWVudC5fbndtYXRjaGVyO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgYT1wYXJzZSgnPGE+PC9hPicpLFxuXHRcdFx0XHREb2N1bWVudD1hLmNvbnN0cnVjdG9yLFxuXHRcdFx0XHRFbGVtZW50PWEuZG9jdW1lbnRFbGVtZW50LmNvbnN0cnVjdG9yLFxuXHRcdFx0XHROb2RlTGlzdD1hLmNoaWxkTm9kZXMuY29uc3RydWN0b3JcblxuXHRcdFx0RG9jdW1lbnQucHJvdG90eXBlLnF1ZXJ5U2VsZWN0b3I9RWxlbWVudC5wcm90b3R5cGUucXVlcnlTZWxlY3Rvcj1mdW5jdGlvbihzZWxlY3Rvcil7XG5cdFx0XHRcdHJldHVybiBhZGROd21hdGNoZXIodGhpcy5vd25lckRvY3VtZW50fHx0aGlzKS5maXJzdChzZWxlY3RvciwgdGhpcyk7XG5cdFx0XHR9XG5cblx0XHRcdERvY3VtZW50LnByb3RvdHlwZS5xdWVyeVNlbGVjdG9yQWxsPUVsZW1lbnQucHJvdG90eXBlLnF1ZXJ5U2VsZWN0b3JBbGw9ZnVuY3Rpb24oc2VsZWN0b3Ipe1xuXHRcdFx0XHRyZXR1cm4gYWRkTndtYXRjaGVyKHRoaXMub3duZXJEb2N1bWVudHx8dGhpcykuc2VsZWN0KHNlbGVjdG9yLCB0aGlzKTtcblx0XHRcdH1cblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBud3dhdGNoZXIgaGFzIHVuZXhwZWN0ZWQgcmVzdWx0IHdpdGggbmFtZXNwYWNlIG9uIG5vZGVOYW1lXG5cdFx0XHQgKi9cblx0XHRcdHZhciBfY3JlYXRlRWxlbWVudE5TPURvY3VtZW50LnByb3RvdHlwZS5jcmVhdGVFbGVtZW50TlNcblx0XHRcdERvY3VtZW50LnByb3RvdHlwZS5jcmVhdGVFbGVtZW50TlM9ZnVuY3Rpb24oKXtcblx0XHRcdFx0dmFyIGVsPV9jcmVhdGVFbGVtZW50TlMuYXBwbHkodGhpcyxhcmd1bWVudHMpXG5cdFx0XHRcdGVsLnRhZ05hbWU9ZWwubm9kZU5hbWU9ZWwubG9jYWxOYW1lXG5cdFx0XHRcdHJldHVybiBlbFxuXHRcdFx0fVxuXG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoRWxlbWVudC5wcm90b3R5cGUsXCJvdXRlckhUTUxcIiwge1xuXHRcdFx0XHRnZXQ6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0cmV0dXJuIG5ldyB4bWxkb20uWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKHRoaXMpXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cblxuXHRcdFx0cmV0dXJuIFtwYXJzZSwgRG9jdW1lbnQsIEVsZW1lbnQsIE5vZGVMaXN0LCBmYWxzZV1cblx0XHR9KShyZXF1aXJlKCd4bWxkb20nKSkpXG5cdH1cbn0pKCk7XG4iXX0=