import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return new Response('Missing slug parameter', { status: 400 });
    }

    // Buscar dados da barbearia do Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/barbershops?slug=eq.${slug}&select=*`,
      {
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const data = await response.json();
    const barbershop = data[0];

    if (!barbershop) {
      return new Response('Barbershop not found', { status: 404 });
    }

    // Gerar imagem OG
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '40px',
          }}
        >
          {/* Logo */}
          {barbershop.logo_url && (
            <img
              src={barbershop.logo_url}
              alt={barbershop.name}
              width={200}
              height={200}
              style={{
                borderRadius: '50%',
                border: '6px solid white',
                marginBottom: '30px',
                objectFit: 'cover',
              }}
            />
          )}

          {/* Nome da Barbearia */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              marginBottom: '20px',
              textShadow: '0 4px 8px rgba(0,0,0,0.3)',
            }}
          >
            {barbershop.name}
          </div>

          {/* Subtítulo */}
          {barbershop.subtitle && (
            <div
              style={{
                fontSize: 32,
                color: 'rgba(255,255,255,0.9)',
                textAlign: 'center',
                marginBottom: '40px',
                maxWidth: '800px',
              }}
            >
              {barbershop.subtitle}
            </div>
          )}

          {/* CTA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              backgroundColor: 'white',
              padding: '20px 40px',
              borderRadius: '50px',
              fontSize: 28,
              fontWeight: 'bold',
              color: '#667eea',
            }}
          >
            <span>📅</span>
            <span>Agende Online Agora</span>
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              fontSize: 24,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            Powered by ZapCorte
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
