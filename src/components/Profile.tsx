import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_GATEWAY } from '../services/api';
// ==================== ТИПЫ ====================
type ProfileTab = 'info' | 'sessions' | 'documents' | 'activity' | 'settings';

interface ProfileData {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
  bio?: string;
  organization?: string;
  createdAt: string;
  lastLogin: string;
}

interface Session {
  id?: number;
  title?: string;
  date: string;
  time: string;
  specialist: string;
  status: 'scheduled' | 'completed';
  type?: string;
}

interface DocumentItem {
  id?: number;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

interface ActivityLog {
  id?: number;
  action: string;
  timestamp?: string;
  date?: string;
  time?: string;
  device?: string;
}


const Profile: React.FC = () => {
  // ==================== СОСТОЯНИЯ ====================
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ProfileData | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // ==================== ЗАГРУЗКА ДАННЫХ ====================
  useEffect(() => {
    loadData();
  }, []);

  const getHeaders = (): HeadersInit => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const handleResponse = async <T,>(response: Response): Promise<T | null> => {
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = '/auth';
        return null;
      }
      const text = await response.text().catch(() => '');
      throw new Error(text || 'Service error');
    }
    return response.json() as Promise<T>;
  };

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Пользователь не авторизован');
      }

      const headers = getHeaders();

      // Загружаем профиль
      const profileResponse = await fetch(`${API_GATEWAY}/bff/profile`, { headers });
      const profileData = await handleResponse<ProfileData>(profileResponse);
      if (!profileData) {
        throw new Error('Не удалось загрузить профиль');
      }
      setProfile(profileData);
      setEditedProfile(profileData);

      // Загружаем консультации
      const consultationsResponse = await fetch(`${API_GATEWAY}/bff/consultations`, { headers });
      const consultationsData = await handleResponse<{ upcoming?: Session[]; history?: Session[] }>(consultationsResponse);
      if (consultationsData) {
        const allSessions = [
          ...(consultationsData.upcoming || []),
          ...(consultationsData.history || []),
        ];
        setSessions(allSessions);
      }

      // Загружаем документы
      const documentsResponse = await fetch(`${API_GATEWAY}/bff/documents`, { headers });
      const documentsData = await handleResponse<{ documents?: DocumentItem[] }>(documentsResponse);
      if (documentsData?.documents) {
        setDocuments(documentsData.documents);
      }

      // Загружаем историю активности
      const activityResponse = await fetch(`${API_GATEWAY}/bff/activity-log`, { headers });
      const activityData = await handleResponse<{ logs?: ActivityLog[] }>(activityResponse);
      if (activityData?.logs) {
        setActivityLogs(activityData.logs);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== ОБРАБОТЧИКИ ====================
  const getRoleLabel = (role: string): string => {
    const labels: { [key: string]: string } = {
      'Психолог': 'Психолог',
      'Родитель': 'Родитель',
      'admin': 'Администратор',
      'Администратор': 'Администратор',
      'Ребёнок': 'Ребёнок',
    };
    return labels[role] || role;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'scheduled':
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: { [key: string]: string } = {
      scheduled: 'Запланирована',
      upcoming: 'Предстоящая',
      completed: 'Завершённая',
      cancelled: 'Отменённая',
    };
    return labels[status] || status;
  };

  const getSessionTypeLabel = (type?: string): string => {
    if (!type) return '';
    const labels: { [key: string]: string } = {
      video: 'Видеоконсультация',
      personal: 'Очная консультация',
      chat: 'Чат консультация',
    };
    return labels[type] || type;
  };

  const handleSaveProfile = async () => {
    if (!editedProfile) return;
    try {
      setIsSaving(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Пользователь не авторизован');

      const response = await fetch(`${API_GATEWAY}/bff/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          first_name: editedProfile.firstName,
          last_name: editedProfile.lastName,
          phone: editedProfile.phone,
          bio: editedProfile.bio,
          organization: editedProfile.organization,
        }),
      });

      const result = await handleResponse<any>(response);
      if (result) {
        setProfile(editedProfile);
        setIsEditing(false);
        alert('Профиль успешно обновлён');
      }
    } catch (err: any) {
      console.error('Ошибка сохранения:', err);
      alert(`Ошибка: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      alert('Заполните все поля');
      return;
    }
    try {
      setIsSaving(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Пользователь не авторизован');

      const response = await fetch(`${API_GATEWAY}/bff/profile/change-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          old_password: passwordData.oldPassword,
          new_password: passwordData.newPassword,
        }),
      });

      const result = await handleResponse<any>(response);
      if (result) {
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowPasswordModal(false);
        alert('Пароль успешно изменён');
      }
    } catch (err: any) {
      console.error('Ошибка смены пароля:', err);
      alert(`Ошибка: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/auth';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-semibold">{error || 'Ошибка загрузки профиля'}</p>
          </div>
        </div>
      </div>
    );
  }

  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled');
  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="sticky top-16 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Личный кабинет</h1>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* ЛЕВАЯ ПАНЕЛЬ */}
          <div className="md:col-span-1">
            {/* КАРТОЧКА ПРОФИЛЯ */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-6">
              <div className="text-center mb-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg mb-4">
                  <span className="text-3xl font-bold text-white">
                    {profile.firstName.substring(0, 1).toUpperCase()}
                    {profile.lastName.substring(0, 1).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">{fullName || profile.username}</h2>
                <p className="text-sm text-gray-500">@{profile.username}</p>
                <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                  {getRoleLabel(profile.role)}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600 py-4 border-t border-b border-gray-200">
                <p className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {profile.email}
                </p>
                <p className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {profile.phone || 'Не указан'}
                </p>
              </div>
              <div className="mt-4 pt-4 text-xs text-gray-500 space-y-1">
                <p>Создан: {profile.createdAt}</p>
                <p>Последний вход: {profile.lastLogin}</p>
              </div>
            </div>

            {/* МЕНЮ НАВИГАЦИИ */}
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('info')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-3 ${
                  activeTab === 'info'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Профиль</span>
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-3 ${
                  activeTab === 'sessions'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Консультации</span>
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-3 ${
                  activeTab === 'documents'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Документы</span>
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-3 ${
                  activeTab === 'activity'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>История</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-3 ${
                  activeTab === 'settings'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Настройки</span>
              </button>
            </nav>
          </div>

          {/* ПРАВАЯ ПАНЕЛЬ */}
          <div className="md:col-span-3">
            {/* ==================== ПРОФИЛЬ ==================== */}
            {activeTab === 'info' && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Информация профиля</h2>
                    <button
                      onClick={() => {
                        setIsEditing(!isEditing);
                        if (isEditing) setEditedProfile(profile);
                      }}
                      className="px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>{isEditing ? 'Отмена' : 'Редактировать'}</span>
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Имя</label>
                      <input
                        type="text"
                        value={editedProfile?.firstName || ''}
                        onChange={(e) =>
                          editedProfile && setEditedProfile({ ...editedProfile, firstName: e.target.value })
                        }
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Фамилия</label>
                      <input
                        type="text"
                        value={editedProfile?.lastName || ''}
                        onChange={(e) =>
                          editedProfile && setEditedProfile({ ...editedProfile, lastName: e.target.value })
                        }
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                      <input
                        type="email"
                        value={editedProfile?.email || ''}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Телефон</label>
                      <input
                        type="tel"
                        value={editedProfile?.phone || ''}
                        onChange={(e) =>
                          editedProfile && setEditedProfile({ ...editedProfile, phone: e.target.value })
                        }
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Организация</label>
                      <input
                        type="text"
                        value={editedProfile?.organization || ''}
                        onChange={(e) =>
                          editedProfile && setEditedProfile({ ...editedProfile, organization: e.target.value })
                        }
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">О себе</label>
                      <textarea
                        value={editedProfile?.bio || ''}
                        onChange={(e) =>
                          editedProfile && setEditedProfile({ ...editedProfile, bio: e.target.value })
                        }
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        rows={4}
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Совет:</strong> Используйте актуальную информацию для лучшей коммуникации с другими пользователями системы.
                    </p>
                  </div>
                  {isEditing && (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400"
                      >
                        {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedProfile(profile);
                        }}
                        disabled={isSaving}
                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-200 disabled:bg-gray-100"
                      >
                        Отмена
                      </button>
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Изменить пароль</span>
                  </button>
                </div>
              </div>
            )}

            {/* ==================== КОНСУЛЬТАЦИИ ==================== */}
            {activeTab === 'sessions' && (
              <div className="space-y-6">
                {/* Предстоящие */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">Предстоящие консультации</h2>
                  </div>
                  <div className="p-6">
                    {upcomingSessions.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingSessions.map((session) => (
                          <div key={session.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900">{session.title || 'Консультация'}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {session.date} в {session.time}
                                </p>
                                <p className="text-sm text-gray-600">Специалист: {session.specialist}</p>
                                <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                                  {getStatusLabel(session.status)}
                                </span>
                              </div>
                              <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200">
                                Подключиться
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-center py-6">Нет предстоящих консультаций</p>
                    )}
                  </div>
                </div>

                {/* История */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">История консультаций</h2>
                  </div>
                  <div className="p-6">
                    {completedSessions.length > 0 ? (
                      <div className="space-y-4">
                        {completedSessions.map((session) => (
                          <div key={session.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900">{session.title || 'Консультация'}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {session.date} в {session.time}
                                </p>
                                <p className="text-sm text-gray-600">Специалист: {session.specialist}</p>
                                {session.type && (
                                  <p className="text-xs text-gray-500 mt-1">{getSessionTypeLabel(session.type)}</p>
                                )}
                              </div>
                              <button className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm">
                                Скачать отчет
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-center py-6">Нет завершённых консультаций</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== ДОКУМЕНТЫ ==================== */}
            {activeTab === 'documents' && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Документы</h2>
                    <button className="px-4 py-2 bg-white text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors duration-200 flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Загрузить</span>
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {documents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900">Название</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900">Тип</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900">Размер</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900">Загружено</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-900">Действия</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {documents.map((doc) => (
                            <tr key={doc.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-2">
                                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                                  </svg>
                                  <span className="font-medium text-gray-900">{doc.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{doc.type}</td>
                              <td className="px-4 py-3 text-gray-600">{doc.size}</td>
                              <td className="px-4 py-3 text-gray-600">{doc.uploadedAt}</td>
                              <td className="px-4 py-3 text-right space-x-2">
                                <button className="text-blue-600 hover:text-blue-700 font-medium text-xs">Скачать</button>
                                <button className="text-red-600 hover:text-red-700 font-medium text-xs">Удалить</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-6">Документы отсутствуют</p>
                  )}
                </div>
              </div>
            )}

            {/* ==================== ИСТОРИЯ АКТИВНОСТИ ==================== */}
            {activeTab === 'activity' && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">История активности</h2>
                </div>
                <div className="p-6">
                  {activityLogs.length > 0 ? (
                    <div className="space-y-4">
                      {activityLogs.map((log, index) => (
                        <div key={log.id || index} className="flex">
                          <div className="flex flex-col items-center mr-4">
                            <div className="w-4 h-4 bg-blue-600 rounded-full mt-1.5"></div>
                            {index !== activityLogs.length - 1 && <div className="w-0.5 h-12 bg-gray-300 my-1"></div>}
                          </div>
                          <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="font-semibold text-gray-900">{log.action}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {log.date || log.timestamp} {log.time && `в ${log.time}`}
                            </p>
                            {log.device && (
                              <p className="text-xs text-gray-500 mt-1">Устройство: {log.device}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-600 py-6">Нет истории активности</p>
                  )}
                </div>
              </div>
            )}

            {/* ==================== НАСТРОЙКИ ==================== */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Уведомления */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">Уведомления</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                      <span className="ml-3 text-gray-700">Уведомления по email</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                      <span className="ml-3 text-gray-700">Уведомления о консультациях</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-blue-600" />
                      <span className="ml-3 text-gray-700">Рассылка новостей</span>
                    </label>
                  </div>
                </div>

                {/* Опасные действия */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">Опасные действия</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="w-full px-6 py-3 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors duration-200"
                    >
                      Выход из системы
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ==================== МОДАЛЬНЫЕ ОКНА ==================== */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
              <h3 className="text-lg font-bold text-blue-900">Изменить пароль</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Текущий пароль</label>
                  <input
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Новый пароль</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Подтвердите пароль</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Отмена
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={isSaving}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400"
                >
                  {isSaving ? 'Сохранение...' : 'Изменить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
            <div className="bg-red-50 border-b border-red-200 px-6 py-4">
              <h3 className="text-lg font-bold text-red-900">Вы уверены?</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Вы действительно хотите выйти из системы?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Отмена
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Выход
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;