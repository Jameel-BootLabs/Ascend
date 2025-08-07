import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Login() {
  const handleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Shield className="mx-auto text-primary text-6xl mb-4" />
          <h2 className="text-3xl font-bold text-gray-900">SecureLearn</h2>
          <p className="mt-2 text-sm text-gray-600">Information Security Training Portal</p>
        </div>
        
        <Card className="shadow-material">
          <CardContent className="py-8 px-4">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome Back</h3>
                <p className="text-sm text-gray-600">Sign in to continue your security training</p>
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
