// Mapa estatico de estilos de badge por color de categoria
export const BADGE_STYLES: Record<string, string> = {
  rojo:        'bg-[#FFE0E2] text-[#C1121F] border-[#FFA8AE]',
  sol:         'bg-[#FFF3C4] text-[#B47900] border-[#FFE07D]',
  cielo:       'bg-[#E0F2FE] text-[#023E8A] border-[#BAE6FD]',
  verde:       'bg-[#D8F3DC] text-[#1B4332] border-[#B7E4C7]',
  tierra:      'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
  gray:        'bg-[#EAE8E1] text-[#4A4E69] border-[#D5D3C8]',
  patrimonio:  'bg-[#EDE9FE] text-[#5B21B6] border-[#C4B5FD]',
};

export const getBadgeStyle = (colorClass: string): string =>
  BADGE_STYLES[colorClass] || BADGE_STYLES.gray;
