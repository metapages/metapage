package js.metapage.client;

typedef Function=any;

class EventEmitter
{
	var _events :JSMap<String, Array<Function>> = {};

	public function new() {}

	public function on(event :String, listener :Function) :Void->Void
	{
		return addEventListener(event, listener);
	}

	public function isListeners(event :String) :Bool
	{
		return _events.exists(event) ? _events.get(event).length > 0 : false;
	}

	public function addEventListener(event :String, listener :Function) :Void->Void
	{
		if (!_events.exists(event)) {
			_events.set(event, []);
		}
		_events.get(event).push(listener);
		return removeEventListener.bind(event, listener);
	}

	public function once(event :String, listener :Function) :Void->Void
	{
		var g;
		g = function() {
			var args = untyped __js__('arguments');
			removeEventListener(event, g);
			untyped __js__('{0}.apply(null, {1})', listener, args);
		}
		return addEventListener(event, g);
	}

	public function removeEventListener(event :String, listener :Function) :Void
	{
		if (untyped __js__('{0} in {1}', event, _events)) {
			var arr :Array<Function> = _events.get(event);
			if(arr.remove(listener)) {
			}
		}
	}

	public function emit(event :String, ?val1 :any, ?val2 :any, ?val3 :any, ?val4 :any) :Void
	{
		var args :Array<any> = untyped __js__('[].slice.call(arguments, 1)');

		if (_events.exists(event)) {
			var listeners :Array<Function> = _events.get(event).slice(0);
			for (listener in listeners) {
				untyped __js__('{0}.apply(null, {1})', listener, args);
			}
		}
	}

	public function dispose()
	{
		_events = {};
	}
}
