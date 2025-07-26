import React, { useState, useEffect, useRef } from 'react';
import { Send, Brain, User, Bot, Loader2, CheckCircle, Sparkles, Globe, Building2, Users } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { WebsiteCrawler } from '../../utils/websiteCrawler';

interface OnboardingMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'progress';
  content: string;
  timestamp: Date;
}

interface ProductService {
  name: string;
  description: string;
}

interface OnboardingData {
  companyWebsite: string;
  productsServices: ProductService[];
  targetRegion: string[];
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

const ONBOARDING_STEPS = [
  { id: 1, title: 'Website', description: 'Company information' },
  { id: 2, title: 'Products', description: 'What you sell' },
  { id: 3, title: 'Region', description: 'Where you sell' },
  { id: 4, title: 'Complete', description: 'All set!' }
];

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei',
  'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji',
  'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
  'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland',
  'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho',
  'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia',
  'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia',
  'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
  'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea',
  'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea',
  'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone',
  'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
  'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago',
  'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela',
  'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [data, setData] = useState<OnboardingData>({
    companyWebsite: '',
    productsServices: [],
    targetRegion: []
  });
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: OnboardingMessage = {
      id: '1',
      type: 'assistant',
      content: `Hi ${user?.firstName}! 👋 Welcome to SignalIQ. I'll help you set up your lead generation profile in just a few steps.`,
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);
    
    // Start with first question after a brief delay
    setTimeout(() => {
      askWebsiteQuestion();
    }, 1500);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
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

  const askWebsiteQuestion = () => {
    addMessage({
      type: 'assistant',
      content: "Let's start with your website. This helps me understand your business better. Please enter your company or personal website URL."
    });
  };

  const askRegionQuestion = () => {
    addMessage({
      type: 'assistant',
      content: "Finally, which countries or regions do you primarily sell to? You can select multiple countries from the list below."
    });
  };

  const handleWebsiteSubmit = async (website: string) => {
    setIsLoading(true);
    
    try {
      // Add user message
      addMessage({
        type: 'user',
        content: website
      });

      // Validate and format URL
      let formattedUrl = website.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`;
      }

      setData(prev => ({ ...prev, companyWebsite: formattedUrl }));

      // Simulate website crawling
      addMessage({
        type: 'assistant',
        content: "Great! Let me analyze your website to understand what products and services you offer..."
      });

      // Mock website analysis - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock products/services based on website
      const mockProducts = generateMockProducts(formattedUrl);
      setData(prev => ({ ...prev, productsServices: mockProducts }));

      // Show products found
      const productsList = mockProducts.map(p => `• ${p.name}: ${p.description}`).join('\n');
      addMessage({
        type: 'assistant',
        content: `Perfect! I found these key products/services from your website:\n\n${productsList}\n\nThese look good to me. Let's move to the next step.`
      });

      setTimeout(() => {
        setCurrentStep(3);
        askRegionQuestion();
        setIsLoading(false);
      }, 1500);

    } catch (error) {
      console.error('Error processing website:', error);
      addMessage({
        type: 'assistant',
        content: "I had trouble analyzing your website, but that's okay. Let's continue with the setup."
      });
      setCurrentStep(3);
      askRegionQuestion();
      setIsLoading(false);
    }
  };

  const generateMockProducts = (website: string): ProductService[] => {
    const domain = website.toLowerCase();
    
    if (domain.includes('saas') || domain.includes('software')) {
      return [
        { name: 'SaaS Platform', description: 'Cloud-based software solution for businesses' },
        { name: 'API Services', description: 'Developer tools and integrations' },
        { name: 'Analytics Dashboard', description: 'Data insights and reporting tools' }
      ];
    } else if (domain.includes('ecommerce') || domain.includes('shop')) {
      return [
        { name: 'E-commerce Platform', description: 'Online retail and marketplace solutions' },
        { name: 'Payment Processing', description: 'Secure transaction handling' }
      ];
    } else if (domain.includes('consulting') || domain.includes('agency')) {
      return [
        { name: 'Business Consulting', description: 'Strategic advisory and implementation services' }
      ];
    } else {
      return [
        { name: 'Professional Services', description: 'Expert consulting and implementation' },
        { name: 'Digital Solutions', description: 'Technology-driven business solutions' }
      ];
    }
  };

  const handleCountrySelect = (country: string) => {
    if (!data.targetRegion.includes(country)) {
      setData(prev => ({
        ...prev,
        targetRegion: [...prev.targetRegion, country]
      }));
    }
    setCountrySearch('');
    setShowCountryDropdown(false);
  };

  const removeCountry = (country: string) => {
    setData(prev => ({
      ...prev,
      targetRegion: prev.targetRegion.filter(c => c !== country)
    }));
  };

  const handleRegionComplete = async () => {
    if (data.targetRegion.length === 0) {
      addMessage({
        type: 'assistant',
        content: "Please select at least one country or region where you sell your products/services."
      });
      return;
    }

    setIsLoading(true);
    
    addMessage({
      type: 'user',
      content: `Selected regions: ${data.targetRegion.join(', ')}`
    });

    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      addMessage({
        type: 'assistant',
        content: "Perfect! Let me set up your profile now..."
      });

      // Save user profile
      await apiClient.updateUserProfile({
        company_website: data.companyWebsite,
        onboarding_completed: true
      });

      // Save ideal customer profile
      const icpData = {
        name: 'Default Profile',
        solution_products: data.productsServices.map(p => `${p.name}: ${p.description}`).join('\n'),
        target_region: data.targetRegion,
        target_customers: '',
        company_info: `Website: ${data.companyWebsite}`,
      };
      
      await apiClient.createICPProfile(icpData);

      // Add final success message
      setTimeout(() => {
        addMessage({
          type: 'system',
          content: "🎉 Your profile has been created successfully! You're now ready to start generating leads."
        });

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

  const filteredCountries = COUNTRIES.filter(country =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const isCompleted = currentStep > 3;

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
                {isCompleted ? 'Complete!' : `Step ${currentStep} of 3`}
              </div>
              <div className="w-32 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              {message.type === 'system' ? (
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
                    <span className="text-sm text-slate-500">Processing...</span>
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
            {currentStep === 1 && (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (inputValue.trim() && !isLoading) {
                  handleWebsiteSubmit(inputValue.trim());
                  setInputValue('');
                }
              }} className="flex items-end space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      ref={inputRef as React.RefObject<HTMLInputElement>}
                      type="url"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="https://yourcompany.com"
                      className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md text-lg"
                      disabled={isLoading}
                    />
                  </div>
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
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                {/* Country Selection */}
                <div className="relative">
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => {
                      setCountrySearch(e.target.value);
                      setShowCountryDropdown(true);
                    }}
                    onFocus={() => setShowCountryDropdown(true)}
                    placeholder="Search and select countries..."
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md text-lg"
                  />
                  
                  {showCountryDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                      {filteredCountries.map((country) => (
                        <button
                          key={country}
                          onClick={() => handleCountrySelect(country)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-sm"
                        >
                          {country}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Countries */}
                {data.targetRegion.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {data.targetRegion.map((country) => (
                      <span
                        key={country}
                        className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium"
                      >
                        {country}
                        <button
                          onClick={() => removeCountry(country)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Complete Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleRegionComplete}
                    disabled={isLoading || data.targetRegion.length === 0}
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 hover:from-blue-700 hover:via-purple-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-8 py-4 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed font-semibold"
                  >
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-6 h-6 mr-2" />
                    )}
                    {isLoading ? 'Setting up...' : 'Complete Setup'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};