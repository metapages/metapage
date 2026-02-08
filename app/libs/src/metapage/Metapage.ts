import { ListenerFn } from "eventemitter3";
import { create } from "mutative";
import picomatch from "picomatch/posix";
import {
  setHashParamValueBase64EncodedInUrl,
  getHashParamValueBase64DecodedFromUrl,
} from "@metapages/hash-query";

import { VERSION_METAPAGE } from "./Constants";
import {
  convertMetapageDefinitionToCurrentVersion,
  getMatchingMetapageVersion,
} from "./conversions-metapage";
import { Disposer, MetaframeId, MetaframePipeId, MetapageId } from "./core";
import { deserializeInputs, serializeInputs } from "./data";
import {
  MetapageEventDefinition,
  MetapageEvents,
  MetapageEventUrlHashUpdate,
} from "./events";
import {
  JsonRpcMethodsFromChild,
  MinimumClientMessage,
  SetupIframeClientAckData,
} from "./jsonrpc";
import { MetapageIFrameRpcClient } from "./MetapageIFrameRpcClient";
import {
  generateMetapageId,
  isDebugFromUrlsParams,
  log as MetapageToolsLog,
  pageLoaded,
} from "./MetapageTools";
import { INITIAL_NULL_METAPAGE_DEFINITION, MetapageShared } from "./Shared";
import {
  MetaframeInputMap,
  MetaframeInstance,
  MetapageInstanceInputs,
  PipeInput,
  PipeUpdateBlob,
} from "./v0_4";
import { MetapageOptionsV1 } from "./v1";
import { MetapageDefinitionV2, MetapageMetadataV2 } from "./v2";
import { VersionsMetapage } from "./versions";

interface MetapageStatePartial {
  inputs: MetapageInstanceInputs;
  outputs: MetapageInstanceInputs;
}

export interface MetapageState {
  metaframes: MetapageStatePartial;
}

export type InjectSecretsPayload = {
  frameSecrets: {
    [metaframeName: string]: {
      hashParams?: {
        [name: string]: string;
      };
      queryParams?: {
        [name: string]: string;
      };
    };
  };
};

const emptyState: MetapageState = create<MetapageState>(
  {
    metaframes: {
      inputs: {},
      outputs: {},
    },
  },
  (draft) => draft,
);

export const getLibraryVersionMatching = (
  version: string,
): VersionsMetapage => {
  return getMatchingMetapageVersion(version);
};

export const matchPipe = (outputName: string, source?: string): boolean => {
  // console.log(`❓❓ matchPipe: metapage.getState().metaframes=${outputName} source=${source} `);

  if (!source || source === "**") {
    // && (!target || target === "*")
    // console.log(`❓matchPipe 1: ✅`);
    return true;
  }

  if (outputName === source) {
    // console.log(`❓matchPipe 1.1: ✅`);
    return true;
  }

  if (picomatch.isMatch(outputName, source)) {
    // console.log(`❓matchPipe 2: ✅`);
    return true;
  }

  // if (!target || target === "*" || target.endsWith("/")) {
  //   console.log(`❓matchPipe 3: ✅`);
  //   return true;
  // }

  // if (picomatch.isMatch(outputName, target)) {
  //   console.log(`❓matchPipe 4: ✅`);
  //   return true;
  // }

  // console.log(`❓matchPipe 5: ❌`);
  return false;
};

type MetaframeInputTargetsFromOutput = {
  metaframe: MetaframeId;
  pipe: MetaframePipeId;
};

type CachedInputLookupMap = {
  [key: string]: {
    [key: MetaframeId]: MetaframeInputTargetsFromOutput[]; // <metaframeId, MetaframeInputTargetsFromOutput[]>
  };
};

type MetaframeClients = {
  [key: MetaframeId]: MetapageIFrameRpcClient;
};

const CONSOLE_BACKGROUND_COLOR_DEFAULT = "bcbcbc";

export class Metapage extends MetapageShared {
  // The current version is always the latest
  public static readonly version = VERSION_METAPAGE;

  // Event literals for users to listen to events
  public static readonly DEFINITION = MetapageEvents.Definition;
  public static readonly ERROR = MetapageEvents.Error;
  public static readonly INPUTS = MetapageEvents.Inputs;
  public static readonly MESSAGE = MetapageEvents.Message;
  public static readonly OUTPUTS = MetapageEvents.Outputs;
  public static readonly STATE = MetapageEvents.State;

  public static deserializeInputs = deserializeInputs;
  public static serializeInputs = serializeInputs;

  public static async from(metaPageDef: any, inputs?: any): Promise<Metapage> {
    if (metaPageDef == null) {
      throw "Metapage definition cannot be null";
    }
    if (typeof metaPageDef === "string") {
      try {
        metaPageDef = JSON.parse(metaPageDef);
      } catch (err) {
        throw "Cannot parse into JSON:\n${metaPageDef}";
      }
    }

    var metapage = new Metapage();
    return metapage.setDefinition(metaPageDef);
  }

  _id: MetapageId;
  _state: MetapageState = emptyState;
  _metaframes: MetaframeClients = create({}, (draft) => draft); //<MetaframeId, MetapageIFrameRpcClient>

  debug: boolean = isDebugFromUrlsParams();
  _consoleBackgroundColor: string;

  // Store the original hash param values (before secret injection) for each secret key
  // undefined means the key didn't exist originally
  _originalSecretHashParams: {
    [metaframeId: string]: { [secretKey: string]: string | undefined };
  } = {};
  // Store the original query param values (before secret injection) for each secret key
  // undefined means the key didn't exist originally
  _originalSecretQueryParams: {
    [metaframeId: string]: { [secretKey: string]: string | undefined };
  } = {};
  // Store injected hash param secrets
  _injectedSecrets: {
    [metaframeId: string]: { [key: string]: string };
  } = {};
  // Store injected query param secrets
  _injectedQuerySecrets: {
    [metaframeId: string]: { [key: string]: string };
  } = {};

  // Useful for debugging duplicate messages
  _internalReceivedMessageCounter: number = 0;

  // for caching input lookups
  _cachedInputLookupMap: CachedInputLookupMap = create<CachedInputLookupMap>(
    {},
    (draft) => draft,
  );
  _inputMap: {
    [key: string]: PipeInput[];
  } = {};
  // Example:
  // 	{
  //     "version": "1",
  //     "metaframes": {
  //       "metaframe1": {
  //         "url": "{{site.baseurl}}/metaframes/example00_iframe1/",
  //         "inputs": [
  //           {
  //             "metaframe":"metaframe2",
  //             "source": "barOut",
  //             "target": "barIn",
  //           }
  //         ]
  //       },
  //       "metaframe2": {
  //         "url": "{{site.baseurl}}/metaframes/example00_iframe2/",
  //         "inputs": [
  //           {
  //             "metaframe":"metaframe1",
  //             "source": "fooOut",
  //             "target": "fooIn",
  //           }
  //         ]
  //       }
  //     }
  // }

