package js.metapage;

@:forward
abstract MetaframeId(String) to String from String
{
	inline public function new(s :String)
	{
		this = s;
	}
}
