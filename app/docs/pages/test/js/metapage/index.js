// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"UASB":[function(require,module,exports) {
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],"rH1J":[function(require,module,exports) {

// shim for using process in browser
var process = module.exports = {}; // cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
  throw new Error('setTimeout has not been defined');
}

function defaultClearTimeout() {
  throw new Error('clearTimeout has not been defined');
}

(function () {
  try {
    if (typeof setTimeout === 'function') {
      cachedSetTimeout = setTimeout;
    } else {
      cachedSetTimeout = defaultSetTimout;
    }
  } catch (e) {
    cachedSetTimeout = defaultSetTimout;
  }

  try {
    if (typeof clearTimeout === 'function') {
      cachedClearTimeout = clearTimeout;
    } else {
      cachedClearTimeout = defaultClearTimeout;
    }
  } catch (e) {
    cachedClearTimeout = defaultClearTimeout;
  }
})();

function runTimeout(fun) {
  if (cachedSetTimeout === setTimeout) {
    //normal enviroments in sane situations
    return setTimeout(fun, 0);
  } // if setTimeout wasn't available but was latter defined


  if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
    cachedSetTimeout = setTimeout;
    return setTimeout(fun, 0);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedSetTimeout(fun, 0);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
      return cachedSetTimeout.call(null, fun, 0);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
      return cachedSetTimeout.call(this, fun, 0);
    }
  }
}

function runClearTimeout(marker) {
  if (cachedClearTimeout === clearTimeout) {
    //normal enviroments in sane situations
    return clearTimeout(marker);
  } // if clearTimeout wasn't available but was latter defined


  if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
    cachedClearTimeout = clearTimeout;
    return clearTimeout(marker);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedClearTimeout(marker);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
      return cachedClearTimeout.call(null, marker);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
      // Some versions of I.E. have different rules for clearTimeout vs setTimeout
      return cachedClearTimeout.call(this, marker);
    }
  }
}

var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
  if (!draining || !currentQueue) {
    return;
  }

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

  var timeout = runTimeout(cleanUpNextTick);
  draining = true;
  var len = queue.length;

  while (len) {
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
  runClearTimeout(timeout);
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
    runTimeout(drainQueue);
  }
}; // v8 likes predictible objects


function Item(fun, array) {
  this.fun = fun;
  this.array = array;
}

Item.prototype.run = function () {
  this.fun.apply(null, this.array);
};

process.title = 'browser';
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
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) {
  return [];
};

process.binding = function (name) {
  throw new Error('process.binding is not supported');
};

process.cwd = function () {
  return '/';
};

process.chdir = function (dir) {
  throw new Error('process.chdir is not supported');
};

process.umask = function () {
  return 0;
};
},{}],"FHml":[function(require,module,exports) {
var process = require("process");
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

},{"process":"rH1J"}],"I27H":[function(require,module,exports) {
module.exports = function (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = fn(xs[i], i);
        if (isArray(x)) res.push.apply(res, x);
        else res.push(x);
    }
    return res;
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],"LEpc":[function(require,module,exports) {
'use strict';
module.exports = balanced;
function balanced(a, b, str) {
  if (a instanceof RegExp) a = maybeMatch(a, str);
  if (b instanceof RegExp) b = maybeMatch(b, str);

  var r = range(a, b, str);

  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + a.length, r[1]),
    post: str.slice(r[1] + b.length)
  };
}

function maybeMatch(reg, str) {
  var m = str.match(reg);
  return m ? m[0] : null;
}

balanced.range = range;
function range(a, b, str) {
  var begs, beg, left, right, result;
  var ai = str.indexOf(a);
  var bi = str.indexOf(b, ai + 1);
  var i = ai;

  if (ai >= 0 && bi > 0) {
    begs = [];
    left = str.length;

    while (i >= 0 && !result) {
      if (i == ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length == 1) {
        result = [ begs.pop(), bi ];
      } else {
        beg = begs.pop();
        if (beg < left) {
          left = beg;
          right = bi;
        }

        bi = str.indexOf(b, i + 1);
      }

      i = ai < bi && ai >= 0 ? ai : bi;
    }

    if (begs.length) {
      result = [ left, right ];
    }
  }

  return result;
}

},{}],"Xvxl":[function(require,module,exports) {
var concatMap = require('concat-map');
var balanced = require('balanced-match');

module.exports = expandTop;

var escSlash = '\0SLASH'+Math.random()+'\0';
var escOpen = '\0OPEN'+Math.random()+'\0';
var escClose = '\0CLOSE'+Math.random()+'\0';
var escComma = '\0COMMA'+Math.random()+'\0';
var escPeriod = '\0PERIOD'+Math.random()+'\0';

function numeric(str) {
  return parseInt(str, 10) == str
    ? parseInt(str, 10)
    : str.charCodeAt(0);
}

function escapeBraces(str) {
  return str.split('\\\\').join(escSlash)
            .split('\\{').join(escOpen)
            .split('\\}').join(escClose)
            .split('\\,').join(escComma)
            .split('\\.').join(escPeriod);
}

function unescapeBraces(str) {
  return str.split(escSlash).join('\\')
            .split(escOpen).join('{')
            .split(escClose).join('}')
            .split(escComma).join(',')
            .split(escPeriod).join('.');
}


// Basically just str.split(","), but handling cases
// where we have nested braced sections, which should be
// treated as individual members, like {a,{b,c},d}
function parseCommaParts(str) {
  if (!str)
    return [''];

  var parts = [];
  var m = balanced('{', '}', str);

  if (!m)
    return str.split(',');

  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(',');

  p[p.length-1] += '{' + body + '}';
  var postParts = parseCommaParts(post);
  if (post.length) {
    p[p.length-1] += postParts.shift();
    p.push.apply(p, postParts);
  }

  parts.push.apply(parts, p);

  return parts;
}

function expandTop(str) {
  if (!str)
    return [];

  // I don't know why Bash 4.3 does this, but it does.
  // Anything starting with {} will have the first two bytes preserved
  // but *only* at the top level, so {},a}b will not expand to anything,
  // but a{},b}c will be expanded to [a}c,abc].
  // One could argue that this is a bug in Bash, but since the goal of
  // this module is to match Bash's rules, we escape a leading {}
  if (str.substr(0, 2) === '{}') {
    str = '\\{\\}' + str.substr(2);
  }

  return expand(escapeBraces(str), true).map(unescapeBraces);
}

function identity(e) {
  return e;
}

function embrace(str) {
  return '{' + str + '}';
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}

function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}

function expand(str, isTop) {
  var expansions = [];

  var m = balanced('{', '}', str);
  if (!m || /\$$/.test(m.pre)) return [str];

  var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
  var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
  var isSequence = isNumericSequence || isAlphaSequence;
  var isOptions = m.body.indexOf(',') >= 0;
  if (!isSequence && !isOptions) {
    // {a},b}
    if (m.post.match(/,.*\}/)) {
      str = m.pre + '{' + m.body + escClose + m.post;
      return expand(str);
    }
    return [str];
  }

  var n;
  if (isSequence) {
    n = m.body.split(/\.\./);
  } else {
    n = parseCommaParts(m.body);
    if (n.length === 1) {
      // x{{a,b}}y ==> x{a}y x{b}y
      n = expand(n[0], false).map(embrace);
      if (n.length === 1) {
        var post = m.post.length
          ? expand(m.post, false)
          : [''];
        return post.map(function(p) {
          return m.pre + n[0] + p;
        });
      }
    }
  }

  // at this point, n is the parts, and we know it's not a comma set
  // with a single entry.

  // no need to expand pre, since it is guaranteed to be free of brace-sets
  var pre = m.pre;
  var post = m.post.length
    ? expand(m.post, false)
    : [''];

  var N;

  if (isSequence) {
    var x = numeric(n[0]);
    var y = numeric(n[1]);
    var width = Math.max(n[0].length, n[1].length)
    var incr = n.length == 3
      ? Math.abs(numeric(n[2]))
      : 1;
    var test = lte;
    var reverse = y < x;
    if (reverse) {
      incr *= -1;
      test = gte;
    }
    var pad = n.some(isPadded);

    N = [];

    for (var i = x; test(i, y); i += incr) {
      var c;
      if (isAlphaSequence) {
        c = String.fromCharCode(i);
        if (c === '\\')
          c = '';
      } else {
        c = String(i);
        if (pad) {
          var need = width - c.length;
          if (need > 0) {
            var z = new Array(need + 1).join('0');
            if (i < 0)
              c = '-' + z + c.slice(1);
            else
              c = z + c;
          }
        }
      }
      N.push(c);
    }
  } else {
    N = concatMap(n, function(el) { return expand(el, false) });
  }

  for (var j = 0; j < N.length; j++) {
    for (var k = 0; k < post.length; k++) {
      var expansion = pre + N[j] + post[k];
      if (!isTop || isSequence || expansion)
        expansions.push(expansion);
    }
  }

  return expansions;
}


},{"concat-map":"I27H","balanced-match":"LEpc"}],"YPEX":[function(require,module,exports) {
module.exports = minimatch
minimatch.Minimatch = Minimatch

var path = { sep: '/' }
try {
  path = require('path')
} catch (er) {}

var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {}
var expand = require('brace-expansion')

var plTypes = {
  '!': { open: '(?:(?!(?:', close: '))[^/]*?)'},
  '?': { open: '(?:', close: ')?' },
  '+': { open: '(?:', close: ')+' },
  '*': { open: '(?:', close: ')*' },
  '@': { open: '(?:', close: ')' }
}

// any single thing other than /
// don't need to escape / when using new RegExp()
var qmark = '[^/]'

// * => any number of characters
var star = qmark + '*?'

// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
var twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?'

// not a ^ or / followed by a dot,
// followed by anything, any number of times.
var twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?'

// characters that need to be escaped in RegExp.
var reSpecials = charSet('().*{}+?[]^$\\!')

// "abc" -> { a:true, b:true, c:true }
function charSet (s) {
  return s.split('').reduce(function (set, c) {
    set[c] = true
    return set
  }, {})
}

// normalizes slashes.
var slashSplit = /\/+/

minimatch.filter = filter
function filter (pattern, options) {
  options = options || {}
  return function (p, i, list) {
    return minimatch(p, pattern, options)
  }
}

function ext (a, b) {
  a = a || {}
  b = b || {}
  var t = {}
  Object.keys(b).forEach(function (k) {
    t[k] = b[k]
  })
  Object.keys(a).forEach(function (k) {
    t[k] = a[k]
  })
  return t
}

minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return minimatch

  var orig = minimatch

  var m = function minimatch (p, pattern, options) {
    return orig.minimatch(p, pattern, ext(def, options))
  }

  m.Minimatch = function Minimatch (pattern, options) {
    return new orig.Minimatch(pattern, ext(def, options))
  }

  return m
}

Minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return Minimatch
  return minimatch.defaults(def).Minimatch
}

