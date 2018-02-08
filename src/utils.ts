import BN from 'bignumber.js'
import {SHA256, enc} from 'crypto-js'

/* 
* format date to 'YYYY-MM-DD hh:mm:ss'
*/
export const formatDate = (date : Date) =>  {
	let YYYY = date.getFullYear(),
		MM = date.getMonth()+1,
		DD = date.getDate(),
		hh = date.getHours(),
		mm = date.getMinutes(),
		ss = date.getSeconds()
	return YYYY + '-' + (MM > 9?MM : '0'+MM) + '-' + 
	(DD > 9? DD : '0'+DD) + ' ' + hh + ':' + mm + ':' + ss;
}
/**
 * Performs 2 SHA256.
 * @param {string} hex - String to hash
 * @returns {string} hash output
 */
export const hash256 = (hex) => {
	if (typeof hex !== 'string') throw new Error('reverseHex expects a string')
	if (hex.length % 2 !== 0) throw new Error(`Incorrect Length: ${hex}`)
	let hexEncoded = enc.Hex.parse(hex)
	let ProgramSha256 = SHA256(hexEncoded).toString()
	return SHA256(ProgramSha256).toString()
}

export function hexstring2ab(str:string): number[] {
	var result = [];
	while (str.length >= 2) {
		result.push(parseInt(str.substring(0, 2), 16));
		str = str.substring(2, str.length);
	}

	return result;
}

export function ab2hexstring(arr: any): string {
    let result: string = "";
    let uint8Arr: Uint8Array = new Uint8Array(arr);
	for ( let i = 0; i < uint8Arr.byteLength; i++) {
		var str = uint8Arr[i].toString(16);
		str = str.length == 0 ? "00" :
			str.length == 1 ? "0" + str :
				str;
		result += str;
	}
	return result;
}

export function hexXor(str1:string, str2:string): string {
	if (str1.length !== str2.length) throw new Error('strings are disparate lengths')
	if (str1.length % 2 !== 0) throw new Error('strings must be hex')

	let result = new ArrayBuffer(str1.length/2);
	let result8 = new Uint8Array(result);
	for (let i = 0; i < str1.length; i += 2) {
		result8[i/2] = (parseInt(str1.substr(i, 2), 16) ^ parseInt(str2.substr(i, 2), 16))
	}
	return ab2hexstring(result)
  }

/**
* Converts a number to a big endian hexstring of a suitable size, optionally little endian
* @param {number} num
* @param {number} size - The required size in bytes, eg 1 for Uint8, 2 for Uint16. Defaults to 1.
* @param {boolean} littleEndian - Encode the hex in little endian form
* @return {string}
*/
export const num2hexstring = (num, size = 1, littleEndian = false) => {
	if (typeof num !== 'number') throw new Error('num must be numeric')
	if (num < 0) throw new RangeError('num is unsigned (>= 0)')
	if (size % 1 !== 0) throw new Error('size must be a whole integer')
	if (!Number.isSafeInteger(num)) throw new RangeError(`num (${num}) must be a safe integer`)
	size = size * 2
	let hexstring = num.toString(16)
	hexstring = hexstring.length % size === 0 ? hexstring : ('0'.repeat(size) + hexstring).substring(hexstring.length)
	if (littleEndian) hexstring = reverseHex(hexstring)
	return hexstring
}

/**
 * Converts a number to a variable length Int. Used for array length header
 * @param {number} num - The number
 * @returns {string} hexstring of the variable Int.
 */
export const num2VarInt = (num) => {
	if (num < 0xfd) {
		return num2hexstring(num)
	} else if (num <= 0xffff) {
		// uint16
		return 'fd' + num2hexstring(num, 2, true)
	} else if (num <= 0xffffffff) {
		// uint32
		return 'fe' + num2hexstring(num, 4, true)
	} else {
		// uint64
		return 'ff' + num2hexstring(num, 8, true)
	}
}

/**
 * Reverses a HEX string, treating 2 chars as a byte.
 * @example
 * reverseHex('abcdef') = 'efcdab'
 * @param {string} hex - HEX string
 * @return {string} HEX string reversed in 2s.
 */
export const reverseHex = hex => {
	if (typeof hex !== 'string') throw new Error('reverseHex expects a string')
	if (hex.length % 2 !== 0) throw new Error(`Incorrect Length: ${hex}`)
	let out = ''
	for (let i = hex.length - 2; i >= 0; i -= 2) {
		out += hex.substr(i, 2)
	}
	return out
}


/**
 * @class Fixed8
 * @classdesc A wrapper around bignumber.js that adds on helper methods commonly used in neon-js
 * @param {string|int} value
 * @param {number} [base]
 */
export class Fixed8 extends BN {
	constructor(input, base = undefined) {
		if (typeof input === 'number') input = input.toFixed(8)
		super(input, base)
	}

	toHex() {
		const hexstring = this.mul(100000000).round().toString(16)
		return '0'.repeat(16 - hexstring.length) + hexstring
	}

	toReverseHex() {
		return reverseHex(this.toHex())
	}

	// [util.inspect.custom](depth, opts) {
	// 	return this.toFixed(8)
	// }

	static fromHex(hex) {
		return new Fixed8(hex, 16).div(100000000)
	}

