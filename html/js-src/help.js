//to select the result
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
	masterHelpMsg.textContent = "Output copied to clipboard"
  }
}

//this part of the code is to synthesize passwords using the fields in the last Help item
function doStuffHelp(e) {
	websiteName = siteName.value.toLowerCase();			//get all the data
	var	pwdStr = masterHelpBox.value,	
		serialStr = serial.value,
		lengthStr = pwdLength.value.replace(/ /g,'');
		
	if(!pwdStr){																//no password in box
		masterHelpMsg.textContent = "Please enter your master Password";
		return
	}
	if(!websiteName){																//no website in box
		masterHelpMsg.textContent = "Please enter the website name as name.suffix or name.suffix.countryID";
		return
	}
	var websiteParts = websiteName.split('.');
	if(websiteParts.length != 2 && !(websiteParts.length == 3 && websiteParts[2].length == 2)){
		masterHelpMsg.textContent = "The website name should contain only two or three pieces of text with dots between them";
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

	masterHelpMsg.textContent = '';
	var blinker = document.createElement('span');
	blinker.className = "blink";
	blinker.textContent = 'PROCESSING';
	masterHelpMsg.appendChild(blinker);
	
	setTimeout(function(){														//the rest after a 10 ms delay
		masterHelpMsg.textContent = "Password synthesized. Copy it now";
		outputBox.textContent = pwdSynth(pwdStr,serialStr,isPin,isAlpha).slice(0,lengthStr);
		masterHelpBox.value = '';
		siteName.value = '';
		websiteName = '';
		pwdLength.value = '';
		serial.value = '';
	},10);
}

//synthesizes a new password
function pwdSynth(pwd, serial, isPin, isAlpha){
	if(serial == '-' || serial == '+'){
		masterHelpMsg.textContent = "Only synthesized passwords are supported by this app";
		return ''
	}else if(isPin){				//return only decimal digits, with equal probability
		return nacl.util.encodeBase64(wiseHash(pwd,websiteName + serial)).replace(/[AaBbC]/g,'0').replace(/[cDdEe]/g,'1').replace(/[FfGgH]/g,'2').replace(/[hIiJj]/g,'3').replace(/[KkLlM]/g,'4').replace(/[mNnOo]/g,'5').replace(/[PpQqR]/g,'6').replace(/[rSsTt]/g,'7').replace(/[UuVvW]/g,'8').replace(/[wXxYy]/g,'9').match(/[0-9]/g).join('')
	}else if(isAlpha){						//replace extra base64 characters with letters
		return nacl.util.encodeBase64(wiseHash(pwd,websiteName + serial)).replace(/\+/g,'a').replace(/\//g,'b').replace(/=/,'c')
	}else{
		if(base == base62){				//replace some base64 characters with default special characters
			return nacl.util.encodeBase64(wiseHash(pwd,websiteName + serial)).replace(/[+/=Aa]/g,'_').replace(/[BbCc]/,'!').replace(/[DdEe]/,'#')
		}else{								//change base in order to include the special characters, with equal probability
			return base.charAt(62) + changeBase(nacl.util.encodeBase64(wiseHash(pwd,websiteName + serial)).replace(/=$/g,''), base64, base) 				//use at least the first of the characters on the list
		}
	}
}

//to display password strength
function pwdKeyupHelp(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(key == 13){doStuff()} else{
		 if(masterHelpBox.value){
			 keyStrength(masterHelpBox.value,'masterHelp')
		 }else{
			 masterHelpMsg.textContent = "Please enter the Master Password"
		 }
	}
}

//this for showing and hiding text in masterHelpBox
function showPwd(){
	if(masterHelpBox.type == "password"){
		masterHelpBox.type = "text";
		masterHelpIcon.src = "../img/hideImg.png"
	}else{
		masterHelpBox.type = "password";
		masterHelpIcon.src = "../img/eyeImg.png"
	}
}

//displays output password length
function outputKeyup(){
	masterHelpMsg.textContent = "Output is " + outputBox.textContent.length + " characters long"
}

//for opening one item at a time in the Help screen, with animation
function openHelp(){
	var helpItems = document.getElementsByClassName('helpitem');
	for(var i = 0; i < helpItems.length; i++){					//hide all help texts
		var panel = helpItems[i].nextElementSibling;
		panel.style.maxHeight = null;
	}
	var panel = this.nextElementSibling;							//except for the one clicked
	panel.style.maxHeight = panel.scrollHeight + "px"	     
}

//the next few functions are repeated from keylock.js
//function to test key strength and come up with appropriate key stretching. Based on WiseHash
function keyStrength(string,loc) {
	var entropy = entropycalc(string),
		msg,colorName;

	if(entropy == 0){
		msg = 'This is a known bad Password!';
		colorName = 'magenta'
	}else if(entropy < 20){
		msg = 'Terrible!';
		colorName = 'magenta'
	}else if(entropy < 40){
		msg = 'Weak!';
		colorName = 'red'
	}else if(entropy < 60){
		msg = 'Medium';
		colorName = 'darkorange'
	}else if(entropy < 90){
		msg = 'Good!';
		colorName = 'green'
	}else if(entropy < 120){
		msg = 'Great!';
		colorName = 'blue'
	}else{
		msg = 'Overkill  !!';
		colorName = 'cyan'
	}

	var iter = Math.max(1,Math.min(20,Math.ceil(24 - entropy/5)));			//set the scrypt iteration exponent based on entropy: 1 for entropy >= 120, 20(max) for entropy <= 20

	var seconds = time10/10000*Math.pow(2,iter-8);			//to tell the user how long it will take, in seconds
	var msg = 'Password strength: ' + msg + '\r\nUp to ' + Math.max(0.01,seconds.toPrecision(3)) + ' sec. to process';
	if(loc){
		var msgName = loc.replace(/[0-9]/,'') + 'Msg';			//remove numbers because synth screen messages are not numbered
		document.getElementById(msgName).textContent = msg;
		hashili(msgName,string);
		document.getElementById(msgName).style.color = colorName
	}
	return iter
};

var time10 = 200;			//works well for core2-duo processors

//for cases with user-specified special characters
var base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
	base62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
	base = base62;

//from http://snippetrepo.com/snippets/bignum-base-conversion, by kybernetikos
function changeBase(number, inAlpha, outAlpha) {
	var targetBase = outAlpha.length,
		originalBase = inAlpha.length;
    var result = "";
    while (number.length > 0) {
        var remainingToConvert = "", resultDigit = 0;
        for (var position = 0; position < number.length; ++position) {
            var idx = inAlpha.indexOf(number[position]);
            if (idx < 0) {
                throw new Error('Symbol ' + number[position] + ' from the'
                    + ' original number ' + number + ' was not found in the'
                    + ' alphabet ' + inAlpha);
            }
            var currentValue = idx + resultDigit * originalBase;
            var remainDigit = Math.floor(currentValue / targetBase);
            resultDigit = currentValue % targetBase;
            if (remainingToConvert.length || remainDigit) {
                remainingToConvert += inAlpha[remainDigit];
            }
        }
        number = remainingToConvert;
        result = outAlpha[resultDigit] + result;
    }
    return result;
}

//takes a string and calculates its entropy in bits, taking into account the kinds of characters used and parts that may be in the general wordlist (reduced credit) or the blacklist (no credit)
function entropycalc(string){

//find the raw Keyspace
	var numberRegex = new RegExp("^(?=.*[0-9]).*$", "g");
	var smallRegex = new RegExp("^(?=.*[a-z]).*$", "g");
	var capRegex = new RegExp("^(?=.*[A-Z]).*$", "g");
	var base64Regex = new RegExp("^(?=.*[/+]).*$", "g");
	var otherRegex = new RegExp("^(?=.*[^a-zA-Z0-9/+]).*$", "g");

	string = string.replace(/\s/g,'');										//no credit for spaces

	var Ncount = 0;
	if(numberRegex.test(string)){
		Ncount = Ncount + 10;
	}
	if(smallRegex.test(string)){
		Ncount = Ncount + 26;
	}
	if(capRegex.test(string)){
		Ncount = Ncount + 26;
	}
	if(base64Regex.test(string)){
		Ncount = Ncount + 2;
	}
	if(otherRegex.test(string)){
		Ncount = Ncount + 31;											//assume only printable characters
	}

//start by finding words that might be on the blacklist (no credit)
	string = reduceVariants(string);
	var wordsFound = string.match(blackListExp);							//array containing words found on the blacklist
	if(wordsFound){
		for(var i = 0; i < wordsFound.length;i++){
			string = string.replace(wordsFound[i],'');						//remove them from the string
		}
	}

//now look for regular words on the wordlist
	wordsFound = string.match(wordListExp);									//array containing words found on the regular wordlist
	if(wordsFound){
		wordsFound = wordsFound.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});	//remove duplicates from the list
		var foundLength = wordsFound.length;							//to give credit for words found we need to count how many
		for(var i = 0; i < wordsFound.length;i++){
			string = string.replace(new RegExp(wordsFound[i], "g"),'');									//remove all instances
		}
	}else{
		var foundLength = 0;
	}

	string = string.replace(/(.+?)\1+/g,'$1');								//no credit for repeated consecutive character groups

	if(string != ''){
		return (string.length*Math.log(Ncount) + foundLength*Math.log(wordLength + blackLength))/Math.LN2
	}else{
		return (foundLength*Math.log(wordLength + blackLength))/Math.LN2
	}
}

