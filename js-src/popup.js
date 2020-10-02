// code for interaction with web pages, based on SynthPass code, only for universal extension
var masterPwd, websiteName, prevWebsiteName;

//what happens when the content or background scripts send something back
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	  
	if(request.message == "start_info"){							//initial message from content script; begins with SynthPass stuff	 
		var hostParts = request.host.split('.');						//get name of the website, ignoring subdomains
		if(hostParts[hostParts.length - 1].length == 2 && hostParts[hostParts.length - 2].length < 4){			//domain name with second-level suffix
			websiteName = hostParts.slice(-3).join('.')
		}else{
			websiteName = hostParts.slice(-2).join('.')				//normal domain name
		}
		pwdNumber = Math.max(pwdNumber,request.number);
		isUserId = request.isUserId;
		websiteURL = request.websiteURL;
		if(!websiteName) websiteName = nameFromURL(websiteURL);
  
		if(isUserId){								//userId field found, so display box, filled from storage
			clearTimeout(startTimer);	 
			memoArea.style.display = 'none';
			openScreen('synthScr');
			userTable.style.display = 'block';
			okSynthBtn.style.display = '';
			masterPwdMsg.textContent = "I cannot see a password to be filled, but there is an input that might take a user name"
		}

		if(pwdNumber){					             //password boxes found, so display the appropriate areas and load serial into first box
			clearTimeout(startTimer);	 
			memoArea.style.display = 'none';
			if(masterPwd){
				masterPwd1Box.value = masterPwd;
				masterPwd1Icon.style.display = 'none'
			}else{
				retrieveMaster()					  //populate cached Key and interface	 
			}

			openScreen('synthScr');
			pwdTable.style.display = 'block';
			userTable.style.display = 'block';
			if(!isUserId){idLabel.style.display = 'none';userID.style.display = 'none';}		//don't display user ID box if no inputs
			okSynthBtn.style.display = '';

			if(pwdNumber == 1){						//only one password box: display single input
				if(masterPwd){
					masterPwdMsg.textContent = "Master Key still active; click OK"
				}else{
					masterPwdMsg.textContent = "Enter Master Key and optional serial, click OK"
				}
			}else if(pwdNumber >= 2){				//2 password boxes: display two inputs and load serial on top box	  
				masterPwdMsg.textContent = "Move the serial if the old password is not first\r\nTo take password as-is without storing, write a dash as serial\r\nTo store a password, write a plus as serial";
				row2.style.display = '';
				if(pwdNumber >= 3){					//3 boxes
					row3.style.display = '';
					if(pwdNumber == 4){				//4 boxes, which is the max
						row4.style.display = '';
					}else if(pwdNumber >= 5){			//too many boxes
						pwdTable.style.display = 'none';
						okSynthBtn.style.display = 'none';
						clipbdBtn.style.display = 'none';
						masterPwdMsg.textContent = "Too many password fields. Try filling them manually";
					}
				}	  
			}

	//now get the serial from sync storage, and put it in the first serial box, and the userID in its place
			if(isUserId || pwdNumber){
				chrome.storage.sync.get(websiteName, function (obj){
					var serialData = obj[websiteName];
					if(serialData){
						if(serialData[0]) serial1.value = serialData[0];			//populate serial box
						if(serialData[1]) userID.value = serialData[1];		//and user ID regardless of whether it is displayed
						if(serialData[2]) pwdLength.value = serialData[2];		//and password length, if any
						if(serialData[3]) cryptoStr = serialData[3]			//put encrypted password, if any, in global variable
					}
				});
			}
	  
	  //close everything and erase cached Master Password and encrypted stuff after five minutes
	  		setTimeout(function(){
				masterPwd = '';
				chrome.runtime.sendMessage({message: 'reset_now'});
				window.close();
			}, 300000);
			masterPwd1Box.focus()
		  
		}else{									//no passwords to be filled, so open the regular PassLok interface, with the main box filled	
			var length = request.PLstuff.length;

			if(request.largeInputs > 0){			//there are fillable boxes, so open the compose interface
				clearTimeout(startTimer);
				hasInputBoxes = true;
				callKey = 'compose';
				myEmail = retrieveMyEmail(websiteName)	//get myEmail from sync storage, which also gets all the other Locks
				
			}else if(length){									//no compose boxes, so attempt to decrypt instead
				if(length > 1){
					if(websiteName == 'google.com' || websiteName == 'live.com' || websiteName == 'yahoo.com'){
						text2decrypt = request.PLstuff[0]				//line breaks must be preserved. Important for text stego
					}else{
						text2decrypt = confirm('It seems there is more than one crypto item on the page. If you click OK, the first will be taken, otherwise the last will be taken.') ? request.PLstuff[0] : request.PLstuff[length - 1]
					}
				}else{
					text2decrypt = request.PLstuff[0]
				}
				clearTimeout(startTimer);
				callKey = 'decrypt';
				soleRecipient = true;		//no way to tell when decrypting, so assume sole recipient
				myEmail = retrieveMyEmail(websiteName)	//get myEmail from sync storage, which also gets all the other Locks

			}else{							//found nothing, so do generic page action, loading stored notes
				if(!masterPwd) retrieveMaster()
			}
		}

	}else if(request.message == "keys_fromBg"){			//get cached keys from background
		if(request.KeyStr){
			KeyStr = request.KeyStr;
			myKey = new Uint8Array(32);				    //must be Uint8Array type
			for(var i = 0; i < 32; i++) myKey[i] = request.myKey[i];
			myLockbin = new Uint8Array(32);
			for(var i = 0; i < 32; i++) myLockbin[i] = request.myLockbin[i];
			myLock = request.myLock;
			myezLock = request.myezLock;
			myEmail = request.myEmail;
			locDir = request.locDir;
			prevWebsiteName = request.prevWebsiteName;
			if(callKey) doAction
		}
				
	}else if(request.message == "master_fromBg"){		//same for SynthPass master Password
		if(request.masterPwd){
			masterPwd = request.masterPwd;
			masterPwd1Box.value = masterPwd;
			masterPwd1Icon.style.display = 'none'
		}

	}else if(request.message == "delete_keys"){			//delete cached keys
		masterPwd = '';
		KeyStr = '';
		KeySgn = '';
		KeyDH = '';
		KeyDir = '';
		myEmail = '';
		myLock = '';
		myLockStr = '';
		myezLock = '';
		LocDir = {};
		prevWebsiteName = '';
		pwdMsg.textContent = 'Your Password has expired. Please enter it again';
		pwdMsg.style.color = ''

	}else if(request.message == "done") {		//content script done, so store the serial, if any, of the password that has focus, plus the user name
		if(synthScr.style.display == 'block'){	//send SP master to background
			var pwdStr = document.getElementById("masterPwd" + lastFocus + 'Box').value.trim();
			if(pwdStr){
				masterPwd = pwdStr;
				preserveMaster()
			}
    		var	serialStr = document.getElementById("serial" + lastFocus).value.trim(),
				userStr = userID.value.trim(),
				lengthStr = pwdLength.value.trim();
			if(serialStr == '-') serialStr = '';									//don't store '-' serial

		//store serial, user name, password length, and encrypted password if they exist	
			if(websiteName){										
				var jsonfile = {};
				jsonfile[websiteName] = [serialStr,userStr,lengthStr,cryptoStr,memoBox.value.trim()];
    			if(isEmptyJSON(jsonfile)){
					chrome.storage.sync.remove(websiteName)
				}else{
    				chrome.storage.sync.set(jsonfile)
				}
			}

		}else{							//send PL keys to background
			preserveKeys()
		}

		window.close()
	}
  }
)

