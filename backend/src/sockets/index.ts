import type { IncomingMessage, Server as HttpServer } from 'node:http';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import { ACCESS_COOKIE } from '../constants/auth';
import type { authService } from '../services/auth';

interface ClientEvents {
  'session:check': (reply: (result: { authenticated: boolean }) => void) => void;
}

export function attachSockets(
  http: HttpServer,
  origin: string,
  auth: ReturnType<typeof authService>,
) {
  const io = new Server<ClientEvents>(http, {
    cors: { origin, credentials: true },
    allowRequest: (req, done) => {
      const valid = req.headers.origin === undefined || req.headers.origin === origin;
      done(null, valid);
    },
    maxHttpBufferSize: 16_384,
  });
  io.engine.use(cookieParser());
  function sessionToken(request: IncomingMessage & { cookies?: Record<string, unknown> }) {
    const value = request.cookies?.[ACCESS_COOKIE];
    return typeof value === 'string' ? value : undefined;
  }
  io.use(async (socket, next) => {
    try {
      await auth.authenticate(sessionToken(socket.request));
      next();
    } catch {
      next(new Error('Authentication required'));
    }
  });
  io.on('connection', (socket) => {
    socket.on('session:check', async (reply) => {
      try {
        await auth.authenticate(sessionToken(socket.request));
        if (typeof reply === 'function') reply({ authenticated: true });
      } catch {
        if (typeof reply === 'function') reply({ authenticated: false });
        socket.disconnect(true);
      }
    });
  });
  return io;
}
