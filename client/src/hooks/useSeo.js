import { useEffect } from 'react';

const SITE_URL = 'https://bapesuia.com';

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  const previous = el ? el.getAttribute('content') : null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return () => (previous === null ? el.remove() : el.setAttribute('content', previous));
}

/**
 * Título, descripción, canonical, Open Graph y JSON-LD por página.
 * Al salir de la página restaura los valores que había antes.
 */
export default function useSeo({ title, description, path = '/', image, jsonLd }) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    const url = SITE_URL + path;
    const restores = [];
    const previousTitle = document.title;
    if (title) {
      document.title = title;
      restores.push(upsertMeta('property', 'og:title', title));
      restores.push(upsertMeta('name', 'twitter:title', title));
    }
    if (description) {
      restores.push(upsertMeta('name', 'description', description));
      restores.push(upsertMeta('property', 'og:description', description));
      restores.push(upsertMeta('name', 'twitter:description', description));
    }
    if (image) {
      restores.push(upsertMeta('property', 'og:image', image));
      restores.push(upsertMeta('name', 'twitter:image', image));
    }
    restores.push(upsertMeta('property', 'og:url', url));

    const canonical = document.head.querySelector('link[rel="canonical"]');
    const previousCanonical = canonical?.getAttribute('href');
    canonical?.setAttribute('href', url);

    let script;
    if (jsonLdKey) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seo = 'page';
      script.textContent = jsonLdKey;
      document.head.appendChild(script);
    }

    return () => {
      document.title = previousTitle;
      restores.forEach((restore) => restore());
      if (canonical && previousCanonical) canonical.setAttribute('href', previousCanonical);
      script?.remove();
    };
  }, [title, description, path, image, jsonLdKey]);
}