//fetches userId and displays in box so it can be added
function fetchUserId(){
	userTable.style.display = 'block';
	lengthLabel.style.display = 'none';
	pwdLength.style.display = 'none';
	masterPwdMsg.textContent = "There was no user ID stored";
	memoArea.style.display = 'none';
	okSynthBtn.textContent = 'OK';

	//now get the userID from storage, and put it in its place
	chrome.storage.sync.get(websiteName, function (obj){
		var serialData = obj[websiteName];
		if(serialData){
			if(serialData[1]){userID.value = serialData[1];		//fill user ID
			okSynthBtn.style.display = '';
			masterPwdMsg.textContent = "Click OK to put it in the page"
			}
		}
	})
}

var memoCipher = '';					//container for encrypted note

//fetches other info
function fetchWebsiteMemo(){
	chrome.storage.sync.get(websiteName, function (obj){
		if(!memoBox.value.trim()){							//do the following only if not filled already
			var serialData = obj[websiteName];
			if(serialData){												//need to get everything in case it is saved
				if(serialData[0]) serial1.value = serialData[0];			//populate serial box
				if(serialData[1]) userID.value = serialData[1];		//and user ID regardless of whether it is displayed
				if(serialData[2]) pwdLength.value = serialData[2];		//and password length, if any
				if(serialData[3]){cryptoStr = serialData[3]}else{cryptoStr = ''};	//put encrypted password, if any, in global variable
				if(serialData[4]) memoCipher = serialData[4];		//get memo, in case there's one
			}

	//the rest is to decrypt an encrypted note		
			if(memoCipher){
				if(!masterPwd){														//get master Password if not in memory
					openScreen('extraMasterScr');
					extraMasterAction = 'decrypt';
					extraMasterMsg.textContent = "Enter the master Password in order to see its secure note";
					extraMasterBox.focus();
					return
				}
				var cipher = nacl.util.decodeBase64(memoCipher);
				if(!cipher) return false;
				var	nonce = cipher.slice(0,9),												//no marker byte
					nonce24 = makeNonce24(nonce),
					cipher2 = cipher.slice(9),
					pwd2 = wiseHash(masterPwd,websiteName),
					plain = nacl.secretbox.open(cipher2,nonce24,pwd2);
				if(plain){
					preserveMaster();									//sync only if successful
					memoBox.value = nacl.util.encodeUTF8(plain)
				}else{
					masterPwdMsg.textContent = "Decryption of secure note has failed";
					memoBox.value = ''
				}
			}
		}
	})
}

