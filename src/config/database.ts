import mongoose from 'mongoose';

export const connectDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI!;
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error);
    process.exit(1);
  }
};
