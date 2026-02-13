# Backend - Документация

## Установка и запуск

### 1. Установка зависимостей
```bash
cd backend
npm install
```

### 2. Настройка окружения
Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

Отредактируйте `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/messenger
JWT_SECRET=ваш_секретный_ключ_минимум_32_символа
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 3. Запуск MongoDB
Убедитесь, что MongoDB запущен:
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### 4. Запуск сервера
```bash
# Режим разработки
npm run dev

# Продакшн
npm start
```

Сервер запустится на `http://localhost:5000`

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход

### Пользователи
- `GET /api/users/me` - Текущий пользователь
- `PUT /api/users/me` - Обновить профиль
- `GET /api/users/search?query=` - Поиск пользователей

### Чаты
- `GET /api/chats` - Список чатов
- `POST /api/chats` - Создать чат
- `GET /api/chats/:id` - Получить чат

### Сообщения
- `GET /api/messages/:chatId` - Сообщения чата
- `POST /api/messages` - Отправить сообщение
- `PUT /api/messages/:id/read` - Отметить прочитанным

## Socket.io Events

### Client -> Server
- `join-chat` - Присоединиться к чату
- `leave-chat` - Покинуть чат
- `send-message` - Отправить сообщение
- `typing` - Начал печатать
- `stop-typing` - Закончил печатать

### Server -> Client
- `new-message` - Новое сообщение
- `user-typing` - Пользователь печатает
- `user-stop-typing` - Пользователь закончил печатать

## Структура проекта
```
backend/
├── models/          # Mongoose модели
├── routes/          # Express маршруты
├── middleware/      # Middleware (auth)
├── socket/          # Socket.io обработчики
├── server.js        # Точка входа
└── .env            # Конфигурация
```

## Развертывание

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### Heroku
```bash
heroku create your-app-name
heroku addons:create mongolab
git push heroku main
```

## Безопасность

- JWT токены для аутентификации
- Bcrypt для хеширования паролей
- Helmet для защиты заголовков
- Rate limiting для защиты от DDoS
- CORS настроен для фронтенда
