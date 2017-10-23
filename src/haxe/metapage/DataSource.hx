package metapage;

@:enum
abstract DataSource(String) {
	var SourceUrl = 'url';
	var SourceInline = 'inline';//Default
}