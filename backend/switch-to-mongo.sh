#!/bin/bash

echo "Переключение на MongoDB..."

# Backup текущих моделей
if [ -d "models" ]; then
  mv models models-sequelize-backup
fi

# Переименовываем mongoose модели в models
if [ -d "models-mongoose" ]; then
  mv models-mongoose models
fi

echo "✅ Переключено на MongoDB"
echo "Не забудьте обновить .env файл с MONGODB_URI"
