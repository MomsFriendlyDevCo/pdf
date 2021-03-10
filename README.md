@MomsFriendlyDevCo/PDF
======================
Generate dynamic PDFs using Vue templates and Prince.

* Uses [@MomsFriendlyDevCo/Vue-Template](https://github.com/MomsFriendlyDevCo/vue-template) for templating allowing full Vue templating
* Uses [Prince](https://github.com/rse/node-prince) to render PDFs avoiding Puppeteer madness


```javascript
// Standalone generator
(new PDF())
	.templatePath('./test/data/simple.html')
	.data({
		title: 'Hello World',
		signoff: 'Yours happily',
		customer: {
			name: 'Joe Random',
			email: 'joe@mailinator.com',
			pets: [
				{name: 'Cookie', type: 'Cat'},
				{name: 'Fido', type: 'Dog'},
			],
		},
	})
	.asFile()
	.then(path => /* Do something with the output PDF path on disk */)
```

```javascript
// Example within Express
app.get('/api/generate-pdf', (req, res) => {
	(new PDF())
		.templatePath('./test/data/simple.html')
		.data({title: 'Hello World'}) // Shorted version of the above
		.asStream()
		.then(steam => stream.pipe(res)) // Pipe PDF into Express response
})
```


API
===

PDF (constructor)
-----------------
Initiate the PDF instance and populate default options.


templatePath(path)
------------------
Set the local file path of the HTML template to use.
Returns the chainable class instance.


template(html)
--------------
Set the raw HTML contents of the template.
Returns the chainable class instance.


data(dataObject)
----------------
Specify the data to use when rendering the template.
Returns the chainable class instance.


as(type)
--------
Specify the type of output after generating.
This can be used explicitly with `generate()` or wrapped as a promise using one of the `asBuffer()`, `asFile()`, `asStream()` convenience functions.
Returns the chainable class instance.

```javascript
(new PDF())
	.templatePath(`${__dirname}/data/simple.html`)
	.data({title: 'Hello World'})
	.asFile('stream')
	.then(stream => /* Do something with the output stream */)
```


generate(data) / asBuffer(data) / asFile(data) / asStream(data)
---------------------------------------------------------------
Convenience functions to set the output type + run `generate()` + return a promise.
Accepts an optional data object which is passed to `data()` if specified.
Returns a promise which resolves with the desired type.
