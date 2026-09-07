const supabase = require('../config/supabase');
const { supabaseAdmin } = require('../config/supabase');

const isAccountInactive = (value) => value === false || value === 'false' || value === 0 || value === '0' || value === null;

const requireAuth = async (req, res, next) => {
    try {
        // 1. Get the token from the header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided, authorization denied' });
        }

        const token = authHeader.split(' ')[1];

        // 2. Verify the token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // 3. Attach the user object to the request
        req.user = user;

        // 4. Fetch role info from 'users' table
        const { data: profile } = await supabaseAdmin.from('users').select('role, name, is_active').eq('id', user.id).single();
        if (profile) {
            if (isAccountInactive(profile.is_active)) {
                return res.status(403).json({ error: 'Your account has been deactivated. Please contact the administrator.' });
            }
            req.user.role = profile.role;
            req.user.name = profile.name;
        }

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ error: 'Server Error during authentication check' });
    }
};

// Role-based access control middleware
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ error: 'Access denied. No role assigned.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
        }
        next();
    };
};

module.exports = { requireAuth, requireRole };
