package js.metapage.v1;

/**
 * Subtyped by others. How data is exchanged.
 */
typedef DataBlob = {
	var value :Dynamic;
	@:optional var type :String;//Used for data typing, arbitrary string, e.g. string/dna, application/json
	@:optional var source :DataSource; //Default: SourceInline
	@:optional var encoding :DataEncoding; //Default: DataEncoding.utf8
}
