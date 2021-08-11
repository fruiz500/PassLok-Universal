var tempLock;

//stores new Lock, copies old one just in case
function storeNewLock(){
	var email = nameBox.value.trim();
	if(locDir[email]){
		tempLock = locDir[email][0]
	}else{
		locDir[email] = []
	}
	locDir[email][0] = theirLock;
	storeData(email);
	decrypt()
}

//to store data in Chrome sync
function storeData(email){
	if(locDir){
		if(email){
			syncChromeLock(email,JSON.stringify(locDir[email]))		//sync only one entry
		}else{
			syncLocDir()													//sync everything
		}
	}
}

var resetRequested = false;

//this is to just delete the Read-once data for a particular email
function resetPFS(){
	var box = composeScr.style.display == 'block' ? 'compose' : 'read';			//figure out which screen we're in
	if(!resetRequested){				//sets flag so action happens on next click
		if(box == 'compose' && composeRecipientsBox.textContent.split(', ').length > 1){
			composeMsg.textContent = 'Can reset only a single correspondent';
			return
		}
		resetRequested = true;
		document.getElementById(box + 'Msg').textContent = "If you click Reset again, the current conversation will be reset. This cannot be undone";
		this.style.background = '#FB5216';
		this.style.color = 'white';
		var button = this;						//to reset button after delay
		setTimeout(function() {
			resetRequested = false;
			button.style.background = '';
			button.style.color = ''
		}, 10000)								//forget request after 10 seconds

	}else{
		if(box == 'compose'){
			var email = composeRecipientsBox.textContent.trim()
		}else{
			var email = senderBox.textContent.trim()
		}
		if ((locDir[email][1] == null) && (locDir[email][2] == null)){
			readMsg.textContent = 'Nothing to reset';
			return
		}
		locDir[email][1] = locDir[email][2] = null;
		locDir[email][3] = 'reset';
		storeData(email);
		document.getElementById(box + 'Msg').textContent = "Conversation reset. The next reply won't have perfect forward secrecy";
		this.style.background = '';
		this.style.display = 'none';
		resetRequested = false
	}
}

//to put Lock into sync storage
function syncChromeLock(name,data) {
	var syncName = emailSvc + '.' + name;
    var jsonfile = {};
    jsonfile[syncName.toLowerCase()] = data;
    chromeStorage.set(jsonfile);

	//now update the list, also in Chrome sync
	updateChromeSyncList()
}

//to update the stored list
function updateChromeSyncList(){
	var ChromeSyncList = Object.keys(locDir).join('|');
	var jsonfile = {};
	jsonfile[emailSvc+'.ChromeSyncList'] = ChromeSyncList;
	chromeStorage.set(jsonfile)
}

//to retrieve Lock from sync storage. The code specifying what to do with the item is here because the get operation is asynchronous
function getChromeLock(name) {
	var syncName = emailSvc + '.' + name;
    chromeStorage.get(syncName.toLowerCase(), function (obj) {
		var lockdata = obj[syncName.toLowerCase()];
		if(lockdata){
			storeChromeLock(name,lockdata)
		}
	})
}

//this one is called by the above function
function storeChromeLock(name,lockdata){
	locDir[name] = JSON.parse(lockdata);
	updateChromeSyncList()
}

//to completely remove an entry
function remChromeLock(name) {
	var syncName = emailSvc + '.' + name;
    chromeStorage.remove(syncName.toLowerCase());
	updateChromeSyncList()
}

//save all to sync storage
function syncLocDir(){
	for(var name in locDir){
		syncChromeLock(name,JSON.stringify(locDir[name]))	//sync all entries
	}
}

//this one controls an asynchronous loop
var asyncLoop = function(o){
    var i=-1;

    var loop = function(){
        i++;
        if(i==o.length){o.callback(); return;}
        o.functionToLoop(loop, i)
    }
    loop()	//init
}

