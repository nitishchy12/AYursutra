import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiSaveDosha, mlApi } from '../services/api';
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { doshaQuestions } from '../data/doshaQuestions';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

const DoshaTest = () => {
  const { currentUser, refreshUserData } = useAuth();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState('start'); // start, question, result
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionSelect = (value) => {
    setAnswers({
      ...answers,
      [currentQuestionIndex]: value
    });
  };

  const nextQuestion = () => {
    if (Object.keys(answers).length <= currentQuestionIndex) {
      alert("Please select an option to continue.");
      return;
    }
    if (currentQuestionIndex < doshaQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateResults = async () => {
    if (Object.keys(answers).length < doshaQuestions.length) {
      alert("Please answer all questions.");
      return;
    }

    setIsSubmitting(true);
    const mlResult = await mlApi.prakriti(answers);
    const finalResult = { dosha: mlResult.prakriti, scores: mlResult.scores, confidence: mlResult.confidence, explanation: mlResult.explanation };
    setResult(finalResult);
    if (currentUser) {
      await apiSaveDosha(finalResult.dosha, finalResult.scores);
      await refreshUserData();
    }
    
    setIsSubmitting(false);
    setCurrentStep('result');
  };

  const renderStartScreen = () => (
    <div className="card text-center" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem 2rem' }}>
      <Leaf size={64} color="var(--primary-color)" style={{ margin: '0 auto 1.5rem' }} />
      <h1 style={{ marginBottom: '1rem' }}>Discover Your Dosha</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>
        According to Ayurveda, your Dosha (Vata, Pitta, or Kapha) is your unique mind-body constitution. 
        Take this simple {doshaQuestions.length}-question quiz to discover your primary Dosha and receive personalized wellness tips.
      </p>
      <button onClick={() => setCurrentStep('question')} className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.2rem' }}>
        Start Assessment
      </button>
      {!currentUser && (
        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Note: Your results will only be saved if you are <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>logged in</Link>.
        </p>
      )}
    </div>
  );

  const renderQuestionScreen = () => {
    const question = doshaQuestions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === doshaQuestions.length - 1;

    return (
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <span>Question {currentQuestionIndex + 1} of {doshaQuestions.length}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / doshaQuestions.length) * 100)}% Completed</span>
          </div>
          
          <div style={{ width: '100%', backgroundColor: 'var(--border-color)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${((currentQuestionIndex + 1) / doshaQuestions.length) * 100}%`, 
              backgroundColor: 'var(--primary-color)', 
              height: '100%',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{question.question}</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {question.options.map((option, index) => {
            const isSelected = answers[currentQuestionIndex] === option.value;
            return (
              <label 
                key={index} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  border: `2px solid ${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(76, 175, 80, 0.05)' : 'white',
                  transition: 'all 0.2s ease',
                  fontSize: '1.1rem'
                }}
              >
                <input 
                  type="radio" 
                  name={`question-${currentQuestionIndex}`} 
                  value={option.value}
                  checked={isSelected}
                  onChange={() => handleOptionSelect(option.value)}
                  style={{ marginRight: '1rem', accentColor: 'var(--primary-color)', width: '20px', height: '20px' }}
                />
                {option.text}
              </label>
            );
          })}
        </div>

        <div className="flex justify-between mt-4">
          <button 
            onClick={prevQuestion} 
            disabled={currentQuestionIndex === 0}
            className="btn btn-secondary"
            style={{ opacity: currentQuestionIndex === 0 ? 0.5 : 1 }}
          >
            <ArrowLeft size={18} /> Previous
          </button>

          {isLastQuestion ? (
            <button 
              onClick={calculateResults}
              disabled={isSubmitting || !answers[currentQuestionIndex]}
              className="btn btn-primary"
            >
              {isSubmitting ? 'Calculating...' : 'See Results'} <CheckCircle size={18} />
            </button>
          ) : (
            <button 
              onClick={nextQuestion}
              disabled={!answers[currentQuestionIndex]}
              className="btn btn-primary"
            >
              Next <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderResultScreen = () => {
    return (
      <div className="card text-center" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem 2rem' }}>
        <p style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Your Primary Dosha is</p>
        <h2 style={{ fontSize: '3rem', color: 'var(--primary-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <Leaf /> {result.dosha} <Leaf />
        </h2>
        
        <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>What this means for you:</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{result.explanation}</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={Object.entries(result.scores).map(([name, value]) => ({ name, value }))} dataKey="value" nameKey="name" outerRadius={80} label>
                {['#4CAF50', '#FFB300', '#8D6E63'].map((color) => <Cell key={color} fill={color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          {result.dosha === 'Vata' && (
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Vata types are energetic, creative, and quick-thinking. When out of balance, they can become anxious or experience dry skin and irregular digestion. Favor warm, grounding foods and maintain a regular daily routine.
            </p>
          )}
          {result.dosha === 'Pitta' && (
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Pitta types are driven, intelligent, and focused with a strong digestion. When out of balance, they can become irritable or experience inflammation. Favor cooling foods, stay out of intense heat, and find time to relax.
            </p>
          )}
          {result.dosha === 'Kapha' && (
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Kapha types are steady, compassionate, and grounded. When out of balance, they can become lethargic, hold onto weight, or feel congested. Favor warm, light, and spicy foods, and engage in vigorous exercise.
            </p>
          )}
        </div>

        <div className="flex justify-center gap-4">
          {currentUser ? (
            <Link to="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/signup" className="btn btn-primary">
              Create Account to Save
            </Link>
          )}
          <Link to="/remedies" className="btn btn-secondary">
            Explore Herbs
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="container page" style={{ paddingTop: '100px' }}>
      {currentStep === 'start' && renderStartScreen()}
      {currentStep === 'question' && renderQuestionScreen()}
      {currentStep === 'result' && renderResultScreen()}
    </div>
  );
};

export default DoshaTest;
