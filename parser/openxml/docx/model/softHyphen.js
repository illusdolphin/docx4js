'use strict'

class softHyphen extends require('./text'){
	static get type(){return 'softHyphen'}
	getText(){
		return String.fromCharCode(0xAD)
	}
}


module.exports=softHyphen