//get Lock list from Chrome sync, then call an asynchronous loop to retrieve the data
function retrieveAllSync(){
	if(!emailSvc) return;
	var syncName = emailSvc + '.ChromeSyncList';
	chromeStorage.get(syncName, function (obj) {
		var lockdata = obj[syncName];
		if(lockdata){
			var ChromeSyncList = lockdata.split('|');
				
//asynchronous loop to fill local directory				
			asyncLoop({
				length : ChromeSyncList.length,
	
				functionToLoop : function(loop, i){
					var syncName2 = emailSvc + '.' + ChromeSyncList[i];
					var lockdata2 = {};
					chromeStorage.get(syncName2.toLowerCase(), function (obj) {
						lockdata2 = obj[syncName2.toLowerCase()];
						var arrayItem = JSON.parse(lockdata2);
						locDir[ChromeSyncList[i]] = arrayItem;

						if(arrayItem.length == 2 && arrayItem[1].length != 43){		//this is the "myself" entry
							myEmail = arrayItem[1];
							myEmailBox.value = myEmail;
							reformKeys()
						}
					});
					loop()				
    			},
	
    			callback : function(){				//executes after the loop
					delete locDir['undefined'];		//clean up spurious entries
					if(!KeyStr){
						retrieveKeys();		//get keys from background if not already present
						pwdBox.focus();
						openScreen('pwdScr');
						return
					}
					if(!myEmail){
						for(var i = 0; i < ChromeSyncList.length; i++){			//this just to retrieve "myEmail" if it wasn't obtained before
							if(ChromeSyncList[i] == 'myself'){
								var syncName2 = emailSvc.toLowerCase() + '.myself';
								chromeStorage.get(syncName2, function(obj){
									var lockdata2 = obj[syncName2];
									var arrayItem = JSON.parse(lockdata2);
									myEmail = arrayItem[1];
									myEmailBox.value = myEmail;
									reformKeys();
									doAction()
								})				
							}
						}
					}else{
						doAction()
					}
				}    
			})		
//end of asynchronous loop, any code below won't wait for it to be done

		} else {			//display special messages for a first-time user
			if(myEmail){
				myEmailBox.value = myEmail
			}else{
				myEmailBox.focus()
			}
			introGreeting();
			doAction()
		} 
	})
}

//called by the asynchronous loop above if the website has changed and keys need to be remade
function reformKeys(){
	if(websiteName != prevWebsiteName && KeyStr && myEmail){				//in case user is on a different email, and keys are still cached
		var dumKey = KeyStr;
		locDir = {};
		resetKeys();
		KeyStr = dumKey;
		var KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(KeyStr,myEmail)).secretKey;		//this one won't be kept as global
		myKey = ed2curve.convertSecretKey(KeySgn);
		myLockbin = nacl.sign.keyPair.fromSecretKey(KeySgn).publicKey;
		myLock = nacl.util.encodeBase64(myLockbin).replace(/=+$/,'');
		myezLock = changeBase(myLock,base64,base36,true);
		prevWebsiteName = websiteName
		}
}

var wipeEnabled = false;

