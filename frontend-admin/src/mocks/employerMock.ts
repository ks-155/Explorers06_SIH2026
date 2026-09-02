import type { PendingItem } from '@/components/employer/VerifyCard';

export const mockPending: PendingItem[] = [
  { employment_id: 'emp-1', trainee_name: 'Rahul Sharma', job_role: 'Solar Technician', training_job_role: 'Solar Technician', confidence_score: 20, joining_date: '2026-06-01' },
  { employment_id: 'emp-2', trainee_name: 'Priya Deshmukh', job_role: 'Electrician', training_job_role: 'Electrician', confidence_score: 20, joining_date: '2026-05-12' },
  { employment_id: 'emp-3', trainee_name: 'Amit Pawar', job_role: 'Fitter', training_job_role: 'Fitter', confidence_score: 45, joining_date: '2026-07-15' },
  { employment_id: 'emp-4', trainee_name: 'Sneha Patil', job_role: 'Welder', training_job_role: 'Welder', confidence_score: 20, joining_date: '2026-04-20' },
  { employment_id: 'emp-5', trainee_name: 'Vikas Jadhav', job_role: 'CNC Operator', training_job_role: 'CNC Operator', confidence_score: 60, joining_date: '2026-06-10' },
];
