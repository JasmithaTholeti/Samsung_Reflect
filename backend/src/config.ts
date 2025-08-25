import dotenv from 'dotenv';
dotenv.config();


export const config = {
port: Number(process.env.PORT || 4000),
mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/journal',
corsOrigin: process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || ['http://localhost:3000'],
uploadDir: process.env.UPLOAD_DIR || './uploads',
};