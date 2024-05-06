document.getElementById('goToTaskTracker').addEventListener('click', function() {
    chrome.tabs.create({url: 'dashboard.html'});
});

  