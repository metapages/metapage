/* Set up the metaframe channel */
var metaframe = new Metaframe({debug:false});

metaframe.ready.then(function() {
	metaframe.sendDimensions();
}, function(err) {
	console.error('Error setting up the metaframe connection');
});

/* Push random numbers to the next page every time the button is clicked */
document.getElementById("button1")
	.addEventListener('click', function() {
		var val = "Category1";
		metaframe.setOutput({name:"button_out", value:val});
	});

document.getElementById("button2")
	.addEventListener('click', function() {
		var val = "Category2";
		metaframe.setOutput({name:"button_out", value:val});
	});

document.getElementById("button3")
	.addEventListener('click', function() {
		var val = "Category3";
		metaframe.setOutput({name:"button_out", value:val});
	});