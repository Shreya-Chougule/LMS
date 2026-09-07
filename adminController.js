const supabase = require('../config/supabase');
const { supabaseAdmin } = require('../config/supabase');

const isAccountInactive = (value) => value === false || value === 'false' || value === 0 || value === '0' || value === null;

// GET /api/admin/stats — Platform-wide statistics
const getPlatformStats = async (req, res) => {
    try {
        // Total users by role
        const { data: users, error: usersError } = await supabaseAdmin
            .from('users')
            .select('role');

        if (usersError) {
            return res.status(400).json({ error: usersError.message });
        }

        const totalStudents = users.filter(u => u.role === 'student').length;
        const totalInstructors = users.filter(u => u.role === 'instructor').length;
        const totalAdmins = users.filter(u => u.role === 'admin').length;

        // Total courses
        const { count: totalCourses } = await supabaseAdmin
            .from('courses')
            .select('id', { count: 'exact', head: true });

        // Total enrollments
        const { count: totalEnrollments } = await supabaseAdmin
            .from('enrollments')
            .select('id', { count: 'exact', head: true });

        res.status(200).json({
            totalUsers: users.length,
            totalStudents,
            totalInstructors,
            totalAdmins,
            totalCourses: totalCourses || 0,
            totalEnrollments: totalEnrollments || 0
        });
    } catch (error) {
        console.error("Get Stats Error:", error);
        res.status(500).json({ error: 'Server error fetching platform stats' });
    }
};

// GET /api/admin/users — List all users (with pagination)
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, role, search } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabaseAdmin.from('users').select('*', { count: 'exact' });

        if (role) {
            query = query.eq('role', role);
        }
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        query = query.order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        const { data, count, error } = await query;

        if (error) {
            console.error("Get Users Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({
            users: data,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit))
        });
    } catch (error) {
        console.error("Get Users Error:", error);
        res.status(500).json({ error: 'Server error fetching users' });
    }
};

// PUT /api/admin/users/:id — Update a user's role or status
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, is_active } = req.body;

        const updates = {};
        if (role) updates.role = role;
        if (is_active !== undefined) updates.is_active = is_active;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabaseAdmin
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error("Update User Error:", error);
            return res.status(400).json({ error: error.message });
        }

        const authMetadata = { is_active: !isAccountInactive(is_active) };
        if (role) authMetadata.role = role;

        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
            user_metadata: authMetadata,
        });

        if (authUpdateError) {
            console.error("Update Auth Metadata Error:", authUpdateError);
            return res.status(400).json({ error: authUpdateError.message });
        }

        res.status(200).json({ message: 'User updated', user: data });
    } catch (error) {
        console.error("Update User Error:", error);
        res.status(500).json({ error: 'Server error updating user' });
    }
};

// DELETE /api/admin/users/:id — Delete a user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Delete User Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({ message: 'User deleted' });
    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({ error: 'Server error deleting user' });
    }
};

// GET /api/admin/enrollments — List all enrollments
const getAllEnrollments = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { data, count, error } = await supabaseAdmin
            .from('enrollments')
            .select('*, users(name, email), courses(title)', { count: 'exact' })
            .order('enrolled_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (error) {
            console.error("Get Enrollments Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({
            enrollments: data,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit))
        });
    } catch (error) {
        console.error("Get Enrollments Error:", error);
        res.status(500).json({ error: 'Server error fetching enrollments' });
    }
};

// GET /api/admin/courses — List all courses (admin view)
const getAllCoursesAdmin = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('courses')
            .select('*, users(name)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Get Courses Admin Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Get Courses Admin Error:", error);
        res.status(500).json({ error: 'Server error fetching courses' });
    }
};

module.exports = { getPlatformStats, getAllUsers, updateUser, deleteUser, getAllEnrollments, getAllCoursesAdmin };
