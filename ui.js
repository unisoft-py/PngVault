$(_=>{

var $imageZone = $('#image-zone')
var $imageContainer = $('#image-container')

var lastDragover
setInterval(_ => {
    if (new Date() - lastDragover <= 100) {
        $imageContainer
            .addClass('drop-zone')
            .html('DROP IMAGE HERE')
    }
    else {
        $imageContainer
            .removeClass('drop-zone')
            .empty().append($imageContainer.data('image'))
    }
}, 100)
$(document)
    .on('dragover', event => {
        event.preventDefault()
        lastDragover = new Date()
    })
    .on('drop', event => event.preventDefault())

    $imageZone.on('drop', event => {
        event.preventDefault()
        file = event.originalEvent.dataTransfer.files[0]
        if (file.type.startsWith('image')) {
            getImage(file)
            lastDragover -= 100
        }
    })

function getImage(image) {
    let fileReader = new FileReader()
    fileReader.onload = event => {
        // decode
        let [imageArrayBuffer, files] = [event.target.result, []] // decode(event.target.result)
        let imageDataUrl = URL.createObjectURL(new Blob([imageArrayBuffer]))

        // add image
        let image = $('<img>').attr('src', imageDataUrl)
        $imageContainer
            .data('imageArrayBuffer', imageArrayBuffer)
            .data('image', image)
            .empty()
            .append(image)

        // add files
    }
    fileReader.readAsArrayBuffer(image)
}

})