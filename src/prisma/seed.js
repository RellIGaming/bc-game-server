import pkg from "@prisma/client";

const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {

  console.log("🌱 Seeding database...");

  const user = await prisma.user.upsert({
    where: { username: "testuser" },
    update: {},
    create: {
      username: "testuser",
      email: "test@example.com",
      password: "123456",
      role: "user"
    }
  });

  console.log("✅ User created:", user.id);

  const currencies = ["INR", "USDT", "BTC"];

  for (const currency of currencies) {
    await prisma.wallet.upsert({
      where: {
        userId_currency: {
          userId: user.id,
          currency
        }
      },
      update: {},
      create: {
        userId: user.id,
        currency,
        balance: 1000,
        bonus: 0
      }
    });
  }

  console.log("✅ Wallets created");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("🌱 Seed finished");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });