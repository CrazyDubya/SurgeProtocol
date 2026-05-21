import { findPath, getDistance, Point } from '../src/game/mechanics/grid.js';

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

console.log("Running Pathfinding Tests...");

// Test 1: Direct path
const start1 = { x: 0, y: 0 };
const end1 = { x: 2, y: 2 };
const path1 = findPath(start1, end1, () => false);
assert(path1 !== null, "Path 1 should not be null");
assert(path1.length === 3, "Path 1 length should be 3");
console.log("Test 1 Passed");

// Test 2: Blocked end
const isBlocked2 = (p) => p.x === 2 && p.y === 2;
const path2 = findPath(start1, end1, isBlocked2);
assert(path2 === null, "Path 2 should be null");
console.log("Test 2 Passed");

// Test 3: Obstacle
const isBlocked3 = (p) => (p.x === 0 && p.y === 1) || (p.x === 1 && p.y === 1);
const path3 = findPath(start1, end1, isBlocked3);
assert(path3 !== null, "Path 3 should not be null");
assert(path3.length > 3, "Path 3 should be longer than 3");
console.log("Test 3 Passed");

console.log("All Pathfinding Tests Passed Successfully!");
