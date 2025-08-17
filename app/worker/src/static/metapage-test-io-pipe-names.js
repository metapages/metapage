// The metapage we use: 
const SourceMetapage = "https://metapage.io/dion/metapages-module-test-io-pipe-names-6a97801b3eed4b3d9d6f5d24b508f324";
const TestMetapageUrl = `${SourceMetapage}/metapage.json`;
// Download the specific metaPAGE library version
// to make it easier to test all versions against all
const { compareVersions } = window.compareVersions
const url = new URL(window.location.href);
// console.log(`url: ${url}`);
const urlPathElements = url.pathname.split("/").filter((e) =>
    e !== ""
);
var version = urlPathElements[3] || "latest";

const importURl = `${
    version === "latest"
        ? "/lib/metapage/index.js"
        : "https://cdn.jsdelivr.net/npm/@metapages/metapage@" +
            version.split("-")[0] + "/dist/index.js"
}`;

// console.log('importURl', importURl);
const { Metapage } = await import(importURl);

let debug = ["debug", "mp_debug"].reduce((exists, flag) => {
   return exists || url.searchParams.get(flag) === "true" || url.searchParams.get(flag) === "1"
}, false);

if (debug) {
    console.log("❗🏗️ PAGE debug");
}

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
    
    new Test("all outputs are named correctly", // Look to the outputs of the LAST metaframe, it should have an array
    // of the chain of metaframe versions the array has passed through
    (metapage) => { // metapage instance
        return new Promise((resolve, reject) => {
            let disposeListener;
            const onStateChange = (e) => {
                console.log("onStateChange", e);
                const outputs = metapage.getState().metaframes.outputs;
                const metaframeIds = metapage.metaframeIds();

                const filterMetaframesThatOutputSuccess = (id) => {
                    const url = metapage.getDefinition().metaframes[id].url;
                    const pathTokens = new URL(url).pathname.split("/");
                    const isFs = pathTokens[3] === "fs";
                    return !(isFs || url.startsWith("https://container.mtfm.io"));
                }

                const success = metaframeIds.filter(filterMetaframesThatOutputSuccess).every((id) => outputs[id]?.success);
                if (success) {
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
];

// Define the metapage definition dynamically
const resp = await fetch(TestMetapageUrl);
const metaPageDefinition = await resp.json();

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
column1.style = "display: flex; flex-direction: column; width: 100%;";
const title1 = document.createElement("h3");
title1.textContent = "Metaframes";
column1.appendChild(title1);

const row = document.createElement("div");
row.style = "display: flex; flex-direction: row; gap: 10px; width: 500px; min-height: 300px;";

row.appendChild(column1);
document.getElementById("body").appendChild(row);

for (const metaframeId of metaframeIds) {
    const iframe = await metapageInstance.getMetaframe(metaframeId).iframe;
    iframe.style = "width: 100%; height: 300px;";
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
