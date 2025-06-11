const nodemailer = require('nodemailer');
require('dotenv').config();

const ClientIp = process.env.CLIENT_ORIGIN;
const serverIp = process.env.SERVER_ORIGIN;

const sendEmail = async (connection, options) => {
    try {
        // First ensure we're using the correct database
        await connection.query('USE expertise_station');

        // Get template type
        const [templateType] = await connection.query(
            "SELECT template_types.id FROM template_types WHERE template_types.name = ?",
            [options.templateType]
        );

        if (!templateType[0]) return; // If template type not found

        // Fetch the template based on template type
        const [template] = await connection.query(
            'SELECT * FROM email_templates WHERE template_type = ?',
            templateType[0].id
        );

        if (!template[0]) return; // If template not found

        // Variables to hold the data that will be replaced in the template
        let sendingToEmail, data, subject, resetPasswordLink;

        switch (options.templateType) {
            case 'Add User': {
                // Query to fetch user details after admin adds a user
                const userQuery = `
                    SELECT users.*, 
                           user_status.name AS userStatus, 
                           user_role.name AS userRole,
                           airport.name AS airportName
                    FROM users
                    LEFT JOIN user_status ON users.status_id = user_status.id
                    LEFT JOIN user_role ON users.role_id = user_role.id
                    LEFT JOIN airport ON users.airport_id = airport.id
                    WHERE users.id = ?
                `;
                const [userData] = await connection.query(userQuery, options.userId);
                const user = userData[0];

                // Generate reset password link for new user
                resetPasswordLink = `${ClientIp}/auth/reset-password/${user.reset_token}`;
                sendingToEmail = user.email;

                // Update subject and body based on template type
                subject = template[0].subject.replace('{{NAME}}', user.name || '');
                data = { ...user, resetPasswordLink, activateAccountLink: `${ClientIp}/auth/login`, setPasswordLink: resetPasswordLink };
                break;
            }

            case 'Forgot Password': {
                // Query to fetch user details for forgot password
                const userQuery = `
                    SELECT users.*, 
                           user_status.name AS userStatus, 
                           user_role.name AS userRole,
                           airport.name AS airportName
                    FROM users
                    LEFT JOIN user_status ON users.status_id = user_status.id
                    LEFT JOIN user_role ON users.role_id = user_role.id
                    LEFT JOIN airport ON users.airport_id = airport.id
                    WHERE users.id = ?
                `;
                const [userData] = await connection.query(userQuery, options.userId);
                const user = userData[0];

                // Generate reset password link for forgot password
                resetPasswordLink = `${ClientIp}/auth/reset-password/${user.reset_token}`;
                sendingToEmail = user.email;

                // Update subject and body based on template type
                subject = template[0].subject.replace('{{NAME}}', user.name || '');
                data = { ...user, resetPasswordLink };
                break;
            }

            case 'User Role Update': {
                // Query to fetch user details when role is updated
                const userQuery = `
                    SELECT users.*, 
                           user_status.name AS userStatus, 
                           user_role.name AS userRole,
                           airport.name AS airportName
                    FROM users
                    LEFT JOIN user_status ON users.status_id = user_status.id
                    LEFT JOIN user_role ON users.role_id = user_role.id
                    LEFT JOIN airport ON users.airport_id = airport.id
                    WHERE users.id = ?
                `;
                const [userData] = await connection.query(userQuery, options.userId);
                const user = userData[0];

                // Sending email to the user about role update
                sendingToEmail = user.email;

                // Update subject and body based on template type
                subject = template[0].subject.replace('{{NAME}}', user.name || '');
                data = { ...user, updatedRole: user.userRole };
                break;
            }

            default:
                return;
        }

        // Build email body with placeholders replaced
        let body = template[0].body;
        const allData = { ...data, backendIp: serverIp };

        // Replace EJS placeholders like <%= name %> in the body with actual data
        for (const [key, value] of Object.entries(allData)) {
            const regex = new RegExp(`<%=\\s*${key}\\s*%>`, 'g');
            body = body.replace(regex, value || '');
        }

        // SMTP transporter setup (no OAuth2, using simple SMTP auth)
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: sendingToEmail,
            subject: subject,
            html: body,
        };

        console.log("Email Configuration:", {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            user: process.env.SMTP_USER,
            from: process.env.EMAIL_FROM,
            to: sendingToEmail,
            subject: subject,
            resetPasswordLink: resetPasswordLink
        });

        // Send the email and return the result
        try {
            const result = await transporter.sendMail(mailOptions);
            console.log("Email sent successfully:", result);
            return result;
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }

    } catch (error) {
        console.error("Error in sending email:", error);
        return error;
    }
}

module.exports = { sendEmail };
