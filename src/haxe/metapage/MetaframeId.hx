package metapage;

abstract MetaframeId(String) to String
{
	inline public function new(s :String)
	{
		this = s;
	}
}