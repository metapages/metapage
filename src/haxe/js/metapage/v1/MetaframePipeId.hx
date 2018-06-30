package js.metapage.v1;

abstract MetaframePipeId(String) to String
{
	inline public function new(s :String)
	{
		this = s;
	}
}
