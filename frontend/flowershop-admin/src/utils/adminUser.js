export const adminName = (admin) => admin?.fullName || admin?.FullName || 'Admin';

export const adminEmail = (admin) => admin?.email || admin?.Email || '';

export const adminInitial = (admin) => adminName(admin).trim().charAt(0).toUpperCase() || 'A';
