/**
 * Surge Protocol - Grid & Pathfinding Utilities
 * 
 * Implements A* pathfinding and grid navigation for combat.
 */

export interface Point {
    x: number;
    y: number;
}

/**
 * Calculates the Chebyshev distance between two points.
 * In a grid with diagonal movement, this is the number of steps.
 */
export function getDistance(a: Point, b: Point): number {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/**
 * Represents a node in the A* search tree.
 */
interface PathNode {
    point: Point;
    g: number; // Cost from start
    h: number; // Heuristic cost to end
    f: number; // Total cost (g + h)
    parent: PathNode | null;
}

/**
 * Finds a path from start to end using A* algorithm.
 * 
 * @param start - Starting position
 * @param end - Target position
 * @param isBlocked - Function to check if a point is impassable (obstacles, other units)
 * @param bounds - Optional grid boundaries { minX, minY, maxX, maxY }
 * @returns Array of points representing the path, or null if no path found
 */
export function findPath(
    start: Point,
    end: Point,
    isBlocked: (p: Point) => boolean,
    bounds?: { minX: number; minY: number; maxX: number; maxY: number }
): Point[] | null {
    // If start is end, path is just the start/end point
    if (start.x === end.x && start.y === end.y) return [start];

    // If end is blocked, we can't get there
    if (isBlocked(end)) return null;

    const openList: PathNode[] = [];
    const closedSet = new Set<string>();

    const startNode: PathNode = {
        point: start,
        g: 0,
        h: getDistance(start, end),
        f: getDistance(start, end),
        parent: null
    };

    openList.push(startNode);

    let iterations = 0;
    const MAX_ITERATIONS = 1000;

    while (openList.length > 0) {
        iterations++;
        if (iterations > MAX_ITERATIONS) {
            console.warn(`WARN: findPath exceeded ${MAX_ITERATIONS} iterations. Aborting.`);
            return null;
        }

        // Sort by total cost f (lowest first)
        openList.sort((a, b) => a.f - b.f);
        const current = openList.shift()!;

        const key = `${current.point.x},${current.point.y}`;
        if (closedSet.has(key)) {
            continue;
        }
        closedSet.add(key);

        // Check if reached destination
        if (current.point.x === end.x && current.point.y === end.y) {
            const path: Point[] = [];
            let temp: PathNode | null = current;
            while (temp) {
                path.unshift(temp.point);
                temp = temp.parent;
            }
            return path;
        }

        // Generate neighbors (8 directions)
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;

                const neighborPoint: Point = {
                    x: current.point.x + dx,
                    y: current.point.y + dy
                };

                // Check bounds
                if (bounds) {
                    if (neighborPoint.x < bounds.minX || neighborPoint.x > bounds.maxX ||
                        neighborPoint.y < bounds.minY || neighborPoint.y > bounds.maxY) {
                        continue;
                    }
                }

                // Check if blocked or in closed set
                if (isBlocked(neighborPoint) || closedSet.has(`${neighborPoint.x},${neighborPoint.y}`)) {
                    continue;
                }

                // Calculate costs
                // Moving diagonally is same cost as straight in Chebyshev/grid logic
                const g = current.g + 1;
                const h = getDistance(neighborPoint, end);
                const f = g + h;

                // Check if this point is already in open list with a lower cost
                const existingNode = openList.find(n => n.point.x === neighborPoint.x && n.point.y === neighborPoint.y);
                if (existingNode && existingNode.g <= g) {
                    continue;
                }

                openList.push({
                    point: neighborPoint,
                    g,
                    h,
                    f,
                    parent: current
                });
            }
        }
    }

    return null; // No path found
}


/**
 * Check if there is a clear line of sight between two points.
 * Uses Bresenham's line algorithm.
 * 
 * @param start - Starting position
 * @param end - Target position
 * @param isBlocked - Function to check if a point blocks vision
 * @param ignoreStartEnd - If true, start and end points are not checked (default: true)
 */
export function hasLineOfSight(
    start: Point,
    end: Point,
    isBlocked: (p: Point) => boolean,
    ignoreStartEnd: boolean = true
): boolean {
    let x0 = start.x;
    let y0 = start.y;
    const x1 = end.x;
    const y1 = end.y;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        // Check obstruction (skip start/end if requested)
        const isStart = x0 === start.x && y0 === start.y;
        const isEnd = x0 === end.x && y0 === end.y;

        if ((!isStart && !isEnd) || !ignoreStartEnd) {
            if (isBlocked({ x: x0, y: y0 })) {
                return false;
            }
        }

        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }

    return true;
}