function minimatch (p, pattern, options) {
  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {}

  // shortcut: comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    return false
  }

  // "" only matches ""
  if (pattern.trim() === '') return p === ''

  return new Minimatch(pattern, options).match(p)
}

function Minimatch (pattern, options) {
  if (!(this instanceof Minimatch)) {
    return new Minimatch(pattern, options)
  }

  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {}
  pattern = pattern.trim()

  // windows support: need to use /, not \
  if (path.sep !== '/') {
    pattern = pattern.split(path.sep).join('/')
  }

  this.options = options
  this.set = []
  this.pattern = pattern
  this.regexp = null
  this.negate = false
  this.comment = false
  this.empty = false

  // make the set of regexps etc.
  this.make()
}

Minimatch.prototype.debug = function () {}

Minimatch.prototype.make = make
function make () {
  // don't do it more than once.
  if (this._made) return

  var pattern = this.pattern
  var options = this.options

  // empty patterns and comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    this.comment = true
    return
  }
  if (!pattern) {
    this.empty = true
    return
  }

  // step 1: figure out negation, etc.
  this.parseNegate()

  // step 2: expand braces
  var set = this.globSet = this.braceExpand()

  if (options.debug) this.debug = console.error

  this.debug(this.pattern, set)

  // step 3: now we have a set, so turn each one into a series of path-portion
  // matching patterns.
  // These will be regexps, except in the case of "**", which is
  // set to the GLOBSTAR object for globstar behavior,
  // and will not contain any / characters
  set = this.globParts = set.map(function (s) {
    return s.split(slashSplit)
  })

  this.debug(this.pattern, set)

  // glob --> regexps
  set = set.map(function (s, si, set) {
    return s.map(this.parse, this)
  }, this)

  this.debug(this.pattern, set)

  // filter out everything that didn't compile properly.
  set = set.filter(function (s) {
    return s.indexOf(false) === -1
  })

  this.debug(this.pattern, set)

  this.set = set
}

Minimatch.prototype.parseNegate = parseNegate
function parseNegate () {
  var pattern = this.pattern
  var negate = false
  var options = this.options
  var negateOffset = 0

  if (options.nonegate) return

  for (var i = 0, l = pattern.length
    ; i < l && pattern.charAt(i) === '!'
    ; i++) {
    negate = !negate
    negateOffset++
  }

  if (negateOffset) this.pattern = pattern.substr(negateOffset)
  this.negate = negate
}

// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
minimatch.braceExpand = function (pattern, options) {
  return braceExpand(pattern, options)
}

Minimatch.prototype.braceExpand = braceExpand

function braceExpand (pattern, options) {
  if (!options) {
    if (this instanceof Minimatch) {
      options = this.options
    } else {
      options = {}
    }
  }

  pattern = typeof pattern === 'undefined'
    ? this.pattern : pattern

  if (typeof pattern === 'undefined') {
    throw new TypeError('undefined pattern')
  }

  if (options.nobrace ||
    !pattern.match(/\{.*\}/)) {
    // shortcut. no need to expand.
    return [pattern]
  }

  return expand(pattern)
}

// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
Minimatch.prototype.parse = parse
var SUBPARSE = {}
function parse (pattern, isSub) {
  if (pattern.length > 1024 * 64) {
    throw new TypeError('pattern is too long')
  }

  var options = this.options

  // shortcuts
  if (!options.noglobstar && pattern === '**') return GLOBSTAR
  if (pattern === '') return ''

  var re = ''
  var hasMagic = !!options.nocase
  var escaping = false
  // ? => one single character
  var patternListStack = []
  var negativeLists = []
  var stateChar
  var inClass = false
  var reClassStart = -1
  var classStart = -1
  // . and .. never match anything that doesn't start with .,
  // even when options.dot is set.
  var patternStart = pattern.charAt(0) === '.' ? '' // anything
  // not (start or / followed by . or .. followed by / or end)
  : options.dot ? '(?!(?:^|\\\/)\\.{1,2}(?:$|\\\/))'
  : '(?!\\.)'
  var self = this

  function clearStateChar () {
    if (stateChar) {
      // we had some state-tracking character
      // that wasn't consumed by this pass.
      switch (stateChar) {
        case '*':
          re += star
          hasMagic = true
        break
        case '?':
          re += qmark
          hasMagic = true
        break
        default:
          re += '\\' + stateChar
        break
      }
      self.debug('clearStateChar %j %j', stateChar, re)
      stateChar = false
    }
  }

  for (var i = 0, len = pattern.length, c
    ; (i < len) && (c = pattern.charAt(i))
    ; i++) {
    this.debug('%s\t%s %s %j', pattern, i, re, c)

    // skip over any that are escaped.
    if (escaping && reSpecials[c]) {
      re += '\\' + c
      escaping = false
      continue
    }

    switch (c) {
      case '/':
        // completely not allowed, even escaped.
        // Should already be path-split by now.
        return false

      case '\\':
        clearStateChar()
        escaping = true
      continue

      // the various stateChar values
      // for the "extglob" stuff.
      case '?':
      case '*':
      case '+':
      case '@':
      case '!':
        this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c)

        // all of those are literals inside a class, except that
        // the glob [!a] means [^a] in regexp
        if (inClass) {
          this.debug('  in class')
          if (c === '!' && i === classStart + 1) c = '^'
          re += c
          continue
        }

        // if we already have a stateChar, then it means
        // that there was something like ** or +? in there.
        // Handle the stateChar, then proceed with this one.
        self.debug('call clearStateChar %j', stateChar)
        clearStateChar()
        stateChar = c
        // if extglob is disabled, then +(asdf|foo) isn't a thing.
        // just clear the statechar *now*, rather than even diving into
        // the patternList stuff.
        if (options.noext) clearStateChar()
      continue

      case '(':
        if (inClass) {
          re += '('
          continue
        }

        if (!stateChar) {
          re += '\\('
          continue
        }

        patternListStack.push({
          type: stateChar,
          start: i - 1,
          reStart: re.length,
          open: plTypes[stateChar].open,
          close: plTypes[stateChar].close
        })
        // negation is (?:(?!js)[^/]*)
        re += stateChar === '!' ? '(?:(?!(?:' : '(?:'
        this.debug('plType %j %j', stateChar, re)
        stateChar = false
      continue

      case ')':
        if (inClass || !patternListStack.length) {
          re += '\\)'
          continue
        }

        clearStateChar()
        hasMagic = true
        var pl = patternListStack.pop()
        // negation is (?:(?!js)[^/]*)
        // The others are (?:<pattern>)<type>
        re += pl.close
        if (pl.type === '!') {
          negativeLists.push(pl)
        }
        pl.reEnd = re.length
      continue

      case '|':
        if (inClass || !patternListStack.length || escaping) {
          re += '\\|'
          escaping = false
          continue
        }

        clearStateChar()
        re += '|'
      continue

      // these are mostly the same in regexp and glob
      case '[':
        // swallow any state-tracking char before the [
        clearStateChar()

        if (inClass) {
          re += '\\' + c
          continue
        }

        inClass = true
        classStart = i
        reClassStart = re.length
        re += c
      continue

      case ']':
        //  a right bracket shall lose its special
        //  meaning and represent itself in
        //  a bracket expression if it occurs
        //  first in the list.  -- POSIX.2 2.8.3.2
        if (i === classStart + 1 || !inClass) {
          re += '\\' + c
          escaping = false
          continue
        }

        // handle the case where we left a class open.
        // "[z-a]" is valid, equivalent to "\[z-a\]"
        if (inClass) {
          // split where the last [ was, make sure we don't have
          // an invalid re. if so, re-walk the contents of the
          // would-be class to re-translate any characters that
          // were passed through as-is
          // TODO: It would probably be faster to determine this
          // without a try/catch and a new RegExp, but it's tricky
          // to do safely.  For now, this is safe and works.
          var cs = pattern.substring(classStart + 1, i)
          try {
            RegExp('[' + cs + ']')
          } catch (er) {
            // not a valid class!
            var sp = this.parse(cs, SUBPARSE)
            re = re.substr(0, reClassStart) + '\\[' + sp[0] + '\\]'
            hasMagic = hasMagic || sp[1]
            inClass = false
            continue
          }
        }

        // finish up the class.
        hasMagic = true
        inClass = false
        re += c
      continue

      default:
        // swallow any state char that wasn't consumed
        clearStateChar()

        if (escaping) {
          // no need
          escaping = false
        } else if (reSpecials[c]
          && !(c === '^' && inClass)) {
          re += '\\'
        }

        re += c

    } // switch
  } // for

  // handle the case where we left a class open.
  // "[abc" is valid, equivalent to "\[abc"
  if (inClass) {
    // split where the last [ was, and escape it
    // this is a huge pita.  We now have to re-walk
    // the contents of the would-be class to re-translate
    // any characters that were passed through as-is
    cs = pattern.substr(classStart + 1)
    sp = this.parse(cs, SUBPARSE)
    re = re.substr(0, reClassStart) + '\\[' + sp[0]
    hasMagic = hasMagic || sp[1]
  }

  // handle the case where we had a +( thing at the *end*
  // of the pattern.
  // each pattern list stack adds 3 chars, and we need to go through
  // and escape any | chars that were passed through as-is for the regexp.
  // Go through and escape them, taking care not to double-escape any
  // | chars that were already escaped.
  for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
    var tail = re.slice(pl.reStart + pl.open.length)
    this.debug('setting tail', re, pl)
    // maybe some even number of \, then maybe 1 \, followed by a |
    tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function (_, $1, $2) {
      if (!$2) {
        // the | isn't already escaped, so escape it.
        $2 = '\\'
      }

      // need to escape all those slashes *again*, without escaping the
      // one that we need for escaping the | character.  As it works out,
      // escaping an even number of slashes can be done by simply repeating
      // it exactly after itself.  That's why this trick works.
      //
      // I am sorry that you have to see this.
      return $1 + $1 + $2 + '|'
    })

    this.debug('tail=%j\n   %s', tail, tail, pl, re)
    var t = pl.type === '*' ? star
      : pl.type === '?' ? qmark
      : '\\' + pl.type

    hasMagic = true
    re = re.slice(0, pl.reStart) + t + '\\(' + tail
  }

  // handle trailing things that only matter at the very end.
  clearStateChar()
  if (escaping) {
    // trailing \\
    re += '\\\\'
  }

  // only need to apply the nodot start if the re starts with
  // something that could conceivably capture a dot
  var addPatternStart = false
  switch (re.charAt(0)) {
    case '.':
    case '[':
    case '(': addPatternStart = true
  }

  // Hack to work around lack of negative lookbehind in JS
  // A pattern like: *.!(x).!(y|z) needs to ensure that a name
  // like 'a.xyz.yz' doesn't match.  So, the first negative
  // lookahead, has to look ALL the way ahead, to the end of
  // the pattern.
  for (var n = negativeLists.length - 1; n > -1; n--) {
    var nl = negativeLists[n]

    var nlBefore = re.slice(0, nl.reStart)
    var nlFirst = re.slice(nl.reStart, nl.reEnd - 8)
    var nlLast = re.slice(nl.reEnd - 8, nl.reEnd)
    var nlAfter = re.slice(nl.reEnd)

    nlLast += nlAfter

    // Handle nested stuff like *(*.js|!(*.json)), where open parens
    // mean that we should *not* include the ) in the bit that is considered
    // "after" the negated section.
    var openParensBefore = nlBefore.split('(').length - 1
    var cleanAfter = nlAfter
    for (i = 0; i < openParensBefore; i++) {
      cleanAfter = cleanAfter.replace(/\)[+*?]?/, '')
    }
    nlAfter = cleanAfter

    var dollar = ''
    if (nlAfter === '' && isSub !== SUBPARSE) {
      dollar = '$'
    }
    var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast
    re = newRe
  }

  // if the re is not "" at this point, then we need to make sure
  // it doesn't match against an empty path part.
  // Otherwise a/* will match a/, which it should not.
  if (re !== '' && hasMagic) {
    re = '(?=.)' + re
  }

  if (addPatternStart) {
    re = patternStart + re
  }

  // parsing just a piece of a larger pattern.
  if (isSub === SUBPARSE) {
    return [re, hasMagic]
  }

  // skip the regexp for non-magical patterns
  // unescape anything in it, though, so that it'll be
  // an exact match against a file etc.
  if (!hasMagic) {
    return globUnescape(pattern)
  }

  var flags = options.nocase ? 'i' : ''
  try {
    var regExp = new RegExp('^' + re + '$', flags)
  } catch (er) {
    // If it was an invalid regular expression, then it can't match
    // anything.  This trick looks for a character after the end of
    // the string, which is of course impossible, except in multi-line
    // mode, but it's not a /m regex.
    return new RegExp('$.')
  }

  regExp._glob = pattern
  regExp._src = re

  return regExp
}

