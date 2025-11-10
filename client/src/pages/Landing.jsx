import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Manufacturing ERP System
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Comprehensive enterprise resource planning for manufacturing operations
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Manage orders, production, inventory, and more with our integrated platform.
            </p>
            <Button onClick={handleLogin} className="w-full" size="lg">
              Login to Continue
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Demo Credentials:</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Admin:</strong> admin / admin123</div>
              <div><strong>Production:</strong> production / prod123</div>
              <div><strong>Accounts:</strong> accounts / acc123</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}