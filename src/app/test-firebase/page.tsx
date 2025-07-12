"use client";

import { useState } from 'react';
import { database } from '@/lib/firebase';
import { ref, set, get } from 'firebase/database';

export default function TestFirebasePage() {
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const testFirebaseConnection = async () => {
    setIsTesting(true);
    setTestResult('Testing Firebase connection...');

    try {
      if (!database) {
        setTestResult('❌ Firebase database is not initialized');
        return;
      }

      // Test writing to database
      const testRef = ref(database, 'test/connection');
      await set(testRef, {
        timestamp: Date.now(),
        message: 'Firebase connection test'
      });

      // Test reading from database
      const snapshot = await get(testRef);
      if (snapshot.exists()) {
        setTestResult('✅ Firebase connection successful! Data written and read successfully.');
      } else {
        setTestResult('❌ Firebase connection failed - could not read data');
      }
    } catch (error) {
      console.error('Firebase test error:', error);
      setTestResult(`❌ Firebase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Firebase Test Page</h1>
      
      <div className="space-y-4">
        <button
          onClick={testFirebaseConnection}
          disabled={isTesting}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isTesting ? 'Testing...' : 'Test Firebase Connection'}
        </button>
        
        {testResult && (
          <div className={`p-4 rounded ${
            testResult.includes('✅') ? 'bg-green-50 border border-green-200' : 
            testResult.includes('❌') ? 'bg-red-50 border border-red-200' : 
            'bg-yellow-50 border border-yellow-200'
          }`}>
            <p className="text-sm">{testResult}</p>
          </div>
        )}
        
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Firebase Status:</h2>
          <ul className="space-y-2 text-sm">
            <li>Database initialized: {database ? '✅ Yes' : '❌ No'}</li>
            <li>Environment: {process.env.NODE_ENV}</li>
            <li>Firebase API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}</li>
            <li>Firebase Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ Missing'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 