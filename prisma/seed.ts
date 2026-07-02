import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/auth/security";
import { DEFAULT_CATEGORIES } from "../src/auth/default-categories";

const prisma = new PrismaClient();

// Demo giris: ada@kese.app / demo1234
const DEMO_PASSWORD = "demo1234";

async function main() {
  const passwordHash = hashPassword(DEMO_PASSWORD);
  const user = await prisma.user.upsert({
    where: { email: "ada@kese.app" },
    update: { passwordHash },
    create: { email: "ada@kese.app", passwordHash },
  });

  const cats: Record<string, string> = {};
  for (const c of DEFAULT_CATEGORIES) {
    const cat = await prisma.category.create({ data: { ...c, userId: user.id } });
    cats[c.name] = cat.id;
  }

  const tx: Array<[string, string, number, string]> = [
    ["Migros", "Market", 486.5, "2026-06-24"],
    ["BiTaksi", "Ulasim", 92, "2026-06-24"],
    ["Spotify", "Eglence", 59.99, "2026-06-23"],
    ["Eczane", "Saglik", 214, "2026-06-23"],
    ["Trendyol", "Alisveris", 318.75, "2026-06-22"],
    ["Starbucks", "Yemek", 145, "2026-06-22"],
    ["Elektrik faturasi", "Faturalar", 640, "2026-06-21"],
    ["Sok Market", "Market", 263.4, "2026-06-21"],
  ];

  for (const [desc, cat, amount, date] of tx) {
    await prisma.transaction.create({
      data: {
        description: desc,
        amount,
        date: new Date(date),
        categoryId: cats[cat],
        userId: user.id,
        source: "MANUAL",
      },
    });
  }

  console.log("Seed tamam.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
