const logger = require('../util/logger');
const REPORT_STEPS = 50;

function deleteFunctionFromArray(array, func) {
    const index = array.indexOf(func);
    index !== -1 && array.splice(index, 1);
}

const executeTask = Symbol('executeTask');

class RequestQueue {
    constructor(concurrentMax, handler, tag = '', endlessMode = false) {
        this.concurrentMax = concurrentMax;
        this.handler = handler;
        this.taskQueue = [];
        this.onFinished = null;
        this.finished = false;
        this.tag = tag;
        this.endlessMode = endlessMode;
        this.finishedRequestCount = 0;
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

    [executeTask](requestTask) {
        requestTask()
            .then(data => {
                // success
                this.finishedRequestCount++;
                if (this.finishedRequestCount % REPORT_STEPS === 0) {
                    console.log(`${this.tag || 'request-queue'}: ${this.finishedRequestCount} requests has finished.`);
                }

                this.handler(data, requestTask.extraData);
                deleteFunctionFromArray(this.taskQueue, requestTask);
                if (this.taskQueue.length >= this.concurrentMax) {
                    // if taskQueue's length is still >= concurrentMax after deleting a task,
                    // we will execute the new coming concurrent task
                    this[executeTask](this.getLastConcurrentTask());
                }
                if (this.taskQueue.length === 0 && !this.endlessMode) {
                    this.finished = true;
                    this.onFinished && this.onFinished();
                }
            })
            .catch((e) => {
                logger.error("request-queue#RequestQueue#executeTask@catch", e);
                deleteFunctionFromArray(this.taskQueue, requestTask);
                if (this.taskQueue.length >= this.concurrentMax) {
                    this[executeTask](this.getLastConcurrentTask());
                    this.taskQueue.splice(this.concurrentMax, 0, requestTask);
                } else {
                    this.taskQueue.push(requestTask);
                    // also the last task
                    this[executeTask](requestTask);
                }
            });
    }

    push(requestTask, extraData) {
        if (this.finished) {
            throw new Error('request queue has finished')
        }
        requestTask.extraData = extraData;
        this.taskQueue.push(requestTask);
        if (this.taskQueue.length <= this.concurrentMax) {
            this[executeTask](requestTask);
        }
    }

    finally(onFinished) {
        this.onFinished = onFinished;
    }
}

module.exports = {
    RequestQueue
};
