import Version from '../models/Version.js';
import Project from '../models/Project.js';
import { generateLyrics } from '../services/lyricService.js';

// POST /api/lyrics/generate
export const generate = async (req, res) => {
  try {
    const { enText, sectionId, versionId, projectId } = req.body;

    if (!enText || !sectionId || !versionId)
      return res.status(400).json({ message: 'enText, sectionId, and versionId are required' });

    const version = await Version.findById(versionId);
    if (!version) return res.status(404).json({ message: 'Version not found' });

    // Check lock
    const sectionDatum = version.data.find((d) => d.sectionId.toString() === sectionId);
    if (sectionDatum?.isLocked)
      return res.status(403).json({ message: 'Section is locked' });

    // Get note count from project
    const project = await Project.findById(projectId || version.projectId);
    const section = project?.sections?.find((s) => s._id.toString() === sectionId);
    const targetNotes = section?.noteCount || 8;

    // Run recursive validation loop
    const result = await generateLyrics({
      enText,
      targetNotes,
      userId: req.user._id,
      projectId: version.projectId,
      sectionId,
    });

    // Auto-save result to version
    const idx = version.data.findIndex((d) => d.sectionId.toString() === sectionId);
    if (idx !== -1) {
      version.data[idx] = {
        ...version.data[idx].toObject(),
        enLyrics: enText,
        jpLyrics: result.jpLyrics,
        hiraganaSpaced: result.hiraganaSpaced,
        romaji: result.romaji,
        moraCount: result.moraCount,
        validationFlag: result.flag,
        attempts: result.attempts,
      };
    } else {
      version.data.push({
        sectionId,
        enLyrics: enText,
        jpLyrics: result.jpLyrics,
        hiraganaSpaced: result.hiraganaSpaced,
        romaji: result.romaji,
        moraCount: result.moraCount,
        targetNotes,
        validationFlag: result.flag,
        attempts: result.attempts,
      });
    }

    await version.save();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/lyrics/:versionId/section/:sectionId — manual save
export const updatePhrase = async (req, res) => {
  try {
    const { versionId, sectionId } = req.params;
    const { enLyrics, jpLyrics, hiraganaSpaced, romaji, moraCount } = req.body;

    const version = await Version.findById(versionId);
    if (!version) return res.status(404).json({ message: 'Version not found' });

    const idx = version.data.findIndex((d) => d.sectionId.toString() === sectionId);
    if (idx !== -1) {
      Object.assign(version.data[idx], { enLyrics, jpLyrics, hiraganaSpaced, romaji, moraCount });
    }
    await version.save();
    res.json(version.data[idx]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/lyrics/:versionId/section/:sectionId/lock — toggle lock
export const toggleLock = async (req, res) => {
  try {
    const { versionId, sectionId } = req.params;
    const version = await Version.findById(versionId);
    if (!version) return res.status(404).json({ message: 'Version not found' });

    const idx = version.data.findIndex((d) => d.sectionId.toString() === sectionId);
    if (idx !== -1) {
      version.data[idx].isLocked = !version.data[idx].isLocked;
      await version.save();
      res.json({ isLocked: version.data[idx].isLocked });
    } else {
      res.status(404).json({ message: 'Section not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/lyrics/:versionId/save-all — bulk auto-save
export const saveAll = async (req, res) => {
  try {
    const { versionId } = req.params;
    const { data } = req.body;

    const version = await Version.findById(versionId);
    if (!version) return res.status(404).json({ message: 'Version not found' });

    // Merge incoming data
    for (const incoming of data) {
      const idx = version.data.findIndex((d) => d.sectionId.toString() === incoming.sectionId.toString());
      if (idx !== -1 && !version.data[idx].isLocked) {
        Object.assign(version.data[idx], incoming);
      }
    }

    await version.save();
    res.json({ message: 'Saved', updatedAt: version.updatedAt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/lyrics/:versionId/export — SynthV .txt export
export const exportSynthV = async (req, res) => {
  try {
    const version = await Version.findById(req.params.versionId);
    if (!version) return res.status(404).json({ message: 'Version not found' });

    // Usually we would sort this by time. section ordering inside Project is the truth.
    // For now, they are generated sequentially as they appear in the array:
    const lines = version.data
      .map((d) => d.hiraganaSpaced || '—')
      .join('\n');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="synthv_lyrics_${req.params.versionId}.txt"`);
    res.send(lines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
