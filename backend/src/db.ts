import mongoose from 'mongoose';
import { config } from './config.js';


export async function connectDB() {
await mongoose.connect(config.mongoUri);
mongoose.connection.on('connected', () => console.log('🟢 Mongo connected'));
mongoose.connection.on('error', (e) => console.error('🔴 Mongo error', e));
}