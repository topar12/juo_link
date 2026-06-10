'use client';

import type { ProjectConfig } from '@/features/admin/lib/constants';
import LinkinbioDashboard from '@/features/admin/components/LinkinbioDashboard';
import QuizProjectDashboard from '@/features/admin/components/QuizProjectDashboard';

interface ProjectDashboardProps {
  project: ProjectConfig;
}

export default function ProjectDashboard({ project }: ProjectDashboardProps) {
  if (project.dashboardKind === 'linkinbio') {
    return <LinkinbioDashboard project={project} />;
  }

  return <QuizProjectDashboard project={project} />;
}
