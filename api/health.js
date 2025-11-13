// Health check endpoint
export default function handler(req, res) {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'ZapCorte Payment Server',
    environment: 'production'
  });
}
