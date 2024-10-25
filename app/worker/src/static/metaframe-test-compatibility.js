// Download the specific metaframe library version
// to make it easier to test all versions against all
const url = new URL(window.location.href);
var version = url.pathname.split('/').filter(e => e !== '')[3] || "latest"; 
const importURl = `${version === "latest" ? "/lib/metapage/index.js" : "https://cdn.jsdelivr.net/npm/@metapages/metapage@" + version.split("-")[0]}`;
const { Metaframe } = await import(importURl);

const debug = ["debug", "mp_debug"].reduce((exists, flag) => {
    return exists || url.searchParams.get(flag) === "true" || url.searchParams.get(flag) === "1"
}, false);
if (debug) {
    console.log("❗🏗️ FRAME debug");
}

// the URL param VERSION=latest-begin is a way of having
// the same metaframe in multiple places without
// id/key collisions. The actual version of 'latest-begin'
// is 'latest' which we check below, but we want to display
// the version given
const DISPLAY_VERSION = version;

if (version.startsWith('latest')) {
    // it can be versionLatest in the URL header but the internal VERSION must then be 'latest';
    version = 'latest';
}

let TESTS;

const getStatusText = () => {
    return TESTS.map((test) => test.getText()).join("");
};

const setStatus = () => {
    document.getElementById('status').innerHTML = getStatusText();
};

// Use for (de)serialization tests
const BlobTypes = ["File", "Blob", "ArrayBuffer", "Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float32Array", "Float64Array", "BigInt64Array", "BigUint64Array"];

class Test {
    constructor(description, testFunc) {
        this.description = description;
        this.testFunc = testFunc;
        this.success = false;
    }

    async run(metaframe) {
        this.metaframe = metaframe;
        this.success = await this.testFunc(metaframe);
        setStatus();
        return this.success;
    }

    getText() {
        // don't show anything if this test is skipped
        if (!this.metaframe) {
            return "";
        }
        return `<br/> ${this.success ? "✓" : "⌛"}: ${this.description}`;
    }
}

