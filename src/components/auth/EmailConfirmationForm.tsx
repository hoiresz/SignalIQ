import React, { useState, useRef, useEffect } from 'react';
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EmailConfirmationFormProps {
  email: string;
  onConfirmationSuccess: () => void;
  onBackToAuth: () => void;
}

export const EmailConfirmationForm: React.FC<EmailConfirmationFormProps> = ({
  email,
  onConfirmationSuccess,
  onBackToAuth
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Countdown timer for resend cooldown
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newCode.every(digit => digit !== '') && value) {
      handleSubmit(newCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newCode[i] = pastedData[i];
    }
    
    setCode(newCode);
    setError('');
    
    // Focus next empty input or last input
    const nextEmptyIndex = newCode.findIndex(digit => digit === '');
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();

    // Auto-submit if complete
    if (newCode.every(digit => digit !== '')) {
      handleSubmit(newCode);
    }
  };

  const handleSubmit = async (codeArray = code) => {
    const verificationCode = codeArray.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'signup'
      });

      if (error) {
        throw error;
      }

      onConfirmationSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
      // Clear the code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    setError('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        throw error;
      }

      setResendCooldown(60); // 60 second cooldown
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Check your email</h2>
        <p className="mt-3 text-gray-600">
          We sent a 6-digit verification code to
        </p>
        <p className="font-semibold text-gray-900">{email}</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
            Enter verification code
          </label>
          <div className="flex justify-center space-x-3">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                disabled={isLoading}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={() => handleSubmit()}
          disabled={isLoading || code.some(digit => digit === '')}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Verify Email
            </>
          )}
        </button>

        <div className="text-center space-y-4">
          <p className="text-gray-600 text-sm">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResendCode}
            disabled={isResending || resendCooldown > 0}
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
          >
            {isResending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            {resendCooldown > 0 
              ? `Resend in ${resendCooldown}s` 
              : isResending 
                ? 'Sending...' 
                : 'Resend code'
            }
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={onBackToAuth}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200 flex items-center justify-center mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
};