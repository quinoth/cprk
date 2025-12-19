import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// === Типы ===
interface Answer {
  id: string;
  text: string;
  score: number;
}

interface Question {
  id: string;
  blockName: string;
  text: string;
  type: 'single' | 'multiple' | 'scale' | 'open';
  answers: Answer[];
  maxSelections?: number;
}

interface TestModule {
  id: string;
  name: string;
  description: string;
  questions: Question[];
}

interface TestResult {
  moduleId: string;
  moduleName: string;
  totalScore: number;
  blockResults: Array<{
    blockName: string;
    score: number;
    confidence: number;
  }>;
}

// === Конфигурация API ===
const WORKFLOW_API_BASE = 'http://127.0.0.1:8006';

// Универсальный обработчик ответа
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Ошибка сети';
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.detail || errorMessage;
    } catch (e) {
      // оставляем стандартное сообщение
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

// === API Функции ===
const workflowAPI = {
  // Получить список модулей (тестов)
  getSpecifications: async (): Promise<TestModule[]> => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${WORKFLOW_API_BASE}/api/bank/specsions`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await handleResponse(res);

    // Преобразуем данные под нужную структуру
    return data.map((mod: any) => ({
      ...mod,
      questions: mod.questions?.map((q: any) => ({
        ...q,
        answers: q.answers || []
      })) || []
    }));
  },

  // Начать тест
  startTest: async (testId: string): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${WORKFLOW_API_BASE}/api/test/start/${testId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    await handleResponse(res);
  },

  // Отправить один ответ
  submitAnswer: async (payload: {
    testId: string;
    questionId: string;
    answer: string;
  }): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${WORKFLOW_API_BASE}/api/test/answer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test_id: payload.testId,
        question_id: payload.questionId,
        selected_answer_id: payload.answer
      })
    });
    await handleResponse(res);
  }
};

// === Компонент ===
const Testing: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [modules, setModules] = useState<TestModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<TestModule | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [result, setResult] = useState<TestResult | null>(null);

  // --- Загрузка тестов ---
  useEffect(() => {
    const loadTests = async () => {
      try {
        setLoading(true);
        const tests = await workflowAPI.getSpecifications();
        setModules(tests);
      } catch (err: any) {
        console.error(err);
        setError(`Не удалось загрузить тесты: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadTests();
  }, []);

  // --- Начать тест ---
  const handleStartTest = async (module: TestModule) => {
    try {
      await workflowAPI.startTest(module.id);
      setSelectedModule(module);
      setCurrentQuestion(0);
      setAnswers(new Map());
      setResult(null);
    } catch (err: any) {
      setError(`Ошибка при запуске теста: ${err.message}`);
    }
  };

  // --- Выбор ответа ---
  const handleSelectAnswer = (answerId: string) => {
    if (!selectedModule) return;
    const question = selectedModule.questions[currentQuestion];
    if (!question) return;

    setAnswers(prev => {
      const newMap = new Map(prev);
      newMap.set(question.id, answerId);
      return newMap;
    });
  };

  // --- Следующий шаг ---
  const handleNext = async () => {
    if (!selectedModule) return;

    if (currentQuestion < selectedModule.questions.length - 1) {
      setCurrentQuestion(c => c + 1);
    } else {
      // Все вопросы пройдены → отправляем ответы
      try {
        const userAnswers = Array.from(answers.entries()).map(([questionId, answerId]) => ({
          testId: selectedModule.id,
          questionId,
          answer: answerId
        }));

        // Отправляем каждый ответ
        for (const answer of userAnswers) {
          await workflowAPI.submitAnswer(answer);
        }

        // Расчёт результата
        let totalScore = 0;
        let answeredCount = 0;

        selectedModule.questions.forEach(q => {
          const answerId = answers.get(q.id);
          if (answerId) {
            const selectedAnswer = q.answers.find(a => a.id === answerId);
            if (selectedAnswer) {
              totalScore += selectedAnswer.score;
              answeredCount++;
            }
          }
        });

        const averageScore = answeredCount > 0 ? totalScore / answeredCount : 0;

        setResult({
          moduleId: selectedModule.id,
          moduleName: selectedModule.name,
          totalScore: averageScore,
          blockResults: [] // можно расширить позже
        });
      } catch (err: any) {
        setError(`Ошибка при отправке ответов: ${err.message}`);
      }
    }
  };

  if (loading) return <div className="p-8 text-center">Загрузка тестов...</div>;

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => {
            setError('');
            window.location.reload();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  // --- Шаг 1: Выбор теста ---
  if (!selectedModule && !result) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Доступные тесты</h1>
        <div className="grid grid-cols-1 gap-4">
          {modules.length > 0 ? (
            modules.map(module => (
              <div key={module.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-semibold mb-2">{module.name}</h2>
                <p className="text-gray-600 mb-4">{module.description}</p>
                <p className="text-sm text-gray-500 mb-4">Вопросов: {module.questions.length}</p>
                <button
                  onClick={() => handleStartTest(module)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Начать тест
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600 py-8">Нет доступных тестов</p>
          )}
        </div>
      </div>
    );
  }

  // --- Шаг 2: Прохождение теста ---
  if (selectedModule && !result) {
    const question = selectedModule.questions[currentQuestion];

    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold">{selectedModule.name}</h2>
            <button
              onClick={() => {
                if (window.confirm('Вы уверены? Все ответы будут потеряны.')) {
                  setSelectedModule(null);
                  setCurrentQuestion(0);
                  setAnswers(new Map());
                  setResult(null);
                }
              }}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Выход
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestion + 1) / selectedModule.questions.length) * 100}%`
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Вопрос {currentQuestion + 1} из {selectedModule.questions.length}
          </p>
        </div>

        {question && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">{question.text}</h3>
            <p className="text-sm text-gray-600 mb-4">Блок: {question.blockName}</p>

            <div className="space-y-3">
              {question.answers.map(answer => (
                <button
                  key={answer.id}
                  onClick={() => handleSelectAnswer(answer.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    answers.get(question.id) === answer.id
                      ? 'bg-blue-100 border-blue-600'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {answer.text}
                </button>
              ))}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setCurrentQuestion(c => (c > 0 ? c - 1 : 0))}
                disabled={currentQuestion === 0}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50"
              >
                Назад
              </button>
              <button
                onClick={handleNext}
                disabled={!answers.has(question.id)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {currentQuestion === selectedModule.questions.length - 1 ? 'Завершить' : 'Далее'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Шаг 3: Результаты ---
  if (result) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-4">Результаты теста</h1>
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-lg">
              Средний балл: <span className="font-bold text-2xl">{result.totalScore.toFixed(2)}</span>
            </p>
          </div>

          <button
            onClick={() => {
              setResult(null);
              setSelectedModule(null);
            }}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Вернуться к тестам
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default Testing;