// Download the specific metaPAGE library version
// to make it easier to test all versions against all
const { compareVersions } = window.compareVersions
const url = new URL(window.location.href);
// console.log(`url: ${url}`);
const urlPathElements = url.pathname.split("/").filter((e) =>
    e !== ""
);
var version = urlPathElements[3] || "latest";
var testname = urlPathElements[2];

const importURl = `${
    version === "latest"
        ? "/lib/metapage/index.js"
        : "/lib/metapage/index.js"  // Use local build for all versions during testing
}`;

const { Metapage } = await import(importURl);

let debug = ["debug", "mp_debug"].reduce((exists, flag) => {
   return exists || url.searchParams.get(flag) === "true" || url.searchParams.get(flag) === "1"
}, false);

if (debug) {
    console.log("❗🏗️ PAGE debug");
}

////////////////////////////////////////////////////////////////////////
// Get the metaframe/metapage library versions to test
// The metaframes are arranged in a line (chain), latest first
// each will pass the next a data blob {versions:[]}. At the end the
// metapage will verify that all metaframes added their versions
// For this, we need all current supported library versions.

const resp = await fetch(`/versions/metapages/metapage`);
const VERSIONS_METAFRAME = await resp.json();
if (version === "latest") {
    VERSIONS_METAFRAME.push("latest");
}
// Put the last also first because some later tests require features not in the
// earlier versions, so those tests will fail. There is no downside to having
// extra versions in the test.
VERSIONS_METAFRAME.unshift(
    VERSIONS_METAFRAME[VERSIONS_METAFRAME.length - 1] + "-begin",
);

var PAGEURL = new URL(globalThis.location.href);

////////////////////////////////////////////////////////////////////////
// Define all the functional tests
let TESTS;

const getStatusText = (err) => {
    let text = TESTS.map((test) => test.getHTML()).join("") + "<br/><br/>";
    if (err) {
        document.body.style.backgroundColor = "red";
        text += "TESTS FAIL:<br/>" + err;
        console.error(`Tests err:${err}`, err);
    } else if (
        TESTS.reduce((isPassing, test) => {
            return isPassing && test.success;
        }, true)
    ) {
        // This piece of text is used by headless chrome in the test runner
        text += "METAPAGE TESTS PASS";
    }
    text += "<br/><br/>";
    return text;
};

const setStatus = (err) => {
    if (
        !err &&
        (PAGEURL.searchParams.has("debug") ||
            PAGEURL.searchParams.has("mp_debug") ||
            PAGEURL.searchParams.has("mp_DEBUG"))
    ) {
        console.log(
            TESTS.map((test) => test.description + ":" + test.getText()).join(
                "",
            ),
        );
    }
    document.getElementById("status").innerHTML = getStatusText(err);
};

// Use for (de)serialization tests
const BlobTypes = [
    "File",
    "Blob",
    "ArrayBuffer",
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Uint16Array",
    "Int32Array",
    "Uint32Array",
    "Float32Array",
    "Float64Array",
    "BigInt64Array",
    "BigUint64Array",
];

class Test {
    constructor(description, testFunc) {
        this.description = description;
        this.testFunc = testFunc;
        this.success = false;
    }

    async run(metapage) {
        this.metapage = metapage;
        this.success = await this.testFunc(metapage);
        setStatus();
        return this.success;
    }

    getText() {
        if (!this.metapage) {
            return "";
        }
        return `${this.success ? "✓" : "⌛"}: ${this.description}`;
    }

    getHTML() {
        if (!this.metapage) {
            return "";
        }
        return "<br/>" + this.getText();
    }
}

