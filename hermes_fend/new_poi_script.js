// Wait until the page finishes loading
let current_newpoi_page = "";
const fileMap_images = new Map();

window.addEventListener("load", function() {
    // Keep the loader visible for at least 3 seconds (3000ms)
    setTimeout(function() {
        // Hide the loader overlay
        const loaderWrapper = document.getElementById("loader-wrapper");
        loaderWrapper.style.display = "none"; 
        
        // Show the main content
        const content = document.querySelector(".content");
        content.style.display = "block";
    }, 1000); // 3000 milliseconds = 3 seconds
});

// window.addEventListener('DOMContentLoaded', function(){
//     load_newpoi_subpage('uploadimg_option_btn');
// });


// function deleteImageByName(filename) {
//     // Get all files from the pond
//     const files = pond.getFiles();
    
//     // Loop through the files to find the one with the matching filename
//     files.forEach((file) => {
//         if (file.filename === filename) {
//             // Remove the file if the filename matches
//             pond.removeFile(file.id);
//         }
//     });
// }

// function fileImageAccept(){
//     updateGallery();
//     const inputElement = document.getElementById('file-input');
//     var pond = FilePond.create(inputElement, {
//         labelIdle: '<span class="filepond--label-action">Browse</span>',
//     });

//     // Add event listener for file add
//     pond.on('addfile', (error, file) => {
//         if (error) {
//             console.error('Error adding file:', error);
//             return;
//         }
//         // let filetext = "";
//         // for (let key in file.file){
//         //     filetext += key + "\n";
//         // }
//         // alert(filetext);
//         addTo_Images_filemap(file.file);
//     });

//     // Function to display file in the file list

//     // Drag & drop functionality for folders
//     const dragArea = document.getElementById('filepond');

//     dragArea.addEventListener('dragover', (event) => {
//         event.preventDefault();
//         dragArea.style.backgroundColor = '#e0f7ff'; // Highlight on drag over
//     });

//     dragArea.addEventListener('dragleave', () => {
//         dragArea.style.backgroundColor = ''; // Remove highlight
//     });

//     dragArea.addEventListener('drop', (event) => {
//         event.preventDefault();
//         dragArea.style.backgroundColor = ''; // Remove highlight
//         const items = event.dataTransfer.items;
//         for (let i = 0; i < items.length; i++) {
//             const item = items[i];
//             if (item.kind === 'file') {
//                 const file = item.getAsFile();
//                 if (file.type.startsWith('image/')) {
//                     let filetext = "";
//                     for (let key in file){
//                         filetext += key + "\n";
//                     }
//                     alert(filetext);
//                     pond.addFile(file); // Add image file to FilePond
//                 }
//             }
//         }
//     });
// }

// function displayFile(file) {
//     const fileList = document.getElementById('file-list');
//     const fileItem = document.createElement('div');
//     fileItem.className = 'file-item';
//     fileItem.textContent = `File: ${file.name} (${file.fileSize} bytes)`;
//     fileList.appendChild(fileItem);
// }

// function addTo_Images_filemap(file){
//     fileMap_images.set(file.name, file);
//     updateGallery();
// }

// function removeFrom_Images_filemap(filename){
//     fileMap_images.delete(filename);
// }

// function updateGallery(){
//     if(current_newpoi_page != 'newpoi_entry_uploadimg_parent'){
//         load_newpoi_subpage('uploadimg_option_btn');
//     }
//     var gallery = document.getElementById("gallery");
//     gallery.innerHTML = '';
//     fileMap_images.forEach((file, key) => {
//         const imgElement = document.createElement('img');
//         imgElement.src = URL.createObjectURL(file); // Create a local URL for the image
//         imgElement.alt = key;

//         const deleteButton = document.createElement('button');
//         deleteButton.textContent = 'X';
//         deleteButton.className = 'delete-button';
//         deleteButton.onclick = () => {
//             fileMap_images.delete(key); // Remove from the map
//             updateGallery(); // Update the gallery display
//         };

//         const galleryItem = document.createElement('div');
//         galleryItem.className = 'gallery-item';
//         galleryItem.appendChild(imgElement);
//         galleryItem.appendChild(deleteButton);
//         gallery.appendChild(galleryItem);
//     });

// }

function load_newpoi_subpage(btnid){
    let newPOI_optionpages;
    newPOI_optionpages = new Map([
        ['basicents_option_btn', 'newpoi_entry_basicinputs_parent'],
        ['repdets_option_btn', 'newpoi_entry_reporttext_parent'],
        ['eventsdets_option_btn', 'newpoi_entry_eventdets_parent'],
        ['custents_option_btn', 'newpoi_entry_custents_parent'],
        ['uploadimg_option_btn', 'newpoi_entry_uploadimg_parent'],
        ['uploadfiles_option_btn', 'newpoi_entry_uploadfiles_parent'],
        ['accessperms_option_btn', 'newpoi_entry_accessperms_parent']
    ]);
    newPOI_optionpages.forEach((val, key) => {
        // alert(key);
        // alert(val);
        if(key!=btnid){
            var thisdiv = document.getElementById(val);
            if(thisdiv){
                thisdiv.style.display = 'none';
            }
        } else{
            document.getElementById(val).style.display = 'block';
            current_newpoi_page = val;
        }
    });
    // if(btnid == 'uploadimg_option_btn'){
    //     fileImageAccept();
    // }
}
