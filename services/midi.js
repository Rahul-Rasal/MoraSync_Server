import pkg from '@tonejs/midi';
const { Midi } = pkg;

/**
 * MIDI Phrase Engine
 * Parses a .mid buffer and extracts vocal phrases using the "Rest Algorithm"
 * A new phrase is created when gap between notes > 2.0 seconds
 */
export const parseMidi = (buffer) => {
  const midi = new Midi(buffer);

  // --- Extract BPM ---
  let bpm = 120;
  if (midi.header.tempos && midi.header.tempos.length > 0) {
    bpm = Math.round(midi.header.tempos[0].bpm);
  }

  // --- Extract time signature ---
  let timeSignature = '4/4';
  if (midi.header.timeSignatures && midi.header.timeSignatures.length > 0) {
    const ts = midi.header.timeSignatures[0].timeSignature;
    timeSignature = `${ts[0]}/${ts[1]}`;
  }

  // --- Find vocal track (track with most notes) ---
  let vocalTrack = null;
  let maxNotes = 0;
  for (const track of midi.tracks) {
    if (track.notes.length > maxNotes) {
      maxNotes = track.notes.length;
      vocalTrack = track;
    }
  }

  if (!vocalTrack || vocalTrack.notes.length === 0) {
    return {
      bpm,
      timeSignature,
      totalNotes: 0,
      phrases: [],
      trackName: 'Unknown',
    };
  }

  // --- Extract PPQ ---
  const ppq = midi.header.ppq || 480;

  const trackName = vocalTrack.name || 'Vocal';
  const rawNotes = [...vocalTrack.notes]
    .sort((a, b) => a.time - b.time)
    .map(n => ({
      time: parseFloat(n.time.toFixed(3)),
      duration: parseFloat(n.duration.toFixed(3)),
      ticks: n.ticks
    }));
  
  const totalNotes = rawNotes.length;

  return { bpm, ppq, timeSignature, totalNotes, trackName, rawNotes };
};

const buildPhrase = (index, notes) => ({
  index,
  noteCount: notes.length,
  startTime: parseFloat(notes[0].time.toFixed(3)),
  endTime: parseFloat((notes[notes.length - 1].time + notes[notes.length - 1].duration).toFixed(3)),
});
