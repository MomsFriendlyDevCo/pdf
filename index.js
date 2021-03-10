var cheerio = require('cheerio');
var fs = require('fs');
var pdftk = require('node-pdftk');
var prince = require('prince');
var temp = require('temp');
var vueTemplate = require('@momsfriendlydevco/vue-template');

module.exports = class MFDCPDF {

	// templatePath() {{{
	/**
	* The template type to use
	* @type {string}
	*/
	_templateType = 'path';


	/**
	* HTML or path to file to use as the template
	* @type {string}
	*/
	_templateSource = '';


	/**
	* Set a template source from a filesystem path
	* @param {string} path Path to retrieve the template from
	* @returns {MFDCPDF} This chainable instance
	*/
	templatePath(path) {
		this._templateType = 'path';
		this._templateSource = path;
		return this;
	};


	/**
	* Set a raw template from a string
	* @param {string} template HTML contents to use as the template
	* @returns {MFDCPDF} This chainable instance
	*/
	template(template) {
		this._templateType = 'string';
		this._templateSource = path;
		return this;
	};
	// }}}

	// data() {{{
	/**
	* Data to use when rendering the template
	* @type {Object}
	*/
	_data = {};


	/**
	* Setter for template data
	* @param {Object} data Data to use when rendering the template
	* @returns {MFDCPDF} This chainable instance
	*/
	data(data) {
		this._data = data;
		return this;
	};
	// }}}

	// as() {{{
	/*
	* Output type requested
	* @type {string}
	*/
	_as = 'file';


	/**
	* Setter for output type
	* @param {string} as The output type requested, can be 'file', 'buffer' or 'stream'
	*/
	as(as) {
		this.as = as;
		return this;
	};
	// }}}

	// Fixes {{{
	/**
	* Indicate that we should add a dummy first page (+ remove it after we generated the PDF) to fix the initial-page render issue
	* @type {boolean}
	*/
	_fixFirstPage = true;
	// }}}

	// generate() {{{
	/**
	* Compile the template and generate the PDF
	* @param {object} [data] Optional data to use when compiling the template - calls `data()` internally if specified
	* @returns {Promise<MFDCPDF>} A promise which will return this class instance when completed
	*/
	generate(data) {
		if (data) this.data(data);

		var session = {
			princeInputPath: temp.path({prefix: 'mfdc-pdf-in-', suffix: '.html'}),
			princeOutputPath: temp.path({prefix: 'mfdc-pdf-out-', suffix: '.pdf'}),
		};

		return Promise.resolve()
			.then(()=>
				this._templateType == 'path' ? fs.promises.readFile(this._templateSource, 'utf-8') // Read template file
				: this._templateType == 'string' ? this._templateSource
				: Promise.reject(`Unknown template source "${this._templateSource}"`)
			)
			.then(template => vueTemplate(template)(this._data)) // Compile template
			.then(contents => { // Apply fixFirstPage fix (part 1)
				if (this._fixFirstPage) {
					var $ = cheerio.load(contents);
					$('body').prepend('<h1 style="page-break-after: always">First page</h1>');

					return $.html();
				} else {
					return contents;
				}
			})
			.then(contents => fs.promises.writeFile(session.princeInputPath, contents, 'utf-8'))
			.then(()=> prince()
				.inputs(session.princeInputPath)
				.output(session.princeOutputPath)
				.execute()
			)
			.then(()=> this._fixFirstPage && pdftk // Apply fixFirstPage fix (part 2)
				.input(session.princeOutputPath)
				.cat('2-end')
				.output(session.princeOutputPath)
			)
			.then(()=> {
				var cleanup = ()=> fs.promises.unlink(session.princeOutputPath);

				switch (this._as) {
					case 'buffer':
						return fs.promise.readFile(session.princeOutputPath)
							.finally(cleanup);
					case 'file':
						return session.princeOutputPath;
					case 'stream':
						return fs.createReadStream(session.princeOutputPath)
							.on('end', cleanup);
					default:
						throw new Error(`Unknown output type "${this._as}"`);
				}
			})
	}
	// }}}

	// as*() convenience functions {{{
	/**
	* Generate the templated PDF as a buffer
	* @param {object} [data] Optional data to use when compiling the template - calls `data()` internally if specified
	* @returns {Promise<Buffer>} A promise which will return the compiled PDF as a buffer
	*/
	asBuffer(data) {
		return this.as('buffer').generate(data);
	}


	/**
	* Generate the templated PDF as a file path
	* @param {object} [data] Optional data to use when compiling the template - calls `data()` internally if specified
	* @returns {Promise<string>} A promise which will return the compiled PDF output path - no auto-delete is conducted on the output file
	*/
	asFile(data) {
		return this.as('file').generate(data);
	}


	/**
	* Generate the templated PDF as a readable stream
	* @param {object} [data] Optional data to use when compiling the template - calls `data()` internally if specified
	* @returns {Promise<Stream>} A promise which will return the compiled PDF as a Steam.Readable
	*/
	asSteam(data) {
		return this.as('stream').generate(data);
	}
	// }}}

};
