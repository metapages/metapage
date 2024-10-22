
import { type Handlers } from "$fresh/server.ts";
import type { VersionProps } from "../../../types.ts";

export const handler: Handlers<VersionProps> = {
	async GET(_req, ctx) {

		return new Response(JSON.stringify(MetaframeDefinition), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	},
};

const MetaframeDefinition =
{
	"version": "0.5",
	"inputs": {
		"metapage/definition": {
			"type": "metapage/definition"
		},
		"metapage/state": {
			"type": "metapage/state"
		},
		"input": {}
	},
	"outputs": {
		"metapage/definition": {
			"type": "metapage/definition"
		},
		"metapage/state": {
			"type": "metapage/state"
		},
		"output": {}
	}
}
