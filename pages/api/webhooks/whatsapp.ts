import type { NextApiRequest, NextApiResponse } from 'next';

// WhatsApp webhook handler for lab-site
// Configure in Twilio Console: https://console.twilio.com/

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // Twilio verification challenge
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('WhatsApp webhook verified!');
      return res.status(200).send(challenge);
    }
    
    return res.status(403).json({ error: 'Verification failed' });
  }

  if (req.method === 'POST') {
    // Handle incoming WhatsApp messages
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    
    // WhatsApp message received
    if (value?.messages) {
      const message = value.messages[0];
      const from = message.from; // User's WhatsApp number
      const body = message.text?.body;
      const messageId = message.id;

      console.log(`📱 WhatsApp message from ${from}: ${body}`);

      // TODO: Process message and generate response
      // For now, log it and acknowledge receipt
      
      // Example: Send to Clawdbot for processing
      // const response = await processWhatsAppMessage(from, body);
      // await sendWhatsAppReply(from, response);
    }

    // Status callback (delivery status)
    if (value?.statuses) {
      const status = value.statuses[0];
      console.log(`📤 Message ${status.id} status: ${status.status}`);
    }

    return res.status(200).json({ received: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
