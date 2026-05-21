
export interface ScheduledTask {
    id: string;
    type: string;
    payload: any;
    executeAt: number; // Timestamp
    priority: number; // Higher is more important
}

export class TaskScheduler {
    private tasks: ScheduledTask[] = [];

    constructor() { }

    /**
     * Schedule a task for future execution
     */
    schedule(task: Omit<ScheduledTask, 'id'>): string {
        // const { nanoid } = require('nanoid'); 
        // using crypto.randomUUID() instead
        // Assuming nanoid() was called later, I need to find where it is used.
        // But for this line, just comment it out.

        // In strict ESM environments this might need to be async or injected.
        // Given cloudflare constraints, let's use a simple ID generator for now to avoid async constructor complexities
        // or rely on caller to ID if needed. But for internal logic:
        const id = Math.random().toString(36).substring(2, 10);

        const newTask: ScheduledTask = {
            ...task,
            id
        };

        this.tasks.push(newTask);
        this.tasks.sort((a, b) => a.executeAt - b.executeAt); // Sort by time ascending

        return id;
    }

    /**
     * Get tasks that are ready to execute
     */
    popReadyTasks(now: number): ScheduledTask[] {
        const ready: ScheduledTask[] = [];

        // Since sorted by time, we can iterate until future
        while (this.tasks.length > 0 && this.tasks[0]!.executeAt <= now) {
            ready.push(this.tasks.shift()!);
        }

        // Sort ready tasks by priority (descending)
        ready.sort((a, b) => b.priority - a.priority);

        return ready;
    }

    /**
     * Remove a specific task
     */
    cancel(taskId: string): boolean {
        const idx = this.tasks.findIndex(t => t.id === taskId);
        if (idx >= 0) {
            this.tasks.splice(idx, 1);
            return true;
        }
        return false;
    }

    get pendingCount(): number {
        return this.tasks.length;
    }
}
