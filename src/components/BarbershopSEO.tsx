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

  return (
    <Helmet>
      {/* Meta Tags Básicas */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={pageUrl} />

      {/* Open Graph / Facebook */}
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

      {/* WhatsApp Preview (usa Open Graph) */}
      <meta property="og:image:width" content="400" />
      <meta property="og:image:height" content="400" />

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
