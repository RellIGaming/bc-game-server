import prisma from '../prisma.js'

// GET /api/matches?sport=soccer&type=live
export async function getMatches(req, res) {
  try {
    const { sport, type } = req.query;

    const matches = await prisma.match.findMany({
      where: {
        sport: sport || undefined,
        isLive: type === "live" ? true : type === "upcoming" ? false : undefined,
      },
      orderBy: { startTime: "asc" },
    });

    // Transform to frontend format
    const formatted = matches.map((m) => ({
      id: String(m.id),
      league: m.league,
      country: m.country,
      startTime: m.isLive
        ? m.liveTime
        : new Date(m.startTime).toLocaleString(),
      isLive: m.isLive,
      liveTime: m.liveTime,
      homeTeam: { id: `${m.id}-h`, name: m.homeTeam },
      awayTeam: { id: `${m.id}-a`, name: m.awayTeam },
      odds: {
        home: m.homeOdds,
        draw: m.drawOdds || 0,
        away: m.awayOdds,
      },
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const getAllMatches = async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      include: {
        markets: {
          include: {
            options: true
          }
        }
      }
    })

    res.json(matches)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const createMatch = async (req, res) => {
  try {
    const { sport, league, country, startTime } = req.body

    const match = await prisma.match.create({
      data: {
        sport,
        league,
        country,
        startTime: new Date(startTime)
      }
    })

    res.json(match)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Internal server error" })
  }
}