minimatch.makeRe = function (pattern, options) {
  return new Minimatch(pattern, options || {}).makeRe()
}

Minimatch.prototype.makeRe = makeRe
function makeRe () {
  if (this.regexp || this.regexp === false) return this.regexp

  // at this point, this.set is a 2d array of partial
  // pattern strings, or "**".
  //
  // It's better to use .match().  This function shouldn't
  // be used, really, but it's pretty convenient sometimes,
  // when you just want to work with a regex.
  var set = this.set

  if (!set.length) {
    this.regexp = false
    return this.regexp
  }
  var options = this.options

  var twoStar = options.noglobstar ? star
    : options.dot ? twoStarDot
    : twoStarNoDot
  var flags = options.nocase ? 'i' : ''

  var re = set.map(function (pattern) {
    return pattern.map(function (p) {
      return (p === GLOBSTAR) ? twoStar
      : (typeof p === 'string') ? regExpEscape(p)
      : p._src
    }).join('\\\/')
  }).join('|')

  // must match entire pattern
  // ending in a * or ** will make it less strict.
  re = '^(?:' + re + ')$'

  // can match anything, as long as it's not this.
  if (this.negate) re = '^(?!' + re + ').*$'

  try {
    this.regexp = new RegExp(re, flags)
  } catch (ex) {
    this.regexp = false
  }
  return this.regexp
}

minimatch.match = function (list, pattern, options) {
  options = options || {}
  var mm = new Minimatch(pattern, options)
  list = list.filter(function (f) {
    return mm.match(f)
  })
  if (mm.options.nonull && !list.length) {
    list.push(pattern)
  }
  return list
}

Minimatch.prototype.match = match
function match (f, partial) {
  this.debug('match', f, this.pattern)
  // short-circuit in the case of busted things.
  // comments, etc.
  if (this.comment) return false
  if (this.empty) return f === ''

  if (f === '/' && partial) return true

  var options = this.options

  // windows: need to use /, not \
  if (path.sep !== '/') {
    f = f.split(path.sep).join('/')
  }

  // treat the test path as a set of pathparts.
  f = f.split(slashSplit)
  this.debug(this.pattern, 'split', f)

  // just ONE of the pattern sets in this.set needs to match
  // in order for it to be valid.  If negating, then just one
  // match means that we have failed.
  // Either way, return on the first hit.

  var set = this.set
  this.debug(this.pattern, 'set', set)

  // Find the basename of the path by looking for the last non-empty segment
  var filename
  var i
  for (i = f.length - 1; i >= 0; i--) {
    filename = f[i]
    if (filename) break
  }

  for (i = 0; i < set.length; i++) {
    var pattern = set[i]
    var file = f
    if (options.matchBase && pattern.length === 1) {
      file = [filename]
    }
    var hit = this.matchOne(file, pattern, partial)
    if (hit) {
      if (options.flipNegate) return true
      return !this.negate
    }
  }

  // didn't get any hits.  this is success if it's a negative
  // pattern, failure otherwise.
  if (options.flipNegate) return false
  return this.negate
}

// set partial to true to test if, for example,
// "/a/b" matches the start of "/*/b/*/d"
// Partial means, if you run out of file before you run
// out of pattern, then that's fine, as long as all
// the parts match.
Minimatch.prototype.matchOne = function (file, pattern, partial) {
  var options = this.options

  this.debug('matchOne',
    { 'this': this, file: file, pattern: pattern })

  this.debug('matchOne', file.length, pattern.length)

  for (var fi = 0,
      pi = 0,
      fl = file.length,
      pl = pattern.length
      ; (fi < fl) && (pi < pl)
      ; fi++, pi++) {
    this.debug('matchOne loop')
    var p = pattern[pi]
    var f = file[fi]

    this.debug(pattern, p, f)

    // should be impossible.
    // some invalid regexp stuff in the set.
    if (p === false) return false

    if (p === GLOBSTAR) {
      this.debug('GLOBSTAR', [pattern, p, f])

      // "**"
      // a/**/b/**/c would match the following:
      // a/b/x/y/z/c
      // a/x/y/z/b/c
      // a/b/x/b/x/c
      // a/b/c
      // To do this, take the rest of the pattern after
      // the **, and see if it would match the file remainder.
      // If so, return success.
      // If not, the ** "swallows" a segment, and try again.
      // This is recursively awful.
      //
      // a/**/b/**/c matching a/b/x/y/z/c
      // - a matches a
      // - doublestar
      //   - matchOne(b/x/y/z/c, b/**/c)
      //     - b matches b
      //     - doublestar
      //       - matchOne(x/y/z/c, c) -> no
      //       - matchOne(y/z/c, c) -> no
      //       - matchOne(z/c, c) -> no
      //       - matchOne(c, c) yes, hit
      var fr = fi
      var pr = pi + 1
      if (pr === pl) {
        this.debug('** at the end')
        // a ** at the end will just swallow the rest.
        // We have found a match.
        // however, it will not swallow /.x, unless
        // options.dot is set.
        // . and .. are *never* matched by **, for explosively
        // exponential reasons.
        for (; fi < fl; fi++) {
          if (file[fi] === '.' || file[fi] === '..' ||
            (!options.dot && file[fi].charAt(0) === '.')) return false
        }
        return true
      }

      // ok, let's see if we can swallow whatever we can.
      while (fr < fl) {
        var swallowee = file[fr]

        this.debug('\nglobstar while', file, fr, pattern, pr, swallowee)

        // XXX remove this slice.  Just pass the start index.
        if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
          this.debug('globstar found match!', fr, fl, swallowee)
          // found a match.
          return true
        } else {
          // can't swallow "." or ".." ever.
          // can only swallow ".foo" when explicitly asked.
          if (swallowee === '.' || swallowee === '..' ||
            (!options.dot && swallowee.charAt(0) === '.')) {
            this.debug('dot detected!', file, fr, pattern, pr)
            break
          }

          // ** swallows a segment, and continue.
          this.debug('globstar swallow a segment, and continue')
          fr++
        }
      }

      // no match was found.
      // However, in partial mode, we can't say this is necessarily over.
      // If there's more *pattern* left, then
      if (partial) {
        // ran out of file
        this.debug('\n>>> no match, partial?', file, fr, pattern, pr)
        if (fr === fl) return true
      }
      return false
    }

    // something other than **
    // non-magic patterns just have to match exactly
    // patterns with magic have been turned into regexps.
    var hit
    if (typeof p === 'string') {
      if (options.nocase) {
        hit = f.toLowerCase() === p.toLowerCase()
      } else {
        hit = f === p
      }
      this.debug('string match', p, f, hit)
    } else {
      hit = f.match(p)
      this.debug('pattern match', p, f, hit)
    }

    if (!hit) return false
  }

  // Note: ending in / means that we'll get a final ""
  // at the end of the pattern.  This can only match a
  // corresponding "" at the end of the file.
  // If the file ends in /, then it can only match a
  // a pattern that ends in /, unless the pattern just
  // doesn't have any more for it. But, a/b/ should *not*
  // match "a/b/*", even though "" matches against the
  // [^/]*? pattern, except in partial mode, where it might
  // simply not be reached yet.
  // However, a/b/ should still satisfy a/*

  // now either we fell off the end of the pattern, or we're done.
  if (fi === fl && pi === pl) {
    // ran out of pattern and filename at the same time.
    // an exact hit!
    return true
  } else if (fi === fl) {
    // ran out of file, but still had pattern left.
    // this is ok if we're doing the match as part of
    // a glob fs traversal.
    return partial
  } else if (pi === pl) {
    // ran out of pattern, still have file left.
    // this is only acceptable if we're on the very last
    // empty segment of a file with a trailing slash.
    // a/* should match a/b/
    var emptyFileEnd = (fi === fl - 1) && (file[fi] === '')
    return emptyFileEnd
  }

  // should be unreachable.
  throw new Error('wtf?')
}

// replace stuff like \* with *
function globUnescape (s) {
  return s.replace(/\\(.)/g, '$1')
}

function regExpEscape (s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

},{"path":"FHml","brace-expansion":"Xvxl"}],"cY5T":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CurrentVersion = exports.AllVersions = exports.Versions = void 0;
var Versions;
exports.Versions = Versions;

