// Deprecated alias for /convert, kept because it is publicly reachable and
// definitions in the wild may still point at it. Under Fresh 1 this was a
// `conversion -> convert` symlink that the deploy staging step dereferenced;
// Fresh 2 builds from the source tree, so the alias is re-exported instead.
// The pages link relatively, so visitors stay under whichever prefix they
// arrived on.
export { default } from "../convert/index.tsx";
