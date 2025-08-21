// src/auth/requireAuth.ts
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import type { JwtUser } from "./user.types.js";

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.header("authorization") || req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtUser;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};
