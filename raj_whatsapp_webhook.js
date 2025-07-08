// raj_whatsapp_webhook.js
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = require('./firebaseServiceKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const sessionsRef = db.collection('sessions');

const app = express();
const PORT = process.env.PORT || 3000;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const questions = [
  "What city is your project located in?",
  "What is the approximate square footage of your basement?",
  "Is this for personal use or a legal second unit?",
  "How many bathrooms, kitchens, laundry areas, or wet bars would you like to include?",
  "Do you need a side entrance? (Yes/No)",
  "Do you need new windows added or enlarged? (Yes/No)",
  "Do you currently have a permit? (Yes/No)",
  "Is the basement currently unfinished or previously built?",
  "What is your full name and email so we can send you the estimate?"
];

app.get('/', (req, res) => {
  res.send('Raj WhatsApp AI agent is running with Firebase.');
});

app.post('/webhook', async (req, res) => {
  const incomingMessage = req.body.Body?.trim();
  const from = req.body.From;

  console.log(`📩 Message received from ${from}: ${incomingMessage}`);

  try {
    let sessionDoc = await sessionsRef.doc(from).get();
    let session = sessionDoc.exists ? sessionDoc.data() : { step: 0, answers: [] };
    let responseMessage = '';

    if (incomingMessage.toLowerCase() === 'restart') {
      session = { step: 0, answers: [] };
      responseMessage = `Restarting... 👷‍♂️ ${questions[0]}`;
    } else if (session.step === 0) {
      responseMessage = `Hey! Raj here 👋 I'm with Goldenstar Renovation. I can help you get a basement estimate in just a few questions. ${questions[0]}`;
      session.step++;
    } else if (session.step <= questions.length) {
      session.answers.push(incomingMessage);
      if (session.step === questions.length) {
        responseMessage = `Thanks ${session.answers[session.answers.length - 1]}! We’re now generating your estimate and will email it to you shortly.`;
        session.step++;
        // Trigger PDF + Knowify Integration here
      } else {
        responseMessage = questions[session.step];
        session.step++;
      }
    } else {
      responseMessage = `You're all set! If you'd like to start over, just reply with 'restart'.`;
    }

    await sessionsRef.doc(from).set(session);

    await client.messages.create({
      body: responseMessage,
      from: 'whatsapp:+17742285429',
      to: from
    });

    console.log('✅ Message sent');
    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).send('Error processing request');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Raj's WhatsApp webhook is running on port ${PORT}`);
});
