import jwt from 'jsonwebtoken';
/**
 * Express middleware that validates Bearer JWT and attaches it to req.user
 */
export const requireAuth = (req, res, next) => {
    try {
        const auth = req.headers.authorization || '';
        if (!auth.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid Authorization header' });
        }
        const token = auth.slice('Bearer '.length).trim();
        const secret = process.env.JWT_SECRET || 'dev-secret';
        const payload = jwt.verify(token, secret);
        // attach strongly-typed user
        req.user = payload;
        return next();
    }
    catch (e) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
