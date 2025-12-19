import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const navigationLinks = [
  { path: '/testing', label: 'Тестирование' },
  { path: '/video-consultations', label: 'Видеоконсультации' },
  { path: '/documents', label: 'Документооборот' },
  { path: '/chat', label: 'Чат психологов' },
  { path: '/profile', label: 'Личный кабинет' },
  { path: '/help', label: 'Помощь' },
];

interface UserProfile {
  firstName: string;
  lastName: string;
  role: string;
}

const AppHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path);

  // Проверяем, авторизован ли пользователь
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        // Декодируем JWT (без проверки подписи — только для получения данных)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          firstName: payload.first_name || payload.sub || 'Пользователь',
          lastName: payload.last_name || '',
          role: payload.role || 'Пользователь',
        });
        setIsAuthenticated(true);
      } catch (e) {
        console.warn('Invalid token');
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
        setUser(null);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/'); // или можно перейти на /auth?mode=login
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="flex items-center space-x-3 group"
            aria-label="Главная страница"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-200">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-gray-900 block leading-tight">Центр реабилитации</span>
              <span className="text-xs text-gray-500">ГКУ Иркутской области</span>
            </div>
          </Link>

          {/* Основное меню */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Правая часть: вход/профиль */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              // Профиль пользователя после входа
              <div className="hidden sm:flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-600">{user.role}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user.firstName[0]}
                  {user.lastName[0] || user.firstName[1] || ''}
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 text-xs text-red-600 hover:text-red-800 font-medium"
                  aria-label="Выйти из системы"
                >
                  Выход
                </button>
              </div>
            ) : (
              // Кнопка Войти/Зарегистрироваться
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Войти / Зарегистрироваться
              </Link>
            )}

            {/* Мобильное меню */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              aria-label="Открыть мобильное меню"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Мобильное меню */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navigationLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Мобильная кнопка входа/выхода */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
              >
                Выйти
              </button>
            ) : (
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Войти / Зарегистрироваться
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default AppHeader;