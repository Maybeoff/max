# Развертывание Max Messenger в Docker

## Быстрый старт

1. **Установите Docker и Docker Compose** на сервере

2. **Клонируйте репозиторий**:
```bash
git clone https://github.com/Maybeoff/max.git
cd max
```

3. **Настройте переменные окружения**:
```bash
cp .env.example .env
nano .env
```

Заполните:
- `SMTP_USER` - ваш email для отправки кодов
- `SMTP_PASS` - пароль от email
- `SMTP_FROM` - email отправителя
- `RECAPTCHA_SECRET_KEY` - секретный ключ reCAPTCHA

4. **Запустите контейнеры**:
```bash
docker-compose up -d
```

5. **Проверьте статус**:
```bash
docker-compose ps
docker-compose logs -f backend
```

## Порты

- **5000** - Backend API и WebSocket
- **27017** - MongoDB (только внутри Docker сети)

## Nginx конфигурация

Если у вас уже настроен nginx на порт 5000, просто направьте его на `localhost:5000`:

```nginx
server {
    listen 80;
    server_name 109.61.108.70;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Управление

```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down

# Перезапуск
docker-compose restart

# Логи
docker-compose logs -f

# Обновление после git pull
docker-compose down
docker-compose build
docker-compose up -d
```

## Бэкап MongoDB

```bash
# Создать бэкап
docker exec messenger-mongodb mongodump --out /data/backup

# Восстановить
docker exec messenger-mongodb mongorestore /data/backup
```

## Troubleshooting

Если контейнер не запускается:
```bash
docker-compose logs backend
docker-compose logs mongodb
```

Если нужно пересобрать образы:
```bash
docker-compose build --no-cache
docker-compose up -d
```