TESTS = [
    // new Test("metaframe internal sent inputs saved in state", // ensure that when metaframes save their own inputs state,
    // // we actually save it to the metapage state
    // (metapage) => { // metapage instance
    //     return new Promise((resolve, reject) => {
    //         let disposeListener;
    //         const onStateChange = (e) => {
    //             let inputs;
    //             if (metapage.getState) {
    //                 inputs = metapage.getState().metaframes.inputs;
    //             } else { // < v0.3
    //                 inputs = metapage._inputsState;
    //             }

    //             let ids = [...VERSIONS_METAFRAME]; // copy
    //             let i = 0;
    //             while (i < ids.length) {
    //                 const metaframeId = ids[i];
    //                 if (
    //                     inputs[metaframeId] &&
    //                     inputs[metaframeId]["save-input-check"] === metaframeId
    //                 ) {
    //                     ids.splice(i, 1);
    //                 } else {
    //                     i++;
    //                 }
    //             }
    //             if (ids.length == 0) {
    //                 // TEST_OK_METAFRAME_SAVE_INPUTS_STATE = true;
    //                 // don't allow calling resolve again
    //                 disposeListener();
    //                 resolve(true);
    //                 setStatus();
    //             }
    //         };
    //         metapage.addListener(Metapage.STATE, onStateChange);
    //         disposeListener = () =>
    //             metapage.removeListener(Metapage.STATE, onStateChange);
    //         onStateChange(metapage.getState());
    //     });
    // }),

    new Test("outputs->inputs data flow", // Look to the outputs of the LAST metaframe, it should have an array
    // of the chain of metaframe versions the array has passed through
    (metapage) => { // metapage instance
        return new Promise((resolve, reject) => {
            const lastMetaframe = metapage.getMetaframe(
                VERSIONS_METAFRAME[VERSIONS_METAFRAME.length - 1],
            );
            if (!lastMetaframe) {
                throw `metapage.getMetaframe(${
                    VERSIONS_METAFRAME[VERSIONS_METAFRAME.length - 1]
                }) is undefined. VERSIONS_METAFRAME=${VERSIONS_METAFRAME}`;
            }

            let hasFinalOutputs = false;
            let disposeListener;
            disposeListener = lastMetaframe.onOutputs((outputs) => {
                if (outputs["output1"] && outputs["output2"]) {
                    hasFinalOutputs = true;
                    const finalVersions1 = JSON.stringify(
                        outputs["output1"].versions,
                    );
                    const finalVersions2 = JSON.stringify(
                        outputs["output2"].versions,
                    );
                    const versionsTested = JSON.stringify(VERSIONS_METAFRAME);
                    // Correct for needing 'latest' twice but not using the key 'latest' twice
                    // const versionsTested = VERSIONS_METAFRAME;//.map(e => e.replace('latest-begin', 'latest'));
                    if (
                        versionsTested === finalVersions1 &&
                        versionsTested === finalVersions2
                    ) {
                        // don't allow calling resolve again
                        disposeListener();
                        // TEST_OK_INPUTS_PASS_THROUGH = true;
                        resolve(true);
                        setStatus();
                    } else {
                        // don't allow calling resolve again
                        disposeListener();
                        reject(
                            `versionsTested=${versionsTested}) but\nfinalVersions1=${finalVersions1}\nfinalVersions2=${finalVersions2}`,
                        );
                        setStatus();
                    }
                }
            });

            // Start the train. Metaframes will add their version to the
            // array and pass it on
            // The metapage inputs uses the metaframe id as the key, and here metaframe ids are versions
            const inputs = {
                [VERSIONS_METAFRAME[0]]: {
                    input1: { versions: [] },
                    input2: { versions: [] },
                },
            };
            metapage.setInput(inputs);
        });
    }),

    new Test("inputs chain saved in state", // additional test for the above "outputs->inputs data flow"
    // verify that the data structure passed through the metaframe chain
    // is correctly captured in the metapage state
    (metapage) => { // metapage instance
        return new Promise((resolve, reject) => {
            let disposeListener;
            const onStateChange = (e) => {
                
                const inputs = metapage.getState().metaframes.inputs;
                const outputs = metapage.getState().metaframes.outputs;

                

                let found = {};
                var VERSIONS_EXPECTED = [...VERSIONS_METAFRAME];
                if (VERSIONS_EXPECTED[0] === "latest-begin") {
                    VERSIONS_EXPECTED[0] = "latest";
                    VERSIONS_EXPECTED.pop(); // the other 'latest'
                }

                // check all the inputs of all the metaframes, they should
                // have a specific order of metaframe versions depending on
                // where they are in the chain.
                let passed = VERSIONS_METAFRAME.map((version, i) => {
                    const metapageId = VERSIONS_METAFRAME[i];

                    const expectedInputVersions = JSON.stringify(
                        VERSIONS_METAFRAME.slice(0, i),
                    );
                    const expectedOutputVersions = JSON.stringify(
                        VERSIONS_METAFRAME.slice(0, i + 1),
                    );

                    return (inputs[metapageId] &&
                        inputs[metapageId]["input1"] &&
                        inputs[metapageId].input1.versions &&
                        JSON.stringify(inputs[metapageId].input1.versions) ==
                            expectedInputVersions &&
                        outputs[metapageId] &&
                        outputs[metapageId].output1 &&
                        outputs[metapageId].output1.versions &&
                        JSON.stringify(outputs[metapageId].output1.versions) ===
                            expectedOutputVersions);
                });

                passed = passed.reduce(
                    (current, testPassed) => current && testPassed,
                    true,
                );

                if (passed) {
                    disposeListener();
                    resolve(true);
                    setStatus();
                }
            };

            metapage.addListener(Metapage.STATE, onStateChange);
            disposeListener = () =>
                metapage.removeListener(Metapage.STATE, onStateChange);
            onStateChange(metapage.getState());
        });
    }),

    // new Test(
    //     "metapage only sends definition event on updates (not the first setDefinition)",
    //     (metapage) => { // metapage instance
    //         return new Promise((resolve, reject) => {
    //             try {
    //                 const mp = new Metapage();
    //                 let firstDefinition = true;
    //                 mp.addListener(Metapage.DEFINITION, (def) => {
    //                     if (firstDefinition) {
    //                         reject(
    //                             "Metapage.DEFINITION but this is the first definition",
    //                         );
    //                         return;
    //                     }
    //                     resolve(true);
    //                 });
    //                 mp.setDefinition({
    //                     version: "0.3",
    //                     metaframes: {},
    //                     meta: {
    //                         name: "fork",
    //                     },
    //                 });
    //                 setTimeout(() => {
    //                     firstDefinition = false;
    //                     mp.setDefinition({
    //                         version: "0.3",
    //                         metaframes: {},
    //                         meta: {
    //                             name: "fork2",
    //                         },
    //                     });
    //                 }, 20);
    //             } catch (err) {
    //                 console.error(err);
    //                 reject(err);
    //             }
    //         });
    //     },
    // ),

    // new Test("[File|Blob|TypedArray|ArrayBuffer] (de)serialization", // Send a value of each type to the first metaframe, and verify that the
    // // last metaframe receives the same (typed) values
    // (metapage) => { // metapage instance
    //     return new Promise(async (resolve, reject) => {
    //         const lastMetaframe = metapage.getMetaframe(
    //             VERSIONS_METAFRAME[VERSIONS_METAFRAME.length - 1],
    //         );
    //         if (!lastMetaframe) {
    //             throw `metapage.getMetaframe(${
    //                 VERSIONS_METAFRAME[VERSIONS_METAFRAME.length - 1]
    //             }) is undefined. VERSIONS_METAFRAME=${VERSIONS_METAFRAME}`;
    //         }

    //         let hasFinalOutputs = false;
    //         let disposeListener;
    //         disposeListener = lastMetaframe.onOutputs(async (outputs) => {
    //             if (outputs["Float32Array"]) {
    //                 hasFinalOutputs = true;
    //                 outputs = await Metapage.deserializeInputs(outputs);
    //                 if (outputs["Float32Array"] instanceof Float32Array) {
    //                     disposeListener();
    //                     resolve(true);
    //                     setStatus();
    //                 } else {
    //                     disposeListener();
    //                     reject(
    //                         `outputs['Float32Array']=${
    //                             outputs["Float32Array"]
    //                         } is not a Float32Array`,
    //                     );
    //                     setStatus();
    //                 }
    //             }
    //         });
    //     });
    // }),

    new Test(
        `all metaframe report tests pass`,
        // check that all metaframe have
        // outputs["tests"] = "OK"
        (metapage) => { // metapage instance
            return new Promise((resolve, reject) => {
                try {
                    let disposeListener;

                    const onStateChange = (metapageState) => {
                        const metapageIds = metapage.getMetaframeIds();

                        var metaframeIdsPassed = {};
                        Object.keys(metapageState.metaframes.outputs).forEach(
                            (metaframeId) => {
                                if (
                                    metapageState.metaframes
                                        .outputs[metaframeId] &&
                                    metapageState.metaframes
                                            .outputs[metaframeId].tests ===
                                        "pass"
                                ) {
                                    metaframeIdsPassed[metaframeId] =
                                        true;
                                }
                            },
                        );

                        const idsPassed = Object.keys(
                            metaframeIdsPassed,
                        );
                        idsPassed.sort();
                        if (
                            idsPassed.length === metapageIds.length
                        ) {
                            disposeListener();
                            resolve(true);
                            setStatus();
                        } else {
                            console.log(
                                `Metaframe tests pass: [${
                                    idsPassed.join(",")
                                }] (${idsPassed.length} / ${
                                    metapageIds.length
                                })`,
                            );
                        }
                    };
                    // initial value send immediately
                    metapage.addListener(Metapage.STATE, onStateChange);
                    disposeListener = () =>
                        metapage.removeListener(Metapage.STATE, onStateChange);
                    onStateChange(metapage.getState());
                } catch (err) {
                    console.error(err);
                    reject(err);
                }
            });
        },
    ),
];

