const db = require('../config/db');

const UserModel = {
    async findByEmail(email) {
        const [rows] = await db.query(
            `
            SELECT 
                id,
                name,
                email,
                password, 
                role
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email]
        );
        return rows[0] || null;
    }
};

module.exports = UserModel;
