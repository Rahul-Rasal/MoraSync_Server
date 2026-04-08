import mongoose from 'mongoose';

const sectionLyricSchema = new mongoose.Schema({
  sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  enLyrics: { type: String, default: '' },
  jpLyrics: { type: String, default: '' },        // raw Japanese (Kanji/mixed)
  hiraganaSpaced: { type: String, default: '' },  // spaced hiragana for SynthV
  romaji: { type: String, default: '' },
  moraCount: { type: Number, default: 0 },
  targetNotes: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  validationFlag: { type: String, enum: ['OK', 'WARNING', 'PENDING', ''], default: '' },
  attempts: { type: Number, default: 0 },
});

const versionSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    versionName: { type: String, required: true, default: 'Default Version' },
    data: [sectionLyricSchema],
  },
  { timestamps: true }
);

const Version = mongoose.model('Version', versionSchema);
export default Version;
