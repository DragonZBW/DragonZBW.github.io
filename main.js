let body, scrollingBanner, navPersonalData, navSelectedWorks, mainContent, contentTitle, contentText, contentInfoBox, contentInfoBoxImg, gallery, modal, modalTitle, modalSubtitle, modalVideo, modalContentText, modalPlayButton, modalInfoBox, modalInfoBoxImg;
let currPageInternalName, currGalleryItemName;
let galleryItemsData;

let currSlide;

let unfinishedPages = [];

// When the window loads, set necessary vars & do setup.
window.onload = () => {
    console.log("window loaded");
    setScrollbarWidth();

    body = document.body;
    scrollingBanner = document.querySelector(".scrolling-banner");
    navPersonalData = document.querySelector("nav ul:first-of-type");
    navSelectedWorks = document.querySelector("nav ul:last-of-type");
    mainContent = document.querySelector("#main-content");
    contentTitle = document.querySelector("#main-content-title");
    contentText = document.querySelector("#main-content-text");
    contentInfoBox = document.querySelector("#main-content-info-box");
    contentInfoBoxImg = contentInfoBox.querySelector(".info-box-img");
    gallery = document.querySelector("#gallery");

    modal = document.querySelector("#project-modal");
    modalTitle = modal.querySelector("h1");
    modalSubtitle = modal.querySelector("h3");
    modalVideo = modal.querySelector("iframe");
    modalContentText = modal.querySelector("main");
    modalPlayButton = modal.querySelector("#play-button a");
    modalInfoBox = modal.querySelector("#modal-info-box");
    modalInfoBoxImg = modalInfoBox.querySelector(".info-box-img");

    // Close button callback
    document.querySelector("#close-button").onclick = closeModal;
    document.querySelector("#project-modal-bg").onclick = closeModal;
    document.addEventListener("keydown", (event) => {
        if (event.key == "Escape" && modal.style.display == "inline-block")
            closeModal();
    });

    // Load banner items
    let numSlides = 0;
    fetch("./pages/slideshow.json")
        .then((response) => response.json())
        .then((json) => {
            numSlides = json.items.length;

            // Slide factory function
            let makeSlide = (item) => {
                let slide = document.createElement("img");
                slide.classList.add("banner-slide");
                slide.src = "img/" + item.image + "";

                let page = item.link.replaceAll('#', '').split('.')
                slide.onclick = () => loadPage(page[0], page[1]);

                scrollingBanner.appendChild(slide);
            };

            // Make elements for each slide
            for (let i of json.items) {
                makeSlide(i);
            }

            // Make an extra copy of the first slide at the end for seamless looping
            makeSlide(json.items[0]);
        });

    // Automatic slideshow
    currSlide = 0;
    setInterval(() => {
        // Don't scroll the slideshow if the modal is displayed
        if (modal.style.display == "inline-block")
            return;

        // Move the slideshow
        scrollingBanner.classList.add("banner-transition");
        currSlide++;
        scrollingBanner.style.marginLeft = "calc(" + (currSlide * -100) + "vw + " + currSlide + " * var(--scrollbar-width))";
        setTimeout(() => scrollingBanner.classList.remove("banner-transition"), 500);

        // Loop the slideshow
        if (currSlide >= numSlides) {
            currSlide = 0;
            setTimeout(() => {
                scrollingBanner.style.marginLeft = "0";
                // Lame hack to skip the transition
                scrollingBanner.offsetHeight;
            }, 500);
        }
    }, 7000);

    // Load nav bar items
    fetch("./pages/navbar.json")
        .then((response) => response.json())
        .then((json) => {
            let fillSection = (section, arr) => {
                section.innerHTML = "";
                for (let i of arr) {
                    if (!i.visible) {
                        unfinishedPages.push(i.name);
                    }
                    let item = document.createElement("a");
                    item.onclick = () => loadPage(i.name);
                    item.innerHTML = "<li>" + i.name + "</li>";
                    section.appendChild(item);
                }
            };
            fillSection(navPersonalData, json.personalData);
            fillSection(navSelectedWorks, json.selectedWorks);
        });

    // Load correct page data based on url hash.
    onHashChange();
}

function setScrollbarWidth() {
    let scrollbarWidth = (window.innerWidth - document.documentElement.clientWidth);
    console.log("scrollbar width " + scrollbarWidth);
    document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth + "px");
}

window.onresize = setScrollbarWidth;

window.onhashchange = onHashChange;

