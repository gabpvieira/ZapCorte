import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO = ({ 
  title = "ZapCorte - Sistema de Agendamento para Barbearias",
  description = "Sistema completo de agendamento para barbearias. Crie seu minisite, receba agendamentos online e automatize lembretes via WhatsApp. Comece grátis!",
  image = "/zapcorte-icon.png",
  url,
  type = "website"
}: SEOProps) => {
  const location = useLocation();
  const currentUrl = url || `https://zapcorte.com${location.pathname}`;

  useEffect(() => {
    // Atualizar título
    document.title = title;

    // Atualizar meta description
    updateMetaTag('name', 'description', description);

    // Open Graph
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:image', image);
    updateMetaTag('property', 'og:url', currentUrl);
    updateMetaTag('property', 'og:type', type);

    // Twitter Card
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', image);
  }, [title, description, image, currentUrl, type]);

  return null;
};

const updateMetaTag = (attribute: string, key: string, content: string) => {
  let element = document.querySelector(`meta[${attribute}="${key}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
};

export default SEO;
