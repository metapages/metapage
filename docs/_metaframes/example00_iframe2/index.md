---
layout: vanilla
---

<style>
  body {
      background-color: #FFCCE6;
  }
</style>
<script src="{{site.baseurl}}{{site.data.urls.promise_polyfill}}"></script>

Metaframe 2 (an iframe)

<div id="input"></div>

{% include metaframe_lib_script.html %}
<script>
var letters = '♞☯☭☢€☎∞❄♫☂★☀✓❤✆✇✈✂✄❀❁❂❃✻✼✽✾✿✧✨✩✪✫✍✎✏';

var connection = new Metaframe();

connection.onInput('fooIn', function(value) {
  connection.log('got fooIn: ' + value);
	var display = document.getElementById("input");
	if (value === undefined) {
		value = "";
	}
	display.innerHTML = value;
	setTimeout(function() {
		value = value + letters[Math.floor(Math.random()*letters.length)];
    connection.setOutput("barOut", value);
    connection.log('Sending barOut:' + value);
		display.innerHTML = "";
	}, 2000);
});

</script>


When I get input data, I will send the string back out a pipe with the same name, randomly adding one of these characters:

♞☯☭☢€☎∞❄♫☂★☀✓❤✆✇✈✂✄❀❁❂❃✻✼✽✾✿✧✨✩✪✫✍✎✏