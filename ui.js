$(_=>{

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
        if ($(this).attr('multiple')) {
            getFiles(event.target.files)
        }
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
            .html('DROP IMAGE HERE')

        $filesContainer
            .addClass('drop-zone')
            .addClass('center')
            .data('inner', $filesContainer.children())
            .html('DROP FILES HERE')
    }
    else if ($imageContainer.hasClass('drop-zone') || $filesContainer.hasClass('drop-zone')) {
        if (uploadedImage === null)
            $imageContainer
                .addClass('drop-zone')
                .empty().html('LOAD IMAGE')
        else
            $imageContainer
                .removeClass('drop-zone')
                .empty().append(uploadedImage.img)

        console.log(uploadedFiles)
        if (uploadedFiles === null) {
            console.log('in1')
            $filesContainer
                .addClass('drop-zone')
                .addClass('center')
                .empty().html('LOAD FILES')
        }
        else {
            console.log('in2')
            $filesContainer
                .removeClass('drop-zone')
                .removeClass('center')
                .empty().append(uploadedFiles.html)
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
    var files = []
    if (items instanceof FileList)
        $.each(items, (i, item) => files.push({[item.name]: item}))
    else
        $.each(items, (i, item) => recursivelyEntryIterating(files, item.webkitGetAsEntry()))

    uploadedFiles = {
        html: JSON.stringify(files),
        list: files
    }
    console.log(items, files, uploadedFiles)
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