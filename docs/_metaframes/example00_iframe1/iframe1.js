---
---

var connection = new Metaframe({debug:false});

var letters = '♞☯☭☢€☎∞❄♫☂★☀✓❤✆✇✈✂✄❀❁❂❃✻✼✽✾✿✧✨✩✪✫✍✎✏';

var value = letters[Math.floor(Math.random()*letters.length)];

connection.onInput('barIn', function(value) {
	var display = document.getElementById("input");
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
	connection.log('READY');
	connection.setOutput({name:"fooOut", value:value});
});
