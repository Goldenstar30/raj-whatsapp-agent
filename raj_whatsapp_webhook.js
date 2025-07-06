const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const accountSid = process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_ACCOUNT_SID';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'YOUR_TWILIO_AUTH_TOKEN';
const client = twilio(accountSid, authToken);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Raj WhatsApp AI agent is running.');
});

app.post('/webhook', async (req, res) => {
  const incomingMessage = req.body.Body?.trim().toLowerCase();
  const from = req.body.From;
  console.log(`📩 Message received from ${from}: ${incomingMessage}`);

  try {
    let responseMessage = '';
    if (incomingMessage === 'hi' || incomingMessage === 'hello') {
      responseMessage = `Hey! Raj here 👋 I'm with Goldenstar Renovation. I can help you get a basement estimate in just a few questions. Ready to start?`;
    } else {
      responseMessage = `Hi again! Raj here. If you'd like to begin your basement estimate, just reply with 'hi'.`;
    }

    const sent = await client.messages.create({
      body: responseMessage,
      from: 'whatsapp:+17742285429',
      to: from
    });

    console.log('✅ Message sent with SID:', sent.sid);
    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Error sending message:', err);
    res.status(500).send('Failed to respond');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Raj's WhatsApp webhook is running on port ${PORT}`);
});