  constructor(opts?: MetapageOptionsV1) {
    super();
    this._id = opts && opts.id ? opts.id : generateMetapageId();
    this._consoleBackgroundColor =
      opts && opts.color ? opts.color : CONSOLE_BACKGROUND_COLOR_DEFAULT;

    this.addPipe = this.addPipe.bind(this);
    this.dispose = this.dispose.bind(this);
    // this.getDefinition = this.getDefinition.bind(this);
    this.addMetaframe = this.addMetaframe.bind(this);
    this.getInputsFromOutput = this.getInputsFromOutput.bind(this);
    this.getMetaframe = this.getMetaframe.bind(this);
    this.getMetaframeIds = this.getMetaframeIds.bind(this);
    this.getMetaframe = this.getMetaframe.bind(this);
    this.getMetaframes = this.getMetaframes.bind(this);
    this.getState = this.getState.bind(this);
    this.getStateMetaframes = this.getStateMetaframes.bind(this);
    this.isValidJSONRpcMessage = this.isValidJSONRpcMessage.bind(this);
    this.log = this.log.bind(this);
    this.logInternal = this.logInternal.bind(this);
    this.metaframeIds = this.metaframeIds.bind(this);
    this.metaframes = this.metaframes.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.onMessageJsonRpc = this.onMessageJsonRpc.bind(this);
    this.removeAll = this.removeAll.bind(this);
    this.removeMetaframe = this.removeMetaframe.bind(this);
    this.setDebugFromUrlParams = this.setDebugFromUrlParams.bind(this);
    this.setDefinition = this.setDefinition.bind(this);
    this.setInput = this.setInput.bind(this);
    this.setInputs = this.setInputs.bind(this);
    this.setOutputs = this.setOutputs.bind(this);
    this.onInputs = this.onInputs.bind(this);
    this.onOutputs = this.onOutputs.bind(this);
    this.onState = this.onState.bind(this);
    this.setMetaframeOutputs = this.setMetaframeOutputs.bind(this);
    this.setInputStateOnlyMetaframeInputValue =
      this.setInputStateOnlyMetaframeInputValue.bind(this);
    this.setInputStateOnlyMetaframeInputMap =
      this.setInputStateOnlyMetaframeInputMap.bind(this);
    this.setInputStateOnlyMetapageInstanceInputs =
      this.setInputStateOnlyMetapageInstanceInputs.bind(this);
    this.setOutputStateOnlyMetaframeInputValue =
      this.setOutputStateOnlyMetaframeInputValue.bind(this);
    this.setOutputStateOnlyMetaframeInputMap =
      this.setOutputStateOnlyMetaframeInputMap.bind(this);
    this.setOutputStateOnlyMetapageInstanceInputs =
      this.setOutputStateOnlyMetapageInstanceInputs.bind(this);
    this.setMetadata = this.setMetadata.bind(this);
    this.setMetaframeClientInputAndSentClientEvent =
      this.setMetaframeClientInputAndSentClientEvent.bind(this);
    this.setState = this.setState.bind(this);
    this.isDisposed = this.isDisposed.bind(this);
    this._emitDefinitionEvent = this._emitDefinitionEvent.bind(this);

    // see ARCHITECTURE.md
    // when the page is loaded, only then start listening to messages from metaframes
    pageLoaded().then(() => {
      if (this.isDisposed()) {
        return;
      }
      window.addEventListener("message", this.onMessage);
      this.log("Initialized");
    });
  }

  public isDisposed() {
    return this._metaframes === undefined;
  }

  addListenerReturnDisposer(
    event: MetapageEvents,
    listener: ListenerFn<any[]>,
  ): Disposer {
    super.addListener(event, listener);
    const disposer = () => {
      super.removeListener(event, listener);
    };
    return disposer;
  }

  onInputs(cb: (inputs: MetapageInstanceInputs) => void): Disposer {
    return this.addListenerReturnDisposer(MetapageEvents.Inputs, cb);
  }

  onOutputs(cb: (outputs: MetapageInstanceInputs) => void): Disposer {
    return this.addListenerReturnDisposer(MetapageEvents.Outputs, cb);
  }

  onState(cb: (state: MetapageState) => void): Disposer {
    return this.addListenerReturnDisposer(MetapageEvents.State, cb);
  }

  public setDebugFromUrlParams(): Metapage {
    const url = new URL(window.location.href);
    this.debug = ["debug", "mp_debug"].reduce((exists, flag) => {
      return (
        exists ||
        url.searchParams.get(flag) === "true" ||
        url.searchParams.get(flag) === "1"
      );
    }, false);
    return this;
  }

  public getState(): MetapageState {
    return this._state;
  }

  public setState(newState: MetapageState) {
    this._state = create<MetapageState>(newState, (draft) => draft);
    this.getMetaframeIds().forEach((metaframeId) => {
      this.getMetaframe(metaframeId)?.setInputs(
        this._state.metaframes.inputs[metaframeId],
      );
      this.getMetaframe(metaframeId)?.setOutputs(
        this._state.metaframes.outputs[metaframeId],
      );
    });

    if (
      this.listenerCount(MetapageEvents.State) > 0 &&
      emptyState !== this._state
    ) {
      this.emit(MetapageEvents.State, this._state);
    }
  }

  public getStateMetaframes(): MetapageStatePartial {
    return this._state.metaframes;
  }

  public getDefinition(): MetapageDefinitionV2 {
    return this._getDefinitionWithoutSecrets();
  }

