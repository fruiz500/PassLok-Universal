# PassLok Universal
PassLok Universal is a Chrome and Firefox extension that adds PassLok encryption to webmail apps. It is based on PassLok for Email, but it supports just about any web mail service while the other extension is restricted to Gmail, Yahoo, and Outlook online. It also includes the password-generating code of SynthPass. It is distributed as an extension for Chrome and its derivatives at https://chrome.google.com/webstore/detail/passlok-for-email/ehakihemolfjgbbfhkbjgahppbhecclh and for Firefox at https://addons.mozilla.org/en-US/firefox/addon/passlok-for-email/

PassLok Universal is powerful, since it is based on NaCl (tweetNaCl JavaScript version, published here on GitHub), including the 256 bit XSalsa20 symmetric cipher and Curve25519 functions for asymmetric encryption. PassLok Universal also includes the WiseHash variable-strength key derivation algorithm so users are not restricted in their choice of private keys. It includes four main modes of encryption: Signed, Read-once (similar to Off-The-Record messaging, but for email), Anonymous, and shared Password (symmetric), plus text steganography (concealed and Invisible modes) and image steganography (into PNG or JPG images). Encrypted data can be can be part of the email body or be in the attachments.

PassLok Universal is also designed to be very easy to use. The sender's Lock (public key) is added to every encrypted message, and retrieved automatically on the recipient's end so he/she does not need to bother with key management chores. The only key-management action requested of the user is entering his/her secret Password, from which the private key derives when the encryption engine is initialized. The private key is retained in memory for five minutes beyond the last use of it and then deleted. It is never stored in any way.

The extensions published in the Chrome and Firefox stores are identical, except for the manifest.json file. Those files are renamed in this repo so you know which is which.

First version is 0.5.1, so it begins (and hopefully stays) in sync with PassLok for Email, also on GitHub.

