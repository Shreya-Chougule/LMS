const supabase = require('../config/supabase');
const { supabaseAdmin } = require('../config/supabase');

const isAccountInactive = (value) => value === false || value === 'false' || value === 0 || value === '0' || value === null;

const registerUser = async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Please provide email, password, and name' });
        }

        // 1. Sign up the user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    role: role || 'student',
                    is_active: true,
                },
            },
        });

        if (authError) {
            console.error("Supabase Auth Error:", authError);
            return res.status(400).json({ error: authError.message });
        }

        const userId = authData.user.id;

        // 2. Insert additional user details into a public 'users' table
        // (You will need to create this table in Supabase)
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert([
                { id: userId, email, name, role: role || 'student' }
            ])
            .select();

        if (userError) {
            console.error("Supabase DB Insert Error:", userError);
            return res.status(400).json({ error: userError.message });
        }

        res.status(201).json({
            message: 'User registered successfully!',
            user: userData[0],
            session: authData.session
        });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: 'Server error during registration' });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide email and password' });
        }

        // 1. Authenticate with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            console.error("Supabase Login Error:", authError);
            return res.status(401).json({ error: authError.message });
        }

        const authIsInactive = isAccountInactive(authData.user?.user_metadata?.is_active) || isAccountInactive(authData.user?.app_metadata?.is_active);
        if (authIsInactive) {
            await supabase.auth.signOut();
            return res.status(403).json({ error: 'Your account has been deactivated. Please contact the administrator.' });
        }

        // 2. Fetch user role/details from 'users' table
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (userError || !userData) {
            console.error("Supabase DB Fetch Error:", userError);
            await supabase.auth.signOut();
            return res.status(404).json({ error: 'User not found' });
        } else if (isAccountInactive(userData.is_active)) {
            await supabase.auth.signOut();
            return res.status(403).json({ error: 'Your account has been deactivated. Please contact the administrator.' });
        }

        res.status(200).json({
            message: 'Login successful',
            user: userData,
            session: authData.session // Contains access_token and refresh_token
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

const logoutUser = async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Supabase Logout Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ error: 'Server error during logout' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser
};
