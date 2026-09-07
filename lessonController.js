const supabase = require('../config/supabase');

// POST /api/lessons — Create a new lesson
const createLesson = async (req, res) => {
    try {
        const {
            course_id,
            module_id,
            title,
            type,         // 'video' | 'text' | 'quiz' | 'assignment'
            description,
            video_url,    // External URL (YouTube, etc.)
            resources,    // JSON array of resource objects: [{ name, path, bucket, type }]
            duration,
            is_preview,
            sort_order
        } = req.body;

        if (!course_id || !title) {
            return res.status(400).json({ error: 'course_id and title are required' });
        }

        // Verify the instructor owns this course
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('id, instructor_id')
            .eq('id', course_id)
            .single();

        if (courseError || !course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        if (course.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only add lessons to your own courses' });
        }

        const { data, error } = await supabase
            .from('lessons')
            .insert([{
                course_id,
                module_id: module_id || null,
                title,
                type: type || 'video',
                description: description || null,
                video_url: video_url || null,
                resources: resources || [],
                duration: duration || null,
                is_preview: is_preview || false,
                sort_order: sort_order || 0
            }])
            .select()
            .single();

        if (error) {
            console.error('Create Lesson Error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({ message: 'Lesson created successfully', lesson: data });
    } catch (error) {
        console.error('Create Lesson Error:', error);
        res.status(500).json({ error: 'Server error creating lesson' });
    }
};

// GET /api/lessons?course_id=... — Get lessons for a course
const getLessons = async (req, res) => {
    try {
        const { course_id, module_id } = req.query;

        if (!course_id) {
            return res.status(400).json({ error: 'course_id query param is required' });
        }

        let query = supabase
            .from('lessons')
            .select('*')
            .eq('course_id', course_id)
            .order('sort_order', { ascending: true });

        if (module_id) {
            query = query.eq('module_id', module_id);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Get Lessons Error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Get Lessons Error:', error);
        res.status(500).json({ error: 'Server error fetching lessons' });
    }
};

// PUT /api/lessons/:id — Update a lesson
const updateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Verify ownership: get the lesson → its course → check instructor_id
        const { data: lesson, error: findError } = await supabase
            .from('lessons')
            .select('id, course_id')
            .eq('id', id)
            .single();

        if (findError || !lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        const { data: course } = await supabase
            .from('courses')
            .select('instructor_id')
            .eq('id', lesson.course_id)
            .single();

        if (!course || course.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only edit your own lessons' });
        }

        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('lessons')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Update Lesson Error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({ message: 'Lesson updated successfully', lesson: data });
    } catch (error) {
        console.error('Update Lesson Error:', error);
        res.status(500).json({ error: 'Server error updating lesson' });
    }
};

// DELETE /api/lessons/:id — Delete a lesson
const deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify ownership
        const { data: lesson, error: findError } = await supabase
            .from('lessons')
            .select('id, course_id')
            .eq('id', id)
            .single();

        if (findError || !lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        const { data: course } = await supabase
            .from('courses')
            .select('instructor_id')
            .eq('id', lesson.course_id)
            .single();

        if (!course || course.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own lessons' });
        }

        const { error } = await supabase
            .from('lessons')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete Lesson Error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({ message: 'Lesson deleted successfully' });
    } catch (error) {
        console.error('Delete Lesson Error:', error);
        res.status(500).json({ error: 'Server error deleting lesson' });
    }
};

module.exports = { createLesson, getLessons, updateLesson, deleteLesson };
