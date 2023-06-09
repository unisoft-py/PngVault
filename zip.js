// TODO: $?
// TODO: Use modules!
// TODO: To semicolon or not to semicolon?

function encode(image, files) {
	console.log("Encoding files", files, "into", image); // TODO: delete this line
	let chunks = decodePNG(new Uint8Array(image));
	// TODO: I don't like this, but Egor has asked me to do this
	if (chunks == null) return null;
	let archive = { type: "egOr", content: encodeFile(files) };
	return encodePNG([chunks[0]].concat([archive], chunks.slice(1)));
}

function decode(pngArchive) {
	console.log("Decoding archive [" + new Uint8Array(pngArchive).join() + "]"); // TODO: delete this line
	let chunks = decodePNG(new Uint8Array(pngArchive));
	// TODO: I don't like this, but Egor has asked me to do this
	if (chunks == null) return { image: null, files: null };
	let i = 0;
	for (i = 0; chunks[i].type != "egOr"; i++)
		if (i + 1 == chunks.length)
			return { image: pngArchive, files: null };
	let files = decodeFile(chunks.splice(i, 1)[0].content);
	let image = encodePNG(chunks);
	return { image, files };
}

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
	return png.buffer;
}

function decodePNG(bytes) {
	for (let i = 0; i < 8; i++)
		if (bytes[i] != [137, 80, 78, 71, 13, 10, 26, 10][i])
			return null;
	let offset = 8;
	let chunks = [];
	while (offset < bytes.length) {
		let chunkSize = decodeInt32(bytes.subarray(offset, offset + 4));
		let type = new TextDecoder().decode(bytes.subarray(offset + 4, offset + 8));
		let content = bytes.subarray(offset + 8, offset + 8 + chunkSize)
		offset += 8 + chunkSize + 4;
		chunks.push({ type, content });
	}
	return chunks;
}

function encodeFile(file) {
	// TODO: ArrayBuffer or Uint8Array?
	if (file.constructor == ArrayBuffer)
		return new Uint8Array([0, ...(new Uint8Array(file))]);
	// TODO: Are directories files?
	let directory = file;
	let content = [];
	// TODO: Use more elegant length calculation
	let contentLength = 0;
	for (let fileName in directory) {
		// TODO: Find another way to encode string into bytes
		let encodedName = new TextEncoder("utf-8").encode(fileName);
		let encodedContent = encodeFile(directory[fileName]);
		let encodedFile = new Uint8Array([
			...encodedName, 0,
			...encodeInt32(encodedContent.length), ...encodedContent
		]);
		contentLength += encodedFile.length;
		content.push(encodedFile);
	}
	// TODO: Implement offset calculation using reduce() equivalent
	let offset = 0;
	let encodedDirectory = new Uint8Array(contentLength);
	// TODO: Implement separate function for Uint8Array concatenation
	content.forEach(encodeFile => {
		encodedDirectory.set(encodeFile, offset);
		offset += encodeFile.length;
	});
	return encodedDirectory;
}

function decodeFile(bytes) {
	if (bytes[0] == 0) {
		// TODO: ArrayBuffer or Uint8Array?
		let file = new ArrayBuffer(bytes.length - 1);
		let fileBytes = new Uint8Array(file);
		for (let i = 0; i < fileBytes.length; i++)
			fileBytes[i] = bytes[i + 1];
		return file;
	}
	let offset = 0;
	let directory = {};
	while (offset < bytes.length) {
		let i = offset;
		while (bytes[i] ?? 0 != 0) i++;
		let fileName = new TextDecoder().decode(bytes.subarray(offset, i));
		let fileSize = decodeInt32(bytes.subarray(i + 1, i + 5));
		directory[fileName] = decodeFile(bytes.subarray(i + 5, i + 5 + fileSize));
		offset = i + fileSize + 5;
	}
	return directory;
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

function decodeInt32(bytes) {
	return (
		(bytes[0] << 24) +
		(bytes[1] << 16) +
		(bytes[2] << 8) +
		bytes[3]
	);
}
