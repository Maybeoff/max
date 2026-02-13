require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./models');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');
const messageRoutes = require('./routes/messages');
const uploadRoutes = require('./routes/upload');
const socketHandler = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// API Routes (BEFORE static files)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from React build
// Проверяем несколько возможных путей
const possiblePaths = [
  path.join(__dirname, 'build'),           // /root/max/backend/build
  path.join(__dirname, '../frontend/build'), // /root/max/frontend/build
  path.join(__dirname, '..', 'build')      // /root/max/build
];

let frontendPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    frontendPath = p;
    console.log(`📁 Frontend найден: ${p}`);
    break;
  }
}

if (frontendPath) {
  app.use(express.static(frontendPath));
  
  // All other routes return React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  console.log('⚠️  Frontend build не найден. Проверьте пути:', possiblePaths);
  app.get('/', (req, res) => {
    res.json({ 
      message: 'API работает. Frontend build не найден.',
      api: '/api',
      checkedPaths: possiblePaths
    });
  });
}

// Socket.io
socketHandler(io);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Что-то пошло не так!' });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`💾 База данных MongoDB готова`);
    console.log(`🌐 Приложение доступно на http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Не удалось подключиться к MongoDB:', err);
  process.exit(1);
});
