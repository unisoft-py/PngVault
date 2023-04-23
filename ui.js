$(_=>{

$.get('load_empty.svg', data => window.$loadEmptySvg = $($(data).get(0).firstChild))
$.get('load_drop.svg', data => window.$loadDropSvg = $($(data).get(0).firstChild))

var $imagePanel = $('#image-panel')
var $imageContainer = $('#image-container')
window.uploadedImage = null

var $filesPanel = $('#files-panel')
var $filesContainer = $('#files-container')
window.uploadedFiles = null

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


var lastDragover
setInterval(_ => {
    if (new Date() - lastDragover <= 100) {
        $imageContainer
            .addClass('drop-zone')
            .empty()
            .text('drop image here')
            .prepend($loadDropSvg.clone())

        $filesContainer
            .addClass('drop-zone')
            .addClass('center')
            .data('inner', $filesContainer.children())
            .empty()
            .text('drop files here')
            .prepend($loadDropSvg.clone())
    }
    else if ($imageContainer.hasClass('drop-zone') || $filesContainer.hasClass('empty')) {
        if (uploadedImage === null)
            $imageContainer
                .removeClass('drop-zone')
                .addClass('empty')
                .empty()
                .text('click to attach png')
                .prepend($loadEmptySvg.clone())
        else
            $imageContainer
                .removeClass('drop-zone')
                .removeClass('empty')
                .empty()
                .append(uploadedImage.img)

        if (uploadedFiles === null)
            $filesContainer
                .removeClass('drop-zone')
                .addClass('empty')
                .addClass('center')
                .empty()
                .text('click to attach files')
                .prepend($loadEmptySvg.clone())
        else
            $filesContainer
                .removeClass('drop-zone')
                .removeClass('empty')
                .removeClass('center')
                .empty()
                .append(JSON.stringify(uploadedFiles.list))
    }
}, 100)
$(document)
    .on('dragover', event => {
        event.preventDefault()
        lastDragover = new Date()
    })
    .on('drop', event => event.preventDefault())

// image attach
$imagePanel.on('drop', event => {
    event.preventDefault()
    file = event.originalEvent.dataTransfer.files[0]
    if (file.type === 'image/png') {
        getImage(file)
        lastDragover -= 100
    }
})
$imagePanel.on('click', event => {
    if (uploadedImage === null)
        $selectFiles.prop('multiple', false).trigger('click')
})

// files attach
$filesPanel.on('drop', event => {
    event.preventDefault()
    getFiles(event.originalEvent.dataTransfer.items)
})
$filesPanel.on('click', event => {
    if (uploadedFiles === null)
        $selectFiles.prop('multiple', true).trigger('click')
})


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
            // uploadedFiles = null
        }
    }
    fileReader.readAsArrayBuffer(image)
}


function getFiles(items) {
    var files = Array()
    if (items instanceof FileList)
        $.each(items, (i, item) => files.push({[item.name]: item}))
    else
        $.each(items, (i, item) => recursivelyEntryIterating(files, item.webkitGetAsEntry()))

    uploadedFiles = {
        html: JSON.stringify(files),
        list: files
    }
}
function recursivelyEntryIterating(files_folder, entry) {
    if (entry.isFile)
        entry.file(fileObject => files_folder.push({[entry.name]: fileObject}))
    else if (entry.isDirectory) {
        var folder_files = []
        var folder = {[entry.name]: folder_files}
        entry.createReader().readEntries(entries => $.each(entries, (i, entry) => recursivelyEntryIterating(folder_files, entry)))
        files_folder.push(folder)
    }
}

})