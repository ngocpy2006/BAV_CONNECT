import type { CookieOptions, RequestHandler } from 'express';
import { ACCESS_COOKIE, ACCESS_SECONDS } from '../constants/auth';
import { currentUser } from '../middlewares/auth';
import { toPublicUser } from '../models/user';
import type { authService } from '../services/auth';
import { ok } from '../utils/http';
import { loginBody, registerBody } from '../validators/auth';

export function authController(auth: ReturnType<typeof authService>, secure: boolean) {
  const cookie: CookieOptions = { httpOnly: true, secure, sameSite: 'lax', path: '/' };

  const register: RequestHandler = async (req, res) => {
    ok(res, await auth.register(registerBody.parse(req.body)), 201);
  };
  const login: RequestHandler = async (req, res) => {
    const { user, token } = await auth.login(loginBody.parse(req.body));
    res.cookie(ACCESS_COOKIE, token, { ...cookie, maxAge: ACCESS_SECONDS * 1000 });
    ok(res, user);
  };
  const logout: RequestHandler = async (req, res) => {
    const user = currentUser(req);
    await auth.logout(user.id, user.sessionVersion);
    res.clearCookie(ACCESS_COOKIE, cookie);
    ok(res, null);
  };
  const profile: RequestHandler = (req, res) => {
    ok(res, toPublicUser(currentUser(req)));
  };

  return { register, login, logout, profile };
}
