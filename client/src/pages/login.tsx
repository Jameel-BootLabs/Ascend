import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronsUp, Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";

export default function Login() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for error in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam === 'domain_restricted') {
      setError('Access denied. Only bootlabstech organization email addresses are allowed to access this application.');
    } else if (errorParam === 'auth_failed') {
      setError('Authentication failed. Please try only with bootlabstech organization email addresses.');
    }
  }, []);

  const handleLogin = () => {
    setError(null); // Clear any previous errors
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-4">
            <ChevronsUp className="text-white" size={50} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Ascend</h2>
          <p className="mt-2 text-sm text-gray-600">
            Information Security Training Portal
          </p>
        </div>

        <Card className="shadow-material">
          <CardContent className="py-8 px-4">
            <div className="space-y-6">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Welcome Back
                </h3>
                <p className="text-sm text-gray-600">
                  Sign in to continue your security training
                </p>
              </div>

              <Button
                onClick={handleLogin}
                className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 transition-colors"
              >
                <Shield className="mr-2 h-5 w-5" />
                Sign In with Google
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