  /**
   * Inject secrets into metaframe URLs via hash parameters and/or query parameters.
   * Secrets are base64-encoded and added to the metaframe URLs.
   * The original param values are preserved and restored when returning definitions.
   * Multiple calls to this method will accumulate secrets.
   *
   * @param secrets - Object mapping metaframe names to their secret hash/query parameters
   */
  public injectSecrets(secrets: InjectSecretsPayload): void {
    if (!secrets?.frameSecrets) {
      return;
    }

    Object.entries(secrets.frameSecrets).forEach(([metaframeName, config]) => {
      const metaframe = this._metaframes[metaframeName];
      if (!metaframe) {
        this.log(
          `Warning: Cannot inject secrets for unknown metaframe: ${metaframeName}`,
        );
        return;
      }

      // Initialize storage for this metaframe if needed
      if (!this._injectedSecrets[metaframeName]) {
        this._injectedSecrets[metaframeName] = {};
      }
      if (!this._injectedQuerySecrets[metaframeName]) {
        this._injectedQuerySecrets[metaframeName] = {};
      }
      if (!this._originalSecretHashParams[metaframeName]) {
        this._originalSecretHashParams[metaframeName] = {};
      }
      if (!this._originalSecretQueryParams[metaframeName]) {
        this._originalSecretQueryParams[metaframeName] = {};
      }

      const currentUrl = new URL(metaframe.url);

      // Store original hash param values and the new secrets
      if (config.hashParams) {
        Object.entries(config.hashParams).forEach(([key, value]) => {
          // Only store original value if we haven't already stored it
          if (!(key in this._originalSecretHashParams[metaframeName])) {
            // Get the current value (if any) before injecting the secret
            const originalValue = getHashParamValueBase64DecodedFromUrl(
              currentUrl,
              key,
            );
            this._originalSecretHashParams[metaframeName][key] =
              originalValue || undefined;
          }
          this._injectedSecrets[metaframeName][key] = value;
        });
      }

      // Store original query param values and the new secrets
      if (config.queryParams) {
        Object.entries(config.queryParams).forEach(([key, value]) => {
          // Only store original value if we haven't already stored it
          if (!(key in this._originalSecretQueryParams[metaframeName])) {
            // Get the current value (if any) before injecting the secret
            const originalValue = currentUrl.searchParams.get(key);
            this._originalSecretQueryParams[metaframeName][key] =
              originalValue || undefined;
          }
          this._injectedQuerySecrets[metaframeName][key] = value;
        });
      }

      // Inject all accumulated secrets into the URL
      let url: URL = new URL(metaframe.url);

      // Inject hash param secrets
      Object.entries(this._injectedSecrets[metaframeName]).forEach(
        ([key, value]) => {
          url = new URL(
            setHashParamValueBase64EncodedInUrl(url.href, key, value),
          );
        },
      );

      // Inject query param secrets (base64 encoded)
      Object.entries(this._injectedQuerySecrets[metaframeName]).forEach(
        ([key, value]) => {
          const encoded = btoa(encodeURIComponent(value));
          url.searchParams.set(key, encoded);
        },
      );

      // Update the metaframe URL with the injected secrets
      metaframe.url = url.href;

      // Update the definition as well
      if (this._definition?.metaframes?.[metaframeName]) {
        this._definition = create(this._definition, (draft) => {
          draft.metaframes[metaframeName].url = url.href;
        });
      }
    });
  }

  /**
   * Helper method to get the definition without any injected secrets.
   * Returns the definition with secret hash/query params replaced by their original values.
   */
  private _getDefinitionWithoutSecrets(): MetapageDefinitionV2 {
    if (
      Object.keys(this._injectedSecrets).length === 0 &&
      Object.keys(this._injectedQuerySecrets).length === 0
    ) {
      // No secrets have been injected, return the current definition
      return this._definition;
    }

    // Create a copy of the definition with secrets removed/replaced
    return create(this._definition, (draft) => {
      // Process all metaframes that have either hash or query secrets
      const allMetaframesWithSecrets = new Set([
        ...Object.keys(this._injectedSecrets),
        ...Object.keys(this._injectedQuerySecrets),
      ]);

      allMetaframesWithSecrets.forEach((metaframeName) => {
        if (!draft.metaframes?.[metaframeName]) {
          return;
        }

        const metaframe = this._metaframes[metaframeName];
        if (!metaframe) {
          return;
        }

        let cleanUrl = metaframe.url;

        // Handle hash param secrets
        const hashSecrets = this._injectedSecrets[metaframeName] || {};
        const originalHashParams =
          this._originalSecretHashParams[metaframeName] || {};

        Object.keys(hashSecrets).forEach((secretKey) => {
          const originalValue = originalHashParams[secretKey];
          if (originalValue === undefined) {
            // This key didn't exist originally, remove it
            const url = new URL(cleanUrl);
            let hashStr = url.hash.startsWith("#?")
              ? url.hash.slice(2)
              : url.hash.slice(1);
            // Replace ? with & in case the hash uses ? as a separator
            hashStr = hashStr.replace(/\?/g, "&");
            const hashParams = new URLSearchParams(hashStr);
            hashParams.delete(secretKey);
            const newHashStr = hashParams.toString();
            url.hash = newHashStr
              ? url.hash.startsWith("#?")
                ? `?${newHashStr}`
                : newHashStr
              : "";
            cleanUrl = url.href;
          } else {
            // This key had an original value, restore it
            const restoredUrl = setHashParamValueBase64EncodedInUrl(
              cleanUrl,
              secretKey,
              originalValue,
            );
            cleanUrl =
              typeof restoredUrl === "string" ? restoredUrl : restoredUrl.href;
          }
        });

        // Handle query param secrets
        const querySecrets = this._injectedQuerySecrets[metaframeName] || {};
        const originalQueryParams =
          this._originalSecretQueryParams[metaframeName] || {};

        Object.keys(querySecrets).forEach((secretKey) => {
          const originalValue = originalQueryParams[secretKey];
          const tempUrl = new URL(cleanUrl);

          if (originalValue === undefined) {
            // This key didn't exist originally, remove it
            tempUrl.searchParams.delete(secretKey);
          } else {
            // This key had an original value, restore it as-is (not base64-encoded)
            tempUrl.searchParams.set(secretKey, originalValue);
          }

          cleanUrl = tempUrl.href;
        });

        draft.metaframes[metaframeName].url = cleanUrl;
      });
    });
  }

