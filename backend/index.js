const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────
// CORS: Permissive for testing (will tighten later with allowedOrigins)
app.use(cors());
app.use(express.json());

// ── Request Logger ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`🌐 [${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ── MongoDB connection (Shared) ───────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/donornet';
console.log(`📡 Attempting MongoDB connection to: ${MONGO_URI.replace(/\/\/.*@/, '//****@')}`);
// Enable buffering so queries wait for MongoDB to connect instead of throwing immediately
mongoose.set('bufferCommands', true);
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Unified Backend: Shared MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ Unified Backend: MongoDB connection error:', err.message);
    console.warn('⚠️  Proceeding without database — some routes may fail.');
  });

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    unified: true, 
    services: ['auth', 'donor', 'hospital', 'request', 'gateway'],
    timestamp: new Date().toISOString()
  });
});

// ── AI Assistant (Gemini) ─────────────────────────────────────────────────
// Consolidated from api-gateway
app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  const prompt = `You are the Expert AI Assistant for DonorNet, a blood donation platform.
A user is asking: "${message}"

Provide a helpful, concise, and scientifically accurate answer about blood donation, hospital features, or medical concerns. Keep your answer encouraging and under 100 words.`;

  // Recommended production models with maximum fallback robustness:
  const modelCandidates = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-flash-latest'];

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Gemini API key not configured on server.' });
  }

  const genAI = new GoogleGenerativeAI(key);
  let lastError = null;

  for (const modelName of modelCandidates) {
    try {
      console.log(`🤖 Trying AI model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const reply = result.response.text().trim();
      console.log(`✅ AI responded using: ${modelName}`);
      return res.json({ reply });
    } catch (error) {
      console.error(`❌ Model ${modelName} failed: ${error.message}`);
      lastError = error;
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        console.warn(`⚠️ Rate limit hit for ${modelName}, trying fallback model...`);
      }
    }
  }

  // If ALL models failed, check if the last error was a quota issue
  if (lastError?.message?.includes('429') || lastError?.message?.includes('RESOURCE_EXHAUSTED')) {
    return res.status(429).json({ 
      error: 'Your Google Gemini API free-tier quota is completely exhausted or unavailable in your region. Please check your Google AI Studio billing.',
      details: lastError.message
    });
  }

  res.status(500).json({ 
    error: 'Failed to generate AI response. All model attempts failed.', 
    details: lastError?.message 
  });
});

// ── Unified Routes ─────────────────────────────────────────────────────────

// Each service's router is mounted under the prefix previously handled by the API Gateway.
// Consolidated monolith routes:

// Auth Service — specific sub-routes first
app.use('/api/auth/notifications', require('./routes/notifications'));
app.use('/api/auth', require('./routes/auth'));

// Admin Service
app.use('/api/admin', require('./routes/admin'));

// Donor Service — specific sub-routes first
app.use('/api/donors/appointments', require('./routes/donorAppointments'));
app.use('/api/donors', require('./routes/donor'));

// Hospital Service — specific sub-routes first
app.use('/api/hospitals/appointments', require('./routes/hospitalAppointments'));
app.use('/api/hospitals', require('./routes/hospital'));

// Request Service — specific sub-routes first
app.use('/api/requests/matches', require('./routes/matching'));
app.use('/api/requests', require('./routes/requests'));

// ── Global Error Handler ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`❌ Global Error: ${err.message}`);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message,
    path: req.url 
  });
});

// ── Start Server ──────────────────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(50));
  console.log(`🚀 UNIFIED BACKEND ENGINE STARTED`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI Chat: POST /api/ai/chat`);
  console.log(`📁 Microservices Consolidated: 5 -> 1`);
  console.log('='.repeat(50) + '\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ FATAL: Port ${PORT} is already in use.`);
    console.error(`👉 Try killing the existing process or use a different PORT in .env`);
    process.exit(1);
  } else {
    console.error(`❌ Server Error:`, err.message);
  }
});

// Trigger restart for node --watch - Atlas DB connected!
