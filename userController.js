const supabase = require('../config/supabase');
const { supabaseAdmin } = require('../config/supabase');

const isAccountInactive = (value) => value === false || value === 'false' || value === 0 || value === '0' || value === null;

// GET /api/users/profile — Get current user's profile
const getProfile = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) {
            console.error("Get Profile Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
};

// PUT /api/users/profile — Update current user's profile
const updateProfile = async (req, res) => {
    try {
        const { name, bio, avatar_url, phone } = req.body;

        const { data, error } = await supabase
            .from('users')
            .update({ name, bio, avatar_url, phone, updated_at: new Date().toISOString() })
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) {
            console.error("Update Profile Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({ message: 'Profile updated', user: data });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ error: 'Server error updating profile' });
    }
};

// GET /api/users/:id — Get a user's public profile
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('users')
            .select('id, name, role, bio, avatar_url, created_at')
            .eq('id', id)
            .single();

        if (error) {
            console.error("Get User Error:", error);
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Get User Error:", error);
        res.status(500).json({ error: 'Server error fetching user' });
    }
};

module.exports = { getProfile, updateProfile, getUserById };
