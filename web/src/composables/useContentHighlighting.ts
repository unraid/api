import { AnsiUp } from 'ansi_up';
import hljs from 'highlight.js/lib/core';
import DOMPurify from 'isomorphic-dompurify';

import 'highlight.js/styles/github-dark.css';

import apache from 'highlight.js/lib/languages/apache';
import bash from 'highlight.js/lib/languages/bash';
import ini from 'highlight.js/lib/languages/ini';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import nginx from 'highlight.js/lib/languages/nginx';
import php from 'highlight.js/lib/languages/php';
import plaintext from 'highlight.js/lib/languages/plaintext';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

// Register the languages (only once)
let languagesRegistered = false;

const registerLanguages = () => {
  if (!languagesRegistered) {
    hljs.registerLanguage('plaintext', plaintext);
    hljs.registerLanguage('bash', bash);
    hljs.registerLanguage('ini', ini);
    hljs.registerLanguage('xml', xml);
    hljs.registerLanguage('json', json);
    hljs.registerLanguage('yaml', yaml);
    hljs.registerLanguage('nginx', nginx);
    hljs.registerLanguage('apache', apache);
    hljs.registerLanguage('javascript', javascript);
    hljs.registerLanguage('php', php);
    languagesRegistered = true;
  }
};

export const useContentHighlighting = () => {
  // Initialize ANSI to HTML converter with CSS classes
  const ansiConverter = new AnsiUp();
  ansiConverter.use_classes = true;
  ansiConverter.escape_html = true;

  // Register languages on first use
  registerLanguages();

  // Function to highlight content
  const highlightContent = (content: string, language?: string): string => {
    try {
      let highlighted: string;

      // Check if content contains ANSI escape sequences
      // eslint-disable-next-line no-control-regex
      const hasAnsiSequences = /\x1b\[/.test(content);

      if (hasAnsiSequences) {
        // Use ANSI converter for content with ANSI codes
        highlighted = ansiConverter.ansi_to_html(content);
      } else if (language) {
        // Use highlight.js for specific language if provided
        const result = hljs.highlight(content, { language, ignoreIllegals: true });
        highlighted = result.value;
      } else {
        // Use highlight.js auto-detection for non-ANSI content
        const result = hljs.highlightAuto(content);
        highlighted = result.value;
      }

      // Sanitize the highlighted HTML while preserving class attributes for syntax highlighting
      return DOMPurify.sanitize(highlighted, {
        ALLOWED_TAGS: ['span', 'br', 'code', 'pre'],
        ALLOWED_ATTR: ['class'], // Allow class attribute for hljs and ANSI color classes
      });
    } catch (error) {
      console.error('Error highlighting content:', error);
      // Fallback to sanitized but not highlighted content
      return DOMPurify.sanitize(content);
    }
  };

  return {
    highlightContent,
  };
};