// Called when url hash changes or when loading the page in order to load the proper page data.
function onHashChange() {
    let hash = (window.location.hash).replaceAll('#', '').split('.');
    let page = hash.length > 0 ? hash[0] : "";
    let galleryItem = hash.length > 1 ? hash[1] : "";
    galleryItem = galleryItem.toLowerCase().replaceAll(' ', '-');

    if (page.length == 0)
        page = "bio";

    if (currPageInternalName != page) {
        fetchPage(page, galleryItem);
    } else if (galleryItem != currGalleryItemName) {
        if (galleryItem.length == 0) {
            modal.style.display = "none";
        } else {
            for (let item of galleryItemsData) {
                if (item.name.toLowerCase().replaceAll(' ', '-') == galleryItem) {
                    loadModal(item);
                }
            }
        }
    }
}

// "Load" a page by changing the url hash, which in turn triggers onHashChange() to fetch the page data.
function loadPage(pageID, galleryID) {
    let curr = window.location.hash.replaceAll('#', '').split('.');
    let currPage = curr[0];
    let currGalleryItem = curr.length > 1 ? curr[1] : "";

    if (currPage != pageID || currGalleryItem != galleryID) {
        if (galleryID != null && galleryID.length > 0)
            window.location.hash = pageID + "." + galleryID;
        else
            window.location.hash = pageID;
    }

    currGalleryItemName = currGalleryItem;
}

// Fetch the page data and construct the page content.
function fetchPage(id, galleryItemID) {
    fetch("./pages/" + id + "/content.json")
        .then((response) => response.json())
        .then((json) => {
            currPageInternalName = id;

            // Page title.
            contentTitle.textContent = json.title;

            let isUnfinished = unfinishedPages.includes(id);

            // Page layout.
            switch (json.layout) {
                // 0 - Text only.
                case 0:
                    mainContent.style.flexDirection = "row";
                    contentInfoBox.style.display = "none";
                    gallery.style.display = "none";
                    break;
                // 1 - Info box + text.
                case 1:
                    mainContent.style.flexDirection = "row";
                    contentInfoBox.style.display = "block";
                    gallery.style.display = "none";
                    contentInfoBoxImg.style.backgroundImage = "url('img/" + json.infoBox.image + "')";
                    fillInfoBoxTable(contentInfoBox.querySelector("table"), json.infoBox.data);
                    break;
                // 2 - Gallery.
                case 2:
                    mainContent.style.flexDirection = "column";
                    contentInfoBox.style.display = "none";
                    
                    if (isUnfinished) {
                        gallery.style.display = "none";
                        break;
                    }

                    gallery.style.display = "flex";
                    gallery.innerHTML = "";
                    galleryItemsData = json.gallery;
                    console.log(galleryItemsData);
                    for (let item of json.gallery) {
                        let galleryItem = makeGalleryItem(item);
                        gallery.appendChild(galleryItem);

                        if (galleryItemID == item.name.toLowerCase().replaceAll(" ", "-")) {
                            loadModal(item);
                        }
                    }
                    break;
            }

            // Fill content text
            if (isUnfinished) {
                contentText.innerHTML = "<h4>Coming Soon!</h4><p>This page is under construction.<p>";
            } else {
                fillMainText(contentText, json.text);
            }

            setScrollbarWidth();
        });
}

// Open a modal to display information on a gallery item.
function loadModal(galleryItem) {
    console.log("load modal " + galleryItem.name);

    // Fill out content
    modalTitle.innerText = galleryItem.name;
    modalSubtitle.innerText = galleryItem.shortDesc;
    modalVideo.src = galleryItem.videoURL;
    fillMainText(modalContentText, galleryItem.text);

    // Play button
    if (galleryItem.linkTitle == "") {
        modalPlayButton.parentElement.parentElement.style.display = "none";
    } else {
        modalPlayButton.innerText = galleryItem.linkTitle;
        modalPlayButton.href = galleryItem.linkURL;

        modalPlayButton.parentElement.parentElement.style.display = "inline-block";
    }

    // Info box
    if(galleryItem.infoBox.image)
        modalInfoBoxImg.style.backgroundImage = "url('img/" + galleryItem.infoBox.image + "')";
    else
        modalInfoBoxImg.style.backgroundImage = "url('img/" + galleryItem.previewImg + "')";
    fillInfoBoxTable(modalInfoBox.querySelector("table"), galleryItem.infoBox.data);

    // Display the modal
    body.style.marginRight = window.innerWidth - body.offsetWidth;
    body.style.overflow = "hidden";

    modal.style.display = "inline-block";
    modal.scrollTo(0, 0);
}

// Close the modal (if it's open).
function closeModal() {
    // Hide the modal
    body.style.marginRight = "auto";
    body.style.overflow = "auto";

    modal.style.display = "none";
    loadPage(currPageInternalName, "");
    currGalleryItemName = null;
}

