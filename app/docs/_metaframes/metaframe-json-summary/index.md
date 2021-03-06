---
---

<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/siimple@3.3.1/dist/siimple.css">
<link rel="stylesheet" href="https://unpkg.com/json-summary@1.1.0/dist/summarizer.css">
<script src="https://unpkg.com/json-summary@1.1.0/dist/json-summary.min.js" ></script>
{% include metaframe_lib_script.html %}
</head>

<body>

<div id="key" class="siimple-alert siimple-alert--primary">Waiting for JSON data...</div>
<div id="json"></div>

<script>

const setJsonVal = (name, blob) => {
    document.getElementById("key").innerText = name;
    let summary = jsonSummary.summarize(blob);

    const options = {};
    let htmlString = jsonSummary.printSummary(summary, options);
    document.getElementById("json").class = '';
    document.getElementById("json").innerHTML = htmlString;
}

const metaframe = new metapage.Metaframe();
metaframe.onInputs((inputs) => {
	var oneKey = Object.keys(inputs)[0];
	if (!oneKey) {
		return;
	}
    let data = inputs[oneKey];

    if (typeof(data) === 'string') {
        // try to JSON parse
        try {
            data = JSON.parse(data);
            setJsonVal(oneKey, inputs[oneKey]);
        } catch (err) {
            document.getElementById("key").innerText = oneKey;
            document.getElementById("json").innerHTML = `<div class="siimple-alert siimple-alert--error">${err}</div>`;
        }
    } else {
        setJsonVal(oneKey, inputs[oneKey]);
    }
});

</script>
</body>
</html>
