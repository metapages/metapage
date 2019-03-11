---
layout: vanilla
---
<head>
	<style>
		html { height: 100%; }
		body { min-height: 100%; }
	</style>
	<script src="{{site.baseurl}}{{site.data.urls.promise_polyfill}}"></script>
</head>
<body>
	<!-- <link rel="stylesheet" href="pure-min.css"> -->
    {% include metaframe_lib_script.html %}
	Send the label on the button_out channel:
	<!-- <div id="content"> -->
    	<button id="button1" class="pure-button">Add Category1</button>
    	<button id="button2" class="pure-button">Add Category2</button>
    	<button id="button3" class="pure-button">Add Category3</button>
	<!-- </div> -->
	<script>
/* Set up the metaframe channel */
var metaframe = new metaframe.Metaframe();

metaframe.ready.then(function() {
	metaframe.sendDimensions();
}, function(err) {
	console.error('Error setting up the metaframe connection');
});

/* Push random numbers to the next page every time the button is clicked */
document.getElementById("button1")
	.addEventListener('click', function() {
		metaframe.setOutput("button_out", "Category1");
	});

document.getElementById("button2")
	.addEventListener('click', function() {
		metaframe.setOutput("button_out", "Category2");
	});

document.getElementById("button3")
	.addEventListener('click', function() {
		metaframe.setOutput("button_out", "Category3");
	});

	</script>
</body>
