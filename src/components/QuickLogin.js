import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, User } from 'lucide-react';

const QuickLogin = () => {
  const navigate = useNavigate();

  const handleFacultyLogin = () => {
    navigate('/faculty');
  };

  const handleStudentLogin = () => {
    navigate('/student');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Lab Pulse</h1>
          <p className="text-gray-600 mt-2">Real-time Lab Monitoring System</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleFacultyLogin}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <User className="w-5 h-5 mr-2" />
            Enter as Faculty
          </button>
          
          <button
            onClick={handleStudentLogin}
            className="w-full bg-amber-600 text-white py-4 rounded-lg font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center"
          >
            <User className="w-5 h-5 mr-2" />
            Enter as Student
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 font-medium mb-2">Quick Access:</p>
          <div className="space-y-1 text-xs text-gray-500">
            <p><strong>Faculty:</strong> View real-time student progress</p>
            <p><strong>Student:</strong> Submit tasks and track progress</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickLogin;
