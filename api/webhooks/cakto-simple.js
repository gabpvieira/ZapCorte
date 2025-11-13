// Webhook simplificado para teste - SEM SUPABASE
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;
    
    // Log completo
    console.log('=== WEBHOOK RECEBIDO ===');
    console.log('Event:', webhookData.event);
    console.log('Customer:', webhookData.data?.customer?.email);
    console.log('Offer ID:', webhookData.data?.offer?.id);
    console.log('Amount:', webhookData.data?.amount);
    console.log('Payment Method:', webhookData.data?.paymentMethod);
    console.log('Status:', webhookData.data?.status);
    console.log('========================');
    
    // Validar secret
    const expectedSecret = process.env.CAKTO_WEBHOOK_SECRET || '8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df';
    const receivedSecret = webhookData.secret;
    
    console.log('Secret esperado:', expectedSecret);
    console.log('Secret recebido:', receivedSecret);
    console.log('Secret válido:', receivedSecret === expectedSecret);
    
    if (receivedSecret !== expectedSecret) {
      return res.status(401).json({ 
        error: 'Secret inválido',
        expected: expectedSecret.substring(0, 8) + '...',
        received: receivedSecret?.substring(0, 8) + '...'
      });
    }
    
    // Extrair dados importantes
    const customer = webhookData.data?.customer;
    const offer = webhookData.data?.offer;
    const transaction = webhookData.data;
    
    // Determinar plano
    let planType = 'starter';
    if (offer?.id === '3th8tvh') planType = 'starter';
    if (offer?.id === '9jk3ref') planType = 'pro';
    
    // Retornar sucesso com dados processados
    return res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso (SEM SUPABASE)',
      data: {
        event: webhookData.event,
        transactionId: transaction?.id,
        customer: {
          email: customer?.email,
          name: customer?.name
        },
        offer: {
          id: offer?.id,
          name: offer?.name
        },
        planType: planType,
        amount: transaction?.amount,
        paymentMethod: transaction?.paymentMethod,
        status: transaction?.status
      },
      note: 'Este webhook NÃO está salvando no Supabase - apenas para teste'
    });
    
  } catch (error) {
    console.error('ERRO NO WEBHOOK:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
  }
};
