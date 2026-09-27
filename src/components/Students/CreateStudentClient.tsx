'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PAGE_ROUTES } from '@/lib/constants';
import { studentApi } from '@/lib/api-client';

export function CreateStudentClient() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    division: '',
    institute: '',
    educationalBackground: '',
    currentYear: '',
    group: '',
    device: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!form.name.trim()) throw new Error('Name is required');
      if (!form.email.trim()) throw new Error('Email is required');
      if (!form.phone.trim()) throw new Error('Phone is required');

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) throw new Error('Invalid email format');

      const response = await studentApi.create({
        ...form,
        email: form.email.toLowerCase().trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || undefined,
        division: form.division.trim() || undefined,
        institute: form.institute.trim() || undefined,
        educationalBackground: form.educationalBackground.trim() || undefined,
        currentYear: form.currentYear.trim() || undefined,
        group: form.group.trim() || undefined,
        device: form.device.trim() || undefined,
      });

      if (response.error) throw new Error(response.error);

      toast.success('Student created successfully');
      const createdStudent = response.data as { _id: string };
      router.push(`${PAGE_ROUTES.STUDENTS}/${createdStudent._id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create student';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
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

      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="surface space-y-8 p-5 sm:p-7">
        <div>
          <h3 className="font-semibold mb-4">Required Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                required
                disabled={submitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
                required
                disabled={submitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Phone <span className="text-destructive">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="01700000000"
                required
                disabled={submitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">WhatsApp (Optional)</label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="01700000000"
                disabled={submitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
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
                value={form.division}
                onChange={(e) => setForm({ ...form, division: e.target.value })}
                placeholder="e.g., Dhaka, Sylhet"
                disabled={submitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Institute</label>
              <input
                type="text"
                value={form.institute}
                onChange={(e) => setForm({ ...form, institute: e.target.value })}
                placeholder="e.g., BUET"
                disabled={submitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Educational Background</label>
              <input
                type="text"
                value={form.educationalBackground}
                onChange={(e) => setForm({ ...form, educationalBackground: e.target.value })}
                placeholder="e.g., CSE, EEE"
                disabled={submitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Current Year</label>
              <select
                value={form.currentYear}
                onChange={(e) => setForm({ ...form, currentYear: e.target.value })}
                disabled={submitting}
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
                value={form.group}
                onChange={(e) => setForm({ ...form, group: e.target.value })}
                placeholder="e.g., Group A"
                disabled={submitting}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Device</label>
              <input
                type="text"
                value={form.device}
                onChange={(e) => setForm({ ...form, device: e.target.value })}
                placeholder="e.g., Laptop, Desktop"
                disabled={submitting}
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
            disabled={submitting}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Student'}
          </button>
        </div>
      </form>
    </div>
  );
}
