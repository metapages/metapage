/* Set up the metaframe channel */
var metaframe = new Metaframe({debug:false, showBanner:true});

metaframe.ready.then(function() {
	metaframe.sendDimensions();
}, function(err) {
	console.error('Error setting up the metaframe connection');
});

/* Push random numbers to the next page every time the button is clicked */
document.getElementById("button1")
	.addEventListener('click', function() {
		var val = "Category1";
		metaframe.setOutput("button_out", val);
	});

document.getElementById("button2")
	.addEventListener('click', function() {
		var val = "Category2";
		metaframe.setOutput("button_out", val);
	});

document.getElementById("button3")
	.addEventListener('click', function() {
		var val = "Category3";
		metaframe.setOutput("button_out", val);
	});