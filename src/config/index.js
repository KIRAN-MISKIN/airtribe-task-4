if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Vehicle types: motorcycle, small, medium, heavy
const vehicleTypes = ['motorcycle', 'small', 'medium', 'heavy'];

module.exports = {
    PORT: process.env.PORT || 8000,
    DB_URL: process.env.DB_URL,
    DB_NAME: process.env.DB_NAME,
    vehicleTypes
};