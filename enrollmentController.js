const supabase = require('../config/supabase');

// POST /api/enrollments — Enroll in a course
const enrollInCourse = async (req, res) => {
    try {
        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({ error: 'Course ID is required' });
        }

        // Check if already enrolled
        const { data: existing } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', req.user.id)
            .eq('course_id', course_id)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Already enrolled in this course' });
        }

        const { data, error } = await supabase
            .from('enrollments')
            .insert([{ user_id: req.user.id, course_id }])
            .select()
            .single();

        if (error) {
            console.error("Enroll Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({ message: 'Enrolled successfully', enrollment: data });
    } catch (error) {
        console.error("Enroll Error:", error);
        res.status(500).json({ error: 'Server error during enrollment' });
    }
};

// GET /api/enrollments/my — Get current user's enrolled courses
const getMyEnrollments = async (req, res) => {
    try {
        const { data: enrollments, error } = await supabase
            .from('enrollments')
            .select('*, courses(*)')
            .eq('user_id', req.user.id)
            .order('enrolled_at', { ascending: false });

        if (error) {
            console.error("Get Enrollments Error:", error);
            return res.status(400).json({ error: error.message });
        }

        // Calculate dynamic progress for each course
        const enrichedEnrollments = await Promise.all(enrollments.map(async (enrollment) => {
            const courseId = enrollment.course_id;

            // Get total lessons for this course
            const { count: totalLessons, error: lessonsError } = await supabase
                .from('lessons')
                .select('*', { count: 'exact', head: true })
                .eq('course_id', courseId);

            // Get completed lessons for this course by this user
            const { count: completedLessons, error: progressError } = await supabase
                .from('progress')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', req.user.id)
                .eq('course_id', courseId)
                .eq('completed', true);

            let progressPct = 0;
            if (!lessonsError && !progressError && totalLessons > 0) {
                progressPct = Math.round((completedLessons / totalLessons) * 100);
            }

            // Cap at 100 in case a teacher deleted a lesson the student had already completed
            if (progressPct > 100) progressPct = 100;

            return {
                ...enrollment,
                progress: progressPct,
                total_lessons: totalLessons || 0,
                completed_lessons: completedLessons || 0
            };
        }));

        res.status(200).json(enrichedEnrollments);
    } catch (error) {
        console.error("Get Enrollments Error:", error);
        res.status(500).json({ error: 'Server error fetching enrollments' });
    }
};

// POST /api/enrollments/progress — Mark a lesson as completed
const updateProgress = async (req, res) => {
    try {
        const { lesson_id, course_id, completed } = req.body;

        const { data, error } = await supabase
            .from('progress')
            .upsert([{
                user_id: req.user.id,
                lesson_id,
                course_id,
                completed: completed !== false,
                completed_at: completed !== false ? new Date().toISOString() : null
            }], { onConflict: 'user_id,lesson_id' })
            .select()
            .single();

        if (error) {
            console.error("Update Progress Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({ message: 'Progress updated', progress: data });
    } catch (error) {
        console.error("Update Progress Error:", error);
        res.status(500).json({ error: 'Server error updating progress' });
    }
};

// GET /api/enrollments/progress/:courseId — Get progress for a specific course
const getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;

        const { data, error } = await supabase
            .from('progress')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('course_id', courseId);

        if (error) {
            console.error("Get Progress Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Get Progress Error:", error);
        res.status(500).json({ error: 'Server error fetching progress' });
    }
};

// GET /api/enrollments/instructor — Get recent enrollments across instructor's courses
const getInstructorEnrollments = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        // Get all course IDs belonging to this instructor
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('id')
            .eq('instructor_id', req.user.id);

        if (coursesError) {
            return res.status(400).json({ error: coursesError.message });
        }

        if (!courses.length) {
            return res.status(200).json([]);
        }

        const courseIds = courses.map(c => c.id);

        const { data, error } = await supabase
            .from('enrollments')
            .select('enrolled_at, users(name), courses(title)')
            .in('course_id', courseIds)
            .order('enrolled_at', { ascending: false })
            .limit(parseInt(limit));

        if (error) {
            console.error('Get Instructor Enrollments Error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Get Instructor Enrollments Error:', error);
        res.status(500).json({ error: 'Server error fetching enrollments' });
    }
};

// GET /api/enrollments/instructor/analytics — enrollment counts per month + student list
const getInstructorAnalytics = async (req, res) => {
    try {
        // Get all course IDs for this instructor
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('id')
            .eq('instructor_id', req.user.id);

        if (coursesError) return res.status(400).json({ error: coursesError.message });
        if (!courses.length) return res.status(200).json({ monthly: [], students: [] });

        const courseIds = courses.map(c => c.id);

        // All enrollments for these courses
        const { data: enrollments, error: enrollError } = await supabase
            .from('enrollments')
            .select('enrolled_at, user_id, course_id, users(name), courses(title)')
            .in('course_id', courseIds)
            .order('enrolled_at', { ascending: true });

        if (enrollError) return res.status(400).json({ error: enrollError.message });

        // Build last 6 months buckets
        const now = new Date();
        const monthly = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthly.push({
                label: d.toLocaleString('default', { month: 'short' }),
                year: d.getFullYear(),
                month: d.getMonth(),
                count: 0
            });
        }

        enrollments.forEach(e => {
            const d = new Date(e.enrolled_at);
            const bucket = monthly.find(b => b.year === d.getFullYear() && b.month === d.getMonth());
            if (bucket) bucket.count++;
        });

        // Build unique student list with course count
        const studentMap = {};
        enrollments.forEach(e => {
            if (!e.users) return;
            if (!studentMap[e.user_id]) {
                studentMap[e.user_id] = { name: e.users.name, courses: new Set() };
            }
            studentMap[e.user_id].courses.add(e.course_id);
        });

        const students = Object.values(studentMap)
            .map(s => ({ name: s.name, courseCount: s.courses.size }))
            .sort((a, b) => b.courseCount - a.courseCount)
            .slice(0, 5);

        res.status(200).json({
            monthly: monthly.map(b => ({ label: b.label, count: b.count })),
            students
        });
    } catch (error) {
        console.error('Get Instructor Analytics Error:', error);
        res.status(500).json({ error: 'Server error fetching analytics' });
    }
};

module.exports = { enrollInCourse, getMyEnrollments, updateProgress, getCourseProgress, getInstructorEnrollments, getInstructorAnalytics };
