// Source: https://www.npmjs.com/package/dedent-tabs
// License: MIT - https://github.com/adrianjost/dedent-tabs/blob/master/LICENSE
export const dedent = (
    strings: TemplateStringsArray,
    ...values: Array<string | number>
  ) => {
    const raw = typeof strings === 'string' ? [strings] : strings.raw;
  
    // first, perform interpolation
    let result = "";
    for (let i = 0; i < raw.length; i++) {
      result += raw[i]
        // join lines when there is a suppressed newline
        .replace(/\\\n[ \t]*/g, "")
        // handle escaped backticks
        .replace(/\\`/g, "`")
        // handle escaped dollar signs
        .replace(/\\\$/g, "$")
        // handle escaped open braces
        .replace(/\\\{/g, "{");
  
      if (i < values.length) {
        const lastLine = result.substring(result.lastIndexOf('\n') + 1);
        const m = lastLine.match(/^(\s*)\S?/)!;
        result += String(values[i]).replace(/\n/g, '\n' + m[1]);
      }
    }
  
    // now strip indentation
    const lines = result.split("\n");
    let mindent: number | null = null;
    lines.forEach(l => {
      let m = l.match(/^(\s+)\S+/);
      if (m) {
        let indent = m[1].length;
        if (!mindent) {
          // this is the first indented line
          mindent = indent;
        } else {
          mindent = Math.min(mindent, indent);
        }
      }
    });
  
    if (mindent !== null) {
      const m = mindent; // appease Flow
      result = lines.map(l => (l[0] === " " || l[0] === "\t") ? l.slice(m) : l).join("\n");
    }
  
    return result
      // dedent eats leading and trailing whitespace too
      .trim()
      // handle escaped newlines at the end to ensure they don't get stripped too
      .replace(/\\n/g, "\n");
}