import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { isUnauthorizedError } from "@/lib/utils";
import { apiRequest } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import SectionDialog from "@/components/section-dialog";
import { 
  BarChart, 
  Edit, 
  Search, 
  Download, 
  Plus, 
  Trash2, 
  GripVertical,
  Shield,
  Database,
  Wifi,
  RotateCcw,
  FolderOpen,
  HelpCircle
} from "lucide-react";
import ModuleEditorDialog from "@/components/module-editor-dialog";
import AssessmentQuestionDialog from "@/components/assessment-question-dialog";
import type { 
  EmployeeProgressWithUser, 
  TrainingModule, 
  TrainingSection, 
  AssessmentResult,
  AssessmentQuestion 
} from "@/types";

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: allProgress = [] } = useQuery<EmployeeProgressWithUser[]>({
    queryKey: ["/api/admin/progress"],
    retry: false,
  });

  const { data: modules = [] } = useQuery<TrainingModule[]>({
    queryKey: ["/api/modules"],
    retry: false,
  });

  const { data: sections = [] } = useQuery<TrainingSection[]>({
    queryKey: ["/api/sections"],
    retry: false,
  });

  const { data: assessmentResults = [] } = useQuery<AssessmentResult[]>({
    queryKey: ["/api/admin/assessment/results"],
    retry: false,
  });

  const { data: assessmentQuestions = [] } = useQuery<AssessmentQuestion[]>({
    queryKey: ["/api/admin/assessment/questions"],
    retry: false,
  });

  // Process data with proper types
  const processedData = allProgress.map((progress: EmployeeProgressWithUser) => {
    const assessmentResult = assessmentResults.find((result: AssessmentResult) =>
      result.userId === progress.userId && result.moduleId === progress.moduleId
    );
    
    return {
      ...progress,
      assessmentScore: assessmentResult?.score || null,
      assessmentPassed: assessmentResult?.passed || false,
    };
  });

  // Filter data based on search and status
  const filteredData = processedData.filter((item) => {
    const matchesSearch = 
      item.user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.module.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Helper functions with proper types
  const getModulesBySection = (sectionId: number): TrainingModule[] => {
    return modules.filter((module: TrainingModule) => module.sectionId === sectionId);
  };

  const getSectionProgress = (sectionId: number, userId: string) => {
    const sectionModules = getModulesBySection(sectionId);
    const userModuleProgress = allProgress.filter((p: EmployeeProgressWithUser) =>
      p.userId === userId && sectionModules.some((m: TrainingModule) => m.id === p.moduleId)
    );
    
    const completedCount = userModuleProgress.filter((p: EmployeeProgressWithUser) => p.status === 'completed').length;
    const totalCount = sectionModules.length;
    
    return {
      completed: completedCount,
      total: totalCount,
      percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    };
  };

  const getSectionAssessmentResults = (sectionId: number): AssessmentResult[] => {
    return assessmentResults.filter((result: AssessmentResult) => result.sectionId === sectionId);
  };

  // Get unique users from progress data
  const uniqueUsers = Array.from(new Map(allProgress.map((p: EmployeeProgressWithUser) => [p.userId, p.user])).values());

  // Process section data
  const sectionData = sections.map((section: TrainingSection) => {
    const sectionUsers = uniqueUsers.filter((user) => {
      const sectionModules = getModulesBySection(section.id);
      return allProgress.some((p: EmployeeProgressWithUser) => 
        p.userId === user.id && sectionModules.some((m: TrainingModule) => m.id === p.moduleId)
      );
    });

    const userProgress = sectionUsers.map((user) => {
      const progress = getSectionProgress(section.id, user.id);
      const sectionAssessments = getSectionAssessmentResults(section.id);
      const assessment = sectionAssessments.find((a: AssessmentResult) => a.userId === user.id);
      
      return {
        userId: user.id,
        user,
        ...progress,
        assessmentScore: assessment?.score || null,
        assessmentPassed: assessment?.passed || false,
      };
    });

    return {
      ...section,
      userProgress,
    };
  });

  // Status badge helper
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
    }
  };

  // Module icon helper
  const getModuleIcon = (index: number) => {
    const icons = [Shield, Database, Wifi, RotateCcw, FolderOpen, HelpCircle];
    const Icon = icons[index % icons.length];
    return <Icon className="h-4 w-4" />;
  };

  // Export CSV function
  const exportCSV = () => {
    const headers = ["User", "Email", "Module", "Status", "Assessment Score", "Assessment Passed"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map((item) => [
        `${item.user.firstName} ${item.user.lastName}`,
        item.user.email,
        item.module.title,
        item.status,
        item.assessmentScore || "N/A",
        item.assessmentPassed ? "Yes" : "No",
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "training-progress.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Delete mutations
  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      return await apiRequest("DELETE", `/api/modules/${moduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/progress"] });
      toast({
        title: "Success",
        description: "Module deleted successfully",
      });
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
        description: "Failed to delete module",
        variant: "destructive",
      });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: number) => {
      return await apiRequest("DELETE", `/api/sections/${sectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/progress"] });
      toast({
        title: "Success",
        description: "Section deleted successfully",
      });
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
        description: "Failed to delete section",
        variant: "destructive",
      });
    },
  });

  const deleteAssessmentQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      return await apiRequest("DELETE", `/api/admin/assessment/questions/${questionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/assessment/questions"] });
      toast({
        title: "Success",
        description: "Assessment question deleted successfully",
      });
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
        description: "Failed to delete assessment question",
        variant: "destructive",
      });
    },
  });

  // Check if user is admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage training modules, sections, and monitor progress</p>
        </div>
        <div className="flex space-x-4">
          <Button onClick={exportCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(allProgress.map((p: EmployeeProgressWithUser) => p.userId)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Modules</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allProgress.filter((p: EmployeeProgressWithUser) => p.status === 'completed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allProgress.filter((p: EmployeeProgressWithUser) => p.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessment Takers</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(assessmentResults.map((r: AssessmentResult) => r.userId)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="progress" className="space-y-6">
        <TabsList>
          <TabsTrigger value="progress">Progress Overview</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
        </TabsList>

        {/* Progress Overview Tab */}
        <TabsContent value="progress" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by user name, email, or module..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Progress Table */}
          <Card>
            <CardHeader>
              <CardTitle>Training Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assessment Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={`${item.userId}-${item.moduleId}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={item.user.profileImageUrl || undefined} alt={item.user.firstName || 'User'} />
                            <AvatarFallback>
                              {item.user.firstName?.[0]}{item.user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{item.user.firstName} {item.user.lastName}</p>
                            <p className="text-sm text-gray-500">{item.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getModuleIcon(item.moduleId)}
                          <span>{item.module.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        {item.assessmentScore ? `${item.assessmentScore}%` : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Training Modules</h2>
            <ModuleEditorDialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Module
              </Button>
            </ModuleEditorDialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module: TrainingModule, index: number) => (
              <Card key={module.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getModuleIcon(index)}
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                    </div>
                    <div className="flex space-x-2">
                      <ModuleEditorDialog moduleId={module.id}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </ModuleEditorDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Module</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{module.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteModuleMutation.mutate(module.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{module.description}</p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Order: {module.order}</span>
                    {module.estimatedDuration && (
                      <span>Duration: {module.estimatedDuration} min</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Training Sections</h2>
            <SectionDialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Section
              </Button>
            </SectionDialog>
          </div>

          <div className="space-y-6">
            {sectionData.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <p className="text-gray-600 mt-1">{section.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <SectionDialog section={section}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </SectionDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Section</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{section.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteSectionMutation.mutate(section.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {section.userProgress.map((userProg) => (
                      <div key={userProg.userId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={userProg.user.profileImageUrl || undefined} alt={userProg.user.firstName || 'User'} />
                            <AvatarFallback>
                              {userProg.user.firstName?.[0]}{userProg.user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{userProg.user.firstName} {userProg.user.lastName}</p>
                            <p className="text-sm text-gray-500">{userProg.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{userProg.completed}/{userProg.total} modules</p>
                            <p className="text-xs text-gray-500">{userProg.percentage}% complete</p>
                          </div>
                          <Progress value={userProg.percentage} className="w-24" />
                          {userProg.assessmentScore && (
                            <Badge variant={userProg.assessmentPassed ? "default" : "secondary"}>
                              {userProg.assessmentScore}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Assessment Questions</h2>
            <AssessmentQuestionDialog
              sections={sections}
              mode="create"
              trigger={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Question
                </Button>
              }
            />
          </div>

          <div className="space-y-6">
            {sections.map((section) => {
              const sectionQuestions = assessmentQuestions.filter((q: AssessmentQuestion) => q.sectionId === section.id);
              
              return (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{section.title} Questions</span>
                                             <AssessmentQuestionDialog
                         sections={sections}
                         mode="create"
                         trigger={
                           <Button variant="outline" size="sm">
                             <Plus className="h-4 w-4 mr-2" />
                             Add Question
                           </Button>
                         }
                       />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sectionQuestions.map((question) => (
                        <div key={question.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">{question.question}</h4>
                            <div className="flex space-x-2">
                                                             <AssessmentQuestionDialog
                                 question={{
                                   ...question,
                                   options: question.options as string[],
                                   sectionId: question.sectionId || 0
                                 }}
                                 sections={sections}
                                 mode="edit"
                                 trigger={
                                   <Button variant="outline" size="sm">
                                     <Edit className="h-4 w-4" />
                                   </Button>
                                 }
                               />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Question</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this question? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteAssessmentQuestionMutation.mutate(question.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          <div className="space-y-2">
                                                         {(question.options as string[]).map((option: string, index: number) => (
                              <div key={index} className="flex items-center space-x-2">
                                <span className="text-sm font-medium">{String.fromCharCode(97 + index)}.</span>
                                <span className="text-sm">{option}</span>
                                {String.fromCharCode(97 + index) === question.correctAnswer && (
                                  <Badge className="bg-green-100 text-green-800">Correct</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
