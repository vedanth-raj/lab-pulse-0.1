import React, { useState, useEffect } from 'react';
import { Code, Send, CheckCircle, Clock, AlertCircle, BookOpen } from 'lucide-react';

const StudentInterface = () => {
  const [labData, setLabData] = useState(null);
  const [statusData, setStatusData] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Initialize with demo data immediately without Firebase
    const demoData = {
      name: 'Introduction to React',
      description: 'Basic React concepts and components',
      students: {
        'student-1': { name: 'Alice Johnson', email: 'alice@university.edu' },
        'student-2': { name: 'Bob Smith', email: 'bob@university.edu' },
        'student-3': { name: 'Charlie Brown', email: 'charlie@university.edu' },
        'student-4': { name: 'Diana Prince', email: 'diana@university.edu' },
        'student-5': { name: 'Eve Wilson', email: 'eve@university.edu' }
      },
      tasks: {
        'task-1': { 
          title: 'Setup React Environment', 
          description: 'Create a new React application using create-react-app',
          difficulty: 'Easy'
        },
        'task-2': { 
          title: 'Create Component', 
          description: 'Build a reusable Button component with props',
          difficulty: 'Easy'
        },
        'task-3': { 
          title: 'State Management', 
          description: 'Implement useState hook for form handling',
          difficulty: 'Medium'
        },
        'task-4': { 
          title: 'API Integration', 
          description: 'Fetch data from a public API and display it',
          difficulty: 'Medium'
        },
        'task-5': { 
          title: 'Final Project', 
          description: 'Build a complete todo application',
          difficulty: 'Hard'
        }
      }
    };
    
    setLabData(demoData);
    
    // Simulate some demo status data
    const demoStatus = {
      'student-1': {
        'task-1': { status: 'completed', updatedAt: new Date().toISOString() },
        'task-2': { status: 'in-progress', updatedAt: new Date().toISOString() }
      }
    };
    setStatusData(demoStatus);
  }, []);

  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    setCode('');
    setOutput('');
  };

  const handleSubmit = async () => {
    if (!selectedTask || !code.trim()) return;

    setIsSubmitting(true);
    
    try {
      // Simulate submission without Firebase
      console.log('Submitting task:', selectedTask.title);
      console.log('Code:', code);
      console.log('Output:', output);
      
      // Update local status to simulate completion
      setStatusData(prev => ({
        ...prev,
        'student-1': {
          ...prev['student-1'],
          [selectedTask.id]: {
            status: 'completed',
            updatedAt: new Date().toISOString()
          }
        }
      }));
      
      // Clear form
      setCode('');
      setOutput('');
      setSelectedTask(null);
      
      alert('Task submitted successfully!');
    } catch (error) {
      console.error('Error submitting work:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (taskId) => {
    const status = statusData['student-1']?.[taskId]?.status;
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-amber-600" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  if (!labData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading lab session...</p>
        </div>
      </div>
    );
  }

  const tasks = labData.tasks || {};
  const studentName = 'Alice Johnson'; // In real app, get from auth

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Lab Pulse</h1>
                <p className="text-sm text-gray-500">{labData.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tasks List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Lab Tasks</h2>
                <p className="text-sm text-gray-600">Select a task to work on</p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {Object.entries(tasks).map(([taskId, task]) => (
                  <button
                    key={taskId}
                    onClick={() => handleTaskSelect({ ...task, id: taskId })}
                    className={`w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedTask?.id === taskId ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                          task.difficulty === 'Easy' ? 'bg-amber-100 text-amber-800' :
                          task.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {task.difficulty}
                        </span>
                      </div>
                      <div className="ml-3">
                        {getStatusIcon(taskId)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Code Editor */}
          <div className="lg:col-span-2">
            {selectedTask ? (
              <div className="bg-white rounded-lg shadow-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedTask.title}</h2>
                      <p className="text-sm text-gray-600">{selectedTask.description}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      selectedTask.difficulty === 'Easy' ? 'bg-amber-100 text-amber-800' :
                      selectedTask.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedTask.difficulty}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Code Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Code className="w-4 h-4 inline mr-2" />
                      Your Code
                    </label>
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Write your code here..."
                      spellCheck={false}
                    />
                  </div>

                  {/* Output Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Output / Results
                    </label>
                    <textarea
                      value={output}
                      onChange={(e) => setOutput(e.target.value)}
                      className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Paste your output or results here..."
                      spellCheck={false}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmit}
                      disabled={!code.trim() || isSubmitting}
                      className="flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Solution
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-12">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Task</h3>
                  <p className="text-gray-600">Choose a task from the list to start working on your lab assignment.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentInterface;
