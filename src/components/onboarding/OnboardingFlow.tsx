import React, { useState, useEffect, useRef } from 'react';
import { Send, Brain, User, Bot, Loader2, CheckCircle, Sparkles, Globe } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { WebsiteCrawler } from '../../utils/websiteCrawler';

interface OnboardingMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'progress';
  content: string;
  timestamp: Date;
}

interface OnboardingData {
  companyWebsite: string;
  solutionProducts: string;
  targetCustomers: string;
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

const ONBOARDING_STEPS = [
  { id: 1, title: 'Company Website', description: 'Tell us about your company' },
  { id: 2, title: 'Solution & Products', description: 'What do you sell?' },
  { id: 3, title: 'Target Region', description: 'Where do you sell?' },
  { id: 4, title: 'Complete', description: 'All set!' }
];

const CONVERSATION_FLOW = [
  {
    step: 1,
    question: "Let's start with your company website. This helps me understand your business better.",
    placeholder: "https://yourcompany.com",
    field: 'companyWebsite' as keyof OnboardingData,
    isUrl: true
  },
  {
    step: 2,
    question: "Perfect! Now tell me about your solution and products. What specific products or services are you selling? What problems do you solve for your customers?",
    placeholder: "AI-powered analytics software that helps e-commerce companies optimize inventory management and reduce stockouts...",
    field: 'solutionProducts' as keyof OnboardingData,
    maxLength: 250
  },
  {
    step: 3,
    question: "Excellent! Now tell me about your target audience. Who are your ideal customers? What types of companies or people do you typically sell to?",
    placeholder: "Mid-market e-commerce companies with 50-500 employees, particularly those struggling with inventory management, located in North America...",
    field: 'targetCustomers' as keyof OnboardingData,
    maxLength: 250
  }
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [data, setData] = useState<OnboardingData>({
    companyWebsite: '',
    solutionProducts: '',
    targetCustomers: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: OnboardingMessage = {
      id: '1',
      type: 'assistant',
      content: `Hi ${user?.firstName}! 👋 Welcome to SignalIQ. I'm here to help you set up your lead generation profile. This will only take a few minutes, and I'll guide you through each step.`,
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);
    
    // Start with first question after a brief delay
    setTimeout(() => {
      askNextQuestion();
    }, 1500);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input when it's available
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [isLoading, currentStep]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (message: Omit<OnboardingMessage, 'id' | 'timestamp'>) => {
    const newMessage: OnboardingMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addProgressIndicator = (step: number) => {
    const progressMessage: OnboardingMessage = {
      id: `progress-${step}`,
      type: 'progress',
      content: `Step ${step} of ${ONBOARDING_STEPS.length - 1}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, progressMessage]);
  };

  const askNextQuestion = () => {
    if (currentStep <= CONVERSATION_FLOW.length) {
      const currentQuestion = CONVERSATION_FLOW[currentStep - 1];
      
      // Add progress indicator
      if (currentStep > 1) {
        setTimeout(() => {
          addProgressIndicator(currentStep);
          
          // Add question after progress indicator
          setTimeout(() => {
            addMessage({
              type: 'assistant',
              content: currentQuestion.question
            });
          }, 800);
        }, 500);
      } else {
        // First question, no progress indicator needed
        addMessage({
          type: 'assistant',
          content: currentQuestion.question
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const currentQuestion = CONVERSATION_FLOW[currentStep - 1];
    
    // Check character limit
    if (currentQuestion.maxLength && inputValue.trim().length > currentQuestion.maxLength) {
      addMessage({
        type: 'assistant',
        content: `Please keep your response under ${currentQuestion.maxLength} characters. Your current response is ${inputValue.trim().length} characters.`
      });
      return;
    }
    
    // Validate URL if it's the website step
    if (currentQuestion.isUrl && inputValue.trim()) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(inputValue.trim())) {
        const correctedUrl = `https://${inputValue.trim()}`;
        setInputValue(correctedUrl);
        setData(prev => ({ ...prev, [currentQuestion.field]: correctedUrl }));
      } else {
        setData(prev => ({ ...prev, [currentQuestion.field]: inputValue.trim() }));
      }
    } else {
      setData(prev => ({ ...prev, [currentQuestion.field]: inputValue.trim() }));
    }

    // Add user message
    addMessage({
      type: 'user',
      content: inputValue.trim()
    });

    setInputValue('');
    setIsLoading(true);

    // Simulate processing time
    setTimeout(() => {
      if (currentStep < CONVERSATION_FLOW.length) {
        // Move to next step
        setCurrentStep(prev => prev + 1);
        setTimeout(() => {
          askNextQuestion();
          setIsLoading(false);
        }, 1000);
      } else {
        // Complete onboarding
        completeOnboarding();
      }
    }, 1500);
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      // Add completion message
      addMessage({
        type: 'assistant',
        content: "Perfect! I have all the information I need. Let me set up your profile now..."
      });

      // Analyze website if provided
      let websiteAnalysis = null;
      if (data.companyWebsite) {
        try {
          addMessage({
            type: 'assistant',
            content: "Analyzing your website to better understand your business..."
          });
          
          websiteAnalysis = await WebsiteCrawler.crawlWebsite(data.companyWebsite);
          
          addMessage({
            type: 'assistant',
            content: `Great! I've analyzed ${WebsiteCrawler.extractDomain(data.companyWebsite)} and learned about your ${websiteAnalysis.industry} business.`
          });
        } catch (error) {
          console.error('Website analysis failed:', error);
          addMessage({
            type: 'assistant',
            content: "I couldn't analyze your website, but that's okay. I'll use the information you provided."
          });
        }
      }

      // Save user profile
      await apiClient.updateUserProfile({
        company_website: data.companyWebsite,
        onboarding_completed: true
      });

      // Save ideal customer profile
      const icpData = {
        name: 'Default Profile',
        solution_products: data.solutionProducts,
        target_customers: data.targetCustomers,
        target_region: '',
        // Include website analysis data if available
        ...(websiteAnalysis && {
          company_info: websiteAnalysis.company_description,
          solution_products: `${data.solutionProducts}\n\nFrom website analysis: ${websiteAnalysis.value_proposition}`,
        })
      };
      
      await apiClient.createICPProfile(icpData);

      // Add final success message
      setTimeout(() => {
        addMessage({
          type: 'system',
          content: "🎉 Your profile has been created successfully! You're now ready to start generating leads."
        });

        // Complete onboarding after showing success message
        setTimeout(() => {
          onComplete();
        }, 2000);
      }, 1500);

    } catch (error) {
      console.error('Error completing onboarding:', error);
      addMessage({
        type: 'assistant',
        content: "I encountered an error while setting up your profile. Please try again."
      });
      setIsLoading(false);
    }
  };

  const getCurrentQuestion = () => {
    return CONVERSATION_FLOW[currentStep - 1];
  };

  const isCompleted = currentStep > CONVERSATION_FLOW.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-4xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-white/20 h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-6 border-b border-slate-200/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  SignalIQ Setup
                </h1>
                <p className="text-slate-600 font-medium">Let's get you set up for success</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-500 mb-2">
                {isCompleted ? 'Complete!' : `Step ${currentStep} of ${CONVERSATION_FLOW.length}`}
              </div>
              <div className="w-32 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(currentStep / CONVERSATION_FLOW.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              {message.type === 'progress' ? (
                <div className="flex justify-center my-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-slate-700 text-sm px-6 py-3 rounded-full flex items-center shadow-sm">
                    <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
                    {message.content}
                    <div className="ml-3 flex space-x-1">
                      {ONBOARDING_STEPS.slice(0, -1).map((step, index) => (
                        <div
                          key={step.id}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index + 1 <= currentStep - 1
                              ? 'bg-blue-500'
                              : index + 1 === currentStep
                              ? 'bg-purple-500 animate-pulse'
                              : 'bg-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : message.type === 'system' ? (
                <div className="flex justify-center my-6">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-800 text-sm px-6 py-4 rounded-2xl flex items-center shadow-sm">
                    <CheckCircle className="w-5 h-5 mr-3 text-emerald-600" />
                    {message.content}
                  </div>
                </div>
              ) : (
                <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                  <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                          : 'bg-gradient-to-br from-slate-600 to-slate-700'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="w-5 h-5 text-white" />
                        ) : (
                          <Bot className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </div>
                    
                    <div className={`px-6 py-4 rounded-2xl shadow-sm max-w-full ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                        : 'bg-white border border-slate-200 text-slate-900'
                    }`}>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="flex">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-700">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="px-6 py-4 rounded-2xl shadow-sm bg-white border border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    <span className="text-sm text-slate-500">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {!isCompleted && (
          <div className="p-6 border-t border-slate-200/50 bg-gradient-to-r from-slate-50 to-blue-50 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex items-end space-x-4">
              <div className="flex-1">
                {getCurrentQuestion()?.field === 'companyWebsite' ? (
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      ref={inputRef as React.RefObject<HTMLInputElement>}
                      type="url"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={getCurrentQuestion()?.placeholder}
                      className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md text-lg"
                      disabled={isLoading}
                    />
                  </div>
                ) : (
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={getCurrentQuestion()?.placeholder}
                    maxLength={getCurrentQuestion()?.maxLength}
                    rows={3}
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none bg-white shadow-sm hover:shadow-md text-lg"
                    disabled={isLoading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                )}
                {getCurrentQuestion()?.maxLength && (
                  <div className="text-right mt-2">
                    <span className={`text-sm ${
                      inputValue.length > getCurrentQuestion()!.maxLength! 
                        ? 'text-red-500' 
                        : inputValue.length > getCurrentQuestion()!.maxLength! * 0.8 
                        ? 'text-yellow-500' 
                        : 'text-slate-400'
                    }`}>
                      {inputValue.length}/{getCurrentQuestion()?.maxLength}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 hover:from-blue-700 hover:via-purple-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 text-white p-4 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Send className="w-6 h-6" />
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};