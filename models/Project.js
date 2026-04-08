import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  time: { type: Number, required: true },
  duration: { type: Number, required: true },
  ticks: { type: Number, required: true },
});

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startBar: { type: Number, required: true },
  startBeat: { type: Number, required: true },
  startStep: { type: Number, required: true },
  endBar: { type: Number, required: true },
  endBeat: { type: Number, required: true },
  endStep: { type: Number, required: true },
  noteCount: { type: Number, required: true },
});

const projectSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    bpm: { type: Number, default: 120 },
    ppq: { type: Number, default: 480 },
    totalNotes: { type: Number, default: 0 },
    timeSignature: { type: String, default: '4/4' },
    originalFilename: { type: String },
    rawNotes: [noteSchema],
    sections: [sectionSchema],
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', projectSchema);
export default Project;
