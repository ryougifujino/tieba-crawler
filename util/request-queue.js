const logger = require('../util/logger');
const REPORT_STEPS = 50;

function deleteFunctionFromArray(array, func) {
    const index = array.indexOf(func);
    if (index !== -1) {
        array.splice(index, 1);
    } else {
        logger.error('func not found');
    }
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
        this.pushedRequestCount = 0;
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
                logger.debug(this.tag, `task queue count is: ${this.taskQueue.length}`);
                // success
                this.finishedRequestCount++;
                if (this.finishedRequestCount % REPORT_STEPS === 0) {
                    logger.log(`${this.tag || 'request-queue'}: ${this.finishedRequestCount} requests has finished.`);
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
                    this.onFinished && this.onFinished(this.pushedRequestCount, this.finishedRequestCount);
                    logger.debug(this.tag, `onFinished was called, ${this.finishedRequestCount}/${this.pushedRequestCount}`);
                }
                if (this.taskQueue.length === 0 && this.onEmpty) {
                    this.onEmpty();
                }
            })
            .catch((e) => {
                logger.debug(this.tag, `task queue count is: ${this.taskQueue.length}`);
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
        this.pushedRequestCount++;
        logger.debug(this.tag, `a request task was pushed, total: ${this.pushedRequestCount}`);
        if (this.taskQueue.length <= this.concurrentMax) {
            this[executeTask](requestTask);
        }
    }

    finally(onFinished) {
        if (this.endlessMode) {
            throw new Error('cannot set onFinished callback in endless mode');
        }
        this.onFinished = onFinished;
    }

    setOnEmpty(onEmpty) {
        this.onEmpty = onEmpty;
    }

    isEmpty() {
        return this.taskQueue.length === 0;
    }
}

module.exports = {
    RequestQueue
};
