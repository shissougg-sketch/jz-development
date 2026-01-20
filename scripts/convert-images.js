import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join, parse } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputDir = join(__dirname, '../public/images/Services');

async function convertImages() {
  try {
    const files = await readdir(inputDir);
    const pngFiles = files.filter(file => file.endsWith('.png'));

    console.log(`Found ${pngFiles.length} PNG files to convert...`);

    for (const file of pngFiles) {
      const inputPath = join(inputDir, file);
      const { name } = parse(file);
      const outputPath = join(inputDir, `${name}.webp`);

      await sharp(inputPath)
        .webp({ quality: 85 })
        .toFile(outputPath);

      const inputStats = await sharp(inputPath).metadata();
      const outputStats = await sharp(outputPath).metadata();

      console.log(`Converted: ${file} -> ${name}.webp`);
    }

    console.log('\nConversion complete!');

    // Show file size comparison
    console.log('\nFile size comparison:');
    const { stat } = await import('fs/promises');
    for (const file of pngFiles) {
      const { name } = parse(file);
      const pngPath = join(inputDir, file);
      const webpPath = join(inputDir, `${name}.webp`);

      const pngSize = (await stat(pngPath)).size;
      const webpSize = (await stat(webpPath)).size;
      const reduction = ((1 - webpSize / pngSize) * 100).toFixed(1);

      console.log(`  ${file}: ${(pngSize / 1024 / 1024).toFixed(2)}MB -> ${(webpSize / 1024 / 1024).toFixed(2)}MB (${reduction}% smaller)`);
    }
  } catch (error) {
    console.error('Error converting images:', error);
    process.exit(1);
  }
}

convertImages();
