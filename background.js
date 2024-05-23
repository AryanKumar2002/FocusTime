let timeLeft = 0; // Time left in seconds
let timerType = "work"; // Current timer type: "work" or "break"
let state = "Start";
let pause = "Pause";
let isPaused = false; // Added to track pause state
let countdownTimer;

function startTimer(duration, type) {
    clearInterval(countdownTimer);
    timeLeft = duration * 60; // Convert minutes to seconds
    timerType = type;
    countdownTimer = setInterval(() => {
        if (timeLeft > 0 && !isPaused) {
            timeLeft--;
            chrome.runtime.sendMessage({timeLeft: timeLeft, timerType: timerType, state: state, pause: pause});
        } else if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            timerType = timerType === "work" ? "break" : "work";
            let nextDuration = timerType === "work" ? duration : duration; // Adjust for different durations if needed
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon.png', // Path to the icon
                title: timerType === "work" ? "Work Time" : "Break Time",
                message: timerType === "work" ? "Time to get back to work!" : "Time to take a break!"
            });
            startTimer(nextDuration, timerType);
        }
    }, 1000);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start") {
        state = "Stop";
        startTimer(request.workTime, "work");
        chrome.storage.local.set({isTimerRunning: true});
    } else if (request.action === "stop") {
        state = "Start";
        clearInterval(countdownTimer);
        chrome.storage.local.set({isTimerRunning: false});
    } else if (request.request === "currentTimeLeft") {
        sendResponse({timeLeft: timeLeft, timerType: timerType});
    } else if (request.action === "pause") {
        pause = "Play";
        isPaused = true;
        chrome.storage.local.set({isPaused: true});
    } else if (request.action === "play") {
        pause = "Pause";
        isPaused = false;
        chrome.storage.local.set({isPaused: false});
    }
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({isTimerRunning: false});
    chrome.storage.local.set({isPaused: false});
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        chrome.storage.local.get({blockedWebsites: []}, function(result) {
            const blockedWebsites = result.blockedWebsites;
            blockedWebsites.forEach(function(blockedUrl) {
                if (tab.url.includes(blockedUrl) && state == "Stop" && pause == "Pause") {
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icon.png',
                        title: "Blocked Website Alert!",
                        message: "You are visiting a blocked site: " + blockedUrl
                    });
                }
            });
        });
    }
});
