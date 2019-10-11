function deleteFunctionFromArray(array, func) {
    const index = array.indexOf(func);
    index !== -1 && array.splice(index, 1);
}

export class RequestQueue {
    constructor(concurrentMax, handler) {
        this.concurrentMax = concurrentMax;
        this.handler = handler;
        this.taskQueue = [];
    }

    getLastConcurrentTask() {
        const length = this.taskQueue.length;
        if (length <= 0) {
            throw new Error('taskQueue is empty');
        }
        if (length > this.concurrentMax) {
            return this.taskQueue[this.concurrentMax - 1];
        } else {
            return this.taskQueue[length - 1];
        }
    }

    executeTask(requestTask) {
        requestTask()
            .then(data => {
                this.handler(data);
                deleteFunctionFromArray(this.taskQueue, requestTask);
                if (this.taskQueue.length >= this.concurrentMax) {
                    // if taskQueue's length is still >= concurrentMax after deleting a task,
                    // we will execute the new coming concurrent task
                    this.executeTask(this.getLastConcurrentTask());
                }
            })
            .catch(() => {
                deleteFunctionFromArray(this.taskQueue, requestTask);
                if (this.taskQueue.length >= this.concurrentMax) {
                    this.executeTask(this.getLastConcurrentTask());
                    this.taskQueue.splice(this.concurrentMax, 0, requestTask);
                } else {
                    this.taskQueue.push(requestTask);
                    // also the last task
                    this.executeTask(requestTask);
                }
            });
    }

    push(requestTask) {
        this.taskQueue.push(requestTask);
        if (this.taskQueue.length <= this.concurrentMax) {
            this.executeTask(requestTask);
        }
    }
}
