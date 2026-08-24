export const futsalGroups=[
 {name:'GROUP 1',teams:[['BIAS BUILDING','6 PTS'],['CURING','3 PTS']]},
 {name:'GROUP 2',teams:[['BE MANTAP','6 PTS'],['EXTRUDING–BEAD','3 PTS']]},
 {name:'GROUP 3',teams:[['CALENDER','6 PTS'],['ALL ENGINEERING','3 PTS']]},
 {name:'GROUP 4',teams:[['BANBURY','6 PTS'],['PSS BUILDING','3 PTS']]}
];
export const futsalSchedule=[]; const futsalScheduleDesignSample=[
 {time:'18:00',home:'FINAL INSP',away:'BANBURY',round:'QF'},{time:'18:45',home:'OFFICE',away:'EXT–BEAD',round:'QF'},
 {time:'18:00',home:'BANBURY',away:'EXT–BEAD',round:'SF'},{time:'18:45',home:'TIRE CURING',away:'BIAS BUILDING',round:'SF'}
];
export const futsalEntries=Array.from({length:16},(_,i)=>({seed:[1,16,8,9,5,12,4,13,6,11,3,14,7,10,2,15][i],name:`TEAM ${String(i+1).padStart(2,'0')}`,score:i%2?'2–1':'2–0'}));
export const futsalScorers=[['ANDRE H','8'],['RIDWAN MAULANA','7'],['IZZUL HAQ','4']];
