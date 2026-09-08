/**
 * Strip every placeholder, leaving the designed "photograph pending" plates.
 *
 * Wrapped in main() rather than using top-level await: tsx transpiles these
 * scripts to CJS, where top-level await is a hard error. The sibling scripts
 * already do it this way; this one did not, and the whole command failed.
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const img = await db.productImage.deleteMany({
    where: { url: { startsWith: '/placeholders/' } },
  });
  const cat = await db.category.updateMany({
    where: { imageUrl: { startsWith: '/placeholders/' } },
    data: { imageUrl: null },
  });
  console.log(`removed ${img.count} product images, cleared ${cat.count} collection banners`);
  await db.$disconnect();
}

main();
