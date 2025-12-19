// src/components/AdminPanel.tsx

import React, { useState, useEffect } from 'react';

// --- Типы ---
interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  lastLogin: string;
  status: 'active' | 'inactive' | 'banned';
}

interface TrashUser {
  id: number;
  email: string;
  deleted_at: string;
}

// --- Конфигурация API ---
const ADMIN_API_BASE = 'http://127.0.0.1:8003/admin';

// --- Универсальный обработчик ответа с диагностикой ---
const handleResponse = async (response: Response) => {
  console.group(` Диагностика ответа: ${response.url}`);
  console.log('📌 Статус:', response.status, response.statusText);
  console.log('📋 Заголовки:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorText = 'Неизвестная ошибка';

    try {
      if (contentType?.includes('application/json')) {
        const errorJson = await response.json();
        console.error(' Ошибка (JSON):', errorJson);
        errorText = Array.isArray(errorJson.detail)
          ? errorJson.detail.map((d: any) => d.msg).join(', ')
          : typeof errorJson.detail === 'string'
            ? errorJson.detail
            : JSON.stringify(errorJson);
      } else {
        const text = await response.text();
        console.error(' Ошибка (текст):', text);
        errorText = text;
      }
    } catch (e) {
      console.error(' Не удалось распарсить тело ошибки');
    }

    console.groupEnd();
    throw new Error(errorText || `Ошибка сети: ${response.status}`);
  }

  try {
    const data = await response.json();
    console.log(' Ответ (JSON):', data);
    console.groupEnd();
    return data;
  } catch (e) {
    console.error(' Ошибка парсинга JSON');
    console.groupEnd();
    throw new Error('Invalid JSON response from server');
  }
};

// --- API Сервисы ---
const adminAPI = {
  getUsers: async (): Promise<User[]> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Требуется авторизация');

    const res = await fetch(`${ADMIN_API_BASE}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const rawData = await handleResponse(res);

    const usersArray = Array.isArray(rawData)
      ? rawData
      : rawData.users && Array.isArray(rawData.users)
        ? rawData.users
        : [];

    return usersArray.map((user: any) => ({
      id: String(user.id),
      fullName: [user.first_name, user.last_name].filter(Boolean).join(' ') || 'N/A',
      username: user.email.split('@')[0],
      email: user.email,
      role: user.attributes?.role || 'user',
      lastLogin: user.last_login
        ? new Date(user.last_login).toLocaleString()
        : '—',
      status: user.deleted_at
        ? 'banned'
        : user.is_active
          ? 'active'
          : 'inactive'
    }));
  },

  getTrash: async (): Promise<TrashUser[]> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Требуется авторизация');

    const res = await fetch(`${ADMIN_API_BASE}/trash`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const rawData = await handleResponse(res);

    const trashArray = Array.isArray(rawData.deleted_users)
      ? rawData.deleted_users
      : [];

    return trashArray.map((user: any) => ({
      id: user.id,
      email: user.email,
      deleted_at: new Date(user.deleted_at).toLocaleString()
    }));
  },

  deleteUser: async (userId: string): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Требуется авторизация');

    const res = await fetch(`${ADMIN_API_BASE}/users/${userId}?confirm=true`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    await handleResponse(res);
  },

  hardDeleteUser: async (userId: string): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Требуется авторизация');

    const res = await fetch(`${ADMIN_API_BASE}/trash/${userId}?confirm=true`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    await handleResponse(res);
  },

  restoreUser: async (userId: string): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Требуется авторизация');

    const res = await fetch(`${ADMIN_API_BASE}/users/${userId}/restore`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    await handleResponse(res);
  },

  updatePermissions: async (userId: string, permissions: Record<string, Record<string, boolean>>) => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Требуется авторизация');

    const res = await fetch(`${ADMIN_API_BASE}/users/${userId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permissions }),
    });

    await handleResponse(res);
  },

  createUser: async (userData: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Требуется авторизация');

    const res = await fetch(`${ADMIN_API_BASE}/underground`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    await handleResponse(res);
  },

  importUsersCSV: async (file: File) => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Требуется авторизация');

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${ADMIN_API_BASE}/underground/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    await handleResponse(res);
  },
};

