"use strict";

class Task {
    constructor(name, parentTask, taskQueue) {
        this.name = name;
        this.parentTask = parentTask;
        this.taskQueue = taskQueue;
        this.subTasks = [];
        this.isAtomic = false;
        this.priority = 1;
        this.done = false;        
    }
}

// function Task(name, parentTask, taskQueue) {
//     this.name = name;
//     this.parentTask = parentTask;
//     this.taskQueue = taskQueue;
//     this.subTasks = [];
//     this.isAtomic = false;
//     this.priority = 1;
//     this.done = false;
// }

// method.atomicTask = function() {

// };

// method.run = function() {

// };

// method.cancel = function() {

// };

// method.done = function() {
//     this._done = true;
// };

// method.addSubTask = function() {

// };

module.exports = Task;