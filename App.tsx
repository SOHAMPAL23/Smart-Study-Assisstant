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
        <div className="perspective-1000 w-full h-48" onClick={() => setIsFlipped(!isFlipped)}>
            <div
                className={`relative w-full h-full transform-style-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front */}
                <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-4 bg-gray-700 border border-gray-600 rounded-lg shadow-md">
                    <p className="text-center text-lg">{card.front}</p>
                </div>
                {/* Back */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center p-4 bg-cyan-900/80 border border-cyan-700 rounded-lg shadow-lg">
                    <p className="text-center text-cyan-200">{card.back}</p>
                </div>
            </div>
        </div>
    );
};


const QuizCard: React.FC<{ question: QuizQuestion; index: number }> = ({ question, index }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const isAnswered = selectedOption !== null;

  const getOptionBgClass = (option: string) => {
    if (!isAnswered) return 'bg-gray-700 hover:bg-cyan-800/60';
    const optionLetter = option.split('.')[0];
    if (optionLetter === question.answer) return 'bg-green-500/80 border-green-400';
    if (optionLetter === selectedOption) return 'bg-red-500/80 border-red-400';
    return 'bg-gray-700 opacity-60';
  };

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-gray-700">
      <p className="font-semibold text-lg mb-4">{index + 1}. {question.question}</p>
      <div className="space-y-3">
        {question.options.map((option, i) => {
          const optionLetter = option.split('.')[0];
          return (
          <button
            key={i}
            onClick={() => setSelectedOption(optionLetter)}
            className={`w-full text-left p-3 rounded-md transition-colors duration-200 border ${getOptionBgClass(option)} disabled:cursor-not-allowed`}
            disabled={isAnswered}
          >
            {option}
          </button>
        )})}
      </div>
      {isAnswered && (
        <div className="mt-4 p-3 bg-gray-900/70 rounded-md animate-fade-slide-in">
          <p className="font-bold text-cyan-300">Explanation:</p>
          <p className="text-gray-300">{question.explanation}</p>
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
    const [showAnswer, setShowAnswer] = useState(false);
    return(
        <div className="space-y-8">
            <Section title="Quantitative Question" icon={<CalculatorIcon className="w-6 h-6"/>}>
                <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-gray-700">
                    <p className="text-lg whitespace-pre-wrap">{data.question}</p>
                </div>
            </Section>
            {!showAnswer && (
                <button onClick={() => setShowAnswer(true)} className="w-full px-6 py-3 text-base font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 transition duration-200">
                    Show Answer
                </button>
            )}
            {showAnswer && (
                <div className="animate-fade-slide-in space-y-8">
                    <Section title="Answer" icon={<BookOpenCheckIcon className="w-6 h-6"/>}>
                        <div className="bg-green-900/30 border-l-4 border-green-400 p-4 rounded-r-lg">
                           <p className="text-green-200 font-bold text-lg">{data.answer}</p>
                        </div>
                    </Section>
                    <Section title="Explanation" icon={<SparklesIcon className="w-6 h-6"/>}>
                         <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-gray-700">
                            <p className="whitespace-pre-wrap">{data.explanation}</p>
                        </div>
                    </Section>
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
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center my-8">
          <div className="flex justify-center items-center gap-4">
            <BrainCircuitIcon className="h-10 w-10 text-cyan-400" />
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500">
              AI Study Assistant
            </h1>
          </div>
          <p className="mt-4 text-lg text-gray-400">
            Your personal AI tutor. Master any topic, faster.
          </p>
        </header>

        <main>
          <div className="bg-gray-800/50 p-6 rounded-2xl shadow-2xl border border-gray-700/50 backdrop-blur-sm mb-8">
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <input
                  id="topic-input"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., 'Quantum Computing', 'Stoic Philosophy'..."
                  className="flex-grow w-full bg-gray-900 border border-gray-600 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !topic.trim()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-200"
                >
                  <SparklesIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Generating...' : 'Generate'}
                </button>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <CalculatorIcon className="w-5 h-5" />
                  <span>Math Mode</span>
                  <label htmlFor="mode-toggle" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" id="mode-toggle" className="sr-only" checked={mode === 'math'} onChange={() => setMode(m => m === 'normal' ? 'math' : 'normal')} />
                      <div className={`block w-10 h-6 rounded-full ${mode === 'math' ? 'bg-cyan-600' : 'bg-gray-600'}`}></div>
                      <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform"></div>
                    </div>
                  </label>
                </div>
                {topicHistory.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <HistoryIcon className="w-5 h-5"/>
                        {topicHistory.map(item => (
                            <button key={item} onClick={() => handleHistoryClick(item)} className="bg-gray-700/50 hover:bg-gray-600/50 px-2 py-1 rounded-md text-xs">
                                {item}
                            </button>
                        ))}
                    </div>
                )}
              </div>
            </form>
          </div>

          <div className="mt-8">
            {isLoading && (
              <div className="bg-gray-800/50 p-6 rounded-lg font-mono text-gray-300 whitespace-pre-wrap">
                {streamingResponse}<span className="blinking-cursor"></span>
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
