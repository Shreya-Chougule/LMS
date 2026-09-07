const supabase = require('../config/supabase');

// GET /api/courses — List all courses (with optional filters)
const getAllCourses = async (req, res) => {
    try {
        const { category, level, search, featured, limit, instructor_id } = req.query;

        let query = supabase.from('courses').select('*, users(name)');

        if (instructor_id) {
            query = query.eq('instructor_id', instructor_id);
        }
        if (category && category !== 'All') {
            query = query.eq('category', category);
        }
        if (level) {
            query = query.eq('level', level);
        }
        if (search) {
            query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%`);
        }
        if (featured === 'true') {
            query = query.eq('featured', true);
        }
        if (limit) {
            query = query.limit(parseInt(limit));
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error("Get Courses Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Get Courses Error:", error);
        res.status(500).json({ error: 'Server error fetching courses' });
    }
};

// GET /api/courses/:id — Get single course with modules & lessons
const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('courses')
            .select('*, users(name, email), modules(*, lessons(*))')
            .eq('id', id)
            .single();

        if (error) {
            console.error("Get Course Error:", error);
            return res.status(404).json({ error: 'Course not found' });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Get Course Error:", error);
        res.status(500).json({ error: 'Server error fetching course' });
    }
};

// POST /api/courses — Create a new course (instructor only)
const createCourse = async (req, res) => {
    try {
        const { title, description, category, level, price, original_price, duration, thumbnail_url } = req.body;

        if (!title || !category) {
            return res.status(400).json({ error: 'Title and category are required' });
        }

        const { data, error } = await supabase
            .from('courses')
            .insert([{
                title,
                description,
                category,
                level: level || 'Beginner',
                price: price || 0,
                original_price: original_price || 0,
                duration,
                thumbnail_url,
                instructor_id: req.user.id
            }])
            .select()
            .single();

        if (error) {
            console.error("Create Course Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({ message: 'Course created successfully', course: data });
    } catch (error) {
        console.error("Create Course Error:", error);
        res.status(500).json({ error: 'Server error creating course' });
    }
};

// PUT /api/courses/:id — Update a course (instructor who owns it)
const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('courses')
            .update(updates)
            .eq('id', id)
            .eq('instructor_id', req.user.id)
            .select()
            .single();

        if (error) {
            console.error("Update Course Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({ message: 'Course updated successfully', course: data });
    } catch (error) {
        console.error("Update Course Error:", error);
        res.status(500).json({ error: 'Server error updating course' });
    }
};

// DELETE /api/courses/:id — Delete a course (instructor who owns it or admin)
const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        let query = supabase.from('courses').delete().eq('id', id);

        // If not admin, restrict to own courses
        if (req.user.role !== 'admin') {
            query = query.eq('instructor_id', req.user.id);
        }

        const { error } = await query;

        if (error) {
            console.error("Delete Course Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error("Delete Course Error:", error);
        res.status(500).json({ error: 'Server error deleting course' });
    }
};

// GET /api/courses/:id/modules — Get all modules for a course
const getCourseModules = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('modules')
            .select('id, title')
            .eq('course_id', id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Get Modules Error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Get Modules Error:', error);
        res.status(500).json({ error: 'Server error fetching modules' });
    }
};

// POST /api/courses/:id/modules — Create a new module (instructor who owns the course)
const createModule = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, sort_order } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Module title is required' });
        }

        // Verify the instructor owns this course
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('id, instructor_id')
            .eq('id', id)
            .single();

        if (courseError || !course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        if (course.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only add modules to your own courses' });
        }

        const { data, error } = await supabase
            .from('modules')
            .insert([{ course_id: id, title }])
            .select('id, title')
            .single();

        if (error) {
            console.error('Create Module Error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({ message: 'Module created successfully', module: data });
    } catch (error) {
        console.error('Create Module Error:', error);
        res.status(500).json({ error: 'Server error creating module' });
    }
};

module.exports = { getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse, getCourseModules, createModule };