(function (Versions) {
  Versions["V0_0_1"] = "0.0.1";
  Versions["V0_1_0"] = "0.1.0";
  Versions["V0_2"] = "0.2";
  Versions["V0_3"] = "0.3";
})(Versions || (exports.Versions = Versions = {}));

const AllVersions = Object.keys(Versions);
exports.AllVersions = AllVersions;
const CurrentVersion = Versions.V0_3;
exports.CurrentVersion = CurrentVersion;
},{}],"Xnuv":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VERSION = exports.URL_PARAM_DEBUG = exports.METAPAGE_KEY_STATE = exports.METAPAGE_KEY_DEFINITION = exports.METAFRAME_JSON_FILE = void 0;

var _MetaLibsVersion = require("./MetaLibsVersion");

const METAFRAME_JSON_FILE = "metaframe.json";
exports.METAFRAME_JSON_FILE = METAFRAME_JSON_FILE;
const METAPAGE_KEY_DEFINITION = "metapage/definition";
exports.METAPAGE_KEY_DEFINITION = METAPAGE_KEY_DEFINITION;
const METAPAGE_KEY_STATE = "metapage/state";
exports.METAPAGE_KEY_STATE = METAPAGE_KEY_STATE;
const URL_PARAM_DEBUG = "MP_DEBUG";
exports.URL_PARAM_DEBUG = URL_PARAM_DEBUG;
const VERSION = _MetaLibsVersion.AllVersions[_MetaLibsVersion.AllVersions.length - 1];
exports.VERSION = VERSION;
},{"./MetaLibsVersion":"cY5T"}],"wret":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ApiPayloadPluginRequestMethod = exports.OtherEvents = exports.JsonRpcMethodsFromParent = exports.JsonRpcMethodsFromChild = void 0;
var JsonRpcMethodsFromChild;
exports.JsonRpcMethodsFromChild = JsonRpcMethodsFromChild;

(function (JsonRpcMethodsFromChild) {
  JsonRpcMethodsFromChild["InputsUpdate"] = "InputsUpdate";
  JsonRpcMethodsFromChild["OutputsUpdate"] = "OutputsUpdate";
  JsonRpcMethodsFromChild["SetupIframeClientRequest"] = "SetupIframeClientRequest";
  JsonRpcMethodsFromChild["SetupIframeServerResponseAck"] = "SetupIframeServerResponseAck";
  JsonRpcMethodsFromChild["PluginRequest"] = "SetupIframeServerPluginRequestResponseAck";
})(JsonRpcMethodsFromChild || (exports.JsonRpcMethodsFromChild = JsonRpcMethodsFromChild = {}));

var JsonRpcMethodsFromParent;
exports.JsonRpcMethodsFromParent = JsonRpcMethodsFromParent;

(function (JsonRpcMethodsFromParent) {
  JsonRpcMethodsFromParent["InputsUpdate"] = "InputsUpdate";
  JsonRpcMethodsFromParent["MessageAck"] = "MessageAck";
  JsonRpcMethodsFromParent["SetupIframeServerResponse"] = "SetupIframeServerResponse";
})(JsonRpcMethodsFromParent || (exports.JsonRpcMethodsFromParent = JsonRpcMethodsFromParent = {}));

var OtherEvents;
exports.OtherEvents = OtherEvents;

(function (OtherEvents) {
  OtherEvents["Message"] = "Message";
})(OtherEvents || (exports.OtherEvents = OtherEvents = {}));

var ApiPayloadPluginRequestMethod;
exports.ApiPayloadPluginRequestMethod = ApiPayloadPluginRequestMethod;