//called if there is no response from the content script or there is no PassLok or SynthPass function to do
function showMemo(name){
	websiteName = name;
	if(!memoBox.value.trim()) fetchWebsiteMemo();
	userTable.style.display = 'none';
	pwdTable.style.display = 'none';
	memoArea.style.display = 'block';
	openScreen('synthScr');
	okSynthBtn.textContent = 'Save';
	clipbdBtn.style.display = 'none';
	synthTitle.textContent = "PassLok notes";
	failMsg.textContent = "I cannot see a password to be filled, so here are your secure notes on this website.\r\nclick me for user ID";
	memoBox.focus()
}

function retrieveMyEmail(loc){
	emailSvc = '@' + loc;
	var name = emailSvc + '.myself';
	retrieveAllSync()						//this will get myName stored under key 'myself'
}

function preserveMaster(){
	if(masterPwd){
		chrome.runtime.sendMessage({message: "preserve_master", masterPwd: masterPwd})
	}
}

function preserveKeys(){
	if(KeyStr){
		chrome.runtime.sendMessage({message: 'preserve_keys', KeyStr: KeyStr, myKey: myKey, myEmail: myEmail, myLockbin: myLockbin, myLock: myLock, myezLock: myezLock, locDir: locDir, prevWebsiteName: prevWebsiteName});
	}
}

function retrieveMaster(){
	chrome.runtime.sendMessage({message: 'retrieve_master'})
}

function retrieveKeys(){
	chrome.runtime.sendMessage({message: 'retrieve_keys'})
}

