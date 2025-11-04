const mongoose = require('mongoose');

const DBCONNECTION = async (dbUrl, dbName) => {
    try {
        await mongoose.connect(`${dbUrl}/${dbName}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

module.exports = DBCONNECTION;
