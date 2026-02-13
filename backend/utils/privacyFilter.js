// Фильтрация данных пользователя на основе настроек приватности
const filterUserData = (user, viewerId, isContact = false) => {
  if (!user) return null;
  
  const userData = user.toObject ? user.toObject() : { ...user };
  const privacy = userData.privacySettings || {};
  
  // Если смотрит сам себя - показываем всё
  if (userData._id.toString() === viewerId.toString()) {
    return userData;
  }
  
  // Проверяем каждую настройку приватности
  const checkPrivacy = (setting) => {
    if (!privacy[setting]) return true; // По умолчанию показываем
    
    if (privacy[setting] === 'everyone') return true;
    if (privacy[setting] === 'nobody') return false;
    if (privacy[setting] === 'contacts') return isContact;
    
    return true;
  };
  
  // Фильтруем данные
  if (!checkPrivacy('showEmail')) {
    delete userData.email;
  }
  
  if (!checkPrivacy('showPhone')) {
    delete userData.phone;
  }
  
  if (!checkPrivacy('showLastSeen')) {
    delete userData.lastSeen;
  }
  
  if (!checkPrivacy('showAvatar')) {
    userData.avatar = '';
  }
  
  if (!checkPrivacy('showBio')) {
    delete userData.bio;
  }
  
  // Всегда удаляем пароль
  delete userData.password;
  
  return userData;
};

module.exports = { filterUserData };
