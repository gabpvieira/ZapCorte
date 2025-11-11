import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente que garante que a página sempre inicie do topo
 * ao navegar entre rotas
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll para o topo de forma suave
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Usa 'instant' para ser imediato, ou 'smooth' para suave
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
