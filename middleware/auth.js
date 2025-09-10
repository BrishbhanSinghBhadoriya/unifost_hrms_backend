// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../model/userSchema.js';

export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Access token required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'User not found'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                status: 'error',
                message: 'Account is deactivated'
            });
        }

        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ status: 'error', message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ status: 'error', message: 'Token expired' });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({ status: 'error', message: 'Authentication error' });
    }
};


// Role-based middleware
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: You do not have access to this resource'
            });
        }
        next();
    };
};
