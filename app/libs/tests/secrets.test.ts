/// <reference types="@vitest/browser/providers/playwright" />

import { describe, expect, it, beforeEach } from "vitest";
import { getMetapageDefinitionFromUrl } from "../src/metapage/util";
import {
  Metapage,
  MetapageDefinitionV2,
  InjectSecretsPayload,
  MetapageEventDefinition,
} from "../src";
import { getHashParamValue, getHashParamValueBase64DecodedFromUrl, setHashParamValueBase64EncodedInUrl } from "@metapages/hash-query";

describe("Metapage secrets injection", async () => {
  let metapage: Metapage;
  // the metaframe name is "secret1test"
  const testDefinition: MetapageDefinitionV2 = await getMetapageDefinitionFromUrl("https://metapage.io/m/6e3f0110d6054b778c3c089965b4e04b");

  beforeEach(async () => {
    metapage = new Metapage();
    await metapage.setDefinition(testDefinition);
  });

  const secret1 = "injected secret";
  const secret2 = "another secret";

  it("should inject secrets into metaframe URLs", async () => {
    const secrets: InjectSecretsPayload = {
      frameSecrets: {
        secret1test: {
          hashParams: {
            secret1,
          },
        },
      },
    };

    metapage.injectSecrets(secrets);

    // The metaframe should have the secret in its URL
    const metaframe = metapage.getMetaframe("secret1test");
    expect(metaframe).toBeDefined();
    if (metaframe) {
      // The secret should be in the hash
      expect(getHashParamValueBase64DecodedFromUrl(metaframe.url, "secret1")).toBe(secret1);
    }
  });

  it("should remove secrets from getDefinition()", async () => {
    const secrets: InjectSecretsPayload = {
      frameSecrets: {
        secret1test: {
          hashParams: {
            secret1,
            secret2,
          },
        },
      },
    };

    metapage.injectSecrets(secrets);

    // Get the definition - it should NOT contain secrets
    const definition = metapage.getDefinition();

    // Verify secrets are not in the definition URL
    const defUrl = definition.metaframes.secret1test.url;
    expect(getHashParamValueBase64DecodedFromUrl(defUrl, "secret1")).toBeUndefined();
    expect(getHashParamValueBase64DecodedFromUrl(defUrl, "secret2")).toBeUndefined();
  });

  it("should remove secrets from definition events", async () => {
    const secrets: InjectSecretsPayload = {
      frameSecrets: {
        secret1test: {
          hashParams: {
            secret1,
          },
        },
      },
    };

    let emittedDefinition: MetapageDefinitionV2 | null = null;

    // Listen for definition events
    metapage.addListener(Metapage.DEFINITION, (event: MetapageEventDefinition) => {
      emittedDefinition = event.definition;
    });

    metapage.injectSecrets(secrets);

    // Trigger a definition event by updating metadata
    metapage.setMetadata({ name: "Test" });

    // The emitted definition should NOT contain secrets
    expect(emittedDefinition).toBeDefined();
    if (emittedDefinition) {
      // Verify secret is not in the emitted definition
      const defUrl = (emittedDefinition as MetapageDefinitionV2).metaframes.secret1test.url;
      expect(getHashParamValueBase64DecodedFromUrl(defUrl, "secret1")).toBeUndefined();
    }
  });

  it("should preserve original URLs when there are existing hash params", async () => {
    const definitionWithHash: MetapageDefinitionV2 = {
      version: "2",
      metaframes: {
        secret1test: {
          url: "https://metapage.io/metaframes/passthrough-markdown/#existingParam=value",
        },
      },
    };

    const mp = new Metapage();
    await mp.setDefinition(definitionWithHash);

    const secrets: InjectSecretsPayload = {
      frameSecrets: {
        secret1test: {
          hashParams: {
            secret1,
          },
        },
      },
    };

    mp.injectSecrets(secrets);

    // The definition should return the original URL
    const definition = mp.getDefinition();
    expect(definition.metaframes.secret1test.url).toBe(
      "https://metapage.io/metaframes/passthrough-markdown/#existingParam=value"
    );

    mp.dispose();
  });

  it("should handle multiple secret injections", async () => {
    const secrets1: InjectSecretsPayload = {
      frameSecrets: {
        secret1test: {
          hashParams: {
            secret1: "first secret",
          },
        },
      },
    };

    const secrets2: InjectSecretsPayload = {
      frameSecrets: {
        secret1test: {
          hashParams: {
            secret2: "second secret",
          },
        },
      },
    };

    metapage.injectSecrets(secrets1);
    metapage.injectSecrets(secrets2);

    // The metaframe should have both secrets
    const metaframe = metapage.getMetaframe("secret1test");
    expect(metaframe).toBeDefined();
    if (metaframe) {
      expect(getHashParamValueBase64DecodedFromUrl(metaframe.url, "secret1")).toBe("first secret");
      expect(getHashParamValueBase64DecodedFromUrl(metaframe.url, "secret2")).toBe("second secret");
    }

    // The definition should not contain any secrets
    const definition = metapage.getDefinition();
    const defUrl = definition.metaframes.secret1test.url;
    expect(getHashParamValueBase64DecodedFromUrl(defUrl, "secret1")).toBeUndefined();
    expect(getHashParamValueBase64DecodedFromUrl(defUrl, "secret2")).toBeUndefined();
  });

  it("should handle injecting secrets for non-existent metaframe gracefully", async () => {
    const secrets: InjectSecretsPayload = {
      frameSecrets: {
        nonexistent: {
          hashParams: {
            secret1: "should not crash",
          },
        },
      },
    };

    // Should not throw
    expect(() => metapage.injectSecrets(secrets)).not.toThrow();
  });

  it("should handle empty secrets payload", async () => {
    const originalUrl = testDefinition.metaframes.secret1test.url;
    const secrets: InjectSecretsPayload = {
      frameSecrets: {},
    };

    expect(() => metapage.injectSecrets(secrets)).not.toThrow();

    const definition = metapage.getDefinition();
    expect(definition.metaframes.secret1test.url).toBe(originalUrl);
  });

  it("should inject secrets into multiple metaframes", async () => {
    // Use a custom definition with two metaframes
    const twoFrameDefinition: MetapageDefinitionV2 = {
      version: "2",
      metaframes: {
        frame1: {
          url: "https://metapage.io/metaframes/passthrough-markdown/",
        },
        frame2: {
          url: "https://example.com/frame",
        },
      },
    };

    const mp = new Metapage();
    await mp.setDefinition(twoFrameDefinition);

    const firstSecret = "first frame secret";
    const secondSecret = "other frame secret";
    const secrets: InjectSecretsPayload = {
      frameSecrets: {
        frame1: {
          hashParams: {
            secret1: firstSecret,
          },
        },
        frame2: {
          hashParams: {
            apiKey: secondSecret,
          },
        },
      },
    };

    mp.injectSecrets(secrets);

    // Check both metaframes have secrets in their URLs
    const metaframe1 = mp.getMetaframe("frame1");
    const metaframe2 = mp.getMetaframe("frame2");

    expect(metaframe1).toBeDefined();
    expect(metaframe2).toBeDefined();

    if (metaframe1) {
      expect(getHashParamValueBase64DecodedFromUrl(metaframe1.url, "secret1")).toBe(firstSecret);
    }

    if (metaframe2) {
      expect(getHashParamValueBase64DecodedFromUrl(metaframe2.url, "apiKey")).toBe(secondSecret);
    }

    // The definitions should not contain secrets
    const definition = mp.getDefinition();
    expect(getHashParamValueBase64DecodedFromUrl(definition.metaframes.frame1.url, "secret1")).toBeUndefined();
    expect(getHashParamValueBase64DecodedFromUrl(definition.metaframes.frame2.url, "apiKey")).toBeUndefined();

    mp.dispose();
  });
});