// Define the metapage definition dynamically
const metaPageDefinition = {
    version: "2", //convertNpmToInternalVersion(VERSION),
};

const metaframesBlob = {};

metaPageDefinition.metaframes = metaframesBlob;

// create a metaframe for each version, plus the latest if we're developing
// if developing, the latest goes at the beginning AND end, to test getting
// and sending to the parent metapage
VERSIONS_METAFRAME.forEach((versionMetaframe, index) => {
    versionMetaframe =
        versionMetaframe == "latest" && index == 0 &&
            VERSIONS_METAFRAME.length > 1
            ? "latest-begin"
            : versionMetaframe;
    let url = `/test/metaframe/${testname}/${versionMetaframe}`;
    if (debug) {
        url += "?debug=true&mp_debug=true";
    }

    metaframesBlob[versionMetaframe] = { "url": url };
    if (index > 0) {
        metaframesBlob[versionMetaframe].inputs = [
            {
                metaframe: VERSIONS_METAFRAME[index - 1],
                source: "output1",
                target: "input1",
            },
            {
                metaframe: VERSIONS_METAFRAME[index - 1],
                source: "output2",
                target: "input2",
            },
        ];

        // add the pipes for the blob types
        // TODO: add them back in
        // BlobTypes.forEach((blobType) => {
        //     metaframesBlob[versionMetaframe].inputs.push({
        //         metaframe: VERSIONS_METAFRAME[index - 1],
        //         source: blobType,
        //     });
        // });
    }
});


