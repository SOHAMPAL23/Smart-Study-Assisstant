import React, { useState, useCallback, useEffect } from 'react';
import { StudyData, QuizQuestion, Flashcard, StudyMode, NormalStudyData, MathStudyData } from './types';
import getStudyGuideStream from './services/geminiService';
import ErrorMessage from './components/ErrorMessage';
import { BrainCircuitIcon, SparklesIcon, CalculatorIcon, BookOpenCheckIcon, HistoryIcon, LightbulbIcon } from './components/icons';

// Type Guards
const isNormalStudyData = (data: StudyData): data is NormalStudyData => 'summary' in data;
const isMathStudyData = (data: StudyData): data is MathStudyData => 'question' in data && !('summary' in data);

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div>
    <h2 className="flex items-center gap-3 text-2xl font-bold text-cyan-400 mb-4 border-b-2 border-cyan-700/50 pb-2">
      {icon}
      {title}
    </h2>
    {children}
  </div>
);

const FlashcardCard: React.FC<{ card: Flashcard }> = ({ card }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div className="perspective-1000 w-full h-48 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <div
                className={`relative w-full h-full transform-style-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front */}
                <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-4 bg-gradient-to-br from-cyan-900/80 to-blue-900/80 border border-cyan-700 rounded-xl shadow-lg flex-col">
                    <div className="bg-cyan-700/30 rounded-full p-2 mb-3">
                        <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <p className="text-center text-lg font-medium text-cyan-100">Question</p>
                    <p className="text-center text-cyan-200 mt-2">{card.front}</p>
                </div>
                {/* Back */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center p-4 bg-gradient-to-br from-green-900/80 to-emerald-900/80 border border-green-700 rounded-xl shadow-lg flex-col">
                    <div className="bg-green-700/30 rounded-full p-2 mb-3">
                        <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <p className="text-center text-lg font-medium text-green-100">Answer</p>
                    <p className="text-center text-green-200 mt-2">{card.back}</p>
                </div>
            </div>
        </div>
    );
};


const QuizCard: React.FC<{ question: QuizQuestion; index: number }> = ({ question, index }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const isAnswered = selectedOption !== null;

  // Extract option letter from option text (handles formats like 'A)', 'A.', 'A Option', etc.)
  const extractOptionLetter = (option: string): string => {
    const match = option.trim().match(/^([A-Za-z])/);
    return match ? match[1].toUpperCase() : '';
  };

  // Extract correct answer letter
  const correctAnswerLetter = extractOptionLetter(question.answer);

  const getOptionBgClass = (option: string) => {
    // State before selection
    if (!isAnswered) {
      return 'bg-gray-700 hover:bg-cyan-800/60';
    }

    // States after selection
    const optionLetter = extractOptionLetter(option);
    const isThisOptionTheCorrectAnswer = optionLetter === correctAnswerLetter;
    const wasThisOptionSelectedByUser = selectedOption === optionLetter;

    if (isThisOptionTheCorrectAnswer) {
      // Always highlight the correct answer in green once any option is selected.
      return 'bg-green-500/90 border-green-400 text-white font-bold';
    }
    
    if (wasThisOptionSelectedByUser) {
      // If this option was selected, but we reached here, it must be incorrect. Highlight in red.
      return 'bg-red-500/90 border-red-400 text-white font-bold';
    }

    // Any other option is an unselected, incorrect one. Fade it out.
    return 'bg-gray-700 opacity-60';
  };

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-gray-700">
      <p className="font-semibold text-lg mb-4">{index + 1}. {question.question}</p>
      <div className="space-y-3">
        {question.options.map((option, i) => {
          const optionLetter = extractOptionLetter(option);
          return (
          <button
            key={i}
            onClick={() => setSelectedOption(optionLetter)}
            className={`w-full text-left p-3 rounded-md transition-colors duration-200 border ${getOptionBgClass(option)} disabled:cursor-not-allowed`}
            disabled={isAnswered}
          >
            <div className="flex items-center">
              {isAnswered && optionLetter === correctAnswerLetter && (
                <svg className="w-5 h-5 mr-2 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              )}
              {isAnswered && selectedOption === optionLetter && optionLetter !== correctAnswerLetter && (
                <svg className="w-5 h-5 mr-2 text-red-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              )}
              <span>{option}</span>
            </div>
          </button>
        )})}
      </div>
      {isAnswered && (
        <div className="mt-4 p-4 rounded-md animate-fade-slide-in border-l-4">
          {selectedOption === correctAnswerLetter ? (
              <div className="border-l-green-500 bg-green-900/30">
                <p className="font-bold text-green-400 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Correct! Well done.
                </p>
              </div>
          ) : (
              <div>
                <div className="border-l-red-500 bg-red-900/30 mb-3">
                  <p className="font-bold text-red-400 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Your answer is incorrect.
                  </p>
                </div>
                <div className="border-l-green-500 bg-green-900/30">
                  <p className="font-bold text-green-400 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Correct answer: {question.answer}
                  </p>
                </div>
              </div>
          )}
          <div className="mt-3">
            <p className="font-bold text-cyan-300 flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Explanation:
            </p>
            <p className="text-gray-300 mt-1">{question.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const NormalStudyGuideDisplay: React.FC<{ data: NormalStudyData }> = ({ data }) => (
  <div className="space-y-8">
    <Section title="Key Summary" icon={<BookOpenCheckIcon className="w-6 h-6" />}>
      <ul className="space-y-2 list-disc list-inside text-gray-300">
        {data.summary.map((point, index) => <li key={index} className="ml-4">{point}</li>)}
      </ul>
    </Section>
    <Section title="Flashcards" icon={<SparklesIcon className="w-6 h-6" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.flashcards.map((card, index) => <FlashcardCard key={index} card={card} />)}
        </div>
    </Section>
    <Section title="Test Your Knowledge" icon={<CalculatorIcon className="w-6 h-6" />}>
      <div className="space-y-6">{data.quiz.map((q, index) => <QuizCard key={index} question={q} index={index} />)}</div>
    </Section>
    <Section title="Study Tip" icon={<LightbulbIcon className="w-6 h-6" />}>
      <div className="bg-blue-900/30 border-l-4 border-blue-400 p-4 rounded-r-lg">
        <p className="text-blue-200 italic">{data.studyTip}</p>
      </div>
    </Section>
  </div>
);

const MathQuestionDisplay: React.FC<{ data: MathStudyData }> = ({ data }) => {
    const [userAnswer, setUserAnswer] = useState<string>('');
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [showSolution, setShowSolution] = useState<boolean>(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
    };

    const handleReset = () => {
        setUserAnswer('');
        setIsSubmitted(false);
        setShowSolution(false);
    };

    // Simple answer comparison (can be enhanced for mathematical expressions)
    const isAnswerCorrect = (): boolean => {
        if (!userAnswer.trim() || !data.answer.trim()) return false;
        // For now, we'll do a simple string comparison
        // This could be enhanced to handle mathematical expressions
        return userAnswer.trim().toLowerCase() === data.answer.trim().toLowerCase();
    };

    return(
        <div className="space-y-8">
            <Section title="Quantitative Question" icon={<CalculatorIcon className="w-6 h-6"/>}>
                <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-6 rounded-lg shadow-lg border border-gray-700">
                    <div className="flex items-start mb-3">
                        <div className="bg-amber-500/20 p-2 rounded-lg mr-3">
                            <CalculatorIcon className="w-5 h-5 text-amber-400" />
                        </div>
                        <p className="text-lg font-medium text-amber-300">Solve this problem:</p>
                    </div>
                    <p className="text-lg whitespace-pre-wrap text-gray-200">{data.question}</p>
                </div>
            </Section>

            {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="math-answer" className="block text-lg font-medium text-gray-300 mb-2">
                            Your Answer:
                        </label>
                        <input
                            type="text"
                            id="math-answer"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            className="w-full bg-gray-900/70 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 backdrop-blur-sm"
                            placeholder="Enter your answer here"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={!userAnswer.trim()}
                        className="w-full px-6 py-3 text-base font-medium rounded-lg text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        Submit Answer
                    </button>
                </form>
            ) : (
                <div className="space-y-6">
                    <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-gray-700">
                        <h3 className="text-xl font-bold text-gray-200 mb-4">Your Response</h3>
                        
                        {isAnswerCorrect() ? (
                            <div className="border-l-4 border-green-500 bg-green-900/30 p-4 rounded-r-lg">
                                <div className="flex items-center mb-2">
                                    <svg className="w-6 h-6 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <p className="font-bold text-green-400 text-lg">Correct!</p>
                                </div>
                                <p className="text-gray-200">
                                    Your answer: <span className="font-mono bg-gray-900/50 px-2 py-1 rounded">{userAnswer}</span>
                                </p>
                            </div>
                        ) : (
                            <div>
                                <div className="border-l-4 border-red-500 bg-red-900/30 p-4 rounded-r-lg mb-4">
                                    <div className="flex items-center mb-2">
                                        <svg className="w-6 h-6 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                        <p className="font-bold text-red-400 text-lg">Incorrect</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-gray-200">
                                            Your answer: <span className="font-mono bg-gray-900/50 px-2 py-1 rounded">{userAnswer}</span>
                                        </p>
                                        <p className="text-gray-200">
                                            Correct answer: <span className="font-mono bg-gray-900/50 px-2 py-1 rounded">{data.answer}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowSolution(true)}
                            className="flex-1 px-6 py-3 text-base font-medium rounded-lg text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20 flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            Show Solution
                        </button>
                        <button 
                            onClick={handleReset}
                            className="px-6 py-3 text-base font-medium rounded-lg text-white bg-gray-700 hover:bg-gray-600 transition-all duration-200 flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                            Try Again
                        </button>
                    </div>

                    {showSolution && (
                        <div className="animate-fade-slide-in space-y-8">
                            <Section title="Step-by-Step Solution" icon={<SparklesIcon className="w-6 h-6"/>}>
                                <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-6 rounded-lg shadow-lg border border-gray-700">
                                    <div className="flex items-start mb-3">
                                        <div className="bg-cyan-500/20 p-2 rounded-lg mr-3">
                                            <SparklesIcon className="w-5 h-5 text-cyan-400" />
                                        </div>
                                        <p className="font-medium text-cyan-300">Detailed explanation:</p>
                                    </div>
                                    <div className="whitespace-pre-wrap text-gray-300">
                                        {data.explanation.split('\n').map((line, index) => {
                                            // Skip empty lines
                                            if (!line.trim()) {
                                                return <div key={index} className="my-2"></div>;
                                            }
                                            
                                            // Check if line looks like a mathematical expression or calculation
                                            if (line.match(/^[\s\d\w\+\-\*\/\(\)\[\]\{\}\=\.\,\:\>\<\!\|\&\^\%\#\@\~\`\$\;\?]+$/g) && 
                                                (line.includes('=') || line.includes('+') || line.includes('-') || line.includes('*') || line.includes('/') || 
                                                line.includes('^') || line.includes('√') || line.includes('∑') || line.includes('∫') || 
                                                line.includes('lim') || line.includes('log') || line.includes('ln'))) {
                                                return (
                                                    <div key={index} className="bg-gray-900/90 p-5 rounded-lg my-4 border border-cyan-700/50 shadow-lg">
                                                        <div className="flex">
                                                            <div className="text-cyan-400 font-mono text-lg mr-4 select-none">{'>'}</div>
                                                            <code className="font-mono text-lg text-gray-200 whitespace-pre-wrap break-words">{line}</code>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            // Check if line looks like a header/section title
                                            else if (line.match(/^[\d]+\.[\d\s\w]+/) || line.startsWith('**') || line.endsWith(':')) {
                                                return <h4 key={index} className="font-bold text-xl text-cyan-300 mt-6 mb-3 border-b border-cyan-700/30 pb-2">{line.replace(/\*\*/g, '')}</h4>;
                                            }
                                            // Regular paragraph text
                                            else {
                                                return <p key={index} className="mb-4 text-gray-300">{line}</p>;
                                            }
                                        })}
                                    </div>
                                </div>
                            </Section>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [mode, setMode] = useState<StudyMode>('normal');
  const [studyData, setStudyData] = useState<StudyData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const [topicHistory, setTopicHistory] = useState<string[]>([]);
  
  useEffect(() => {
    const history = localStorage.getItem('study-topic-history');
    if (history) {
      setTopicHistory(JSON.parse(history));
    }
  }, []);

  const updateTopicHistory = (newTopic: string) => {
    const updatedHistory = [newTopic, ...topicHistory.filter(t => t !== newTopic)].slice(0, 5);
    setTopicHistory(updatedHistory);
    localStorage.setItem('study-topic-history', JSON.stringify(updatedHistory));
  };

  const handleHistoryClick = (historicTopic: string) => {
    setTopic(historicTopic);
    document.getElementById('topic-input')?.focus();
  };

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!topic.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setStudyData(null);
    setStreamingResponse('');
    updateTopicHistory(topic);

    try {
      const stream = await getStudyGuideStream(topic, mode);
      let accumulatedText = '';
      for await (const chunk of stream) {
        const text = chunk.text;
        accumulatedText += text;
        setStreamingResponse(accumulatedText);
      }
      const parsedData = JSON.parse(accumulatedText);
      setStudyData(parsedData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      setStreamingResponse(`Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [topic, isLoading, mode]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans bg-gradient-to-br from-gray-900 to-gray-950">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center my-8">
          <div className="flex justify-center items-center gap-4">
            <div className="bg-cyan-500/10 p-3 rounded-2xl">
              <BrainCircuitIcon className="h-12 w-12 text-cyan-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              AI Study Assistant
            </h1>
          </div>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Your personal AI tutor. Master any topic, faster.
          </p>
        </header>

        <main>
          <div className="bg-gray-800/40 p-6 rounded-2xl shadow-2xl border border-gray-700/50 backdrop-blur-sm mb-8 glassmorphism">
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-grow w-full relative">
                  <input
                    id="topic-input"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., 'Quantum Computing', 'Stoic Philosophy'..."
                    className="w-full bg-gray-900/70 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 backdrop-blur-sm"
                    disabled={isLoading}
                  />
                  {topic && (
                    <button 
                      type="button" 
                      onClick={() => setTopic('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !topic.trim()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <SparklesIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Generating...' : 'Generate'}
                </button>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="bg-amber-500/20 p-1.5 rounded-lg">
                    <CalculatorIcon className="w-4 h-4 text-amber-400" />
                  </div>
                  <span>Math Mode</span>
                  <label htmlFor="mode-toggle" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" id="mode-toggle" className="sr-only" checked={mode === 'math'} onChange={() => setMode(m => m === 'normal' ? 'math' : 'normal')} />
                      <div className={`block w-12 h-6 rounded-full transition-colors duration-300 ${mode === 'math' ? 'bg-cyan-600' : 'bg-gray-600'}`}></div>
                      <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${mode === 'math' ? 'transform translate-x-7' : 'translate-x-1'}`}></div>
                    </div>
                  </label>
                </div>
                {topicHistory.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <div className="bg-gray-700/50 p-1.5 rounded-lg">
                          <HistoryIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex gap-2 flex-wrap max-w-[200px]">
                            {topicHistory.map(item => (
                                <button 
                                  key={item} 
                                  onClick={() => handleHistoryClick(item)} 
                                  className="bg-gray-700/50 hover:bg-gray-600/50 px-2 py-1 rounded-md text-xs transition-colors duration-200 truncate max-w-[100px]"
                                  title={item}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            </form>
          </div>

          <div className="mt-8">
            {isLoading && (
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl font-mono text-gray-300 whitespace-pre-wrap border border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-cyan-500/20 p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-cyan-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                  </div>
                  <p className="font-medium text-cyan-300">AI is generating your study material...</p>
                </div>
                <div className="text-gray-400">
                  {streamingResponse}<span className="blinking-cursor ml-1"></span>
                </div>
              </div>
            )}
            {error && !isLoading && <ErrorMessage message={error} />}
            {studyData && !isLoading && (
              <div className="animate-fade-slide-in">
                {isNormalStudyData(studyData) && <NormalStudyGuideDisplay data={studyData} />}
                {isMathStudyData(studyData) && <MathQuestionDisplay data={studyData} />}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;