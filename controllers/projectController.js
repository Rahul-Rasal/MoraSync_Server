import Project from '../models/Project.js';
import Version from '../models/Version.js';
import { parseMidi } from '../services/midi.js';

// POST /api/projects/upload
export const uploadProject = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No MIDI file uploaded' });

    const title = req.body.title || req.file.originalname.replace(/\.(mid|midi)$/i, '');
    const parsed = parseMidi(req.file.buffer);

    const project = await Project.create({
      userId: req.user._id,
      title,
      bpm: parsed.bpm,
      ppq: parsed.ppq,
      totalNotes: parsed.totalNotes,
      timeSignature: parsed.timeSignature,
      originalFilename: req.file.originalname,
      rawNotes: parsed.rawNotes,
      sections: [],
    });

    const version = await Version.create({
      projectId: project._id,
      versionName: 'Version 1',
      data: [],
    });

    res.status(201).json({ project, version });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/projects
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/projects/:id
export const getProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const versions = await Version.find({ projectId: project._id });
    res.json({ project, versions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/projects/:id
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title: req.body.title },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await Version.deleteMany({ projectId: project._id });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/projects/:id/sections
export const addSection = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const { name, startBar, startBeat, startStep, endBar, endBeat, endStep } = req.body;
    const beatsPerBar = parseInt(project.timeSignature.split('/')[0]) || 4;
    const ppq = project.ppq || 480;

    // Convert DAW position (1-indexed) to MIDI Ticks (0-indexed)
    // 1 Beat = 1 Quarter Note = PPQ ticks. 1 Step = 16th Note = PPQ / 4 ticks.
    const stepsPerBeat = 4;
    const ticksPerStep = ppq / stepsPerBeat;

    const startTicks = 
      (startBar - 1) * beatsPerBar * ppq +
      (startBeat - 1) * ppq +
      (startStep - 1) * ticksPerStep;

    const endTicks = 
      (endBar - 1) * beatsPerBar * ppq +
      (endBeat - 1) * ppq +
      (endStep - 1) * ticksPerStep;

    // Filter raw notes falling strictly within these abstract ticks
    const sectionNotes = project.rawNotes.filter(n => n.ticks >= startTicks && n.ticks < endTicks);

    project.sections.push({
      name, startBar, startBeat, startStep, endBar, endBeat, endStep,
      noteCount: sectionNotes.length
    });

    await project.save();
    
    const newSection = project.sections[project.sections.length - 1];

    // Initialize an empty blank response on ALL versions for this new Section
    const versions = await Version.find({ projectId: project._id });
    for (const ver of versions) {
      ver.data.push({
        sectionId: newSection._id,
        targetNotes: newSection.noteCount,
        enLyrics: '', jpLyrics: '', hiraganaSpaced: '', romaji: '',
        moraCount: 0, isLocked: false, validationFlag: 'PENDING', attempts: 0
      });
      await ver.save();
    }

    res.status(201).json({ project, versions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/projects/:id/sections/:sectionId
export const updateSection = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const section = project.sections.id(req.params.sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    const { name, noteCount } = req.body;
    let modifiedTargetNotes = false;

    if (name !== undefined) section.name = name;
    if (noteCount !== undefined) {
      section.noteCount = Number(noteCount);
      modifiedTargetNotes = true;
    }

    await project.save();

    const versions = await Version.find({ projectId: project._id });
    if (modifiedTargetNotes) {
      for (const ver of versions) {
        const d = ver.data.find(d => d.sectionId.toString() === req.params.sectionId);
        if (d) {
          d.targetNotes = section.noteCount;
          if (d.hiraganaSpaced) {
            d.validationFlag = d.moraCount === d.targetNotes ? 'OK' : 'WARNING';
          }
        }
        await ver.save();
      }
    }

    res.json({ project, versions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/projects/:id/sections/:sectionId
export const deleteSection = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.sections = project.sections.filter(s => s._id.toString() !== req.params.sectionId);
    await project.save();

    // Clean up lyric data for this section
    const versions = await Version.find({ projectId: project._id });
    for (const ver of versions) {
      ver.data = ver.data.filter(d => d.sectionId.toString() !== req.params.sectionId);
      await ver.save();
    }

    res.json({ project, versions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
