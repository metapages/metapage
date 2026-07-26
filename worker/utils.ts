import { createDefine } from "fresh";

// Shared "ctx.state" type passed among middlewares, layouts and routes.
// Nothing is shared yet, but `define` still has to be typed against a state
// shape, so keep the interface as the single place to grow it.
// deno-lint-ignore no-empty-interface
export interface State {}

export const define = createDefine<State>();
