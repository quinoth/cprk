import React, { useState, createContext, useContext } from 'react';
import { Link } from 'react-router-dom';

type UserRole = 'child' | 'parent' | 'psychologist' | 'admin';
interface AuthContextType {
  user: { role: UserRole | null; name: string };
  isAuthenticated: boolean;
}
const AuthContext = createContext<AuthContextType>({ user: { role: null, name: '' }, isAuthenticated: false });
export const useAuth = () => useContext(AuthContext);

interface NewsItem {
  id: number;
  title: string;
  date: string;
  description: string;
}

const newsItems: NewsItem[] = [
  {
    id: 1,
    title: 'Новые программы реабилитации для детей',
    date: '20 октября 2025',
    description: 'Запущены инновационные программы комплексной реабилитации с использованием современных методик и технологий.',
  },
  {
    id: 2,
    title: 'Открытие нового корпуса центра',
    date: '15 октября 2025',
    description: 'Состоялось торжественное открытие нового корпуса с современным оборудованием для работы с детьми.',
  },
  {
    id: 3,
    title: 'Конференция по инклюзивному образованию',
    date: '10 октября 2025',
    description: 'Специалисты центра приняли участие в региональной конференции по вопросам инклюзивного образования.',
  },
];

const MainContent: React.FC = () => {
  const [authState] = useState<AuthContextType>({
    user: { role: 'admin', name: 'Иван Иванов' },
    isAuthenticated: true,
  });
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Введите email адрес');
      return;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Введите корректный email адрес');
      return;
    }
    setEmailError('');
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <AuthContext.Provider value={authState}>
      <div className="min-h-screen bg-gray-50">
        <main>
          <section className="bg-white py-12 fade-in" aria-labelledby="hero-title">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 id="hero-title" className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Центр реабилитации
              </h1>
              <h2 className="text-xl md:text-2xl text-gray-600 font-normal max-w-4xl mx-auto">
                ГКУ Иркутской области «Центр психолого-педагогической, медицинской и социальной помощи, профилактики, реабилитации и коррекции»
              </h2>
            </div>
          </section>

          <section className="py-16 bg-gray-50 fade-in-delay" aria-labelledby="news-title">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-8">
                <h2 id="news-title" className="text-3xl font-bold text-gray-900">Новости</h2>
                <Link
                  to="/news"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 flex items-center space-x-1"
                  aria-label="Посмотреть все новости"
                >
                  <span>Все новости</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {newsItems.map((news) => (
                  <article
                    key={news.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <svg className="w-16 h-16 text-white opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-gray-500 mb-2">{news.date}</p>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">{news.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{news.description}</p>
                      <Link
                        to="/news_page"
                        className="inline-block px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-all duration-200 hover:scale-105"
                        aria-label={`Читать полностью: ${news.title}`}
                      >
                        Читать полностью
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16 bg-white fade-in-delay" aria-labelledby="director-title">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 id="director-title" className="text-3xl font-bold text-gray-900 mb-8">
                Директор ГКУ ЦПРК
              </h2>
              <div className="grid md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-3">
                  <div className="w-full max-w-xs mx-auto aspect-[3/4] bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg shadow-lg flex items-center justify-center">
                    <svg className="w-24 h-24 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="md:col-span-9">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Галстян Маргарита Николаевна
                  </h3>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Уважаемые коллеги! Приветствуем Вас на нашем сайте. Надеемся, что информация, размещенная здесь, окажется Вам полезной. Наш центр оказывает комплексную психолого-педагогическую, медицинскую и социальную помощь детям и их семьям. Мы стремимся создать условия для полноценного развития каждого ребенка и его успешной интеграции в общество.
                    </p>
                    <Link
                      to="/directors_applications"
                      className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-md"
                      aria-label="Читать полное обращение директора"
                    >
                      Читать полностью
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-16 bg-gray-50 fade-in-delay" aria-labelledby="contacts-title">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 id="contacts-title" className="text-3xl font-bold text-gray-900 mb-8">
                Контакты
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow-md p-8">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Адрес</h3>
                        <p className="text-gray-600">г. Иркутск, ул. Павла Красильникова, 54А</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Телефон</h3>
                        <p className="text-gray-600">8(3952)47-83-54, 47-82-74</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                        <a href="mailto:cpnn@bk.ru" className="text-blue-600 hover:text-blue-700 transition-colors duration-200">
                          cpnn@bk.ru
                        </a>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/contacts"
                    className="mt-8 inline-block w-full text-center px-6 py-3 bg-gray-800 text-white font-medium rounded hover:bg-gray-900 transition-all duration-200 hover:scale-105"
                    aria-label="Перейти на страницу контактов"
                  >
                    Все контакты
                  </Link>
                </div>
                <div className="bg-blue-600 rounded-lg shadow-md p-8 text-white">
                  <h3 className="text-2xl font-bold mb-4">Подпишитесь на рассылку новостей</h3>
                  <p className="text-blue-100 mb-6">
                    Получайте последние новости и информацию о мероприятиях центра
                  </p>
                  <form onSubmit={handleSubscribe} className="space-y-4">
                    <div>
                      <label htmlFor="email-subscribe" className="sr-only">Email для подписки</label>
                      <input
                        id="email-subscribe"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Введите ваш email"
                        className="w-full px-4 py-3 rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        aria-invalid={!!emailError}
                        aria-describedby={emailError ? "email-error" : undefined}
                      />
                      {emailError && (
                        <p id="email-error" className="text-red-200 text-sm mt-2" role="alert">{emailError}</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="w-full px-6 py-3 bg-white text-blue-600 font-semibold rounded hover:bg-blue-50 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={subscribed}
                      aria-label="Подписаться на рассылку новостей"
                    >
                      {subscribed ? '✓ Подписка оформлена!' : 'Подписаться'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </section>

          <section className="py-12 bg-white" aria-label="Полезные ссылки">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-3 gap-6">
                <a
                  href="http://obrnadzor.gov.ru/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Федеральная служба по надзору в сфере образования и науки
                  </h3>
                  <p className="text-sm text-blue-600">obrnadzor.gov.ru →</p>
                </a>
                <a
                  href="https://38edu.ru/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Министерство образования Иркутской области
                  </h3>
                  <p className="text-sm text-blue-600">38edu.ru →</p>
                </a>
                <a
                  href="https://edu.gov.ru/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Министерство просвещения Российской Федерации
                  </h3>
                  <p className="text-sm text-blue-600">edu.gov.ru →</p>
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
    </AuthContext.Provider>
  );
};

export default MainContent;
