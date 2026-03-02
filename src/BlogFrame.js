import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Muestra el blog (Astro) dentro del layout de la web (header/footer del CRA).
 * En desarrollo: iframe apunta a REACT_APP_BLOG_DEV_ORIGIN (ej. http://localhost:4322).
 * En producción: iframe apunta al mismo origen (/blog?embed=1).
 * El blog en Astro debe servirse con ?embed=1 para no mostrar su propio header/footer.
 */
function BlogFrame() {
  const { pathname } = useLocation();
  const blogOrigin = process.env.NODE_ENV === 'development' && process.env.REACT_APP_BLOG_DEV_ORIGIN
    ? process.env.REACT_APP_BLOG_DEV_ORIGIN
    : '';
  const iframeSrc = `${blogOrigin}${pathname}?embed=1`;

  return (
    <div className="blog-frame-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <iframe
        title="Blog"
        src={iframeSrc}
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          minHeight: '70vh',
        }}
      />
    </div>
  );
}

export default BlogFrame;