  public async setDefinition(
    def: any,
    state?: MetapageState,
  ): Promise<Metapage> {
    const newDefinition: MetapageDefinitionV2 =
      await convertMetapageDefinitionToCurrentVersion(def);

    if (this.isDisposed()) {
      // we got disposed while converting
      return this;
    }

    if (newDefinition.metaframes) {
      Object.keys(newDefinition.metaframes).forEach((metaframeId) => {
        var metaframeDefinition = newDefinition.metaframes[metaframeId];
        if (typeof metaframeDefinition !== "object") {
          this.emitErrorMessage(`Metaframe "${metaframeId}" is not an object`);
          throw `Metaframe "${metaframeId}" is not an object`;
        }

        if (!metaframeDefinition.url) {
          this.emitErrorMessage(
            `Metaframe "${metaframeId}" missing field: url`,
          );
          throw `Metaframe "${metaframeId}" missing field: url`;
        }
      });
    }

    // TODO: revisit this assumption?
    // If there is not an earlier definition, we don't fire an event
    const previousDefinition = this._definition;

    // Save the current secrets before updating the definition
    const savedSecrets = { ...this._injectedSecrets };
    const savedQuerySecrets = { ...this._injectedQuerySecrets };
    const savedOriginalParams = { ...this._originalSecretHashParams };
    const savedOriginalQueryParams = { ...this._originalSecretQueryParams };

    this._definition = newDefinition;
    // try to be efficient with the new definition.
    // destroy any metaframes not in the new definition
    Object.keys(this._metaframes).forEach((metaframeId) => {
      // Doesn't exist? Destroy it
      if (!newDefinition.metaframes || !newDefinition.metaframes[metaframeId]) {
        // this removes the metaframe, pipes, inputs, caches
        this.removeMetaframe(metaframeId);
      }
    });

    // if the state is updated, set that now
    if (state) {
      this._state = create<MetapageState>(state, (draft) => draft);
    }

    // Create any new metaframes needed
    if (newDefinition.metaframes) {
      Object.keys(newDefinition.metaframes).forEach((newMetaframeId) => {
        if (!this._metaframes.hasOwnProperty(newMetaframeId)) {
          const metaframeDefinition = newDefinition.metaframes[newMetaframeId];
          // this will also set the inputs from our state
          this.addMetaframe(newMetaframeId, metaframeDefinition);
        }
      });
    }

    // Re-inject secrets for metaframes that still exist or were just created
    const allMetaframesWithSecrets = new Set([
      ...Object.keys(savedSecrets),
      ...Object.keys(savedQuerySecrets),
    ]);

    allMetaframesWithSecrets.forEach((metaframeName) => {
      if (this._metaframes[metaframeName]) {
        const hashSecrets = savedSecrets[metaframeName] || {};
        const querySecrets = savedQuerySecrets[metaframeName] || {};

        // Start from the NEW definition URL (which may have new params)
        const metaframe = this._metaframes[metaframeName];
        const newDefinitionUrl =
          this._definition?.metaframes?.[metaframeName]?.url;
        if (!newDefinitionUrl) return;

        let url = new URL(newDefinitionUrl);

        // Update original params storage with any existing values from the new URL
        // that will be replaced by secrets
        if (Object.keys(hashSecrets).length > 0) {
          const originalParams = savedOriginalParams[metaframeName] || {};
          Object.keys(hashSecrets).forEach((secretKey) => {
            const existingValue = getHashParamValueBase64DecodedFromUrl(
              url.href,
              secretKey,
            );
            originalParams[secretKey] = existingValue;
          });
          this._injectedSecrets[metaframeName] = hashSecrets;
          this._originalSecretHashParams[metaframeName] = originalParams;
        }

        if (Object.keys(querySecrets).length > 0) {
          const originalQueryParams =
            savedOriginalQueryParams[metaframeName] || {};
          Object.keys(querySecrets).forEach((secretKey) => {
            const existingValue = url.searchParams.get(secretKey);
            // Store the raw value (not base64-decoded) since it's from the new definition
            originalQueryParams[secretKey] = existingValue || undefined;
          });
          this._injectedQuerySecrets[metaframeName] = querySecrets;
          this._originalSecretQueryParams[metaframeName] = originalQueryParams;
        }

        // Re-inject hash param secrets
        Object.entries(hashSecrets).forEach(([key, value]) => {
          url = new URL(
            setHashParamValueBase64EncodedInUrl(url.href, key, value),
          );
        });

        // Re-inject query param secrets
        Object.entries(querySecrets).forEach(([key, value]) => {
          const encoded = btoa(encodeURIComponent(value));
          url.searchParams.set(key, encoded);
        });

        metaframe.url = url.href;

        // Update the definition with secrets
        if (this._definition?.metaframes?.[metaframeName]) {
          this._definition = create(this._definition, (draft) => {
            draft.metaframes[metaframeName].url = url.href;
          });
        }
      }
    });

    // TODO: fire the event anyway, but use immutable state so we
    // can do a quick compare
    // Only fire a definition update event IF this is not the first
    // time the definition is externally set
    if (previousDefinition !== INITIAL_NULL_METAPAGE_DEFINITION) {
      // Send the event on the next loop to give listeners time to re-add
      // after this method returns.
      window.setTimeout(() => {
        if (!this.isDisposed() && newDefinition === this._definition) {
          this._emitDefinitionEvent();
          if (
            state &&
            this.listenerCount(MetapageEvents.State) > 0 &&
            emptyState !== this._state
          ) {
            this.emit(MetapageEvents.State, this._state);
          }
        }
      }, 0);
    }

    return this;
  }

  setMetadata(metadata: MetapageMetadataV2) {
    this._definition = create(this._definition, (draft) => {
      draft.meta = metadata;
    });
    this._emitDefinitionEvent();
  }

  // Convenience method
  _emitDefinitionEvent() {
    if (this.listenerCount(MetapageEvents.Definition) > 0) {
      const event: MetapageEventDefinition = {
        definition: this._getDefinitionWithoutSecrets(),
        metaframes: this._metaframes,
      };
      this.emit(MetapageEvents.Definition, event);
    }
  }

  // do not expose, change definition instead
  addPipe(target: MetaframeId, input: PipeInput) {
    // Do all the cache checking
    this._inputMap = create(this._inputMap, (draft) => {
      if (!draft[target]) {
        draft[target] = [];
      }
      draft[target].push(input);
    });
  }

  // do not expose, change definition instead
  removeMetaframe(metaframeId: MetaframeId) {
    if (!this._metaframes[metaframeId]) {
      return;
    }

    this._metaframes[metaframeId].dispose();

    this._metaframes = create(this._metaframes, (draft) => {
      delete draft[metaframeId];
    });

    this._state = create(this._state, (draft) => {
      delete draft.metaframes.inputs[metaframeId];
      delete draft.metaframes.outputs[metaframeId];
    });

    this._inputMap = create(this._inputMap, (draft) => {
      delete draft[metaframeId];
      Object.keys(draft).forEach((otherMetaframeId) => {
        const inputPipes = draft[otherMetaframeId];
        let index = 0;
        while (index <= inputPipes.length) {
          if (
            inputPipes[index] &&
            inputPipes[index].metaframe === metaframeId
          ) {
            inputPipes.splice(index, 1);
          } else {
            index++;
          }
        }
      });
    });

    // Clean up secrets storage for this metaframe
    delete this._injectedSecrets[metaframeId];
    delete this._injectedQuerySecrets[metaframeId];
    delete this._originalSecretHashParams[metaframeId];
    delete this._originalSecretQueryParams[metaframeId];

    // This will regenerate, simpler than surgery
    this._cachedInputLookupMap = create({}, (draft) => draft);
  }

