const supabase = require('../config/supabase');

// POST /api/reports — Any authenticated user submits a report
const submitReport = async (req, res) => {
    try {
        const { reported_user_id, reason, details } = req.body;

        if (!reported_user_id || !reason) {
            return res.status(400).json({ error: 'reported_user_id and reason are required' });
        }

        const { data, error } = await supabase
            .from('reports')
            .insert([{
                reporter_id: req.user.id,
                reported_user_id,
                reason,
                details: details || null,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) {
            console.error('Submit Report Error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({ message: 'Report submitted successfully', report: data });
    } catch (error) {
        console.error('Submit Report Error:', error);
        res.status(500).json({ error: 'Server error submitting report' });
    }
};

// GET /api/reports — Admin gets all reports
const getReports = async (req, res) => {
    try {
        const { status } = req.query;

        let query = supabase
            .from('reports')
            .select('*, reporter:users!reports_reporter_id_fkey(name, email), reported:users!reports_reported_user_id_fkey(name, email, avatar_url)')
            .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);

        const { data, error } = await query;

        if (error) {
            console.error('Get Reports Error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Get Reports Error:', error);
        res.status(500).json({ error: 'Server error fetching reports' });
    }
};

// PUT /api/reports/:id — Admin resolves/dismisses a report
const updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'resolved' | 'dismissed'

        const { data, error } = await supabase
            .from('reports')
            .update({ status, resolved_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Update Report Error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({ message: 'Report updated', report: data });
    } catch (error) {
        console.error('Update Report Error:', error);
        res.status(500).json({ error: 'Server error updating report' });
    }
};

module.exports = { submitReport, getReports, updateReport };
