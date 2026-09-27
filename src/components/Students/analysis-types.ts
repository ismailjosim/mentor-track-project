export interface AnalysisStudent {
  id: string;
  name: string;
  completed: boolean;
  previousStatus: string;
  newStatus: string;
}

export interface AnalysisResult {
  totalStudents: number;
  completedAssignment: number;
  completedCount: number;
  notCompletedCount: number;
  updatedCount: number;
  students: AnalysisStudent[];
}