//take into account common substitutions, ignore spaces and case
function reduceVariants(string){
	return string.toLowerCase().replace(/[óòöôõo]/g,'0').replace(/[!íìïîi]/g,'1').replace(/[z]/g,'2').replace(/[éèëêe]/g,'3').replace(/[@áàäâãa]/g,'4').replace(/[$s]/g,'5').replace(/[t]/g,'7').replace(/[b]/g,'8').replace(/[g]/g,'9').replace(/[úùüû]/g,'u');
}

//makes 'pronounceable' hash of a string, so user can be sure the password was entered correctly
var vowel = 'aeiou',
	consonant = 'bcdfghjklmnprstvwxyz',
	hashiliTimer;
function hashili(msgID,string){
	var element = document.getElementById(msgID);
	clearTimeout(hashiliTimer);
	hashiliTimer = setTimeout(function(){
		if(!string.trim()){
			element.innerText += ''
		}else{
			var code = nacl.hash(nacl.util.decodeUTF8(string.trim())).slice(-2),			//take last 4 bytes of the SHA512		
				code10 = ((code[0]*256)+code[1]) % 10000,		//convert to decimal
				output = '';

			for(var i = 0; i < 2; i++){
				var remainder = code10 % 100;								//there are 5 vowels and 20 consonants; encode every 2 digits into a pair
				output += consonant[Math.floor(remainder / 5)] + vowel[remainder % 5];
				code10 = (code10 - remainder) / 100
			}
			element.innerText += '\n' + output
		}
	}, 1000);						//one second delay to display hashili
}

//stretches a password string with a salt string to make a 256-bit Uint8Array Password
function wiseHash(string,salt){
	var iter = keyStrength(string,false),
		secArray = new Uint8Array(32),
		keyBytes;
	if(salt.length == 43) iter = 1;								//random salt: no extra stretching needed
	scrypt(string,salt,iter,8,32,0,function(x){keyBytes=x;});
	for(var i=0;i<32;i++){
			secArray[i] = keyBytes[i]
	}
	return secArray
}
//end of functions from keylock.js

//add event listeners
window.onload = function() {
	var helpHeaders = document.getElementsByClassName("helpitem");		//add listeners to all the help headers

	for (var i = 0; i < helpHeaders.length; i++) {
		helpHeaders[i].addEventListener('click', openHelp);
	}
		
	okBtn.addEventListener('click', doStuffHelp);								//execute
	masterHelpIcon.addEventListener('click', function(){showPwd('Help')});
	copyBtn.addEventListener('click', copyOutput);
	
	masterHelpBox.addEventListener('keyup', pwdKeyupHelp, false);
	outputBox.addEventListener('keyup', outputKeyup, false)
}
