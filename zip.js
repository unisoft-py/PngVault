// TODO: $?
// TODO: Use modules!
// TODO: To semicolon or not to semicolon?

function encodePNG(chunks) {
	let encodedChunks = [];
	let contentLength = 0;
	for (let chunk of chunks) {
		let { type, content } = chunk;
		let encodedContent = new Uint8Array([
			...(new TextEncoder("utf-8").encode(type)),
			...content
		]);
		let encodedChunk = new Uint8Array([
			...encodeInt32(content.length),
			...encodedContent,
			...encodeInt32(crc32(encodedContent))
		]);
		encodedChunks.push(encodedChunk);
		contentLength += encodedChunk.length;
	}
	// TODO: Implement offset calculation using reduce() equivalent
	let offset = 8;
	let png = new Uint8Array(contentLength + offset);
	// TODO: What the fuck have I written?
	for (let i = 0; i < 8; i++) png[i] = [137, 80, 78, 71, 13, 10, 26, 10][i];
	// TODO: Implement separate function for Uint8Array concatenation
	encodedChunks.forEach(chunk => {
		png.set(chunk, offset);
		offset += chunk.length;
	});
	return png;
}

// TODO: Why does not js have builtin CRC32?
function crc32(bytes) {
	let a = 0;
	let o = [];
	// TODO: Split this function into table generation and crc32 calculation
	for (let c = 0; c < 256; c++) {
		a = c;
		for (let f = 0; f < 8; f++)
			a = 1 & a ? 3988292384 ^ a >>> 1 : a >>> 1;
		o[c] = a
	}
	// TODO: Split this function right here!
	let n = -1;
	for (let t = 0; t < bytes.length; t++)
		n = n >>> 8 ^ o[255 & (n ^ bytes[t])];
	return (-1 ^ n) >>> 0
};

function encodeInt32(number) {
	return new Uint8Array([
		(number & 0xff000000) >> 24,
		(number & 0x00ff0000) >> 16,
		(number & 0x0000ff00) >> 8,
		(number & 0x000000ff)
	]);
}
