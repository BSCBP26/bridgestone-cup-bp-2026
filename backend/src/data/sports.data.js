export const sports = Object.freeze([
  { id: "sport-badminton", slug: "badminton", name: "Badminton", participantType: "pair", participantLimit: 64, views: ["bracket", "schedule"] },
  { id: "sport-futsal", slug: "futsal", name: "Futsal", participantType: "team", participantLimit: 64, views: ["standings", "bracket", "schedule", "winner"] },
  { id: "sport-chess", slug: "chess", name: "Chess", participantType: "player", participantLimit: 64, views: ["standings", "bracket", "winner"] },
  { id: "sport-table-tennis", slug: "table-tennis", name: "Table Tennis", participantType: "player", participantLimit: 64, views: ["bracket", "standings", "winner"] },
  { id: "sport-football", slug: "football", name: "Football", participantType: "team", participantLimit: 64, views: ["bracket", "schedule"] },
  { id: "sport-fishing", slug: "fishing", name: "Fishing", participantType: "angler", participantLimit: 24, views: ["bracket", "winner"] },
]);
