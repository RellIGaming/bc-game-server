import axios from "axios";
import prisma from "../prisma.js";

const API_KEY = process.env.FOREX_API_KEY;

export const updateRatesFromAPI = async () => {
  try {
    const res = await axios.get(
      `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/BDT`
    );

    const rates = res.data.conversion_rates;

    // we want INR, PKR, USD → convert TO BDT
    const needed = ["INR", "PKR", "USD"];

    for (const currency of needed) {
      const rateFromBDT = rates[currency];

      if (!rateFromBDT) continue;

      // convert to "to BDT"
      const rateToBDT = 1 / rateFromBDT;

      await prisma.exchangeRate.upsert({
        where: { currency },
        update: { rate: rateToBDT },
        create: {
          currency,
          rate: rateToBDT
        }
      });
    }

    console.log("✅ Forex rates updated");

  } catch (err) {
    console.error("❌ Forex update error:", err.message);
  }
};