// Format text with macros i.e. links or embedded images
function formatText(text) {
    // Macros
    let parts = text.split(/(?:\[|\])+/);
    let inMacro = false;
    let result = "";
    for (let i = 0; i < parts.length; i++) {
        // If not in macro, add text and skip
        if (!inMacro) {
            result += parts[i];
            inMacro = true;
            continue;
        }

        // Read macro
        console.log("macro " + parts[i]);
        let macroParts = parts[i].split(/:|,/);
        for (let m = 0; m < macroParts.length; m++)
            macroParts[m] = macroParts[m].trim();
        console.log(macroParts);

        // Link to another page
        if (macroParts.length == 2 && macroParts[1].startsWith("#")) {
            result += "<a href='./" + macroParts[1] + "'>" + macroParts[0] + "</a>";
        }
        // Italics
        else if (macroParts.length == 2 && macroParts[0] == "i") {
            result += "<i>" + macroParts[1] + "</i>";
        }
        // Years since
        else if (macroParts.length == 2 && macroParts[0] == "years-since") {
            let year = Number.parseInt(macroParts[1]);
            result += "" + (new Date().getFullYear() - year);
        }
        // Embedded image
        else if (macroParts.length == 3 && macroParts[0] == "img") {
            result += "<img src='./img/" + macroParts[1] + "' class='" + macroParts[2] + "'/>";
        }
        // Link to external page
        else {
            if (macroParts.length == 3 && macroParts[1].startsWith("http")) {
                macroParts[1] = macroParts[1] + ":" + macroParts[2];
            } else if (macroParts.length == 3 && (macroParts[1] == "mailto" || macroParts[1] == "tel")) {
                macroParts[1] = macroParts[1] + ":" + macroParts[2];
            }
            if (macroParts.length == 3 && macroParts[2] == "download") {
                result += "<a href='" + macroParts[1] + "' target='_blank' download>" + macroParts[0] + "</a>";
            } else {
                result += "<a href='" + macroParts[1] + "' target='_blank'>" + macroParts[0] + "</a>";
            }
        }

        inMacro = !inMacro;
    }
    return result;
}

// Fill content text by looping through paragraphs.
function fillMainText(textContainer, textData) {
    let currList = null;
    textContainer.innerHTML = "";
    for (let i = 0; i < textData.length; i++) {
        // Add a heading to this paragraph.
        if (textData[i].heading) {
            let heading = document.createElement("h4");
            heading.textContent = textData[i].heading;
            textContainer.appendChild(heading);
        }
        // Create the paragraph text.
        for (let j = 0; j < textData[i].paragraphs.length; j++) {
            let paragraph = document.createElement("p");
            let pgText = textData[i].paragraphs[j];

            // Bullet
            if (pgText.startsWith("-")) {
                if (!currList) {
                    currList = document.createElement("ul");
                    textContainer.appendChild(currList);
                }
                pgText = pgText.substring(1).trimStart();
                paragraph = document.createElement("li");
            } else {
                currList = null;
            }

            paragraph.innerHTML = formatText(pgText);

            if (currList) {
                currList.appendChild(paragraph);
            } else {
                textContainer.appendChild(paragraph);
            }
        }
    }
}

// Fill info box table content by looping through data.
function fillInfoBoxTable(tableElement, tableData) {
    tableElement.innerHTML = "";
    for (let prop in tableData) {
        let row = document.createElement("tr");
        let key = document.createElement("th");
        let val = document.createElement("th");
        key.innerHTML = prop;
        val.innerHTML = tableData[prop];
        row.appendChild(key);
        row.appendChild(val);
        tableElement.appendChild(row);
    }
}

// Make and return a new gallery item element.
function makeGalleryItem(itemData) {
    // Create gallery item
    let item = document.createElement("div");
    item.classList.add("panel", "info-box");

    // Create image container
    let imgContainer = document.createElement("div");
    imgContainer.classList.add("panel", "info-box-image-container");

    // Create image
    let img = document.createElement("div");
    img.classList.add("panel", "info-box-img");

    // Create title text
    let title = document.createElement("h4");

    // Create bottom area
    let div = document.createElement("div");

    // Create description text
    let desc = document.createElement("p");
    desc.classList.add("gallery-box-short-desc");

    // Fill out content
    title.innerText = itemData.name;
    img.style.backgroundImage = "url('img/" + itemData.previewImg + "')";
    desc.innerText = itemData.shortDesc;

    // Construct tree
    imgContainer.appendChild(img);
    imgContainer.appendChild(title);
    item.appendChild(imgContainer);
    div.appendChild(desc);
    item.appendChild(div);

    // On click, open the modal
    item.onclick = () => loadPage(currPageInternalName, itemData.name.toLowerCase().replaceAll(' ', '-'));

    // Return the new gallery item :)
    // It's not added to the document tree automatically!
    return item;
}