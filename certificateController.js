const supabase = require('../config/supabase');

// POST /api/certificates — Generate a certificate (system/auto)
const generateCertificate = async (req, res) => {
    try {
        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({ error: 'Course ID is required' });
        }

        // Check if user is enrolled and has completed the course
        const { data: enrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', req.user.id)
            .eq('course_id', course_id)
            .single();

        if (!enrollment) {
            return res.status(400).json({ error: 'You are not enrolled in this course' });
        }

        // Check if certificate already exists
        const { data: existing } = await supabase
            .from('certificates')
            .select('id')
            .eq('user_id', req.user.id)
            .eq('course_id', course_id)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Certificate already issued for this course' });
        }

        // Generate certificate number
        const certNumber = `LH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const { data, error } = await supabase
            .from('certificates')
            .insert([{
                user_id: req.user.id,
                course_id,
                certificate_number: certNumber
            }])
            .select('*, courses(title)')
            .single();

        if (error) {
            console.error("Generate Certificate Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({ message: 'Certificate generated', certificate: data });
    } catch (error) {
        console.error("Generate Certificate Error:", error);
        res.status(500).json({ error: 'Server error generating certificate' });
    }
};

// GET /api/certificates/my — Get current user's certificates
const getMyCertificates = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('certificates')
            .select('*, courses(title, category)')
            .eq('user_id', req.user.id)
            .order('issued_at', { ascending: false });

        if (error) {
            console.error("Get Certificates Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Get Certificates Error:", error);
        res.status(500).json({ error: 'Server error fetching certificates' });
    }
};

// GET /api/certificates/verify/:certNumber — Verify a certificate (public)
const verifyCertificate = async (req, res) => {
    try {
        const { certNumber } = req.params;

        const { data, error } = await supabase
            .from('certificates')
            .select('*, users(name), courses(title)')
            .eq('certificate_number', certNumber)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        res.status(200).json({ valid: true, certificate: data });
    } catch (error) {
        console.error("Verify Certificate Error:", error);
        res.status(500).json({ error: 'Server error verifying certificate' });
    }
};

module.exports = { generateCertificate, getMyCertificates, verifyCertificate };