  // do not expose, change definition instead
  // to add/remove
  removeAll(): void {
    Object.keys(this._metaframes).forEach((id) =>
      this._metaframes[id].dispose(),
    );
    this._metaframes = create({}, (draft) => draft);
    this._state = emptyState;
    this._inputMap = create({}, (draft) => draft);
    this._cachedInputLookupMap = create({}, (draft) => draft);
    // Clean up all secrets
    this._injectedSecrets = {};
    this._injectedQuerySecrets = {};
    this._originalSecretHashParams = {};
    this._originalSecretQueryParams = {};
  }

  public metaframes() {
    return this.getMetaframes();
  }

  public metaframeIds(): MetaframeId[] {
    return this.getMetaframeIds();
  }

  public getMetaframeIds(): MetaframeId[] {
    return Object.keys(this._metaframes);
  }

  public getMetaframes(): {
    [key: string]: MetapageIFrameRpcClient;
  } {
    return this._metaframes;
  }

  public getMetaframe(id: MetaframeId): MetapageIFrameRpcClient | undefined {
    return this?._metaframes?.[id];
  }

  // do not expose, change definition instead
  addMetaframe(
    metaframeId: MetaframeId,
    definition: MetaframeInstance,
  ): MetapageIFrameRpcClient {
    if (!metaframeId) {
      throw "addMetaframe missing metaframeId";
    }

    if (!definition) {
      throw "addMetaframe missing definition";
    }

    if (this._metaframes[metaframeId]) {
      this.emitErrorMessage(`Existing metaframe for id=${metaframeId}`);
      throw `Existing metaframe for id=${metaframeId}`;
    }

    if (!definition.url) {
      this.emitErrorMessage(
        `Metaframe definition missing url id=${metaframeId}`,
      );
      throw `Metaframe definition missing url id=${metaframeId}`;
    }

    var iframeClient = new MetapageIFrameRpcClient(
      this,
      definition.url,
      metaframeId,
      this._id,
      this._consoleBackgroundColor,
      this.debug,
    ).setMetapage(this);
    this._metaframes = create<MetaframeClients>(
      this._metaframes,
      (draft: MetaframeClients) => {
        draft[metaframeId] = iframeClient;
      },
    );

    iframeClient.addListener(MetapageEvents.Error, (err) => {
      // These can be displayed
      this.emit(MetapageEvents.Error, {
        metaframeId: iframeClient.id,
        metaframeUrl: iframeClient.url,
        error: err,
      });
    });

    // add the pipes
    if (definition.inputs) {
      definition.inputs.forEach((input) => this.addPipe(metaframeId, input));
    }

    // set the initial inputs
    iframeClient.setInputs(this._state.metaframes.inputs[metaframeId]);

    return iframeClient;
  }

  public dispose() {
    this.log("disposing");
    super.removeAllListeners();
    window.removeEventListener("message", this.onMessage);
    if (this._metaframes) {
      Object.keys(this._metaframes).forEach((metaframeId) =>
        this._metaframes[metaframeId].dispose(),
      );
    }

    // help the gc remove references but ignore the TS warnings as this object is now gone so don't touch it
    // @ts-ignore
    this._id = undefined;
    // @ts-ignore
    this._metaframes = undefined;
    // @ts-ignore
    this._state = undefined;
    // @ts-ignore
    this._cachedInputLookupMap = undefined;
    // @ts-ignore
    this._inputMap = undefined;
  }

  public log(o: any, color?: string, backgroundColor?: string) {
    if (!this.debug) {
      return;
    }
    this.logInternal(o, color, backgroundColor);
  }

  public error(err: any) {
    this.logInternal(err, "f00", this._consoleBackgroundColor);
    this.emitErrorMessage(`${err}`);
  }

  public emitErrorMessage(err: string) {
    this.emit(MetapageEvents.Error, err);
  }

  // This call is cached
  getInputsFromOutput(
    source: MetaframeId,
    // the pipe id is simply the name of the output file/object/thing
    outputPipeId: MetaframePipeId,
  ): MetaframeInputTargetsFromOutput[] {
    // Do all the cache checking
    if (!this._cachedInputLookupMap[source]) {
      this._cachedInputLookupMap = create(
        this._cachedInputLookupMap,
        (draft: CachedInputLookupMap) => {
          draft[source] = create({}, (__) => __);
        },
      );
    }

    if (!this._cachedInputLookupMap[source][outputPipeId]) {
      this._cachedInputLookupMap = create(
        this._cachedInputLookupMap,
        (draft: CachedInputLookupMap) => {
          var targets: MetaframeInputTargetsFromOutput[] = [];
          draft[source][outputPipeId] = targets;
          // Go through the data structure, getting all the matching inputs that match this output
          Object.keys(this._inputMap).forEach((metaframeId) => {
            if (metaframeId === source) {
              // No self pipes, does not make sense
              return;
            }

            this._inputMap[metaframeId].forEach((inputPipe) => {
              // At least the source metaframe matches, now check pipes
              if (inputPipe.metaframe === source) {
                // Check the kind of source string
                // it could be a basic string, or a glob?
                if (matchPipe(outputPipeId, inputPipe.source)) {
                  // console.log("✅ matches");
                  // A match, now figure out the actual input pipe name
                  // since it might be * or absent meaning that the input
                  // field name is the same as the incoming
                  var targetName: string = inputPipe.target || "";
                  if (
                    !inputPipe.target ||
                    inputPipe.target.startsWith("*") ||
                    inputPipe.target === ""
                  ) {
                    targetName = outputPipeId;
                  } else if (targetName && targetName.endsWith("/")) {
                    targetName = targetName + outputPipeId;
                  }
                  targets.push({ metaframe: metaframeId, pipe: targetName });
                }
              }
            });
          });
        },
      );
    }

    return this._cachedInputLookupMap[source][outputPipeId];
  }

  isValidJSONRpcMessage(message: MinimumClientMessage<any>) {
    if (message.jsonrpc !== "2.0") {
      // do not even log messages that we do not recogize. We cannot control random scripts sending messages on
      // the only communications channel
      return false;
    }
    const method = message.method as JsonRpcMethodsFromChild;
    switch (method) {
      case JsonRpcMethodsFromChild.SetupIframeClientRequest:
        //No validation possible here
        return true;
      default:
        // TODO: check origin+source
        var iframeId: MetaframeId | undefined = message.iframeId;
        // if (
        //   iframeId &&
        //   !(
        //     message.parentId === this._id &&
        //     (this._metaframes[iframeId])
        //   )
        // ) {
        //   return false;
        // }
        return (
          iframeId &&
          message.parentId === this._id &&
          !!this._metaframes[iframeId]
        );
    }
  }

