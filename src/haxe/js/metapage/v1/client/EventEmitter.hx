package js.metapage.v1.client;

typedef Function=Dynamic;

class EventEmitter
{
	var _events :DynamicAccess<Function> = {};

	public function new() {}

	public function on(event :String, listener :Function) :Void->Void
	{
		return addEventListener(event, listener);
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
			arr.remove(listener);
		}
	}

	public function emit(event :String, ?val1 :Dynamic, ?val2 :Dynamic, ?val3 :Dynamic, ?val4 :Dynamic) :Void
	{
		var args :Array<Dynamic> = untyped __js__('[].slice.call(arguments, 1)');

		if (_events.exists(event)) {
			var listeners :Array<Function> = _events.get(event).slice();
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