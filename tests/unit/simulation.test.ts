
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskScheduler } from '../../src/game/loop/scheduler';
import { TickService } from '../../src/game/loop/tick';

const mockDb = {
    prepare: vi.fn(),
};
const mockCache = {};

describe('TaskScheduler', () => {
    let scheduler: TaskScheduler;

    beforeEach(() => {
        scheduler = new TaskScheduler();
    });

    it('should schedule and retrieve ready tasks', () => {
        const taskId = scheduler.schedule({
            type: 'TEST',
            payload: {},
            executeAt: 100,
            priority: 1
        });

        expect(taskId).toBeTruthy();
        expect(scheduler.pendingCount).toBe(1);

        // Not ready yet
        let ready = scheduler.popReadyTasks(50);
        expect(ready).toHaveLength(0);

        // Ready now
        ready = scheduler.popReadyTasks(100);
        expect(ready).toHaveLength(1);
        expect(ready[0].id).toBe(taskId);
        expect(scheduler.pendingCount).toBe(0);
    });

    it('should prioritize tasks', () => {
        scheduler.schedule({ type: 'A', priority: 1, executeAt: 100, payload: {} });
        scheduler.schedule({ type: 'B', priority: 10, executeAt: 100, payload: {} });

        const ready = scheduler.popReadyTasks(100);
        expect(ready[0].type).toBe('B'); // Higher priority first
        expect(ready[1].type).toBe('A');
    });
});

describe('TickService', () => {
    let service: TickService;

    beforeEach(() => {
        service = new TickService(mockDb as any, mockCache as any);
    });

    it('should process tick and execute scheduled tasks', async () => {
        const scheduler = service.getScheduler();
        scheduler.schedule({
            type: 'REGEN_HEALTH',
            payload: {},
            executeAt: 1000,
            priority: 1
        });

        // Tick before task execution time
        await service.processTick(500, 16);
        expect(scheduler.pendingCount).toBe(1);

        // Tick after task execution time
        const result = await service.processTick(1001, 16);
        expect(result.tasksExecuted).toBe(1);
        expect(scheduler.pendingCount).toBe(0);
    });
});
