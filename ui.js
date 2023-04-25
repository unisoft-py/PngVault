$(_=>{

$.get('/files/load_drop.svg', data => window.$loadDropSvg = $($(data).get(0).firstChild))
$.get('/files/image.svg', data => window.$imageSvg = $($(data).get(0).firstChild))
$.get('/files/file.svg', data => window.$fileSvg = $($(data).get(0).firstChild))
$.get('/files/folder.svg', data => window.$folderSvg = $($(data).get(0).firstChild))
$.get('/files/delete_file.svg', data => window.$deleteFileSvg = $($(data).get(0).firstChild))

var $imageContainer = $('#image-container')
window.uploadedImage = null

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
                .text('attach png')
                .prepend($imageSvg.clone())
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
                .text('attach files')
                .prepend($fileSvg.clone())
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
        let [imageArrayBuffer, files] = [event.target.result, null] // decode(event.target.result)
        let imageDataUrl = URL.createObjectURL(new Blob([imageArrayBuffer]))

        // add image
        let image = $('<img>').attr('src', imageDataUrl)
        $imageContainer.empty().append(image)
        uploadedImage = {
            img: image,
            imageArrayBuffer: imageArrayBuffer
        }

        // add files
        if (files !== null) {
            uploadedFiles.dict = files
            updateFiles()
        }
    }
    fileReader.readAsArrayBuffer(image)
}


function getFiles(items) {
    let filesCounter = {amount: 0, loaded: 0}
    if (items instanceof FileList) {
        filesCounter.amount = items.length
        $.each(items, (i, file) => {
            let fileReader = new FileReader()
            fileReader.onload = event => {
                console.log(file.name, event.target.result)
                file.arrayBuffer = event.target.result
                uploadedFiles.dict[file.name] = file
                filesCounter.loaded += 1
            }
            fileReader.readAsArrayBuffer(file)
        })
    }
    else if (items instanceof DataTransferItemList)
        $.each(items, (i, item) => recursivelyEntryIterating(uploadedFiles.dict, item.webkitGetAsEntry(), filesCounter))

    // update files after loading all of them
    let intervalId = setInterval(() => {
        if (filesCounter.loaded == filesCounter.amount) {
            updateFiles()
            clearInterval(intervalId)
        }
    }, 10);
}
function recursivelyEntryIterating(files_folder, entry, filesCounter) {
    if (entry.isFile) {
        filesCounter.amount += 1
        entry.file(fileObject => {
            let fileReader = new FileReader()
            fileReader.onload = event => {
                fileObject.arrayBuffer = event.target.result
                files_folder[entry.name] = fileObject
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
function updateFiles() {
    uploadedFiles.html = $('<div>')
    $.each(uploadedFiles.dict, (fileName, fileObject) => {
        uploadedFiles.html.append(
            (fileObject instanceof File
                ? $('<div>').addClass('file')
                    .append($fileSvg.clone().addClass('ico'))
                : $('<div>').addClass('file folder')
                    .append($folderSvg.clone().addClass('ico')))
                    .on('click', function(event) {

                    })
                .append($('<span>').addClass('name').text(fileName))
        )
    })
    filesPanelState = 5
}

})