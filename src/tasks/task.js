"use strict";

class Task {
    constructor(bot, name, parentTask, taskQueue) {
        this.bot = bot;
        this.name = name;
        this.parentTask = parentTask;
        this.taskQueue = taskQueue;
        this.subTasks = [];
        this.isAtomic = false;
        this.priority = 1;
        this.done = false;        
    }

    run() {

    }

    cancel() {

    }

    done() {
        this._done = true;
    }

    addSubTask(task) {
        subTasks.push(task);
    }
}

 // Task(name, parentTask, taskQueue) {
//     this.name = name;
//     this.parentTask = parentTask;
//     this.taskQueue = taskQueue;
//     this.subTasks = [];
//     this.isAtomic = false;
//     this.priority = 1;
//     this.done = false;
// }

// atomicTask() {

// };

// run() {

// };

// cancel() {

// };

// done() {
//     this._done = true;
// };

// addSubTask() {

// };

module.exports = Task;