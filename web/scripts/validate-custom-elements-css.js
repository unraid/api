#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Recursively find CSS files in a directory
 */
function findCSSFiles(dir, cssFiles = []) {
  if (!fs.existsSync(dir)) {
    return cssFiles;
  }

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findCSSFiles(fullPath, cssFiles);
    } else if (item.endsWith('.css')) {
      cssFiles.push(fullPath);
    }
  }
  return cssFiles;
}

/**
 * Validates that Tailwind CSS styles are properly included in the custom elements build
 */
function validateCustomElementsCSS() {
  console.log('🔍 Validating custom elements CSS includes Tailwind styles...');

  try {
    // Find the custom elements CSS files
    const customElementsDir = '.nuxt/nuxt-custom-elements/dist';
    const cssFiles = findCSSFiles(customElementsDir);

    if (cssFiles.length === 0) {
      throw new Error('No custom elements CSS files found in ' + customElementsDir);
    }

    // Find the largest CSS file (likely the main one with Tailwind)
    const cssFile = cssFiles.reduce((largest, current) => {
      const currentSize = fs.statSync(current).size;
      const largestSize = fs.statSync(largest).size;
      return currentSize > largestSize ? current : largest;
    });
    console.log(`📁 Checking CSS file: ${cssFile}`);

    // Read the CSS content
    const cssContent = fs.readFileSync(cssFile, 'utf8');
    
    // Define required Tailwind indicators
    const requiredIndicators = [
      {
        name: 'Tailwind CSS version comment',
        pattern: /\/\*!\s*tailwindcss\s+v[\d.]+/i,
        description: 'Tailwind CSS version header'
      },
      {
        name: 'Breakpoint variables',
        pattern: /--breakpoint-xs:\s*30rem/,
        description: 'Custom breakpoint definitions'
      },
      {
        name: 'Breakpoint variables (2xl)',
        pattern: /--breakpoint-2xl:\s*100rem/,
        description: 'Large breakpoint definitions'
      },
      {
        name: 'Custom Unraid colors',
        pattern: /--color-unraid-red:\s*#e22828/,
        description: 'Custom Unraid color variables'
      },
      {
        name: 'Custom Unraid green colors',
        pattern: /--color-unraid-green:\s*#63a659/,
        description: 'Custom Unraid green color variables'
      },
      {
        name: 'Tailwind spacing variables',
        pattern: /--spacing:\s*\.4rem/,
        description: 'Tailwind spacing system'
      },
      {
        name: 'Tailwind utility classes',
        pattern: /\.flex-none\{flex:none\}/,
        description: 'Tailwind utility classes'
      },
      {
        name: 'Tailwind margin utilities',
        pattern: /\.m-0\{margin:calc\(var\(--spacing\)\*0\)\}/,
        description: 'Tailwind margin utilities'
      },
      {
        name: 'Primary color variables',
        pattern: /--color-primary-500:\s*#f60/,
        description: 'Primary color theme variables'
      },
      {
        name: 'Container variables',
        pattern: /--container-7xl:\s*80rem/,
        description: 'Container size variables'
      }
    ];

    // Validate each indicator
    const results = [];
    let allPassed = true;

    for (const indicator of requiredIndicators) {
      const found = indicator.pattern.test(cssContent);
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
    const fileSizeKB = Math.round(fs.statSync(cssFile).size / 1024);
    console.log(`\n📏 CSS file size: ${fileSizeKB} KB`);
    
    if (fileSizeKB < 100) {
      console.log('⚠️  WARNING: CSS file seems too small, Tailwind styles might not be fully included');
      allPassed = false;
    } else {
      console.log('✅ CSS file size looks good');
    }

    // Final result
    if (allPassed) {
      console.log('\n🎉 SUCCESS: All Tailwind styles are properly included in custom elements build!');
      process.exit(0);
    } else {
      console.log('\n❌ FAILURE: Some Tailwind styles are missing from custom elements build!');
      console.log('\n💡 This might indicate:');
      console.log('   - The CSS import in viteExtend is not working properly');
      console.log('   - Tailwind configuration is not being processed');
      console.log('   - Build process has issues');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ ERROR during validation:', error.message);
    process.exit(1);
  }
}

// Run the validation
validateCustomElementsCSS();
