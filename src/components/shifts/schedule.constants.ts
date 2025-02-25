
import { Role } from "@/types/shift";

export const ROLES: Role[] = ['Läkare', 'Sjuksköterska', 'Undersköterska'];

export const ROLE_COLORS: Record<Role, { text: string; bg: string; border: string }> = {
  'Läkare': {
    text: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  'Sjuksköterska': {
    text: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200'
  },
  'Undersköterska': {
    text: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200'
  }
};