//makes encrypted backup of the whole DB, then if confirmed wipes local data clean. This is taken from SeeOnce
function moveDB(){
	if(composeBox.innerHTML.match('href="data:,==k') && wipeEnabled){			//delete data the second time
		locDir = {};
		if(!ChromeSyncOn) chrome.storage.local.clear();	
		composeMsg.textContent = 'Local data wiped';
		inviteBtn.style.background = '';
		inviteBtn.textContent = 'Backup';
		wipeEnabled = false

	}else{													//normal backup
		callKey = 'movedb';
		if(!refreshKey()) return;

		//first clean out keys in locDir that don't have any real data
		for (var Lock in locDir){
			if (!locDir[Lock][0]){
				delete locDir[Lock];
				remChromeLock(Lock)		//remove from storage as well
			}
		}
		if(!locDir && ChromeSyncOn) chromeStorage.remove('ChromeSyncList');		//remove index if empty

		//now encrypt it with the user Password
		composeBox.textContent = 'The link below is an encrypted backup containing data needed to continue conversations in course. Right-click on it and save it locally. To restore it, load it as you would an encrypted attachment.\r\n\r\n';
		var fileLink = document.createElement('a');
		fileLink.download = "PLbak.txt";
		fileLink.href = 'data:,==' + keyEncrypt(JSON.stringify(locDir)) + '==';
		fileLink.textContent = "PassLok encrypted database; right-click and Save link as...";
		composeBox.appendChild(fileLink);

		inviteBtn.style.background = '#FB5216';
		inviteBtn.style.color = 'white';
		inviteBtn.textContent = 'Wipe';
		wipeEnabled = true;
		setTimeout(function() {
			inviteBtn.style.background = '';
			inviteBtn.style.color = '';
			inviteBtn.textContent = 'Invite';
			wipeEnabled = false;
			composeMsg.textContent = 'Wipe disarmed'
		}, 10000)							//cancel after 10 seconds
		updateComposeButtons('');
		composeMsg.textContent = 'Backup in the box.\r\nIf you click the button again while red, it will be wiped from this machine and others in sync.\r\nThis cannot be undone.';
		callKey = ''
	}
}

//merges two objects; doesn't sort the keys
function mergeObjects(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

//grab the names in locDir and put them on the Compose selection box
function fillList(){
	var headingColor = '639789';
	lockList.textContent = '';
	var fragment = document.createDocumentFragment(),
		opt2 = document.createElement("option");
	opt2.textContent = "Recipients (ctrl-click for more)";
	fragment.appendChild(opt2)
	for(var name in locDir){
		if(name != 'myself' && locDir[name][0]){
			var opt = document.createElement("option");
			opt.value = name;
			opt.textContent = name;
			fragment.appendChild(opt)
		}
	}
	lockList.style.color = '#' + headingColor;
	lockList.appendChild(fragment);
	lockList.options[0].selected = false
}

//same but for storing a new Lock
function fillList2(){
	var headingColor = '639789';
	lockList2.textContent = '';
	var fragment = document.createDocumentFragment(),
		opt2 = document.createElement("option");
	opt2.disabled = true;
	opt2.selected = true;
	opt2.textContent = "Select sender:";
	fragment.appendChild(opt2)
	for(var name in locDir){
		if(locDir[name][0]){
			var opt = document.createElement("option");
			opt.value = name;
			opt.textContent = name;
			fragment.appendChild(opt)
		}
	}
	lockList2.style.color = '#' + headingColor;
	lockList2.appendChild(fragment);
	lockList2.options[0].selected = false
}

//fills sender name from list
function fillSender(){
	for(var i = 0; i < lockList2.options.length; i++){
    	if(lockList2.options[i].selected){
			nameBox.value = lockList2.options[i].value
		}
	}
}

//same for recipients
function fillRecipients(){
	emailList = [];
	for(var i = 1; i < lockList.options.length; i++){
    	if(lockList.options[i].selected){
			emailList.push(lockList.options[i].value)
		}
	}
	emailList.sort();
	if(emailList.length){
		composeRecipientsBox.textContent = emailList.join(", ");
	}else{
		composeRecipientsBox.textContent = "Nobody!.. Making an invitation"
	}
	if(lockList.options[0].selected){
		composeRecipientsBox.textContent = "Unspecified... Using Shared Password mode";
		signedMode.checked = false;
		onceMode.checked = false;
		chatMode.checked = false;
		symMode.checked = true;
		anonMode.checked = false;
		emailList.push('dummy');			//so the invite button goes away
		soleRecipient = true				//for image encryption
	}else{
		signedMode.checked = true;
		onceMode.checked = false;
		chatMode.checked = false;
		symMode.checked = false;
		anonMode.checked = false;
		soleRecipient = (emailList.lenght == 1)
	}
	updateComposeButtons()
}