const app = require('./index')
const { DBCONNECTION } = require('./src/db')
const { PORT, DB_URL, DB_NAME } = require('./src/config')

// Connect to the database
DBCONNECTION(DB_URL, DB_NAME)
    .then(() => {
        // Start the server after successful DB connection
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to start server:', error);
    });