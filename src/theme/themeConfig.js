export const brand = {
  maroon: '#68111B',
  maroonDark: '#3F0A11',
  saffron: '#F59E0B',
  amber: '#FBBF24',
  sun: '#FFD600',
  cream: '#FFFBE8',
  paper: '#FFFFFF',
  ink: '#24191A',
  muted: '#76676A',
  line: '#EADFD8',
  success: '#287A55',
  info: '#315C88',

  // Semantic Design Tokens
  primary: '#68111B',      // Warm Devotional Maroon
  primaryDark: '#3F0A11',  // Dark Maroon
  accent: '#F59E0B',       // Saffron
  accentWarm: '#FBBF24',   // Amber
  canvas: '#F8F5EF',       // Canvas
  surface: '#FFFFFF',      // Paper
  ink: '#24191A',         // Ink
  muted: '#76676A',        // Muted
  border: '#EADFD8',       // Line
  successGreen: '#287A55', // Success
  infoBlue: '#315C88',     // Info
};

export const divineTheme = {
  token: {
    colorPrimary: brand.primary,
    colorInfo: brand.infoBlue,
    colorSuccess: brand.successGreen,
    colorWarning: brand.accent,
    colorError: '#B42318',
    colorText: brand.ink,
    colorTextSecondary: brand.muted,
    colorBorder: brand.border,
    colorBgLayout: brand.canvas,
    colorBgContainer: brand.surface,
    borderRadius: 12,
    borderRadiusLG: 18,
    controlHeight: 42,
    fontFamily: "Inter, 'Noto Sans Devanagari', system-ui, sans-serif",
    boxShadowSecondary: '0 10px 30px rgba(63, 10, 17, 0.08)',
  },
  components: {
    Button: {
      borderRadius: 10,
      fontWeight: 700,
      primaryShadow: '0 6px 16px rgba(104, 17, 27, 0.18)',
    },
    Card: {
      borderRadiusLG: 18,
      paddingLG: 22,
    },
    Menu: {
      itemBorderRadius: 10,
      itemHeight: 44,
      itemMarginBlock: 4,
      itemSelectedBg: '#FFF1D6',
      itemSelectedColor: brand.primary,
      itemHoverBg: '#FFF8E8',
    },
    Input: { activeBorderColor: brand.accent, hoverBorderColor: brand.accent },
    Select: { activeBorderColor: brand.accent, hoverBorderColor: brand.accent },
    DatePicker: { activeBorderColor: brand.accent, hoverBorderColor: brand.accent },
    Tabs: { itemSelectedColor: brand.primary, inkBarColor: brand.accent },
    Table: { headerBg: '#FBF7F0', headerColor: brand.primaryDark },
  },
};

