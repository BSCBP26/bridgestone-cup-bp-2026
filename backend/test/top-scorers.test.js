import assert from"node:assert/strict";import test from"node:test";import{validateTopScorers}from"../src/modules/brackets/brackets.service.js";
test("manual top scorers sort by goals and keep admin supplied team",()=>{const rows=validateTopScorers([{name:"Budi",team:"Group B",goals:3},{name:"Andi",team:"Group A",goals:7}]);assert.deepEqual(rows,[{name:"Andi",team:"Group A",goals:7},{name:"Budi",team:"Group B",goals:3}])});
test("manual top scorers reject invalid goal totals",()=>assert.throws(()=>validateTopScorers([{name:"Budi",team:"Group B",goals:-1}]),/non-negative integer/));
