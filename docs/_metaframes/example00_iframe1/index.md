---
layout: vanilla
---

<style>
   body {
       background-color: #93B874;
   }
</style>

<script src="{{site.baseurl}}{{site.data.urls.promise_polyfill}}"></script>

Metaframe 1 (an iframe)

<div id="input" style="outline-width: 1px;"></div>


{% include metaframe_lib_script.html %}
<script>
var connection = new metaframe.Metaframe();

var letters = '♞☯☭☢€☎∞❄♫☂★☀✓❤✆✇✈✂✄❀❁❂❃✻✼✽✾✿✧✨✩✪✫✍✎✏';

var value = letters[Math.floor(Math.random()*letters.length)];

connection.onInput('barIn', function(value) {
    connection.log('got barIn: ' + value);
	var display = document.getElementById("input");
	if (value === undefined) {
		value = "";
	}
	display.innerHTML = value;
	setTimeout(function() {
		value = value + letters[Math.floor(Math.random()*letters.length)];
		if (value.length > 30) {
			value = letters[Math.floor(Math.random()*letters.length)];
		}
        connection.setOutput("fooOut", value);
        connection.log('Sending fooOut:' + value);
		display.innerHTML = "";
	}, 2000);
});

connection.ready.then(function(_) {
	connection.setOutput("fooOut", value);
});

</script>

When I get input data, I will send the string back out a pipe with the same name, randomly adding one of these characters:

♞☯☭☢€☎∞❄♫☂★☀✓❤✆✇✈✂✄❀❁❂❃✻✼✽✾✿✧✨✩✪✫✍✎✏


