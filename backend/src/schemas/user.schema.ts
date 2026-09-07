import { z } from 'zod';

const { ROLES } = require('../config/roles');

export const updateRoleSchema = z.object({
  role: z.enum(Object.values(ROLES) as [string, ...string[]]),
});
