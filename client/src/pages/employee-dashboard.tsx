import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Book, CheckCircle, Clock, Shield, Database, Wifi, PlayCircle, UserCheck, FolderOpen } from "lucide-react";
import type { TrainingSection, TrainingModule, EmployeeProgress, AssessmentResult } from "@shared/schema";

export default function EmployeeDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

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

  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ["/api/sections"],
    retry: false,
  });

  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["/api/modules"],
    retry: false,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["/api/progress"],
    retry: false,
  });

  const { data: assessmentResults = [] } = useQuery({
    queryKey: ["/api/assessment/results"],
    retry: false,
  });

  if (isLoading || modulesLoading || sectionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Calculate progress statistics
  const completedModules = progress.filter(p => p.status === 'completed').length;
  const overallProgress = modules.length > 0 ? Math.round((completedModules / modules.length) * 100) : 0;
  
  // Get the best assessment score across all sections
  const bestAssessment = assessmentResults.reduce((best, current) => {
    if (!best || current.score > best.score) return current;
    return best;
  }, null);
  const assessmentScore = bestAssessment ? `${bestAssessment.score}%` : 'Not taken';

  // Helper functions for module status
  const getModuleStatus = (moduleId: number) => {
    const moduleProgress = progress.find(p => p.moduleId === moduleId);
    return moduleProgress?.status || 'not_started';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600 text-white hover:bg-green-700">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-600 text-white hover:bg-blue-700">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white hover:bg-gray-600">Not Started</Badge>;
    }
  };

  const getProgressPercentage = (moduleId: number) => {
    const moduleProgress = progress.find(p => p.moduleId === moduleId);
    switch (moduleProgress?.status) {
      case 'completed':
        return 100;
      case 'in_progress':
        return 65; // Estimate based on last viewed page
      default:
        return 0;
    }
  };

  // Group modules by section
  const getModulesBySection = (sectionId: number) => {
    return modules.filter(module => module.sectionId === sectionId);
  };

  // Calculate section progress
  const getSectionProgress = (sectionId: number) => {
    const sectionModules = getModulesBySection(sectionId);
    if (sectionModules.length === 0) return 0;
    
    const completedCount = sectionModules.filter(module => 
      getModuleStatus(module.id) === 'completed'
    ).length;
    
    return Math.round((completedCount / sectionModules.length) * 100);
  };

  const allModulesCompleted = modules.length > 0 && completedModules === modules.length;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Training Dashboard</h1>
            <p className="text-gray-600">Complete your security training modules to stay compliant</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{overallProgress}%</div>
            <div className="text-sm text-gray-500">Overall Progress</div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="shadow-material mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900">Your Progress</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center">
                <Book className="text-primary text-lg mr-2" />
                <div>
                  <p className="text-xs text-gray-600">Modules Completed</p>
                  <p className="text-xl font-bold text-primary">{completedModules} / {modules.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="text-secondary text-lg mr-2" />
                <div>
                  <p className="text-xs text-gray-600">Best Assessment Score</p>
                  <p className="text-xl font-bold text-secondary">{assessmentScore}</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="flex items-center">
                <Clock className="text-accent text-lg mr-2" />
                <div>
                  <p className="text-xs text-gray-600">Status</p>
                  <p className="text-xl font-bold text-accent">
                    {allModulesCompleted ? 'Complete' : 'In Progress'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Sections */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Training Sections</h2>
        <Accordion type="single" collapsible defaultValue={sections[0]?.id.toString()} className="space-y-3">
          {sections.map((section) => {
            const sectionModules = getModulesBySection(section.id);
            const sectionProgress = getSectionProgress(section.id);
            
            return (
              <AccordionItem key={section.id} value={section.id.toString()} className="border rounded-lg">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-4">
                      <FolderOpen className="text-primary" />
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{section.title}</h3>
                        <p className="text-sm text-gray-600">{section.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {sectionModules.filter(m => getModuleStatus(m.id) === 'completed').length} / {sectionModules.length} modules
                        </div>
                        <Progress value={sectionProgress} className="h-2 w-24" />
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sectionModules.map((module) => {
                      const status = getModuleStatus(module.id);
                      const progressPercentage = getProgressPercentage(module.id);
                      
                      return (
                        <Card key={module.id} className="shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 text-sm">{module.title}</h4>
                              {getStatusBadge(status)}
                            </div>
                            
                            <p className="text-gray-600 text-xs mb-2">{module.description}</p>
                            
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="mr-1 h-3 w-3" />
                                <span>{module.estimatedDuration} min</span>
                              </div>
                              <div className="text-xs text-gray-500">{progressPercentage}%</div>
                            </div>
                            
                            <div className="mb-2">
                              <Progress value={progressPercentage} className="h-1" />
                            </div>
                            
                            <Link href={`/training/${module.id}`}>
                              <Button size="sm" className="w-full bg-primary text-white hover:bg-primary-dark transition-colors text-xs py-1">
                                <PlayCircle className="mr-1 h-3 w-3" />
                                {status === 'completed' ? 'Review' : 
                                 status === 'in_progress' ? 'Continue' : 'Start'}
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {/* Section Assessment */}
                  <div className={`mt-4 p-3 rounded-lg border ${
                    sectionProgress >= 100 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-medium text-sm ${
                          sectionProgress >= 100 ? 'text-green-900' : 'text-gray-900'
                        }`}>
                          Section Assessment
                          {sectionProgress >= 100 && (
                            <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                              Unlocked
                            </span>
                          )}
                        </h4>
                        <p className={`text-xs ${
                          sectionProgress >= 100 ? 'text-green-700' : 'text-gray-600'
                        }`}>
                          {sectionProgress >= 100 
                            ? 'All modules completed! You can now take the assessment.'
                            : `Complete all modules to unlock the section assessment (${sectionProgress}% complete)`
                          }
                        </p>
                      </div>
                      {sectionProgress >= 100 ? (
                        <Link href={`/assessment/section/${section.id}`}>
                          <Button 
                            size="sm"
                            className="bg-secondary text-white hover:bg-green-600 transition-colors text-xs py-1"
                          >
                            <UserCheck className="mr-1 h-3 w-3" />
                            Take Assessment
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          size="sm"
                          className="bg-gray-400 text-white cursor-not-allowed text-xs py-1"
                          disabled={true}
                        >
                          <UserCheck className="mr-1 h-3 w-3" />
                          Take Assessment
                        </Button>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>


    </main>
  );
}
