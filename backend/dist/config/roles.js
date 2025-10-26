import { Role } from '../generated/prisma/index.js';
const allRoles = {
    [Role.USER]: ['getTransactions'],
    [Role.ADMIN]: ['getUsers', 'manageUsers', 'getTransactions', 'manageTransactions']
};
export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
