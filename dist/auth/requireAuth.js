import jwt from "jsonwebtoken";
import { config } from "../config.js";
export const requireAuth = (req, res, next) => {
    const header = req.header("authorization") || req.header("Authorization");
    if (!header || !header.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing bearer token" });
        return;
    }
    const token = header.slice("Bearer ".length).trim();
    try {
        const payload = jwt.verify(token, config.jwtSecret);
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ error: "Invalid token" });
    }
};
