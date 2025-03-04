const form = document.getElementById("badge-form");
function generateBadge(e){
    // Prevent the form from submitting
    e.preventDefault();

    // Create a new badge
    const badge = new BadgeGenerator("badge-example", {
        exportHeight: 2048,
        exportWidth: 2048,
        exportName: "badge-example",
        downloadBtnId: "exportBtn"
    });
    
    // Add a background layer
    const backgroundLayer = new BadgeRectLayer({
        height: 100,
        width: 100,
        top: 0,
        left: 0,
        color: "blue"
    });
    badge.addLayer(backgroundLayer);
    
    // Add a text layer
    const img = new Image();
    img.src = URL.createObjectURL(form["photo"].files[0]);
    const imageLayer = new BadgeImageLayer(img.src, {
        width: 70,
        left: (h, w) => 50 - w/2,
        top: (h, w) => 50 - h/2,
    });
    badge.addLayer(imageLayer);
    
    // Add a text layer
    const nameLayer = new BadgeTextLayer(form["name"].value, "Trebuchet MS", {
        size: 10,
        color: "black",
        top: (h, w) => 5,
        left: (h, w) => 5,
    });
    badge.addLayer(nameLayer);
    
    // Add a text layer
    const titleLayer = new BadgeTextLayer(form["role"].value, "Trebuchet MS", {
        size: 10,
        color: "black",
        bottom: (h, w) => 5,
        right: (h, w) => 5,
    });
    badge.addLayer(titleLayer);
}

// Add an event listener to the form
form.addEventListener("submit", generateBadge);