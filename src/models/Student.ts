import mongoose, { Schema, Document } from 'mongoose';

export type AgeRange = '16-17' | '18-19' | '20-25' | '26-30' | '31-40' | '41-50' | '50+';
export type WorkingDevice = 'Laptop' | 'Desktop' | 'Mobile';
export type StudentStatus = 'On Track' | 'Behind' | 'At Risk' | 'Dropped' | 'Completed';
export type ProgramType = 'EJP' | 'SCIC' | 'Both' | 'Other';
export type AssignmentStatus = 'PENDING' | 'SUBMITTED' | 'COMPLETED';
export type LastCompletedAssignment =
  | 'A-01'
  | 'A-02'
  | 'A-03'
  | 'A-04'
  | 'A-05'
  | 'A-06'
  | 'A-07'
  | 'A-08'
  | 'A-09'
  | 'A-10'
  | 'None';

export interface StudentAssignment {
  assignmentNumber: number; // 1-10
  status: AssignmentStatus; // PENDING, SUBMITTED, COMPLETED
  marks?: number; // Optional marks for the assignment/SCIC confirmation
  date?: Date; // Submission/Completion date
}

export interface StudentDocument {
  _id?: string;
  ownerId: string;
  // Basic Info
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;

  // Location
  division?: string;
  district?: string;
  town?: string;
  livingArea?: string;

  // Academic
  occupation?: string;
  institute?: string;
  educationalBackground?: string;
  currentYear?: string;
  ageRange?: AgeRange;

  // Device
  workingDevice?: WorkingDevice;

  // Progress
  currentStatus?: StudentStatus;
  lastCompletedAssignment?: LastCompletedAssignment;
  mentorshipJoiningStatus?: boolean;
  programType?: ProgramType;
  scicMarks?: number;
  scicConfirmed?: boolean;

  // Relations
  callLogs?: string[];
  assignments?: StudentAssignment[];
  followUps?: string[];

  // Metadata
  lastContactedAt?: Date;
  comments?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

type StudentDocumentWithMongoose = StudentDocument & Document;

const StudentSchema = new Schema<StudentDocumentWithMongoose>(
  {
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    // Basic Info
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true,
    },
    whatsapp: {
      type: String,
      trim: true,
    },

    // Location
    division: String,
    district: String,
    town: String,
    livingArea: String,

    // Academic
    occupation: String,
    institute: String,
    educationalBackground: String,
    currentYear: String,
    ageRange: {
      type: String,
      enum: ['16-17', '18-19', '20-25', '26-30', '31-40', '41-50', '50+'],
    },

    // Device
    workingDevice: {
      type: String,
      enum: ['Laptop', 'Desktop', 'Mobile'],
    },

    // Progress
    currentStatus: {
      type: String,
      enum: ['On Track', 'Behind', 'At Risk', 'Dropped', 'Completed'],
      default: 'On Track',
    },
    lastCompletedAssignment: {
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
      default: 'None',
    },
    mentorshipJoiningStatus: {
      type: Boolean,
      default: false,
    },
    programType: {
      type: String,
      enum: ['EJP', 'SCIC', 'Both', 'Other'],
    },
    scicMarks: {
      type: Number,
      min: 0,
      max: 100,
    },
    scicConfirmed: {
      type: Boolean,
      default: false,
    },

    // Relations
    callLogs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'CallLog',
      },
    ],
    assignments: [
      {
        assignmentNumber: {
          type: Number,
          min: 1,
          max: 10,
          required: true,
        },
        status: {
          type: String,
          enum: ['PENDING', 'SUBMITTED', 'COMPLETED'],
          default: 'PENDING',
        },
        marks: {
          type: Number,
          min: 0,
          max: 100,
        },
        date: Date,
      },
    ],
    followUps: [
      {
        type: Schema.Types.ObjectId,
        ref: 'FollowUp',
      },
    ],

    // Metadata
    lastContactedAt: {
      type: Date,
    },
    comments: [String],
  },
  {
    timestamps: true,
  }
);

// Create indexes for optimal performance
StudentSchema.index({ ownerId: 1, email: 1 }, { unique: true });
StudentSchema.index({ ownerId: 1, currentStatus: 1 });
StudentSchema.index({ createdAt: -1 });

export default mongoose.models.Student ||
  mongoose.model<StudentDocumentWithMongoose>('Student', StudentSchema);
