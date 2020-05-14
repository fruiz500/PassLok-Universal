//recognize browser
var	isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1,
	isFirefox = typeof InstallTrigger !== 'undefined';
	
//set global variables indicating if there is a Chrome sync data area (Chrome), otherwise set to local (old Firefox).
if(chrome.storage){
	if(chrome.storage.sync){
		var ChromeSyncOn = true,
			chromeStorage = chrome.storage.sync
	}else{
		var ChromeSyncOn = false,
			chromeStorage = chrome.storage.local
	}
}else{
	var ChromeSyncOn = false,
		chromeStorage = localStorage
}

//initializations
window.onload = function() {
	resetBtn.addEventListener('click',resetPFS);
	readHelpBtn.addEventListener('click',function(){
		chrome.runtime.sendMessage({newtab: "helpTab"})
	});
	keyHelpBtn.addEventListener('click',function(){
		chrome.runtime.sendMessage({newtab: "helpTab"})
	});
	decoyBtn.addEventListener('click',doDecoyDecrypt);
	loadEncrFile.addEventListener('change',loadEncryptedFile);
	loadEncrFile.addEventListener('click',function(){this.value = '';});
	decryptFileBtn.addEventListener('click',function(){this.value = '';});	
	readInterfaceBtn.addEventListener('click',switchReadButtons);
	
	encryptBtn.addEventListener('click',encrypt);
	encryptFileBtn.addEventListener('click',encrypt2file);
	encryptImageFile.addEventListener('change',loadEncryptImage);
	encryptImageFile.addEventListener('click',function(){this.value = '';});
	inviteBtn.addEventListener('click',inviteEncrypt);
	interfaceBtn.addEventListener('click',switchButtons);
	compHelpBtn.addEventListener('click',function(){
		chrome.runtime.sendMessage({newtab: "helpTab"})
	});
	resetBtn2.addEventListener('click',resetPFS);
		
//event listeners for the rich text toolbar boxes and buttons
	formatBlock.addEventListener("change", function() {formatDoc('formatBlock',this[this.selectedIndex].value);this.selectedIndex=0;});
	fontName.addEventListener("change", function() {formatDoc('fontName',this[this.selectedIndex].value);this.selectedIndex=0;});
	fontSize.addEventListener("change", function() {formatDoc('fontSize',this[this.selectedIndex].value);this.selectedIndex=0;});
	foreColor.addEventListener("change", function() {formatDoc('foreColor',this[this.selectedIndex].value);this.selectedIndex=0;});
	backColor.addEventListener("change", function() {formatDoc('backColor',this[this.selectedIndex].value);this.selectedIndex=0;});

	toolBar2.children[0].addEventListener("click", function() {formatDoc('bold')});
	toolBar2.children[1].addEventListener("click", function() {formatDoc('italic')});
	toolBar2.children[2].addEventListener("click", function() {formatDoc('underline')});
	toolBar2.children[3].addEventListener("click", function() {formatDoc('strikethrough')});
	toolBar2.children[4].addEventListener("click", function() {formatDoc('subscript')});
	toolBar2.children[5].addEventListener("click", function() {formatDoc('superscript')});
	toolBar2.children[6].addEventListener("click", function() {formatDoc('justifyleft')});
	toolBar2.children[7].addEventListener("click", function() {formatDoc('justifycenter')});
	toolBar2.children[8].addEventListener("click", function() {formatDoc('justifyright')});
	toolBar2.children[9].addEventListener("click", function() {formatDoc('justifyfull')});
	toolBar2.children[10].addEventListener("click", function() {formatDoc('insertorderedlist')});
	toolBar2.children[11].addEventListener("click", function() {formatDoc('insertunorderedlist')});
	toolBar2.children[12].addEventListener("click", function() {formatDoc('formatBlock','blockquote')});
	toolBar2.children[13].addEventListener("click", function() {formatDoc('outdent')});
	toolBar2.children[14].addEventListener("click", function() {formatDoc('indent')});
	toolBar2.children[15].addEventListener("click", function() {formatDoc('inserthorizontalrule')});
	toolBar2.children[16].addEventListener("click", function() {var sLnk=prompt('Write the URL here','http:\/\/');if(sLnk&&sLnk!=''&&sLnk!='http://'){formatDoc('createlink',sLnk)}});
	toolBar2.children[17].addEventListener("click", function() {formatDoc('unlink')});
	toolBar2.children[18].addEventListener("click", function() {formatDoc('removeFormat')});
	toolBar2.children[19].addEventListener("click", function() {formatDoc('undo')});
	toolBar2.children[20].addEventListener("click", function() {formatDoc('redo')});
	imgFile.addEventListener('change', loadImage);
	imgFile.addEventListener('click', function(){this.value = '';});
	mainFile.addEventListener('change', loadFile);
	mainFile.addEventListener('click', function(){this.value = '';});
	
	suggestPwdBtn.addEventListener('click',suggestPwd);
	pwdIcon.addEventListener('click',function(){showPwd('pwd')});
	acceptPwdBtn.addEventListener('click',acceptpwd);
	pwdBox.addEventListener('keyup',function(event){boxKeyup('pwd',event)});
		
	oldPwdIcon.addEventListener('click',function(){showPwd('oldPwd')});
	cancelOldPwdBtn.addEventListener('click',cancelOldPwd);
	acceptOldPwdBtn.addEventListener('click',acceptoldPwd);
	oldPwdBox.addEventListener('keyup',function(event){boxKeyup('oldPwd',event)});
		
	cancelNameBtn.addEventListener('click',cancelName);
	acceptNameBtn.addEventListener('click',storeNewLock);
		
	cancelChatBtn.addEventListener('click',cancelChat);
	makeChatBtn.addEventListener('click',makeChat);
	chatDate.addEventListener('keyup',charsLeftChat);
		
	cancelChat2Btn.addEventListener('click',cancelAcceptChat);
	acceptChatBtn.addEventListener('click',acceptChat);
		
	cancelCoverBtn.addEventListener('click',cancelStego);
	acceptCoverBtn.addEventListener('click',acceptCover);
		
	cancelDecoyInBtn.addEventListener('click',cancelDecoyIn);
	acceptDecoyInBtn.addEventListener('click',encrypt);
	decoyText.addEventListener('keyup',charsLeftDecoy);
	decoyInIcon.addEventListener('click',function(){showPwd('decoyIn')});
	decoyInBox.addEventListener('keyup',function(event){boxKeyup('decoyIn',event)});
		
	cancelDecoyOutBtn.addEventListener('click',cancelDecoyOut);
	acceptDecoyOutBtn.addEventListener('click',doDecoyDecrypt);
	decoyOutIcon.addEventListener('click',function(){showPwd('decoyOut')});
	decoyOutBox.addEventListener('keyup',function(event){boxKeyup('decoyOut',event)});
		
	encodePNGBtn.addEventListener('click',encodePNG);
	encodeJPGBtn.addEventListener('click',encodeJPG);	
	decodeImgBtn.addEventListener('click',acceptstegoImage);
	stegoImageIcon.addEventListener('click',function(){showPwd('stegoImage')});
	stegoImageBox.addEventListener('keyup',function(event){boxKeyup('stegoImage',event)});
	
	cancelSymmetricBtn.addEventListener('click',cancelsymmetric);
	acceptSymmetricBtn.addEventListener('click',acceptsymmetric);
	symmetricIcon.addEventListener('click',function(){showPwd('symmetric')});
	symmetricBox.addEventListener('keyup',function(event){boxKeyup('symmetric',event)});
	
	lockList.addEventListener('change', fillRecipients);
	lockList2.addEventListener('change', fillSender);

//UI areas hidden by default
	moreReadButtons.style.display = 'none';
	firstTimeKey.style.display = 'none';
	moreComposeButtons.style.display = 'none';
	inviteBtn.style.display = 'none';
	checkBoxes.style.display = 'none';
	
//this for the password synth
	cageBtn.addEventListener('click',function(){
		if(typeof(websiteURL) == 'undefined'){
			chrome.tabs.create({url: '../html/pagecage.html'})
		}else{
			chrome.tabs.create({url: '../html/pagecage.html#' + websiteURL.split("?")[0]});		//remove query as well
		}
		chrome.tabs.remove(activeTab.id);															//close current tab
		chrome.history.deleteUrl({url: activeTab.url})
	});	

//SynthPass interface button listeners
	okSynthBtn.addEventListener('click', function(){doSynth(false)});			//execute the action
	row2.style.display = 'none';
	row3.style.display = 'none';
	row4.style.display = 'none';
	memoArea.style.display = 'none';
	
	clipbdBtn.addEventListener('click', function(){doSynth(true)});			//same as above, but set a flag so result is copied to clipboard as well

	cancelSynthBtn.addEventListener('click', function(){window.close()});		//quit
	
	helpSynthBtn.addEventListener('click',function(){
		chrome.runtime.sendMessage({newtab: "helpTab"})
	});
	
	failMsg.addEventListener('click', fetchUserId);				//fetch userID anyway and display
	
	userID.addEventListener('keyup', userKeyup, false);
	
	masterPwd1Icon.addEventListener('click', function(){showPwd('masterPwd1')});				//toggle visibility of the passwords
	masterPwd2Icon.addEventListener('click', function(){showPwd('masterPwd2')});
	masterPwd3Icon.addEventListener('click', function(){showPwd('masterPwd3')});
	masterPwd4Icon.addEventListener('click', function(){showPwd('masterPwd4')});
	
	for(var i = 1; i < 4; i++){
		document.getElementById('masterPwd' + i.toString() + 'Box').addEventListener('keyup', pwdSynthKeyup);
		document.getElementById('masterPwd' + i.toString() + 'Box').addEventListener('focus', function(){var master = masterPwd1Box.value; if(master) keyStrength(master,'masterPwd')});
		document.getElementById('serial' + i.toString()).addEventListener('focus', function(){lastFocus = i.toString()})
	}
	
	extraMasterScr.style.display = 'none';
	cancelExtraMasterBtn.addEventListener('click',cancelextraMaster);
	acceptExtraMasterBtn.addEventListener('click',acceptextraMaster);
	extraMasterIcon.addEventListener('click',function(){showPwd('extraMaster')});
	extraMasterBox.addEventListener('keyup',function(event){boxKeyup('extraMaster',event)});
	
//collect data from content script. Also triggers initialization
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    	activeTab = tabs[0];
//load content script programmatically (needs activeTab permission)
		chrome.tabs.executeScript({
			file: 'js-src/content.js'
		});

		if(activeTab.url){								//the rest in case there's no meaningful reply from the content script
			websiteURL = activeTab.url;
			var websiteParts = websiteURL.replace(/\/$/,'').split(':')[1].replace(/\/\//,'').split('?')[0].split('#')[0].split('.');
			if(websiteParts.length > 1){
				if(websiteParts[websiteParts.length - 1].match(/htm|php/)) websiteParts = websiteParts.slice(0,websiteParts.length - 1);
				if(websiteParts.length > 1){
					var	websiteParts2 = websiteParts[websiteParts.length - 2].split('/'),
						websiteParts3 = websiteParts[websiteParts.length - 1].split('/');
					websiteName = websiteParts2[websiteParts2.length - 1] + '.' + websiteParts3[0]
				}else{
					websiteName = websiteParts[0]
				}
			}else{
				websiteName = websiteParts[0]
			}
		}
		var name = websiteName;
		startTimer = setTimeout(function(){showMemo(name)},100)
	})
}

//	time10 = hashTime10();											//get milliseconds for 10 wiseHash at iter = 10
var time10 = 200;				//about right for 10 wiseHash at iter = 10 on a core2-duo