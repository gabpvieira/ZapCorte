/**
 * Script para gerar ícones PWA em múltiplos tamanhos
 * Requer: npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_SIZES = [48, 72, 96, 144, 192, 384, 512];
const SOURCE_ICON = path.join(__dirname, '../public/zapcorte-icon.png');
const OUTPUT_DIR = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('🎨 Gerando ícones PWA...\n');

  // Verificar se o arquivo fonte existe
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error('❌ Arquivo fonte não encontrado:', SOURCE_ICON);
    process.exit(1);
  }

  // Criar diretório de saída se não existir
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  try {
    // Gerar cada tamanho de ícone
    for (const size of ICON_SIZES) {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
      
      await sharp(SOURCE_ICON)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Gerado: icon-${size}.png (${size}x${size})`);
    }

    // Gerar ícone maskable (com padding para safe zone)
    const maskableSizes = [192, 512];
    for (const size of maskableSizes) {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}-maskable.png`);
      const padding = Math.floor(size * 0.1); // 10% padding
      
      await sharp(SOURCE_ICON)
        .resize(size - (padding * 2), size - (padding * 2), {
          fit: 'contain',
          background: { r: 139, g: 92, b: 246, alpha: 1 } // #8B5CF6
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 139, g: 92, b: 246, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Gerado: icon-${size}-maskable.png (${size}x${size})`);
    }

    // Gerar favicon
    const faviconPath = path.join(OUTPUT_DIR, 'favicon.ico');
    await sharp(SOURCE_ICON)
      .resize(32, 32)
      .toFile(path.join(OUTPUT_DIR, 'favicon-32x32.png'));
    
    await sharp(SOURCE_ICON)
      .resize(16, 16)
      .toFile(path.join(OUTPUT_DIR, 'favicon-16x16.png'));
    
    console.log('✅ Gerado: favicon-32x32.png e favicon-16x16.png');

    // Gerar Apple Touch Icon
    await sharp(SOURCE_ICON)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 139, g: 92, b: 246, alpha: 1 }
      })
      .png()
      .toFile(path.join(OUTPUT_DIR, 'apple-touch-icon.png'));
    
    console.log('✅ Gerado: apple-touch-icon.png (180x180)');

    // Gerar Android Chrome icons
    await sharp(SOURCE_ICON)
      .resize(192, 192)
      .png()
      .toFile(path.join(OUTPUT_DIR, 'android-chrome-192x192.png'));
    
    await sharp(SOURCE_ICON)
      .resize(512, 512)
      .png()
      .toFile(path.join(OUTPUT_DIR, 'android-chrome-512x512.png'));
    
    console.log('✅ Gerado: android-chrome-192x192.png e android-chrome-512x512.png');

    console.log('\n🎉 Todos os ícones foram gerados com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Atualize o manifest.json com os novos tamanhos');
    console.log('2. Teste o PWA com Lighthouse');
    console.log('3. Faça deploy das alterações\n');

  } catch (error) {
    console.error('❌ Erro ao gerar ícones:', error);
    process.exit(1);
  }
}

generateIcons();
