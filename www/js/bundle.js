(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
"use strict";

module.exports = { "default": require("core-js/library/fn/object/create"), __esModule: true };

},{"core-js/library/fn/object/create":11}],3:[function(require,module,exports){
"use strict";

module.exports = { "default": require("core-js/library/fn/object/define-property"), __esModule: true };

},{"core-js/library/fn/object/define-property":12}],4:[function(require,module,exports){
"use strict";

module.exports = { "default": require("core-js/library/fn/object/get-own-property-names"), __esModule: true };

},{"core-js/library/fn/object/get-own-property-names":13}],5:[function(require,module,exports){
"use strict";

module.exports = { "default": require("core-js/library/fn/promise"), __esModule: true };

},{"core-js/library/fn/promise":14}],6:[function(require,module,exports){
"use strict";

module.exports = { "default": require("core-js/library/fn/symbol"), __esModule: true };

},{"core-js/library/fn/symbol":15}],7:[function(require,module,exports){
"use strict";

module.exports = { "default": require("core-js/library/fn/symbol/iterator"), __esModule: true };

},{"core-js/library/fn/symbol/iterator":16}],8:[function(require,module,exports){
"use strict";

exports["default"] = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

exports.__esModule = true;

},{}],9:[function(require,module,exports){
"use strict";

var _Object$defineProperty = require("babel-runtime/core-js/object/define-property")["default"];

exports["default"] = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;

      _Object$defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

exports.__esModule = true;

},{"babel-runtime/core-js/object/define-property":3}],10:[function(require,module,exports){
"use strict";

exports["default"] = function (obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
};

exports.__esModule = true;

},{}],11:[function(require,module,exports){
var $ = require('../../modules/$');
module.exports = function create(P, D){
  return $.create(P, D);
};
},{"../../modules/$":45}],12:[function(require,module,exports){
var $ = require('../../modules/$');
module.exports = function defineProperty(it, key, desc){
  return $.setDesc(it, key, desc);
};
},{"../../modules/$":45}],13:[function(require,module,exports){
var $ = require('../../modules/$');
require('../../modules/es6.object.get-own-property-names');
module.exports = function getOwnPropertyNames(it){
  return $.getNames(it);
};
},{"../../modules/$":45,"../../modules/es6.object.get-own-property-names":71}],14:[function(require,module,exports){
require('../modules/es6.object.to-string');
require('../modules/es6.string.iterator');
require('../modules/web.dom.iterable');
require('../modules/es6.promise');
module.exports = require('../modules/$.core').Promise;
},{"../modules/$.core":21,"../modules/es6.object.to-string":72,"../modules/es6.promise":73,"../modules/es6.string.iterator":74,"../modules/web.dom.iterable":76}],15:[function(require,module,exports){
require('../../modules/es6.symbol');
module.exports = require('../../modules/$.core').Symbol;
},{"../../modules/$.core":21,"../../modules/es6.symbol":75}],16:[function(require,module,exports){
require('../../modules/es6.string.iterator');
require('../../modules/web.dom.iterable');
module.exports = require('../../modules/$.wks')('iterator');
},{"../../modules/$.wks":68,"../../modules/es6.string.iterator":74,"../../modules/web.dom.iterable":76}],17:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],18:[function(require,module,exports){
var isObject = require('./$.is-object');
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"./$.is-object":38}],19:[function(require,module,exports){
// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = require('./$.cof')
  , TAG = require('./$.wks')('toStringTag')
  // ES3 wrong here
  , ARG = cof(function(){ return arguments; }()) == 'Arguments';

module.exports = function(it){
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = (O = Object(it))[TAG]) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};
},{"./$.cof":20,"./$.wks":68}],20:[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],21:[function(require,module,exports){
var core = module.exports = {version: '1.2.3'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],22:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./$.a-function');
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};
},{"./$.a-function":17}],23:[function(require,module,exports){
var global    = require('./$.global')
  , core      = require('./$.core')
  , PROTOTYPE = 'prototype';
var ctx = function(fn, that){
  return function(){
    return fn.apply(that, arguments);
  };
};
var $def = function(type, name, source){
  var key, own, out, exp
    , isGlobal = type & $def.G
    , isProto  = type & $def.P
    , target   = isGlobal ? global : type & $def.S
        ? global[name] : (global[name] || {})[PROTOTYPE]
    , exports  = isGlobal ? core : core[name] || (core[name] = {});
  if(isGlobal)source = name;
  for(key in source){
    // contains in native
    own = !(type & $def.F) && target && key in target;
    if(own && key in exports)continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    if(isGlobal && typeof target[key] != 'function')exp = source[key];
    // bind timers to global for call from export context
    else if(type & $def.B && own)exp = ctx(out, global);
    // wrap global constructors for prevent change them in library
    else if(type & $def.W && target[key] == out)!function(C){
      exp = function(param){
        return this instanceof C ? new C(param) : C(param);
      };
      exp[PROTOTYPE] = C[PROTOTYPE];
    }(out);
    else exp = isProto && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export
    exports[key] = exp;
    if(isProto)(exports[PROTOTYPE] || (exports[PROTOTYPE] = {}))[key] = out;
  }
};
// type bitmap
$def.F = 1;  // forced
$def.G = 2;  // global
$def.S = 4;  // static
$def.P = 8;  // proto
$def.B = 16; // bind
$def.W = 32; // wrap
module.exports = $def;
},{"./$.core":21,"./$.global":30}],24:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],25:[function(require,module,exports){
var isObject = require('./$.is-object')
  , document = require('./$.global').document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
},{"./$.global":30,"./$.is-object":38}],26:[function(require,module,exports){
// all enumerable object keys, includes symbols
var $ = require('./$');
module.exports = function(it){
  var keys       = $.getKeys(it)
    , getSymbols = $.getSymbols;
  if(getSymbols){
    var symbols = getSymbols(it)
      , isEnum  = $.isEnum
      , i       = 0
      , key;
    while(symbols.length > i)if(isEnum.call(it, key = symbols[i++]))keys.push(key);
  }
  return keys;
};
},{"./$":45}],27:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],28:[function(require,module,exports){
var ctx         = require('./$.ctx')
  , call        = require('./$.iter-call')
  , isArrayIter = require('./$.is-array-iter')
  , anObject    = require('./$.an-object')
  , toLength    = require('./$.to-length')
  , getIterFn   = require('./core.get-iterator-method');
module.exports = function(iterable, entries, fn, that){
  var iterFn = getIterFn(iterable)
    , f      = ctx(fn, that, entries ? 2 : 1)
    , index  = 0
    , length, step, iterator;
  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
    entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
    call(iterator, f, step.value, entries);
  }
};
},{"./$.an-object":18,"./$.ctx":22,"./$.is-array-iter":36,"./$.iter-call":39,"./$.to-length":65,"./core.get-iterator-method":69}],29:[function(require,module,exports){
// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toString  = {}.toString
  , toIObject = require('./$.to-iobject')
  , getNames  = require('./$').getNames;

var windowNames = typeof window == 'object' && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function(it){
  try {
    return getNames(it);
  } catch(e){
    return windowNames.slice();
  }
};

module.exports.get = function getOwnPropertyNames(it){
  if(windowNames && toString.call(it) == '[object Window]')return getWindowNames(it);
  return getNames(toIObject(it));
};
},{"./$":45,"./$.to-iobject":64}],30:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],31:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};
},{}],32:[function(require,module,exports){
var $          = require('./$')
  , createDesc = require('./$.property-desc');
module.exports = require('./$.support-desc') ? function(object, key, value){
  return $.setDesc(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./$":45,"./$.property-desc":51,"./$.support-desc":60}],33:[function(require,module,exports){
module.exports = require('./$.global').document && document.documentElement;
},{"./$.global":30}],34:[function(require,module,exports){
// fast apply, http://jsperf.lnkit.com/fast-apply/5
module.exports = function(fn, args, that){
  var un = that === undefined;
  switch(args.length){
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
  } return              fn.apply(that, args);
};
},{}],35:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./$.cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./$.cof":20}],36:[function(require,module,exports){
// check on default Array iterator
var Iterators = require('./$.iterators')
  , ITERATOR  = require('./$.wks')('iterator');
module.exports = function(it){
  return (Iterators.Array || Array.prototype[ITERATOR]) === it;
};
},{"./$.iterators":44,"./$.wks":68}],37:[function(require,module,exports){
// 7.2.2 IsArray(argument)
var cof = require('./$.cof');
module.exports = Array.isArray || function(arg){
  return cof(arg) == 'Array';
};
},{"./$.cof":20}],38:[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],39:[function(require,module,exports){
// call something on iterator step with safe closing on error
var anObject = require('./$.an-object');
module.exports = function(iterator, fn, value, entries){
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch(e){
    var ret = iterator['return'];
    if(ret !== undefined)anObject(ret.call(iterator));
    throw e;
  }
};
},{"./$.an-object":18}],40:[function(require,module,exports){
'use strict';
var $ = require('./$')
  , IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
require('./$.hide')(IteratorPrototype, require('./$.wks')('iterator'), function(){ return this; });

module.exports = function(Constructor, NAME, next){
  Constructor.prototype = $.create(IteratorPrototype, {next: require('./$.property-desc')(1,next)});
  require('./$.tag')(Constructor, NAME + ' Iterator');
};
},{"./$":45,"./$.hide":32,"./$.property-desc":51,"./$.tag":61,"./$.wks":68}],41:[function(require,module,exports){
'use strict';
var LIBRARY         = require('./$.library')
  , $def            = require('./$.def')
  , $redef          = require('./$.redef')
  , hide            = require('./$.hide')
  , has             = require('./$.has')
  , SYMBOL_ITERATOR = require('./$.wks')('iterator')
  , Iterators       = require('./$.iterators')
  , BUGGY           = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
  , FF_ITERATOR     = '@@iterator'
  , KEYS            = 'keys'
  , VALUES          = 'values';
var returnThis = function(){ return this; };
module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCE){
  require('./$.iter-create')(Constructor, NAME, next);
  var createMethod = function(kind){
    switch(kind){
      case KEYS: return function keys(){ return new Constructor(this, kind); };
      case VALUES: return function values(){ return new Constructor(this, kind); };
    } return function entries(){ return new Constructor(this, kind); };
  };
  var TAG      = NAME + ' Iterator'
    , proto    = Base.prototype
    , _native  = proto[SYMBOL_ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
    , _default = _native || createMethod(DEFAULT)
    , methods, key;
  // Fix native
  if(_native){
    var IteratorPrototype = require('./$').getProto(_default.call(new Base));
    // Set @@toStringTag to native iterators
    require('./$.tag')(IteratorPrototype, TAG, true);
    // FF fix
    if(!LIBRARY && has(proto, FF_ITERATOR))hide(IteratorPrototype, SYMBOL_ITERATOR, returnThis);
  }
  // Define iterator
  if(!LIBRARY || FORCE)hide(proto, SYMBOL_ITERATOR, _default);
  // Plug for library
  Iterators[NAME] = _default;
  Iterators[TAG]  = returnThis;
  if(DEFAULT){
    methods = {
      values:  DEFAULT == VALUES ? _default : createMethod(VALUES),
      keys:    IS_SET            ? _default : createMethod(KEYS),
      entries: DEFAULT != VALUES ? _default : createMethod('entries')
    };
    if(FORCE)for(key in methods){
      if(!(key in proto))$redef(proto, key, methods[key]);
    } else $def($def.P + $def.F * BUGGY, NAME, methods);
  }
};
},{"./$":45,"./$.def":23,"./$.has":31,"./$.hide":32,"./$.iter-create":40,"./$.iterators":44,"./$.library":47,"./$.redef":52,"./$.tag":61,"./$.wks":68}],42:[function(require,module,exports){
var SYMBOL_ITERATOR = require('./$.wks')('iterator')
  , SAFE_CLOSING    = false;
try {
  var riter = [7][SYMBOL_ITERATOR]();
  riter['return'] = function(){ SAFE_CLOSING = true; };
  Array.from(riter, function(){ throw 2; });
} catch(e){ /* empty */ }
module.exports = function(exec, skipClosing){
  if(!skipClosing && !SAFE_CLOSING)return false;
  var safe = false;
  try {
    var arr  = [7]
      , iter = arr[SYMBOL_ITERATOR]();
    iter.next = function(){ safe = true; };
    arr[SYMBOL_ITERATOR] = function(){ return iter; };
    exec(arr);
  } catch(e){ /* empty */ }
  return safe;
};
},{"./$.wks":68}],43:[function(require,module,exports){
module.exports = function(done, value){
  return {value: value, done: !!done};
};
},{}],44:[function(require,module,exports){
module.exports = {};
},{}],45:[function(require,module,exports){
var $Object = Object;
module.exports = {
  create:     $Object.create,
  getProto:   $Object.getPrototypeOf,
  isEnum:     {}.propertyIsEnumerable,
  getDesc:    $Object.getOwnPropertyDescriptor,
  setDesc:    $Object.defineProperty,
  setDescs:   $Object.defineProperties,
  getKeys:    $Object.keys,
  getNames:   $Object.getOwnPropertyNames,
  getSymbols: $Object.getOwnPropertySymbols,
  each:       [].forEach
};
},{}],46:[function(require,module,exports){
var $         = require('./$')
  , toIObject = require('./$.to-iobject');
module.exports = function(object, el){
  var O      = toIObject(object)
    , keys   = $.getKeys(O)
    , length = keys.length
    , index  = 0
    , key;
  while(length > index)if(O[key = keys[index++]] === el)return key;
};
},{"./$":45,"./$.to-iobject":64}],47:[function(require,module,exports){
module.exports = true;
},{}],48:[function(require,module,exports){
var global    = require('./$.global')
  , macrotask = require('./$.task').set
  , Observer  = global.MutationObserver || global.WebKitMutationObserver
  , process   = global.process
  , isNode    = require('./$.cof')(process) == 'process'
  , head, last, notify;

var flush = function(){
  var parent, domain;
  if(isNode && (parent = process.domain)){
    process.domain = null;
    parent.exit();
  }
  while(head){
    domain = head.domain;
    if(domain)domain.enter();
    head.fn.call(); // <- currently we use it only for Promise - try / catch not required
    if(domain)domain.exit();
    head = head.next;
  } last = undefined;
  if(parent)parent.enter();
};

// Node.js
if(isNode){
  notify = function(){
    process.nextTick(flush);
  };
// browsers with MutationObserver
} else if(Observer){
  var toggle = 1
    , node   = document.createTextNode('');
  new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
  notify = function(){
    node.data = toggle = -toggle;
  };
// for other environments - macrotask based on:
// - setImmediate
// - MessageChannel
// - window.postMessag
// - onreadystatechange
// - setTimeout
} else {
  notify = function(){
    // strange IE + webpack dev server bug - use .call(global)
    macrotask.call(global, flush);
  };
}

module.exports = function asap(fn){
  var task = {fn: fn, next: undefined, domain: isNode && process.domain};
  if(last)last.next = task;
  if(!head){
    head = task;
    notify();
  } last = task;
};
},{"./$.cof":20,"./$.global":30,"./$.task":62}],49:[function(require,module,exports){
var $redef = require('./$.redef');
module.exports = function(target, src){
  for(var key in src)$redef(target, key, src[key]);
  return target;
};
},{"./$.redef":52}],50:[function(require,module,exports){
// most Object methods by ES6 should accept primitives
module.exports = function(KEY, exec){
  var $def = require('./$.def')
    , fn   = (require('./$.core').Object || {})[KEY] || Object[KEY]
    , exp  = {};
  exp[KEY] = exec(fn);
  $def($def.S + $def.F * require('./$.fails')(function(){ fn(1); }), 'Object', exp);
};
},{"./$.core":21,"./$.def":23,"./$.fails":27}],51:[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],52:[function(require,module,exports){
module.exports = require('./$.hide');
},{"./$.hide":32}],53:[function(require,module,exports){
module.exports = Object.is || function is(x, y){
  return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
};
},{}],54:[function(require,module,exports){
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var getDesc  = require('./$').getDesc
  , isObject = require('./$.is-object')
  , anObject = require('./$.an-object');
var check = function(O, proto){
  anObject(O);
  if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function(test, buggy, set){
      try {
        set = require('./$.ctx')(Function.call, getDesc(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch(e){ buggy = true; }
      return function setPrototypeOf(O, proto){
        check(O, proto);
        if(buggy)O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};
},{"./$":45,"./$.an-object":18,"./$.ctx":22,"./$.is-object":38}],55:[function(require,module,exports){
var global = require('./$.global')
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"./$.global":30}],56:[function(require,module,exports){
// 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject  = require('./$.an-object')
  , aFunction = require('./$.a-function')
  , SPECIES   = require('./$.wks')('species');
module.exports = function(O, D){
  var C = anObject(O).constructor, S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
};
},{"./$.a-function":17,"./$.an-object":18,"./$.wks":68}],57:[function(require,module,exports){
'use strict';
var $       = require('./$')
  , SPECIES = require('./$.wks')('species');
module.exports = function(C){
  if(require('./$.support-desc') && !(SPECIES in C))$.setDesc(C, SPECIES, {
    configurable: true,
    get: function(){ return this; }
  });
};
},{"./$":45,"./$.support-desc":60,"./$.wks":68}],58:[function(require,module,exports){
module.exports = function(it, Constructor, name){
  if(!(it instanceof Constructor))throw TypeError(name + ": use the 'new' operator!");
  return it;
};
},{}],59:[function(require,module,exports){
// true  -> String#at
// false -> String#codePointAt
var toInteger = require('./$.to-integer')
  , defined   = require('./$.defined');
module.exports = function(TO_STRING){
  return function(that, pos){
    var s = String(defined(that))
      , i = toInteger(pos)
      , l = s.length
      , a, b;
    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l
      || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
        ? TO_STRING ? s.charAt(i) : a
        : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};
},{"./$.defined":24,"./$.to-integer":63}],60:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./$.fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./$.fails":27}],61:[function(require,module,exports){
var def = require('./$').setDesc
  , has = require('./$.has')
  , TAG = require('./$.wks')('toStringTag');

module.exports = function(it, tag, stat){
  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
};
},{"./$":45,"./$.has":31,"./$.wks":68}],62:[function(require,module,exports){
'use strict';
var ctx                = require('./$.ctx')
  , invoke             = require('./$.invoke')
  , html               = require('./$.html')
  , cel                = require('./$.dom-create')
  , global             = require('./$.global')
  , process            = global.process
  , setTask            = global.setImmediate
  , clearTask          = global.clearImmediate
  , MessageChannel     = global.MessageChannel
  , counter            = 0
  , queue              = {}
  , ONREADYSTATECHANGE = 'onreadystatechange'
  , defer, channel, port;
var run = function(){
  var id = +this;
  if(queue.hasOwnProperty(id)){
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};
var listner = function(event){
  run.call(event.data);
};
// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if(!setTask || !clearTask){
  setTask = function setImmediate(fn){
    var args = [], i = 1;
    while(arguments.length > i)args.push(arguments[i++]);
    queue[++counter] = function(){
      invoke(typeof fn == 'function' ? fn : Function(fn), args);
    };
    defer(counter);
    return counter;
  };
  clearTask = function clearImmediate(id){
    delete queue[id];
  };
  // Node.js 0.8-
  if(require('./$.cof')(process) == 'process'){
    defer = function(id){
      process.nextTick(ctx(run, id, 1));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if(MessageChannel){
    channel = new MessageChannel;
    port    = channel.port2;
    channel.port1.onmessage = listner;
    defer = ctx(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScripts){
    defer = function(id){
      global.postMessage(id + '', '*');
    };
    global.addEventListener('message', listner, false);
  // IE8-
  } else if(ONREADYSTATECHANGE in cel('script')){
    defer = function(id){
      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
        html.removeChild(this);
        run.call(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function(id){
      setTimeout(ctx(run, id, 1), 0);
    };
  }
}
module.exports = {
  set:   setTask,
  clear: clearTask
};
},{"./$.cof":20,"./$.ctx":22,"./$.dom-create":25,"./$.global":30,"./$.html":33,"./$.invoke":34}],63:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],64:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./$.iobject')
  , defined = require('./$.defined');
module.exports = function(it){
  return IObject(defined(it));
};
},{"./$.defined":24,"./$.iobject":35}],65:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./$.to-integer')
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
},{"./$.to-integer":63}],66:[function(require,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],67:[function(require,module,exports){
module.exports = function(){ /* empty */ };
},{}],68:[function(require,module,exports){
var store  = require('./$.shared')('wks')
  , Symbol = require('./$.global').Symbol;
module.exports = function(name){
  return store[name] || (store[name] =
    Symbol && Symbol[name] || (Symbol || require('./$.uid'))('Symbol.' + name));
};
},{"./$.global":30,"./$.shared":55,"./$.uid":66}],69:[function(require,module,exports){
var classof   = require('./$.classof')
  , ITERATOR  = require('./$.wks')('iterator')
  , Iterators = require('./$.iterators');
module.exports = require('./$.core').getIteratorMethod = function(it){
  if(it != undefined)return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};
},{"./$.classof":19,"./$.core":21,"./$.iterators":44,"./$.wks":68}],70:[function(require,module,exports){
'use strict';
var setUnscope = require('./$.unscope')
  , step       = require('./$.iter-step')
  , Iterators  = require('./$.iterators')
  , toIObject  = require('./$.to-iobject');

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
require('./$.iter-define')(Array, 'Array', function(iterated, kind){
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , kind  = this._k
    , index = this._i++;
  if(!O || index >= O.length){
    this._t = undefined;
    return step(1);
  }
  if(kind == 'keys'  )return step(0, index);
  if(kind == 'values')return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

setUnscope('keys');
setUnscope('values');
setUnscope('entries');
},{"./$.iter-define":41,"./$.iter-step":43,"./$.iterators":44,"./$.to-iobject":64,"./$.unscope":67}],71:[function(require,module,exports){
// 19.1.2.7 Object.getOwnPropertyNames(O)
require('./$.object-sap')('getOwnPropertyNames', function(){
  return require('./$.get-names').get;
});
},{"./$.get-names":29,"./$.object-sap":50}],72:[function(require,module,exports){

},{}],73:[function(require,module,exports){
'use strict';
var $          = require('./$')
  , LIBRARY    = require('./$.library')
  , global     = require('./$.global')
  , ctx        = require('./$.ctx')
  , classof    = require('./$.classof')
  , $def       = require('./$.def')
  , isObject   = require('./$.is-object')
  , anObject   = require('./$.an-object')
  , aFunction  = require('./$.a-function')
  , strictNew  = require('./$.strict-new')
  , forOf      = require('./$.for-of')
  , setProto   = require('./$.set-proto').set
  , same       = require('./$.same')
  , species    = require('./$.species')
  , SPECIES    = require('./$.wks')('species')
  , speciesConstructor = require('./$.species-constructor')
  , RECORD     = require('./$.uid')('record')
  , asap       = require('./$.microtask')
  , PROMISE    = 'Promise'
  , process    = global.process
  , isNode     = classof(process) == 'process'
  , P          = global[PROMISE]
  , Wrapper;

var testResolve = function(sub){
  var test = new P(function(){});
  if(sub)test.constructor = Object;
  return P.resolve(test) === test;
};

var useNative = function(){
  var works = false;
  function P2(x){
    var self = new P(x);
    setProto(self, P2.prototype);
    return self;
  }
  try {
    works = P && P.resolve && testResolve();
    setProto(P2, P);
    P2.prototype = $.create(P.prototype, {constructor: {value: P2}});
    // actual Firefox has broken subclass support, test that
    if(!(P2.resolve(5).then(function(){}) instanceof P2)){
      works = false;
    }
    // actual V8 bug, https://code.google.com/p/v8/issues/detail?id=4162
    if(works && require('./$.support-desc')){
      var thenableThenGotten = false;
      P.resolve($.setDesc({}, 'then', {
        get: function(){ thenableThenGotten = true; }
      }));
      works = thenableThenGotten;
    }
  } catch(e){ works = false; }
  return works;
}();

// helpers
var isPromise = function(it){
  return isObject(it) && (useNative ? classof(it) == 'Promise' : RECORD in it);
};
var sameConstructor = function(a, b){
  // library wrapper special case
  if(LIBRARY && a === P && b === Wrapper)return true;
  return same(a, b);
};
var getConstructor = function(C){
  var S = anObject(C)[SPECIES];
  return S != undefined ? S : C;
};
var isThenable = function(it){
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};
var notify = function(record, isReject){
  if(record.n)return;
  record.n = true;
  var chain = record.c;
  asap(function(){
    var value = record.v
      , ok    = record.s == 1
      , i     = 0;
    var run = function(react){
      var cb = ok ? react.ok : react.fail
        , ret, then;
      try {
        if(cb){
          if(!ok)record.h = true;
          ret = cb === true ? value : cb(value);
          if(ret === react.P){
            react.rej(TypeError('Promise-chain cycle'));
          } else if(then = isThenable(ret)){
            then.call(ret, react.res, react.rej);
          } else react.res(ret);
        } else react.rej(value);
      } catch(err){
        react.rej(err);
      }
    };
    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
    chain.length = 0;
    record.n = false;
    if(isReject)setTimeout(function(){
      var promise = record.p
        , handler, console;
      if(isUnhandled(promise)){
        if(isNode){
          process.emit('unhandledRejection', value, promise);
        } else if(handler = global.onunhandledrejection){
          handler({promise: promise, reason: value});
        } else if((console = global.console) && console.error){
          console.error('Unhandled promise rejection', value);
        }
      } record.a = undefined;
    }, 1);
  });
};
var isUnhandled = function(promise){
  var record = promise[RECORD]
    , chain  = record.a || record.c
    , i      = 0
    , react;
  if(record.h)return false;
  while(chain.length > i){
    react = chain[i++];
    if(react.fail || !isUnhandled(react.P))return false;
  } return true;
};
var $reject = function(value){
  var record = this;
  if(record.d)return;
  record.d = true;
  record = record.r || record; // unwrap
  record.v = value;
  record.s = 2;
  record.a = record.c.slice();
  notify(record, true);
};
var $resolve = function(value){
  var record = this
    , then;
  if(record.d)return;
  record.d = true;
  record = record.r || record; // unwrap
  try {
    if(then = isThenable(value)){
      asap(function(){
        var wrapper = {r: record, d: false}; // wrap
        try {
          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
        } catch(e){
          $reject.call(wrapper, e);
        }
      });
    } else {
      record.v = value;
      record.s = 1;
      notify(record, false);
    }
  } catch(e){
    $reject.call({r: record, d: false}, e); // wrap
  }
};

// constructor polyfill
if(!useNative){
  // 25.4.3.1 Promise(executor)
  P = function Promise(executor){
    aFunction(executor);
    var record = {
      p: strictNew(this, P, PROMISE),         // <- promise
      c: [],                                  // <- awaiting reactions
      a: undefined,                           // <- checked in isUnhandled reactions
      s: 0,                                   // <- state
      d: false,                               // <- done
      v: undefined,                           // <- value
      h: false,                               // <- handled rejection
      n: false                                // <- notify
    };
    this[RECORD] = record;
    try {
      executor(ctx($resolve, record, 1), ctx($reject, record, 1));
    } catch(err){
      $reject.call(record, err);
    }
  };
  require('./$.mix')(P.prototype, {
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    then: function then(onFulfilled, onRejected){
      var react = {
        ok:   typeof onFulfilled == 'function' ? onFulfilled : true,
        fail: typeof onRejected == 'function'  ? onRejected  : false
      };
      var promise = react.P = new (speciesConstructor(this, P))(function(res, rej){
        react.res = res;
        react.rej = rej;
      });
      aFunction(react.res);
      aFunction(react.rej);
      var record = this[RECORD];
      record.c.push(react);
      if(record.a)record.a.push(react);
      if(record.s)notify(record, false);
      return promise;
    },
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    'catch': function(onRejected){
      return this.then(undefined, onRejected);
    }
  });
}

// export
$def($def.G + $def.W + $def.F * !useNative, {Promise: P});
require('./$.tag')(P, PROMISE);
species(P);
species(Wrapper = require('./$.core')[PROMISE]);

// statics
$def($def.S + $def.F * !useNative, PROMISE, {
  // 25.4.4.5 Promise.reject(r)
  reject: function reject(r){
    return new this(function(res, rej){ rej(r); });
  }
});
$def($def.S + $def.F * (!useNative || testResolve(true)), PROMISE, {
  // 25.4.4.6 Promise.resolve(x)
  resolve: function resolve(x){
    return isPromise(x) && sameConstructor(x.constructor, this)
      ? x : new this(function(res){ res(x); });
  }
});
$def($def.S + $def.F * !(useNative && require('./$.iter-detect')(function(iter){
  P.all(iter)['catch'](function(){});
})), PROMISE, {
  // 25.4.4.1 Promise.all(iterable)
  all: function all(iterable){
    var C      = getConstructor(this)
      , values = [];
    return new C(function(res, rej){
      forOf(iterable, false, values.push, values);
      var remaining = values.length
        , results   = Array(remaining);
      if(remaining)$.each.call(values, function(promise, index){
        C.resolve(promise).then(function(value){
          results[index] = value;
          --remaining || res(results);
        }, rej);
      });
      else res(results);
    });
  },
  // 25.4.4.4 Promise.race(iterable)
  race: function race(iterable){
    var C = getConstructor(this);
    return new C(function(res, rej){
      forOf(iterable, false, function(promise){
        C.resolve(promise).then(res, rej);
      });
    });
  }
});
},{"./$":45,"./$.a-function":17,"./$.an-object":18,"./$.classof":19,"./$.core":21,"./$.ctx":22,"./$.def":23,"./$.for-of":28,"./$.global":30,"./$.is-object":38,"./$.iter-detect":42,"./$.library":47,"./$.microtask":48,"./$.mix":49,"./$.same":53,"./$.set-proto":54,"./$.species":57,"./$.species-constructor":56,"./$.strict-new":58,"./$.support-desc":60,"./$.tag":61,"./$.uid":66,"./$.wks":68}],74:[function(require,module,exports){
'use strict';
var $at  = require('./$.string-at')(true);

// 21.1.3.27 String.prototype[@@iterator]()
require('./$.iter-define')(String, 'String', function(iterated){
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , index = this._i
    , point;
  if(index >= O.length)return {value: undefined, done: true};
  point = $at(O, index);
  this._i += point.length;
  return {value: point, done: false};
});
},{"./$.iter-define":41,"./$.string-at":59}],75:[function(require,module,exports){
'use strict';
// ECMAScript 6 symbols shim
var $              = require('./$')
  , global         = require('./$.global')
  , has            = require('./$.has')
  , SUPPORT_DESC   = require('./$.support-desc')
  , $def           = require('./$.def')
  , $redef         = require('./$.redef')
  , $fails         = require('./$.fails')
  , shared         = require('./$.shared')
  , setTag         = require('./$.tag')
  , uid            = require('./$.uid')
  , wks            = require('./$.wks')
  , keyOf          = require('./$.keyof')
  , $names         = require('./$.get-names')
  , enumKeys       = require('./$.enum-keys')
  , isArray        = require('./$.is-array')
  , anObject       = require('./$.an-object')
  , toIObject      = require('./$.to-iobject')
  , createDesc     = require('./$.property-desc')
  , getDesc        = $.getDesc
  , setDesc        = $.setDesc
  , _create        = $.create
  , getNames       = $names.get
  , $Symbol        = global.Symbol
  , $JSON          = global.JSON
  , _stringify     = $JSON && $JSON.stringify
  , setter         = false
  , HIDDEN         = wks('_hidden')
  , isEnum         = $.isEnum
  , SymbolRegistry = shared('symbol-registry')
  , AllSymbols     = shared('symbols')
  , useNative      = typeof $Symbol == 'function'
  , ObjectProto    = Object.prototype;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc = SUPPORT_DESC && $fails(function(){
  return _create(setDesc({}, 'a', {
    get: function(){ return setDesc(this, 'a', {value: 7}).a; }
  })).a != 7;
}) ? function(it, key, D){
  var protoDesc = getDesc(ObjectProto, key);
  if(protoDesc)delete ObjectProto[key];
  setDesc(it, key, D);
  if(protoDesc && it !== ObjectProto)setDesc(ObjectProto, key, protoDesc);
} : setDesc;

var wrap = function(tag){
  var sym = AllSymbols[tag] = _create($Symbol.prototype);
  sym._k = tag;
  SUPPORT_DESC && setter && setSymbolDesc(ObjectProto, tag, {
    configurable: true,
    set: function(value){
      if(has(this, HIDDEN) && has(this[HIDDEN], tag))this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc(1, value));
    }
  });
  return sym;
};

var isSymbol = function(it){
  return typeof it == 'symbol';
};

var $defineProperty = function defineProperty(it, key, D){
  if(D && has(AllSymbols, key)){
    if(!D.enumerable){
      if(!has(it, HIDDEN))setDesc(it, HIDDEN, createDesc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if(has(it, HIDDEN) && it[HIDDEN][key])it[HIDDEN][key] = false;
      D = _create(D, {enumerable: createDesc(0, false)});
    } return setSymbolDesc(it, key, D);
  } return setDesc(it, key, D);
};
var $defineProperties = function defineProperties(it, P){
  anObject(it);
  var keys = enumKeys(P = toIObject(P))
    , i    = 0
    , l = keys.length
    , key;
  while(l > i)$defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P){
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key){
  var E = isEnum.call(this, key);
  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key]
    ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key){
  var D = getDesc(it = toIObject(it), key);
  if(D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key]))D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it){
  var names  = getNames(toIObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i)if(!has(AllSymbols, key = names[i++]) && key != HIDDEN)result.push(key);
  return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it){
  var names  = getNames(toIObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i)if(has(AllSymbols, key = names[i++]))result.push(AllSymbols[key]);
  return result;
};
var $stringify = function stringify(it){
  var args = [it]
    , i    = 1
    , $$   = arguments
    , replacer, $replacer;
  while($$.length > i)args.push($$[i++]);
  replacer = args[1];
  if(typeof replacer == 'function')$replacer = replacer;
  if($replacer || !isArray(replacer))replacer = function(key, value){
    if($replacer)value = $replacer.call(this, key, value);
    if(!isSymbol(value))return value;
  };
  args[1] = replacer;
  return _stringify.apply($JSON, args);
};
var buggyJSON = $fails(function(){
  var S = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  // WebKit converts symbol values to JSON as null
  // V8 throws on boxed symbols
  return _stringify([S]) != '[null]' || _stringify({a: S}) != '{}' || _stringify(Object(S)) != '{}';
});

// 19.4.1.1 Symbol([description])
if(!useNative){
  $Symbol = function Symbol(){
    if(isSymbol(this))throw TypeError('Symbol is not a constructor');
    return wrap(uid(arguments.length > 0 ? arguments[0] : undefined));
  };
  $redef($Symbol.prototype, 'toString', function toString(){
    return this._k;
  });

  isSymbol = function(it){
    return it instanceof $Symbol;
  };

  $.create     = $create;
  $.isEnum     = $propertyIsEnumerable;
  $.getDesc    = $getOwnPropertyDescriptor;
  $.setDesc    = $defineProperty;
  $.setDescs   = $defineProperties;
  $.getNames   = $names.get = $getOwnPropertyNames;
  $.getSymbols = $getOwnPropertySymbols;

  if(SUPPORT_DESC && !require('./$.library')){
    $redef(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }
}

var symbolStatics = {
  // 19.4.2.1 Symbol.for(key)
  'for': function(key){
    return has(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(key){
    return keyOf(SymbolRegistry, key);
  },
  useSetter: function(){ setter = true; },
  useSimple: function(){ setter = false; }
};
// 19.4.2.2 Symbol.hasInstance
// 19.4.2.3 Symbol.isConcatSpreadable
// 19.4.2.4 Symbol.iterator
// 19.4.2.6 Symbol.match
// 19.4.2.8 Symbol.replace
// 19.4.2.9 Symbol.search
// 19.4.2.10 Symbol.species
// 19.4.2.11 Symbol.split
// 19.4.2.12 Symbol.toPrimitive
// 19.4.2.13 Symbol.toStringTag
// 19.4.2.14 Symbol.unscopables
$.each.call((
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,' +
  'species,split,toPrimitive,toStringTag,unscopables'
).split(','), function(it){
  var sym = wks(it);
  symbolStatics[it] = useNative ? sym : wrap(sym);
});

setter = true;

$def($def.G + $def.W, {Symbol: $Symbol});

$def($def.S, 'Symbol', symbolStatics);

$def($def.S + $def.F * !useNative, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: $create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: $defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: $defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $def($def.S + $def.F * (!useNative || buggyJSON), 'JSON', {stringify: $stringify});

// 19.4.3.5 Symbol.prototype[@@toStringTag]
setTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setTag(global.JSON, 'JSON', true);
},{"./$":45,"./$.an-object":18,"./$.def":23,"./$.enum-keys":26,"./$.fails":27,"./$.get-names":29,"./$.global":30,"./$.has":31,"./$.is-array":37,"./$.keyof":46,"./$.library":47,"./$.property-desc":51,"./$.redef":52,"./$.shared":55,"./$.support-desc":60,"./$.tag":61,"./$.to-iobject":64,"./$.uid":66,"./$.wks":68}],76:[function(require,module,exports){
require('./es6.array.iterator');
var Iterators = require('./$.iterators');
Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;
},{"./$.iterators":44,"./es6.array.iterator":70}],77:[function(require,module,exports){
(function (global){
// This method of obtaining a reference to the global object needs to be
// kept identical to the way it is obtained in runtime.js
"use strict";

var _Object$getOwnPropertyNames = require("babel-runtime/core-js/object/get-own-property-names")["default"];

var g = typeof global === "object" ? global : typeof window === "object" ? window : typeof self === "object" ? self : undefined;

// Use `getOwnPropertyNames` because not all browsers support calling
// `hasOwnProperty` on the global `self` object in a worker. See #183.
var hadRuntime = g.regeneratorRuntime && _Object$getOwnPropertyNames(g).indexOf("regeneratorRuntime") >= 0;

// Save the old regeneratorRuntime in case it needs to be restored later.
var oldRuntime = hadRuntime && g.regeneratorRuntime;

// Force reevalutation of runtime.js.
g.regeneratorRuntime = undefined;

module.exports = require("./runtime");

if (hadRuntime) {
  // Restore the original runtime.
  g.regeneratorRuntime = oldRuntime;
} else {
  // Remove the global property added by runtime.js.
  try {
    delete g.regeneratorRuntime;
  } catch (e) {
    g.regeneratorRuntime = undefined;
  }
}

module.exports = { "default": module.exports, __esModule: true };

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./runtime":78,"babel-runtime/core-js/object/get-own-property-names":4}],78:[function(require,module,exports){
(function (process,global){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

"use strict";

var _Symbol = require("babel-runtime/core-js/symbol")["default"];

var _Symbol$iterator = require("babel-runtime/core-js/symbol/iterator")["default"];

var _Object$create = require("babel-runtime/core-js/object/create")["default"];

var _Promise = require("babel-runtime/core-js/promise")["default"];

!(function (global) {
  "use strict";

  var hasOwn = Object.prototype.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var iteratorSymbol = typeof _Symbol === "function" && _Symbol$iterator || "@@iterator";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided, then outerFn.prototype instanceof Generator.
    var generator = _Object$create((outerFn || Generator).prototype);

    generator._invoke = makeInvokeMethod(innerFn, self || null, new Context(tryLocsList || []));

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function (method) {
      prototype[method] = function (arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function (genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor ? ctor === GeneratorFunction ||
    // For the native GeneratorFunction constructor, the best we can
    // do is to check its .name property.
    (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
  };

  runtime.mark = function (genFun) {
    genFun.__proto__ = GeneratorFunctionPrototype;
    genFun.prototype = _Object$create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `value instanceof AwaitArgument` to determine if the yielded value is
  // meant to be awaited. Some may consider the name of this method too
  // cutesy, but they are curmudgeons.
  runtime.awrap = function (arg) {
    return new AwaitArgument(arg);
  };

  function AwaitArgument(arg) {
    this.arg = arg;
  }

  function AsyncIterator(generator) {
    // This invoke function is written in a style that assumes some
    // calling function (or Promise) will handle exceptions.
    function invoke(method, arg) {
      var result = generator[method](arg);
      var value = result.value;
      return value instanceof AwaitArgument ? _Promise.resolve(value.arg).then(invokeNext, invokeThrow) : _Promise.resolve(value).then(function (unwrapped) {
        // When a yielded Promise is resolved, its final value becomes
        // the .value of the Promise<{value,done}> result for the
        // current iteration. If the Promise is rejected, however, the
        // result for this iteration will be rejected with the same
        // reason. Note that rejections of yielded Promises are not
        // thrown back into the generator function, as is the case
        // when an awaited Promise is rejected. This difference in
        // behavior between yield and await is important, because it
        // allows the consumer to decide what to do with the yielded
        // rejection (swallow it and continue, manually .throw it back
        // into the generator, abandon iteration, whatever). With
        // await, by contrast, there is no opportunity to examine the
        // rejection reason outside the generator function, so the
        // only option is to throw it from the await expression, and
        // let the generator function handle the exception.
        result.value = unwrapped;
        return result;
      });
    }

    if (typeof process === "object" && process.domain) {
      invoke = process.domain.bind(invoke);
    }

    var invokeNext = invoke.bind(generator, "next");
    var invokeThrow = invoke.bind(generator, "throw");
    var invokeReturn = invoke.bind(generator, "return");
    var previousPromise;

    function enqueue(method, arg) {
      var enqueueResult =
      // If enqueue has been called before, then we want to wait until
      // all previous Promises have been resolved before calling invoke,
      // so that results are always delivered in the correct order. If
      // enqueue has not been called before, then it is important to
      // call invoke immediately, without waiting on a callback to fire,
      // so that the async generator function has the opportunity to do
      // any necessary setup in a predictable way. This predictability
      // is why the Promise constructor synchronously invokes its
      // executor callback, and why async functions synchronously
      // execute code before the first await. Since we implement simple
      // async functions in terms of async generators, it is especially
      // important to get this right, even though it requires care.
      previousPromise ? previousPromise.then(function () {
        return invoke(method, arg);
      }) : new _Promise(function (resolve) {
        resolve(invoke(method, arg));
      });

      // Avoid propagating enqueueResult failures to Promises returned by
      // later invocations of the iterator.
      previousPromise = enqueueResult["catch"](function (ignored) {});

      return enqueueResult;
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function (innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList));

    return runtime.isGeneratorFunction(outerFn) ? iter // If outerFn is a generator, return the full iterator.
    : iter.next().then(function (result) {
      return result.done ? result.value : iter.next();
    });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          if (method === "return" || method === "throw" && delegate.iterator[method] === undefined) {
            // A return or throw (when the delegate iterator has no throw
            // method) always terminates the yield* loop.
            context.delegate = null;

            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            var returnMethod = delegate.iterator["return"];
            if (returnMethod) {
              var record = tryCatch(returnMethod, delegate.iterator, arg);
              if (record.type === "throw") {
                // If the return method threw an exception, let that
                // exception prevail over the original return or throw.
                method = "throw";
                arg = record.arg;
                continue;
              }
            }

            if (method === "return") {
              // Continue with the outer return, now that the delegate
              // iterator has been terminated.
              continue;
            }
          }

          var record = tryCatch(delegate.iterator[method], delegate.iterator, arg);

          if (record.type === "throw") {
            context.delegate = null;

            // Like returning generator.throw(uncaught), but without the
            // overhead of an extra function call.
            method = "throw";
            arg = record.arg;
            continue;
          }

          // Delegate generator ran and handled its own exceptions so
          // regardless of what the method was, we continue as if it is
          // "next" with an undefined arg.
          method = "next";
          arg = undefined;

          var info = record.arg;
          if (info.done) {
            context[delegate.resultName] = info.value;
            context.next = delegate.nextLoc;
          } else {
            state = GenStateSuspendedYield;
            return info;
          }

          context.delegate = null;
        }

        if (method === "next") {
          if (state === GenStateSuspendedYield) {
            context.sent = arg;
          } else {
            context.sent = undefined;
          }
        } else if (method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw arg;
          }

          if (context.dispatchException(arg)) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            method = "next";
            arg = undefined;
          }
        } else if (method === "return") {
          context.abrupt("return", arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done ? GenStateCompleted : GenStateSuspendedYield;

          var info = {
            value: record.arg,
            done: context.done
          };

          if (record.arg === ContinueSentinel) {
            if (context.delegate && method === "next") {
              // Deliberately forget the last sent value so that we don't
              // accidentally pass it on to the delegate.
              arg = undefined;
            }
          } else {
            return info;
          }
        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(arg) call above.
          method = "throw";
          arg = record.arg;
        }
      }
    };
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[iteratorSymbol] = function () {
    return this;
  };

  Gp.toString = function () {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function (object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1,
            next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function reset(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      this.sent = undefined;
      this.done = false;
      this.delegate = null;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function stop() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function dispatchException(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;
        return !!caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }
          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }
          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }
          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function abrupt(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.next = finallyEntry.finallyLoc;
      } else {
        this.complete(record);
      }

      return ContinueSentinel;
    },

    complete: function complete(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" || record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = record.arg;
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }
    },

    finish: function finish(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function _catch(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function delegateYield(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      return ContinueSentinel;
    }
  };
})(
// Among the various tricks for obtaining a reference to the global
// object, this seems to be the most reliable technique that does not
// use indirect eval (which violates Content Security Policy).
typeof global === "object" ? global : typeof window === "object" ? window : typeof self === "object" ? self : undefined);

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":1,"babel-runtime/core-js/object/create":2,"babel-runtime/core-js/promise":5,"babel-runtime/core-js/symbol":6,"babel-runtime/core-js/symbol/iterator":7}],79:[function(require,module,exports){
'use strict';

var _Object$getOwnPropertyNames = require('babel-runtime/core-js/object/get-own-property-names')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

(function () {
  'use strict';

  if (self.fetch) {
    return;
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name');
    }
    return name.toLowerCase();
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value;
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function (value, name) {
        this.append(name, value);
      }, this);
    } else if (headers) {
      _Object$getOwnPropertyNames(headers).forEach(function (name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function (name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var list = this.map[name];
    if (!list) {
      list = [];
      this.map[name] = list;
    }
    list.push(value);
  };

  Headers.prototype['delete'] = function (name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function (name) {
    var values = this.map[normalizeName(name)];
    return values ? values[0] : null;
  };

  Headers.prototype.getAll = function (name) {
    return this.map[normalizeName(name)] || [];
  };

  Headers.prototype.has = function (name) {
    return this.map.hasOwnProperty(normalizeName(name));
  };

  Headers.prototype.set = function (name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)];
  };

  Headers.prototype.forEach = function (callback, thisArg) {
    _Object$getOwnPropertyNames(this.map).forEach(function (name) {
      this.map[name].forEach(function (value) {
        callback.call(thisArg, value, name, this);
      }, this);
    }, this);
  };

  function consumed(body) {
    if (body.bodyUsed) {
      return _Promise.reject(new TypeError('Already read'));
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new _Promise(function (resolve, reject) {
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(reader.error);
      };
    });
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    reader.readAsArrayBuffer(blob);
    return fileReaderReady(reader);
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    reader.readAsText(blob);
    return fileReaderReady(reader);
  }

  var support = {
    blob: 'FileReader' in self && 'Blob' in self && (function () {
      try {
        new Blob();
        return true;
      } catch (e) {
        return false;
      }
    })(),
    formData: 'FormData' in self
  };

  function Body() {
    this.bodyUsed = false;

    this._initBody = function (body) {
      this._bodyInit = body;
      if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (!body) {
        this._bodyText = '';
      } else {
        throw new Error('unsupported BodyInit type');
      }
    };

    if (support.blob) {
      this.blob = function () {
        var rejected = consumed(this);
        if (rejected) {
          return rejected;
        }

        if (this._bodyBlob) {
          return _Promise.resolve(this._bodyBlob);
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob');
        } else {
          return _Promise.resolve(new Blob([this._bodyText]));
        }
      };

      this.arrayBuffer = function () {
        return this.blob().then(readBlobAsArrayBuffer);
      };

      this.text = function () {
        var rejected = consumed(this);
        if (rejected) {
          return rejected;
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob);
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text');
        } else {
          return _Promise.resolve(this._bodyText);
        }
      };
    } else {
      this.text = function () {
        var rejected = consumed(this);
        return rejected ? rejected : _Promise.resolve(this._bodyText);
      };
    }

    if (support.formData) {
      this.formData = function () {
        return this.text().then(decode);
      };
    }

    this.json = function () {
      return this.text().then(JSON.parse);
    };

    return this;
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method;
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read');
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      if (!body) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = input;
    }

    this.credentials = options.credentials || this.credentials || 'omit';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests');
    }
    this._initBody(body);
  }

  Request.prototype.clone = function () {
    return new Request(this);
  };

  function decode(body) {
    var form = new FormData();
    body.trim().split('&').forEach(function (bytes) {
      if (bytes) {
        var split = bytes.split('=');
        var name = split.shift().replace(/\+/g, ' ');
        var value = split.join('=').replace(/\+/g, ' ');
        form.append(decodeURIComponent(name), decodeURIComponent(value));
      }
    });
    return form;
  }

  function headers(xhr) {
    var head = new Headers();
    var pairs = xhr.getAllResponseHeaders().trim().split('\n');
    pairs.forEach(function (header) {
      var split = header.trim().split(':');
      var key = split.shift().trim();
      var value = split.join(':').trim();
      head.append(key, value);
    });
    return head;
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this._initBody(bodyInit);
    this.type = 'default';
    this.status = options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = options.statusText;
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers);
    this.url = options.url || '';
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function () {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    });
  };

  Response.error = function () {
    var response = new Response(null, { status: 0, statusText: '' });
    response.type = 'error';
    return response;
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function (url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code');
    }

    return new Response(null, { status: status, headers: { location: url } });
  };

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function (input, init) {
    return new _Promise(function (resolve, reject) {
      var request;
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input;
      } else {
        request = new Request(input, init);
      }

      var xhr = new XMLHttpRequest();

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL;
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL');
        }

        return;
      }

      xhr.onload = function () {
        var status = xhr.status === 1223 ? 204 : xhr.status;
        if (status < 100 || status > 599) {
          reject(new TypeError('Network request failed'));
          return;
        }
        var options = {
          status: status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        };
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function () {
        reject(new TypeError('Network request failed'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function (value, name) {
        xhr.setRequestHeader(name, value);
      });

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    });
  };
  self.fetch.polyfill = true;
})();

},{"babel-runtime/core-js/object/get-own-property-names":4,"babel-runtime/core-js/promise":5}],80:[function(require,module,exports){
'use strict';

L.Control.Measure = L.Control.extend({
    options: {
        position: 'topleft'
    },

    initialize: function initialize(fn) {
        this.fn = fn;
    },

    onAdd: function onAdd(map) {
        var container = L.DomUtil.create('div', 'leaflet-control-measure');
        var link = L.DomUtil.create('a', '', container);
        link.href = '#';
        link.title = 'Measure';

        L.DomEvent.on(link, 'click', L.DomEvent.stopPropagation).on(link, 'click', L.DomEvent.preventDefault).on(link, 'click', this.fn).on(link, 'dblclick', L.DomEvent.stopPropagation);

        return container;
    }
});

L.control.measure = function (options) {
    return new L.Control.Measure(options);
};

},{}],81:[function(require,module,exports){
"use strict";

},{}],82:[function(require,module,exports){
/*
 * ccbrowse.js - CCBrowse class.
 *
 * The CCBrowse class is the application class. It is created on DOMContentLoaded,
 * and initializes other classes.
 *
 * The code loosesly follows the MVC paradigm:
 *
 *   Controllers:
 *     - Navigation
 *
 *   Views:
 *     - NavigationView
 *     - Map
 *     - Colormap
 *
 * Much of the code is based on the MooTools framework, and uses its OOP
 * and Event implementation. The `map` (in fact a `profile`) is based on
 * Leaflet.
 *
 *   http://mootools.net/
 *   http://leaflet.cloudmade.com/
 *
 * At the heart of the program is the profile object, loaded from a JSON file.
 * The object hold information about available layers and location of tiles.
 * Layer data has to be prepared in advance by the ccimport.* programs,
 * which are part of this project.
 */

'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _mapJs = require('./map.js');

var _mapJs2 = _interopRequireDefault(_mapJs);

var _navigationJs = require('./navigation.js');

var _navigationJs2 = _interopRequireDefault(_navigationJs);

var _navigationPanelJs = require('./navigation-panel.js');

var _navigationPanelJs2 = _interopRequireDefault(_navigationPanelJs);

var _navigationProgressJs = require('./navigation-progress.js');

var _navigationProgressJs2 = _interopRequireDefault(_navigationProgressJs);

var _locationBarJs = require('./location-bar.js');

var _locationBarJs2 = _interopRequireDefault(_locationBarJs);

var _layerControlJs = require('./layer-control.js');

var _layerControlJs2 = _interopRequireDefault(_layerControlJs);

var _colormapJs = require('./colormap.js');

var _colormapJs2 = _interopRequireDefault(_colormapJs);

var _tooltipJs = require('./tooltip.js');

var _tooltipJs2 = _interopRequireDefault(_tooltipJs);

var _profileJs = require('./profile.js');

var _profileJs2 = _interopRequireDefault(_profileJs);

var Application = (function () {
    function Application(profileUrl) {
        _classCallCheck(this, Application);

        this.profileUrl = profileUrl;
    }

    _createClass(Application, [{
        key: 'start',
        value: function start() {
            var profileSource, layerControl;
            return _regeneratorRuntime.async(function start$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        this.error = document.querySelector('.error');
                        this.note = document.querySelector('.note');

                        window.addEventListener('popstate', this.route.bind(this));

                        // Initialize toolbox.
                        $$('#toolbox a').each((function (link) {
                            link.onclick = (function (evt) {
                                window.history.pushState({}, '', link.href);
                                this.route();
                                evt.preventDefault();
                            }).bind(this);
                        }).bind(this));

                        context$2$0.prev = 4;
                        context$2$0.t0 = _regeneratorRuntime;
                        context$2$0.next = 8;
                        return _regeneratorRuntime.awrap(fetch('profile.json'));

                    case 8:
                        context$2$0.t1 = context$2$0.sent.json();
                        context$2$0.next = 11;
                        return context$2$0.t0.awrap.call(context$2$0.t0, context$2$0.t1);

                    case 11:
                        profileSource = context$2$0.sent;

                        this.profile = new _profileJs2['default'](profileSource);
                        context$2$0.next = 19;
                        break;

                    case 15:
                        context$2$0.prev = 15;
                        context$2$0.t2 = context$2$0['catch'](4);

                        if (context$2$0.t2 instanceof SyntaxError) {
                            this.showError('Invalid profile specification', true);
                        } else {
                            this.showError('Profile specification is not available', true);
                            console.log(context$2$0.t2);
                        }
                        return context$2$0.abrupt('return');

                    case 19:

                        this.nav = new _navigationJs2['default'](this.profile);
                        this.nav.setLayer('calipso532');
                        this.nav.setZoom(2);
                        this.nav.setCurrent(this.profile.origin[0]);

                        this.nav.on('change', (function () {
                            window.history.pushState({}, '', document.location.hash);
                            document.title = this.nav.getCurrent().formatUTC('%e %b %Y %H:%M') + ' ‧ ccbrowse';
                            this.route();
                        }).bind(this));

                        this.nav.on('layerchange', (function () {
                            var layer = this.nav.getLayer();
                            if (layer.colormap.colors) this.colormap = new _colormapJs2['default']($('colormap'), this.nav.getLayer().colormap);
                            if (this.nav.getCurrent().diff(this.profile.origin[0], 'ms') == 0) {
                                this.nav.setCurrent(this.smartCurrent(this.nav.getAvailability()));
                            }
                        }).bind(this));

                        window.addEventListener('resize', (function () {
                            this.colormap = new _colormapJs2['default']($('colormap'), this.nav.getLayer().colormap);
                        }).bind(this));

                        layerControl = new _layerControlJs2['default']($('layer-control'), this.nav);

                        this.navPanel = new _navigationPanelJs2['default']('nav .panel', this.nav);
                        this.navProgress = new _navigationProgressJs2['default']('nav .progress', this.nav);
                        this.map = new _mapJs2['default']($('map'), this.nav, this);
                        this.map.on('error', this.onError.bind(this));
                        $('map').focus();

                        this.locationBar = new _locationBarJs2['default']($('location-bar'), this.map.map, this.profile);

                        // Add tooltips.
                        Array.prototype.forEach.call(document.querySelectorAll('[title]'), function (e) {
                            new _tooltipJs2['default'](e);
                        });

                        this.showNote('Double-click to read off values');

                    case 35:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this, [[4, 15]]);
        }
    }, {
        key: 'smartCurrent',
        value: function smartCurrent(availability) {
            var latest = null;
            var max = 0;
            Array.prototype.forEach.call(availability, function (range) {
                if (range[1] > max) {
                    max = range[1];
                    latest = range;
                }
            });
            if (!latest) return this.profile.origin[0];
            var width = this.profile.zoom[this.nav.getZoom()].width;
            var hour = 3600 * 1000 / width;
            var lower = Math.max(latest[0], latest[1] - hour);
            var upper = latest[1];
            var date = new Date(this.profile.origin[0]);
            return date.increment('ms', (upper + lower) * 0.5 * width);
        }
    }, {
        key: 'context',
        value: function context(name) {
            $$('.context').setStyle('display', 'none');
            $$('.context.' + name).setStyle('display', 'block');
        }
    }, {
        key: 'page',
        value: function page(path) {
            var page = document.querySelector('.page');
            page.set('load', {
                onSuccess: (function () {
                    this.context('page');
                }).bind(this)
            });
            page.load(path);
        }
    }, {
        key: 'route',
        value: function route() {
            if (document.location.pathname == '/about/') this.page('/about.html');else this.context('map');
        }
    }, {
        key: 'onError',
        value: function onError(evt) {
            this.showError(evt.message, evt.nohide);
        }
    }, {
        key: 'showError',
        value: function showError(message, nohide) {
            console.log(message);
            this.error.set('html', message);
            this.error.removeClass('collapsed');
            if (!nohide) {
                window.setTimeout((function () {
                    this.error.addClass('collapsed');
                    this.note.removeClass('hold');
                }).bind(this), 5000);
            }
            this.note.addClass('hold');
        }
    }, {
        key: 'clearError',
        value: function clearError() {
            this.error.addClass('collapsed');
            this.note.removeClass('hold');
        }
    }, {
        key: 'showNote',
        value: function showNote(message) {
            this.note.set('html', message);
            this.note.removeClass('collapsed');
            window.setTimeout((function () {
                this.note.addClass('collapsed');
            }).bind(this), 5000);
            if (!this.error.hasClass('collapsed')) this.note.addClass('hold');
        }
    }]);

    return Application;
})();

exports.Application = Application;

document.addEventListener('DOMContentLoaded', function () {
    var app = new Application('profile.json');
    app.start();
});

},{"./colormap.js":84,"./layer-control.js":85,"./location-bar.js":87,"./map.js":88,"./navigation-panel.js":89,"./navigation-progress.js":90,"./navigation.js":91,"./profile.js":92,"./tooltip.js":95,"babel-runtime/helpers/class-call-check":8,"babel-runtime/helpers/create-class":9,"babel-runtime/helpers/interop-require-default":10,"babel-runtime/regenerator":77}],83:[function(require,module,exports){
/*
 * colorize.js - Apply colormap on data.
 *
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.colorize = colorize;

function colorize(data, width, height, colormap) {
    var i, j, k;
    var d;
    var n = colormap.bounds.length;
    var out = new Uint8ClampedArray(width * height * 4);
    var missing = new Uint8ClampedArray(4);
    var over = new Uint8ClampedArray(4);
    var under = new Uint8ClampedArray(4);

    if (colormap.missing) missing = hexToRgba(colormap.missing);

    if (colormap.under) under = hexToRgba(colormap.under);

    if (colormap.over) over = hexToRgba(colormap.over);

    var colors0 = colormap.colors.map(hexToRgba);

    var colors = new Uint8ClampedArray(colormap.colors.length * 4);
    colors.set(colors.map(function (x, i) {
        return colors0[i / 4 | 0][i % 4];
    }));

    var start = new Float32Array(colormap.bounds.map(function (x) {
        return x.start;
    }));

    var end = new Float32Array(colormap.bounds.map(function (x) {
        return x.end;
    }));

    var diff = new Float32Array(colormap.bounds.map(function (x) {
        return (x.end - x.start) / x.steps;
    }));

    var steps = new Float32Array(colormap.bounds.map(function (x) {
        return x.steps;
    }));

    var cindex = new Float32Array(n + 1);
    cindex.set(cumsum(steps), 1);

    for (i = 0; i < width; i++) {
        for (j = 0; j < height; j++) {
            for (k = 0; k < n; k++) {
                d = data[i * width + j];
                if (d >= start[k] && d < end[k]) {
                    var l = cindex[k] + (d - start[k]) / diff[k] | 0;
                    out[(i * width + j) * 4 + 0] = colors[l * 4 + 0];
                    out[(i * width + j) * 4 + 1] = colors[l * 4 + 1];
                    out[(i * width + j) * 4 + 2] = colors[l * 4 + 2];
                    out[(i * width + j) * 4 + 3] = colors[l * 4 + 3];
                }
            }
        }
    }

    for (i = 0; i < width; i++) {
        for (j = 0; j < height; j++) {
            d = data[i * width + j];
            if (isNaN(d)) {
                out[(i * width + j) * 4 + 0] = missing[0];
                out[(i * width + j) * 4 + 1] = missing[1];
                out[(i * width + j) * 4 + 2] = missing[2];
                out[(i * width + j) * 4 + 3] = missing[3];
            } else if (d < start[0]) {
                out[(i * width + j) * 4 + 0] = under[0];
                out[(i * width + j) * 4 + 1] = under[1];
                out[(i * width + j) * 4 + 2] = under[2];
                out[(i * width + j) * 4 + 3] = under[3];
            } else if (d >= end[end.length - 1]) {
                out[(i * width + j) * 4 + 0] = over[0];
                out[(i * width + j) * 4 + 1] = over[1];
                out[(i * width + j) * 4 + 2] = over[2];
                out[(i * width + j) * 4 + 3] = over[3];
            }
        }
    }
    return out;
}

},{}],84:[function(require,module,exports){
/*
 * colormap.js - Colormap class (view).
 *
 * The Colormap class is responsible for displaying the colormap.
 */

'use strict';

var Colormap = function Colormap(el, colormap) {
    this.el = typeof el == 'string' ? $(el) : el;
    this.colormap = colormap;

    this.el.innerHTML = '';

    var height = this.el.getSize().y;
    var yoffset = 0;

    if (this.colormap.over) {
        var over = document.createElement('div');
        over.addClass('colormap-over');
        over.setStyle('position', 'absolute');
        over.setStyle('top', 0);
        over.setStyle('left', 0);
        over.setStyle('background-color', this.colormap.over);
        this.el.appendChild(over);
        height -= over.getSize().y;
        yoffset += over.getSize().y;
    }

    if (this.colormap.under) {
        var under = document.createElement('div');
        under.addClass('colormap-under');
        this.el.appendChild(under);
        height -= under.getSize().y;
        under.setStyle('position', 'absolute');
        under.setStyle('top', yoffset + height);
        under.setStyle('left', 0);
        under.setStyle('background-color', this.colormap.under);
    }

    var colors = document.createElement('div');
    this.el.appendChild(colors);
    colors.setStyle('position', 'absolute');
    colors.setStyle('width', 20);
    colors.setStyle('top', yoffset);
    colors.setStyle('left', 0);
    colors.setStyle('height', height);
    this.drawColors(colors);

    var ticks = document.createElement('div');
    this.el.appendChild(ticks);
    ticks.setStyle('width', 80);
    ticks.setStyle('height', height);
    ticks.setStyle('position', 'absolute');
    ticks.setStyle('top', yoffset);
    ticks.setStyle('left', 10);
    this.drawTicks(ticks);
};

Colormap.prototype.drawColors = function (el) {
    var height = el.getSize().y;
    var width = el.getSize().x;
    var self = this;
    var h = height / this.colormap.colors.length;
    var n = 1;
    this.colormap.colors.forEach(function (color) {
        var div = document.createElement('div');
        div.setStyle('position', 'absolute');
        div.setStyle('top', height - n * h);
        div.setStyle('width', width);
        div.setStyle('height', h + 1);
        div.setStyle('background', color);
        el.appendChild(div);
        n++;
    });
};

Colormap.prototype.drawTicks = function (el) {
    var height = el.getSize().y;
    var width = el.getSize().x;
    var min = this.colormap.ticks[0];
    var max = this.colormap.ticks[this.colormap.ticks.length - 1];
    var h = height / this.colormap.colors.length;

    // Reduce the number of ticks to fit height.
    var nticks = 0;
    this.colormap.ticks.forEach(function (range) {
        nticks += range.steps;
    });
    var factor = Math.ceil(15 / height * nticks);
    if (factor <= 1) factor = 1;

    var self = this;
    var n = 0;
    var ticks = this.colormap.ticks;
    ticks.forEach(function (range) {
        var steps;
        if (range == ticks[ticks.length - 1]) steps = range.steps + 1;else steps = range.steps;
        for (var i = 0; i < steps; i++, n++) {
            if (n % factor !== 0) continue;
            var v = range.start + (range.end - range.start) * (i / range.steps);
            var y = (self.colormap.colors.length - self.transform(v)) * h;
            var tick = document.createElement('div');
            tick.setStyle('height', 1);
            tick.setStyle('width', 10);
            tick.setStyle('background', 'black');
            tick.setStyle('position', 'absolute');
            tick.setStyle('top', y + 1);
            el.appendChild(tick);

            var label = document.createElement('div');
            el.appendChild(label);
            label.set('html', scientific(v));
            label.setStyle('position', 'absolute');
            label.setStyle('top', y + 1 - label.getSize().y / 2);
            label.setStyle('left', 18);
            label.setStyle('color', 'white');
        }
    });
};

Colormap.prototype.transform = function (value) {
    var n = 0;
    var result = null;
    this.colormap.bounds.forEach(function (range) {
        if (value >= range.start && value <= range.end) result = n + (value - range.start) / (range.end - range.start) * range.steps;
        n += range.steps;
    });
    return result ? result : 0;
};

module.exports = Colormap;

},{}],85:[function(require,module,exports){
'use strict';

var LayerControl = new Class({
    initialize: function initialize(el, nav) {
        this.el = el;
        this.nav = nav;

        this.contentWrapper = this.el.querySelector('.content-wrapper');
        this.content = this.el.querySelector('.content');
        this.icon = this.el.querySelector('.icon');
        this.items = this.el.querySelector('.items');

        this.icon.addEventListener('click', (function () {
            this.el.toggleClass('collapsed');
            if (this.el.hasClass('collapsed')) {
                this.icon.title = '';
                this.el.title = 'Layers';
            } else {
                this.icon.title = 'Hide';
                this.el.title = '';
            }
            if (this.icon.tooltip) this.icon.tooltip.update();
            if (this.el.tooltip) this.el.tooltip.update();
        }).bind(this));

        this.nav.on('layerchange', this.update.bind(this));
        this.update();
    },

    update: function update() {
        this.items.innerHTML = '';
        var layers = this.nav.getLayers();
        Object.each(layers, (function (layer, name) {
            if (layer.dimensions != 'xz' || !layer.colormap) return;
            var item = document.createElement('a');
            item.href = name + '/';
            item.onclick = (function (evt) {
                this.nav.setLayer(name);
                this.update();
                evt.preventDefault();
            }).bind(this);
            item.addClass('layer-item');
            if (layer == this.nav.getLayer()) item.addClass('active');
            var bulb = document.createElement('div');
            bulb.addClass('bulb');
            item.appendChild(bulb);
            var label = document.createElement('span');
            label.set('text', layer.title);
            item.appendChild(label);
            this.items.appendChild(item);
        }).bind(this));

        /*
        var newel = this.el.clone();
        newel.removeClass('collapsed');
        document.body.appendChild(newel);
        this.content.setStyle('width', newel.querySelector('.content').getSize().x);
        this.content.setStyle('height', newel.querySelector('.content').getSize().y);
        document.body.removeChild(newel);
        */
        /*
        this.content.setStyle('width', this.content.getDimensions().x);
        this.content.setStyle('height', this.content.getDimensions().y);
        */
    }
});

module.exports = LayerControl;

},{}],86:[function(require,module,exports){
"use strict";

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _regeneratorRuntime = require("babel-runtime/regenerator")["default"];

Object.defineProperty(exports, "__esModule", {
    value: true
});

var Layer = (function () {
    function Layer(profile, name) {
        _classCallCheck(this, Layer);

        this.name = name;
        this.profile = profile;
        this.source = profile.layers[name];
        this.prototype = profile.source;
    }

    _createClass(Layer, [{
        key: "ready",
        value: function ready() {
            var availabilityUrl, colormapUrl, availabilityPromise, colormapPromise;
            return _regeneratorRuntime.async(function ready$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        availabilityUrl = this.profile.prefix + this.source.availability;
                        colormapUrl = this.profile.prefix + this.source.colormap;
                        availabilityPromise = fetch(availabilityUrl);
                        colormapPromise = fetch(colormapUrl);
                        context$2$0.t0 = _regeneratorRuntime;
                        context$2$0.next = 7;
                        return _regeneratorRuntime.awrap(availabilityPromise);

                    case 7:
                        context$2$0.t1 = context$2$0.sent.json();
                        context$2$0.next = 10;
                        return context$2$0.t0.awrap.call(context$2$0.t0, context$2$0.t1);

                    case 10:
                        this.availability = context$2$0.sent;
                        context$2$0.t2 = _regeneratorRuntime;
                        context$2$0.next = 14;
                        return _regeneratorRuntime.awrap(colormapPromise);

                    case 14:
                        context$2$0.t3 = context$2$0.sent.json();
                        context$2$0.next = 17;
                        return context$2$0.t2.awrap.call(context$2$0.t2, context$2$0.t3);

                    case 17:
                        this.colormap = context$2$0.sent;
                        return context$2$0.abrupt("return", this);

                    case 19:
                    case "end":
                        return context$2$0.stop();
                }
            }, null, this);
        }
    }, {
        key: "tile",
        value: function tile(x, z, zoom) {
            var src, res, data;
            return _regeneratorRuntime.async(function tile$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        src = template(this.source.src, {
                            layer: this.name,
                            x: x,
                            z: z,
                            zoom: zoom
                        });
                        context$2$0.next = 3;
                        return _regeneratorRuntime.awrap(loadImageData(src));

                    case 3:
                        res = context$2$0.sent;
                        context$2$0.next = 6;
                        return _regeneratorRuntime.awrap(pngunpack(res.rawData));

                    case 6:
                        data = context$2$0.sent;
                        return context$2$0.abrupt("return", {
                            layer: this.name,
                            x: x,
                            z: z,
                            zoom: zoom,
                            data: data
                        });

                    case 8:
                    case "end":
                        return context$2$0.stop();
                }
            }, null, this);
        }
    }, {
        key: "src",
        get: function get() {
            return this.source.src;
        }
    }]);

    return Layer;
})();

exports["default"] = Layer;
module.exports = exports["default"];

},{"babel-runtime/helpers/class-call-check":8,"babel-runtime/helpers/create-class":9,"babel-runtime/regenerator":77}],87:[function(require,module,exports){
'use strict';

var LocationBar = new Class({
    initialize: function initialize(bar, map, profile) {
        this.map = map;
        this.profile = profile;
        this.bar = bar;
        this.left = this.bar.querySelector('.left');
        this.center = this.bar.querySelector('.center');
        this.right = this.bar.querySelector('.right');

        this.requests = [];

        this.map.on('moveend', this.update.bind(this));
        this.update();
    },

    update: function update() {
        if (this.xhr) return;

        var bounds = this.map.getBounds();
        var zoom = this.map.getZoom();

        var t1 = bounds.getSouthWest().lon;
        var t3 = bounds.getSouthEast().lon;
        var t2 = (t3 - t2) / 2;

        var bounds = this.map.getPixelBounds();
        var x1 = Math.ceil(bounds.min.x / 256);
        var x2 = Math.floor(bounds.max.x / 256);
        var x = Math.round((x1 + x2) / 2);

        var url = this.profile.prefix + this.profile.layers.geocoding.src;
        url = L.Util.template(url, {
            'zoom': zoom,
            'x': x
        });
        url += '?reduce=128';

        this.xhr = new XMLHttpRequest();
        this.xhr.open('GET', url);
        this.xhr.onreadystatechange = (function () {
            if (this.xhr.readyState != 4) return;
            this.center.set('text', '…');
            this.center.title = 'No information about place available';
            if (this.xhr.status == 200) {
                json = JSON.decode(this.xhr.responseText);
                if (json && json.features.length) {
                    this.center.set('text', json.features[0].properties.name);
                    this.center.title = '';
                }
            } else {
                console.log(url + ' ' + this.xhr.status + ' ' + this.xhr.statusText);
                console.log('No location information available');
            }
            if (this.center.tooltip) this.center.tooltip.update();
            this.xhr = null;
        }).bind(this);
        this.xhr.send();
    }
});

module.exports = LocationBar;

},{}],88:[function(require,module,exports){
/*
 * map.js - The map view class.
 *
 * The Map class is responsible for displaying the map. It depends on
 * the Navigation class to provide information about the current layer
 * and position.
 */

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _yaxisJs = require('./yaxis.js');

var _yaxisJs2 = _interopRequireDefault(_yaxisJs);

var Map = new Class({
    Implements: EventEmitter2,

    initialize: function initialize(el, nav, app) {
        this.el = el;
        this.container = this.el.parentNode;
        this.nav = nav;
        this.app = app;
        this.profile = app.profile;

        this.map = new L.Map(this.el, {
            crs: L.CRS.Custom(this.app.profile),
            maxZoom: this.nav.getMaxZoom(),
            center: new L.LatLng(25000, this.nav.getCurrent() - this.profile.origin[0], true), //new L.LatLng(25000, 45000*1633922 - 3120*1000, true),
            zoom: 2,
            worldCopyJump: false,
            fadeAnimation: true,
            doubleClickZoom: false,
            keyboardPanOffset: 150
        });

        this.map.attributionControl.setPrefix('');

        //this.measureControl = new L.Control.Measure(this.measure.bind(this));
        //this.measureControl.addTo(this.map);

        this.map.on('dblclick', this.onDbClick.bind(this));
        this.map.on('moveend', this.onMove.bind(this));

        this.layerGroup = new L.LayerGroup();
        this.layerGroup.addTo(this.map);

        this.keyboard = new Keyboard({
            defaultEventType: 'keydown',
            events: {
                'pagedown': (function () {
                    this.map.panBy(new L.Point(this.el.getSize().x, 0));
                }).bind(this),
                'pageup': (function () {
                    this.map.panBy(new L.Point(-this.el.getSize().x, 0));
                }).bind(this)
            }
        });
        this.keyboard.activate();

        this.yaxis = new _yaxisJs2['default']($$('#yaxis-container .yaxis')[0], [this.getYRange()[0] / 1000, this.getYRange()[1] / 1000]);

        this.map.on('move', (function () {
            this.yaxis.setDomain([this.getYRange()[0] / 1000, this.getYRange()[1] / 1000]);
        }).bind(this));

        /*
        this.locationLayer = new LocationLayer({
            tileSize: 256,
            continuousWorld: true,
            scheme: 'tms',
        });
        this.locationLayer.addTo(this.map);
        */

        this.nav.on('change', this.move.bind(this));
        this.nav.on('layerchange', this.updateLayer.bind(this));
    },

    /*
    measure: function() {
        this.app.showNote('Measure by drawing a box on the map');
         var box = null;
        var p1 = null;
         this.el.setStyle('cursor', 'crosshair');
        this.map.on('click', function(evt) {
            if (box) {
                // Finished.
                this.el.setStyle('cursor', 'auto');
            }
            p1 = evt.latlng;
            var b2 = new L.LatLng(evt.latlng.lat + 20, evt.latlng.lng + 20);
             box = new L.Rectangle(new L.LatLngBounds(p1, b2), {
                fill: true,
                fillColor: 'black'
            });
            //box.setStyle('background', 'black');
            box.addTo(this.map);
        }.bind(this));
         this.map.on('mousemove', function(evt) {
            if (!box) return;
            console.log(box);
            box.setBounds(new L.LatLngBounds(p1, evt.latlng));
        }.bind(this));
         this.map.on('mouseup', function(evt) {
            if (box) {
                this.el.setStyle('cursor', 'auto');
            }
        }.bind(this));
    },
    */

    getYRange: function getYRange() {
        return [this.map.getBounds().getSouthWest().lat, this.map.getBounds().getNorthWest().lat];
    },

    getXRange: function getXRange() {
        return [this.map.getBounds().getSouthWest().lng, this.map.getBounds().getSouthEast().lng];
    },

    update: function update() {
        var start = new Date(this.profile.origin[0]).increment('ms', this.getXRange()[0]);
        var end = new Date(this.profile.origin[0]).increment('ms', this.getXRange()[1]);
        if (!this.nav.isAvailable(start, end)) {
            this.app.showError('No data available here', true);
        } else {
            this.app.clearError();
        }
    },

    updateLayer: function updateLayer() {
        var layer = this.nav.getLayer();
        //if (layer == this.currentLayer) return;
        //this.currentLayer = layer;

        if (layer.colormap.missing) this.container.setStyle('background', layer.colormap.missing);

        var url = layer.src;
        url = url.replace('\{z\}', '\{y\}');
        url = url.replace('{zoom}', '{z}');

        this.tileLayer = L.tileLayer.canvas({
            maxZoom: this.nav.getMaxZoom(),
            tileSize: 256,
            continuousWorld: true,
            attribution: layer.attribution,
            async: true
        });

        this.tileLayer.drawTile = (function (canvas, tilePoint, zoom) {
            // var src = this.tileLayer.getTileUrl(tilePoint);
            this.tileLayer._adjustTilePoint(tilePoint);
            var template_data = {
                x: tilePoint.x,
                y: Math.pow(2, zoom) - tilePoint.y - 1,
                z: zoom
            };
            var src = L.Util.template(url, template_data);
            var cb = this.tileLayer.tileDrawn.bind(this.tileLayer);
            drawTile(src, canvas, this.nav.getLayer().colormap, cb);
        }).bind(this);

        // this.tileLayer = new L.TileLayer(url, {
        //     maxZoom: this.nav.getMaxZoom(),
        //     tileSize: 256,
        //     continuousWorld: true,
        //     tms: true,
        //     attribution: layer.attribution
        // });

        this.layerGroup.addLayer(this.tileLayer);

        // Remove other layers after a delay of 4s.
        window.setTimeout((function () {
            this.layerGroup.eachLayer((function (layer) {
                if (layer == this.tileLayer) return;
                this.layerGroup.removeLayer(layer);
            }).bind(this));
        }).bind(this), 4000);
    },

    move: function move() {
        if (this.hold) return;
        var t = this.nav.getCurrent() - this.profile.origin[0];
        var latlng = this.map.getCenter();
        latlng.lng = t;

        this.disableOnMove = true;
        this.map.panTo(latlng);

        var tmp = (function () {
            this.map.off('moveend', tmp);
            this.disableOnMove = false;
        }).bind(this);
        this.map.on('moveend', tmp);

        this.update();
    },

    onMove: function onMove(evt) {
        if (this.disableOnMove) return;
        var latlng = this.map.getCenter();

        var t = latlng.lng;
        var h = latlng.lat;

        var date = new Date(this.profile.origin[0]);
        date.increment('ms', t);
        date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
        //this.hold = true;
        this.nav.setCurrent(date);
        //this.hold = false;

        this.update();
    },

    onDbClick: function onDbClick(evt) {
        var value = null;
        var latitude = null;
        var longitude = null;

        var fn = (function () {
            if (value == null || latitude == null || longitude == null) return;
            console.log(value, latitude, longitude);

            var url = this.profile.layers.geography.src + '?q=' + latitude + ',' + longitude;
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = (function () {
                if (xhr.readyState != 4) return;
                if (xhr.status != 200) {
                    console.log(url + ' ' + xhr.status + ' ' + xhr.statusText);
                    this.emit('error', {
                        message: 'No information available for this point'
                    });
                    return;
                }
                try {
                    json = JSON.parse(xhr.responseText);
                } catch (e) {
                    json = {};
                }
                var name = json.name ? json.name : '';
                this.popup({
                    'value': value,
                    'latitude': latitude,
                    'longitude': longitude,
                    'color': color(value, this.nav.getLayer().colormap),
                    'latlng': evt.latlng,
                    'country': name
                });
            }).bind(this);
            xhr.open('GET', url);
            xhr.send();
        }).bind(this);

        var q = new Query();
        q.onLoad = (function (response) {
            value = parseFloat(response);fn();
        }).bind(this);
        q.perform(this.profile, this.nav.getLayer(), this.map.getZoom(), evt.latlng.lng, evt.latlng.lat);

        q = new Query();
        q.onLoad = (function (response) {
            latitude = parseFloat(response);fn();
        }).bind(this);
        q.perform(this.profile, this.profile.layers.latitude, this.map.getZoom(), evt.latlng.lng);

        q = new Query();
        q.onLoad = (function (response) {
            longitude = parseFloat(response);fn();
        }).bind(this);
        q.perform(this.profile, this.profile.layers.longitude, this.map.getZoom(), evt.latlng.lng);
    },

    popup: function popup(desc) {
        var content = $('popup-content-template').clone();
        var valueText = isNaN(desc.value) ? 'Missing data' : scientific(desc.value) + ' ' + this.nav.getLayer().units;

        var lat = format_latitude(desc.latitude, 2);
        var lon = format_longitude(desc.longitude, 2);

        content.querySelector('.value').set('html', valueText);
        content.querySelector('.color-box').setStyle('background-color', desc.color);
        content.querySelector('.latitude').set('html', lat);
        content.querySelector('.longitude').set('html', lon);
        content.querySelector('.height').set('html', scientific(desc.latlng.lat / 1000, 3) + ' km');
        content.querySelector('.time').set('html', time(desc.latlng.lng, this.profile));
        content.querySelector('.country').set('text', desc.country);
        content.querySelector('.latlon-link').href = 'http://maps.google.com/maps?z=5&t=p&q=' + lat + ', ' + lon;

        var popup = new L.Popup();
        popup.setLatLng(desc.latlng);
        popup.setContent(content);
        this.map.openPopup(popup);
    }
});

module.exports = Map;

},{"./yaxis.js":97,"babel-runtime/helpers/interop-require-default":10}],89:[function(require,module,exports){
/*
 * navigation-panel.js - NavigationPanel class (view).
 *
 * The NavigationPanel class is responsible for displaying the navigation bar
 * panel. It depends on the Navigation class to provide the information to
 * display, such as data availability and current position and layer.
 */

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _tooltipJs = require('./tooltip.js');

var _tooltipJs2 = _interopRequireDefault(_tooltipJs);

var NavigationPanel = new Class({
    initialize: function initialize(el, nav) {
        this.el = d3.select(el);
        this.nav = nav;

        this.el.html('');
        this.years = this.el.insert('div').attr('class', 'years');
        this.days = this.el.insert('div').attr('class', 'days');

        this.update();
        this.nav.on('change', this.update.bind(this));
    },

    update: function update(expandedYear) {
        var t1 = this.nav.profile.origin[0];
        var t2 = new Date();
        var t0 = this.nav.getCurrent();

        //var smooth = typeof(expandedYear) != 'undefined';
        expandedYear = expandedYear || t0.getUTCFullYear();

        var years = d3.time.year.utc.range(t1, t2);

        var nextMonth = d3.time.month.utc.offset(t0, 1);
        var dayStop = nextMonth < t2 ? nextMonth : t2;
        var days = d3.time.day.utc.range(d3.time.month.utc(t0), d3.time.month.utc(dayStop));

        var yearGroup = this.years.selectAll('.year-group').data(years);

        yearGroup.enter().append('div').attr('class', 'year-group').insert('div').attr('class', 'year').text(function (d) {
            return d.getUTCFullYear();
        }).each(function () {
            new _tooltipJs2['default'](this);
        });

        var year = yearGroup.selectAll('.year');

        year.classed('disabled', (function (d) {
            return !this.nav.isAvailableYear(d.getUTCFullYear());
        }).bind(this)).property('onclick', (function (d) {
            return (function () {
                this.update(d.getUTCFullYear());
            }).bind(this);
        }).bind(this)).attr('title', '').filter('.disabled').property('onclick', 'return false;').attr('title', 'Unavailable');

        var months = yearGroup.selectAll('.months').data(function (d) {
            return d.getUTCFullYear() == expandedYear ? [d] : [];
        });

        var monthsEnter = months.enter().append('div').attr('class', 'months');

        months.exit().transition().duration(250).style('width', '0px').style('opacity', 0).remove();

        var month = months.selectAll('.month').data(function (d) {
            var next = d3.time.year.utc.offset(d, 1);
            var stop = next < t2 ? next : t2;
            return d3.time.month.utc.range(d, stop);
        });

        month.enter().append('a').attr('class', 'month').text(function (d) {
            return d.formatUTC('%b');
        }).each(function () {
            new _tooltipJs2['default'](this);
        });

        month.classed('selected', function (d) {
            return t0.getUTCFullYear() == d.getUTCFullYear() && t0.getUTCMonth() == d.getUTCMonth();
        }).classed('disabled', (function (d) {
            return !this.nav.isAvailableMonth(d.getUTCFullYear(), d.getUTCMonth());
        }).bind(this)).attr('href', function (d) {
            return d.formatUTC('#%Y-%b');
        }).attr('onclick', '').attr('title', '').filter('.disabled').attr('onclick', 'return false;').attr('title', 'Unavailable');

        monthsEnter.property('__width__', function () {
            return this.clientWidth;
        }).style('width', '0px').transition().duration(250).ease('cubic-in-out').style('opacity', 1).style('width', function () {
            return this.__width__ + 'px';
        });

        var day = this.days.selectAll('.day').data(days);

        day.enter().append('a').attr('class', 'day').text(function (d) {
            return d.getUTCDate();
        }).each(function () {
            new _tooltipJs2['default'](this);
        });

        day.exit().remove();

        day.classed('selected', function (d) {
            return t0.getUTCDate() == d.getUTCDate();
        }).classed('disabled', (function (d) {
            return !this.nav.isAvailableDay(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        }).bind(this)).attr('href', function (d) {
            return d.formatUTC('#%Y-%b-%d');
        }).attr('onclick', '').attr('title', '').filter('.disabled').attr('onclick', 'return false;').attr('title', 'Unavailable');
    }
});

module.exports = NavigationPanel;

},{"./tooltip.js":95,"babel-runtime/helpers/interop-require-default":10}],90:[function(require,module,exports){
/*
 * navigation-progress.js - NavigationProgress class (view).
 *
 * The NavigationProgress class is responsible for displaying the navigation
 * progress bar. It depends on the Navigation class to provide the information
 * to display, such as data availability and current position and layer.
 */

'use strict';

var NavigationProgress = new Class({
    initialize: function initialize(el, nav) {
        this.el = d3.select(el);
        this.nav = nav;

        this.el.html('');
        this.indicator = this.el.insert('div').attr('class', 'indicator');
        this.thumb = this.el.insert('div').attr('class', 'thumb');
        this.tooltip = this.el.insert('div').attr('class', 'tooltip');

        this.update();
        this.nav.on('change', this.update.bind(this));

        this.el.on('mousedown', (function () {
            this.set(d3.event.clientX / this.el.property('clientWidth'));
            this.el.on('mousemove', (function () {
                this.set(d3.event.clientX / this.el.property('clientWidth'));
            }).bind(this));
        }).bind(this));

        this.el.on('mouseup', (function () {
            this.el.on('mousemove', null);
        }).bind(this));

        this.el.on('mouseover.tooltip', (function () {
            this.tooltipAt(d3.event.clientX);
        }).bind(this));

        this.el.on('mousemove.tooltip', (function () {
            this.tooltipAt(d3.event.clientX);
        }).bind(this));

        this.el.on('mouseout.tooltip', (function () {
            this.tooltipAt(null);
        }).bind(this));
    },

    set: function set(fraction) {
        var t0 = this.nav.getCurrent();
        var t1 = d3.time.day.utc(t0);
        t0 = d3.time.second.utc.offset(t1, 24 * 60 * 60 * fraction);
        this.nav.setCurrent(t0);
    },

    update: function update() {
        var t0 = this.nav.getCurrent();
        var t1 = d3.time.day.utc(t0);
        var t2 = d3.time.day.utc.offset(t1, 1);

        var x = d3.time.scale.utc().domain([t1, t2]).range([0, this.el.property('clientWidth')]);

        var fraction = (t0 - t1) / (t2 - t1);

        this.indicator.style('width', x(t0) + 'px');
        this.thumb.style('left', x(t0) + 'px');

        var intervals = this.nav.availableBetween(t1, t2);

        var availability = this.el.selectAll('.availability').data(intervals, Array);

        availability.exit().remove();

        availability.enter().append('div').attr('class', 'availability').style('left', function (d) {
            return x(d[0]) + 'px';
        }).style('width', function (d) {
            return x(d[1]) - x(d[0]) + 'px';
        });
    },

    tooltipAt: function tooltipAt(x) {
        var fraction = x / this.el.property('clientWidth');
        var t0 = this.nav.getCurrent();
        var t1 = d3.time.day.utc(t0);
        var t = d3.time.second.utc.offset(t1, 24 * 60 * 60 * fraction);

        this.tooltip.style('display', function () {
            return x === null ? 'none' : 'block';
        });

        this.tooltip.style('left', function () {
            return x - this.clientWidth / 2 + 'px';
        }).text(t.formatUTC('%H:%M'));
    }
});

module.exports = NavigationProgress;

},{}],91:[function(require,module,exports){
/*
 * navigation.js - Navigation class (controller).
 *
 * The Navigation class holds the information about the current position,
 * layer and data availability. Events are fired when the position or layer
 * changes. The class is independent from other classes.
 */

'use strict';

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var Navigation = new Class({
    Implements: EventEmitter2,

    initialize: function initialize(profile) {
        this.profile = profile;
        this.zoom = 0;
        window.addEventListener('hashchange', this.update.bind(this));
        this.update();
    },

    update: function update() {
        if (window.location.hash === '') return;
        var date = new Date().parse(window.location.hash.substring(1) + ' +0000');
        if (!date.isValid()) return;
        this.current = date;
        this.emit('change');
    },

    getLayers: function getLayers() {
        return this.profile.layers;
    },

    getLayer: function getLayer() {
        return this.layer;
    },

    setLayer: function setLayer(name) {
        return _regeneratorRuntime.async(function setLayer$(context$1$0) {
            while (1) switch (context$1$0.prev = context$1$0.next) {
                case 0:
                    context$1$0.next = 2;
                    return _regeneratorRuntime.awrap(this.profile.layer(name));

                case 2:
                    this.layer = context$1$0.sent;

                    this.emit('change');
                    this.emit('layerchange');

                case 5:
                case 'end':
                    return context$1$0.stop();
            }
        }, null, this);
    },

    getCurrent: function getCurrent() {
        return new Date(this.current);
    },
    setCurrent: function setCurrent(date) {
        this.current = date;
        window.location.replace('#' + date.formatUTC('%Y-%b-%d,%H:%M:%S'));
        this.emit('change');
    },

    getZoom: function getZoom() {
        return this.zoom;
    },
    setZoom: function setZoom(zoom) {
        this.zoom = zoom;
        this.emit('change');
    },

    getMaxZoom: function getMaxZoom() {
        var i = 0;
        while (this.profile.zoom[i.toString()]) i++;
        return i - 1;
    },

    getAvailability: function getAvailability() {
        if (!this.layer || !this.layer.availability || typeof this.layer.availability == 'string' || !this.layer.availability[this.zoom]) return [];
        return this.layer.availability[this.zoom];
    },

    isAvailable: function isAvailable(start, end) {
        var availability = this.getAvailability();

        var x1 = (start - this.profile.origin[0]) / this.profile.zoom[this.zoom].width;
        var x2 = (end - this.profile.origin[0]) / this.profile.zoom[this.zoom].width;

        for (var i = 0; i < availability.length; i++) {
            var range = availability[i];
            if (range[0] >= x1 && range[0] <= x2) return true;
            if (range[1] >= x1 && range[1] <= x2) return true;
            if (range[0] <= x1 && range[1] >= x2) return true;
        }
        return false;
    },

    isAvailableYear: function isAvailableYear(year) {
        return this.isAvailable(new UTCDate(year, 0, 1), new UTCDate(year, 0, 1).increment('year', 1));
    },

    isAvailableMonth: function isAvailableMonth(year, month) {
        return this.isAvailable(new UTCDate(year, month, 1), new UTCDate(year, month, 1).increment('month', 1));
    },

    isAvailableDay: function isAvailableDay(year, month, day) {
        return this.isAvailable(new UTCDate(year, month, day), new UTCDate(year, month, day).increment('day', 1));
    },

    availableBetween: function availableBetween(start, end) {
        if (!this.layer || !this.layer.availability || typeof this.layer.availability == 'string' || !this.layer.availability[this.zoom]) return [];
        var availability = this.layer.availability[this.zoom];

        var x1 = (start - this.profile.origin[0]) / this.profile.zoom[this.zoom].width;
        var x2 = (end - this.profile.origin[0]) / this.profile.zoom[this.zoom].width;

        var intervals = [];
        for (var i = 0; i < availability.length; i++) {
            var range = availability[i];

            var date1 = new Date(this.profile.origin[0]).increment('ms', range[0] * this.profile.zoom[this.zoom].width);
            var date2 = new Date(this.profile.origin[0]).increment('ms', range[1] * this.profile.zoom[this.zoom].width);

            if (range[0] <= x1 && range[1] >= x2) intervals.push([start, end]);
            if (range[0] >= x1 && range[1] <= x2) intervals.push([date1, date2]);
            if (range[0] <= x1 && range[1] >= x1) intervals.push([start, date2]);
            if (range[0] <= x2 && range[1] >= x2) intervals.push([date1, end]);
        }
        return intervals;
    }
});

module.exports = Navigation;

},{"babel-runtime/regenerator":77}],92:[function(require,module,exports){
'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _layerJs = require('./layer.js');

var _layerJs2 = _interopRequireDefault(_layerJs);

var Profile = (function () {
    function Profile(source) {
        _classCallCheck(this, Profile);

        this.source = source;
    }

    _createClass(Profile, [{
        key: 'layer',
        value: function layer(name) {
            var source, layer;
            return _regeneratorRuntime.async(function layer$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        if (!(this.source.layers[name] === undefined)) {
                            context$2$0.next = 2;
                            break;
                        }

                        return context$2$0.abrupt('return', null);

                    case 2:
                        source = this.source.layers[name];
                        layer = new _layerJs2['default'](this, name);
                        context$2$0.next = 6;
                        return _regeneratorRuntime.awrap(layer.ready());

                    case 6:
                        return context$2$0.abrupt('return', context$2$0.sent);

                    case 7:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }
    }, {
        key: 'origin',
        get: function get() {
            return [new Date.parse(this.source.origin[0] + ' +0000'), this.source.origin[1]];
        }
    }, {
        key: 'prefix',
        get: function get() {
            var prefix = this.source.prefix;
            if (prefix !== '' && prefix[prefix.length - 1] !== '/') {
                return prefix + '/';
            }
            return prefix;
        }
    }, {
        key: 'zoom',
        get: function get() {
            return this.source.zoom;
        }
    }, {
        key: 'zBounds',
        get: function get() {
            return this.source['z-bounds'];
        }
    }, {
        key: 'layers',
        get: function get() {
            return this.source.layers;
        }
    }]);

    return Profile;
})();

exports['default'] = Profile;
module.exports = exports['default'];

},{"./layer.js":86,"babel-runtime/helpers/class-call-check":8,"babel-runtime/helpers/create-class":9,"babel-runtime/helpers/interop-require-default":10,"babel-runtime/regenerator":77}],93:[function(require,module,exports){
/*
 * projection.js - Custom Leaflet projection.
 *
 * The L.CRS.Custom class provides projection of time/height coordinates
 * to pixel coordiates for a leaflet map.
 */

'use strict';

L.Projection.Custom = {
    project: function project(latlng) {
        return new L.Point(latlng.lng, latlng.lat);
    },

    unproject: function unproject(point, unbounded) {
        return new L.LatLng(point.y, point.x, true);
    }
};

L.CRS.Custom = function (profile) {
    var transformation = new L.Transformation(1 / profile.zoom[0].width, 0, -1 / profile.zoom[0].height, 1);
    var scale = function scale(zoom) {
        return 256 * profile.zoom[0].width / profile.zoom[zoom].width;
    };
    return L.Util.extend({}, L.CRS, {
        code: 'EPSG:0000',
        projection: L.Projection.Custom,
        transformation: transformation,
        scale: scale
    });
};

},{}],94:[function(require,module,exports){
'use strict';

function Query() {
    ;
}

Query.prototype.onLoad = null;

Query.prototype.perform = function (profile, layer, level, t, h) {
    var req = new XMLHttpRequest();

    req.onreadystatechange = (function () {
        if (req.readyState == 4) {
            if (this.onLoad) this.onLoad(req.responseText);
        }
    }).bind(this);

    var x = t / profile.zoom[level].width;
    var z = (h - profile.origin[1]) / profile.zoom[level].height;

    var url = '../';
    url += L.Util.template(layer.src, {
        zoom: level,
        x: Math.floor(x),
        z: Math.floor(z)
    });

    var i = Math.round(x % 1 * 256);
    var j = Math.round(z % 1 * 256);
    i = i >= 0 ? i : 256 + i;
    j = j >= 0 ? j : 256 + j;
    j = 256 - j;

    if (typeof h == 'undefined') j = 0;

    url += '?q=' + i + ',' + j;

    req.open('GET', url);
    req.send();
};

},{}],95:[function(require,module,exports){
/*
 * tooltip.js - Tooltip class.
 *
 * The Tooltip class is responsible for showing a tooltip for elements
 * on mouse hover. The `title` attribute is used as the text of the tooltip.
 */

'use strict';

var Tooltip = new Class({
    Implements: EventEmitter2,

    initialize: function initialize(forEl) {
        this.template = $('tooltip-template');
        this.el = this.template.clone();
        this.forEl = forEl;
        this.forEl.tooltip = this;
        this.content = this.el.querySelector('.content');

        this.content.set('html', this.forEl.title);

        this.el.set('tween', { duration: 100 });
        this.el.fade('hide');

        $('overlay').appendChild(this.el);

        this.forEl.addEventListener('mouseover', (function () {
            this.update();
            if (!this.title) return;
            this.forEl.title = '';
            this.el.fade('in');
        }).bind(this));

        this.forEl.addEventListener('mouseout', (function () {
            if (this.stick) return;
            this.el.fade('out');
            if (this.forEl.title === '') this.forEl.title = this.title;
        }).bind(this));

        //this.forEl.addEventListener('change', this.update.bind(this));
    },

    update: function update() {
        this.title = this.forEl.title;

        this.content.set('html', this.title);
        if (this.title) this.el.setStyle('display', 'block');else this.el.setStyle('display', 'none');

        var x = this.forEl.getPosition().x;
        var y = this.forEl.getPosition().y;
        var w = this.forEl.getSize().x;
        var h = this.forEl.getSize().y;

        var width = this.el.getSize().x;
        var height = this.el.getSize().y;

        this.el.setStyle('left', x + w / 2 - width / 2);
        this.el.setStyle('top', y + h + 6);

        if (y + h + 6 + height > document.body.getSize().y) this.el.setStyle('top', y - height - 6);

        if (x + w / 2 - width / 2 < 0) this.el.setStyle('left', x);
    },

    setStick: function setStick(stick) {
        this.stick = stick ? true : false;
    }
});

module.exports = Tooltip;

},{}],96:[function(require,module,exports){
/*
 * utils.js - Utility functions.
 *
 * Utility functions used throughout the project.
 */

'use strict';

var $ = function $(id) {
    return document.getElementById(id);
};

function hex2rgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function hexToRgba(hex) {
    if (hex[0] === '#') hex = hex.slice(1);
    x = parseInt(hex, 16);
    var rgba = new Uint8Array(4);
    if (hex.length <= 6) x = x << 8 | 0xff;
    rgba[0] = x >> 24;
    rgba[1] = x >> 16;
    rgba[2] = x >> 8;
    rgba[3] = x;
    return rgba;
}

function cumsum(u) {
    var s = 0;
    return u.map(function (x) {
        return s += x;
    });
}

function pngunpack(data) {
    var u32 = new Uint32Array(data.buffer);
    var u8 = new Uint8Array(data.length / 4);
    u8.set(u32);
    var f32 = new Float32Array(u8.buffer);
    return f32;
}

function scientific(v, precision) {
    if (typeof precision == 'undefined') precision = 1;
    if (v == 0 || Math.abs(v) >= 0.1 && Math.abs(v) < 10000) return v.toFixed(precision);
    var s = v.toExponential(precision);
    if (s.indexOf('e') == -1) return s;
    //return s.replace('e', ' &#x2A09;<span style="margin-left: -2px">10<sup>') + '</sup></span>';
    return s.replace('e', ' x10<sup>') + '</sup>';
}

function color(v, colormap) {
    var color = colormap.missing;
    for (var n = 0, m = 0; n < colormap.bounds.length; n++) {
        var range = colormap.bounds[n];
        if (v >= range.start && v < range.end) {
            color = colormap.colors[Math.floor(m + (v - range.start) / (range.end - range.start) * range.steps)];
            break;
        }
        m += range.steps;
    }
    return color;
}

function time(t, profile) {
    var date = new Date(profile.origin[0]);
    date.increment('ms', t);
    return date.toUTCString().replace('GMT', 'UTC');
}

function format_latitude(lat, precision) {
    var text = scientific(Math.abs(lat), precision) + '° '; //'&#x00B0; ';
    return text + (lat < 0 ? 'S' : 'N');
}

function format_longitude(lon, precision) {
    var text = scientific(Math.abs(lon), precision) + '° '; //'&#x00B0; ';
    return text + (lon < 0 ? 'W' : 'E');
}

function ordinal(n) {
    if (n == 1) return n + '<span class="ordinal">st</span>';
    if (n == 2) return n + '<span class="ordinal">nd</span>';
    if (n == 3) return n + '<span class="ordinal">rd</span>';
    return n + '<span class="ordinal">th</span>';
}

Date.implement({
    formatUTC: function formatUTC(format) {
        var date = new Date(this.getUTCFullYear(), this.getUTCMonth(), this.getUTCDate(), this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds());
        return date.format(format);
    }
});

Date.defineParser('%Y(-%b(-%d(,%H:%M(:%S)?)?)?)?( %z)?');

var UTCDate = function UTCDate(year, month, day, hour, minute, second, millisecond) {
    var date = new Date(1970, 1, 1);
    date.setUTCFullYear(year);
    date.setUTCMonth(month);
    date.setUTCMonth(month);
    date.setUTCDate(day);
    date.setUTCHours(hour ? hour : 0);
    date.setUTCMinutes(minute ? minute : 0);
    date.setUTCSeconds(second ? second : 0);
    date.setUTCMilliseconds(millisecond ? millisecond : 0);
    return date;
};

function loadImageData(src, cb) {
    var img = document.createElement('img');
    img.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        var data = ctx.getImageData(0, 0, img.width, img.height).data;
        cb(data, img.width, img.height);
    };
    img.src = src;
}

function drawTile(src, canvas, colormap, cb) {
    loadImageData(src, function (rawData, width, height) {
        var data = pngunpack(rawData);
        var pixelData = colorize(data, width / 4 | 0, height, colormap);
        var ctx = canvas.getContext('2d');
        var imgData = new ImageData(pixelData, width / 4 | 0, height);
        canvas.width = width / 4 | 0;
        canvas.height = height;
        ctx.putImageData(imgData, 0, 0);
        if (canvas !== undefined) cb(canvas);
    });
}

function colorize(data, width, height, colormap) {
    var i, j, k;
    var d;
    var n = colormap.bounds.length;
    var out = new Uint8ClampedArray(width * height * 4);
    var missing = new Uint8ClampedArray(4);
    var over = new Uint8ClampedArray(4);
    var under = new Uint8ClampedArray(4);

    if (colormap.missing) missing = hexToRgba(colormap.missing);

    if (colormap.under) under = hexToRgba(colormap.under);

    if (colormap.over) over = hexToRgba(colormap.over);

    var colors0 = colormap.colors.map(hexToRgba);

    var colors = new Uint8ClampedArray(colormap.colors.length * 4);
    colors.set(colors.map(function (x, i) {
        return colors0[i / 4 | 0][i % 4];
    }));

    var start = new Float32Array(colormap.bounds.map(function (x) {
        return x.start;
    }));

    var end = new Float32Array(colormap.bounds.map(function (x) {
        return x.end;
    }));

    var diff = new Float32Array(colormap.bounds.map(function (x) {
        return (x.end - x.start) / x.steps;
    }));

    var steps = new Float32Array(colormap.bounds.map(function (x) {
        return x.steps;
    }));

    var cindex = new Float32Array(n + 1);
    cindex.set(cumsum(steps), 1);

    for (i = 0; i < width; i++) {
        for (j = 0; j < height; j++) {
            for (k = 0; k < n; k++) {
                d = data[i * width + j];
                if (d >= start[k] && d < end[k]) {
                    var l = cindex[k] + (d - start[k]) / diff[k] | 0;
                    out[(i * width + j) * 4 + 0] = colors[l * 4 + 0];
                    out[(i * width + j) * 4 + 1] = colors[l * 4 + 1];
                    out[(i * width + j) * 4 + 2] = colors[l * 4 + 2];
                    out[(i * width + j) * 4 + 3] = colors[l * 4 + 3];
                }
            }
        }
    }

    for (i = 0; i < width; i++) {
        for (j = 0; j < height; j++) {
            d = data[i * width + j];
            if (isNaN(d)) {
                out[(i * width + j) * 4 + 0] = missing[0];
                out[(i * width + j) * 4 + 1] = missing[1];
                out[(i * width + j) * 4 + 2] = missing[2];
                out[(i * width + j) * 4 + 3] = missing[3];
            } else if (d < start[0]) {
                out[(i * width + j) * 4 + 0] = under[0];
                out[(i * width + j) * 4 + 1] = under[1];
                out[(i * width + j) * 4 + 2] = under[2];
                out[(i * width + j) * 4 + 3] = under[3];
            } else if (d >= end[end.length - 1]) {
                out[(i * width + j) * 4 + 0] = over[0];
                out[(i * width + j) * 4 + 1] = over[1];
                out[(i * width + j) * 4 + 2] = over[2];
                out[(i * width + j) * 4 + 3] = over[3];
            }
        }
    }
    return out;
}

},{}],97:[function(require,module,exports){
'use strict';

var YAxis = new Class({
    initialize: function initialize(el, domain) {
        this.el = el;
        this.domain = domain;
        this.update();
    },

    setDomain: function setDomain(domain) {
        this.domain = domain;
        this.update();
    },

    update: function update() {
        var h = this.el.getSize().y;

        var scale = d3.scale.linear().domain(this.domain).range([0, h]);
        var data = scale.ticks(10);

        var key = function key(d) {
            return d;
        };
        var label = d3.select(this.el).selectAll('.label').data(data, key);
        var tick = d3.select(this.el).selectAll('.tick').data(data, key);

        label.exit().remove();
        tick.exit().remove();

        label.enter().append('div').attr('class', 'label').text(String);

        label.style('bottom', function (d) {
            return scale(d) - this.getSize().y / 2 + 'px';
        });

        tick.enter().append('div').attr('class', 'tick');

        tick.style('bottom', function (d) {
            return scale(d) - 3 + 'px';
        });
    }
});

module.exports = YAxis;

},{}]},{},[79,95,89,83,91,87,86,81,88,94,82,85,97,84,92,93,80,96,90]);
