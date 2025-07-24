import React, { useState } from 'react';
import { Brain, Zap, Target, TrendingUp } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 flex-col justify-center relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-32 h-32 border border-white rounded-full"></div>
            <div className="absolute bottom-32 right-16 w-24 h-24 border border-white rounded-full"></div>
            <div className="absolute top-1/2 right-1/3 w-16 h-16 border border-white rounded-full"></div>
          </div>
          
          <div className="text-white relative z-10">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold">SignalIQ</h1>
            </div>
            
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Find your next big opportunity with AI
            </h2>
            
            <p className="text-xl text-slate-300 mb-12 leading-relaxed">
              Discover companies and people that match your exact criteria using natural language queries. 
              Export leads instantly and scale your outreach.
            </p>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Natural Language Search</h3>
                  <p className="text-slate-300 text-sm">Ask in plain English and get precise results</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Real-time Lead Generation</h3>
                  <p className="text-slate-300 text-sm">Get fresh, accurate data on companies and contacts</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Export & Scale</h3>
                  <p className="text-slate-300 text-sm">Download CSV files and integrate with your CRM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <div className="w-full lg:w-2/5 p-12 flex items-center justify-center">
          {isLogin ? (
            <LoginForm onToggleMode={() => setIsLogin(false)} />
          ) : (
            <SignupForm onToggleMode={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
};