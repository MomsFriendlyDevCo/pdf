var expect = require('chai').expect;
var mlog = require('mocha-logger');
var PDF = require('..');
var pdfExtract = require('pdf-extract');

describe('Simple tests', ()=> {

	it('should generate a dynamic PDF', function() {
		this.timeout(10 * 1000); //~ 10s

		return (new PDF())
			.templatePath(`${__dirname}/data/simple.html`)
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
			.fix('firstPage')
			.asFile()
			.then(path => new Promise((resolve, reject) => { // Wrap the horrible pdf-extract parser into a promise
				mlog.log('PDF file available at', path);
				pdfExtract(path, {type: 'text'}, err => err && reject(err))
					.on('complete', parsed => resolve(parsed.text_pages.join('\n')))
			}))
			.then(outputPdfContents => {
				expect(outputPdfContents).to.match(/Hello World/);
				expect(outputPdfContents).to.match(/Dear Joe Random/);
				expect(outputPdfContents).to.match(/and your wonderful pets:/);
				expect(outputPdfContents).to.match(/Cookie the Cat/);
				expect(outputPdfContents).to.match(/Fido the Dog/);
			})
	})

});
