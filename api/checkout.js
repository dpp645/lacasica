// Función serverless de Vercel que crea una sesión de pago en Stripe.
// Recibe el carrito desde la web y devuelve una URL de checkout de Stripe.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Solo aceptamos peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Habilitamos CORS para que la web de GitHub Pages pueda llamar a esta función
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { items } = req.body;

    // Convertimos cada producto del carrito al formato que espera Stripe
    const line_items = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.nombre,
          description: item.unidad,
        },
        // Stripe trabaja en céntimos — multiplicamos por 100
        unit_amount: Math.round(item.precio * 100),
      },
      quantity: item.cantidad,
    }));

    // Creamos la sesión de checkout en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      // Tras el pago redirigimos al usuario de vuelta a la web
      success_url: `${req.headers.origin || 'https://tuusuario.github.io/lacasica'}?pago=ok`,
      cancel_url:  `${req.headers.origin || 'https://tuusuario.github.io/lacasica'}?pago=cancelado`,
      // Datos de contacto opcionales para el recibo
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: true },
    });

    // Devolvemos la URL de pago a la web
    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Error Stripe:', error);
    res.status(500).json({ error: error.message });
  }
};
