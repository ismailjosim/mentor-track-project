import mongoose, { Schema, Document } from 'mongoose';

export type CallLogStatus =
  | 'RECEIVED'
  | 'NOT_RECEIVED'
  | 'PHONE_OFF'
  | 'SWITCHED_OFF'
  | 'FOREIGN_NUMBER';

export interface CallLogDocument {
  _id?: string;
  ownerId: string;
  date: Date;
  status: CallLogStatus;
  notes?: string;
  calledBy?: string;
  issues?: string;
  promised?: string;
  nextFollowUp?: Date;
  studentId: string;
  /**
   * Snapshot of the student's `lastCompletedAssignment` at the moment this call
   * was logged (e.g. 'A-09', 'None'). Used by the assignment-wise call report to
   * show how many calls were made while a student was working toward a given
   * assignment. Populated automatically on create; absent on records logged
   * before this field existed.
   */
  assignmentContext?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type CallLogDocumentWithMongoose = CallLogDocument & Document;

const CallLogSchema = new Schema<CallLogDocumentWithMongoose>(
  {
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Call date is required'],
      validate: {
        validator: (value: Date) => {
          return value <= new Date();
        },
        message: 'Date cannot be in the future',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['RECEIVED', 'NOT_RECEIVED', 'PHONE_OFF', 'SWITCHED_OFF', 'FOREIGN_NUMBER'],
        message:
          'Status must be one of: RECEIVED, NOT_RECEIVED, PHONE_OFF, SWITCHED_OFF, FOREIGN_NUMBER',
      },
      required: [true, 'Call status is required'],
    },
    notes: String,
    calledBy: String,
    issues: String,
    promised: String,
    nextFollowUp: {
      type: Date,
      default: function () {
        const date = new Date(this.date);
        date.setDate(date.getDate() + 7);
        return date;
      },
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
    } as unknown as typeof Schema.Types.ObjectId,
    assignmentContext: {
      type: String,
      enum: [
        'A-01',
        'A-02',
        'A-03',
        'A-04',
        'A-05',
        'A-06',
        'A-07',
        'A-08',
        'A-09',
        'A-10',
        'None',
      ],
    },
  },
  { timestamps: true }
);

// Create indexes for optimal performance
CallLogSchema.index({ ownerId: 1, studentId: 1 });
CallLogSchema.index({ ownerId: 1, date: -1 });
CallLogSchema.index({ ownerId: 1, assignmentContext: 1 });

export default mongoose.models.CallLog ||
  mongoose.model<CallLogDocumentWithMongoose>('CallLog', CallLogSchema);
