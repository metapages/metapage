package js.metapage.v1;

@:enum
abstract DataSource(String) to String {
	var SourceUrl = 'url';
	var SourceInline = 'inline';//Default
}
