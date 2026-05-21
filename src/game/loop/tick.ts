
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { TaskScheduler } from './scheduler';
import { NPCSimulator } from '../simulation/npc';
import { WorldSimulator } from '../simulation/world';

export class TickService {
    private scheduler: TaskScheduler;
    private npcSimulator: NPCSimulator;
    private worldSimulator: WorldSimulator;

    constructor(
        db: D1Database,
        _cache: KVNamespace
    ) {
        this.scheduler = new TaskScheduler();
        this.npcSimulator = new NPCSimulator(db);
        this.worldSimulator = new WorldSimulator(db);
    }

    /**
     * Process a single game tick
     * @param timestamp Current timestamp (ms)
     * @param deltaTime Time since last tick (ms)
     */
    async processTick(timestamp: number, deltaTime: number): Promise<{ tasksExecuted: number, eventsTriggered: number }> {
        // 1. Process Scheduled Tasks
        const readyTasks = this.scheduler.popReadyTasks(timestamp);
        let tasksExecuted = 0;

        for (const task of readyTasks) {
            try {
                await this.executeTask(task);
                tasksExecuted++;
            } catch (err) {
                console.error(`Failed to execute task ${task.id} (${task.type}):`, err);
            }
        }

        // 2. Run Simulators
        await this.npcSimulator.update(deltaTime);
        await this.worldSimulator.update(deltaTime);
        const eventsTriggered = 0;

        return { tasksExecuted, eventsTriggered };
    }

    private async executeTask(task: any) {
        switch (task.type) {
            case 'REGEN_HEALTH':
                // Logic to regen health
                break;
            case 'RESTOCK_VENDOR':
                // Logic to restock
                break;
            default:
                console.warn('Unknown task type:', task.type);
        }
    }

    public getScheduler(): TaskScheduler {
        return this.scheduler;
    }
}
