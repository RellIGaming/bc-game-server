import prisma from '../prisma.js'

export const suspendMarket = async (req, res) => {
  try {
    const marketId = BigInt(req.params.marketId)

    const market = await prisma.market.update({
      where: { id: marketId },
      data: { status: "SUSPENDED" }
    })

    await marketAuditLog.create({
      data: {
        marketId,
        action: "SUSPENDED"
      }
    })

    res.json(market)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Internal server error" })
  }
}