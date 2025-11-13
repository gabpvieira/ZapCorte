// Plans API endpoint
export default function handler(req, res) {
  res.status(200).json({
    starter: {
      name: 'Starter',
      price: 29.90,
      checkoutUrl: `https://pay.cakto.com.br/${process.env.CAKTO_PRODUCT_ID_STARTER || '3th8tvh'}`
    },
    pro: {
      name: 'Pro',
      price: 59.90,
      checkoutUrl: `https://pay.cakto.com.br/${process.env.CAKTO_PRODUCT_ID_PRO || '9jk3ref'}`
    }
  });
}
