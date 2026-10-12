'use client';

import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import type { StudentWithRelations } from '@/types';

export function useStudentsTableSelection(paginatedStudents: StudentWithRelations[]) {
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    studentId?: string;
    studentName?: string;
  }>({ isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);

  const pageIds = useMemo(
    () => paginatedStudents.map((s) => s._id!).filter(Boolean),
    [paginatedStudents]
  );
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  const handleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const response = await fetch('/api/students/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: Array.from(selectedIds) }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete students');

      setBulkDeleteModal(false);
      setSelectedIds(new Set());
      toast.success(`${data.data?.deleted ?? selectedIds.size} student(s) deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (error) {
      toast.error(
        `Failed to delete students: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteClick = (student: StudentWithRelations) => {
    setDeleteModal({
      isOpen: true,
      studentId: student._id,
      studentName: student.name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.studentId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/students/${deleteModal.studentId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete student');

      setDeleteModal({ isOpen: false });
      toast.success('Student deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (error) {
      toast.error(
        `Failed to delete student: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    selectedIds,
    allPageSelected,
    somePageSelected,
    handleSelectAll,
    handleToggleSelect,
    handleClearSelection,
    bulkDeleteModal,
    setBulkDeleteModal,
    isBulkDeleting,
    handleBulkDelete,
    deleteModal,
    setDeleteModal,
    isDeleting,
    handleDeleteClick,
    handleConfirmDelete,
  };
}
