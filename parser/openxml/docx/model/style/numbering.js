"use strict"
class Numbering extends require('../style'){
	static get type(){return 'style.numbering'}

	getNumId(){
		return this.wXml.$1('numId').attr('w:val')
	}

	asNumberingStyle(){
		return this.wDoc.style.get(require('./list').asStyleId(this.getNumId()))
	}
}

module.exports=Numbering
