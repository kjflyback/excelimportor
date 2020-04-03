chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if(request.showtable) document.body.innerHTML = request.showtable;
    });