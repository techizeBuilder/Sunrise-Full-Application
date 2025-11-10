import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';
    
    await mongoose.connect(mongoURI);

    console.log('MongoDB connected successfully to:', mongoURI.split('@')[1]?.split('/')[0] || 'database');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

export default connectDB;
