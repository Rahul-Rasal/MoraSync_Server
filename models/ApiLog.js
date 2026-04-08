import mongoose from 'mongoose';

const apiLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    sectionId: { type: String },
    model: { type: String, default: 'gemini-2.0-flash' },
    attempts: { type: Number, default: 1 },
    targetMora: { type: Number },
    actualMora: { type: Number },
    matched: { type: Boolean, default: false },
    flag: { type: String, enum: ['OK', 'WARNING'], default: 'OK' },
    enInput: { type: String },
    jpOutput: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const ApiLog = mongoose.model('ApiLog', apiLogSchema);
export default ApiLog;
