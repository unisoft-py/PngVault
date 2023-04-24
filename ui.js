$(_=>{

$.get('load_empty.svg', data => window.$loadEmptySvg = $($(data).get(0).firstChild))
$.get('load_drop.svg', data => window.$loadDropSvg = $($(data).get(0).firstChild))
$.get('file.svg', data => window.$fileSvg = $($(data).get(0).firstChild))
$.get('folder.svg', data => window.$folderSvg = $($(data).get(0).firstChild))
$.get('delete_file.svg', data => window.$deleteFileSvg = $($(data).get(0).firstChild))

var $imagePanel = $('#image-panel')
var $imageContainer = $('#image-container')
window.uploadedImage = null

var $filesPanel = $('#files-panel')
var $filesContainer = $('#files-container')
window.uploadedFiles = {
    html: $('<div>'),
    dict: {}
}

var $selectFiles = $('<input>')
    .attr('type', 'file')
    .on('change', function(event) {
        event.preventDefault()
        if ($(this).attr('multiple'))
            getFiles(event.target.files)
        else {
            let file = event.target.files[0]
            if (file.type === 'image/png')
                getImage(file)
        }

        $(this).val('')
    })


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
            $imageContainer
                .removeClass('drop-area')
                .addClass('empty')
                .empty()
                .text('click to attach png')
                .prepend($loadEmptySvg.clone())
            imagePanelState = 3
        }
        else if (uploadedImage !== null && imagePanelState != 4) {
            $imageContainer
                .removeClass('drop-area')
                .removeClass('empty')
                .empty()
                .append(uploadedImage.img)
            imagePanelState = 4
        }

        if (!Object.keys(uploadedFiles.dict).length && filesPanelState != 5) {
            $filesContainer
                .removeClass('drop-area')
                .addClass('empty')
                .addClass('center')
                .empty()
                .text('click to attach files')
                .prepend($loadEmptySvg.clone())
            filesPanelState = 5
        }
        else if (Object.keys(uploadedFiles.dict).length && filesPanelState != 6) {
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
$imageContainer.on('drop', event => {
    event.preventDefault()
    file = event.originalEvent.dataTransfer.files[0]
    if (file.type === 'image/png') {
        getImage(file)
        lastDragover -= 100
    }
})
$imageContainer.on('click', event => {
    if (uploadedImage === null)
        $selectFiles.prop('multiple', false).trigger('click')
})
$('#delete-image-btn').on('click', event => uploadedImage = null)
$('#open-image-btn').on('click', event => $selectFiles.prop('multiple', false).trigger('click'))

// files attach
$filesContainer.on('drop', event => {
    event.preventDefault()
    getFiles(event.originalEvent.dataTransfer.items)
})
$filesContainer.on('click', event => {
    if (!Object.keys(uploadedFiles.dict).length)
        $selectFiles.prop('multiple', true).trigger('click')
})
$('#add-files-btn').on('click', event => $selectFiles.prop('multiple', true).trigger('click'))
$('#delete-files-btn').on('click', event => {uploadedFiles.dict = {}; uploadedFiles.html = $('<div>')})


function getImage(image) {
    let fileReader = new FileReader()
    fileReader.onload = event => {
        // decode
        let [imageArrayBuffer, files] = [event.target.result, 1] // decode(event.target.result)
        let imageDataUrl = URL.createObjectURL(new Blob([imageArrayBuffer]))

        // add image
        let image = $('<img>').attr('src', imageDataUrl)
        $imageContainer.empty().append(image)
        uploadedImage = {
            img: image,
            imageArrayBuffer: imageArrayBuffer
        }

        // add files
        // if (files !== null) {
        //     uploadedFiles.dict = {}
        // }
    }
    fileReader.readAsArrayBuffer(image)
}


function getFiles(items) {
    if (items instanceof FileList)
        $.each(items, (i, item) => uploadedFiles.dict[item.name] = item)
    else if (items instanceof DataTransferItemList)
        $.each(items, (i, item) => recursivelyEntryIterating(uploadedFiles.dict, item.webkitGetAsEntry()))

    
    updateFiles()
}
function recursivelyEntryIterating(files_folder, entry) {
    if (entry.isFile)
        entry.file(fileObject => {
            files_folder[entry.name] = fileObject
            updateFiles()
        })
    else if (entry.isDirectory) {
        var folder_files = {}
        entry.createReader().readEntries(entries => $.each(entries, (i, entry) => recursivelyEntryIterating(folder_files, entry)))
        files_folder[entry.name] = folder_files
    }
    updateFiles()
}
function updateFiles() {
    uploadedFiles.html = $('<div>')
    $.each(uploadedFiles.dict, (fileName, fileObject) => {
        uploadedFiles.html.append(
            (fileObject instanceof File
                ? $('<div>').addClass('file')
                    .append($fileSvg.clone().addClass('ico'))
                : $('<div>').addClass(['file', 'folder'])
                    .append($folderSvg.clone().addClass('ico')))
                    .on('click', function(event) {

                    })
                .append($('<span>').addClass('name').text(fileName))
        )
    })
    filesPanelState = 5
}

})