/**
 * Build script for bookmarklet
 * Concatenates all source files, removes CommonJS exports, minifies, and wraps in bookmarklet format
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

async function buildBookmarklet() {
  console.log('=== Building Assas Calendar Bookmarklet ===\n');

  try {
    // Step 1: Read all source files
    console.log('Step 1: Reading source files...');

    const srcRoot = path.join(__dirname, '..');
    const files = {
      utils: fs.readFileSync(path.join(srcRoot, 'src/utils.js'), 'utf8'),
      parser: fs.readFileSync(path.join(srcRoot, 'src/parser.js'), 'utf8'),
      icsGenerator: fs.readFileSync(path.join(srcRoot, 'src/ics-generator.js'), 'utf8'),
      studentIdExtractor: fs.readFileSync(path.join(__dirname, 'src/student-id-extractor.js'), 'utf8'),
      browserAdapter: fs.readFileSync(path.join(__dirname, 'src/browser-adapter.js'), 'utf8'),
      bookmarklet: fs.readFileSync(path.join(__dirname, 'src/main.js'), 'utf8')
    };

    console.log('✓ Read 6 source files\n');

    // Step 2: Remove CommonJS module syntax
    console.log('Step 2: Removing CommonJS syntax...');

    function cleanModuleSyntax(code) {
      return code
        // Remove require() statements
        .replace(/const\s+{[^}]+}\s*=\s*require\([^)]+\);?\n?/g, '')
        .replace(/const\s+\w+\s*=\s*require\([^)]+\);?\n?/g, '')
        // Remove module.exports
        .replace(/module\.exports\s*=\s*{[^}]+};?\n?/g, '')
        // Remove if (typeof module...) blocks
        .replace(/if\s*\(typeof\s+module[^}]+}\s*}\n?/g, '')
        // Remove empty lines
        .replace(/\n{3,}/g, '\n\n');
    }

    const cleaned = {
      utils: cleanModuleSyntax(files.utils),
      parser: cleanModuleSyntax(files.parser),
      icsGenerator: cleanModuleSyntax(files.icsGenerator),
      studentIdExtractor: cleanModuleSyntax(files.studentIdExtractor),
      browserAdapter: cleanModuleSyntax(files.browserAdapter),
      bookmarklet: cleanModuleSyntax(files.bookmarklet)
    };

    console.log('✓ Cleaned CommonJS syntax\n');

    // Step 3: Concatenate in correct dependency order
    console.log('Step 3: Concatenating files...');

    const combined = [
      '// === Utils ===',
      cleaned.utils,
      '',
      '// === Parser ===',
      cleaned.parser,
      '',
      '// === ICS Generator ===',
      cleaned.icsGenerator,
      '',
      '// === Student ID Extractor ===',
      cleaned.studentIdExtractor,
      '',
      '// === Browser Adapter ===',
      cleaned.browserAdapter,
      '',
      '// === Main Bookmarklet ===',
      cleaned.bookmarklet
    ].join('\n');

    console.log(`✓ Combined code: ${combined.length} bytes\n`);

    // Step 4: Save non-minified version (for debugging)
    const debugPath = path.join(__dirname, 'dist/bookmarklet.debug.js');
    fs.writeFileSync(debugPath, combined, 'utf8');
    console.log(`✓ Saved debug version: ${debugPath}\n`);

    // Step 5: Minify
    console.log('Step 4: Minifying...');

    const minified = await minify(combined, {
      compress: {
        dead_code: true,
        drop_console: false, // Keep console.log for debugging
        drop_debugger: true,
        unused: true
      },
      mangle: {
        toplevel: true,
        reserved: ['showStatus', 'extractStudentId', 'promptDateRange', 'promptGroupFilter',
                   'fetchCalendarData', 'filterEventsByGroup', 'parseDescription',
                   'generateIcs', 'downloadIcsFile']
      },
      format: {
        comments: false
      }
    });

    if (minified.error) {
      throw new Error(`Minification error: ${minified.error}`);
    }

    const minifiedCode = minified.code;
    console.log(`✓ Minified: ${minifiedCode.length} bytes (${Math.round(minifiedCode.length / combined.length * 100)}% of original)\n`);

    // Step 6: Save minified version
    const minPath = path.join(__dirname, 'dist/bookmarklet.min.js');
    fs.writeFileSync(minPath, minifiedCode, 'utf8');
    console.log(`✓ Saved minified version: ${minPath}\n`);

    // Step 7: Wrap in bookmarklet format
    console.log('Step 5: Creating bookmarklet...');

    const bookmarkletCode = `javascript:(function(){${minifiedCode}})();`;

    // Step 8: Save bookmarklet
    const bookmarkletPath = path.join(__dirname, 'dist/bookmarklet.txt');
    fs.writeFileSync(bookmarkletPath, bookmarkletCode, 'utf8');

    console.log(`✓ Saved bookmarklet: ${bookmarkletPath}\n`);

    // Step 7: Generate GitHub Pages installation page
    console.log('Step 7: Generating installation page...');

    const templatePath = path.join(__dirname, 'template.html');
    const docsDir = path.join(__dirname, '..', 'docs');
    const outputHtmlPath = path.join(docsDir, 'index.html');

    // Ensure docs directory exists
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Read template and inject bookmarklet code
    const template = fs.readFileSync(templatePath, 'utf8');

    // Escape bookmarklet code for safe injection into JavaScript string literal
    const escapedCode = bookmarkletCode
      .replace(/\\/g, '\\\\')   // Escape backslashes first
      .replace(/'/g, "\\'")      // Escape single quotes
      .replace(/\r/g, '\\r')     // Escape carriage returns
      .replace(/\n/g, '\\n');    // Escape newlines

    // Replace both placeholders:
    // - BOOKMARKLET_CODE_ESCAPED: for JavaScript variable (escaped)
    // - BOOKMARKLET_CODE_RAW: for textarea (raw, no escaping)
    const finalHtml = template
      .replace(/BOOKMARKLET_CODE_ESCAPED/g, escapedCode)
      .replace(/BOOKMARKLET_CODE_RAW/g, bookmarkletCode);

    fs.writeFileSync(outputHtmlPath, finalHtml, 'utf8');
    console.log(`✓ Generated installation page: ${outputHtmlPath}\n`);

    // Summary
    console.log('===================');
    console.log('✓ Build completed successfully!');
    console.log(`  - Original size: ${combined.length} bytes`);
    console.log(`  - Minified size: ${minifiedCode.length} bytes`);
    console.log(`  - Bookmarklet size: ${bookmarkletCode.length} bytes`);
    console.log(`  - Compression: ${Math.round((1 - minifiedCode.length / combined.length) * 100)}%`);
    console.log('\nNext steps:');
    console.log('1. Visit https://thomasgendron.github.io/assas-cal-exporter/');
    console.log('2. Share this URL with your classmates!');
    console.log('\nManual installation (alternative):');
    console.log('1. Open bookmarklet/dist/bookmarklet.txt');
    console.log('2. Copy the entire contents');
    console.log('3. Create a new bookmark and paste as the URL');
    console.log('4. Test on the CELCAT calendar page!');

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

buildBookmarklet();
