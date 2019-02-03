/* Set up the metaframe channel */
var metaframe = new metaframe.Metaframe({debug:false});

metaframe.ready.then(function() {
	metaframe.sendDimensions();
}, function(err) {
	console.error('Error setting up the metaframe connection');
});

/* Push random numbers to the next page every time the button is clicked */
document.getElementById("button1")
	.addEventListener('click', function() {
		metaframe.setOutput("button_out", {value:"Category1"});
	});

document.getElementById("button2")
	.addEventListener('click', function() {
		metaframe.setOutput("button_out", {value:"Category2"});
	});

document.getElementById("button3")
	.addEventListener('click', function() {
		metaframe.setOutput("button_out", {value:"Category3"});
	});
