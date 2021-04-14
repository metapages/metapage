## Markdown viewer [metaframe](https://metapages.org/)

Displays formatted markdown.

You can send the raw markdown:

### via input pipes

Send any markdown text on any input pipe and this page will display the formatted markdown.

Some named pipes are special however:

`*json`: any pipe *ending with* json will be shown as a formatted markdown code block

### via URL parameter to an external location:

	https://metapages.org/metaframes/metaframe-markdown-it/?url=https://my.markdown.content

This downloads the content at `https://my.markdown.content` and shows the content as markdown.

### via URL parameter with markdown content embedded:

Add the URL encoded markdown text string to the URL parameter `md`:

	https://metapages.org/metaframes/metaframe-markdown-it/?md=<url encoded markdown>

For example:

[embedded markdown link]: https://metapages.org/metaframes/metaframe-markdown-it/?md=%23%20Example%20markdown%20embedded%20in%20the%20URL%0A%0AThis%20example%20metaframe%20has%20markdown%20embedded%20in%20the%20URL%20of%20the%20markdown-display%20metaframe.%20This%20text%20is%20embedded%20in%20the%20URL%20and%20shown%20here.%0A%0A%23%23%20And%20another%20subheading%0A
It%20just%20keeps%20going.

[https://metapages.org/metaframes/metaframe-markdown-it/?md=%23%20Example%20markdown%20embedded%20in%20the%20URL%0A%0AThis%20example%20metaframe%20has%20markdown%20embedded%20in%20the%20URL%20of%20the%20markdown-display%20metaframe.%20This%20text%20is%20embedded%20in%20the%20URL%20and%20shown%20here.%0A%0A%23%23%20And%20another%20subheading%0A
It%20just%20keeps%20going.][embedded markdown link]

This gives you a simple way to create static notes or help pages.