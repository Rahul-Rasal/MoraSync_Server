import User from '../models/User.js';
import ApiLog from '../models/ApiLog.js';
import bcrypt from 'bcryptjs';

// GET /api/admin/users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/users/:id
export const updateUser = async (req, res) => {
  try {
    const { name, role, newPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (role) user.role = role;
    if (newPassword) {
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save({ validateBeforeSave: false });
    const updated = await User.findById(user._id).select('-password');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/api-usage
// Returns hourly aggregated API call counts for the last 24 hours
export const getApiUsage = async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const logs = await ApiLog.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: {
            hour: { $hour: '$timestamp' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          },
          calls: { $sum: 1 },
          totalAttempts: { $sum: '$attempts' },
          warnings: { $sum: { $cond: [{ $eq: ['$flag', 'WARNING'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.date': 1, '_id.hour': 1 } },
    ]);

    // Fill in missing hours
    const result = logs.map((l) => ({
      label: `${l._id.date} ${String(l._id.hour).padStart(2, '0')}:00`,
      calls: l.calls,
      totalAttempts: l.totalAttempts,
      warnings: l.warnings,
    }));

    // Summary stats
    const totalCalls = await ApiLog.countDocuments();
    const totalWarnings = await ApiLog.countDocuments({ flag: 'WARNING' });
    const totalUsers = await User.countDocuments();

    res.json({ hourly: result, stats: { totalCalls, totalWarnings, totalUsers } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/hallucination-log
// Phrases that failed the 3-attempt validation loop
export const getHallucinationLog = async (req, res) => {
  try {
    const logs = await ApiLog.find({ flag: 'WARNING' })
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('userId', 'name email')
      .populate('projectId', 'title');

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
