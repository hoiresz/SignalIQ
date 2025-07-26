import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, Brain } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/auth?error=callback_error');
          return;
        }

        if (data.session) {
          // User is authenticated, redirect to dashboard
          navigate('/');
        } else {
          // No session, redirect to auth
          navigate('/auth');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        navigate('/auth?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-4 animate-spin" />
        <p className="text-slate-300 text-lg">Completing sign in...</p>
      </div>
    </div>
  );
};