package js.metapage.v1;

@:forward
abstract MetaframeId(String) to String
{
	inline public function new(s :String)
	{
		this = s;
	}
}