function nameFromURL(websiteURL){
	var websiteParts = websiteURL.replace(/\/$/,'').split(':')[1].replace(/\/\//,'').split('?')[0].split('#')[0].split('.');
	if(websiteParts.length > 1){
		if(websiteParts[websiteParts.length - 1].match(/htm|php/)) websiteParts = websiteParts.slice(0,websiteParts.length - 1);  //remove final html or php
		if(websiteParts.length > 1){
			var	websiteParts2 = websiteParts[websiteParts.length - 2].split('/'),
				websiteParts3 = websiteParts[websiteParts.length - 1].split('/');
			return websiteParts2[websiteParts2.length - 1] + '.' + websiteParts3[0]
		}else{
			return websiteParts[0]
		}
	}else{
		return websiteParts[0]
	}
}

//now that the receiving code is in place, begin by retrieving data stored in background page
retrieveMaster();
retrieveKeys();

//global variables that will be used in computations
var pwdNumber = 0, hasInputBoxes, cryptoStr = '';

//gets executed with the OK button
function doSynth(clipOn) {
	if(memoArea.style.display == 'block'){					//save memo into field 4, along with everything else
		if(websiteName){
			if(!masterPwd){							//get master Password if not in memory
				openScreen('extraMasterScr');
				extraMasterAction = 'encrypt';
				extraMasterMsg.textContent = "Enter the master Password to save this note securely";
				extraMasterBox.focus();
				return
			}
			if(!memoBox.value.trim()){					//nothing to encrypt, so save an empty string
				var crypto = ''
			}else{											//now really encrypt
				preserveMaster();									//sync only if successful
				var	nonce = nacl.randomBytes(9),
					nonce24 = makeNonce24(nonce),
					plain =	 nacl.util.decodeUTF8(memoBox.value.trim()),
					pwd2 = wiseHash(masterPwd,websiteName),
					cipher = nacl.secretbox(plain,nonce24,pwd2),
					crypto = nacl.util.encodeBase64(concatUint8Arrays(nonce,cipher)).replace(/=+$/,'');
			}
			var jsonfile = {};
			jsonfile[websiteName] = [serial1.value,userID.value,pwdLength.value,cryptoStr,crypto];
    		if(isEmptyJSON(jsonfile)){
				chrome.storage.sync.remove(websiteName)
			}else{
    			chrome.storage.sync.set(jsonfile)
			}
		}
		window.close();
		return
	}
	
	var pwdStr1 = masterPwd1Box.value.trim(),			//get passwords and serials
		serialStr1 = serial1.value.trim(),
		pwdStr2 = masterPwd2Box.value.trim(),
		serialStr2 = serial2.value,					//not trimmed so spaces mean "no serial" rather than "repeat serial"
		pwdStr3 = masterPwd3Box.value.trim(),
		serialStr3 = serial3.value,
		pwdStr4 = masterPwd4Box.value.trim(),
		serialStr4 = serial4.value,
		userStr = userID.value.trim(),
		lengthStr = pwdLength.value.replace(/ /g,'');
		
	if(pwdTable.style.display == 'block' && !pwdStr1 && row2.style.display == 'none'){		//no password in single box
		masterPwdMsg.textContent = "Please enter something or click Cancel";
		return
	}else if(pwdNumber == 1 && serialStr1 == '-' && !cryptoStr){							//raw password to be used, send user back to webpage
		masterPwdMsg.textContent = "If you do not want to synthesize the password, better to enter it directly on the webpage";
		serial1.value = '';
		return
	}
	
	//detect special in "length" box
	if(!lengthStr){												//default length is 44
		lengthStr = 44
	}else if(lengthStr.toLowerCase().match(/al/)){			//alphanumeric case
		var isAlpha = true;
		var digits = lengthStr.match(/[0-9]/g);					//extract digits, default is 44
		lengthStr = digits ? digits.join('') : 44
	}else if(lengthStr.toLowerCase().match(/pin|num/)){		//numeric case
		var isPin = true;
		var digits = lengthStr.match(/[0-9]/g);					//extract digits, default is 4
		lengthStr = digits ? digits.join('') : 4
	}else{															//general case, which may include special characters
		var spChars = lengthStr.match(/[^A-Za-z0-9]/g);			//detect special characters and add them to the alphabet
		if(spChars) base = base62 + spChars.join('');
		var digits = lengthStr.match(/[0-9]/g);					//extract digits, default is 44
		lengthStr = digits ? digits.join('') : 44
	}
	
	masterPwdMsg.style.color = '';
	blinkMsg(masterPwdMsg);
	
	setTimeout(function(){														//the rest after a 0 ms delay
		if(pwdTable.style.display == 'block'){					//do passwords if the boxes are displayed, otherwise, just userName
			var pwdOut = [],			//compute the new password into an array
				newPwd = pwdSynth(1,pwdStr1,serialStr1,isPin,isAlpha);
			if(!newPwd) return;								//bail out if just erasing stored password
			pwdOut.push(newPwd.slice(0,lengthStr));
			
			if(clipOn) copyStr(newPwd.slice(0,lengthStr));	//copy this one to clipboard if so directed
	
	//fill missing inputs and compute the rest of the passwords
			if(pwdNumber > 1){
				if(!pwdStr2) pwdStr2 = pwdStr1;
				if(!serialStr2) serialStr2 = serialStr1;
				newPwd = (serial2.value == serial1.value) && (pwdStr2 == pwdStr1) && serialStr2 != '+' ? pwdOut[0] : pwdSynth(2,pwdStr2,serialStr2,isPin,isAlpha);
				pwdOut.push(newPwd.slice(0,lengthStr))
			}
			if(pwdNumber > 2){
				if(!pwdStr3) pwdStr3 = pwdStr2;
				if(!serialStr3) serialStr3 = serialStr2;
				newPwd = (serial3.value == serial2.value) && (pwdStr3 == pwdStr2) ? pwdOut[1] : pwdSynth(3,pwdStr3,serialStr3,isPin,isAlpha);
				pwdOut.push(newPwd.slice(0,lengthStr))
			}
			if(pwdNumber > 3){
				if(!pwdStr4) pwdStr4 = pwdStr3;
				if(!serialStr4) serialStr4 = serialStr3;
				newPwd = (serial4.value == serial3.value) && (pwdStr4 == pwdStr3) ? pwdOut[2] : pwdSynth(4,pwdStr4,serialStr4,isPin,isAlpha);
				pwdOut.push(newPwd.slice(0,lengthStr))
			}
	  	}
		//send new passwords to page
		if(userTable.style.display == 'block'){
    		chrome.tabs.sendMessage(activeTab.id, {message: "clicked_OK", passwords: pwdOut, userID: userStr})
		}else{
			chrome.tabs.sendMessage(activeTab.id, {message: "clicked_OK", passwords: pwdOut})
		}
		
		setTimeout(function(){				//close window after 2 seconds in case the content script does not reply
			window.close();
	  	}, 2000);
	},0)
}

//detect so empty sync entries can be removed
function isEmptyJSON(jsonFile){
	var isEmpty = true;
	for(var name in jsonFile){
		var length = jsonFile[name].length;
		for(var i = 0; i < length; i++){
			isEmpty = isEmpty && !jsonFile[name][i]
		}
	}
	return isEmpty
}

var sitePwd = '';			//to store a user-given password

//synthesizes a new password, or stores and retrieves one provided by user
function pwdSynth(boxNumber, pwd, serial, isPin, isAlpha){
	if(!pwd){
		masterPwdMsg.textContent = "Please write your Master Password";
		return
	}
	if(serial == '-'){						//special case to delete stored password, and using Master Password directly in a change password case
		if(!confirm("A dash in the serial box tells me that you want to erase a stored password. Click OK if this is what you want.")) return false;
		cryptoStr = '';					//reset stored password
		serial = '';
		serial1.value = ''; serial2.value = '';serial3.value = ''; serial4.value = '';
		var userStr = userID.value.trim(),
			lengthStr = pwdLength.value.trim(),
			jsonfile = {};
		jsonfile[websiteName] = [serial,userStr,lengthStr,cryptoStr,memoBox.value.trim()];		//and now erase from storage
		if(isEmptyJSON(jsonfile)){
			chrome.storage.sync.remove(websiteName)
		}else{
    		chrome.storage.sync.set(jsonfile)
		}
		masterPwdMsg.textContent = "The stored password has been deleted";
		if(pwdNumber == 1){
			return false
		}else{
			return pwd						//keep going is this is part of a password change
		}
	}else if(serial == '+'){						//use stored password				
		if(cryptoStr && (boxNumber == 1 || !document.getElementById('serial' + boxNumber).value)){						//already stored in encrypted form: decrypt it
			var cipher = nacl.util.decodeBase64(cryptoStr);
			if(!cipher) return false;
			var	nonce = cipher.slice(0,9),												//no marker byte
				nonce24 = makeNonce24(nonce),
				cipher2 = cipher.slice(9),
				pwd2 = wiseHash(pwd,websiteName),
				plain = nacl.secretbox.open(cipher2,nonce24,pwd2);
			if(plain){
				return nacl.util.encodeUTF8(plain)
			}else{
				masterPwdMsg.textContent = "Decryption of stored password has failed"
				return false
			}
		}else{								//not stored or these are extra boxes, so ask for it, encrypt it, to be saved at the end
			if(!sitePwd){
				openScreen('extraMasterScr');
				extraMasterAction = 'sitePwd';
				extraMasterMsg.textContent = "Enter the Password that you want to use for this site";
				extraMasterBox.focus();
				return
			}else{																	//encrypt user-supplied password
				extraMasterAction = 'decrypt';
				var	nonce = nacl.randomBytes(9),
					nonce24 = makeNonce24(nonce),
					plain =	 nacl.util.decodeUTF8(sitePwd),
					pwd2 = wiseHash(pwd,websiteName),
					cipher = nacl.secretbox(plain,nonce24,pwd2);
				cryptoStr = nacl.util.encodeBase64(concatUint8Arrays(nonce,cipher)).replace(/=+$/,'')
				return sitePwd
			}
		}
	//the rest of the options are synthesized through wiseHash
		
	}else if(isPin){				//return only decimal digits, with equal probability
		cryptoStr = '';
		return nacl.util.encodeBase64(wiseHash(pwd,websiteName + serial.trim())).replace(/[AaBbC]/g,'0').replace(/[cDdEe]/g,'1').replace(/[FfGgH]/g,'2').replace(/[hIiJj]/g,'3').replace(/[KkLlM]/g,'4').replace(/[mNnOo]/g,'5').replace(/[PpQqR]/g,'6').replace(/[rSsTt]/g,'7').replace(/[UuVvW]/g,'8').replace(/[wXxYy]/g,'9').match(/[0-9]/g).join('')
	}else if(isAlpha){						//replace extra base64 characters with letters
		cryptoStr = '';
		return nacl.util.encodeBase64(wiseHash(pwd,websiteName + serial.trim())).replace(/\+/g,'a').replace(/\//g,'b').replace(/=/,'c')
	}else{
		cryptoStr = '';
		if(base == base62){				//replace some base64 characters with default special characters
			return nacl.util.encodeBase64(wiseHash(pwd,websiteName + serial.trim())).replace(/[+/=Aa]/g,'_').replace(/[BbCc]/,'!').replace(/[DdEe]/,'#')
		}else{								//change base in order to include the special characters, with equal probability
			return base.charAt(62) + changeBase(nacl.util.encodeBase64(wiseHash(pwd,websiteName + serial.trim())).replace(/=$/g,''), base64, base) 				//use at least the first of the characters on the list
		}
	}
}

var extraMasterAction = 'decrypt';				//so the next function knows what to do after loading the master Password

function acceptextraMaster(){
	var pwd = extraMasterBox.value.trim();
	extraMasterBox.value = '';
	openScreen('synthScr');
	if(extraMasterAction == 'decrypt'){
		masterPwd = pwd;
		fetchWebsiteMemo()
	}else if(extraMasterAction == 'encrypt'){
		masterPwd = pwd;
		doSynth()
	}else if(extraMasterAction == 'sitePwd'){
		sitePwd = pwd;
		doSynth()
	}
}

function cancelextraMaster(){
	if(extraMasterAction == 'decrypt'){
		masterPwdMsg.textContent = "Secure note not decrypted"
	}else if(extraMasterAction == 'encrypt'){
		masterPwdMsg.textContent = "Secure note not saved"
	}else if(extraMasterAction == 'sitePwd'){
		masterPwdMsg.textContent = "User-supplied password not saved"
	}
	openScreen('synthScr')
}

var lastFocus = '1';			//default is first row

//displays Keys strength and executes on Enter
function pwdSynthKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar,
		pwdEl = document.activeElement;
	lastFocus = pwdEl.id.slice(-4,-3);					//get last focused row
	if(!pwdEl.value){									//display Show label and checkbox if empty (hidden for cached password)
		masterPwd1Icon.style.display = ''
	}
	if(key == 13){doSynth()} else{
		 if(pwdEl.value.trim()){
			 keyStrength(pwdEl.value,'masterPwd')
		 }else{
			 masterPwdMsg.textContent = "Please enter the Master Key";
			 masterPwdMsg.style.color = ''
		 }
	}
}

function userKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(key == 13) doStuff()
}

