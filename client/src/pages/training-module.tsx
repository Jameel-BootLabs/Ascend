import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function TrainingModule() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [match, params] = useRoute("/training/:moduleId");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [, setLocation] = useLocation();

  const moduleId = params?.moduleId ? parseInt(params.moduleId) : null;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: module } = useQuery({
    queryKey: ["/api/modules", moduleId],
    enabled: !!moduleId,
    retry: false,
  });

  const { data: pages = [] } = useQuery({
    queryKey: ["/api/modules", moduleId, "pages"],
    enabled: !!moduleId,
    retry: false,
  });

  const { data: progress } = useQuery({
    queryKey: ["/api/progress", moduleId],
    enabled: !!moduleId,
    retry: false,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (progressData: any) => {
      await apiRequest("POST", "/api/progress", progressData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress", moduleId] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    },
  });

  // Auto-save progress when page changes (but don't complete automatically)
  useEffect(() => {
    if (moduleId && pages.length > 0 && currentPageIndex >= 0) {
      const currentPage = pages[currentPageIndex];
      
      updateProgressMutation.mutate({
        moduleId,
        status: "in_progress",
        lastViewedPageId: currentPage?.id,
        completedAt: null,
      });
    }
  }, [moduleId, currentPageIndex, pages]);

  // Complete module function
  const completeModule = () => {
    const currentPage = pages[currentPageIndex];
    
    // Only complete if not already completed
    if (progress?.status !== "completed") {
      updateProgressMutation.mutate({
        moduleId,
        status: "completed",
        lastViewedPageId: currentPage?.id,
        completedAt: new Date().toISOString(),
      });
    }
  };

  // Add success effect when module is completed for the first time
  useEffect(() => {
    if (updateProgressMutation.isSuccess && updateProgressMutation.variables?.status === "completed") {
      toast({
        title: "Module Completed!",
        description: "Congratulations! You have successfully completed this training module.",
        duration: 3000,
      });
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    }
  }, [updateProgressMutation.isSuccess, updateProgressMutation.variables?.status, toast, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !moduleId || !module) {
    return null;
  }

  const currentPage = pages[currentPageIndex];
  const progressPercentage = pages.length > 0 ? ((currentPageIndex + 1) / pages.length) * 100 : 0;

  const nextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const previousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const renderPageContent = () => {
    if (!currentPage) return null;

    switch (currentPage.pageType) {
      case 'text':
      case null:
      case undefined:
        return (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{currentPage.title}</h1>
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: currentPage.content || '' }} />
            </div>
          </div>
        );
      
      case 'image':
        return (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{currentPage.title}</h1>
            <img src={currentPage.content} alt={currentPage.title} className="w-full h-auto rounded-lg" />
          </div>
        );
      
      case 'video':
        return (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{currentPage.title}</h1>
            <div className="aspect-video">
              <iframe
                src={currentPage.content}
                className="w-full h-full rounded-lg"
                frameBorder="0"
                allowFullScreen
              />
            </div>
          </div>
        );
      
      default:
        // Example phishing awareness content
        return (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Recognizing Phishing Emails</h1>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="text-yellow-500 mr-2" />
                <span className="font-medium text-gray-900">Example: Suspicious Email</span>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <div className="text-sm text-gray-600 mb-2">
                  <strong>From:</strong> security@yourbankk.com<br />
                  <strong>Subject:</strong> URGENT: Verify Your Account Now!
                </div>
                <div className="text-sm text-gray-800">
                  <p>Dear Customer,</p>
                  <p className="mt-2">Your account has been temporarily suspended due to suspicious activity. Please click the link below to verify your account immediately:</p>
                  <p className="mt-2 text-blue-600 underline">http://verify-account-now.suspicioussite.com</p>
                  <p className="mt-2">If you don't verify within 24 hours, your account will be permanently closed.</p>
                </div>
              </div>
            </div>

            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Red Flags to Watch For:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <XCircle className="text-red-500 mr-2 mt-1 flex-shrink-0" size={16} />
                  <span><strong>Misspelled domain:</strong> "yourbankk.com" instead of "yourbank.com"</span>
                </li>
                <li className="flex items-start">
                  <XCircle className="text-red-500 mr-2 mt-1 flex-shrink-0" size={16} />
                  <span><strong>Urgent language:</strong> Creates false sense of urgency</span>
                </li>
                <li className="flex items-start">
                  <XCircle className="text-red-500 mr-2 mt-1 flex-shrink-0" size={16} />
                  <span><strong>Suspicious link:</strong> Doesn't match the claimed organization</span>
                </li>
                <li className="flex items-start">
                  <XCircle className="text-red-500 mr-2 mt-1 flex-shrink-0" size={16} />
                  <span><strong>Generic greeting:</strong> "Dear Customer" instead of your name</span>
                </li>
              </ul>
            </div>
          </div>
        );
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="flex items-center text-primary hover:text-primary-dark transition-colors mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        
        {/* Progress Bar */}
        <Card className="shadow-material mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900">{module.title}</h2>
              <span className="text-sm text-gray-600">
                Page {currentPageIndex + 1} of {pages.length}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Module Content */}
      <Card className="shadow-material mb-6">
        <CardContent className="p-8">
          {renderPageContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card className="shadow-material">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={previousPage}
              disabled={currentPageIndex === 0}
              className="flex items-center"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex space-x-2">
              {pages.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index <= currentPageIndex ? 'bg-primary' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            {currentPageIndex === pages.length - 1 ? (
              progress?.status === "completed" ? (
                <Button
                  onClick={() => setLocation("/")}
                  className="flex items-center bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Back to Dashboard
                  <ArrowLeft className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={completeModule}
                  disabled={updateProgressMutation.isPending}
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white"
                >
                  {updateProgressMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                    </>
                  ) : (
                    <>
                      Complete Module
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )
            ) : (
              <Button
                onClick={nextPage}
                disabled={currentPageIndex === pages.length - 1}
                className="flex items-center bg-primary text-white hover:bg-primary-dark"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
