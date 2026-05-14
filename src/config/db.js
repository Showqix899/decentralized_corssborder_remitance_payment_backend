import mongoose from 'mongoose';

//connect mongodb
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MONGODB CONNECTED');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

export default connectDB;
