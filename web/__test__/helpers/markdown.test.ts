import { Markdown } from '~/helpers/markdown';
import { baseUrl } from 'marked-base-url';
import { describe, expect, test } from 'vitest';

// add a random extension to the instance
const instance = Markdown.create(baseUrl('https://unraid.net'));
const parse = async (content: string) => ({
  fromDefault: await Markdown.parse(content),
  fromInstance: await instance.parse(content),
});

describe('sanitization', () => {
  test('strips javascript', async () => {
    const parsed = await parse(`<img src=x onerror=alert(1)//><script>console.log('hello')</script>`);
    expect(parsed.fromDefault).toMatchSnapshot();
    expect(parsed.fromInstance).toMatchSnapshot();
  });

  test('strips various XSS vectors', async () => {
    const vectors = [
      '<a href="javascript:alert(1)">click me</a>',
      "<IMG SRC=JaVaScRiPt:alert('XSS')>",
      '"><script>alert(document.cookie)</script>',
      '<style>@import \'javascript:alert("XSS")\';</style>',
    ];

    for (const vector of vectors) {
      const parsed = await parse(vector);
      expect(parsed.fromDefault).not.toContain('javascript:');
      expect(parsed.fromInstance).not.toContain('javascript:');
    }
  });
});

describe('extensibility', () => {
  test('works with other extensions', async () => {
    const parsed = await parse(`[Contact](/contact)`);
    expect(parsed.fromDefault).toMatchInlineSnapshot(`
          "<p><a href="/contact">Contact</a></p>
          "
        `);
    expect(parsed.fromInstance).toMatchInlineSnapshot(`
          "<p><a href="https://unraid.net/contact">Contact</a></p>
          "
        `);
  });
});
