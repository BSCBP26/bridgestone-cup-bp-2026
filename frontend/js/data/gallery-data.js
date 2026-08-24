export const gallerySports = [
  { id: 'badminton', name: 'BADMINTON', code: 'B', accent: '#d6a52f' },
  { id: 'futsal', name: 'FUTSAL', code: 'F', accent: '#c68d1c' },
  { id: 'chess', name: 'CHESS', code: 'C', accent: '#e0bd69' },
  { id: 'table-tennis', name: 'TABLE TENNIS', code: 'TT', accent: '#d99b25' },
  { id: 'football', name: 'FOOTBALL', code: 'FB', accent: '#b77b16' },
  { id: 'fishing', name: 'FISHING', code: 'FI', accent: '#e1b646' }
];

export const galleryMoments = Object.fromEntries(gallerySports.map(sport => [
  sport.id,
  Array.from({ length: 20 }, (_, index) => ({
    number: String(index + 1).padStart(2, '0'),
    title: `${sport.name} TOURNAMENT MOMENT`,
    sport: sport.name
  }))
]));
