package js.metapage.v1;

/**
 * Subtyped by others. How data is exchanged.
 */
typedef DataBlob = {
	var value :Dynamic;
	@:optional var encoding :DataEncoding; //Default: DataEncoding.utf8
	@:optional var hash :String; //Format: "sha256:xzy..." or "md5:xzy..."
	@:optional var source :DataSource; //Default: SourceInline
	@:optional var type :String;//Used for data typing, arbitrary string, e.g. string/dna, application/json
	@:optional var v :Int; //Version, internal use only, for quicker and more reliable updating
}
