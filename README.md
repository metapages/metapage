# Metapages

## What is a *metapage*?

A **metapage** is a webpage that consists of embedded and connected webpages.

For documentation and examples: [https://pages.git.com/amagod/metapage](https://pages.git.com/amagod/metapage)

## Developers

### Getting started

#### Prerequisites

 - [Docker](https://docs.docker.com/engine/installation/)

Optional:

 - [Haxe](https://haxe.org/download/), a Javascript compiler.
 - [jq](https://stedolan.github.io/jq/)

#### Building the metapage/metaframe libraries

Clone the repo:

	git clone https://github.com/dionjwa/metapage.git
	cd metapage

Then build:

	docker-compose up

This builds the metapage/metaframe.js files in `docs/js`.

Or if you have haxe installed locally:

	haxe build.hxml

## Contact

To contact the authors, please post an issue.

## License

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.



