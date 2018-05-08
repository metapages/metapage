package js.metapage.v1;

@:enum
abstract DataSource(String) {
	var SourceUrl = 'url';
	var SourceInline = 'inline';//Default
}
