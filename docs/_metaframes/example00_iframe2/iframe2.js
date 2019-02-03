var letters = '♞☯☭☢€☎∞❄♫☂★☀✓❤✆✇✈✂✄❀❁❂❃✻✼✽✾✿✧✨✩✪✫✍✎✏';

var connection = new metaframe.Metaframe({debug:false});

connection.onInput('fooIn', function(blob) {
	var display = document.getElementById("input");
	var value = blob.value;
	if (value === undefined) {
		value = "";
	}
	display.innerHTML = value;
	setTimeout(function() {
		value = value + letters[Math.floor(Math.random()*letters.length)];
		connection.setOutput("barOut", {value:value});
		display.innerHTML = "";
	}, 2000);
});
