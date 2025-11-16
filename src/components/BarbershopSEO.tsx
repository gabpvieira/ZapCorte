import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import type { Barbershop } from "@/lib/supabase";

interface BarbershopSEOProps {
  barbershop: Barbershop;
}

export function BarbershopSEO({ barbershop }: BarbershopSEOProps) {
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://zapcorte.com';
  const pageUrl = `${siteUrl}/barbershop/${barbershop.slug}`;
  
  // Usar logo da barbearia ou fallback para logo do ZapCorte
  const imageUrl = barbershop.logo_url || `${siteUrl}/zapcorte-icon.png`;
  
  // Título otimizado para SEO
  const title = `${barbershop.name} - Agende Online | ZapCorte`;
  
  // Descrição otimizada
  const description = barbershop.subtitle 
    ? `${barbershop.subtitle} - Agende seu horário online de forma rápida e fácil. ${barbershop.name} no ZapCorte.`
    : `Agende seu horário na ${barbershop.name} de forma rápida e fácil. Sistema de agendamento online profissional.`;

  // Keywords relevantes
  const keywords = `${barbershop.name}, barbearia, agendamento online, corte de cabelo, barba, ${barbershop.slug}, zapcorte`;

  // Atualizar meta tags dinamicamente via JavaScript (fallback para crawlers)
  useEffect(() => {
    // Atualizar título
    document.title = title;
    
    // Função helper para atualizar ou criar meta tag
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Meta tags básicas
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    
    // Open Graph
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:url', pageUrl, true);
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', imageUrl, true);
    updateMetaTag('og:image:secure_url', imageUrl, true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:image:alt', `Logo ${barbershop.name}`, true);
    updateMetaTag('og:site_name', 'ZapCorte', true);
    updateMetaTag('og:locale', 'pt_BR', true);
    
    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:url', pageUrl);
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', imageUrl);
    updateMetaTag('twitter:image:alt', `Logo ${barbershop.name}`);
    
    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = pageUrl;
  }, [barbershop, title, description, imageUrl, pageUrl, keywords]);

  return (
    <Helmet>
      {/* Meta Tags Básicas */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={pageUrl} />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:secure_url" content={imageUrl} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`Logo ${barbershop.name}`} />
      <meta property="og:site_name" content="ZapCorte" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={pageUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={`Logo ${barbershop.name}`} />
      <meta name="twitter:creator" content="@zapcorte" />

      {/* Schema.org para Google */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": barbershop.name,
          "description": description,
          "image": imageUrl,
          "url": pageUrl,
          "telephone": barbershop.whatsapp_number,
          "priceRange": "$$",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "BR"
          },
          "openingHoursSpecification": barbershop.opening_hours ? Object.entries(barbershop.opening_hours).map(([day, hours]) => ({
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": day,
            "opens": hours?.start || "09:00",
            "closes": hours?.end || "18:00"
          })) : []
        })}
      </script>

      {/* Tema da barra de endereço mobile */}
      <meta name="theme-color" content="#8B5CF6" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </Helmet>
  );
}
