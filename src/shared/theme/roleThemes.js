export const roleThemes = {
  BASE: {
    bgLayout: '#f8f9fa',
    bgContainer: '#ffffff',
    primaryColor: '#315c88',
    primaryColorHover: '#244567',
    accentColor: '#4f46e5',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
    borderColor: '#e5e7eb',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
  },
  MOTHER: {
    bgLayout: '#fff5f5',
    bgContainer: '#ffffff',
    primaryColor: '#be123c',
    primaryColorHover: '#9f1239',
    accentColor: '#eab308', // Warm Gold
    shadow: '0 8px 30px rgba(225, 29, 72, 0.04)', // Rose shadow
    borderColor: '#ffe4e6',
    textPrimary: '#24191a',
    textSecondary: '#76676a',
  },
  STAFF: {
    bgLayout: '#f1f5f9',
    bgContainer: '#ffffff',
    primaryColor: '#0f766e', // Teal
    primaryColorHover: '#115e59',
    accentColor: '#14b8a6',
    shadow: '0 4px 20px rgba(15, 118, 110, 0.03)',
    borderColor: '#e2e8f0',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
  },
  ADMIN: {
    bgLayout: '#f8fafc',
    bgContainer: '#ffffff',
    primaryColor: '#1e293b',
    primaryColorHover: '#0f172a',
    accentColor: '#4f46e5',
    shadow: '0 4px 20px rgba(30, 41, 59, 0.04)',
    borderColor: '#cbd5e1',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
  },
  SUPER_ADMIN: {
    bgLayout: '#fafafa',
    bgContainer: '#ffffff',
    primaryColor: '#4f46e5', // Indigo
    primaryColorHover: '#4338ca',
    accentColor: '#d946ef',
    shadow: '0 4px 20px rgba(79, 70, 229, 0.05)',
    borderColor: '#e5e7eb',
    textPrimary: '#171717',
    textSecondary: '#737373',
  }
};

export function getRoleTheme(activeRole) {
  if (!activeRole || !roleThemes[activeRole]) {
    return roleThemes.BASE;
  }
  return roleThemes[activeRole];
}
