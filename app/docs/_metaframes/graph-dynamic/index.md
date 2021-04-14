---
layout: vanilla
---

<head>
<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
<script src="https://cdn.plot.ly/plotly-1.47.1.min.js"></script>
{% include metaframe_lib_script.html %}
</head>
<body>
<div class="wrapper">
    <div id="chart" style="max-height:300px;" ></div>
</div>
<script>

var layout = {
    title:false,
    margin: {
        l: 50,
        r: 50,
        b: 50,
        t: 50,
        pad: 4
    }
};

Plotly.plot('chart',[{
    y:[],
    type:'line'
}], layout, {displayModeBar: false});

const metaframe = new Metaframe();

var cnt = 0;
metaframe.onInput('y', (y) => {
    Plotly.extendTraces('chart',{ y:[[y]]}, [0]);
    cnt++;
    if(cnt > 500) {
        Plotly.relayout('chart',{
            xaxis: {
                range: [cnt-500,cnt]
            }
        });
    }
});


</script>
</body>
