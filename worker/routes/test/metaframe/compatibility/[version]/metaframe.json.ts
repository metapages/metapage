import { define } from "../../../../../utils.ts";

export const handler = define.handlers({
  GET() {
    return new Response(JSON.stringify(MetaframeDefinition), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});

const MetaframeDefinition = {
  "version": "0.5",
  "inputs": {
    "metapage/definition": {
      "type": "metapage/definition",
    },
    "metapage/state": {
      "type": "metapage/state",
    },
    "input": {},
  },
  "outputs": {
    "metapage/definition": {
      "type": "metapage/definition",
    },
    "metapage/state": {
      "type": "metapage/state",
    },
    "output": {},
  },
};
