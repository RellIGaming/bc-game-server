export const getToken = async (req, res) => {
  const token = await prisma.token.findFirst();
  res.json(token);
};