//for cases with user-specified special characters
var base62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
	base = base62;
	
//to select the result in Help synthesizer
function copyOutput(){
  if(outputBox.textContent.trim() != ''){
    var range, selection;
    if(document.body.createTextRange){
        range = document.body.createTextRange();
        range.moveToElementText(outputBox);
        range.select()
    }else if (window.getSelection){
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(outputBox);
        selection.removeAllRanges();
        selection.addRange(range)
    }
	document.execCommand('copy');
	outputBox.textContent = '';
	helpMsg.textContent = "Output copied to clipboard"
  }
}

//this part of the code is to synthesize passwords using the fields in the last Help item
function doStuffHelp() {
	websiteName = siteName.value.toLowerCase();			//get all the data
	var	pwdStr = masterPwdHelp.value,	
		serialStr = serialHelp.value,
		lengthStr = pwdLengthHelp.value.replace(/ /g,'');
		
	if(!pwdStr){																//no password in box
		helpMsg.textContent = "Please enter your master Password";
		return
	}
	if(!websiteName){																//no website in box
		helpMsg.textContent = "Please enter the website name as name.suffix or name.suffix.countryID";
		return
	}
	var websiteParts = websiteName.split('.');
	if(websiteParts.length != 2 && !(websiteParts.length == 3 && websiteParts[2].length == 2)){
		helpMsg.textContent = "The website name should contain only two or three pieces of text with dots between them";
		return
	}
	if(websiteParts.length == 3 && websiteParts[1].length > 3) websiteName = websiteParts.slice(-2).join('.'); //correction for long STL

	//detect special in "length" box
	if(!lengthStr){												//default length is 44
		lengthStr = 44
	}else if(lengthStr.toLowerCase().match(/al/)){			//alphanumeric case
		var isAlpha = true;
		var digits = lengthStr.match(/[0-9]/g);					//extract digits, default is 44
		lengthStr = digits ? digits.join('') : 44
	}else if(lengthStr.toLowerCase().match(/pin|num/)){		//numeric case
		var isPin = true;
		var digits = lengthStr.match(/[0-9]/g);					//extract digits, default is 4
		lengthStr = digits ? digits.join('') : 4
	}else{															//general case, which may include special characters
		var spChars = lengthStr.match(/[^A-Za-z0-9]/g);			//detect special characters and add them to the alphabet
		if(spChars) base = base62 + spChars.join('');
		var digits = lengthStr.match(/[0-9]/g);					//extract digits, default is 44
		lengthStr = digits ? digits.join('') : 44
	}

	helpMsg.style.color = '';
	blinkMsg(helpMsg);
	
	setTimeout(function(){														//the rest after a 10 ms delay
		helpMsg.textContent = "Password synthesized. Copy it now";
		outputBox.textContent = pwdSynth(pwdStr,serialStr,isPin,isAlpha).slice(0,lengthStr);
		masterPwdHelp.value = '';
		siteName.value = '';
		websiteName = '';
		pwdLengthHelp.value = '';
		serialHelp.value = '';
	},10);
}

//to display password strength
function pwdKeyupHelp(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(key == 13){doStuffHelp()} else{
		 if(masterPwdHelp.value){
			 keyStrength(masterPwdHelp.value,true,true)
		 }else{
			 helpMsg.textContent = "Please enter the Master Key"
		 }
	}
}

//displays output password length
function outputKeyup(){
	helpMsg.textContent = "Output is " + outputBox.textContent.length + " characters long"
}

//for copying the result to clipboard. Uses invisible input element.
function copyStr(string){
	var box = document.createElement('textarea');
	box.value = string;
	document.body.appendChild(box);
	box.focus();
	box.select();
	document.execCommand('copy');
	document.body.removeChild(box)
}