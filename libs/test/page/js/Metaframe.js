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
})({"Metaframe.ts":[function(require,module,exports) {
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { return function () { var Super = _getPrototypeOf(Derived), result; if (_isNativeReflectConstruct()) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

System.register(["./EventEmitter", "../Constants", "@definitions/JsonRpcMethods", "./MetapageTools"], function (exports_1, context_1) {
  "use strict";

  var EventEmitter_1, Constants_1, JsonRpcMethods_1, MetapageTools_1, MetaframeEvents, Metaframe, MetaframePlugin;

  var __moduleName = context_1 && context_1.id;

  return {
    setters: [function (EventEmitter_1_1) {
      EventEmitter_1 = EventEmitter_1_1;
    }, function (Constants_1_1) {
      Constants_1 = Constants_1_1;
    }, function (JsonRpcMethods_1_1) {
      JsonRpcMethods_1 = JsonRpcMethods_1_1;
    }, function (MetapageTools_1_1) {
      MetapageTools_1 = MetapageTools_1_1;
    }],
    execute: function execute() {
      (function (MetaframeEvents) {
        MetaframeEvents["Input"] = "input";
        MetaframeEvents["Inputs"] = "inputs";
        MetaframeEvents["Message"] = "message";
      })(MetaframeEvents || (MetaframeEvents = {}));

      Metaframe = /*#__PURE__*/function (_EventEmitter_1$Event) {
        _inherits(Metaframe, _EventEmitter_1$Event);

        var _super = _createSuper(Metaframe);

        function Metaframe() {
          var _this;

          _classCallCheck(this, Metaframe);

          _this = _super.call(this);
          _this._inputPipeValues = {};
          _this._outputPipeValues = {};
          _this.debug = false;
          _this.debug = MetapageTools_1.getUrlParamDEBUG();
          _this._isIframe = Metaframe.isIframe();

          if (!_this._isIframe) {
            _this.ready = new Promise(function (resolve, _) {
              resolve(false);
            });

            _this.log("Not an iframe, metaframe code disabled");

            return _possibleConstructorReturn(_this);
          }

          _this.onWindowMessage = _this.onWindowMessage.bind(_assertThisInitialized(_this));
          window.addEventListener("message", _this.onWindowMessage);
          _this.ready = new Promise(function (resolve, _) {
            this.once(JsonRpcMethods_1.JsonRpcMethodsFromParent.SetupIframeServerResponse, function (params) {
              var _this2 = this;

              if (this._iframeId == null) {
                this._iframeId = params.iframeId;
                this.id = params.iframeId;
                this._parentVersion = params.version;
                this.color = MetapageTools_1.stringToRgb(this._iframeId);
                this._parentId = params.parentId;
                this.log("metapage[".concat(this._parentId, "](v").concat(this._parentVersion ? this._parentVersion : "unknown", ") registered"));
                this._inputPipeValues = params.state != null && params.state.inputs != null ? params.state.inputs : this._inputPipeValues;
                this.sendRpc(JsonRpcMethods_1.JsonRpcMethodsFromChild.SetupIframeServerResponseAck, {
                  version: this.version
                });

                if (this._inputPipeValues && this._inputPipeValues.keys().length > 0) {
                  this.emit(MetaframeEvents.Inputs, this._inputPipeValues);
                  Object.keys(this._inputPipeValues).forEach(function (pipeId) {
                    return _this2.emit(MetaframeEvents.Input, pipeId, _this2._inputPipeValues[pipeId]);
                  });
                }

                if (params.plugin) {
                  this.plugin = new MetaframePlugin(this);
                }

                resolve(true);
              } else {
                this.log("Got JsonRpcMethods.SetupIframeServerResponse but already resolved");
              }
            });
            this.sendRpc(JsonRpcMethods_1.JsonRpcMethodsFromChild.SetupIframeClientRequest, {
              version: this.version
            });
          });
          return _this;
        }

        _createClass(Metaframe, [{
          key: "log",
          value: function log(o, color, backgroundColor) {
            if (!this.debug) {
              return;
            }

            this.logInternal(o, color != null ? color : this.color);
          }
        }, {
          key: "warn",
          value: function warn(o) {
            if (!this.debug) {
              return;
            }

            this.logInternal(o, "000", this.color);
          }
        }, {
          key: "error",
          value: function error(err) {
            this.logInternal(err, this.color, "f00");
          }
        }, {
          key: "logInternal",
          value: function logInternal(o, color, backgroundColor) {
            var s;

            if (typeof o === "string") {
              s = o;
            } else if (typeof o === "number") {
              s = o + "";
            } else {
              s = JSON.stringify(o);
            }

            color = color != null ? color + "" : color;
            s = (this._iframeId != null ? "Metaframe[$_iframeId] " : "") + "".concat(s);
            MetapageTools_1.log(s, color, backgroundColor);
          }
        }, {
          key: "dispose",
          value: function dispose() {
            _get(_getPrototypeOf(Metaframe.prototype), "dispose", this).call(this);

            window.removeEventListener("message", this.onWindowMessage);
            this._inputPipeValues = null;
            this._outputPipeValues = null;
          }
        }, {
          key: "addEventListener",
          value: function addEventListener(event, listener) {
            var _this3 = this;

            var disposer = _get(_getPrototypeOf(Metaframe.prototype), "addEventListener", this).call(this, event, listener);

            if (event === MetaframeEvents.Inputs) {
              window.setTimeout(function () {
                if (_this3._inputPipeValues != null) {
                  listener(_this3._inputPipeValues);
                }
              }, 0);
            }

            return disposer;
          }
        }, {
          key: "onInput",
          value: function onInput(pipeId, listener) {
            return this.addEventListener(MetaframeEvents.Input, function (pipe, value) {
              if (pipeId === pipe) {
                listener(value);
              }
            });
          }
        }, {
          key: "onInputs",
          value: function onInputs(listener) {
            return this.addEventListener(MetaframeEvents.Inputs, listener);
          }
        }, {
          key: "setInput",
          value: function setInput(pipeId, blob) {
            var inputs = {};
            inputs[pipeId] = blob;
            this.setInputs(inputs);
          }
        }, {
          key: "setInputs",
          value: function setInputs(inputs) {
            this.sendRpc(JsonRpcMethods_1.JsonRpcMethodsFromChild.InputsUpdate, inputs);
          }
        }, {
          key: "setInternalInputsAndNotify",
          value: function setInternalInputsAndNotify(inputs) {
            var _this4 = this;

            if (!this._inputPipeValues.merge(inputs)) {
              return;
            }

            Object.keys(inputs).forEach(function (pipeId) {
              return _this4.emit(MetaframeEvents.Input, pipeId, inputs[pipeId]);
            });
            this.emit(MetaframeEvents.Inputs, inputs);
          }
        }, {
          key: "getInput",
          value: function getInput(pipeId) {
            console.assert(pipeId != null);
            return this._inputPipeValues.get(pipeId);
          }
        }, {
          key: "getInputs",
          value: function getInputs() {
            return this._inputPipeValues;
          }
        }, {
          key: "getOutput",
          value: function getOutput(pipeId) {
            console.assert(pipeId != null);
            return this._outputPipeValues.get(pipeId);
          }
        }, {
          key: "setOutput",
          value: function setOutput(pipeId, updateBlob) {
            console.assert(pipeId != null);
            console.assert(updateBlob != null);
            var outputs = {};
            outputs[pipeId] = updateBlob;
            this.setOutputs(outputs);
          }
        }, {
          key: "setOutputs",
          value: function setOutputs(outputs) {
            if (!this._outputPipeValues.merge(outputs)) {
              return;
            }

            this.sendRpc(JsonRpcMethods_1.JsonRpcMethodsFromChild.OutputsUpdate, outputs);
          }
        }, {
          key: "getOutputs",
          value: function getOutputs() {
            return this._outputPipeValues;
          }
        }, {
          key: "sendRpc",
          value: function sendRpc(method, params) {
            if (this._isIframe) {
              var message = {
                jsonrpc: "2.0",
                id: null,
                method: method,
                params: params,
                iframeId: this._iframeId,
                parentId: this._parentId
              };
              this.log(message);
              window.parent.postMessage(message, "*");
            } else {
              this.error("Cannot send JSON-RPC window message: there is no window.parent which means we are not an iframe");
            }
          }
        }, {
          key: "onWindowMessage",
          value: function onWindowMessage(e) {
            if (this.debug) {
              this.log("onWindowMessage: ${Json.stringify(e)}");
            }

            if (_typeof(e.data) === "object") {
              var jsonrpc = e.data;

              if (jsonrpc.jsonrpc === "2.0") {
                var method = jsonrpc.method;

                if (!(method == JsonRpcMethods_1.JsonRpcMethodsFromParent.SetupIframeServerResponse || jsonrpc.parentId == this._parentId && jsonrpc.iframeId == this._iframeId)) {
                  this.error("window.message: received message but jsonrpc.parentId=".concat(jsonrpc.parentId, " _parentId=").concat(this._parentId, " jsonrpc.iframeId=").concat(jsonrpc.iframeId, " _iframeId=").concat(this._iframeId));
                  return;
                }

                switch (method) {
                  case JsonRpcMethods_1.JsonRpcMethodsFromParent.SetupIframeServerResponse:
                    break;

                  case JsonRpcMethods_1.JsonRpcMethodsFromParent.InputsUpdate:
                    this.setInternalInputsAndNotify(jsonrpc.params.inputs);
                    break;

                  case JsonRpcMethods_1.JsonRpcMethodsFromParent.MessageAck:
                    if (this.debug) this.log("ACK: ${Json.stringify(jsonrpc)}");
                    break;

                  default:
                    if (this.debug) this.log("window.message: unknown JSON-RPC method: ${Json.stringify(jsonrpc)}");
                    break;
                }

                this.emit(jsonrpc.method, jsonrpc.params);
                this.emit(MetaframeEvents.Message, jsonrpc);
              } else {
                if (this.debug) this.log("window.message: not JSON-RPC: ${Json.stringify(jsonrpc)}");
              }
            } else {
              if (this.debug) this.log("window.message: not an object, ignored: ${Json.stringify(e)}");
            }
          }
        }], [{
          key: "isIframe",
          value: function isIframe() {
            try {
              return window !== window.top;
            } catch (ignored) {
              return false;
            }
          }
        }]);

        return Metaframe;
      }(EventEmitter_1.EventEmitter);

      exports_1("Metaframe", Metaframe);
      Metaframe.version = Constants_1.VERSION;
      Metaframe.INPUT = MetaframeEvents.Input;
      Metaframe.INPUTS = MetaframeEvents.Inputs;
      Metaframe.MESSAGE = MetaframeEvents.Message;

      MetaframePlugin = /*#__PURE__*/function () {
        function MetaframePlugin(metaframe) {
          _classCallCheck(this, MetaframePlugin);

          this._metaframe = metaframe;
        }

        _createClass(MetaframePlugin, [{
          key: "requestState",
          value: function requestState() {
            var payload = {
              method: JsonRpcMethods_1.ApiPayloadPluginRequestMethod.State
            };

            this._metaframe.sendRpc(JsonRpcMethods_1.JsonRpcMethodsFromChild.PluginRequest, payload);
          }
        }, {
          key: "onState",
          value: function onState(listener) {
            var disposer = this._metaframe.onInput(Constants_1.METAPAGE_KEY_STATE, listener);

            if (this.getState() != null) {
              listener(this.getState());
            }

            return disposer;
          }
        }, {
          key: "getState",
          value: function getState() {
            return this._metaframe.getInput(Constants_1.METAPAGE_KEY_STATE);
          }
        }, {
          key: "setState",
          value: function setState(state) {
            this._metaframe.setOutput(Constants_1.METAPAGE_KEY_STATE, state);
          }
        }, {
          key: "onDefinition",
          value: function onDefinition(listener) {
            var disposer = this._metaframe.onInput(Constants_1.METAPAGE_KEY_DEFINITION, listener);

            if (this.getDefinition() != null) {
              listener(this.getDefinition());
            }

            return disposer;
          }
        }, {
          key: "setDefinition",
          value: function setDefinition(definition) {
            this._metaframe.setOutput(Constants_1.METAPAGE_KEY_DEFINITION, definition);
          }
        }, {
          key: "getDefinition",
          value: function getDefinition() {
            return this._metaframe.getInput(Constants_1.METAPAGE_KEY_DEFINITION);
          }
        }]);

        return MetaframePlugin;
      }();

      exports_1("MetaframePlugin", MetaframePlugin);
    }
  };
});
},{}],"../../../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "61742" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../../../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","Metaframe.ts"], null)
//# sourceMappingURL=/Metaframe.js.map