import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "ada@kese.app" },
    update: {},
    create: { email: "ada@kese.app", passwordHash: "demo" },
  });

  const catData = [
    { name: "Market", color: "#1b5e45" },
    { name: "Faturalar", color: "#5b53c6" },
    { name: "Yemek", color: "#c8553d" },
    { name: "Alisveris", color: "#a65a78" },
    { name: "Ulasim", color: "#3e6b8c" },
    { name: "Eglence", color: "#b8852e" },
    { name: "Saglik", color: "#2e7d6b" },
  ];

  const cats: Record<string, string> = {};
  for (const c of catData) {
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
