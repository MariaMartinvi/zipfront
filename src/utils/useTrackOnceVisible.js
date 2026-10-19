import { useEffect, useRef } from 'react';
import { trackEvent } from './analytics';

// Envía `evento` una sola vez por `clave` cuando el nodo de `ref` entra en pantalla.
// `activo` indica si el nodo está renderizado (el bloque bloqueado solo existe sin créditos).
// Sin IntersectionObserver (navegadores in-app viejos) no hace nada.
export const useTrackOnceVisible = (ref, evento, clave, activo = true) => {
  const enviadas = useRef(new Set());

  useEffect(() => {
    const nodo = ref.current;
    if (!activo || !nodo || !clave || enviadas.current.has(clave)) return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting) || enviadas.current.has(clave)) return;
      enviadas.current.add(clave);
      trackEvent(evento);
      observer.disconnect();
    });
    observer.observe(nodo);
    return () => observer.disconnect();
  }, [ref, evento, clave, activo]);
};
