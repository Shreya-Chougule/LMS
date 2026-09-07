const supabase = require('../config/supabase');

// POST /api/assignments — Create an assignment (instructor)
const createAssignment = async (req, res) => {
    try {
        const { course_id, title, description, due_date, max_score } = req.body;

        if (!course_id || !title) {
            return res.status(400).json({ error: 'Course ID and title are required' });
        }

        const { data, error } = await supabase
            .from('assignments')
            .insert([{
                course_id,
                title,
                description,
                due_date,
                max_score: max_score || 100,
                created_by: req.user.id
            }])
            .select()
            .single();

        if (error) {
            console.error("Create Assignment Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({ message: 'Assignment created', assignment: data });
    } catch (error) {
        console.error("Create Assignment Error:", error);
        res.status(500).json({ error: 'Server error creating assignment' });
    }
};

// GET /api/assignments/course/:courseId — Get assignments for a course
const getAssignmentsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const { data, error } = await supabase
            .from('assignments')
            .select('*')
            .eq('course_id', courseId)
            .order('due_date', { ascending: true });

        if (error) {
            console.error("Get Assignments Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Get Assignments Error:", error);
        res.status(500).json({ error: 'Server error fetching assignments' });
    }
};

// POST /api/assignments/:id/submit — Submit an assignment (student)
const submitAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, file_url } = req.body;

        const { data, error } = await supabase
            .from('assignment_submissions')
            .upsert([{
                assignment_id: id,
                user_id: req.user.id,
                content,
                file_url,
                submitted_at: new Date().toISOString(),
                status: 'submitted'
            }], { onConflict: 'assignment_id,user_id' })
            .select()
            .single();

        if (error) {
            console.error("Submit Assignment Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({ message: 'Assignment submitted', submission: data });
    } catch (error) {
        console.error("Submit Assignment Error:", error);
        res.status(500).json({ error: 'Server error submitting assignment' });
    }
};

// PUT /api/assignments/submissions/:id/grade — Grade a submission (instructor)
const gradeSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const { score, feedback } = req.body;

        const { data, error } = await supabase
            .from('assignment_submissions')
            .update({
                score,
                feedback,
                status: 'graded',
                graded_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error("Grade Submission Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({ message: 'Submission graded', submission: data });
    } catch (error) {
        console.error("Grade Submission Error:", error);
        res.status(500).json({ error: 'Server error grading submission' });
    }
};

// GET /api/assignments/my — Get current user's assignment submissions
const getMySubmissions = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('assignment_submissions')
            .select('*, assignments(title, course_id, due_date, max_score)')
            .eq('user_id', req.user.id)
            .order('submitted_at', { ascending: false });

        if (error) {
            console.error("Get Submissions Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Get Submissions Error:", error);
        res.status(500).json({ error: 'Server error fetching submissions' });
    }
};

// GET /api/assignments/:id/submissions — Get all submissions for an assignment (instructor)
const getSubmissionsForAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('assignment_submissions')
            .select('*, users(name, email)')
            .eq('assignment_id', id)
            .order('submitted_at', { ascending: false });

        if (error) {
            console.error("Get Submissions Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Get Submissions Error:", error);
        res.status(500).json({ error: 'Server error fetching submissions' });
    }
};

module.exports = { createAssignment, getAssignmentsByCourse, submitAssignment, gradeSubmission, getMySubmissions, getSubmissionsForAssignment };
