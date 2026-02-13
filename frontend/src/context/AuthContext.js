import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Нативные функции для работы с cookies
const setCookie = (name, value, days = 30) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
};

const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Восстанавливаем авторизацию при загрузке
    const initAuth = () => {
      try {
        // Проверяем localStorage (основное хранилище)
        const token = localStorage.getItem('auth_token');
        const userDataStr = localStorage.getItem('auth_user');
        
        console.log('🔍 Проверка авторизации:', { 
          hasToken: !!token, 
          hasUserData: !!userDataStr 
        });
        
        if (token && userDataStr) {
          const userData = JSON.parse(userDataStr);
          
          // Устанавливаем заголовок
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Восстанавливаем пользователя
          setUserState(userData);
          
          // Дублируем в cookies для надежности
          setCookie('auth_token', token, 30);
          setCookie('auth_user', userDataStr, 30);
          
          console.log('✅ Пользователь восстановлен:', userData.username);
        } else {
          console.log('❌ Нет сохраненной авторизации');
        }
      } catch (error) {
        console.error('❌ Ошибка восстановления авторизации:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const saveAuth = (token, userData) => {
    console.log('💾 Сохранение авторизации:', userData.username);
    
    const userDataStr = JSON.stringify(userData);
    
    // Основное хранилище - localStorage
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', userDataStr);
    
    // Дублируем в cookies
    setCookie('auth_token', token, 30);
    setCookie('auth_user', userDataStr, 30);
    
    // Устанавливаем заголовок
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Обновляем state
    setUserState(userData);
  };

  const clearAuth = () => {
    console.log('🗑️ Очистка авторизации');
    
    // Удаляем из localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    // Удаляем cookies
    deleteCookie('auth_token');
    deleteCookie('auth_user');
    
    // Удаляем заголовок
    delete axios.defaults.headers.common['Authorization'];
    
    // Очищаем state
    setUserState(null);
  };

  const login = async (email, password) => {
    try {
      const { data } = await axios.post('/api/auth/login', {
        email,
        password
      });
      
      saveAuth(data.token, data);
      return data;
    } catch (error) {
      console.error('❌ Ошибка входа:', error);
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      const { data } = await axios.post('/api/auth/register', {
        username,
        email,
        password
      });
      
      saveAuth(data.token, data);
      return data;
    } catch (error) {
      console.error('❌ Ошибка регистрации:', error);
      throw error;
    }
  };

  const logout = () => {
    clearAuth();
  };

  const updateUser = (updatedData) => {
    const newUserData = { ...user, ...updatedData };
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      saveAuth(token, newUserData);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser: updateUser, 
      login, 
      register, 
      logout, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