// --- Основной компонент ---
const AdminPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [trash, setTrash] = useState<TrashUser[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'trash' | 'add'>('users');

  // --- Состояние для модального окна ---
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedService, setSelectedService] = useState<string>('auth');

  // Хранит права по каждому сервису: { serviceName: { read, write, delete } }
  const [servicePermissions, setServicePermissions] = useState<Record<string, { read: boolean; write: boolean; delete: boolean }>>({});

  // Локальное состояние — текущие флаги для выбранного сервиса
  const [permissions, setPermissions] = useState({
    read: false,
    write: false,
    delete: false,
  });

  // --- Состояние для формы добавления ---
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // --- Список доступных сервисов ---
  const services = [
    'auth',
    'storage',
    'analytics',
    'chat',
    'workflow',
    'admin',
    'docflow',
    'logging',
    'video',
  ];

  // --- Загрузка данных ---
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Требуется авторизация');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        if (activeTab === 'users') {
          const usersData = await adminAPI.getUsers();
          setUsers(usersData);
        } else if (activeTab === 'trash') {
          const trashData = await adminAPI.getTrash();
          setTrash(trashData);
        }
        setError('');
      } catch (err: any) {
        const errorMsg = err.message || String(err) || 'Неизвестная ошибка';
        setError(` ${errorMsg}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab]);

  // --- Обработка клика по пользователю ---
  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    // Сохраняем текущие значения перед переключением
    setServicePermissions(prev => ({
      ...prev,
      [selectedService]: permissions,
    }));
    // Подгружаем сохранённые права для 'auth' по умолчанию
    const saved = servicePermissions['auth'] || { read: false, write: false, delete: false };
    setSelectedService('auth');
    setPermissions(saved);
  };

  // --- Закрытие модального окна ---
  const closeModal = () => {
    setSelectedUser(null);
  };

  // --- Изменение выбранного сервиса ---
  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const service = e.target.value;

    // Сохраняем текущие права для предыдущего сервиса
    setServicePermissions(prev => ({
      ...prev,
      [selectedService]: permissions,
    }));

    // Подгружаем сохранённые права для нового сервиса
    const saved = servicePermissions[service] || { read: false, write: false, delete: false };
    setPermissions(saved);
    setSelectedService(service);
  };

  // --- Переключение прав ---
  const togglePermission = (perm: 'read' | 'write' | 'delete') => {
    setPermissions(prev => ({ ...prev, [perm]: !prev[perm] }));
  };

  // --- Сохранение прав ---
  const savePermissions = async () => {
    if (!selectedUser) return;

    // Формируем объект прав для отправки
    const permsToSave = {
      [selectedService]: {
        read: permissions.read,
        write: permissions.write,
        delete: permissions.delete,
      },
    };

    // Обновляем локальное хранилище
    setServicePermissions(prev => ({
      ...prev,
      [selectedService]: { ...permissions },
    }));

    try {
      await adminAPI.updatePermissions(selectedUser.id, permsToSave);
      alert(`Права для "${selectedService}" успешно сохранены`);
      closeModal();
    } catch (err: any) {
      const errorMsg = err.message || String(err) || 'Ошибка сохранения';
      setError(`Ошибка сохранения прав: ${errorMsg}`);
    }
  };

  // --- Удаление пользователя (soft delete) ---
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя? Это действие можно отменить.')) return;

    try {
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setActiveTab('trash');
    } catch (err: any) {
      const errorMsg = err.message || String(err) || 'Ошибка удаления';
      setError(`Ошибка при удалении: ${errorMsg}`);
    }
  };

  // --- Восстановление пользователя ---
  const handleRestoreUser = async (userId: string) => {
    if (!window.confirm('Восстановить этого пользователя?')) return;

    try {
      await adminAPI.restoreUser(userId);
      setTrash(prev => prev.filter(u => u.id !== Number(userId)));
      setActiveTab('users');
    } catch (err: any) {
      const errorMsg = err.message || String(err) || 'Ошибка восстановления';
      setError(`Ошибка при восстановлении: ${errorMsg}`);
    }
  };

  // --- Окончательное удаление из корзины ---
  const handleHardDeleteUser = async (userId: string) => {
    if (!window.confirm('Удалить пользователя навсегда? Это действие нельзя отменить.')) return;

    try {
      await adminAPI.hardDeleteUser(userId);
      setTrash(prev => prev.filter(u => u.id !== Number(userId)));
    } catch (err: any) {
      const errorMsg = err.message || String(err) || 'Ошибка окончательного удаления';
      setError(`Ошибка при удалении навсегда: ${errorMsg}`);
    }
  };

  // --- Добавление одного пользователя ---
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password) {
      setError('Email и пароль обязательны');
      return;
    }

    try {
      await adminAPI.createUser(newUser);
      alert('Пользователь успешно добавлен');
      setNewUser({ email: '', password: '', first_name: '', last_name: '' });
      if (activeTab === 'users') {
        const usersData = await adminAPI.getUsers();
        setUsers(usersData);
      }
    } catch (err: any) {
      const errorMsg = err.message || String(err) || 'Ошибка при добавлении';
      setError(`Ошибка при добавлении: ${errorMsg}`);
    }
  };

  // --- Загрузка CSV ---
  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      setError('Выберите CSV-файл');
      return;
    }

    try {
      await adminAPI.importUsersCSV(csvFile);
      alert('Пользователи из CSV успешно добавлены');
      setCsvFile(null);
      if (activeTab === 'users') {
        const usersData = await adminAPI.getUsers();
        setUsers(usersData);
      }
    } catch (err: any) {
      const errorMsg = err.message || String(err) || 'Ошибка импорта';
      setError(`Ошибка при импорте CSV: ${errorMsg}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="text-lg text-gray-600">Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Панель администратора</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg shadow-sm whitespace-pre-wrap">
          {error}
        </div>
      )}

      {/* Вкладки */}
      <div className="flex gap-1 mb-8 border-b">
        {[
          { key: 'users', label: 'Пользователи' },
          { key: 'logs', label: 'Логи активности' },
          { key: 'trash', label: 'Корзина' },
          { key: 'add', label: 'Добавить' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-6 py-3 font-semibold transition-colors duration-200 capitalize ${
              activeTab === tab.key
                ? 'border-b-3 border-blue-600 text-blue-700 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Пользователи */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Пользователь</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Роль</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Последний вход</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Статус</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      Нет пользователей
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr
                      key={user.id}
                      className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleUserClick(user)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4 capitalize font-medium text-gray-700">{user.role}</td>
                      <td className="px-6 py-4 text-gray-600">{user.lastLogin}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            user.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : user.status === 'inactive'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.status === 'active' ? 'Активен' : user.status === 'inactive' ? 'Неактивен' : 'Заблокирован'}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user.id);
                          }}
                          className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Логи */}
      {activeTab === 'logs' && (
        <div className="p-10 text-center text-gray-500 bg-gray-50 rounded-xl">
          Логи временно недоступны.
        </div>
      )}

      {/* Корзина */}
      {activeTab === 'trash' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Пользователь</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Дата удаления</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Действия</th>
                </tr>
              </thead>
              <tbody>
                {trash.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                      Корзина пуста
                    </td>
                  </tr>
                ) : (
                  trash.map(user => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium">{user.email}</div>
                        <div className="text-xs text-gray-500">@{user.email.split('@')[0]}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{user.deleted_at}</td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          onClick={() => handleRestoreUser(String(user.id))}
                          className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                        >
                          Восстановить
                        </button>
                        <button
                          onClick={() => handleHardDeleteUser(String(user.id))}
                          className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                        >
                          Удалить навсегда
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Добавить */}
      {activeTab === 'add' && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">Добавить одного пользователя</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Пароль *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Имя</label>
                <input
                  type="text"
                  value={newUser.first_name}
                  onChange={e => setNewUser({ ...newUser, first_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Иван"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Фамилия</label>
                <input
                  type="text"
                  value={newUser.last_name}
                  onChange={e => setNewUser({ ...newUser, last_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Иванов"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Добавить пользователя
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">Загрузить CSV с пользователями</h2>
            <p className="text-gray-600 mb-4">
              Формат файла: <code>email,password,first_name,last_name</code>
            </p>
            <pre className="bg-gray-100 p-3 rounded text-sm mb-4">
              email,password,first_name,last_name<br />
              user1@ex.com,pass123,Анна,<br />
              user2@ex.com,pass456,Петр,Сидоров
            </pre>
            <form onSubmit={handleCsvUpload} className="space-y-4">
              <input
                type="file"
                accept=".csv"
                onChange={e => setCsvFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Загрузить CSV
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Права доступа</h2>
            <p className="text-gray-600 mb-2">Пользователь: <strong>{selectedUser.fullName}</strong></p>
            <p className="text-gray-600 mb-4">Логин: <code className="bg-gray-100 px-2 py-1 rounded">@{selectedUser.username}</code></p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Сервис</label>
              <select
                value={selectedService}
                onChange={handleServiceChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {services.map(svc => (
                  <option key={svc} value={svc}>
                    {svc.charAt(0).toUpperCase() + svc.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => togglePermission('read')}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  permissions.read
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Read
              </button>
              <button
                onClick={() => togglePermission('write')}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  permissions.write
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Write
              </button>
              <button
                onClick={() => togglePermission('delete')}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  permissions.delete
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Delete
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={savePermissions}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
              >
                Сохранить
              </button>
              <button
                onClick={closeModal}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;