package js.npm.compareversions;

@:jsRequire("compare-versions")
extern class CompareVersions
{
    @:selfCall
    public static function compareVersions(v1:String, v2:String) :Int;
}