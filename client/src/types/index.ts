// Import types from shared schema
import type {
  User,
  TrainingSection,
  TrainingModule,
  ModulePage,
  EmployeeProgress,
  AssessmentQuestion,
  AssessmentResult,
} from "../../../shared/schema";

// Re-export shared types
export type {
  User,
  TrainingSection,
  TrainingModule,
  ModulePage,
  EmployeeProgress,
  AssessmentQuestion,
  AssessmentResult,
};

// Extended types for API responses
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// User types
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  role: "employee" | "admin";
  createdAt: string;
  updatedAt: string;
}

// Training section types
export interface TrainingSectionWithModules extends TrainingSection {
  modules: TrainingModule[];
}

// Training module types
export interface TrainingModuleWithPages extends TrainingModule {
  pages: ModulePage[];
  section?: TrainingSection;
}

// Module page types
export interface ModulePageWithModule extends ModulePage {
  module: TrainingModule;
}

// Progress types
export interface EmployeeProgressWithUser extends EmployeeProgress {
  user: AuthenticatedUser;
  module: TrainingModule;
}

export interface EmployeeProgressWithModule extends EmployeeProgress {
  module: TrainingModule;
}

// Assessment types
export interface AssessmentQuestionWithModule extends AssessmentQuestion {
  module?: TrainingModule;
}

export interface AssessmentResultWithUser extends AssessmentResult {
  user: AuthenticatedUser;
}

export interface AssessmentResultWithSection extends AssessmentResult {
  section?: TrainingSection;
}

// Dashboard types
export interface DashboardStats {
  totalUsers: number;
  totalModules: number;
  totalSections: number;
  completedModules: number;
  inProgressModules: number;
  totalAssessments: number;
}

export interface UserProgressSummary {
  userId: string;
  user: AuthenticatedUser;
  completedModules: number;
  totalModules: number;
  progressPercentage: number;
  lastActivity?: string;
}

export interface SectionProgressSummary {
  sectionId: number;
  section: TrainingSection;
  totalModules: number;
  completedModules: number;
  progressPercentage: number;
  userProgress: UserProgressSummary[];
}

// Form types
export interface CreateModuleFormData {
  title: string;
  description?: string;
  order: number;
  estimatedDuration?: number;
  sectionId?: number;
}

export interface CreatePageFormData {
  moduleId: number;
  pageOrder: number;
  pageType: "text" | "image" | "video" | "ppt_slide";
  title?: string;
  content?: string;
}

export interface CreateAssessmentQuestionFormData {
  question: string;
  options: string[];
  correctAnswer: string;
  moduleId?: number;
  sectionId?: number;
  order: number;
}

// API response types
export interface AuthResponse {
  user: AuthenticatedUser;
  isAuthenticated: boolean;
}

export interface LoginResponse {
  user: AuthenticatedUser;
  success: boolean;
}

export interface LogoutResponse {
  success: boolean;
}

// Component prop types
export interface ModuleEditorDialogProps {
  module?: TrainingModule;
  sections: TrainingSection[];
  onSave: (module: CreateModuleFormData) => void;
  onClose: () => void;
}

export interface AssessmentQuestionDialogProps {
  question?: AssessmentQuestion;
  sections: TrainingSection[];
  onSave: (question: CreateAssessmentQuestionFormData) => void;
  onClose: () => void;
}

export interface SectionDialogProps {
  section?: TrainingSection;
  onSave: (section: Omit<TrainingSection, "id" | "createdAt" | "updatedAt">) => void;
  onClose: () => void;
}

// Navigation types
export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
}

// Chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface ProgressChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

// Utility types
export type Status = "not_started" | "in_progress" | "completed";
export type UserRole = "employee" | "admin";
export type PageType = "text" | "image" | "video" | "ppt_slide";

// Hook return types
export interface UseAuthReturn {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface UseQueryReturn<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Error types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// File upload types
export interface FileUploadResponse {
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}

// Certificate types
export interface CertificateData {
  userId: string;
  userName: string;
  sectionName: string;
  completionDate: string;
  score?: number;
  certificateId: string;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  sectionId?: number;
  status?: Status;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} 