  /**
   * Sets inputs
   * First update internal state, so any events that check get the new value
   * Then update the metaframe clients
   * Fire events
   * @param iframeId Can be an object of {metaframeId:{pipeId:value}} or the metaframe id
   * @param inputPipeId If the above is a string id, then inputPipeId can be the pipe id or an object {pipeId:value}
   * @param value If the above is a pipe id, then the is the value.
   */
  public setInput(
    iframeId: MetaframeId | MetapageInstanceInputs,
    inputPipeId?: MetaframePipeId | MetaframeInputMap,
    value?: PipeUpdateBlob,
  ) {
    if (typeof iframeId === "object") {
      this.setInputStateOnlyMetapageInstanceInputs(iframeId);
    } else if (typeof inputPipeId === "string") {
      this.setInputStateOnlyMetaframeInputValue(iframeId, inputPipeId, value);
    } else {
      this.setInputStateOnlyMetaframeInputMap(iframeId, inputPipeId || {});
    }

    this.setMetaframeClientInputAndSentClientEvent(
      iframeId,
      inputPipeId,
      value,
    );
    // finally send the main events
    if (
      this.listenerCount(MetapageEvents.State) > 0 ||
      this.listenerCount(MetapageEvents.Inputs) > 0
    ) {
      if (emptyState !== this._state) {
        this.emit(MetapageEvents.State, this._state);
        this.emit(MetapageEvents.Inputs, this._state?.metaframes?.inputs);
      }
    }
  }

  setMetaframeClientInputAndSentClientEvent(
    iframeId: MetaframeId | MetapageInstanceInputs,
    inputPipeId?: MetaframePipeId | MetaframeInputMap,
    value?: PipeUpdateBlob,
  ) {
    if (typeof iframeId === "object") {
      if (inputPipeId || value) {
        throw "bad arguments, see API docs";
      }
      const inputs: any = iframeId;
      Object.keys(inputs).forEach((id) => {
        var metaframeId: MetaframeId = id;
        var metaframeInputs = inputs[metaframeId];
        if (typeof metaframeInputs !== "object") {
          throw "bad arguments, see API docs";
        }
        var iframeClient = this._metaframes[metaframeId];
        if (iframeClient) {
          iframeClient.setInputs(metaframeInputs);
        } else {
          this.error("No iframe id=$metaframeId");
        }
      });
    } else if (typeof iframeId === "string") {
      const iframeClient = this._metaframes[iframeId];
      if (iframeClient == null) {
        this.error(`No iframe id=${iframeId}`);
      }
      if (typeof inputPipeId === "string") {
        iframeClient.setInput(inputPipeId, value);
      } else if (typeof inputPipeId === "object") {
        iframeClient.setInputs(inputPipeId);
      } else {
        throw "bad arguments, see API docs";
      }
    } else {
      throw "bad arguments, see API docs";
    }
  }

  public setInputs(
    iframeId: MetaframeId | MetapageInstanceInputs,
    inputPipeId?: MetaframePipeId | MetaframeInputMap,
    value?: PipeUpdateBlob,
  ) {
    this.setInput(iframeId, inputPipeId, value);
  }

  setOutputStateOnlyMetapageInstanceInputs(
    metapageInputs: MetapageInstanceInputs,
  ) {
    this._setStateOnlyMetaframes(false, metapageInputs);
  }

  setOutputStateOnlyMetaframeInputValue(
    metaframeId: MetaframeId,
    inputPipeId: MetaframePipeId,
    value?: PipeUpdateBlob,
  ) {
    this._setStateOnlyMetaframeInputValue(
      false,
      metaframeId,
      inputPipeId,
      value,
    );
  }

  setOutputStateOnlyMetaframeInputMap(
    metaframeId: MetaframeId,
    metaframeValuesNew: MetaframeInputMap,
  ) {
    this._setStateOnlyMetaframeInputMap(false, metaframeId, metaframeValuesNew);
  }

  setInputStateOnlyMetapageInstanceInputs(
    metapageInputs: MetapageInstanceInputs,
  ) {
    this._setStateOnlyMetaframes(true, metapageInputs);
  }

  setInputStateOnlyMetaframeInputValue(
    metaframeId: MetaframeId,
    inputPipeId: MetaframePipeId,
    value?: PipeUpdateBlob,
  ) {
    this._setStateOnlyMetaframeInputValue(
      true,
      metaframeId,
      inputPipeId,
      value,
    );
  }

  setInputStateOnlyMetaframeInputMap(
    metaframeId: MetaframeId,
    metaframeValuesNew: MetaframeInputMap,
  ) {
    this._setStateOnlyMetaframeInputMap(true, metaframeId, metaframeValuesNew);
  }

  _setStateOnlyMetaframeInputValue(
    isInputs: boolean,
    metaframeId: MetaframeId,
    metaframePipeId: MetaframePipeId,
    value?: PipeUpdateBlob,
  ): void {
    this._state = create(this._state, (draft: MetapageState) => {
      const isMetaframe = this._metaframes.hasOwnProperty(metaframeId);
      if (!isMetaframe) {
        throw `No metaframe: ${metaframeId}`;
      }
      if (!draft.metaframes) {
        draft.metaframes = { inputs: {}, outputs: {} };
      }

      if (isInputs) {
        if (!draft.metaframes.inputs) {
          draft.metaframes.inputs = {};
        }
      } else {
        if (!draft.metaframes.outputs) {
          draft.metaframes.outputs = {};
        }
      }

      let inputOrOutputState = isInputs
        ? draft.metaframes.inputs
        : draft.metaframes.outputs;

      // Ensure a map
      inputOrOutputState = inputOrOutputState || {};
      inputOrOutputState[metaframeId] = !!inputOrOutputState[metaframeId]
        ? inputOrOutputState[metaframeId]
        : ({} as MetaframeInstance);

      // A key with a value of undefined means remove the key from the state object
      if (value === undefined) {
        delete inputOrOutputState[metaframeId][metaframePipeId];
      } else {
        // otherwise set the new value
        inputOrOutputState[metaframeId][metaframePipeId] = value;
      }
    });
  }

  _setStateOnlyMetaframeInputMap(
    isInputs: boolean,
    metaframeId: MetaframeId,
    metaframeValuesNew: MetaframeInputMap,
  ): void {
    if (!metaframeValuesNew || Object.keys(metaframeValuesNew).length === 0) {
      return;
    }

    this._state = create(this._state, (draft: MetapageState) => {
      const isMetaframe = this._metaframes.hasOwnProperty(metaframeId);
      if (!isMetaframe) {
        throw `No metaframe: ${metaframeId}`;
      }

      let inputOrOutputState = isInputs
        ? draft.metaframes.inputs
        : draft.metaframes.outputs;

      // Ensure a map
      inputOrOutputState[metaframeId] = inputOrOutputState[metaframeId]
        ? inputOrOutputState[metaframeId]
        : ({} as MetaframeInstance);

      Object.keys(metaframeValuesNew).forEach((metaframePipedId) => {
        // A key with a value of undefined means remove the key from the state object
        if (metaframeValuesNew[metaframePipedId] === undefined) {
          delete inputOrOutputState[metaframeId][metaframePipedId];
        } else {
          // otherwise set the new value
          inputOrOutputState[metaframeId][metaframePipedId] =
            metaframeValuesNew[metaframePipedId];
        }
      });
    });
  }

