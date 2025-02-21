
export type Role = 'Läkare' | 'Undersköterska' | 'Sjuksköterska';

export const ROLES: Role[] = ['Läkare', 'Undersköterska', 'Sjuksköterska'];

export const ROLE_COLORS: Record<Role, { bg: string; border: string; text: string }> = {
  'Läkare': { 
    bg: 'bg-[#9b87f5]/10', 
    border: 'border-[#9b87f5]',
    text: 'text-[#6E59A5]'
  },
  'Undersköterska': { 
    bg: 'bg-[#F2FCE2]/50', 
    border: 'border-[#7E69AB]',
    text: 'text-[#7E69AB]'
  },
  'Sjuksköterska': { 
    bg: 'bg-[#FEC6A1]/10', 
    border: 'border-[#FEC6A1]',
    text: 'text-[#D4956A]'
  }
};
