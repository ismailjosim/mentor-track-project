export type CallLogStatus =
  'RECEIVED' | 'NOT_RECEIVED' | 'PHONE_OFF' | 'SWITCHED_OFF' | 'FOREIGN_NUMBER' | 'BUSY';

export interface CallLog {
  _id?: string;
  date: Date;
  status: CallLogStatus;
  notes?: string;
  calledBy?: string;
  issues?: string;
  promised?: string;
  nextFollowUp?: Date;
  studentId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CallLogCreateInput {
  date: Date;
  status: CallLogStatus;
  notes?: string;
  calledBy?: string;
  issues?: string;
  promised?: string;
  nextFollowUp?: Date;
  studentId: string;
}

export interface CallLogUpdateInput {
  date?: Date;
  status?: CallLogStatus;
  notes?: string;
  calledBy?: string;
  issues?: string;
  promised?: string;
  nextFollowUp?: Date;
}
