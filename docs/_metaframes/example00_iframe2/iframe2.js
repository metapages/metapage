var letters = '♞☯☭☢€☎∞❄♫☂★☀✓❤✆✇✈✂✄❀❁❂❃✻✼✽✾✿✧✨✩✪✫✍✎✏';

var connection = new Metaframe({debug:false});

connection.onInput('fooIn', function(value) {
	var display = document.getElementById("input");
	display.innerHTML = value;
	setTimeout(function() {
		value = value + letters[Math.floor(Math.random()*letters.length)];
		// console.log('Setting iframe2.barOut = ' + value);
		connection.setOutput({name:"barOut", value:value});
		display.innerHTML = "";
	}, 2000);
});