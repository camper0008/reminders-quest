type TaskType = "easy" | "medium" | "hard" | "impossible"

type Point = TaskType | "unfilled";

interface Quest {
    title: string,
    tasks: QuestTask[],
}

interface QuestTask {
    title: string,
    deadline: Date | null,
    completionDate: Date | null,
    difficulty: TaskType,
}

function renderQuestItems(quests: Quest[]): HTMLUListElement {
    const allQuests = document.createElement("ul");
    allQuests.classList.add("quest-list")
    quests.forEach(quest => {
        const container = document.createElement("div");
        container.classList.add("quest")
        const title = document.createElement("h2");
        title.innerText = quest.title;
        container.appendChild(title);
        const list = document.createElement("ul");
        list.classList.add("quest-task-list");
        quest.tasks.forEach(task => {
            const item = document.createElement("li");
            item.classList.add("quest-task-item")
            item.innerText = task.title;
            list.appendChild(item);
        })
        container.appendChild(list);
        allQuests.appendChild(container);
    })
    return allQuests;
}

interface PointElement {
    state: "filled" | "unfilled" | "old"
    ref: HTMLDivElement;
}

class LevelRenderer {
    private level: number = 0;
    private levelCounterElement: HTMLElement;
    private pointListElement: HTMLDivElement;
    private points: PointElement[] = [];
    private pointQueue: TaskType[] = [];
    private pointQueueIntervalId: number | undefined;

    private static pointsForNextLevel(currentLevel: number): number {
        return currentLevel + 10;
    }

    private static pointForTask(task: TaskType): number {
        switch (task) {
            case "easy": return 1;
            case "medium": return 2;
            case "hard": return 3;
            case "impossible": return 4;
        }
    }

    private static calculateInitialState(initialCompletedTasks: TaskType[]): { level: number, points: TaskType[] } {
        let points: TaskType[] = [];
        let level = 0;
        while (true) {
            const task = initialCompletedTasks.shift();
            if (!task) {
                break;
            }
            points.push(task);
            while (points.length >= this.pointsForNextLevel(level)) {
                for (let i = 0; i < this.pointsForNextLevel(level); i++) {
                    points.shift();
                }
                level += 1;
            }
        }
        return { level, points };
    }

    private static createPointElement(task: TaskType | "unfilled"): HTMLDivElement {
        const point = document.createElement("div");
        point.classList.add("point", `point-${task}`);
        return point;
    }

    private fillEmptySpots() {
        const count = this.points.filter(v => v.state !== "old").length;
        for (let i = 0; i < LevelRenderer.pointsForNextLevel(this.level) - count; i++) {
            const ref = LevelRenderer.createPointElement("unfilled");
            this.points.push({
                state: "unfilled",
                ref
            });
            this.pointListElement.appendChild(ref);
        }
    }

    private clear() {
        while (true) {
            const point = this.points.pop();
            if (!point) {
                break;
            }
            this.purgePoint(point);
        }
    }

    private purgePoint(point: PointElement) {
        point.ref.classList.add("old");
        point.state = "old";
        window.setTimeout(() => {
            point.ref.remove();
        }, 200)
    }

    private replacePoint(newPoint: PointElement, oldIndex: number) {
        const old = this.points[oldIndex];
        old.ref.insertAdjacentElement("beforebegin", newPoint.ref);
        this.purgePoint(old);
        this.points[oldIndex] = newPoint;
    }

    private feedSingle(task: TaskType): void {
        const ref = LevelRenderer.createPointElement(task);
        const firstFreeIndex = this.points.findIndex(v => v.state === "unfilled");
        if (firstFreeIndex === -1) {
            this.level += 1;
            this.levelCounterElement.innerText = this.level.toString();
            this.clear();
            this.fillEmptySpots();
            this.pointQueue.unshift(task);
            this.emptyFeedingQueue();
        }
        this.replacePoint({ ref, state: "filled" }, firstFreeIndex);
    }

    public feed(task: TaskType) {
        const points = new Array(LevelRenderer.pointForTask(task)).fill(task);
        this.pointQueue.push(...points);
        this.emptyFeedingQueue();
    }

    private emptyFeedingQueue() {
        if (this.pointQueue.length === 0 || this.pointQueueIntervalId !== undefined) {
            return;
        }
        const point = this.pointQueue.shift()!;
        this.feedSingle(point);
        this.pointQueueIntervalId = window.setInterval(() => {
            const point = this.pointQueue.shift();
            if (point) {
                this.feedSingle(point);
            } else {
                window.clearInterval(this.pointQueueIntervalId);
                this.pointQueueIntervalId = undefined;
            }
        }, 500)
    }

    constructor(levelElement: HTMLDivElement, initialCompletedTasks: TaskType[]) {
        const { level, points } = LevelRenderer.calculateInitialState(initialCompletedTasks);
        this.level = level;
        this.levelCounterElement = levelElement.querySelector("#level-counter")!;
        this.pointListElement = levelElement.querySelector("#points")!;
        this.fillEmptySpots();

        while (true) {
            const point = points.shift();
            if (point) {
                this.feed(point);
            } else {
                break;
            }
        }
    }
}

function main() {
    const content = document.querySelector("#content")!;
    const level = content.querySelector<HTMLDivElement>("#level")!;
    const levelCalculator = new LevelRenderer(level, ["easy", "medium", "hard", "impossible"]);
    const quests: Quest[] = [
        {
            title: "slay a dragon",
            tasks: [
                {
                    title: "test",
                    deadline: null,
                    completionDate: null,
                    difficulty: "impossible",
                },
                {
                    title: "test",
                    deadline: null,
                    completionDate: null,
                    difficulty: "easy",
                }
            ]
        },
        {
            title: "test",
            tasks: [
                {
                    title: "test",
                    deadline: null,
                    completionDate: null,
                    difficulty: "easy"
                },
                {
                    title: "test",
                    deadline: null,
                    completionDate: null,
                    difficulty: "easy"
                }
            ]
        },
    ];

    content.appendChild(renderQuestItems(quests));

    document.onkeydown = (ev) => {
        if (ev.key === "Enter") {
            levelCalculator.feed("medium");
        }
    }
}

main();