	static fromReverseHex(hex) {
		return this.fromHex(reverseHex(hex))
	}

	/**
	 * Returns a Fixed8 whose value is rounded upwards to the next whole number.
	 * @return {Fixed8}
	 */
	ceil() {
		return new Fixed8(super.ceil())
	}

	/**
	 * Returns a Fixed8 whose value is rounded downwards to the previous whole number.
	 * @return {Fixed8}
	 */
	floor() {
		return new Fixed8(super.floor())
	}

	/**
	 * Returns a Fixed8 rounded to the nearest dp decimal places according to rounding mode rm.
	 * If dp is null, round to whole number.
	 * If rm is null, round according to default rounding mode.
	 * @param {number} [dp]
	 * @param {number} [rm]
	 * @return {Fixed8}
	 */
	round(dp = null, rm = null) {
		return new Fixed8(super.round(dp, rm))
	}

	/**
	 * See [[dividedBy]]
	 * @param {string|number|Fixed8}
	 * @param {number} [base]
	 * @return {Fixed8}
	 */
	div(n, base = null) {
		return this.dividedBy(n, base)
	}

	/**
	 * Returns a Fixed8 whose value is the value of this Fixed8 divided by `n`
	 * @param {string|number|Fixed8}
	 * @param {number} [base]
	 * @return {Fixed8}
	 * @alias [[div]]
	 */
	dividedBy(n, base = null) {
		return new Fixed8(super.dividedBy(n, base))
	}

	/**
	 * See [[times]]
	 * @param {string|number|Fixed8}
	 * @param {number} [base]
	 * @return {Fixed8}
	 */
	mul(n, base = null) {
		return this.times(n, base)
	}

	/**
	 * Returns a Fixed8 whose value is the value of this Fixed8 multipled by `n`
	 * @param {string|number|Fixed8}
	 * @param {number} [base]
	 * @return {Fixed8}
	 * @alias [[mul]]
	 */
	times(n, base = null) {
		return new Fixed8(super.times(n, base))
	}

	/**
	 * See [[plus]]
	 * @param {string|number|Fixed8}
	 * @param {number} [base]
	 * @return {Fixed8}
	 */
	add(n, base = null) {
		return this.plus(n, base)
	}

	/**
	 * Returns a Fixed8 whose value is the value of this Fixed8 plus `n`
	 * @param {string|number|Fixed8}
	 * @param {number} [base]
	 * @return {Fixed8}
	 * @alias [[add]]
	 */
	plus(n, base = null) {
		return new Fixed8(super.plus(n, base))
	}

	/**
	 * See [[minus]]
	 * @param {string|number|Fixed8}
	 * @param {number} [base]
	 * @return {Fixed8}
	 */
	sub(n, base = null) {
		return this.minus(n, base)
	}

	/**
	 * Returns a Fixed8 whose value is the value of this Fixed8 minus `n`
	 * @param {string|number|Fixed8}
	 * @param {number} [base]
	 * @return {Fixed8}
	 * @alias [[sub]]
	 */
	minus(n, base = null) {
		return new Fixed8(super.minus(n, base))
	}
}

/**
 * @class StringStream
 * @classdesc A simple string stream that allows user to read a string byte by byte using read().
 * @param {string} str - The string to read as a stream.
 */
export class StringStream {
	constructor(str = '') {
		this.str = str
		this.pter = 0
	}

	/**
	 * Checks if reached the end of the stream. Does not mean stream is actually empty (this.str is not empty)
	 * @returns {boolean}
	 */
	isEmpty() {
		return this.pter >= this.str.length
	}

	/**
	 * Reads some bytes off the stream.
	 * @param {number} bytes - Number of bytes to read
	 * @returns {string}
	 */
	read(bytes) {
		if (this.isEmpty()) throw new Error()
		const out = this.str.substr(this.pter, bytes * 2)
		this.pter += bytes * 2
		return out
	}

	/**
	 * Reads some bytes off the stream using the first byte as the length indicator.
	 * @return {string}
	 */
	readVarBytes() {
		return this.read(this.readVarInt())
	}

	/**
	 * Reads a variable Int.
	 * @returns {number}
	 */
	readVarInt() {
		let len = parseInt(this.read(1), 16)
		if (len === 0xfd) len = parseInt(reverseHex(this.read(2)), 16)
		else if (len === 0xfe) len = parseInt(reverseHex(this.read(4)), 16)
		else if (len === 0xff) len = parseInt(reverseHex(this.read(8)), 16)
		return len
	}
}

export class EventEmitter {
	handlers : {  }
	constructor(){
		this.handlers = {}
	}

	//register event type and handler
	on ( type : string, handler : ()=> void) {
		if(typeof this.handlers[type] == 'undefined') {
			this.handlers[type] = []
		}
		this.handlers[type].push(handler)
	}

	//trigger event
	//@param { string } type 
	//@param { any } event , is the parameter
	trigger (type : string, event? : any) {
		if(this.handlers[type] instanceof Array) {
			var handlers = this.handlers[type]
			for(let i = 0, len = handlers.length; i< len; i++) {
				handlers[i](event)
			}
		}
	}

	//remove event listener
	off (type : string) {
		delete this.handlers[type]
	}
}