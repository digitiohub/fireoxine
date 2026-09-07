/** Strip every placeholder, leaving the designed "photograph pending" plates. */
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const img = await db.productImage.deleteMany({ where: { url: { startsWith: '/placeholders/' } } });
const cat = await db.category.updateMany({
  where: { imageUrl: { startsWith: '/placeholders/' } },
  data: { imageUrl: null },
});
console.log(`removed ${img.count} product images, cleared ${cat.count} collection banners`);
await db.$disconnect();
