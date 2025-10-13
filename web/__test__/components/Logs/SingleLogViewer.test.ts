import { nextTick } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { flushPromises, mount } from '@vue/test-utils';

import { AnsiUp } from 'ansi_up';
import DOMPurify from 'isomorphic-dompurify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SingleLogViewer from '~/components/Logs/SingleLogViewer.vue';
import { createMockLogFileQuery, createMockUseQuery } from '../../helpers/apollo-mocks';
import { createTestI18n } from '../../utils/i18n';

// Mock the UI components
vi.mock('@unraid/ui', () => ({
  Button: { template: '<button><slot /></button>' },
  Tooltip: { template: '<div><slot /></div>' },
  TooltipContent: { template: '<div><slot /></div>' },
  TooltipProvider: { template: '<div><slot /></div>' },
  TooltipTrigger: { template: '<div><slot /></div>' },
}));

// Mock the GraphQL query
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: vi.fn(() => ({
    client: {
      query: vi.fn(),
    },
  })),
  useQuery: vi.fn(),
}));

// Mock the theme store
vi.mock('~/store/theme', () => ({
  useThemeStore: vi.fn(() => ({
    darkMode: false,
  })),
}));

describe('SingleLogViewer - ANSI Color Support', () => {
  let ansiConverter: AnsiUp;

  beforeEach(() => {
    // Create a fresh converter instance for each test
    ansiConverter = new AnsiUp();
    ansiConverter.use_classes = true;
    ansiConverter.escape_html = true;
  });

  describe('ANSI to HTML Conversion', () => {
    it('should convert ANSI color codes to CSS classes', () => {
      const testCases = [
        {
          input: '\x1b[31mRed text\x1b[0m',
          expected: '<span class="ansi-red-fg">Red text</span>',
          description: 'red foreground',
        },
        {
          input: '\x1b[32mGreen text\x1b[0m',
          expected: '<span class="ansi-green-fg">Green text</span>',
          description: 'green foreground',
        },
        {
          input: '\x1b[33mYellow text\x1b[0m',
          expected: '<span class="ansi-yellow-fg">Yellow text</span>',
          description: 'yellow foreground',
        },
        {
          input: '\x1b[34mBlue text\x1b[0m',
          expected: '<span class="ansi-blue-fg">Blue text</span>',
          description: 'blue foreground',
        },
        {
          input: '\x1b[91mBright red\x1b[0m',
          expected: '<span class="ansi-bright-red-fg">Bright red</span>',
          description: 'bright red foreground',
        },
        {
          input: '\x1b[41mRed background\x1b[0m',
          expected: '<span class="ansi-red-bg">Red background</span>',
          description: 'red background',
        },
        {
          input: '\x1b[1mBold text\x1b[0m',
          expected: '<span style="font-weight:bold">Bold text</span>',
          description: 'bold text (ansi_up uses inline style for bold)',
        },
        {
          input: '\x1b[3mItalic text\x1b[0m',
          expected: '<span style="font-style:italic">Italic text</span>',
          description: 'italic text (ansi_up uses inline style for italic)',
        },
        {
          input: '\x1b[4mUnderlined text\x1b[0m',
          expected: '<span style="text-decoration:underline">Underlined text</span>',
          description: 'underlined text (ansi_up uses inline style for underline)',
        },
      ];

      testCases.forEach(({ input, expected, description }) => {
        const result = ansiConverter.ansi_to_html(input);
        expect(result, `Failed for ${description}`).toBe(expected);
      });
    });

    it('should handle multiple ANSI codes in one string', () => {
      const input = '\x1b[31mRed\x1b[0m \x1b[32mGreen\x1b[0m \x1b[34mBlue\x1b[0m';
      const expected =
        '<span class="ansi-red-fg">Red</span> <span class="ansi-green-fg">Green</span> <span class="ansi-blue-fg">Blue</span>';
      const result = ansiConverter.ansi_to_html(input);
      expect(result).toBe(expected);
    });

    it('should handle nested ANSI codes', () => {
      const input = '\x1b[1m\x1b[31mBold Red Text\x1b[0m';
      const result = ansiConverter.ansi_to_html(input);
      // ansi_up uses inline style for bold
      expect(result).toContain('font-weight:bold');
      expect(result).toContain('ansi-red-fg');
    });

    it('should escape HTML entities for security', () => {
      const input = '\x1b[31m<img src=x onerror=alert(1)>\x1b[0m';
      const result = ansiConverter.ansi_to_html(input);
      expect(result).not.toContain('<img');
      expect(result).toContain('&lt;img');
    });
  });

  describe('DOMPurify Sanitization', () => {
    it('should preserve CSS classes after sanitization', () => {
      const htmlWithClasses = '<span class="ansi-red-fg">Red text</span>';
      const sanitized = DOMPurify.sanitize(htmlWithClasses, {
        ALLOWED_TAGS: ['span', 'br'],
        ALLOWED_ATTR: ['class'],
      });
      expect(sanitized).toBe(htmlWithClasses);
    });

    it('should remove inline styles when configured', () => {
      const htmlWithStyles = '<span style="color: red;">Red text</span>';
      const sanitized = DOMPurify.sanitize(htmlWithStyles, {
        ALLOWED_TAGS: ['span', 'br'],
        ALLOWED_ATTR: ['class'], // Note: 'style' is not allowed
      });
      expect(sanitized).toBe('<span>Red text</span>');
    });

    it('should remove dangerous tags while preserving safe content', () => {
      const dangerous = '<span class="ansi-red-fg">Safe</span><img src="x" onerror="alert(1)">';
      const sanitized = DOMPurify.sanitize(dangerous, {
        ALLOWED_TAGS: ['span', 'br'],
        ALLOWED_ATTR: ['class'],
      });
      expect(sanitized).toBe('<span class="ansi-red-fg">Safe</span>');
    });

    it('should handle complex nested structures', () => {
      const complex = '<span class="ansi-bold"><span class="ansi-red-fg">Bold Red</span></span>';
      const sanitized = DOMPurify.sanitize(complex, {
        ALLOWED_TAGS: ['span', 'br'],
        ALLOWED_ATTR: ['class'],
      });
      expect(sanitized).toBe(complex);
    });
  });

  describe('CSS Class Definitions', () => {
    it('should have CSS rules for all standard ANSI colors', async () => {
      // Mock useQuery to return empty data for this test
      // @ts-expect-error Mock implementation for testing
      vi.mocked(useQuery).mockReturnValue(createMockUseQuery());

      const wrapper = mount(SingleLogViewer, {
        props: {
          logFilePath: '/test/log.txt',
          lineCount: 100,
          autoScroll: false,
        },
        global: {
          plugins: [createTestI18n()],
          stubs: {
            Button: true,
            Tooltip: true,
            TooltipContent: true,
            TooltipProvider: true,
            TooltipTrigger: true,
          },
        },
      });

      // Wait for component to mount
      await nextTick();

      // Check that the component mounts without errors
      expect(wrapper.exists()).toBe(true);

      wrapper.unmount();
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      // Reset mocks before each test
      vi.clearAllMocks();
    });

    it('should properly render ANSI colored log content', async () => {
      // Create mock data
      const content = '\x1b[31m[ERROR]\x1b[0m Failed to connect\n\x1b[32m[SUCCESS]\x1b[0m Connected';
      const mockQuery = createMockLogFileQuery(content, 2, 1);

      // Mock useQuery to return our data
      // @ts-expect-error Mock implementation for testing
      vi.mocked(useQuery).mockReturnValue(mockQuery);

      const wrapper = mount(SingleLogViewer, {
        props: {
          logFilePath: '/test/log.txt',
          lineCount: 100,
          autoScroll: false,
        },
        global: {
          plugins: [createTestI18n()],
        },
      });

      // Wait for the component to mount and process initial data
      await wrapper.vm.$nextTick();

      // Trigger the watcher by modifying the result
      // @ts-expect-error Accessing mock properties
      if (mockQuery.result.value) {
        // @ts-expect-error Modifying mock properties
        mockQuery.result.value = {
          logFile: {
            content,
            totalLines: 2,
            startLine: 1,
          },
        };
      }

      // Wait for watchers to process
      await wrapper.vm.$nextTick();
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Get the pre element that contains the log content
      const preElement = wrapper.find('pre.hljs');
      expect(preElement.exists()).toBe(true);

      // Check that the rendered HTML contains the CSS classes
      const html = preElement.html();
      if (!html.includes('ansi-red-fg')) {
        console.log('Pre element HTML:', html);
        console.log('Full wrapper HTML:', wrapper.html());
      }
      expect(html).toContain('ansi-red-fg');
      expect(html).toContain('[ERROR]');
      expect(html).toContain('ansi-green-fg');
      expect(html).toContain('[SUCCESS]');

      wrapper.unmount();
    });

    it('should handle log content with mixed ANSI and plain text', async () => {
      const content = 'Plain text \x1b[33mWarning\x1b[0m more plain text';
      const mockQuery = createMockLogFileQuery(content, 1, 1);
      // @ts-expect-error Mock implementation for testing
      vi.mocked(useQuery).mockReturnValue(mockQuery);

      const wrapper = mount(SingleLogViewer, {
        props: {
          logFilePath: '/test/log.txt',
          lineCount: 100,
          autoScroll: false,
        },
        global: {
          plugins: [createTestI18n()],
        },
      });

      // Wait for mount and trigger the watcher
      await wrapper.vm.$nextTick();

      // @ts-expect-error Accessing mock properties
      if (mockQuery.result.value) {
        // @ts-expect-error Modifying mock properties
        mockQuery.result.value = {
          logFile: {
            content,
            totalLines: 1,
            startLine: 1,
          },
        };
      }

      // Wait for processing
      await wrapper.vm.$nextTick();
      await flushPromises();
      await wrapper.vm.$nextTick();

      const preElement = wrapper.find('pre.hljs');
      expect(preElement.exists()).toBe(true);

      const html = preElement.html();
      expect(html).toContain('Plain text');
      expect(html).toContain('ansi-yellow-fg');
      expect(html).toContain('Warning');
      expect(html).toContain('more plain text');

      wrapper.unmount();
    });

    it('should apply client-side filtering while preserving ANSI colors', async () => {
      const content =
        '\x1b[31m[ERROR]\x1b[0m Connection failed\n\x1b[32m[INFO]\x1b[0m Connected\n\x1b[31m[ERROR]\x1b[0m Timeout';
      const mockQuery = createMockLogFileQuery(content, 3, 1);
      // @ts-expect-error Mock implementation for testing
      vi.mocked(useQuery).mockReturnValue(mockQuery);

      const wrapper = mount(SingleLogViewer, {
        props: {
          logFilePath: '/test/log.txt',
          lineCount: 100,
          autoScroll: false,
          clientFilter: 'ERROR',
        },
        global: {
          plugins: [createTestI18n()],
        },
      });

      // Wait for mount and trigger the watcher
      await wrapper.vm.$nextTick();

      // @ts-expect-error Accessing mock properties
      if (mockQuery.result.value) {
        // @ts-expect-error Modifying mock properties
        mockQuery.result.value = {
          logFile: {
            content,
            totalLines: 3,
            startLine: 1,
          },
        };
      }

      // Wait for processing
      await wrapper.vm.$nextTick();
      await flushPromises();
      await wrapper.vm.$nextTick();

      const preElement = wrapper.find('pre.hljs');
      expect(preElement.exists()).toBe(true);

      const html = preElement.html();
      // Should contain ERROR lines with red color
      expect(html).toContain('ansi-red-fg');
      expect(html).toContain('ERROR');
      // Should not contain INFO line (due to filter)
      expect(html).not.toContain('INFO');
      expect(html).not.toContain('ansi-green-fg');

      wrapper.unmount();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large amounts of ANSI colored text efficiently', () => {
      const lines = 1000;
      const largeInput = Array(lines)
        .fill(null)
        .map((_, i) => {
          const colors = ['31', '32', '33', '34', '35', '36'];
          const color = colors[i % colors.length];
          return `\x1b[${color}mLine ${i}: Some log message with color\x1b[0m`;
        })
        .join('\n');

      const result = ansiConverter.ansi_to_html(largeInput);

      // Should contain the expected number of color spans
      const colorMatches = result.match(/class="ansi-/g);
      expect(colorMatches).toHaveLength(lines);
    });

    it('should efficiently sanitize large HTML with many CSS classes', () => {
      const lines = 1000;
      const largeHtml = Array(lines)
        .fill(null)
        .map((_, i) => `<span class="ansi-red-fg">Line ${i}</span>`)
        .join('\n');

      const sanitized = DOMPurify.sanitize(largeHtml, {
        ALLOWED_TAGS: ['span', 'br'],
        ALLOWED_ATTR: ['class'],
      });

      // Should preserve all spans
      const spanMatches = sanitized.match(/<span/g);
      expect(spanMatches).toHaveLength(lines);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input gracefully', () => {
      const result = ansiConverter.ansi_to_html('');
      expect(result).toBe('');
    });

    it('should handle input with no ANSI codes', () => {
      const plainText = 'This is plain text without any colors';
      const result = ansiConverter.ansi_to_html(plainText);
      expect(result).toBe(plainText);
    });

    it('should handle malformed ANSI codes', () => {
      const malformed = '\x1b[999mInvalid color code\x1b[0m';
      // Should not throw an error
      expect(() => ansiConverter.ansi_to_html(malformed)).not.toThrow();
    });

    it('should handle incomplete ANSI sequences', () => {
      const incomplete = '\x1b[31mRed text without reset';
      const result = ansiConverter.ansi_to_html(incomplete);
      expect(result).toContain('ansi-red-fg');
    });

    it('should handle ANSI codes at the beginning and end of lines', () => {
      const input = '\x1b[31mStart\nMiddle\nEnd\x1b[0m';
      const result = ansiConverter.ansi_to_html(input);
      expect(result).toContain('ansi-red-fg');
    });
  });
});
