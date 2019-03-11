package js.metapage.v0_0_1;

@:enum
abstract DataSource(String) to String {
	var SourceUrl = 'url';
	var SourceInline = 'inline';//Default
}
