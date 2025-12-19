import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type AuthMode = 'login' | 'register' | 'reset' | 'confirm';

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  agreeToTerms: boolean;
}

interface ResetPasswordForm {
  email: string;
}

interface ConfirmForm {
  code: string;
}

const API_BASE = 'http://127.0.0.1:8001/auth';

const Auth: React.FC = () => {
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(window.location.search);
  const initialMode = (
    ['login', 'register', 'reset', 'confirm'].includes(queryParams.get('mode') || '')
      ? queryParams.get('mode') as AuthMode
      : 'login'
  );

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: '',
    remember: false,
  });

  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    agreeToTerms: false,
  });

  const [resetForm, setResetForm] = useState<ResetPasswordForm>({ email: '' });
  const [confirmForm, setConfirmForm] = useState<ConfirmForm>({ code: '' });

  const [confirmEmail, setConfirmEmail] = useState<string>(queryParams.get('email') || '');

  // Обновляем registerForm.email, если есть email в URL
  useEffect(() => {
    if (confirmEmail && mode === 'confirm') {
      setRegisterForm(prev => ({ ...prev, email: confirmEmail }));
    }
  }, [confirmEmail, mode]);

  // Синхронизация mode и email с URL
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('mode', mode);
    if (registerForm.email) params.set('email', registerForm.email);
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
  }, [mode, registerForm.email]);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(password);

  // === Универсальный парсер ошибок ===
  const parseError = async (response: Response): Promise<string> => {
    let errorMsg = 'Ошибка сети или сервера';

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await response.json().catch(() => null);
        if (errorData) {
          if (typeof errorData.detail === 'string') return errorData.detail;
          if (Array.isArray(errorData.detail)) {
            return errorData.detail.map((d: any) => d.msg || d).join(', ');
          }
          return JSON.stringify(errorData.detail || errorData);
        }
      }
      const text = await response.text();
      return text || errorMsg;
    } catch (e) {
      return errorMsg;
    }
  };

  // === Вход ===
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!loginForm.email || !loginForm.password) {
      setError('Заполните все поля');
      return;
    }

    if (!validateEmail(loginForm.email)) {
      setError('Введите корректный email адрес');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', loginForm.email);
      formData.append('password', loginForm.password);

      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      if (!response.ok) throw new Error(await parseError(response));

      const data = await response.json();
      localStorage.setItem('auth_token', data.access_token);
      setSuccess('Вход выполнен успешно!');
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  // === Регистрация ===
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!registerForm.firstName || !registerForm.lastName || !registerForm.email || !registerForm.password) {
      setError('Заполните все обязательные поля');
      return;
    }

    if (!validateEmail(registerForm.email)) {
      setError('Введите корректный email адрес');
      return;
    }

    if (!validatePassword(registerForm.password)) {
      setError('Пароль должен содержать минимум 8 символов, заглавную букву, строчную букву и цифру');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (!registerForm.agreeToTerms) {
      setError('Необходимо согласиться с условиями использования');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: registerForm.firstName,
          last_name: registerForm.lastName,
          email: registerForm.email,
          password: registerForm.password,
          department: registerForm.department || undefined,
        }),
      });

      if (!response.ok) throw new Error(await parseError(response));

      setSuccess('Регистрация успешна! Введите код подтверждения из письма.');
      setMode('confirm');
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  // === Подтверждение кода ===
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!confirmForm.code || !/^\d{6}$/.test(confirmForm.code)) {
      setError('Введите 6-значный код');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/confirm-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerForm.email, code: confirmForm.code }),
      });

      if (!response.ok) throw new Error(await parseError(response));

      setSuccess('Email подтверждён! Теперь можно войти.');
      setTimeout(() => setMode('login'), 1500);
    } catch (err: any) {
      setError(err.message || 'Ошибка подтверждения');
    } finally {
      setIsLoading(false);
    }
  };

  // === Повторная отправка кода ===
  const handleResendCode = async () => {
    setError('');
    setSuccess('');

    const emailToSend = registerForm.email || confirmEmail;
    if (!emailToSend) {
      setError('Email не указан');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend }),
      });

      if (!response.ok) throw new Error(await parseError(response));

      setSuccess('Код отправлен повторно на ваш email');
    } catch (err: any) {
      setError(err.message || 'Ошибка при отправке кода');
    } finally {
      setIsLoading(false);
    }
  };

  // === Восстановление пароля ===
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resetForm.email) {
      setError('Введите email адрес');
      return;
    }

    if (!validateEmail(resetForm.email)) {
      setError('Введите корректный email адрес');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetForm.email }),
      });

      if (!response.ok) throw new Error(await parseError(response));

      setSuccess('Инструкции по восстановлению пароля отправлены на ваш email');
      setResetForm({ email: '' });
      setTimeout(() => setMode('login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <h1 className="text-center text-3xl font-bold text-gray-800 mb-1">Центр реабилитации</h1>
        <h2 className="text-center text-xl text-gray-600 mb-6">
          {mode === 'login' && 'Вход в систему'}
          {mode === 'register' && 'Регистрация'}
          {mode === 'reset' && 'Восстановление пароля'}
          {mode === 'confirm' && 'Подтверждение email'}
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {String(error)}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* === Форма Входа === */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="example@mail.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="Введите пароль"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={loginForm.remember}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, remember: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                Запомнить меня
              </label>
            </div>

            <button
              type="button"
              onClick={() => setMode('reset')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-left"
            >
              Забыли пароль?
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>

            <p className="text-center text-sm text-gray-700">
              Нет аккаунта?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Зарегистрироваться
              </button>
            </p>
          </form>
        )}

        {/* === Форма Регистрации === */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Имя *</label>
              <input
                type="text"
                value={registerForm.firstName}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, firstName: e.target.value })
                }
                placeholder="Иван"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Фамилия *</label>
              <input
                type="text"
                value={registerForm.lastName}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, lastName: e.target.value })
                }
                placeholder="Иванов"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, email: e.target.value })
                }
                placeholder="example@mail.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Отделение</label>
              <input
                type="text"
                value={registerForm.department}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    department: e.target.value,
                  })
                }
                placeholder="Введите отделение"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Пароль *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    password: e.target.value,
                  })
                }
                placeholder="Минимум 8 символов"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Пароль должен содержать минимум 8 символов, заглавную букву, строчную букву и цифру
            </p>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Подтвердите пароль *</label>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={registerForm.confirmPassword}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Повторите пароль"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={registerForm.agreeToTerms}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    agreeToTerms: e.target.checked,
                  })
                }
                className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-700">
                Я согласен с условиями использования и политикой конфиденциальности
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>

            <p className="text-center text-sm text-gray-700">
              Уже есть аккаунт?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Войти
              </button>
            </p>
          </form>
        )}

        {/* === Форма Подтверждения === */}
        {mode === 'confirm' && (
          <form onSubmit={handleConfirm} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Мы отправили 6-значный код на{' '}
              <strong>{registerForm.email || confirmEmail}</strong>. Введите его ниже.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Код подтверждения *</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={confirmForm.code}
                onChange={(e) => setConfirmForm({ code: e.target.value })}
                placeholder="123456"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono text-lg tracking-widest"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Не пришёл код? Отправить снова
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Проверка...' : 'Подтвердить'}
            </button>

            <button
              type="button"
              onClick={() => setMode('register')}
              className="w-full text-gray-600 hover:text-gray-700 font-semibold py-3"
            >
              Изменить email
            </button>
          </form>
        )}

        {/* === Восстановление пароля === */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Введите ваш email и мы отправим инструкции по восстановлению пароля
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={resetForm.email}
                onChange={(e) => setResetForm({ email: e.target.value })}
                placeholder="example@mail.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Отправка...' : 'Отправить'}
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-blue-600 hover:text-blue-700 font-semibold py-3"
            >
              Вернуться ко входу
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;