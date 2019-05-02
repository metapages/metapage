package js.metapage;

abstract MetaframePipeId(String) to String from String
{
	inline public function new(s :String)
	{
		this = s;
	}
}
