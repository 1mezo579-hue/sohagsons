const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Delete items first to respect foreign keys
    await prisma.traderInvoiceItem.deleteMany({});
    console.log("Deleted all trader invoice items.");

    // Delete invoices
    await prisma.traderInvoice.deleteMany({});
    console.log("Deleted all trader invoices.");

    // Delete traders
    await prisma.trader.deleteMany({});
    console.log("Deleted all traders.");
  } catch (error) {
    console.error("Error deleting traders:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
