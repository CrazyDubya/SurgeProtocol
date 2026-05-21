
// Use minimal example without module imports if complex
import { findPath, getDistance, Point } from '../src/game/mechanics/grid';

console.log('Running Pathfinding Debug...');

const start: Point = { x: 0, y: 0 };
const end: Point = { x: 2, y: 2 };
const noBlocks = () => false;

console.log(`Test 1: Direct Path ${JSON.stringify(start)} -> ${JSON.stringify(end)}`);
try {
    const path = findPath(start, end, noBlocks);
    console.log('Path result:', path);
} catch (e) {
    console.error('Error in findPath:', e);
}

const obstacleStart: Point = { x: 0, y: 0 };
const obstacleEnd: Point = { x: 2, y: 2 };
const isBlocked = (p: Point) => (p.x === 0 && p.y === 1) || (p.x === 1 && p.y === 1);

console.log(`Test 2: Obstacle Path`);
try {
    const path2 = findPath(obstacleStart, obstacleEnd, isBlocked);
    console.log('Path result 2:', path2);
} catch (e) {
    console.error('Error in findPath 2:', e);
}
