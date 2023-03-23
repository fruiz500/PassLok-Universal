//deletes cached password after 5 minutes unless reset. Also used to open a chat-containing tab
chrome.runtime.onMessage.addListener(
      function (request, sender, sendResponse) {

			if (request.newtab == "helpTab") {								//to open extra tab for help. Not used
                chrome.tabs.create({url: '/html/help.html'})

           }else if(request.newtab == "chatTab") {							//to open a chat in a separate tab
				chrome.tabs.create({url: 'https://passlok.com/chat/chat.html#' + request.typetoken})
			}
      }
);

chrome.alarms.onAlarm.addListener(function(result){
	if(result.name == "PLUAlarm"){
		chrome.storage.session.clear();
		chrome.runtime.sendMessage({message: "delete_keys"}, function(response) {
			var lastError = chrome.runtime.lastError;
			if (lastError) {
				console.log(lastError.message);
				// 'Could not establish connection. Receiving end does not exist.'
				return;
			}
			// Success, do something with response...
		})
	}
});

//this one for links by right-click
function openLink(info,tab){
	if(info.linkUrl) chrome.tabs.create({url: '/html/pagecage.html#' + info.linkUrl});
}

chrome.contextMenus.onClicked.addListener(openLink);

chrome.runtime.onInstalled.addListener(function(){
	chrome.contextMenus.create({
		id: "openInPL",
		title: "Open Link in Cage",
		contexts:["selection"]
	});
})
