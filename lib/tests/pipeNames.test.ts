/// <reference types="@vitest/browser/providers/playwright" />

/**
 * Regression tests for https://github.com/metapages/metapage/issues/47
 *
 * A ":" in a pipe name (e.g. `metaframe.onInput("device:xxx", ...)`) used to
 * throw "SyntaxError: Unexpected token ':'" from the glob matcher (minimatch,
 * in the old Haxe implementation) that routes outputs to inputs. Pipe names
 * are arbitrary strings, so ":" and other regex/glob-significant characters
 * must route like any other name.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  JsonRpcMethodsFromParent,
  matchPipe,
  Metaframe,
  Metapage,
  MinimumClientMessage,
} from "../src";

const FRAME_URL = "https://metapage.io/metaframes/passthrough-markdown/";

const setupResponseFromParent = (
  iframeId: string,
  parentId: string,
): MessageEvent<MinimumClientMessage<any>> =>
  new MessageEvent("message", {
    data: {
      jsonrpc: "2.0",
      id: "_",
      method: JsonRpcMethodsFromParent.SetupIframeServerResponse,
      params: {
        iframeId,
        parentId,
        state: { inputs: {} },
        version: Metapage.version,
      },
      iframeId,
      parentId,
    },
  });

const inputsUpdateFromParent = (
  iframeId: string,
  parentId: string,
  inputs: { [key: string]: any },
): MessageEvent<MinimumClientMessage<any>> =>
  new MessageEvent("message", {
    data: {
      jsonrpc: "2.0",
      id: "_",
      method: JsonRpcMethodsFromParent.InputsUpdate,
      params: { inputs, parentId },
      iframeId,
      parentId,
    },
  });

describe("pipe names containing ':' (issue #47)", () => {
  it("matchPipe handles ':' in exact names and globs without throwing", () => {
    expect(matchPipe("device:xxx", "device:xxx")).toBe(true);
    expect(matchPipe("device:xxx", "device:*")).toBe(true);
    expect(matchPipe("device:xxx", "*")).toBe(true);
    expect(matchPipe("device:xxx", "**")).toBe(true);
    expect(matchPipe("device:xxx", "*:xxx")).toBe(true);
    expect(matchPipe("device:xxx", "device:yyy")).toBe(false);
    expect(matchPipe("other", "device:*")).toBe(false);
    // Other characters that are significant in regexes or globs
    expect(matchPipe("a(b):c", "a(b):c")).toBe(true);
    expect(matchPipe("a[b]:c", "a[b]:c")).toBe(true);
    expect(matchPipe("x:y.z", "x:y.z")).toBe(true);
  });

  describe("Metapage routing", () => {
    let metapage: Metapage | undefined;

    afterEach(() => {
      metapage?.dispose();
      metapage = undefined;
    });

    it("routes outputs to inputs whose names contain ':'", async () => {
      metapage = new Metapage();
      await metapage.setDefinition({
        metaframes: {
          source: { url: FRAME_URL },
          exact: {
            url: FRAME_URL,
            inputs: [{ metaframe: "source", source: "device:xxx" }],
          },
          renamed: {
            url: FRAME_URL,
            inputs: [
              {
                metaframe: "source",
                source: "device:xxx",
                target: "sensor:1",
              },
            ],
          },
          globbed: {
            url: FRAME_URL,
            inputs: [{ metaframe: "source", source: "device:*" }],
          },
          unrelated: {
            url: FRAME_URL,
            inputs: [{ metaframe: "source", source: "other:*" }],
          },
        },
      });

      const targets = metapage
        .getInputsFromOutput("source", "device:xxx")
        .slice()
        .sort((a, b) => a.metaframe.localeCompare(b.metaframe));
      expect(targets).toEqual([
        { metaframe: "exact", pipe: "device:xxx" },
        { metaframe: "globbed", pipe: "device:xxx" },
        { metaframe: "renamed", pipe: "sensor:1" },
      ]);
    });
  });

  describe("Metaframe.onInput", () => {
    let metaframe: Metaframe | undefined;

    afterEach(() => {
      metaframe?.dispose();
      metaframe = undefined;
    });

    it("delivers inputs whose names contain ':'", async () => {
      metaframe = new Metaframe();
      expect(metaframe._isIframe).toBe(true);
      metaframe._setupRequestRetryIntervalMs = 5;
      await vi.waitFor(() =>
        expect(metaframe!._setupRequestSendCount).toBeGreaterThanOrEqual(1),
      );

      const received: any[] = [];
      metaframe.onInput("device:xxx", (value: any) => received.push(value));

      window.dispatchEvent(
        setupResponseFromParent(metaframe.id, "test-parent-id"),
      );
      await metaframe.connected();

      window.dispatchEvent(
        inputsUpdateFromParent(metaframe.id, "test-parent-id", {
          "device:xxx": 42,
          "device:yyy": 0,
        }),
      );

      await vi.waitFor(() => expect(received).toEqual([42]));
      expect(metaframe.getInput("device:xxx")).toBe(42);
    });
  });
});
