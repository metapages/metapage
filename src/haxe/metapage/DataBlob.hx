package metapage;

/**
 * Subtyped by others. How data is exchanged.
 */
typedef DataBlob = {
	var value :Dynamic;
	@:optional var type :String;//Used for data typing
	@:optional var source :DataSource; //Default: SourceInline
	@:optional var encoding :DataEncoding; //Default: DataEncoding.utf8
}