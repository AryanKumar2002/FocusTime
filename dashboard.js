document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const timerCard = document.getElementById('timerCard');
    const blockedWebsitesCard = document.getElementById('blockedWebsitesCard');
    const taskTrackerCard = document.getElementById('taskTrackerCard');
    const ttsCard = document.getElementById('ttsCard');

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        chrome.storage.local.set({ darkMode: document.body.classList.contains('dark-mode') });
    });

    chrome.storage.local.get('darkMode', (data) => {
        if (data.darkMode) {
            document.body.classList.add('dark-mode');
        }
    });

    timerCard.addEventListener('click', () => {
        openTimer();
    });

    blockedWebsitesCard.addEventListener('click', () => {
        openBlockedWebsites();
    });

    taskTrackerCard.addEventListener('click', () => {
        openTaskTracker();
    });

    ttsCard.addEventListener('click', () => {
        openTTS();
    });

    function openTimer() {
        const container = document.createElement('div');
        container.classList.add('card');
        container.innerHTML = `
            <h1>Pomodoro Timer</h1>
            <div class="input-group">
                <label for="workTime">Work Time (minutes):</label>
                <input type="number" id="workTime" min="1" value="20">
            </div>
            <div class="input-group">
                <label for="breakTime">Break Time (minutes):</label>
                <input type="number" id="breakTime" min="1" value="5">
            </div>
            <button id="startStopBtn" class="btn">Start</button>
            <button id="playPauseBtn" class="btn pause-play">Pause</button>
            <div id="timer">00:00:00</div>
        `;
        document.body.appendChild(container);
        const startStopBtn = container.querySelector('#startStopBtn');
        const pausePlayBtn = container.querySelector('#playPauseBtn');
        const workTimeInput = container.querySelector('#workTime');
        const breakTimeInput = container.querySelector('#breakTime');
        const timerDisplay = container.querySelector('#timer');

        function updateTimerDisplay(minutes, seconds, timerType, state, pause) {
            timerDisplay.textContent = `${timerType.toUpperCase()} - ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            startStopBtn.textContent = state;
            pausePlayBtn.textContent = pause;
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
                    chrome.storage.local.get('isPaused', (data2) => {
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

        chrome.runtime.sendMessage({request: "currentTimeLeft"});
    }

    function openBlockedWebsites() {
        const container = document.createElement('div');
        container.classList.add('card');
        container.innerHTML = `
            <h1>Blocked Websites</h1>
            <input type="text" id="newBlockedWebsiteInput" placeholder="Enter website URL" class="input-group">
            <button id="addBlockedWebsiteBtn" class="btn">Add</button>
            <ul id="blockedWebsitesList"></ul>
        `;
        document.body.appendChild(container);
        const input = container.querySelector('#newBlockedWebsiteInput');
        const addBlockedWebsiteBtn = container.querySelector('#addBlockedWebsiteBtn');
        const blockedWebsitesList = container.querySelector('#blockedWebsitesList');

        addBlockedWebsiteBtn.addEventListener('click', () => {
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
            blockedWebsitesList.innerHTML = ''; // Clear current list
            blockedWebsites.forEach(function(website) {
                const listItem = document.createElement('li');
                listItem.textContent = website;
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.classList.add('delete-website-btn');
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
                blockedWebsitesList.appendChild(listItem);
            });
        }

        chrome.storage.local.get({blockedWebsites: []}, function(result) {
            updateBlockedWebsitesUI(result.blockedWebsites);
        });
    }

    function openTaskTracker() {
        const container = document.createElement('div');
        container.classList.add('card');
        container.innerHTML = `
            <h1>Task Tracker</h1>
            <input type="text" id="newTaskInput" class="input-group" placeholder="Enter new task">
            <button id="addTaskBtn" class="btn">Add Task</button>
            <ul id="taskList"></ul>
        `;
        document.body.appendChild(container);
        const taskInput = container.querySelector('#newTaskInput');
        const addTaskBtn = container.querySelector('#addTaskBtn');
        const taskList = container.querySelector('#taskList');

        addTaskBtn.addEventListener('click', function() {
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

        function updateTaskListUI(tasks) {
            taskList.innerHTML = '';  // Clear existing tasks
            tasks.forEach(function(task) {
                const listItem = document.createElement('li');
                listItem.textContent = task.description;
                listItem.style.textDecoration = task.completed ? 'line-through' : 'none';

                // Button to toggle completion status
                const completeBtn = document.createElement('button');
                completeBtn.textContent = task.completed ? 'Undo' : 'Complete';
                completeBtn.classList.add('complete-btn');
                completeBtn.onclick = function() {
                    task.completed = !task.completed;
                    saveTasks(tasks);
                };

                // Button to delete task
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.classList.add('delete-task-btn');
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

        function saveTasks(tasks) {
            chrome.storage.local.set({ tasks: tasks }, function() {
                updateTaskListUI(tasks);
            });
        }

        chrome.storage.local.get({tasks: []}, function(result) {
            updateTaskListUI(result.tasks);
        });
    }

    function openTTS() {
        const container = document.createElement('div');
        container.classList.add('card');
        container.innerHTML = `
            <h1>Text to Speech</h1>
            <textarea id="text-to-speak" class="input-group" placeholder="Enter text..."></textarea>
            <button id="speak" class="btn">Speak</button>
            <select id="speed" class="input-group">
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1.0" selected>Normal</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
            </select>
            <button id="pause" class="btn">Stop</button>
        `;
        document.body.appendChild(container);
        const speakBtn = container.querySelector('#speak');
        const pauseBtn = container.querySelector('#pause');
        const textToSpeak = container.querySelector('#text-to-speak');
        const speed = container.querySelector('#speed');
        let speechUtterance = null;

        speakBtn.addEventListener('click', function () {
            const text = textToSpeak.value;
            const rate = parseFloat(speed.value);
            speakText(text, rate);
        });

        pauseBtn.addEventListener('click', function () {
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
    }
});