(function (ApiPayloadPluginRequestMethod) {
  ApiPayloadPluginRequestMethod["State"] = "metapage/state";
})(ApiPayloadPluginRequestMethod || (exports.ApiPayloadPluginRequestMethod = ApiPayloadPluginRequestMethod = {}));
},{}],"ojAg":[function(require,module,exports) {
var define;
/* global define */
(function (root, factory) {
  /* istanbul ignore next */
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.compareVersions = factory();
  }
}(this, function () {

  var semver = /^v?(?:\d+)(\.(?:[x*]|\d+)(\.(?:[x*]|\d+)(\.(?:[x*]|\d+))?(?:-[\da-z\-]+(?:\.[\da-z\-]+)*)?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i;

  function indexOrEnd(str, q) {
    return str.indexOf(q) === -1 ? str.length : str.indexOf(q);
  }

  function split(v) {
    var c = v.replace(/^v/, '').replace(/\+.*$/, '');
    var patchIndex = indexOrEnd(c, '-');
    var arr = c.substring(0, patchIndex).split('.');
    arr.push(c.substring(patchIndex + 1));
    return arr;
  }

  function tryParse(v) {
    return isNaN(Number(v)) ? v : Number(v);
  }

  function validate(version) {
    if (typeof version !== 'string') {
      throw new TypeError('Invalid argument expected string');
    }
    if (!semver.test(version)) {
      throw new Error('Invalid argument not valid semver (\''+version+'\' received)');
    }
  }

  function compareVersions(v1, v2) {
    [v1, v2].forEach(validate);

    var s1 = split(v1);
    var s2 = split(v2);

    for (var i = 0; i < Math.max(s1.length - 1, s2.length - 1); i++) {
      var n1 = parseInt(s1[i] || 0, 10);
      var n2 = parseInt(s2[i] || 0, 10);

      if (n1 > n2) return 1;
      if (n2 > n1) return -1;
    }

    var sp1 = s1[s1.length - 1];
    var sp2 = s2[s2.length - 1];

    if (sp1 && sp2) {
      var p1 = sp1.split('.').map(tryParse);
      var p2 = sp2.split('.').map(tryParse);

      for (i = 0; i < Math.max(p1.length, p2.length); i++) {
        if (p1[i] === undefined || typeof p2[i] === 'string' && typeof p1[i] === 'number') return -1;
        if (p2[i] === undefined || typeof p1[i] === 'string' && typeof p2[i] === 'number') return 1;

        if (p1[i] > p2[i]) return 1;
        if (p2[i] > p1[i]) return -1;
      }
    } else if (sp1 || sp2) {
      return sp1 ? -1 : 1;
    }

    return 0;
  };

  var allowedOperators = [
    '>',
    '>=',
    '=',
    '<',
    '<='
  ];

  var operatorResMap = {
    '>': [1],
    '>=': [0, 1],
    '=': [0],
    '<=': [-1, 0],
    '<': [-1]
  };

  function validateOperator(op) {
    if (typeof op !== 'string') {
      throw new TypeError('Invalid operator type, expected string but got ' + typeof op);
    }
    if (allowedOperators.indexOf(op) === -1) {
      throw new TypeError('Invalid operator, expected one of ' + allowedOperators.join('|'));
    }
  }

  compareVersions.validate = function(version) {
    return typeof version === 'string' && semver.test(version);
  }

  compareVersions.compare = function (v1, v2, operator) {
    // Validate operator
    validateOperator(operator);

    // since result of compareVersions can only be -1 or 0 or 1
    // a simple map can be used to replace switch
    var res = compareVersions(v1, v2);
    return operatorResMap[operator].indexOf(res) > -1;
  }

  return compareVersions;
}));

},{}],"f0H1":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.base64encode = base64encode;
exports.base64decode = base64decode;
exports.intToRGB = exports.hashCode = exports.stringToRgb = exports.log = exports.generateId = exports.generateNonce = exports.generateMetapageId = exports.generateMetaframeId = exports.existsAnyUrlParam = exports.getUrlParamDEBUG = exports.getUrlParam = exports.getMatchingVersion = exports.merge = exports.convertToCurrentDefinition = void 0;

var _compareVersions = require("compare-versions");

var _Constants = require("./Constants");

var _MetaLibsVersion = require("./MetaLibsVersion");

const convertToCurrentDefinition = def => {
  if (def === null) {
    throw "Metapage definition cannot be null";
  }

  if (typeof def === "string") {
    try {
      def = JSON.parse(def);
    } catch (err) {
      throw `Cannot parse into JSON:\n${def}`;
    }
  }

  let updatedDefinition;

  switch (getMatchingVersion(def.version)) {
    case _MetaLibsVersion.Versions.V0_2:
      {
        updatedDefinition = convertToCurrentDefinition(definition_v0_2_to_v0_3(def));
        break;
      }

    case _MetaLibsVersion.Versions.V0_3:
      {
        updatedDefinition = def;
        break;
      }

    default:
      {
        throw `Unknown metapage version: ${def.version}. Supported versions: [${_MetaLibsVersion.AllVersions.join(", ")}]`;
      }
  }

  return updatedDefinition;
};

exports.convertToCurrentDefinition = convertToCurrentDefinition;

const definition_v0_2_to_v0_3 = old => {
  old.version = _MetaLibsVersion.Versions.V0_3;
  return old;
};

const merge = (current, newInputs) => {
  if (!newInputs) {
    return false;
  }

  let modified = false;
  Object.keys(newInputs).forEach(pipeId => {
    modified = true;

    if (newInputs[pipeId] === undefined) {
      delete current[pipeId];
    } else {
      current[pipeId] = newInputs[pipeId];
    }
  });
  return modified;
};

exports.merge = merge;

const getMatchingVersion = version => {
  if (version == "latest") {
    return _MetaLibsVersion.CurrentVersion;
  } else if ((0, _compareVersions.compare)(version, "0.0.x", "<")) {
    return _MetaLibsVersion.Versions.V0_0_1;
  } else if ((0, _compareVersions.compare)(version, "0.1.36", ">=") && (0, _compareVersions.compare)(version, _MetaLibsVersion.Versions.V0_2, "<")) {
    return _MetaLibsVersion.Versions.V0_1_0;
  } else if ((0, _compareVersions.compare)(version, "0.2", ">=") && (0, _compareVersions.compare)(version, _MetaLibsVersion.Versions.V0_3, "<")) {
    return _MetaLibsVersion.Versions.V0_2;
  } else if ((0, _compareVersions.compare)(version, "0.3", ">=")) {
    return _MetaLibsVersion.Versions.V0_3;
  } else {
    console.log(`Could not match version=${version} to any known version, assuming ${_MetaLibsVersion.CurrentVersion}`);
    return _MetaLibsVersion.CurrentVersion;
  }
};

exports.getMatchingVersion = getMatchingVersion;

const getUrlParam = key => {
  if (!window.location.search) {
    return null;
  }

  return new URLSearchParams(window.location.search).get(key);
};

exports.getUrlParam = getUrlParam;

const getUrlParamDEBUG = () => {
  return new URLSearchParams(window.location.search).has(_Constants.URL_PARAM_DEBUG);
};

exports.getUrlParamDEBUG = getUrlParamDEBUG;

const existsAnyUrlParam = k => {
  const members = k.filter(param => {
    return new URLSearchParams(window.location.search).has(param);
  });
  return members.length > 0;
};

exports.existsAnyUrlParam = existsAnyUrlParam;

const generateMetaframeId = (length = 8) => {
  return generateId(length);
};

exports.generateMetaframeId = generateMetaframeId;

const generateMetapageId = (length = 8) => {
  return generateId(length);
};

exports.generateMetapageId = generateMetapageId;

const generateNonce = (length = 8) => {
  return generateId(length);
};

exports.generateNonce = generateNonce;
const LETTERS = "abcdefghijklmnopqrstuvwxyz0123456789";

const generateId = (length = 8) => {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = LETTERS.length;

  for (var i = 0; i < length; i++) {
    result += LETTERS.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

exports.generateId = generateId;

const log = (o, color, backgroundColor) => {
  color = color ? color : "000";

  if (color && color.trim() == "") {
    color = undefined;
  }

  let s;

  if (typeof o === "string") {
    s = o;
  } else if (typeof o === "number") {
    s = o + "";
  } else {
    s = JSON.stringify(o, null, "  ");
  }

  if (color && color.trim() != "") {
    var cssstring = `color: #${color}`;

    if (backgroundColor) {
      cssstring = `${cssstring}; background: #${backgroundColor}`;
    }

    s = `%c${s}`;
    window.console.log(s, cssstring);
  } else {
    window.console.log(s);
  }
};

exports.log = log;

const stringToRgb = str => {
  return intToRGB(hashCode(str));
};

exports.stringToRgb = stringToRgb;

const hashCode = str => {
  var hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return hash;
};

exports.hashCode = hashCode;

const intToRGB = i => {
  var c = (i & 0x00ffffff).toString(16).toUpperCase();
  return "00000".substring(0, 6 - c.length) + c;
};

exports.intToRGB = intToRGB;
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const lookup = new Uint8Array(256);

for (var i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}

function base64encode(arraybuffer) {
  let bytes = new Uint8Array(arraybuffer);
  let i;
  let len = bytes.length;
  let base64 = "";

  for (i = 0; i < len; i += 3) {
    base64 += chars[bytes[i] >> 2];
    base64 += chars[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
    base64 += chars[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
    base64 += chars[bytes[i + 2] & 63];
  }

  if (len % 3 === 2) {
    base64 = base64.substring(0, base64.length - 1) + "=";
  } else if (len % 3 === 1) {
    base64 = base64.substring(0, base64.length - 2) + "==";
  }

  return base64;
}

function base64decode(base64) {
  if (!base64) {
    throw new Error("base64decode string argument given");
  }

  let bufferLength = base64.length * 0.75,
      len = base64.length,
      i,
      p = 0,
      encoded1,
      encoded2,
      encoded3,
      encoded4;

  if (base64[base64.length - 1] === "=") {
    bufferLength--;

    if (base64[base64.length - 2] === "=") {
      bufferLength--;
    }
  }

  var arraybuffer = new ArrayBuffer(bufferLength),
      bytes = new Uint8Array(arraybuffer);

  for (i = 0; i < len; i += 4) {
    encoded1 = lookup[base64.charCodeAt(i)];
    encoded2 = lookup[base64.charCodeAt(i + 1)];
    encoded3 = lookup[base64.charCodeAt(i + 2)];
    encoded4 = lookup[base64.charCodeAt(i + 3)];
    bytes[p++] = encoded1 << 2 | encoded2 >> 4;
    bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
    bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
  }

  return arraybuffer;
}
},{"compare-versions":"ojAg","./Constants":"Xnuv","./MetaLibsVersion":"cY5T"}],"Vntl":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Metapage = exports.getLibraryVersionMatching = exports.MetapageEventStateType = exports.MetapageEvents = void 0;

var _eventemitter = require("eventemitter3");

var _minimatch = _interopRequireDefault(require("minimatch"));

var _Constants = require("./Constants");

var _MetaLibsVersion = require("./MetaLibsVersion");

var _JsonRpcMethods = require("./v0_3/JsonRpcMethods");

var _MetapageTools = require("./MetapageTools");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }

  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

var MetapageEvents;
exports.MetapageEvents = MetapageEvents;

(function (MetapageEvents) {
  MetapageEvents["Inputs"] = "inputs";
  MetapageEvents["Outputs"] = "outputs";
  MetapageEvents["State"] = "state";
  MetapageEvents["Definition"] = "definition";
  MetapageEvents["Error"] = "error";
})(MetapageEvents || (exports.MetapageEvents = MetapageEvents = {}));

var MetapageEventStateType;
exports.MetapageEventStateType = MetapageEventStateType;

(function (MetapageEventStateType) {
  MetapageEventStateType["all"] = "all";
  MetapageEventStateType["delta"] = "delta";
})(MetapageEventStateType || (exports.MetapageEventStateType = MetapageEventStateType = {}));

const emptyState = () => {
  return {
    metaframes: {
      inputs: {},
      outputs: {}
    },
    plugins: {
      inputs: {},
      outputs: {}
    }
  };
};

const getLibraryVersionMatching = version => {
  return (0, _MetapageTools.getMatchingVersion)(version);
};

exports.getLibraryVersionMatching = getLibraryVersionMatching;
const CONSOLE_BACKGROUND_COLOR_DEFAULT = "bcbcbc";

class Metapage extends _eventemitter.EventEmitter {
  constructor(opts) {
    super();
    this._state = emptyState();
    this._metaframes = {};
    this._plugins = {};
    this._pluginOrder = [];
    this.debug = false;
    this._cachedInputLookupMap = {};
    this._inputMap = {};
    this._id = opts && opts.id ? opts.id : (0, _MetapageTools.generateMetapageId)();
    this._consoleBackgroundColor = opts && opts.color ? opts.color : CONSOLE_BACKGROUND_COLOR_DEFAULT;
    this.addPipe = this.addPipe.bind(this);
    this.dispose = this.dispose.bind(this);
    this.getDefinition = this.getDefinition.bind(this);
    this.addMetaframe = this.addMetaframe.bind(this);
    this.addPlugin = this.addPlugin.bind(this);
    this.getInputsFromOutput = this.getInputsFromOutput.bind(this);
    this.getMetaframe = this.getMetaframe.bind(this);
    this.getMetaframeIds = this.getMetaframeIds.bind(this);
    this.getMetaframeOrPlugin = this.getMetaframeOrPlugin.bind(this);
    this.getMetaframes = this.getMetaframes.bind(this);
    this.getPlugin = this.getPlugin.bind(this);
    this.getPluginIds = this.getPluginIds.bind(this);
    this.getState = this.getState.bind(this);
    this.getStateMetaframes = this.getStateMetaframes.bind(this);
    this.isValidJSONRpcMessage = this.isValidJSONRpcMessage.bind(this);
    this.log = this.log.bind(this);
    this.logInternal = this.logInternal.bind(this);
    this.metaframeIds = this.metaframeIds.bind(this);
    this.metaframes = this.metaframes.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.pluginIds = this.pluginIds.bind(this);
    this.plugins = this.plugins.bind(this);
    this.removeAll = this.removeAll.bind(this);
    this.removeMetaframe = this.removeMetaframe.bind(this);
    this.removePlugin = this.removePlugin.bind(this);
    this.setDebugFromUrlParams = this.setDebugFromUrlParams.bind(this);
    this.setDefinition = this.setDefinition.bind(this);
    this.setInput = this.setInput.bind(this);
    this.setInputs = this.setInputs.bind(this);
    this.setInputStateOnly = this.setInputStateOnly.bind(this);
    this.setMetaframeClientInputAndSentClientEvent = this.setMetaframeClientInputAndSentClientEvent.bind(this);
    this.setOutputStateOnly = this.setOutputStateOnly.bind(this);
    this.setState = this.setState.bind(this);
    window.addEventListener("message", this.onMessage);
    this.log("Initialized");
  }

  static from(metaPageDef, inputs) {
    if (metaPageDef == null) {
      throw "Metapage definition cannot be null";
    }

    if (typeof metaPageDef === "string") {
      try {
        metaPageDef = JSON.parse(metaPageDef);
      } catch (err) {
        throw "Cannot parse into JSON:\n${metaPageDef}";
      }
    }

    var metapage = new Metapage();
    return metapage.setDefinition(metaPageDef);
  }

  addListenerReturnDisposer(event, listener) {
    super.addListener(event, listener);

    const disposer = () => {
      super.removeListener(event, listener);
    };

    return disposer;
  }

  setDebugFromUrlParams() {
    this.debug = (0, _MetapageTools.existsAnyUrlParam)(["MP_DEBUG", "DEBUG", "debug", "mp_debug"]);
    return this;
  }

  getState() {
    return this._state;
  }

  setState(newState) {
    this._state = newState;
    this.getMetaframeIds().forEach(metaframeId => {
      this.getMetaframe(metaframeId).setInputs(this._state.metaframes.inputs[metaframeId]);
      this.getMetaframe(metaframeId).setOutputs(this._state.metaframes.outputs[metaframeId]);
    });
    this.getPluginIds().forEach(pluginId => {
      this.getPlugin(pluginId).setInputs(this._state.plugins.inputs[pluginId]);
      this.getPlugin(pluginId).setOutputs(this._state.plugins.outputs[pluginId]);
    });
    this.emit(MetapageEvents.State, this._state);
  }

  getStateMetaframes() {
    return this._state.metaframes;
  }

  getDefinition() {
    return this._definition;
  }

  setDefinition(def, state) {
    const newDefinition = (0, _MetapageTools.convertToCurrentDefinition)(def);

    if (newDefinition.metaframes) {
      Object.keys(newDefinition.metaframes).forEach(metaframeId => {
        if (newDefinition.plugins && newDefinition.plugins.includes(metaframeId)) {
          this.emitErrorMessage(`Plugin with url=${metaframeId} matches metaframe. Metaframe ids and plugin urls are not allowed to collide`);
          throw `Plugin with url=${metaframeId} matches metaframe. Metaframe ids and plugin urls are not allowed to collide`;
        }

        var metaframeDefinition = newDefinition.metaframes[metaframeId];

        if (typeof metaframeDefinition !== "object") {
          this.emitErrorMessage(`Metaframe "${metaframeId}" is not an object`);
          throw `Metaframe "${metaframeId}" is not an object`;
        }

        if (!metaframeDefinition.url) {
          this.emitErrorMessage(`Metaframe "${metaframeId}" missing field: url`);
          throw `Metaframe "${metaframeId}" missing field: url`;
        }
      });
    }

    this._definition = newDefinition;
    Object.keys(this._metaframes).forEach(metaframeId => {
      if (!newDefinition.metaframes || !newDefinition.metaframes[metaframeId]) {
        this.removeMetaframe(metaframeId);
      }
    });
    Object.keys(this._plugins).forEach(url => {
      if (newDefinition.plugins && !newDefinition.plugins.includes(url)) {
        this.removePlugin(url);
      }
    });
    this._pluginOrder = newDefinition.plugins ? newDefinition.plugins : [];

    if (state) {
      this._state = state;
    }

    if (newDefinition.metaframes) {
      Object.keys(newDefinition.metaframes).forEach(newMetaframeId => {
        if (!this._metaframes.hasOwnProperty(newMetaframeId)) {
          const metaframeDefinition = newDefinition.metaframes[newMetaframeId];
          this.addMetaframe(newMetaframeId, metaframeDefinition);
        }
      });
    }

    if (newDefinition.plugins) {
      newDefinition.plugins.forEach(url => {
        if (!this._plugins.hasOwnProperty(url)) {
          this.addPlugin(url);
        }
      });
    }

    const event = {
      definition: this._definition,
      metaframes: this._metaframes,
      plugins: this._plugins
    };
    window.setTimeout(() => {
      this.emit(MetapageEvents.Definition, event);

      if (state) {
        this.emit(MetapageEvents.State, this._state);
      }
    }, 0);
    return this;
  }

  addPipe(target, input) {
    if (!this._inputMap[target]) {
      this._inputMap[target] = [];
    }

    this._inputMap[target].push(input);
  }

  removeMetaframe(metaframeId) {
    if (!this._metaframes[metaframeId]) {
      return;
    }

    this._metaframes[metaframeId].dispose();

    delete this._metaframes[metaframeId];
    delete this._state.metaframes.inputs[metaframeId];
    delete this._state.metaframes.outputs[metaframeId];
    delete this._inputMap[metaframeId];
    Object.keys(this._inputMap).forEach(otherMetaframeId => {
      const inputPipes = this._inputMap[otherMetaframeId];
      let index = 0;

      while (index <= inputPipes.length) {
        if (inputPipes[index].metaframe == metaframeId) {
          inputPipes.splice(index, 1);
        } else {
          index++;
        }
      }
    });
    this._cachedInputLookupMap = {};
  }

  removePlugin(url) {
    if (!this._plugins[url]) {
      return;
    }

    this._plugins[url].dispose();

    delete this._plugins[url];
    delete this._state.plugins.inputs[url];
    delete this._state.plugins.outputs[url];
  }

  removeAll() {
    Object.keys(this._metaframes).forEach(id => this._metaframes[id].dispose());
    Object.keys(this._plugins).forEach(id => this._plugins[id].dispose());
    this._metaframes = {};
    this._plugins = {};
    this._state = emptyState();
    this._inputMap = {};
    this._cachedInputLookupMap = {};
  }

  metaframes() {
    return this.getMetaframes();
  }

  metaframeIds() {
    return this.getMetaframeIds();
  }

  getMetaframeIds() {
    return Object.keys(this._metaframes);
  }

  getMetaframes() {
    return Object.assign({}, this._metaframes);
  }

  plugins() {
    return Object.assign({}, this._plugins);
  }

  pluginIds() {
    return this.getPluginIds();
  }

  getPluginIds() {
    return this._pluginOrder.slice(0);
  }

  getMetaframe(id) {
    return this._metaframes[id];
  }

  getPlugin(url) {
    return this._plugins[url];
  }

  addMetaframe(metaframeId, definition) {
    if (!metaframeId) {
      throw "addMetaframe missing metaframeId";
    }

    if (!definition) {
      throw "addMetaframe missing definition";
    }

    if (this._metaframes[metaframeId]) {
      this.emitErrorMessage(`Existing metaframe for id=${metaframeId}`);
      throw `Existing metaframe for id=${metaframeId}`;
    }

    if (!definition.url) {
      this.emitErrorMessage(`Metaframe definition missing url id=${metaframeId}`);
      throw `Metaframe definition missing url id=${metaframeId}`;
    }

    var iframeClient = new IFrameRpcClient(this, definition.url, metaframeId, this._id, this._consoleBackgroundColor, this.debug).setMetapage(this);
    this._metaframes[metaframeId] = iframeClient;

    if (definition.inputs) {
      definition.inputs.forEach(input => this.addPipe(metaframeId, input));
    }

    iframeClient.setInputs(this._state.metaframes.inputs[metaframeId]);
    return iframeClient;
  }

  addPlugin(url) {
    if (!url) {
      throw "Plugin missing url";
    }

    var iframeClient = new IFrameRpcClient(this, url, url, this._id, this._consoleBackgroundColor, this.debug).setInputs(this._state.plugins.inputs[url]).setMetapage(this).setPlugin();
    this._plugins[url] = iframeClient;
    return iframeClient;
  }

  dispose() {
    super.removeAllListeners();
    window.removeEventListener("message", this.onMessage);

    if (this._metaframes) {
      Object.keys(this._metaframes).forEach(metaframeId => this._metaframes[metaframeId].dispose());
    }

    if (this._plugins) {
      Object.keys(this._plugins).forEach(pluginId => this._plugins[pluginId].dispose());
    }

    this._id = undefined;
    this._metaframes = undefined;
    this._plugins = undefined;
    this._state = undefined;
    this._definition = undefined;
    this._cachedInputLookupMap = undefined;
    this._inputMap = undefined;
  }

  log(o, color, backgroundColor) {
    if (!this.debug) {
      return;
    }

    this.logInternal(o, color, backgroundColor);
  }

  error(err) {
    this.logInternal(err, "f00", this._consoleBackgroundColor);
    this.emitErrorMessage(`${err}`);
  }

  emitErrorMessage(err) {
    this.emit(MetapageEvents.Error, err);
  }

  getInputsFromOutput(source, outputPipeId) {
    if (!this._cachedInputLookupMap[source]) {
      this._cachedInputLookupMap[source] = {};
    }

    if (!this._cachedInputLookupMap[source][outputPipeId]) {
      var targets = [];
      this._cachedInputLookupMap[source][outputPipeId] = targets;
      Object.keys(this._inputMap).forEach(metaframeId => {
        if (metaframeId === source) {
          return;
        }

        this._inputMap[metaframeId].forEach(inputPipe => {
          if (inputPipe.metaframe == source) {
            if ((0, _minimatch.default)(outputPipeId, inputPipe.source)) {
              var targetName = inputPipe.target;

              if (!inputPipe.target || inputPipe.target.startsWith("*") || inputPipe.target === "") {
                targetName = outputPipeId;
              }

              targets.push({
                metaframe: metaframeId,
                pipe: targetName
              });
            }
          }
        });
      });
    }

    return this._cachedInputLookupMap[source][outputPipeId];
  }

  isValidJSONRpcMessage(message) {
    if (message.jsonrpc !== "2.0") {
      return false;
    }

    const method = message.method;

    switch (method) {
      case _JsonRpcMethods.JsonRpcMethodsFromChild.SetupIframeClientRequest:
        return true;

      default:
        var iframeId = message.iframeId;

        if (iframeId && !(message.parentId === this._id && (this._metaframes[iframeId] || this._plugins[iframeId]))) {
          return false;
        }

        return true;
    }
  }

  setInput(iframeId, inputPipeId, value) {
    this.setInputStateOnly(iframeId, inputPipeId, value);
    this.setMetaframeClientInputAndSentClientEvent(iframeId, inputPipeId, value);
    this.emit(MetapageEvents.State, this._state);
    this.emit(MetapageEvents.Inputs, this._state);
  }

  setMetaframeClientInputAndSentClientEvent(iframeId, inputPipeId, value) {
    if (typeof iframeId === "object") {
      if (inputPipeId || value) {
        throw "bad arguments, see API docs";
      }

      const inputs = iframeId;
      Object.keys(inputs).forEach(id => {
        var metaframeId = id;
        var metaframeInputs = inputs[metaframeId];

        if (typeof metaframeInputs !== "object") {
          throw "bad arguments, see API docs";
        }

        var iframeClient = this._metaframes[metaframeId];

        if (iframeClient) {
          iframeClient.setInputs(metaframeInputs);
        } else {
          this.error("No iframe id=$metaframeId");
        }
      });
    } else if (typeof iframeId === "string") {
      const iframeClient = this._metaframes[iframeId];

      if (iframeClient == null) {
        this.error(`No iframe id=${iframeId}`);
      }

      if (typeof inputPipeId === "string") {
        iframeClient.setInput(inputPipeId, value);
      } else if (typeof inputPipeId === "object") {
        iframeClient.setInputs(inputPipeId);
      } else {
        throw "bad arguments, see API docs";
      }
    } else {
      throw "bad arguments, see API docs";
    }
  }

  setInputs(iframeId, inputPipeId, value) {
    this.setInput(iframeId, inputPipeId, value);
  }

  setOutputStateOnly(iframeId, inputPipeId, value) {
    this._setStateOnly(false, iframeId, inputPipeId, value);
  }

  setInputStateOnly(iframeId, inputPipeId, value) {
    this._setStateOnly(true, iframeId, inputPipeId, value);
  }

  _setStateOnly(isInputs, iframeId, inputPipeId, value) {
    if (typeof iframeId === "object") {
      if (inputPipeId || value) {
        throw "If first argument is an object, subsequent args should be undefined";
      }

      const inputsMetaframesNew = iframeId;
      Object.keys(inputsMetaframesNew).forEach(metaframeId => {
        var metaframeValuesNew = inputsMetaframesNew[metaframeId];

        if (typeof metaframeValuesNew !== "object") {
          throw "Object values must be objects";
        }

        const isMetaframe = this._metaframes.hasOwnProperty(metaframeId);

        if (!isMetaframe && !this._plugins.hasOwnProperty(metaframeId)) {
          throw "No metaframe or plugin: ${metaframeId}";
        }

        const inputOrOutputState = isMetaframe ? isInputs ? this._state.metaframes.inputs : this._state.metaframes.outputs : isInputs ? this._state.plugins.inputs : this._state.plugins.outputs;
        inputOrOutputState[metaframeId] = inputOrOutputState[metaframeId] ? inputOrOutputState[metaframeId] : {};
        Object.keys(metaframeValuesNew).forEach(metaframePipedId => {
          if (metaframeValuesNew[metaframePipedId] === undefined) {
            delete inputOrOutputState[metaframeId][metaframePipedId];
          } else {
            inputOrOutputState[metaframeId][metaframePipedId] = metaframeValuesNew[metaframePipedId];
          }
        });
      });
    } else if (typeof iframeId === "string") {
      const metaframeId = iframeId;

      const isMetaframe = this._metaframes.hasOwnProperty(metaframeId);

      if (!isMetaframe && !this._plugins.hasOwnProperty(metaframeId)) {
        throw `No metaframe or plugin: ${metaframeId}`;
      }

      const inputOrOutputState = isMetaframe ? isInputs ? this._state.metaframes.inputs : this._state.metaframes.outputs : isInputs ? this._state.plugins.inputs : this._state.plugins.outputs;

      if (typeof inputPipeId === "string") {
        inputOrOutputState[metaframeId] = inputOrOutputState[metaframeId] ? inputOrOutputState[metaframeId] : {};
        const metaframePipeId = inputPipeId;

        if (value === undefined) {
          delete inputOrOutputState[metaframeId][metaframePipeId];
        } else {
          inputOrOutputState[metaframeId][metaframePipeId] = value;
        }
      } else if (typeof inputPipeId === "object") {
        inputOrOutputState[metaframeId] = inputOrOutputState[metaframeId] ? inputOrOutputState[metaframeId] : {};
        const metaframeValuesNew = inputPipeId;
        Object.keys(metaframeValuesNew).forEach(metaframePipedId => {
          if (metaframeValuesNew[metaframePipedId] === undefined) {
            delete inputOrOutputState[metaframeId][metaframePipedId];
          } else {
            inputOrOutputState[metaframeId][metaframePipedId] = metaframeValuesNew[metaframePipedId];
          }
        });
      } else {
        throw "Second argument must be a string or an object";
      }
    } else {
      throw "First argument must be a string or an object";
    }
  }

  getMetaframeOrPlugin(key) {
    var val = this._metaframes[key];

    if (!val) {
      val = this._plugins[key];
    }

    return val;
  }

  onMessage(e) {
    if (typeof e.data === "object") {
      const jsonrpc = e.data;

      if (!this.isValidJSONRpcMessage(jsonrpc)) {
        return;
      }

      var method = jsonrpc.method;

      switch (method) {
        case _JsonRpcMethods.JsonRpcMethodsFromChild.SetupIframeClientRequest:
          Object.keys(this._metaframes).forEach(metaframeId => {
            const iframeClient = this._metaframes[metaframeId];
            iframeClient.register();
          });
          Object.keys(this._plugins).forEach(url => {
            const iframeClient = this._plugins[url];
            iframeClient.register();
          });
          break;

        case _JsonRpcMethods.JsonRpcMethodsFromChild.SetupIframeServerResponseAck:
          if (jsonrpc.iframeId) {
            var params = jsonrpc.params;
            var metaframe = this.getMetaframeOrPlugin(jsonrpc.iframeId);
            metaframe.registered(params.version);
          }

          break;

        case _JsonRpcMethods.JsonRpcMethodsFromChild.OutputsUpdate:
          var metaframeId = jsonrpc.iframeId;

          if (!metaframeId) {
            break;
          }

          var outputs = jsonrpc.params;
          if (this.debug) this.log(`outputs from ${metaframeId}: ${JSON.stringify(outputs, null, '  ').substr(0, 100)}`);

          if (this._metaframes[metaframeId]) {
            var iframe = this._metaframes[metaframeId];
            this.setOutputStateOnly(metaframeId, outputs);
            iframe.setOutputs(outputs);
            this.emit(MetapageEvents.State, this._state);
            var modified = false;
            Object.keys(outputs).forEach(outputKey => {
              const targets = this.getInputsFromOutput(metaframeId, outputKey);

              if (targets.length > 0) {
                targets.forEach(target => {
                  var inputBlob = {};
                  inputBlob[target.pipe] = outputs[outputKey];
                  this.setInputStateOnly(target.metaframe, target.pipe, outputs[outputKey]);

                  this._metaframes[target.metaframe].setInputs(inputBlob);

                  modified = true;
                });
              }
            });

            if (modified) {
              this.emit(MetapageEvents.State, this._state);
            }

            if (this.debug) {
              iframe.ack({
                jsonrpc: jsonrpc,
                state: this._state
              });
            }
          } else if (this._plugins[metaframeId]) {
            const outputPersistanceAllowed = !outputs[_Constants.METAPAGE_KEY_STATE] && !outputs[_Constants.METAPAGE_KEY_DEFINITION];

            if (outputPersistanceAllowed) {
              this.setOutputStateOnly(metaframeId, outputs);
            }

            this._plugins[metaframeId].setOutputs(outputs);

            if (outputPersistanceAllowed) {
              this.emit(MetapageEvents.State, this._state);
            }

            if (this.debug) {
              this._plugins[metaframeId].ack({
                jsonrpc: jsonrpc,
                state: this._state
              });
            }
          } else {
            this.error(`missing metaframe/plugin=$metaframeId`);
          }

          break;

        case _JsonRpcMethods.JsonRpcMethodsFromChild.InputsUpdate:
          var metaframeId = jsonrpc.iframeId;

          if (!metaframeId) {
            break;
          }

          var inputs = jsonrpc.params;
          if (this.debug) this.log(`inputs ${JSON.stringify(inputs)} from ${metaframeId}`);

          if (this._metaframes[metaframeId]) {
            this.setInputStateOnly(metaframeId, inputs);

            switch (this._metaframes[metaframeId].version) {
              case _MetaLibsVersion.Versions.V0_0_1:
              case _MetaLibsVersion.Versions.V0_1_0:
                this._metaframes[metaframeId].emit(MetapageEvents.Inputs, inputs);

                if (this.listenerCount(MetapageEvents.Inputs) > 0) {
                  var metaframeInputs = {};
                  metaframeInputs[metaframeId] = inputs;
                  this.emit(MetapageEvents.Inputs, metaframeInputs);
                }

                break;

              default:
                this._metaframes[metaframeId].setInputs(inputs);

                break;
            }

            this.emit(MetapageEvents.State, this._state);

            if (this.debug) {
              this._metaframes[metaframeId].ack({
                jsonrpc: jsonrpc,
                state: this._state
              });
            }
          } else if (this._plugins[metaframeId]) {
            const inputPersistanceAllowed = !inputs[_Constants.METAPAGE_KEY_STATE] && !inputs[_Constants.METAPAGE_KEY_DEFINITION];

            if (inputPersistanceAllowed) {
              this.setInputStateOnly(metaframeId, inputs);
            }

            this._plugins[metaframeId].setInputs(inputs);

            if (inputPersistanceAllowed) {
              this.emit(MetapageEvents.State, this._state);
            }

            if (this.debug) {
              this._plugins[metaframeId].ack({
                jsonrpc: jsonrpc,
                state: this._state
              });
            }
          } else {
            console.error(`InputsUpdate failed no metaframe or plugin id: "${metaframeId}"`);
            this.error(`InputsUpdate failed no metaframe or plugin id: "${metaframeId}"`);
          }

          break;

        case _JsonRpcMethods.JsonRpcMethodsFromChild.PluginRequest:
          var pluginId = jsonrpc.iframeId;

          if (!pluginId) {
            break;
          }

          if (this._plugins[pluginId] && this._plugins[pluginId].hasPermissionsState()) {
            this._plugins[pluginId].setInput(_Constants.METAPAGE_KEY_STATE, this._state);

            if (this.debug) {
              this._plugins[pluginId].ack({
                jsonrpc: jsonrpc,
                state: this._state
              });
            }
          }

          break;

        default:
          if (this.debug) {
            this.log(`Unknown RPC method: "${method}"`);
          }

      }

      this.emit(_JsonRpcMethods.OtherEvents.Message, jsonrpc);
    }
  }

  logInternal(o, color, backgroundColor) {
    backgroundColor = backgroundColor ? backgroundColor : this._consoleBackgroundColor;
    let s;

    if (typeof o === "string") {
      s = o;
    } else if (typeof o === "number") {
      s = o + "";
    } else {
      s = JSON.stringify(o);
    }

    s = this._id ? `Metapage[${this._id}] ${s}` : s;
    (0, _MetapageTools.log)(s, color, backgroundColor);
  }

}

exports.Metapage = Metapage;
Metapage.version = _Constants.VERSION;
Metapage.DEFINITION = MetapageEvents.Definition;
Metapage.INPUTS = MetapageEvents.Inputs;
Metapage.OUTPUTS = MetapageEvents.Outputs;
Metapage.STATE = MetapageEvents.State;
Metapage.ERROR = MetapageEvents.Error;

class IFrameRpcClient extends _eventemitter.EventEmitter {
  constructor(metapage, url, iframeId, parentId, consoleBackgroundColor, debug = false) {
    super();
    this.inputs = {};
    this.outputs = {};
    this._disposables = [];
    this._rpcListeners = [];
    this._loaded = false;
    this._onLoaded = [];
    this._sendInputsAfterRegistration = false;
    this._plugin = false;
    this._cachedEventInputsUpdate = {
      iframeId: undefined,
      inputs: undefined
    };
    this._cachedEventOutputsUpdate = {
      iframeId: null,
      inputs: null
    };

    if (!url.startsWith("http")) {
      while (url.startsWith("/")) {
        url = url.substr(1);
      }

      url = window.location.protocol + "//" + window.location.hostname + (window.location.port && window.location.port != "" ? ":" + window.location.port : "") + "/" + url;
    }

    this.url = url;
    this._metapage = metapage;
    var urlBlob = new URL(this.url);

    if (debug) {
      urlBlob.searchParams.set(_Constants.URL_PARAM_DEBUG, "1");
    }

    this.url = urlBlob.href;
    this.id = iframeId;
    this.iframe = document.createElement("iframe");
    this.iframe.src = this.url;
    this._debug = debug || (0, _MetapageTools.existsAnyUrlParam)(["DEBUG_METAFRAMES", "debug_metaframes", "debug_" + this.id, "DEBUG_" + this.id]);
    this.iframe.frameBorder = "0";
    this._parentId = parentId;
    this._color = (0, _MetapageTools.stringToRgb)(this.id);
    this._consoleBackgroundColor = consoleBackgroundColor;
    this._ready = new Promise((resolve, _) => {
      this.iframe.addEventListener('load', _ => {
        resolve();
      });
    });
    this.ack = this.ack.bind(this);
    this.bindPlugin = this.bindPlugin.bind(this);
    this.dispose = this.dispose.bind(this);
    this.getDefinition = this.getDefinition.bind(this);
    this.getDefinitionUrl = this.getDefinitionUrl.bind(this);
    this.setPlugin = this.setPlugin.bind(this);
    this.hasPermissionsDefinition = this.hasPermissionsDefinition.bind(this);
    this.hasPermissionsState = this.hasPermissionsState.bind(this);
    this.log = this.log.bind(this);
    this.logInternal = this.logInternal.bind(this);
    this.onInput = this.onInput.bind(this);
    this.onInputs = this.onInputs.bind(this);
    this.onOutput = this.onOutput.bind(this);
    this.onOutputs = this.onOutputs.bind(this);
    this.register = this.register.bind(this);
    this.registered = this.registered.bind(this);
    this.sendInputs = this.sendInputs.bind(this);
    this.sendOrBufferPostMessage = this.sendOrBufferPostMessage.bind(this);
    this.sendRpc = this.sendRpc.bind(this);
    this.sendRpcInternal = this.sendRpcInternal.bind(this);
    this.setInput = this.setInput.bind(this);
    this.setInputs = this.setInputs.bind(this);
    this.setMetapage = this.setMetapage.bind(this);
    this.setOutput = this.setOutput.bind(this);
    this.setOutputs = this.setOutputs.bind(this);
    this.setPlugin = this.setPlugin.bind(this);
    this.addListenerReturnDisposer = this.addListenerReturnDisposer.bind(this);
  }

  addListenerReturnDisposer(event, listener) {
    super.addListener(event, listener);

    const disposer = () => {
      super.removeListener(event, listener);
    };

    return disposer;
  }

  setPlugin() {
    if (this._loaded) {
      throw "Cannot setPlugin after IFrameRpcClient already loaded";
    }

    this._plugin = true;
    this.bindPlugin();
    return this;
  }

  setMetapage(metapage) {
    this._metapage = metapage;
    return this;
  }

  bindPlugin() {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const metaframeDef = yield this.getDefinition();

        if (this.hasPermissionsDefinition()) {
          var disposer = this._metapage.addListenerReturnDisposer(MetapageEvents.Definition, definition => {
            this.setInput(_Constants.METAPAGE_KEY_DEFINITION, definition.definition);
          });

          this._disposables.push(disposer);

          var currentMetapageDef = this._metapage.getDefinition();

          this.setInput(_Constants.METAPAGE_KEY_DEFINITION, currentMetapageDef);

          if (metaframeDef.outputs) {
            var disposer = this.onOutput(_Constants.METAPAGE_KEY_DEFINITION, definition => {
              this._metapage.setDefinition(definition);
            });

            this._disposables.push(disposer);
          }
        }

        if (this.hasPermissionsState()) {
          if (metaframeDef.outputs) {
            var disposer = this.onOutput(_Constants.METAPAGE_KEY_STATE, state => {
              this._metapage.setState(state);
            });

            this._disposables.push(disposer);
          }
        }
      } catch (err) {
        console.error(err);

        this._metapage.emit(MetapageEvents.Error, `Failed to get plugin definition from "${this.getDefinitionUrl()}", error=${err}`);
      }
    });
  }

  hasPermissionsState() {
    return this._definition !== undefined && this._definition.inputs !== undefined && this._definition.inputs[_Constants.METAPAGE_KEY_STATE] !== undefined;
  }

  hasPermissionsDefinition() {
    return this._definition !== undefined && this._definition.inputs !== undefined && this._definition.inputs[_Constants.METAPAGE_KEY_DEFINITION] !== undefined;
  }

  getDefinitionUrl() {
    var url = new URL(this.url);
    url.pathname = url.pathname + (url.pathname.endsWith("/") ? "metaframe.json" : "/metaframe.json");
    return url.href;
  }

  getDefinition() {
    return __awaiter(this, void 0, void 0, function* () {
      if (this._definition) {
        return this._definition;
      }

      var url = this.getDefinitionUrl();
      const response = yield window.fetch(url);
      const metaframeDef = yield response.json();
      this._definition = metaframeDef;
      return metaframeDef;
    });
  }

  setInput(name, inputBlob) {
    console.assert(!!name);
    var inputs = {};
    inputs[name] = inputBlob;
    this.setInputs(inputs);
  }

  setInputs(maybeNewInputs) {
    if (!(0, _MetapageTools.merge)(this.inputs, maybeNewInputs)) {
      return this;
    }

    if (!this._loaded) {
      this._sendInputsAfterRegistration = true;
    }

    if (this.iframe.parentNode && this._loaded) {
      this.sendInputs(maybeNewInputs);
    }

    this.emit(MetapageEvents.Inputs, this.inputs);

    if (this._metapage.listenerCount(MetapageEvents.Inputs) > 0) {
      var inputUpdate = {};
      inputUpdate[this.id] = maybeNewInputs;

      this._metapage.emit(MetapageEvents.Inputs, inputUpdate);
    }

    this._cachedEventInputsUpdate.iframeId = this.id;
    this._cachedEventInputsUpdate.inputs = this.inputs;

    this._metapage.emit(_JsonRpcMethods.JsonRpcMethodsFromParent.InputsUpdate, this._cachedEventInputsUpdate);

    return this;
  }

  setOutput(pipeId, updateBlob) {
    console.assert(!!pipeId);
    var outputs = {};
    outputs[pipeId] = updateBlob;
    this.setOutputs(outputs);
  }

  setOutputs(maybeNewOutputs) {
    if (!(0, _MetapageTools.merge)(this.outputs, maybeNewOutputs)) {
      return;
    }

    this.emit(MetapageEvents.Outputs, maybeNewOutputs);

    if (this._metapage.listenerCount(MetapageEvents.Outputs) > 0) {
      var outputsUpdate = {};
      outputsUpdate[this.id] = this.outputs;

      this._metapage.emit(MetapageEvents.Outputs, outputsUpdate);
    }
  }

  onInputs(f) {
    return this.addListenerReturnDisposer(MetapageEvents.Inputs, f);
  }

  onInput(pipeName, f) {
    var fWrap = function (inputs) {
      if (inputs.hasOwnProperty(pipeName)) {
        f(inputs[pipeName]);
      }
    };

    return this.addListenerReturnDisposer(MetapageEvents.Inputs, fWrap);
  }

  onOutputs(f) {
    return this.addListenerReturnDisposer(MetapageEvents.Outputs, f);
  }

  onOutput(pipeName, f) {
    var fWrap = function (outputs) {
      if (outputs.hasOwnProperty(pipeName)) {
        f(outputs[pipeName]);
      }
    };

    return this.addListenerReturnDisposer(MetapageEvents.Outputs, fWrap);
  }

  dispose() {
    super.removeAllListeners();

    while (this._disposables && this._disposables.length > 0) {
      const val = this._disposables.pop();

      if (val) {
        val();
      }
    }

    this._rpcListeners = undefined;
    this.inputs = undefined;
    this.outputs = undefined;
    this._ready = undefined;

    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }

    this.iframe = undefined;
    this._bufferMessages = undefined;

    if (this._bufferTimeout) {
      window.clearInterval(this._bufferTimeout);
      this._bufferTimeout = undefined;
    }

    this._metapage = undefined;
  }

  register() {
    if (this._loaded) {
      return;
    }

    var response = {
      iframeId: this.id,
      parentId: this._parentId,
      plugin: this._plugin,
      state: {
        inputs: this.inputs
      },
      version: Metapage.version
    };
    this.sendRpcInternal(_JsonRpcMethods.JsonRpcMethodsFromParent.SetupIframeServerResponse, response);
  }

  registered(version) {
    if (this._loaded) {
      return;
    }

    this.version = version;

    if (this.version == null) {
      this.version = _MetaLibsVersion.Versions.V0_1_0;
    }

    this._loaded = true;

    while (this._onLoaded && this._onLoaded.length > 0) {
      this._onLoaded.pop()();
    }

    if (this._sendInputsAfterRegistration) {
      this.sendInputs(this.inputs);
    }
  }

  sendInputs(inputs) {
    this.sendRpc(_JsonRpcMethods.JsonRpcMethodsFromParent.InputsUpdate, {
      inputs: inputs,
      parentId: this._parentId
    });
  }

  sendRpc(method, params) {
    if (this.iframe.parentNode && this._loaded) {
      this.sendRpcInternal(method, params);
    } else {
      this._metapage.error("sending rpc later");

      const thing = this;

      this._onLoaded.push(() => {
        thing.sendRpcInternal(method, params);
      });
    }
  }

  ack(message) {
    this.log("⚒ ⚒ ⚒ calling ack");

    if (this._debug) {
      this.log("⚒ ⚒ ⚒ sending ack from client to frame");
      var payload = {
        message: message
      };
      this.sendRpc(_JsonRpcMethods.JsonRpcMethodsFromParent.MessageAck, payload);
    } else {
      this.log("⚒ ⚒ ⚒ NOT sending ack from client to frame since not debug mode");
    }
  }

  log(o) {
    if (!this._debug) {
      return;
    }

    this.logInternal(o);
  }

  logInternal(o) {
    let s;

    if (typeof o === "string") {
      s = o;
    } else if (typeof o === "string") {
      s = o + "";
    } else {
      s = JSON.stringify(o);
    }

    (0, _MetapageTools.log)(`Metapage[${this._parentId}] Metaframe[$id] ${s}`, this._color, this._consoleBackgroundColor);
  }

  sendRpcInternal(method, params) {
    const messageJSON = {
      id: "_",
      iframeId: this.id,
      jsonrpc: "2.0",
      method: method,
      params: params,
      parentId: this._parentId
    };

    if (this.iframe) {
      this.sendOrBufferPostMessage(messageJSON);
    } else {
      this._metapage.error("Cannot send to child iframe messageJSON=${JSON.stringify(messageJSON).substr(0, 200)}");
    }
  }

  sendOrBufferPostMessage(message) {
    if (this.iframe && this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(message, this.url);
    } else {
      if (!this._bufferMessages) {
        this._bufferMessages = [message];
        const thing = this;
        this._bufferTimeout = window.setInterval(function () {
          if (thing.iframe && thing.iframe.contentWindow) {
            thing._bufferMessages.forEach(m => thing.iframe.contentWindow.postMessage(m, thing.url));

            window.clearInterval(thing._bufferTimeout);
            thing._bufferTimeout = undefined;
            thing._bufferMessages = undefined;
          }
        }, 0);
      } else {
        this._bufferMessages.push(message);
      }
    }
  }

}
},{"eventemitter3":"UASB","minimatch":"YPEX","./Constants":"Xnuv","./MetaLibsVersion":"cY5T","./v0_3/JsonRpcMethods":"wret","./MetapageTools":"f0H1"}]},{},["Vntl"], "metapage")
//# sourceMappingURL=/index.js.map