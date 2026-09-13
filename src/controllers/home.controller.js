export const getHome = (req, res) => {
  res.status(200).json({ status: 'success', message: 'API de servicios funcionando correctamente' });
};
