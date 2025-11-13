// Webhook simplificado para teste
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;
    
    // Log básico
    console.log('Webhook recebido:', JSON.stringify(webhookData, null, 2));
    
    // Validar secret
    const expectedSecret = process.env.CAKTO_WEBHOOK_SECRET || '8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df';
    if (webhookData.secret !== expectedSecret) {
      return res.status(401).json({ error: 'Secret inválido' });
    }
    
    // Retornar sucesso
    return res.status(200).json({
      success: true,
      event: webhookData.event,
      email: webhookData.data?.customer?.email,
      offerId: webhookData.data?.offer?.id,
      message: 'Webhook recebido com sucesso (versão simplificada)'
    });
    
  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
};