describe("Metapage secrets injection - integration test", () => {

  const secret1 = "injected secret";
  const secret2 = "another secret";

  it("should work with the example metapage from requirements", async () => {
    // This is the metapage from the requirements:
    // https://metapage.io/m/6e3f0110d6054b778c3c089965b4e04b
    const exampleDefinition: MetapageDefinitionV2 = {
      version: "2",
      metaframes: {
        secret1test: {
          url: "https://metapage.io/metaframes/passthrough-markdown/",
        },
      },
    };

    const metapage = new Metapage();
    await metapage.setDefinition(exampleDefinition);

    // Inject the secret
    const secrets: InjectSecretsPayload = {
      frameSecrets: {
        secret1test: {
          hashParams: {
            secret1: "injected secret",
          },
        },
      },
    };

    metapage.injectSecrets(secrets);

    // The metaframe URL should now contain the secret
    const metaframe = metapage.getMetaframe("secret1test");
    expect(metaframe).toBeDefined();
    if (metaframe) {
      const url = new URL(metaframe.url);
      expect(url.hash).toContain("secret1");

      // Verify the secret is base64 encoded
      const decodedSecret = getHashParamValueBase64DecodedFromUrl(url, "secret1");
      expect(decodedSecret).toBe("injected secret");
    }

    // The definition should NOT contain the secret
    const definition = metapage.getDefinition();
    expect(definition.metaframes.secret1test.url).toBe(
      "https://metapage.io/metaframes/passthrough-markdown/"
    );

    metapage.dispose();
  });

  it("should preserve secrets when setDefinition is called with updated definition", async () => {
    const initialDefinition: MetapageDefinitionV2 = {
      version: "2",
      metaframes: {
        secret1test: {
          url: "https://metapage.io/metaframes/passthrough-markdown/",
        },
      },
    };

    const metapage = new Metapage();
    await metapage.setDefinition(initialDefinition);

    // Inject a secret
    const secrets: InjectSecretsPayload = {
      frameSecrets: {
        secret1test: {
          hashParams: {
            secret1,
          },
        },
      },
    };

    metapage.injectSecrets(secrets);

    // Verify secret is injected
    let metaframe = metapage.getMetaframe("secret1test");
    expect(metaframe).toBeDefined();
    if (metaframe) {
      expect(getHashParamValueBase64DecodedFromUrl(metaframe.url, "secret1")).toBe(secret1);
    }

    // Now update the definition with a new (non-base64) hash param
    const updatedDefinition: MetapageDefinitionV2 = {
      version: "2",
      metaframes: {
        secret1test: {
          url: "https://metapage.io/metaframes/passthrough-markdown/#?newParam=value",
        },
      },
    };

    await metapage.setDefinition(updatedDefinition);

    // The secret should still be present in the metaframe URL
    metaframe = metapage.getMetaframe("secret1test");
    expect(metaframe).toBeDefined();
    if (metaframe) {
      expect(getHashParamValueBase64DecodedFromUrl(metaframe.url, "secret1")).toBe(secret1);
      // And the new param should also be there (plain value, not base64)
      expect(getHashParamValue(metaframe.url, "newParam")).toBe("value");
    }

    // But getDefinition should return URL with newParam but without the secret
    const definition = metapage.getDefinition();
    expect(getHashParamValue(definition.metaframes.secret1test.url, "newParam")).toBe("value");
    expect(getHashParamValueBase64DecodedFromUrl(definition.metaframes.secret1test.url, "secret1")).toBeUndefined();

    metapage.dispose();
  });

  it("should handle metaframe hash param updates while preserving secrets", async () => {
    const initialDefinition: MetapageDefinitionV2 = {
      version: "2",
      metaframes: {
        secret1test: {
          url: "https://metapage.io/metaframes/passthrough-markdown/",
        },
      },
    };

    const metapage = new Metapage();
    await metapage.setDefinition(initialDefinition);

    // Inject a secret
    const secrets: InjectSecretsPayload = {
      frameSecrets: {
        secret1test: {
          hashParams: {
            secret1,
          },
        },
      },
    };

    metapage.injectSecrets(secrets);

    // Simulate a metaframe updating its own hash params
    // This simulates what happens when a metaframe calls setHashParams internally
    const metaframe = metapage.getMetaframe("secret1test");
    expect(metaframe).toBeDefined();

    if (metaframe) {
      // Simulate the metaframe sending a HashParamsUpdate message
      // by directly calling the handler (simulating what would come from postMessage)
      metapage.onMessageJsonRpc({
        iframeId: "secret1test",
        parentId: metapage._id,
        jsonrpc: "2.0",
        method: "HashParamsUpdate" as any,
        id: "test",
        params: {
          metaframe: "secret1test",
          hash: "?userParam=userValue",
        },
      });

      // The metaframe URL should have both the user's param AND the secret
      expect(getHashParamValue(metaframe.url, "userParam")).toBe("userValue");
      expect(getHashParamValueBase64DecodedFromUrl(metaframe.url, "secret1")).toBe(secret1);

      // But the definition should have the user's param but NOT the secret
      const definition = metapage.getDefinition();
      expect(getHashParamValue(definition.metaframes.secret1test.url, "userParam")).toBe("userValue");
      expect(getHashParamValueBase64DecodedFromUrl(definition.metaframes.secret1test.url, "secret1")).toBeUndefined();
    }

    metapage.dispose();
  });

  it("should restore original hash param value when secret is removed", async () => {
    // "original" base64-encoded is "b3JpZ2luYWw="
    const originalParam = "b3JpZ2luYWw=";
    const initialDefinition: MetapageDefinitionV2 = {
      version: "2",
      metaframes: {
        secret1test: {
          url: `https://metapage.io/metaframes/passthrough-markdown/#?existingParam=${originalParam}`,
        },
      },
    };

    const metapage = new Metapage();
    await metapage.setDefinition(initialDefinition);

    // Inject a secret with the same key as an existing param
    const secrets: InjectSecretsPayload = {
      frameSecrets: {
        secret1test: {
          hashParams: {
            existingParam: "replaced secret",
          },
        },
      },
    };

    metapage.injectSecrets(secrets);

    // The metaframe URL should have the secret
    let metaframe = metapage.getMetaframe("secret1test");
    expect(metaframe).toBeDefined();
    if (metaframe) {
      expect(getHashParamValueBase64DecodedFromUrl(metaframe.url, "existingParam")).toBe("replaced secret");
    }

    // But getDefinition should return the original value (raw, not decoded)
    const definition = metapage.getDefinition();
    expect(getHashParamValue(definition.metaframes.secret1test.url, "existingParam")).toBe(originalParam);

    metapage.dispose();
  });
});

