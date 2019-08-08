---
layout: vanilla
---

<head>
<base target="_parent">
<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
<script src="https://cdn.jsdelivr.net/npm/markdown-it@9.0.0/dist/markdown-it.min.js" ></script>
<link rel="stylesheet" href="//cdn.rawgit.com/milligram/milligram/master/dist/milligram.min.css">
{% include metaframe_lib_script.html %}
</head>

<body>

<div id="markdown"></div>

<script>
var md = window.markdownit();

const setMarkdown = (text) => {
    var result = md.render(text);
    document.getElementById('markdown').innerHTML = result;
}

let gotMetaframeInput = false;

// returns the text from a url like: https://www.foo.com/?url=http://my.thing.to.download
const getContentFromURLParam = async (key) => {
    key = key ? key : 'url';
    let url = new URL(window.location.href).searchParams.get(key);
    url = url ? url : 'help.md';
    const resp = await fetch(url)
    const payload = await resp.text();
    return payload;
}

const run = async () => {
    if (!gotMetaframeInput) {
        let url = new URL(window.location.href);
        if (url.searchParams.get('md')) {
            const urlDecoded = decodeURIComponent(url.searchParams.get('md'));
            setMarkdown(urlDecoded);
        } else {
            const urlParamValueUrl = await getContentFromURLParam('url');
            if (urlParamValueUrl) {
                setMarkdown(urlParamValueUrl);
            }
        }
    }
}

const metaframe = new Metaframe();
metaframe.onInputs((inputs) => {
    var oneKey = Object.keys(inputs)[0];
    if (!oneKey) {
        return;
    }
    let data = inputs[oneKey];
    if (data) {
        gotMetaframeInput = true;
        if (oneKey.endsWith('json')) {
            data = '```\n' + data + '\n```';
        }
        // we do some checking on the pipes
        setMarkdown(data);
    }
});

run();

</script>
</body>



