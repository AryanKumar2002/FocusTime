document.addEventListener('DOMContentLoaded', function() {
    const startStopBtn = document.getElementById('startStopBtn');
    const pausePlayBtn = document.getElementById('playPauseBtn');
    const workTimeInput = document.getElementById('workTime');
    const breakTimeInput = document.getElementById('breakTime');
    const timerDisplay = document.getElementById('timer');

    function updateTimerDisplay(minutes, seconds, timerType, state, pause) {
        timerDisplay.textContent = `${timerType.toUpperCase()} - ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        startStopBtn.textContent = state;
        pausePlayBtn.textContent = pause;
        console.log(pause);
    }

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.timeLeft !== undefined && message.timerType) {
            const minutes = Math.floor(message.timeLeft / 60);
            const seconds = message.timeLeft % 60;
            updateTimerDisplay(minutes, seconds, message.timerType, message.state, message.pause);
        }
    });

    startStopBtn.addEventListener('click', () => {
        chrome.storage.local.get('isTimerRunning', (data) => {
            if (data.isTimerRunning) {
                chrome.runtime.sendMessage({action: "stop"});
                startStopBtn.textContent = "Start";
                workTimeInput.disabled = false;
                breakTimeInput.disabled = false;
            } else {
                chrome.runtime.sendMessage({
                    action: "start",
                    workTime: parseInt(workTimeInput.value),
                    breakTime: parseInt(breakTimeInput.value)
                });
                startStopBtn.textContent = "Stop";
                workTimeInput.disabled = true;
                breakTimeInput.disabled = true;
            }
        });
    });

    pausePlayBtn.addEventListener('click', () => {
        chrome.storage.local.get('isTimerRunning', (data) => {
            if (data.isTimerRunning) {
                console.log("Timer is running");
                chrome.storage.local.get('isPaused', (data2) => {
                    console.log(data2.isPaused);
                    if (data2.isPaused) {
                        chrome.runtime.sendMessage({action: "play"});
                        pausePlayBtn.textContent = "Pause";
                    } else {
                        chrome.runtime.sendMessage({action: "pause"});
                        pausePlayBtn.textContent = "Play";
                    }
                });
                chrome.runtime.sendMessage({action: "pause"});
            }
        });
    });

    // Request the current timer state from the background script when the popup is opened
    chrome.runtime.sendMessage({request: "currentTimeLeft"});
});

function updateTaskListUI(tasks) {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';  // Clear existing tasks
    tasks.forEach(function(task) {
        const listItem = document.createElement('li');
        listItem.textContent = task.description;
        listItem.style.textDecoration = task.completed ? 'line-through' : 'none';

        // Button to toggle completion status
        const completeBtn = document.createElement('button');
        completeBtn.textContent = task.completed ? 'Undo' : 'Complete';
        completeBtn.onclick = function() {
            task.completed = !task.completed;
            saveTasks(tasks);
        };

        // Button to delete task
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = function() {
            const index = tasks.indexOf(task);
            tasks.splice(index, 1);
            saveTasks(tasks);
        };

        listItem.appendChild(completeBtn);
        listItem.appendChild(deleteBtn);
        taskList.appendChild(listItem);
    });
}

// Function to save tasks to local storage
function saveTasks(tasks) {
    chrome.storage.local.set({ tasks: tasks }, function() {
        updateTaskListUI(tasks);
    });
}

// Event listener for adding a new task
document.getElementById('addTaskBtn').addEventListener('click', function() {
    const taskInput = document.getElementById('newTaskInput');
    const taskDescription = taskInput.value.trim();
    if (taskDescription) {
        chrome.storage.local.get({tasks: []}, function(result) {
            const tasks = result.tasks;
            tasks.push({description: taskDescription, completed: false});
            saveTasks(tasks);
            taskInput.value = ''; // Clear input after adding
        });
    } else {
        alert("Please enter a task!");
    }
});

// Load tasks on startup
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get({tasks: []}, function(result) {
        updateTaskListUI(result.tasks);
    });
});

var speechUtterance = null;

document.getElementById('speak').addEventListener('click', function () {
    var text = document.getElementById('text-to-speak').value;
    var rate = parseFloat(document.getElementById('speed').value);
    speakText(text, rate);
});

document.getElementById('pause').addEventListener('click', function () {
    if (speechUtterance) {
        if (speechUtterance.paused) {
            chrome.tts.resume();
        } else {
            chrome.tts.pause();
        }
    }
});

function speakText(text, rate) {
    if (speechUtterance) {
        chrome.tts.stop();
    }

    speechUtterance = new SpeechSynthesisUtterance(text);
    speechUtterance.lang = 'en-US';
    speechUtterance.rate = rate;

    chrome.tts.speak(text, {
        'lang': 'en-US',
        'rate': rate
    });
}

document.getElementById('addBlockedWebsiteBtn').addEventListener('click', function() {
    const input = document.getElementById('newBlockedWebsiteInput');
    const website = input.value.trim();
    if (website) {
        chrome.storage.local.get({blockedWebsites: []}, function(result) {
            const blockedWebsites = result.blockedWebsites;
            blockedWebsites.push(website);
            chrome.storage.local.set({blockedWebsites: blockedWebsites}, function() {
                updateBlockedWebsitesUI(blockedWebsites);
                input.value = ''; // Clear input after adding
            });
        });
    } else {
        alert("Please enter a valid website URL!");
    }
});

function updateBlockedWebsitesUI(blockedWebsites) {
    const list = document.getElementById('blockedWebsitesList');
    list.innerHTML = ''; // Clear current list
    blockedWebsites.forEach(function(website) {
        const listItem = document.createElement('li');
        listItem.textContent = website;
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = function() {
            const index = blockedWebsites.indexOf(website);
            if (index > -1) {
                blockedWebsites.splice(index, 1); // Remove from array
                chrome.storage.local.set({blockedWebsites: blockedWebsites}, function() {
                    updateBlockedWebsitesUI(blockedWebsites);
                });
            }
        };
        listItem.appendChild(deleteBtn);
        list.appendChild(listItem);
    });
}

// Load blocked websites on startup
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get({blockedWebsites: []}, function(result) {
        updateBlockedWebsitesUI(result.blockedWebsites);
    });
});