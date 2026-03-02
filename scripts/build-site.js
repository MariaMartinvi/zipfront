/**
 * Build script for Render Static Site: CRA + Astro blog → site-dist/
 * 1. CRA build → build/
 * 2. Astro build → blog/dist/
 * 3. Merge: build/* → site-dist/, blog/dist/blog → site-dist/blog, blog/dist/en → site-dist/en
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const BLOG_DIST = path.join(ROOT, 'blog', 'dist');
const SITE_DIST = path.join(ROOT, 'site-dist');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
  } else {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function main() {
  if (!fs.existsSync(BUILD)) {
    console.error('Missing build/ (run CRA build first).');
    process.exit(1);
  }
  if (!fs.existsSync(BLOG_DIST)) {
    console.error('Missing blog/dist/ (run "npm run build" in blog/ first).');
    process.exit(1);
  }

  if (fs.existsSync(SITE_DIST)) {
    fs.rmSync(SITE_DIST, { recursive: true });
  }
  fs.mkdirSync(SITE_DIST, { recursive: true });

  // CRA build → site-dist
  console.log('Copying build/ → site-dist/');
  copyRecursive(BUILD, SITE_DIST);

  // blog/dist/blog → site-dist/blog
  const blogSrc = path.join(BLOG_DIST, 'blog');
  if (fs.existsSync(blogSrc)) {
    console.log('Copying blog/dist/blog → site-dist/blog/');
    copyRecursive(blogSrc, path.join(SITE_DIST, 'blog'));
  }

  // blog/dist/en → site-dist/en
  const enSrc = path.join(BLOG_DIST, 'en');
  if (fs.existsSync(enSrc)) {
    console.log('Copying blog/dist/en → site-dist/en/');
    copyRecursive(enSrc, path.join(SITE_DIST, 'en'));
  }

  // Ensure /blog and /en/blog are not rewritten to SPA index.html (Render: static files take precedence)
  const redirectsPath = path.join(SITE_DIST, '_redirects');
  const redirects = `# SPA fallback for CRA; /blog and /en are served as static files
/*    /index.html   200
`;
  fs.writeFileSync(redirectsPath, redirects, 'utf8');
  console.log('Wrote site-dist/_redirects');

  console.log('Done. Publish directory: site-dist/');
}

main();