describe("Metapage query params secrets injection", async () => {
  let metapage: Metapage;
  const testDefinition: MetapageDefinitionV2 = await getMetapageDefinitionFromUrl("https://metapage.io/m/6e3f0110d6054b778c3c089965b4e04b");

  beforeEach(async () => {
    metapage = new Metapage();
    await metapage.setDefinition(testDefinition);
  });

  it("should inject queryParams secrets into metaframe URLs", async () => {
    const secrets: InjectSecretsPayload = {
      frameSecrets: {
        secret1test: {
          queryParams: {
            apiKey: "my-api-key-123",
            token: "secret-token",
          },
        },
      },
    };

    metapage.injectSecrets(secrets);

    // The metaframe URL should contain the secrets in query params
    const metaframe = metapage.getMetaframe("secret1test");
    expect(metaframe).toBeDefined();
    if (metaframe) {
      const url = new URL(metaframe.url);

      // Verify secrets are in query params (base64 encoded)
      const apiKey = url.searchParams.get("apiKey");
      const token = url.searchParams.get("token");

      expect(apiKey).toBeDefined();
      expect(token).toBeDefined();

      if (apiKey) {
        const decoded = decodeURIComponent(atob(apiKey));
        expect(decoded).toBe("my-api-key-123");
      }

      if (token) {
        const decoded = decodeURIComponent(atob(token));
        expect(decoded).toBe("secret-token");
      }
    }
  });

  it("should remove queryParams secrets from getDefinition()", async () => {
    const originalUrl = testDefinition.metaframes.secret1test.url;

    const secrets: InjectSecretsPayload = {
      frameSecrets: {
        secret1test: {
          queryParams: {
            apiKey: "my-api-key",
          },
        },
      },
    };

    metapage.injectSecrets(secrets);

    // The definition should NOT contain the secret
    const definition = metapage.getDefinition();
    const defUrl = new URL(definition.metaframes.secret1test.url);

    expect(defUrl.searchParams.get("apiKey")).toBeNull();
  });

  it("should handle both hashParams and queryParams together", async () => {
    const secrets: InjectSecretsPayload = {
      frameSecrets: {
        secret1test: {
          hashParams: {
            secret1: "hash secret",
          },
          queryParams: {
            apiKey: "query secret",
          },
        },
      },
    };

    metapage.injectSecrets(secrets);

    // The metaframe URL should contain both
    const metaframe = metapage.getMetaframe("secret1test");
    expect(metaframe).toBeDefined();
    if (metaframe) {
      const url = new URL(metaframe.url);

      // Check hash param
      expect(getHashParamValueBase64DecodedFromUrl(url, "secret1")).toBe("hash secret");

      // Check query param
      const apiKey = url.searchParams.get("apiKey");
      expect(apiKey).toBeDefined();
      if (apiKey) {
        const decoded = decodeURIComponent(atob(apiKey));
        expect(decoded).toBe("query secret");
      }
    }

    // The definition should not contain either secret
    const definition = metapage.getDefinition();
    const defUrl = new URL(definition.metaframes.secret1test.url);

    expect(getHashParamValueBase64DecodedFromUrl(definition.metaframes.secret1test.url, "secret1")).toBeUndefined();
    expect(defUrl.searchParams.get("apiKey")).toBeNull();
  });

  it("should preserve queryParams secrets across setDefinition", async () => {
    const initialDefinition: MetapageDefinitionV2 = {
      version: "2",
      metaframes: {
        secret1test: {
          url: "https://metapage.io/metaframes/passthrough-markdown/",
        },
      },
    };

    const mp = new Metapage();
    await mp.setDefinition(initialDefinition);

    const secrets: InjectSecretsPayload = {
      frameSecrets: {
        secret1test: {
          queryParams: {
            apiKey: "my-secret-key",
          },
        },
      },
    };

    mp.injectSecrets(secrets);

    // Verify secret is present
    let metaframe = mp.getMetaframe("secret1test");
    expect(metaframe).toBeDefined();
    if (metaframe) {
      const url = new URL(metaframe.url);
      const apiKey = url.searchParams.get("apiKey");
      expect(apiKey).toBeDefined();
    }

    // Update the definition
    const updatedDefinition: MetapageDefinitionV2 = {
      version: "2",
      metaframes: {
        secret1test: {
          url: "https://metapage.io/metaframes/passthrough-markdown/?newParam=value",
        },
      },
    };

    await mp.setDefinition(updatedDefinition);

    // The secret should still be present
    metaframe = mp.getMetaframe("secret1test");
    expect(metaframe).toBeDefined();
    if (metaframe) {
      const url = new URL(metaframe.url);
      const apiKey = url.searchParams.get("apiKey");
      expect(apiKey).toBeDefined();
      if (apiKey) {
        const decoded = decodeURIComponent(atob(apiKey));
        expect(decoded).toBe("my-secret-key");
      }
      // And the new param should also be there
      expect(url.searchParams.get("newParam")).toBe("value");
    }

    // But getDefinition should return URL with newParam but without the secret
    const definition = mp.getDefinition();
    const defUrl = new URL(definition.metaframes.secret1test.url);
    expect(defUrl.searchParams.get("newParam")).toBe("value");
    expect(defUrl.searchParams.get("apiKey")).toBeNull();

    mp.dispose();
  });

  it("should restore original queryParam value when secret replaces existing param", async () => {
    const initialDefinition: MetapageDefinitionV2 = {
      version: "2",
      metaframes: {
        secret1test: {
          url: "https://metapage.io/metaframes/passthrough-markdown/?apiKey=original-value",
        },
      },
    };

    const mp = new Metapage();
    await mp.setDefinition(initialDefinition);

    const secrets: InjectSecretsPayload = {
      frameSecrets: {
        secret1test: {
          queryParams: {
            apiKey: "secret-value",
          },
        },
      },
    };

    mp.injectSecrets(secrets);

    // The metaframe URL should have the secret
    let metaframe = mp.getMetaframe("secret1test");
    expect(metaframe).toBeDefined();
    if (metaframe) {
      const url = new URL(metaframe.url);
      const apiKey = url.searchParams.get("apiKey");
      expect(apiKey).toBeDefined();
      if (apiKey) {
        const decoded = decodeURIComponent(atob(apiKey));
        expect(decoded).toBe("secret-value");
      }
    }

    // But getDefinition should return the original value (as plain text, not base64)
    const definition = mp.getDefinition();
    const defUrl = new URL(definition.metaframes.secret1test.url);
    const apiKey = defUrl.searchParams.get("apiKey");
    expect(apiKey).toBe("original-value");

    mp.dispose();
  });
});
