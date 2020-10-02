//deletes cached password after 5 minutes unless reset. Also used to open a chat-containing tab
chrome.runtime.onMessage.addListener(
      function (request, sender, sendResponse) {
		
			if (request.newtab == "helpTab") {								//to open extra tab for help. Not used
                chrome.tabs.create({url: '/html/help.html'})

           }else if(request.newtab == "chatTab") {							//to open a chat in a separate tab
				chrome.tabs.create({url: 'https://passlok.com/chat/chat.html#' + request.typetoken})

		   }else if(request.message == "preserve_master"){				//cache SynthPass master Password
			   masterPwd = request.masterPwd;
			   resetKeyTimer()

			}else if(request.message == "preserve_keys"){				//cache keys from popup, so they are available from it loads again
				KeyStr = request.KeyStr;
				myKey = request.myKey;
				myEmail = request.myEmail;
				myLockbin = request.myLockbin;
				myLock = request.myLock;
				myezLock = request.myezLock;
				locDir = request.locDir;
				prevWebsiteName = request.prevWebsiteName;
				resetKeyTimer()
				
			}else if(request.message == "retrieve_master"){
				chrome.runtime.sendMessage({message: 'master_fromBg', masterPwd: masterPwd});
				resetKeyTimer()

			}else if(request.message == "retrieve_keys"){				//send cached keys to popup
				chrome.runtime.sendMessage({message: 'keys_fromBg', KeyStr: KeyStr, myKey: myKey, myEmail: myEmail, myLockbin: myLockbin, myLock: myLock, myezLock: myezLock, locDir: locDir, prevWebsiteName: prevWebsiteName});
				resetKeyTimer()

			}else if(request.message == "reset_timer"){
				resetKeyTimer();			//reset timer to erase cached keys

			}else if(request.message == "reset_now"){ 
				resetNow();					//same but effective immediately

			}
      }
);

//global variables to store in background, since popup is ephemeral
var masterPwd, KeyStr, myKey, myEmail, myLockbin, myLock, myezLock, locDir, prevWebsiteName;

var	keyTimer = 0;

//deletes keys after 5 minutes	
function resetKeyTimer(){
	var period = 300000;
	clearTimeout(keyTimer);

	//start timer to reset keys
	keyTimer = setTimeout(function() {
		resetNow();
		chrome.runtime.sendMessage({message: 'delete_keys'})		//also delete in popup
	}, period)
}

//deletes keys immediately
function resetNow(){
	masterPwd = '';
	KeyStr = '';
	myKey = '';
	myEmail = '';
	myLockbin = '';
	myLock = '';
	myezLock = '';
	locDir = {};
	prevWebsiteName = ''
}

//this one for links by right-click
function openLink(info,tab){
	if(info.linkUrl) chrome.tabs.create({url: '/html/pagecage.html#' + info.linkUrl});
}

chrome.contextMenus.create({
	title: "Open Link in Cage", 
	contexts:["selection"], 
	onclick: openLink
});