TESTS = [
    new Test('save inputs to metapage',
        // verify that when setting inputs, they are sent to the metapage
        // then sent back, which we listen to here
        (mf) => { // metaframe instance
            return new Promise((resolve, reject) => {
                let unbind;
                unbind = mf.onInput('save-input-check', function(value) {
                    if (value == mf.id) {
                        resolve(true);
                    } else {
                        reject(`'save-input-check' != '${mf.id}'`);
                    }
                    unbind();
                });
                // send the inputs to the metapage, we listen to the event above
                mf.setInput('save-input-check', mf.id);
            });
        }
    ),

    new Test('receive then send',
        // verify that the metaframe got data from the pipe (confusingly named "input1")
        (mf) => { // metaframe instance
            return new Promise((resolve, reject) => {
                let unbind;
                unbind = mf.onInput('input1', function(value) {
                    // wait a tick to make sure the metapage has had a chance to update
                    setTimeout(() => {
                        resolve(true);
                    }, 100);
                    unbind();
                });
            });
        }
    ),


    // new Test(BlobSerializationCompatible ? 'File, TypedArray etc (de)serialization' + (DISPLAY_VERSION.includes("-begin") ? " (just sending)" : ""): 'IGNORED BECAUSE TOO OLD: File, TypedArray etc (de)serialization',
    //     // verify that when setting inputs, they are sent to the metapage
    //     // then sent back, which we listen to here
    //     (mf) => { // metaframe instance
    //         // the sample test data
    //         const numbers = [1, 5, 10, 8, 1, 5, 10, 8];
    //         const sampleInputs = {
    //             "File": new File(["foo"], "foo.txt", {type: "text/plain;charset=utf-8"}),
    //             "Blob": new Blob(["foo"], {type: "text/plain;charset=utf-8"}),
    //             "ArrayBuffer": new ArrayBuffer(8),
    //             "Int8Array": Int8Array.from(numbers),
    //             "Uint8Array": Uint8Array.from(numbers),
    //             "Uint8ClampedArray": Uint8ClampedArray.from(numbers),
    //             "Int16Array": Int16Array.from(numbers),
    //             "Uint16Array": Uint16Array.from(numbers),
    //             "Int32Array": Int32Array.from(numbers),
    //             "Uint32Array": Uint32Array.from(numbers),
    //             "Float32Array": Float32Array.from(numbers),
    //             "Float64Array": Float64Array.from([]),
    //             "BigInt64Array": BigInt64Array.from([]),
    //             "BigUint64Array": BigUint64Array.from([]),
    //         };

    //         // metaframes pass downstream directly all the blob types
    //         const inputsFileBlobHandler = inputs => {

    //             const keys = Object.keys(inputs);
    //             const newOutputs = {};
    //             keys.forEach(key => {
    //                 if (BlobTypes.includes(key)) {
    //                     newOutputs[key] = inputs[key];
    //                 }
    //             });
    //             mf.setOutputs(newOutputs);
    //         };
    //         // This calls the handled immediately with the current value
    //         mf.onInputs(inputsFileBlobHandler);

    //         if (DISPLAY_VERSION.includes("-begin")) {
    //             // First metaframe in the chain just sends the blobs
    //             if (BlobSerializationCompatible) {
    //                 mf.setOutputs(sampleInputs);
    //             } else {
    //                 throw "A metaframe where BlobSerializationCompatible=false cannot be the first metaframe in the chain";
    //                 mf.setOutputs(Object.fromEntries(Object.keys(sampleInputs).map(key => [key, "UNSUPPORTED"])));
    //             }
    //             // the later metaframe will actually check the blobs
    //             return Promise.resolve(true);
    //         } else {
    //             // All other metaframes just pass the blobs, but Blob serialization capable
    //             // metaframes check the types of the blobs

    //             const localBlobTypesRemaining = [...BlobTypes];
    //             return new Promise((resolve, reject) => {
    //                 // The actual test but only for newer versions
    //                 let unbind;
    //                 unbind = mf.onInputs(function(inputs) {
    //                     // if we get a blob type, remove it from the list
    //                     // and resolve when all done
    //                     Object.keys(inputs).forEach(async (key) => {
    //                         // ignore non-blob types
    //                         if (!BlobTypes.includes(key)) {
    //                             return;
    //                         }

    //                         if (BlobSerializationCompatible) {
    //                             // Do actual test of the type
    //                             // console.log('inputs[key] instanceof sampleInputs[key].constructor', inputs[key] instanceof sampleInputs[key].constructor);
    //                             // console.log('inputs[key]', inputs[key]);
    //                             // console.log('sampleInputs[key].constructor', sampleInputs[key].constructor);
    //                             if (!(inputs[key] instanceof sampleInputs[key].constructor)) {
    //                                 reject(`'${key}'=>${inputs[key]} is not an instance of ${sampleInputs[key].constructor.name}`);
    //                             }

    //                             if (key === Blob.name) {
    //                                 const blob = inputs[key];
    //                                 // console.log('blob', blob);
    //                                 const text = await blob.text();
    //                                 if (text !== "foo") {
    //                                     reject(`lob '${key}' text is not 'foo'`);
    //                                 }
    //                             }
    //                         }

    //                         if (localBlobTypesRemaining.includes(key)) {
    //                             const index = localBlobTypesRemaining.indexOf(key);
    //                             localBlobTypesRemaining.splice(index, 1);
    //                         }

    //                         if (localBlobTypesRemaining.length === 0) {
    //                             resolve(true);
    //                             unbind();
    //                         }
    //                     });


    //                 });
    //             });
    //         }
    //     }
    // ),


];


// start the tests
// instantiate the metaframe object
var mf = new Metaframe();
if (debug) {
    mf.debug = true;
}
// current implementation is Metaframe.connected
await mf.connected();

if (!mf.id) {
    throw 'Metaframe claims ready but missing .id';
}

document.body.style.backgroundColor = mf._color || mf.color;

const promises = TESTS.map((test) => test.run(mf));

// This is our part of the metaframe daisy chain.
// When we get a input [input], we read the array from the "versions"
// field (or create one) and append our version to the array, then
// send the value to the output: { "output": { "versions": [...] } }

// The metaframe is expecting an array of versions
const getOutputValueFromInputValue = (inputValue) => {
    if (inputValue == null) {
        return;
    }

    // When I get the input array, add my version to the list
    // This will be passed around to all metaframe in the version list
    if (typeof(inputValue) === 'object') {
        const newValue = {...inputValue}
        newValue.versions = inputValue.versions ? inputValue.versions : [];
        newValue.versions.push(DISPLAY_VERSION);
        return newValue;
    }
}

const inputs1Handler = inputs => {
    const newValue1 = getOutputValueFromInputValue(inputs['input1']);
    const newValue2 = getOutputValueFromInputValue(inputs['input2']);
    if (newValue1 || newValue2) {
        const newOutputs = {};
        if (newValue1) {
            newOutputs['output1'] = newValue1;
        }
        if (newValue2) {
            newOutputs['output2'] = newValue2;
        }
        mf.setOutputs(newOutputs);
    }
};

// This calls the handled immediately with the current value
mf.onInputs(inputs1Handler);

setStatus();

try {
    await Promise.all(promises);
    document.body.style.backgroundColor = "green";
    setStatus();
    // the metapage can listen for this change
    mf.setOutput('tests', 'pass');
} catch (err) {
    console.error(err);
    document.body.style.backgroundColor = "red";
    setStatus();
}
