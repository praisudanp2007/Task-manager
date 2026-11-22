import jwt from 'jsonwebtoken';

export function requireAuth(request, response, next) {
  const header = request.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return response.status(401).json({ error: 'Please sign in to continue.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    request.userId = payload.userId;
    return next();
  } catch {
    return response.status(401).json({ error: 'Your session expired. Please sign in again.' });
  }
}
