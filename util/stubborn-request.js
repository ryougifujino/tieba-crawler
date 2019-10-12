class StubbornRequest {
    constructor(requestTask, maxAttemptTimes = 20) {
        this.requestTask = requestTask;
        this.maxAttemptTimes = maxAttemptTimes;
        this.attemptTimes = 0;
    }

    async execute() {
        if (this.attemptTimes >= this.maxAttemptTimes) {
            throw new Error('exceed max attempt times');
        }
        try {
            this.attemptTimes++;
            return await this.requestTask();
        } catch (e) {
            return await this.execute();
        }
    }
}

module.exports = {
    StubbornRequest
};
