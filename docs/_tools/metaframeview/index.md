---
layout: vanilla
---

<head>
<script src="{{site.baseurl}}{{site.data.urls.axios_path}}"></script>
<script src="{{site.baseurl}}{{site.data.urls.jquery_path}}"></script>
<link rel="stylesheet" href="{{site.baseurl}}{{site.data.urls.bootstrap_path}}">
<link rel="stylesheet" href="styles.css">

<script src="{{site.baseurl}}{{site.data.urls.metapage_library_path}}"></script>
</head>

<body>

<h1>Metaframe inspector</h1>
<br/>
<form class="form-horizontal">
	<div class="form-group">
		<label for="inputUrl" class="col-sm-2 control-label">URL:</label>
		<div class="col-sm-9">
			<input type="url" class="form-control" id="inputUrl" placeholder="{{site.url}}{{site.baseurl}}/metaframes/example00_iframe1/">
		</div>
		<div class="col-sm-1">
			<button class="btn btn-default" type="button" id="buttonGoToUrl">GO</button>
		</div>
	</div>
</form>

<br/>

<div class="horizontal">
	<div >
			<div class="panel panel-default">
				<div class="panel-heading">
					<button class="btn btn-default" type="submit" id="addInputButton">Add input</button>
				</div>

				<div id="container" class="horizontal">
					<div>
						<table class="table table-bordered table-hover" id="inputs-table">
							<tr>
								<th>Name</th><th>Type</th><th>Value</th><th></th>
							</tr>
						</table>
					</div>
					<div>
					</div>
				</div>
			</div>
	</div>
	<div>
		<div class="InputArrow"></div>
		<button class="btn btn-default" type="submit" id="sendButton">Send</button>
	</div>
	<div >
		<div id="metaframes"></div>
		<div id="urlLink"></div>
	</div>
	<div class="InputArrow"></div>
	<div >
			<div class="panel panel-default">
				<div class="panel-heading">
					Outputs
				</div>

				<div class="row">
					<div class="col-md-12">
						<table class="table table-bordered table-hover" id="outputs-table">
						<tr>
							<th>Name</th><th>Value</th>
						</tr>
					</table>
					</div>
				</div>
			</div>
	</div>
</div>

</body>

<script src="index.js"></script>
