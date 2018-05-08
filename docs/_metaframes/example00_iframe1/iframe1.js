---
---

var connection = new Metaframe({debug:false});

var letters = '♞☯☭☢€☎∞❄♫☂★☀✓❤✆✇✈✂✄❀❁❂❃✻✼✽✾✿✧✨✩✪✫✍✎✏';

var value = letters[Math.floor(Math.random()*letters.length)];

connection.onInput('barIn', function(blob) {
	var display = document.getElementById("input");
	var value = blob.value;
	if (value === undefined) {
		value = "";
	}
	display.innerHTML = value;
	setTimeout(function() {
		value = value + letters[Math.floor(Math.random()*letters.length)];
		if (value.length > 30) {
			value = letters[Math.floor(Math.random()*letters.length)];
		}
		connection.setOutput({name:"fooOut", value:value});
		display.innerHTML = "";
	}, 2000);
});

connection.ready.then(function(_) {
	connection.setOutput({name:"fooOut", value:value});
});
