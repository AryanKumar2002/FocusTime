document.getElementById('goToTextToSpeech').addEventListener('click', function() {
    chrome.tabs.create({url: 'popup.html'});
  });
  
  document.getElementById('goToTimer').addEventListener('click', function() {
    chrome.tabs.create({url: 'pomodoro.html'});
  });
  
  document.getElementById('info').addEventListener('click', function() {
    alert("This extension allows you to convert text to speech and summarize text. Click 'Go to Text to Speech' to convert text to speech, and 'Go to Summarizer' to summarize text.");
  });
  