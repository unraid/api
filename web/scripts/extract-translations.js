const { GettextExtractor, JsExtractors, HtmlExtractors } = require('gettext-extractor');

// Create an extractor instance
const extractor = new GettextExtractor();

// Create a parser for Vue template sections
extractor
  .createHtmlParser([
    // Extract translations from elements with v-translate attribute
    HtmlExtractors.elementAttribute('*', 'v-translate', {
      attributes: {}
    }),
    // Extract translations from elements with v-t attribute
    HtmlExtractors.elementAttribute('*', 'v-t', {
      attributes: {}
    }),
    // Extract translations from translate elements/attributes
    HtmlExtractors.elementContent('translate, [translate]')
  ])
  .parseFilesGlob('./components/**/*.vue', { encoding: 'utf8' })
  .parseFilesGlob('./src/**/*.html', { encoding: 'utf8' });

// Create a parser for JS/TS translations
extractor
  .createJsParser([
    // Vue translations
    JsExtractors.callExpression('$gettext', {
      arguments: {
        text: 0
      }
    }),
    JsExtractors.callExpression('$t', {
      arguments: {
        text: 0
      }
    }),
    JsExtractors.callExpression('$ngettext', {
      arguments: {
        text: 0,
        textPlural: 1
      }
    }),
    JsExtractors.callExpression('$pgettext', {
      arguments: {
        context: 0,
        text: 1
      }
    }),
    // Custom translations
    JsExtractors.callExpression('getText', {
      arguments: {
        text: 0,
        context: 1
      }
    }),
    JsExtractors.callExpression('getPlural', {
      arguments: {
        text: 1,
        textPlural: 2,
        context: 3
      }
    })
  ])
  .parseFilesGlob('./components/**/*.vue', { encoding: 'utf8' })
  .parseFilesGlob('./src/**/*.@(ts|js|tsx|jsx)', { encoding: 'utf8' });

// Save the translations to a .pot file
extractor.savePotFile('./messages.pot', {
  'Project-Id-Version': 'Unraid Web',
  'Content-Type': 'text/plain; charset=UTF-8'
});

// Print extraction statistics
console.log('\nExtraction completed!');

try {
  extractor.printStats();
} catch {
  console.log('Extraction stats unavailable due to chalk dependency issue.');
  console.log(`Saved translations to messages.pot`);
} 