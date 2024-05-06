document.getElementById('addTaskBtn').addEventListener('click', function() {
    const taskInput = document.getElementById('newTaskInput');
    const taskList = document.getElementById('taskList');
    const task = taskInput.value;
    if (task) {
        const listItem = document.createElement('li');
        listItem.textContent = task;
        taskList.appendChild(listItem);
        taskInput.value = ''; // Clear input after adding
    } else {
        alert("Please enter a task!");
    }
});
