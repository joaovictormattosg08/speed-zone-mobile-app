export const palette = {
  speedGreen: '#00C853',
  racingGreen: '#00A844',
  deepGreen: '#006B2D',
  darkGreen: '#063B22',
  carbonBlack: '#0B0F0D',
  graphite: '#171C19',
  steelGray: '#5F6963',
  lightGray: '#DDE3DF',
  offWhite: '#F5F7F6',
  pureWhite: '#FFFFFF',
};

export const darkColors = {
  background: palette.carbonBlack, panel: palette.graphite,
  input: '#1E2621', elevated: '#28332C',
  deepest: palette.carbonBlack, text: palette.pureWhite,
  muted: '#ABB8AF', subtle: '#99A79E',
  primary: palette.speedGreen, action: palette.racingGreen,
  onPrimary: palette.carbonBlack, border: '#39463D',
  surfaceBorder: '#29362E', secondaryAction: palette.darkGreen,
  premium: palette.darkGreen, strong: palette.deepGreen,
  light: palette.offWhite, error: '#ffb4ab',
  primarySoft: '#123B25', dangerSoft: '#351E23', warning: '#FFB95F', warningSoft: '#3B3119',
  hero: palette.speedGreen, onHero: palette.carbonBlack,
};
export type ThemeColors = { [K in keyof typeof darkColors]: string };
export const lightColors: ThemeColors = {
  background: palette.offWhite, panel: palette.pureWhite,
  input: '#F0F3F1', elevated: '#E8EEEA', deepest: '#EDF1EE',
  text: palette.carbonBlack, muted: palette.steelGray, subtle: '#65736A',
  primary: palette.deepGreen, action: palette.deepGreen, onPrimary: palette.pureWhite,
  border: palette.lightGray, surfaceBorder: '#E7ECE8', secondaryAction: '#E5F5EB',
  premium: '#E5F5EB', strong: palette.deepGreen, light: palette.offWhite, error: '#B42336',
  primarySoft: '#E5F5EB', dangerSoft: '#FFF0F1', warning: '#8C5100', warningSoft: '#FFF4DC',
  hero: palette.speedGreen, onHero: palette.carbonBlack,
};
export const fonts = { regular: 'Inter_400Regular', medium: 'Inter_600SemiBold', bold: 'Inter_700Bold', heavy: 'Inter_800ExtraBold' };
