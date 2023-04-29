$(_=>{

$.get('files/load_drop.svg', data => window.$loadDropSvg = $($(data).get(0).firstChild))
$.get('files/image.svg', data => window.$imageSvg = $($(data).get(0).firstChild))
$.get('files/file.svg', data => window.$fileSvg = $($(data).get(0).firstChild))
$.get('files/folder.svg', data => window.$folderSvg = $($(data).get(0).firstChild))
$.get('files/delete_file.svg', data => window.$deleteFileSvg = $($(data).get(0).firstChild))


var $imageContainer = $('#image-container')
window.uploadedImage = null

var $filesContainer = $('#files-container')
window.uploadedFiles = null

var $selectFiles = $('<input>')
    .attr('type', 'file')
    .on('change', function(event) {
        event.preventDefault()
        if ($(this).attr('webkitdirectory')) {
            let path = event.target.files[0].webkitRelativePath.replace(/\\/g, '/')
            let folderName = path.substring(0, path.indexOf('/'))
            filesPathIterating(folderName, event.target.files)
        }
        else if ($(this).attr('multiple'))
            getFiles(event.target.files)
        else {
            let file = event.target.files[0]
            if (file.type === 'image/png')
                getImage(file)
        }

        $(this).val('')
    })
$('#back-folder-btn').css('visibility', 'hidden')


var lastDragover, imagePanelState = 0, filesPanelState = 0
setInterval(_ => {
    if (new Date() - lastDragover <= 100) {
        if (imagePanelState != 1) {
            $imageContainer
                .addClass('drop-area')
                .empty()
                .text('drop image here')
                .prepend($loadDropSvg.clone())
            imagePanelState = 1
        }

        if (filesPanelState != 2) {
            $filesContainer
                .addClass('drop-area')
                .addClass('center')
                .data('inner', $filesContainer.children())
                .empty()
                .text('drop files here')
                .prepend($loadDropSvg.clone())
            filesPanelState = 2
        }
    }
    else {
        if (uploadedImage === null && imagePanelState != 3) {
            $('#download-image-btn').hide()
            $imageContainer
                .removeClass('drop-area')
                .addClass('empty')
                .empty()
                .text('attach png')
                .prepend($imageSvg.clone())
            imagePanelState = 3
        }
        else if (uploadedImage !== null && imagePanelState != 4) {
            $('#download-image-btn').show()
            $imageContainer
                .removeClass('drop-area')
                .removeClass('empty')
                .empty()
                .append(uploadedImage.img)
            imagePanelState = 4
        }

        if (uploadedFiles === null && filesPanelState != 5) {
            $('#download-files-btn').hide()
            $filesContainer
                .removeClass('drop-area')
                .addClass('empty')
                .addClass('center')
                .empty()
                .text('attach files')
                .prepend($fileSvg.clone())
            filesPanelState = 5
        }
        else if (uploadedFiles !== null && filesPanelState != 6) {
            $('#download-files-btn').show()
            $filesContainer
                .removeClass('drop-area')
                .removeClass('empty')
                .removeClass('center')
                .empty()
                .append(uploadedFiles.html.children())
            filesPanelState = 6
        }
    }
}, 100)
$(document)
    .on('dragover', event => {
        event.preventDefault()
        lastDragover = new Date()
    })
    .on('drop', event => event.preventDefault())


// image attach
var openImage = _ => $selectFiles.attr({
    'accept': 'image/png',
    'multiple': false
}).removeAttr('webkitdirectory').trigger('click')
$imageContainer.on('drop', event => {
    event.preventDefault()
    file = event.originalEvent.dataTransfer.files[0]
    if (file.type === 'image/png') {
        getImage(file)
        lastDragover -= 100
    }
})
$imageContainer.on('click', event => {if (uploadedImage === null) openImage()})
$('#delete-image-btn').on('click', event => uploadedImage = null)
$('#open-image-btn').on('click', event => openImage())
$('#download-image-btn').on('click', event => {
    let blob = new Blob([uploadedImage.arrayBuffer], {type: uploadedImage.file.type})
    saveAs(blob, uploadedImage.file.name)
})


// files attach
var openFiles = _ => $selectFiles.attr({
    'accept': '',
    'multiple': true
}).removeAttr('webkitdirectory').trigger('click')
var openFolder = _ => $selectFiles.attr({
    'accept': '',
    'multiple': false,
    'webkitdirectory': true
}).trigger('click')
function fillArchive(zip, path, data) {
    if (data instanceof ArrayBuffer)
        zip.file(path, data)
    else {
        var folder = zip.folder(path)
        for (var name in data)
            fillArchive(folder, name, data[name])
    }
}
$filesContainer.on('drop', event => getFiles(event.originalEvent.dataTransfer.items))
$filesContainer.on('click', event => {if (uploadedFiles === null) openFiles()})
$('#back-folder-btn').on('click', event => {
    uploadedFiles.path = uploadedFiles.path.replace(/\/[^/]*\/?$/, '/')
    updateFiles()
})
$('#download-files-btn').on('click', event => {
    let archive = new JSZip()
    console.log(archive)
    fillArchive(archive, '', uploadedFiles.dict)
    archive.generateAsync({type: 'blob'})
        .then(content => saveAs(content, 'chunk.zip'))
})
$('#upload-files-btn').on('click', event => openFiles())
$('#upload-folder-btn').on('click', event => openFolder())
$('#delete-files-btn').on('click', event => uploadedFiles = null)


function getImage(file) {
    let fileReader = new FileReader()
    fileReader.onload = event => {
        // decode
        let [imageArrayBuffer, files] = [event.target.result, null] // decode(event.target.result)
        let imageDataUrl = URL.createObjectURL(new Blob([imageArrayBuffer]))

        // add image
        let image = $('<img>').attr('src', imageDataUrl)
        $imageContainer.empty().append(image)
        uploadedImage = {
            file: file,
            img: image,
            arrayBuffer: imageArrayBuffer
        }

        // add files
        if (files === null)
            uploadedFiles = null
        else {
            uploadedFiles = {
                html: $('<div>'),
                dict: files,
                path: '/'
            }
            updateFiles()
        }
    }
    fileReader.readAsArrayBuffer(file)
}


function autoClearUploadedFiles() {
    if (uploadedFiles === null)
        uploadedFiles = {
            html: $('<div>'),
            dict: {},
            path: '/'
        }
}
function getFiles(items) {
    autoClearUploadedFiles()
    
    let currentFolder = getFilesPathDict()
    let filesCounter = {amount: 0, loaded: 0}
    if (items instanceof FileList) {
        filesCounter.amount = items.length
        $.each(items, (i, file) => {
            let fileReader = new FileReader()
            fileReader.onload = event => {
                currentFolder[file.name] = event.target.result
                filesCounter.loaded += 1
            }
            fileReader.readAsArrayBuffer(file)
        })
    }
    else if (items instanceof DataTransferItemList)
        $.each(items, (i, item) => recursivelyEntryIterating(currentFolder, item.webkitGetAsEntry(), filesCounter))

    // update files after loading all of them
    let intervalId = setInterval(() => {
        if (filesCounter.loaded == filesCounter.amount) {
            updateFiles()
            clearInterval(intervalId)
        }
    }, 10)
}
function recursivelyEntryIterating(files_folder, entry, filesCounter) {
    if (entry.isFile) {
        filesCounter.amount += 1
        entry.file(fileObject => {
            let fileReader = new FileReader()
            fileReader.onload = event => {
                files_folder[entry.name] = event.target.result
                filesCounter.loaded += 1
            }
            fileReader.readAsArrayBuffer(fileObject)
        })
    }
    else if (entry.isDirectory) {
        var folder_files = {}
        entry.createReader().readEntries(entries => $.each(entries, (i, entry) => recursivelyEntryIterating(folder_files, entry, filesCounter)))
        files_folder[entry.name] = folder_files
    }
}
function filesPathIterating(rootFolderName, files) {
    autoClearUploadedFiles()
    
    let filesCounter = {amount: files.length, loaded: 0}
    let folder = {}
    $.each(files, (i, file) => {
        let pathFolders = file.webkitRelativePath.split('/')
        pathFolders = pathFolders.splice(1, pathFolders.length-2)

        var local_folder = folder
        for (let folderName of pathFolders) {
            if (local_folder[folderName] === undefined)
                local_folder[folderName] = {}
            local_folder = local_folder[folderName]
        }

        let fileReader = new FileReader()
        fileReader.onload = event => {
            local_folder[file.name] = event.target.result
            filesCounter.loaded += 1
        }
        fileReader.readAsArrayBuffer(file)
    })
    
    let intervalId = setInterval(() => {
        if (filesCounter.loaded == filesCounter.amount) {
            uploadedFiles.dict[rootFolderName] = folder
            updateFiles()
            clearInterval(intervalId)
        }
    }, 10)
}
function updateFiles() {
    uploadedFiles.html = $('<div>')

    if (uploadedFiles.path == '/')
        $('#back-folder-btn').css('visibility', 'hidden')
    else
        $('#back-folder-btn').css('visibility', 'visible')

    uploadedFiles.html.append($('<div>').addClass('path').text(uploadedFiles.path))
    $.each(getFilesPathDict(), (fileName, fileObject) => {
        uploadedFiles.html.append(
            (fileObject instanceof ArrayBuffer
                ? ($('<div>').addClass('file')
                    .append($fileSvg.clone().addClass('ico')))
                : ($('<div>').addClass('file folder')
                    .append($folderSvg.clone().addClass('ico')))
                    .on('click', function(event) {
                        let folderName = $(this).find('.name').text()
                        uploadedFiles.path += folderName+'/'
                        updateFiles()
                    }))
                .append($('<span>').addClass('name').text(fileName))
        )
    })
    filesPanelState = 0
}
function getFilesPathDict() {
    let folder = uploadedFiles.dict
    let path = uploadedFiles.path.split('/')
    for (let folderName of path.slice(1, path.length-1))
        folder = folder[folderName]
    return folder
}

})