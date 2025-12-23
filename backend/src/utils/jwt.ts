import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

interface TokenPayload {
  userId: number;
  username: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

export const generateToken = (userId: number, username: string, isAdmin: boolean): string => {
  return jwt.sign(
    {
      userId,
      username,
      isAdmin,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

export const generateServiceToken = (): string => {
  // For inter-service communication with Java microservice
  return jwt.sign(
    {
      service: 'query-runner-node',
      type: 'internal',
    },
    process.env.JAVA_SERVICE_JWT_SECRET || JWT_SECRET,
    { expiresIn: '1h' }
  );
};
