// Wait until the page finishes loading

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

window.addEventListener('DOMContentLoaded', function(){
    load_newpoi_subpage('basicents_option_btn');
});

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
        }
    });
}

function toggle_sidebar_visibility(){
    var sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle('open');
}