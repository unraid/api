import { readdir } from 'fs/promises';
import { join } from 'path';
import { defineEventHandler } from 'h3';

export default defineEventHandler(async (_event) => {
  try {
    const pagesDir = join(process.cwd(), 'pages');
    const files = await readdir(pagesDir, { withFileTypes: true });
    
    const routes = files
      .filter(file => file.isFile() && file.name.endsWith('.vue'))
      .map(file => {
        const name = file.name.replace('.vue', '');
        const path = name === 'index' ? '/' : `/${name}`;
        
        return {
          path,
          name: name === 'index' ? 'index' : name
        };
      })
      .sort((a, b) => a.path.localeCompare(b.path));
    
    return routes;
  } catch (error) {
    console.error('Error reading pages directory:', error);
    return [];
  }
}); 