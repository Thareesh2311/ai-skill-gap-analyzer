const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            process.env.MONGODB_URI,
            {
                serverSelectionTimeoutMS: 1000000
            }
        );

        console.log("MongoDB Connected Successfully ");
        console.log(`MongoDB Host: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);

        return conn;

    } catch (error) {
        console.error("\nMongoDB Connection Failed ");
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);

        throw error;
    }
};

module.exports = connectDB;