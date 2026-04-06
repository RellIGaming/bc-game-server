import prisma from "../prisma.js";

/**
 * Update wallet balance
 * type = "BET_DEBIT" | "BET_WIN" | "DEPOSIT" | "WITHDRAW" | "BONUS_DEBIT" | "BONUS_CREDIT"
 */

export async function updateBalance({
  userId,
  currency,
  amount,
  type,
  referenceId,
  referenceType
}) {

  if (!currency) throw new Error("Currency is required");

  const currencyCode = currency.toUpperCase();
  const value = Number(amount);

  if (isNaN(value) || value <= 0)
    throw new Error("Invalid amount");

  return prisma.$transaction(async (tx) => {

    let wallet = await tx.wallet.findUnique({
  where: {
    userId_currency: {
      userId,
      currency: currencyCode
    }
  }
});

if (!wallet) {
  wallet = await tx.wallet.create({
    data: {
      userId,
      currency: currencyCode,
      balance: 0,
      bonus: 0
    }
  });
}

    const currentBalance = Number(wallet.balance || 0);
    const currentBonus = Number(wallet.bonus || 0);
console.log("User:", userId, "Currency:", currencyCode);
    let newBalance = currentBalance;
    let newBonus = currentBonus;

    switch (type) {

      case "BET_DEBIT":
      case "WITHDRAW":

        if (currentBalance < value)
          throw new Error("Insufficient balance");

        newBalance = currentBalance - value;

        await tx.wallet.update({
          where: {
            userId_currency: {
              userId,
              currency: currencyCode
            }
          },
          data: {
            balance: { decrement: value }
          }
        });

        break;

      case "BET_WIN":
      case "DEPOSIT":

        newBalance = currentBalance + value;

        await tx.wallet.update({
          where: {
            userId_currency: {
              userId,
              currency: currencyCode
            }
          },
          data: {
            balance: { increment: value }
          }
        });

        break;

      case "BONUS_DEBIT":

        if (currentBonus < value)
          throw new Error("Insufficient bonus balance");

        newBonus = currentBonus - value;

        await tx.wallet.update({
          where: {
            userId_currency: {
              userId,
              currency: currencyCode
            }
          },
          data: {
            bonus: { decrement: value }
          }
        });

        break;

      case "BONUS_CREDIT":

        newBonus = currentBonus + value;

        await tx.wallet.update({
          where: {
            userId_currency: {
              userId,
              currency: currencyCode
            }
          },
          data: {
            bonus: { increment: value }
          }
        });

        break;

      default:
        throw new Error("Invalid transaction type");
    }

    await tx.walletTransaction.create({
      data: {
        userId,
        currency: currencyCode,
        type,
        status: "COMPLETED",
        amount: value,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        referenceId: referenceId?.toString(),
        referenceType
      }
    });

    return {
      currency: currencyCode,
      balance: newBalance,
      bonus: newBonus
    };

  });
}