console.log("metaPageDefinition", JSON.stringify(metaPageDefinition, null, 2));
// set the Metapage class into the window object for easier manipulation later
globalThis.Metapage = Metapage;
let metapageInstance;
if (version === "latest" || compareVersions(version, "1.0.0") >= 0) {
    metapageInstance = await Metapage.from(metaPageDefinition);
} else {
    metapageInstance = Metapage.from(metaPageDefinition);
}

globalThis.metapageInstance = metapageInstance;

if (debug) {
    metapageInstance.debug = true;
} else {
    metapageInstance.setDebugFromUrlParams();
}


// There was a refactor addEventListener -> addListener
if (!metapageInstance.addListener) {
    metapageInstance.addListener = metapageInstance.addEventListener;
    metapageInstance.removeListener = metapageInstance.removeEventListener;
}

globalThis.metaPageDefinition = metaPageDefinition;

// This is just for debugging
// metapage.addListener(Metapage.INPUTS, (e) => {
//     const metaframeId = Object.keys(e)[0];
//     console.log(`METAPAGE inputs event [${metaframeId}][${Object.keys(e[metaframeId]).join(", ")}]`, e);
//     console.log('METAPAGE inputs total', metapage._inputsState);
// });

const promises = TESTS.map((test) => test.run(metapageInstance));

// add the metaframe iframes to the page
var metaframeIds = metapageInstance.metaframeIds();
// Add the metaframe iframes to the page

const column1 = document.createElement("div");
column1.style = "display: flex; flex-direction: column;";
const title1 = document.createElement("h3");
title1.textContent = "Metaframes";
column1.appendChild(title1);

const row = document.createElement("div");
row.style = "display: flex; flex-direction: row; gap: 10px;";

row.appendChild(column1);
document.getElementById("body").appendChild(row);

for (const metaframeId of metaframeIds) {
    const iframe = await metapageInstance.getMetaframe(metaframeId).iframe;
    column1.appendChild(iframe);
}

Promise.all(promises)
    .then(() => {
        document.body.style.backgroundColor = "green";
        setStatus();
    })
    .catch((err) => {
        document.body.style.backgroundColor = "red";
        setStatus(err);
    });

setStatus();
