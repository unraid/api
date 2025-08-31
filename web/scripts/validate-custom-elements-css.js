#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Recursively find JS files in a directory
 */
function findJSFiles(dir, jsFiles = []) {
  if (!fs.existsSync(dir)) {
    return jsFiles;
  }

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findJSFiles(fullPath, jsFiles);
    } else if (item.endsWith('.js')) {
      jsFiles.push(fullPath);
    }
  }
  return jsFiles;
}

/**
 * Validates that Tailwind CSS styles are properly inlined in the JavaScript bundle
 */
function validateCustomElementsCSS() {
  console.log('🔍 Validating JS bundle includes inlined Tailwind styles...');

  try {
    // Check standalone apps first (new approach)
    const standaloneDir = '.nuxt/standalone-apps';
    let jsFiles = findJSFiles(standaloneDir);
    let usingStandalone = true;
    
    // Fallback to custom elements if standalone doesn't exist
    if (jsFiles.length === 0) {
      const customElementsDir = '.nuxt/nuxt-custom-elements/dist';
      jsFiles = findJSFiles(customElementsDir);
      usingStandalone = false;
      
      if (jsFiles.length === 0) {
        throw new Error('No JS files found in standalone apps or custom elements dist');
      }
    }
    
    console.log(`📦 Using ${usingStandalone ? 'standalone apps' : 'custom elements'} bundle`);

    // Find the largest JS file (likely the main bundle with inlined CSS)
    const jsFile = jsFiles.reduce((largest, current) => {
      const currentSize = fs.statSync(current).size;
      const largestSize = fs.statSync(largest).size;
      return currentSize > largestSize ? current : largest;
    });
    console.log(`📁 Checking JS bundle: ${jsFile}`);

    // Read the JS content
    const jsContent = fs.readFileSync(jsFile, 'utf8');
    
    // Define required Tailwind indicators (looking for inlined CSS in JS)
    const requiredIndicators = [
      {
        name: 'Tailwind utility classes (inline)',
        pattern: /\.flex\s*\{[^}]*display:\s*flex/,
        description: 'Basic Tailwind utility classes inlined'
      },
      {
        name: 'Tailwind margin utilities (inline)',
        pattern: /\.m-\d+\s*\{[^}]*margin:/,
        description: 'Tailwind margin utilities inlined'
      },
      {
        name: 'Tailwind padding utilities (inline)',
        pattern: /\.p-\d+\s*\{[^}]*padding:/,
        description: 'Tailwind padding utilities inlined'
      },
      {
        name: 'Tailwind color utilities (inline)',
        pattern: /\.text-\w+\s*\{[^}]*color:/,
        description: 'Tailwind text color utilities inlined'
      },
      {
        name: 'Tailwind background utilities (inline)',
        pattern: /\.bg-\w+\s*\{[^}]*background/,
        description: 'Tailwind background utilities inlined'
      },
      {
        name: 'CSS custom properties',
        pattern: /--[\w-]+:\s*[^;]+;/,
        description: 'CSS custom properties (variables)'
      },
      {
        name: 'Responsive breakpoints',
        pattern: /@media\s*\([^)]*min-width/,
        description: 'Responsive media queries'
      },
      {
        name: 'CSS reset styles',
        pattern: /\*[^}]*box-sizing|box-sizing[^}]*border-box/,
        description: 'Tailwind CSS reset/normalize styles'
      }
    ];

    // Validate each indicator
    const results = [];
    let allPassed = true;

    for (const indicator of requiredIndicators) {
      const found = indicator.pattern.test(jsContent);
      results.push({
        name: indicator.name,
        description: indicator.description,
        passed: found
      });

      if (!found) {
        allPassed = false;
      }
    }

    // Report results
    console.log('\n📊 Validation Results:');
    console.log('====================');
    
    for (const result of results) {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
      if (!result.passed) {
        console.log(`   └─ Missing: ${result.description}`);
      }
    }

    // File size check
    const fileSizeKB = Math.round(fs.statSync(jsFile).size / 1024);
    console.log(`\n📏 JS bundle size: ${fileSizeKB} KB`);
    
    if (fileSizeKB < 1000) {
      console.log('⚠️  WARNING: JS bundle seems too small, inlined Tailwind styles might not be included');
      allPassed = false;
    } else {
      console.log('✅ JS bundle size looks good');
    }

    // Final result
    if (allPassed) {
      console.log('\n🎉 SUCCESS: All Tailwind styles are properly inlined in the JS bundle!');
      process.exit(0);
    } else {
      console.log('\n❌ FAILURE: Some Tailwind styles are missing from the JS bundle!');
      console.log('\n💡 This might indicate:');
      console.log('   - The CSS inline import in viteExtend is not working properly');
      console.log('   - Tailwind configuration is not being processed');
      console.log('   - CSS is not being injected into shadow DOM components');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ ERROR during validation:', error.message);
    process.exit(1);
  }
}

// Run the validation
validateCustomElementsCSS();
