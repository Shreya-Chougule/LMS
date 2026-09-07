const supabase = require('../config/supabase');

// POST /api/quizzes — Create a quiz (instructor)
const createQuiz = async (req, res) => {
    try {
        const { course_id, title, description, passing_score, time_limit } = req.body;

        if (!course_id || !title) {
            return res.status(400).json({ error: 'Course ID and title are required' });
        }

        const { data, error } = await supabase
            .from('quizzes')
            .insert([{
                course_id,
                title,
                description,
                passing_score: passing_score || 70,
                time_limit: time_limit || null,
                created_by: req.user.id
            }])
            .select()
            .single();

        if (error) {
            console.error("Create Quiz Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({ message: 'Quiz created successfully', quiz: data });
    } catch (error) {
        console.error("Create Quiz Error:", error);
        res.status(500).json({ error: 'Server error creating quiz' });
    }
};

// POST /api/quizzes/:id/questions — Add questions to a quiz
const addQuestions = async (req, res) => {
    try {
        const { id } = req.params;
        const { questions } = req.body; // Array of { question_text, options, correct_answer, points }

        if (!questions || !questions.length) {
            return res.status(400).json({ error: 'Questions array is required' });
        }

        const questionsWithQuizId = questions.map(q => ({ ...q, quiz_id: id }));

        const { data, error } = await supabase
            .from('quiz_questions')
            .insert(questionsWithQuizId)
            .select();

        if (error) {
            console.error("Add Questions Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({ message: 'Questions added', questions: data });
    } catch (error) {
        console.error("Add Questions Error:", error);
        res.status(500).json({ error: 'Server error adding questions' });
    }
};

// GET /api/quizzes/:id — Get a quiz with its questions
const getQuiz = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('quizzes')
            .select('*, quiz_questions(*)')
            .eq('id', id)
            .single();

        if (error) {
            console.error("Get Quiz Error:", error);
            return res.status(404).json({ error: 'Quiz not found' });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Get Quiz Error:", error);
        res.status(500).json({ error: 'Server error fetching quiz' });
    }
};

// GET /api/quizzes/course/:courseId — Get all quizzes for a course
const getQuizzesByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('course_id', courseId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Get Quizzes Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Get Quizzes Error:", error);
        res.status(500).json({ error: 'Server error fetching quizzes' });
    }
};

// POST /api/quizzes/:id/submit — Submit quiz answers
const submitQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { answers } = req.body; // { question_id: selected_answer }

        // Prevent multiple attempts for the same quiz
        const { data: existingAttempt, error: attemptError } = await supabase
            .from('quiz_results')
            .select('id, score, passed, submitted_at')
            .eq('quiz_id', id)
            .eq('user_id', req.user.id)
            .maybeSingle();

        if (attemptError) {
            console.error('Submit Quiz - Existing Attempt Error:', attemptError);
            return res.status(400).json({ error: attemptError.message });
        }

        if (existingAttempt) {
            return res.status(409).json({
                error: 'You have already submitted this quiz. Only one attempt is allowed.',
                attempt: existingAttempt
            });
        }

        // Get quiz with questions to grade
        const { data: quiz, error: quizError } = await supabase
            .from('quizzes')
            .select('*, quiz_questions(*)')
            .eq('id', id)
            .single();

        if (quizError || !quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // Grade the quiz
        let totalPoints = 0;
        let earnedPoints = 0;

        quiz.quiz_questions.forEach(q => {
            totalPoints += (q.points || 1);
            if (answers[q.id] === q.correct_answer) {
                earnedPoints += (q.points || 1);
            }
        });

        const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        const passed = score >= (quiz.passing_score || 70);

        // Save result
        const { data: result, error: resultError } = await supabase
            .from('quiz_results')
            .insert([{
                quiz_id: id,
                user_id: req.user.id,
                score,
                passed,
                answers,
                total_points: totalPoints,
                earned_points: earnedPoints
            }])
            .select()
            .single();

        if (resultError) {
            console.error("Submit Quiz Error:", resultError);
            return res.status(400).json({ error: resultError.message });
        }

        res.status(200).json({
            message: passed ? 'Quiz passed!' : 'Quiz not passed',
            score,
            passed,
            result
        });
    } catch (error) {
        console.error("Submit Quiz Error:", error);
        res.status(500).json({ error: 'Server error submitting quiz' });
    }
};

// GET /api/quizzes/results/my — Get current user's quiz results
const getMyQuizResults = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('quiz_results')
            .select('*, quizzes(title, course_id, passing_score)')
            .eq('user_id', req.user.id)
            .order('submitted_at', { ascending: false });

        if (error) {
            console.error("Get Results Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Get Results Error:", error);
        res.status(500).json({ error: 'Server error fetching quiz results' });
    }
};

// GET /api/quizzes/enrolled — Get all quizzes for courses the student is enrolled in
const getMyEnrolledQuizzes = async (req, res) => {
    try {
        // 1. Get the student's enrolled course IDs
        const { data: enrollments, error: enrollError } = await supabase
            .from('enrollments')
            .select('course_id')
            .eq('user_id', req.user.id);

        if (enrollError) {
            console.error('Get Enrolled Quizzes - Enrollment Error:', enrollError);
            return res.status(400).json({ error: enrollError.message });
        }

        if (!enrollments || enrollments.length === 0) {
            return res.status(200).json([]);
        }

        const courseIds = enrollments.map(e => e.course_id);

        // 2. Fetch all quizzes for those courses, including course title
        const { data: quizzes, error: quizError } = await supabase
            .from('quizzes')
            .select('*, courses(title, category)')
            .in('course_id', courseIds)
            .order('created_at', { ascending: false });

        if (quizError) {
            console.error('Get Enrolled Quizzes - Quiz Error:', quizError);
            return res.status(400).json({ error: quizError.message });
        }

        // 3. Fetch the student's quiz results to show attempt status
        const quizIds = quizzes.map(q => q.id);
        let resultsMap = {};

        if (quizIds.length > 0) {
            const { data: results, error: resultsError } = await supabase
                .from('quiz_results')
                .select('quiz_id, score, passed, submitted_at')
                .eq('user_id', req.user.id)
                .in('quiz_id', quizIds)
                .order('submitted_at', { ascending: false });

            if (!resultsError && results) {
                // Keep only the latest attempt per quiz
                results.forEach(r => {
                    if (!resultsMap[r.quiz_id]) {
                        resultsMap[r.quiz_id] = r;
                    }
                });
            }
        }

        // 4. Merge results into quizzes
        const enrichedQuizzes = quizzes.map(q => ({
            ...q,
            last_attempt: resultsMap[q.id] || null
        }));

        res.status(200).json(enrichedQuizzes);
    } catch (error) {
        console.error('Get Enrolled Quizzes Error:', error);
        res.status(500).json({ error: 'Server error fetching enrolled quizzes' });
    }
};

module.exports = { createQuiz, addQuestions, getQuiz, getQuizzesByCourse, submitQuiz, getMyQuizResults, getMyEnrolledQuizzes };
