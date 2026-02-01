// List of super admin emails
// These users have full access to manage admins, edit any profile, and manage all events
const SUPER_ADMIN_EMAILS = [
    'sunkavalli.veerendra1973@gmail.com',
    'superadmin2@klu.ac.in',
    'superadmin3@klu.ac.in'
];

// Helper function to check if an email is a super admin
const isSuperAdmin = (email) => {
    return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
};

module.exports = {
    SUPER_ADMIN_EMAILS,
    isSuperAdmin
};