  _setStateOnlyMetaframes(
    isInputs: boolean,
    inputsMetaframesNew: MetapageInstanceInputs,
  ): void {
    if (!inputsMetaframesNew || Object.keys(inputsMetaframesNew).length === 0) {
      return;
    }

    this._state = create(this._state, (draft: MetapageState) => {
      Object.keys(inputsMetaframesNew).forEach((metaframeId) => {
        var metaframeValuesNew: MetaframeInputMap =
          inputsMetaframesNew[metaframeId];
        if (typeof metaframeValuesNew !== "object") {
          throw "Object values must be objects";
        }

        const isMetaframe = this._metaframes.hasOwnProperty(metaframeId);
        if (!isMetaframe) {
          throw "No metaframe: ${metaframeId}";
        }

        const inputOrOutputState = isInputs
          ? draft.metaframes.inputs
          : draft.metaframes.outputs;

        // Ensure a map
        inputOrOutputState[metaframeId] = inputOrOutputState[metaframeId]
          ? inputOrOutputState[metaframeId]
          : ({} as MetaframeInstance);

        Object.keys(metaframeValuesNew).forEach((metaframePipedId) => {
          // A key with a value of undefined means remove the key from the state object
          if (metaframeValuesNew[metaframePipedId] === undefined) {
            delete inputOrOutputState[metaframeId][metaframePipedId];
          } else {
            // otherwise set the new value
            inputOrOutputState[metaframeId][metaframePipedId] =
              metaframeValuesNew[metaframePipedId];
          }
        });
      });
    });
  }

  /**
   * Set the outputs for a metaframe manually, useful for when the
   * metapage is modifying the outputs directly
   * @param metaframeId
   * @param outputs
   */
  setMetaframeOutputs(metaframeId: MetaframeId, outputs: MetaframeInputMap) {
    this.onMessageJsonRpc({
      iframeId: metaframeId,
      parentId: this._id,
      jsonrpc: "2.0",
      method: JsonRpcMethodsFromChild.OutputsUpdate,
      id: "_",
      params: outputs,
    });
  }

  /**
   * Set the outputs manually, useful for when the
   * parent wants to modify the outputs directly
   * @param outputs
   */
  setOutputs(outputs: MetapageInstanceInputs) {
    if (!this._metaframes) {
      return;
    }
    for (const metaframeId in outputs) {
      this.setMetaframeOutputs(metaframeId, outputs[metaframeId]);
    }
  }

  onMessage(e: MessageEvent) {
    // any other type of messages are ignored
    // maybe in the future we can pass around strings or ArrayBuffers
    if (typeof e.data === "object") {
      const jsonrpc = e.data as MinimumClientMessage<any>;
      if (!this.isValidJSONRpcMessage(jsonrpc)) {
        return;
      }
      this.onMessageJsonRpc(jsonrpc);
    }
  }

