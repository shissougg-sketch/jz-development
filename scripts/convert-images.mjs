import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { join, parse } from 'path';

const PROJECTS_DIR = './public/images/projects';
const MAX_WIDTH = 1200;
const WEBP_QUALITY = 80;

async function getImageFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getImageFiles(fullPath));
    } else if (/\.(jpe?g|png)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

async function convertImage(inputPath) {
  const { dir, name } = parse(inputPath);
  const outputPath = join(dir, `${name.toLowerCase()}.webp`);

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Resize if wider than MAX_WIDTH
    if (metadata.width > MAX_WIDTH) {
      image.resize(MAX_WIDTH);
    }

    await image
      .webp({ quality: WEBP_QUALITY })
      .toFile(outputPath);

    console.log(`✓ ${inputPath} → ${outputPath}`);
    return { success: true, input: inputPath, output: outputPath };
  } catch (err) {
    console.error(`✗ ${inputPath}: ${err.message}`);
    return { success: false, input: inputPath, error: err.message };
  }
}

async function main() {
  console.log('Finding images...\n');
  const images = await getImageFiles(PROJECTS_DIR);

  // Filter out already-converted webp files
  const toConvert = images.filter(f => !/\.webp$/i.test(f));

  console.log(`Found ${toConvert.length} images to convert\n`);

  const results = await Promise.all(toConvert.map(convertImage));

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\nDone: ${successful} converted, ${failed} failed`);
}

main().catch(console.error);
