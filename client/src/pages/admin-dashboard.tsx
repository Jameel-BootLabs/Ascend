import AssessmentQuestionDialog from "@/components/assessment-question-dialog";
import ModuleEditorDialog from "@/components/module-editor-dialog";
import SectionDialog from "@/components/section-dialog";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart,
  Database,
  Download,
  Edit,
  GripVertical,
  HelpCircle,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  Wifi
} from "lucide-react";
import { useEffect, useState } from "react";

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

  const { data: allProgress = [] } = useQuery({
    queryKey: ["/api/admin/progress"],
    retry: false,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["/api/modules"],
    retry: false,
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["/api/sections"],
    retry: false,
  });

  const { data: assessmentResults = [] } = useQuery({
    queryKey: ["/api/admin/assessment/results"],
    retry: false,
  });

  const { data: assessmentQuestions = [] } = useQuery({
    queryKey: ["/api/admin/assessment/questions"],
    retry: false,
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      await apiRequest("DELETE", `/api/modules/${moduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
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

  const resetAssessmentMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/assessment/results/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/assessment/results"] });
      toast({
        title: "Success",
        description: "Assessment results reset successfully",
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
        description: "Failed to reset assessment results",
        variant: "destructive",
      });
    },
  });

  const updateModuleSectionMutation = useMutation({
    mutationFn: async ({ moduleId, sectionId }: { moduleId: number; sectionId: number | null }) => {
      await apiRequest("PUT", `/api/modules/${moduleId}/section`, { sectionId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      const action = variables.sectionId === null ? "unassigned from" : "assigned to";
      const sectionName = variables.sectionId === null ? "any section" : "the selected section";
      toast({
        title: "Success",
        description: `Module ${action} ${sectionName} successfully`,
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
        description: "Failed to update module section",
        variant: "destructive",
      });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: number) => {
      await apiRequest("DELETE", `/api/sections/${sectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
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
      await apiRequest("DELETE", `/api/assessment/questions/${questionId}`);
    },
    onSuccess: () => {
      // Invalidate all related assessment question queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/assessment/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sections", "assessment", "questions"] });
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  // Process progress data for display
  const processedData = allProgress.map(progress => {
    // For global assessment, find any assessment result for this user
    const assessmentResult = assessmentResults.find(result => 
      result.userId === progress.userId
    );
    return {
      ...progress,
      moduleName: progress.module?.title || 'Unknown Module',
      assessmentScore: assessmentResult ? `${assessmentResult.score}%` : '-',
      completionDate: progress.completedAt ? new Date(progress.completedAt).toLocaleDateString() : '-',
      assessmentDate: assessmentResult?.dateTaken ? new Date(assessmentResult.dateTaken).toLocaleDateString() : '-',
    };
  });

  // Filter data based on search and status
  const filteredData = processedData.filter(item => {
    const matchesSearch = item.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.moduleName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Helper functions for section-based reporting
  const getModulesBySection = (sectionId: number) => {
    return modules.filter(module => module.sectionId === sectionId);
  };

  const getSectionProgress = (sectionId: number, userId: string) => {
    const sectionModules = getModulesBySection(sectionId);
    const userModuleProgress = allProgress.filter(p => 
      p.userId === userId && sectionModules.some(m => m.id === p.moduleId)
    );
    
    if (sectionModules.length === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const completedCount = userModuleProgress.filter(p => p.status === 'completed').length;
    return {
      completed: completedCount,
      total: sectionModules.length,
      percentage: Math.round((completedCount / sectionModules.length) * 100)
    };
  };

  const getSectionAssessmentResults = (sectionId: number) => {
    return assessmentResults.filter(result => result.sectionId === sectionId);
  };

  // Get unique users for section-based reporting
  const uniqueUsers = [...new Map(allProgress.map(p => [p.userId, p.user])).values()];

  // Process section-based data
  const sectionData = sections.map(section => {
    const sectionModules = getModulesBySection(section.id);
    const sectionAssessments = getSectionAssessmentResults(section.id);
    
    const userProgress = uniqueUsers.map(user => {
      const progress = getSectionProgress(section.id, user.id);
      const assessment = sectionAssessments.find(a => a.userId === user.id);
      
      return {
        user,
        ...progress,
        assessmentScore: assessment ? assessment.score : null,
        assessmentDate: assessment ? new Date(assessment.dateTaken).toLocaleDateString() : null,
      };
    });

    return {
      ...section,
      modules: sectionModules,
      userProgress,
      completionRate: userProgress.length > 0 ? 
        Math.round((userProgress.filter(up => up.percentage === 100).length / userProgress.length) * 100) : 0
    };
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-secondary text-white">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-accent text-white">In Progress</Badge>;
      default:
        return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  const getModuleIcon = (index: number) => {
    const icons = [Shield, Database, Wifi];
    const Icon = icons[index % icons.length];
    return <Icon className="text-primary" size={20} />;
  };

  const exportCSV = () => {
    const csvContent = [
      ['Employee Name', 'Email', 'Module Name', 'Training Status', 'Assessment Score', 'Training Completion Date', 'Global Assessment Date'],
      ...filteredData.map(item => [
        `${item.user?.firstName} ${item.user?.lastName}`,
        item.user?.email,
        item.moduleName,
        item.status,
        item.assessmentScore,
        item.completionDate,
        item.assessmentDate
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'training-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage training content and monitor employee progress</p>
      </div>

      <Card className="shadow-material">
        <Tabs defaultValue="reporting" className="w-full">
          <div className="border-b border-gray-200">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="reporting" className="flex items-center">
                <BarChart className="mr-2 h-4 w-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="sections" className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Sectional progress
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center">
                <Edit className="mr-2 h-4 w-4" />
                Modules
              </TabsTrigger>
              <TabsTrigger value="section-mgmt" className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Sections
              </TabsTrigger>
              <TabsTrigger value="assessments" className="flex items-center">
                <HelpCircle className="mr-2 h-4 w-4" />
                Assessment Questions
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="reporting" className="p-6">
            {/* Statistics */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {new Set(allProgress.map(p => p.userId)).size}
                  </div>
                  <p className="text-sm text-gray-600">Total Users</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {allProgress.filter(p => p.status === 'completed').length}
                  </div>
                  <p className="text-sm text-gray-600">Completed Modules</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {allProgress.filter(p => p.status === 'in_progress').length}
                  </div>
                  <p className="text-sm text-gray-600">In Progress Modules</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {new Set(assessmentResults.map(r => r.userId)).size}
                  </div>
                  <p className="text-sm text-gray-600">Users Completed Assessment</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <Button onClick={exportCSV} className="bg-secondary text-white hover:bg-green-600">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>

            {/* Employee Progress Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Module Name</TableHead>
                    <TableHead>Training Status</TableHead>
                    <TableHead>Assessment Score</TableHead>
                    <TableHead>Training Completion</TableHead>
                    <TableHead>Global Assessment Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={`${item.userId}-${item.moduleId}`}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={item.user?.profileImageUrl} />
                            <AvatarFallback>
                              {item.user?.firstName?.[0]}{item.user?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm font-medium text-gray-900">
                            {item.user?.firstName} {item.user?.lastName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {item.user?.email}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {item.moduleName}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {item.assessmentScore}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {item.completionDate}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {item.assessmentDate}
                      </TableCell>
                      <TableCell>
                        {item.assessmentScore !== '-' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-orange-600 hover:text-orange-700"
                                disabled={resetAssessmentMutation.isPending}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reset Assessment Results</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to reset the assessment results for {item.user?.firstName} {item.user?.lastName}? 
                                  This action cannot be undone and will allow them to retake the assessment.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => resetAssessmentMutation.mutate(item.userId)}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  Reset Assessment
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="content" className="p-6">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Training Modules</h2>
              <div className="flex gap-2">
                <ModuleEditorDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/modules"] })}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Module
                  </Button>
                </ModuleEditorDialog>
              </div>
            </div>

            {/* Modules List */}
            <div className="space-y-4">
              {modules.map((module, index) => (
                <div key={module.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center">
                        {getModuleIcon(index)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-600">{module.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">Order: {module.order}</span>
                          <span className="text-xs text-gray-500">{module.estimatedDuration} min duration</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ModuleEditorDialog moduleId={module.id} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/modules"] })}>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </ModuleEditorDialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-600"
                            disabled={deleteModuleMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Module</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{module.title}"? This action cannot be undone and will remove all associated pages and progress data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteModuleMutation.mutate(module.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Module
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                        <GripVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sections" className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Section-Based Progress Reports</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {sectionData.map((section) => (
                  <Card key={section.id} className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{section.title}</span>
                        <Badge variant="outline">{section.completionRate}% Complete</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Modules:</span>
                          <span>{section.modules.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Users enrolled:</span>
                          <span>{section.userProgress.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Assessment attempts:</span>
                          <span>{getSectionAssessmentResults(section.id).length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="space-y-6">
                {sectionData.map((section) => (
                  <Card key={section.id} className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">{section.title} - User Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Assessment Score</TableHead>
                            <TableHead>Assessment Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {section.userProgress.map((userProg) => (
                            <TableRow key={userProg.user.id}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={userProg.user.profileImageUrl} />
                                    <AvatarFallback>
                                      {userProg.user.firstName?.[0]}{userProg.user.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{userProg.user.firstName} {userProg.user.lastName}</div>
                                    <div className="text-sm text-gray-500">{userProg.user.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>{userProg.completed}/{userProg.total} modules</span>
                                    <span>{userProg.percentage}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-primary h-2 rounded-full" 
                                      style={{ width: `${userProg.percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {userProg.assessmentScore ? (
                                  <Badge className={userProg.assessmentScore >= 80 ? "bg-green-600" : "bg-red-600"}>
                                    {userProg.assessmentScore}%
                                  </Badge>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {userProg.assessmentDate || <span className="text-gray-500">-</span>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="section-mgmt" className="p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Section Management</h2>
                <SectionDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/sections"] })}>
                  <Button className="bg-primary text-white hover:bg-primary-dark">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Section
                  </Button>
                </SectionDialog>
              </div>
              <div className="space-y-6">
                {sections.map((section) => (
                  <Card key={section.id} className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{section.title}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{getModulesBySection(section.id).length} modules</Badge>
                          <SectionDialog 
                            section={section}
                            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/sections"] })}
                          >
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </SectionDialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                disabled={deleteSectionMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Section</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{section.title}"? This action cannot be undone and will remove all modules in this section.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteSectionMutation.mutate(section.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Section
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600 mb-4">
                          {section.description}
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Modules in this section:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {getModulesBySection(section.id).map((module) => (
                              <div key={module.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">{module.title}</span>
                                <div className="flex items-center space-x-2">
                                  <Select 
                                    value={module.sectionId.toString()}
                                    onValueChange={(value) => {
                                      const newSectionId = parseInt(value);
                                      updateModuleSectionMutation.mutate({ moduleId: module.id, sectionId: newSectionId });
                                    }}
                                    disabled={updateModuleSectionMutation.isPending}
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {sections.map((s) => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                          {s.title}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-orange-600 hover:text-orange-700"
                                        disabled={updateModuleSectionMutation.isPending}
                                      >
                                        {updateModuleSectionMutation.isPending ? "Unassigning..." : "Unassign"}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Unassign Module</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to unassign "{module.title}" from this section? 
                                          The module will become unassigned and won't appear in any section until reassigned.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => updateModuleSectionMutation.mutate({ moduleId: module.id, sectionId: null })}
                                          className="bg-orange-600 hover:bg-orange-700"
                                        >
                                          Unassign Module
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Unassigned modules:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {modules.filter(m => !m.sectionId).map((module) => (
                              <div key={module.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                                <span className="text-sm">{module.title}</span>
                                <div className="flex items-center space-x-2">
                                  <Select 
                                    value=""
                                    onValueChange={(value) => {
                                      const newSectionId = parseInt(value);
                                      updateModuleSectionMutation.mutate({ moduleId: module.id, sectionId: newSectionId });
                                    }}
                                    disabled={updateModuleSectionMutation.isPending}
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue placeholder="Assign to section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {sections.map((s) => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                          {s.title}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <span className="text-xs text-gray-500 px-2">Already unassigned</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assessments" className="p-6">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Assessment Questions Management</h2>
              <AssessmentQuestionDialog 
                sections={sections}
                modules={modules}
                mode="create"
                existingQuestions={assessmentQuestions}
              />
            </div>

            <div className="space-y-6">
              {sections.map((section) => {
                const sectionQuestions = assessmentQuestions.filter(q => q.sectionId === section.id);
                return (
                  <Card key={section.id} className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{section.title} - Assessment Questions</span>
                        <Badge variant="outline">{sectionQuestions.length} questions</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sectionQuestions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <HelpCircle className="mx-auto h-12 w-12 mb-4" />
                          <p>No assessment questions for this section yet.</p>
                          <p className="text-sm">Click "Add Question" to create the first assessment question.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sectionQuestions.map((question) => (
                            <div key={question.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 mb-2">
                                    Question {question.order}: {question.question}
                                  </h4>
                                  <div className="space-y-1">
                                    {question.options.map((option, index) => (
                                      <div key={index} className="flex items-center space-x-2">
                                        <span className={`text-sm font-medium ${
                                          String.fromCharCode(97 + index) === question.correctAnswer 
                                            ? 'text-green-600' 
                                            : 'text-gray-600'
                                        }`}>
                                          {String.fromCharCode(97 + index)}.
                                        </span>
                                        <span className={`text-sm ${
                                          String.fromCharCode(97 + index) === question.correctAnswer 
                                            ? 'text-green-600 font-medium' 
                                            : 'text-gray-600'
                                        }`}>
                                          {option}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  <AssessmentQuestionDialog
                                    question={question}
                                    sections={sections}
                                    modules={modules}
                                    mode="edit"
                                    existingQuestions={assessmentQuestions}
                                  />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Assessment Question</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this assessment question? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteAssessmentQuestionMutation.mutate(question.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete Question
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </main>
  );
}
