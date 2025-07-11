import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useToast } from '../../hooks/useToast';

export const EmailTestComponent = () => {
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { success, error } = useToast();

  const handleSendTest = async (e) => {
    e.preventDefault();
    
    if (!testEmail || !testEmail.includes('@')) {
      error('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsSending(true);
    
    try {
      const result = await Meteor.callAsync('email.sendTest', testEmail);
      success('Test Email Sent!', result.message);
      setTestEmail(''); // Clear the input
    } catch (err) {
      console.error('Email test failed:', err);
      error('Email Test Failed', err.reason || 'Failed to send test email. Check your SMTP configuration.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSendTest} className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <input
          type="email"
          placeholder="Enter email address to send test to..."
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                   bg-white dark:bg-slate-700 text-slate-900 dark:text-white 
                   placeholder-slate-500 dark:placeholder-slate-400
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSending}
          required
        />
      </div>
      <button
        type="submit"
        disabled={isSending || !testEmail}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 
                 text-white font-medium rounded-lg transition-colors
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 dark:focus:ring-offset-slate-900"
      >
        {isSending ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Sending...
          </span>
        ) : (
          'Send Test Email'
        )}
      </button>
    </form>
  );
};
