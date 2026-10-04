'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PAGE_ROUTES } from '@/lib/constants';
import { studentApi } from '@/lib/api-client';

const createStudentSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  phone: z.string().min(6, 'Phone must be at least 6 digits').trim(),
  whatsapp: z.string().optional(),
  cohort: z.string(),
  division: z.string().optional(),
  institute: z.string().optional(),
  educationalBackground: z.string().optional(),
  currentYear: z.string().optional(),
  group: z.string().optional(),
  device: z.string().optional(),
});

type CreateStudentFormData = z.infer<typeof createStudentSchema>;

export function CreateStudentClient() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateStudentFormData>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      whatsapp: '',
      cohort: '14',
      division: '',
      institute: '',
      educationalBackground: '',
      currentYear: '',
      group: '',
      device: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateStudentFormData) => {
      const response = await studentApi.create({
        ...data,
        cohort: data.cohort || '14',
        email: data.email.toLowerCase().trim(),
        phone: data.phone.trim(),
        whatsapp: data.whatsapp?.trim() || undefined,
        division: data.division?.trim() || undefined,
        institute: data.institute?.trim() || undefined,
        educationalBackground: data.educationalBackground?.trim() || undefined,
        currentYear: data.currentYear?.trim() || undefined,
        group: data.group?.trim() || undefined,
        device: data.device?.trim() || undefined,
      });

      if (response.error) throw new Error(response.error);
      return response.data as { _id: string };
    },
    onSuccess: (createdStudent) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created successfully');
      router.push(`${PAGE_ROUTES.STUDENTS}/${createdStudent._id}`);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to create student';
      toast.error(message);
    },
  });

  const onSubmit = (data: CreateStudentFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <Link
          href={PAGE_ROUTES.STUDENTS}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Students
        </Link>
      </div>

      <div className="page-header rounded-3xl border border-border/70 bg-card/70 p-5 shadow-sm backdrop-blur-sm sm:p-7">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Student directory
          </p>
          <h1 className="page-title">Create New Student</h1>
          <p className="page-description">
            Add a student profile and the context mentors need to support them.
          </p>
        </div>
      </div>

      {mutation.error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">
            {mutation.error instanceof Error ? mutation.error.message : 'An error occurred'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="surface space-y-8 p-5 sm:p-7">
        <div>
          <h3 className="font-semibold mb-4">Required Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="John Doe"
                disabled={isSubmitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="john@example.com"
                disabled={isSubmitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Phone <span className="text-destructive">*</span>
              </label>
              <input
                type="tel"
                {...register('phone')}
                placeholder="01700000000"
                disabled={isSubmitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">WhatsApp (Optional)</label>
              <input
                type="tel"
                {...register('whatsapp')}
                placeholder="01700000000"
                disabled={isSubmitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Batch / Cohort <span className="text-destructive">*</span>
              </label>
              <select
                {...register('cohort')}
                disabled={isSubmitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="14">Batch 14 (Current)</option>
                <option value="13">Batch 13</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Division</label>
              <input
                type="text"
                {...register('division')}
                placeholder="e.g., Dhaka, Sylhet"
                disabled={isSubmitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Institute</label>
              <input
                type="text"
                {...register('institute')}
                placeholder="e.g., BUET"
                disabled={isSubmitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Educational Background</label>
              <input
                type="text"
                {...register('educationalBackground')}
                placeholder="e.g., CSE, EEE"
                disabled={isSubmitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Current Year</label>
              <select
                {...register('currentYear')}
                disabled={isSubmitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select year</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Group</label>
              <input
                type="text"
                {...register('group')}
                placeholder="e.g., Group A"
                disabled={isSubmitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Device</label>
              <input
                type="text"
                {...register('device')}
                placeholder="e.g., Laptop, Desktop"
                disabled={isSubmitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Link
            href={PAGE_ROUTES.STUDENTS}
            className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Creating...' : 'Create Student'}
          </button>
        </div>
      </form>
    </div>
  );
}
