// imports/ui/pages/PaymentSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 


const PaymentSuccess = () => {
  const navigate = useNavigate(); 
  const location = useLocation(); 

  // State to manage the message displayed to the user
  const [message, setMessage] = useState("Your payment was successful! We're confirming your booking now.");
  const [countdown, setCountdown] = useState(10); 

  // Extract transaction reference from URL query parameters

  const queryParams = new URLSearchParams(location.search);
  const transactionRef = queryParams.get('trxref') || queryParams.get('reference');

  useEffect(() => {
    console.log("CLIENT DEBUG: PaymentSuccess page loaded.");

    if (transactionRef) {
      setMessage("Your payment was successful! We are now processing your booking details.");
    } else {
      setMessage("Your payment was successful! We are working to confirm your booking.");
    }

    const interval = setInterval(() => {
      setCountdown((prevCount) => prevCount - 1);
    }, 1000);

    const redirectTimer = setTimeout(() => {
      navigate('/events'); 
    }, 10000);

    // Cleanup function: Clear timers when the component unmounts
    return () => {
      clearInterval(interval);
      clearTimeout(redirectTimer);
    };
  }, [navigate, transactionRef]); // Depend on navigate and transactionRef

  // Update message when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      setMessage("Redirecting you to your events...");
    }
  }, [countdown]);


  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4 font-inter">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center transform transition-all duration-300 hover:scale-105">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 animate-bounce-in">
          <svg
            className="h-14 w-14 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>

        {/* Success Message */}
        <h2 className="mt-8 text-4xl font-bold text-gray-900 leading-tight">Payment Successful!</h2>
        <p className="mt-4 text-xl text-gray-700">{message}</p>

        {/* Transaction Reference (if available) */}
        {transactionRef && (
          <p className="mt-4 text-sm text-gray-500">
            Transaction Reference: <span className="font-semibold text-gray-700 break-words">{transactionRef}</span>
          </p>
        )}

        {/* Countdown for auto-redirect */}
        {countdown > 0 && (
          <p className="mt-6 text-md text-indigo-500 animate-pulse">
            Redirecting in {countdown} seconds...
          </p>
        )}

        {/* Manual Navigation Button */}
        <div className="mt-8">
          <a
            href="/events"
            className="w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-semibold rounded-full text-slate-900 bg-orange-400  focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg"
          >
            Go to My Events
          </a>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