  onMessageJsonRpc(jsonrpc: MinimumClientMessage<any>) {
    //Verify here
    var method = jsonrpc.method as JsonRpcMethodsFromChild;
    const metaframeId = jsonrpc.iframeId;
    // The metaframe gets its id from the window.name field so the iframe knows
    // its id from the very beginning
    if (!metaframeId) {
      // so if it's missing, bail early
      return;
    }

    // ignore messages from other metapages
    if (
      method !== "SetupIframeClientRequest" &&
      jsonrpc.parentId !== this._id
    ) {
      return;
    }

    const metaframe = this.getMetaframe(metaframeId);
    if (!metaframe) {
      // SetupIframeClientRequest from other metapages is ignored
      // this.error(`💥 onMessage method=${method}no metaframe id=${metaframeId}`);
      return;
    }

    // debugging: track messsages internally
    (jsonrpc as any)["_messageCount"] = ++this._internalReceivedMessageCounter;

    if (this.debug) {
      this.log(
        `processing ${JSON.stringify(jsonrpc, null, "  ").substring(0, 500)}`,
      );
    }

    switch (method) {
      /**
       * An iframe is sending a connection request.
       * Here we register it to set up a secure
       * communication channel.
       */
      case JsonRpcMethodsFromChild.SetupIframeClientRequest:
        metaframe.register();
        break;

      /* A client iframe responded */
      case JsonRpcMethodsFromChild.SetupIframeServerResponseAck:
        /* Send all inputs when a client has registered. */
        if (metaframe) {
          const params = jsonrpc.params as SetupIframeClientAckData<any>;
          metaframe.registered(params.version);
        }
        break;

      case JsonRpcMethodsFromChild.OutputsUpdate:
        const outputs: MetaframeInputMap = jsonrpc.params;
        if (!outputs || Object.keys(outputs).length === 0) {
          break;
        }

        if (this._metaframes[metaframeId]) {
          var iframe = this._metaframes[metaframeId];

          // set the internal state, no event yet, nor downstream inputs update (yet)
          this.setOutputStateOnlyMetaframeInputMap(metaframeId, outputs);
          // iframe outputs, metaframe only event sent
          iframe.setOutputs(outputs);
          // let's not send the state event until AFTER
          // cached lookup of where those outputs are going
          // Multiple outputs going to multiple inputs on the same metaframe must
          // arrive as a single blob
          var modified = false;
          const outputKeys = Object.keys(outputs);
          const collectedOutputs: { [key in string]: MetaframeInputMap } = {};
          outputKeys.forEach((outputKey, i) => {
            const targets: MetaframeInputTargetsFromOutput[] =
              this.getInputsFromOutput(metaframeId!, outputKey);

            if (targets.length > 0) {
              targets.forEach((target) => {
                if (!collectedOutputs[target.metaframe]) {
                  collectedOutputs[target.metaframe] = {};
                }
                collectedOutputs[target.metaframe][target.pipe] =
                  outputs[outputKey];
                modified = true;
              });
            }
          });
          if (modified) {
            this.setInputStateOnlyMetapageInstanceInputs(collectedOutputs);
            Object.keys(collectedOutputs).forEach((metaframeId) => {
              this._metaframes[metaframeId].setInputs(
                collectedOutputs[metaframeId],
                // then actually set the inputs once collected
              );
            });
          }
          // only send a state event if downstream inputs were modified
          if (
            this.listenerCount(MetapageEvents.State) > 0 &&
            emptyState !== this._state
          ) {
            this.emit(MetapageEvents.State, this._state);
          }
          if (this.debug) {
            iframe.ack({ jsonrpc: jsonrpc, state: this._state });
          }
        } else {
          this.error(`missing metaframe=${metaframeId}`);
        }

        break;

      case JsonRpcMethodsFromChild.InputsUpdate:
        // This is triggered by the metaframe itself, meaning the metaframe
        // decided to save this state info.
        // We store it in the local state, then send it back so
        // the metaframe is notified of its input state.
        var inputs: MetaframeInputMap = jsonrpc.params;
        if (this.debug)
          this.log(`inputs ${JSON.stringify(inputs)} from ${metaframeId}`);
        if (this._metaframes[metaframeId]) {
          // Set the internal inputs state first so that anything that
          // responds to events will get the updated state if requested
          // Currently on for setting metaframe inputs that haven't loaded yet
          this.setInputStateOnlyMetaframeInputMap(metaframeId, inputs);
          this._metaframes[metaframeId].setInputs(inputs);
          if (
            this.listenerCount(MetapageEvents.State) > 0 &&
            emptyState !== this._state
          ) {
            this.emit(MetapageEvents.State, this._state);
          }

          if (this.debug) {
            this._metaframes[metaframeId].ack({
              jsonrpc: jsonrpc,
              state: this._state,
            });
          }
        } else {
          console.error(
            `InputsUpdate failed no metaframe id: "${metaframeId}"`,
          );
          this.error(`InputsUpdate failed no metaframe id: "${metaframeId}"`);
        }
        break;
      case JsonRpcMethodsFromChild.HashParamsUpdate:
        // Not really sure how to "automatically" process this right here
        // It's a potential automatic security concern, IF we want to put credentials
        // in the hash params (and we do)
        // So for now, just emit an event, and let the parent context handle it
        // In the current use case this app: https://github.com/metapages/metapage-app
        // will listen for the event and update the definition accordingly
        if (metaframe) {
          // Update in place the local references to the new metaframe URL with the
          // new hash params:
          //   - if you call metapage.getDefinition() it will include the new URL
          //   - compare metapage.getDefinition() with any updates outside of this
          //     context to decide wether to re-render or recreate
          const hashParamsUpdatePayload: MetapageEventUrlHashUpdate =
            jsonrpc.params;
          const metaframeName = hashParamsUpdatePayload.metaframe;
          let url = new URL(metaframe.url);
          url.hash = hashParamsUpdatePayload.hash;

          // Re-inject hash param secrets into the new URL if any were injected
          if (this._injectedSecrets[metaframeName]) {
            Object.entries(this._injectedSecrets[metaframeName]).forEach(
              ([key, value]) => {
                url = new URL(
                  setHashParamValueBase64EncodedInUrl(url.href, key, value),
                );
              },
            );
          }

          // Re-inject query param secrets
          if (this._injectedQuerySecrets[metaframeName]) {
            Object.entries(this._injectedQuerySecrets[metaframeName]).forEach(
              ([key, value]) => {
                const encoded = btoa(encodeURIComponent(value));
                url.searchParams.set(key, encoded);
              },
            );
          }

          // Update the local metaframe client reference (with secrets)
          metaframe.url = url.href;

          // Update the definition in place (without secrets)
          // Use the same logic as _getDefinitionWithoutSecrets
          let cleanUrlStr = url.href;

          // Remove/restore hash param secrets
          if (this._injectedSecrets[metaframeName]) {
            const originalParams =
              this._originalSecretHashParams[metaframeName] || {};

            Object.keys(this._injectedSecrets[metaframeName]).forEach(
              (secretKey) => {
                const originalValue = originalParams[secretKey];
                if (originalValue === undefined) {
                  // This key didn't exist originally, remove it
                  const tempUrl = new URL(cleanUrlStr);
                  let hashStr = tempUrl.hash.startsWith("#?")
                    ? tempUrl.hash.slice(2)
                    : tempUrl.hash.slice(1);
                  // Replace ? with & in case the hash uses ? as a separator
                  hashStr = hashStr.replace(/\?/g, "&");
                  const hashParams = new URLSearchParams(hashStr);
                  hashParams.delete(secretKey);
                  const newHashStr = hashParams.toString();
                  tempUrl.hash = newHashStr
                    ? tempUrl.hash.startsWith("#?")
                      ? `?${newHashStr}`
                      : newHashStr
                    : "";
                  cleanUrlStr = tempUrl.href;
                } else {
                  // This key had an original value, restore it
                  const restoredUrl = setHashParamValueBase64EncodedInUrl(
                    cleanUrlStr,
                    secretKey,
                    originalValue,
                  );
                  cleanUrlStr =
                    typeof restoredUrl === "string"
                      ? restoredUrl
                      : restoredUrl.href;
                }
              },
            );
          }

          // Remove/restore query param secrets
          if (this._injectedQuerySecrets[metaframeName]) {
            const originalQueryParams =
              this._originalSecretQueryParams[metaframeName] || {};

            Object.keys(this._injectedQuerySecrets[metaframeName]).forEach(
              (secretKey) => {
                const originalValue = originalQueryParams[secretKey];
                const tempUrl = new URL(cleanUrlStr);

                if (originalValue === undefined) {
                  // This key didn't exist originally, remove it
                  tempUrl.searchParams.delete(secretKey);
                } else {
                  // This key had an original value, restore it as-is (not base64-encoded)
                  tempUrl.searchParams.set(secretKey, originalValue);
                }

                cleanUrlStr = tempUrl.href;
              },
            );
          }

          const cleanUrl = new URL(cleanUrlStr);

          this._definition = create<MetapageDefinitionV2>(
            this._definition,
            (draft) => {
              draft.metaframes[metaframeName].url = cleanUrl.href;
            },
          );

          this._emitDefinitionEvent();
        }
        break;
      default:
        if (this.debug) {
          this.log(`Unknown RPC method: "${method}"`);
        }
    }
    if (this.listenerCount(MetapageEvents.Message) > 0) {
      this.emit(MetapageEvents.Message, jsonrpc);
    }
  }

  logInternal(o: any, color?: string, backgroundColor?: string) {
    backgroundColor = backgroundColor
      ? backgroundColor
      : this._consoleBackgroundColor;
    let s: string;
    if (typeof o === "string") {
      s = o as string;
    } else if (typeof o === "number") {
      s = o + "";
    } else {
      s = JSON.stringify(o);
    }
    s = this._id ? `Metapage[${this._id}] ${s}` : s;
    MetapageToolsLog(s, color, backgroundColor);
  }
}
