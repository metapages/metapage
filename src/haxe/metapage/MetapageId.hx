package metapage;

abstract MetapageId(String) to String
{
  inline public function new(s:String)
  {
    this = s;
  }
}