class Log
{

	
	inline static var FORMAT_DEBUG = 'color:#D1D1E0;';
	inline static var FORMAT_INFO = 'color:#0f0;';
	inline static var FORMAT_WARN = 'color:#800080;';
	inline static var FORMAT_ERROR = 'color:#f00;';

	public static function debug(s1 :Dynamic, ?extra :Array<Dynamic>, ?infos :haxe.PosInfos)
	{
		var message = '%c${infos.className}.${infos.methodName}:${infos.lineNumber}|' + haxe.Json.stringify(s1);
		log(message, FORMAT_DEBUG);
	}

	public static function info(s1 :Dynamic, ?extra :Array<Dynamic>, ?infos :haxe.PosInfos)
	{
		var message = '%c${infos.className}.${infos.methodName}:${infos.lineNumber}|' + haxe.Json.stringify(s1);
		log(message, FORMAT_INFO);
	}

	public static function warn(s1 :Dynamic, ?extra :Array<Dynamic>, ?infos :haxe.PosInfos)
	{
		var message = '%c${infos.className}.${infos.methodName}:${infos.lineNumber}|' + haxe.Json.stringify(s1);
		log(message, FORMAT_WARN);
	}

	public static function error(s1 :Dynamic, ?extra :Array<Dynamic>, ?infos :haxe.PosInfos)
	{
		var message = '%c${infos.className}.${infos.methodName}:${infos.lineNumber}|' + haxe.Json.stringify(s1);
		log(message, FORMAT_ERROR);
	}

	static function log(message :Dynamic, format :String)
	{
#if nodejs
		trace(message.substr(2));
#else
		js.Browser.console.log(message, format);
#end
	}
}