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

document.getElementById('addTaskBtn').addEventListener('click', function() {
    const taskInput = document.getElementById('newTaskInput');
    const taskList = document.getElementById('taskList');
    const task = taskInput.value.trim();
    if (task) {
        const listItem = document.createElement('li');
        listItem.textContent = task;

        // Add a button to mark the task as complete
        const completeBtn = document.createElement('button');
        completeBtn.textContent = 'Complete';
        completeBtn.classList.add('complete-btn');
        completeBtn.onclick = function() {
            listItem.style.textDecoration = 'line-through'; // Strike through the task
        };

        // Add a button to delete the task
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-task-btn');
        deleteBtn.onclick = function() {
            taskList.removeChild(listItem);
        };

        listItem.appendChild(completeBtn);
        listItem.appendChild(deleteBtn);
        taskList.appendChild(listItem);
        taskInput.value = ''; // Clear input after adding
    } else {
        alert("Please enter a task!");
    }
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
    const list = document.getElementById('blockedWebsitesList');
    const website = input.value.trim();
    if (website) {
        const listItem = document.createElement('li');
        listItem.textContent = website;
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-website-btn');
        deleteBtn.onclick = function() {
            list.removeChild(listItem);
        };
        listItem.appendChild(deleteBtn);
        list.appendChild(listItem);
        input.value = ''; // Clear input after adding
    } else {
        alert("Please enter a valid website URL!");
    }
});