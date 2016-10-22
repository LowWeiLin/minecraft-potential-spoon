
var method = Task.prototype;

function TaskQueue(name) {
    this._name = name;
    this._taskQueue = [];
}

method.getName = function() {
    return this._name;
};

method.getTaskByName = function(taskName) {
    // TODO: search task queue for task with name (not deep search)
    return ;
};

method.run = function() {
    
};

module.exports = TaskQueue;