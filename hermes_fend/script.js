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



function toggle_sidebar_visibility(){
    var sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle('open');
}