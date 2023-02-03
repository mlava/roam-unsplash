import iziToast from "izitoast";

const config = {
    tabTitle: "Unsplash, Pexels & Pixabay Embed",
    settings: [
        {
            id: "unsplash-mode",
            name: "Unsplash Import mode",
            description: "Random or Prompt for a search term",
            action: { type: "select", items: ["random", "prompt"] },
        },
        {
            id: "unsplash-accessKey",
            name: "Unsplash Access key",
            description: "Your Access Key from https://unsplash.com/oauth/applications",
            action: { type: "input", placeholder: "Add Unsplash Access key here" },
        },
        {
            id: "unsplash-width",
            name: "Image width",
            description: "Preferred width of image in pixels",
            action: { type: "input", placeholder: "600" },
        },
        {
            id: "unsplash-display",
            name: "Unsplash Display mode",
            description: "Format of embedded image",
            action: { type: "select", items: ["portrait", "landscape", "squarish"] },
        },
        {
            id: "pexels-mode",
            name: "Pexels Import mode",
            description: "Random or Prompt for a search term",
            action: { type: "select", items: ["random", "prompt"] },
        },
        {
            id: "pexels-apiKey",
            name: "Pexels API key",
            description: "Your API Key from https://www.pexels.com/api/new/",
            action: { type: "input", placeholder: "Add Pexels API key here" },
        },
        {
            id: "pexels-display",
            name: "Pexels Display mode",
            description: "Format of embedded image",
            action: { type: "select", items: ["portrait", "landscape", "square"] },
        },
        {
            id: "pixabay-mode",
            name: "Pixabay Import mode",
            description: "Random or Prompt for a search term",
            action: { type: "select", items: ["random", "prompt"] },
        },
        {
            id: "pixabay-apiKey",
            name: "Pixabay API key",
            description: "Your API Key from https://pixabay.com/api/docs/",
            action: { type: "input", placeholder: "Add Pixabay API key here" },
        },
        {
            id: "pixabay-orientation",
            name: "Pixabay orientation",
            description: "Format of embedded image",
            action: { type: "select", items: ["all", "horizontal", "vertical"] },
        },
        {
            id: "pixabay-safesearch",
            name: "Pixabay safesearch",
            description: "Turn on to only embed images suitable for all ages",
            action: { type: "switch" },
        },
        {
            id: "pixabay-editors_choice",
            name: "Pixabay Editor's Choice",
            description: "Only embed images that have received an Editor's Choice award",
            action: { type: "switch" },
        },
        {
            id: "pixabay-lang",
            name: "Pixabay Language Code",
            description: "Language in which to search",
            action: { type: "select", items: ["en", "bg", "cs", "da", "de", "el", "es", "fi", "fr", "id", "it", "hu", "ja", "ko", "nl", "no", "pl", "pt", "ro", "ru", "sk", "sv", "th", "tr", "vi", "zh"] },
        },
    ]
};

function onload({ extensionAPI }) {
    extensionAPI.settings.panel.create(config);

    window.roamAlphaAPI.ui.commandPalette.addCommand({
        label: "Embed image from Unsplash",
        callback: () => {
            const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
            if (uid == undefined) {
                alert("Please make sure to focus a block before importing from Unsplash");
                return;
            }
            fetchUnsplash({ extensionAPI }).then(async (blocks) => {
                if (blocks != undefined) {
                    const parentUid = uid || await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
                    await window.roamAlphaAPI.updateBlock(
                        { block: { uid: parentUid, string: blocks[0].text.toString(), open: true } });
                }
            });
        },
    });
    window.roamAlphaAPI.ui.commandPalette.addCommand({
        label: "Embed image from Pexels",
        callback: () => {
            const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
            if (uid == undefined) {
                alert("Please make sure to focus a block before importing from Pexels");
                return;
            }
            fetchPexels({ extensionAPI }).then(async (blocks) => {
                if (blocks != undefined) {
                    const parentUid = uid || await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
                    await window.roamAlphaAPI.updateBlock(
                        { block: { uid: parentUid, string: blocks[0].text.toString(), open: true } });
                }
            });
        },
    });
    window.roamAlphaAPI.ui.commandPalette.addCommand({
        label: "Embed image from Pixabay",
        callback: () => {
            const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
            if (uid == undefined) {
                alert("Please make sure to focus a block before importing from Pixabay");
                return;
            }
            fetchPixabay({ extensionAPI }).then(async (blocks) => {
                const parentUid = uid || await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
                if (blocks != undefined) {
                    await window.roamAlphaAPI.updateBlock(
                        { block: { uid: parentUid, string: blocks[0].text.toString(), open: true } });

                    for (var i = 0; i < blocks[0].children.length; i++) {
                        var thisBlock = window.roamAlphaAPI.util.generateUID();
                        await window.roamAlphaAPI.createBlock({
                            location: { "parent-uid": uid, order: i + 1 },
                            block: { string: blocks[0].children[i].text.toString(), uid: thisBlock }
                        });
                    }
                }
            });
        },
    });
}

function onunload() {
    window.roamAlphaAPI.ui.commandPalette.removeCommand({
        label: 'Embed image from Unsplash'
    });
    window.roamAlphaAPI.ui.commandPalette.removeCommand({
        label: 'Embed image from Pexels'
    });
    window.roamAlphaAPI.ui.commandPalette.removeCommand({
        label: 'Embed image from Pixabay'
    });
}

async function fetchUnsplash({ extensionAPI }) {
    var width, display, mode, key, urlUnsplash;
    breakme: {
        if (!extensionAPI.settings.get("unsplash-accessKey")) {
            key = "APIU";
            sendConfigAlert(key);
        } else {
            const accessKey = extensionAPI.settings.get("unsplash-accessKey");
            if (!extensionAPI.settings.get("unsplash-width")) {
                width = "600";
            } else {
                const regexW = /^[0-9]{2,4}$/;
                if (extensionAPI.settings.get("unsplash-width").match(regexW)) {
                    width = extensionAPI.settings.get("unsplash-width");
                } else {
                    key = "width";
                    sendConfigAlert(key);
                    break breakme;
                }
            }
            if (!extensionAPI.settings.get("unsplash-display")) {
                display = "landscape";
            } else {
                const regexD = /^landscape|portrait|squarish$/;
                if (extensionAPI.settings.get("unsplash-display").match(regexD)) {
                    display = extensionAPI.settings.get("unsplash-display");
                } else {
                    key = "display";
                    sendConfigAlert(key);
                    break breakme;
                }
            }
            if (!extensionAPI.settings.get("unsplash-mode")) {
                mode = "random";
            } else {
                const regexM = /^random|prompt$/;
                if (extensionAPI.settings.get("unsplash-mode").match(regexM)) {
                    mode = extensionAPI.settings.get("unsplash-mode");
                } else {
                    key = "mode";
                    sendConfigAlert(key);
                    break breakme;
                }
            }

            document.unsplashURL = "";
            urlUnsplash = "https://api.unsplash.com/photos/random?client_id=" + accessKey + "";
            var thisBlock = await window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];

            if (mode == "prompt") {
                iziToast.question({
                    theme: 'light',
                    color: 'black',
                    layout: 2,
                    drag: false,
                    timeout: false,
                    close: false,
                    overlay: true,
                    displayMode: 2,
                    id: "question",
                    title: "Unsplash Image Embed",
                    message:
                        "What mood | mode | theme do you want?",
                    position: "center",
                    inputs: [
                        [
                            '<input type="text" placeholder="relaxed">',
                            "keyup",
                            function (instance, toast, input, e) {
                                if (e.code === "Enter") {
                                    getPromptImage(e.srcElement.value, urlUnsplash, thisBlock, display, width);
                                    instance.hide({ transitionOut: "fadeOut" }, toast, "button");
                                }
                            },
                            true,
                        ],
                    ],
                    buttons: [
                        [
                            "<button><b>Confirm</b></button>",
                            async function (instance, toast, button, e, inputs) {
                                getPromptImage(inputs[0].value, urlUnsplash, thisBlock, display, width);
                                instance.hide({ transitionOut: "fadeOut" }, toast, "button");
                            },
                            false,
                        ],
                        [
                            "<button>Cancel</button>",
                            async function (instance, toast, button, e) {
                                instance.hide({ transitionOut: "fadeOut" }, toast, "button");
                            },
                        ],
                    ],
                    onClosing: function (instance, toast, closedBy) { },
                    onClosed: function (instance, toast, closedBy) { },
                });
            } else {
                urlUnsplash += "&w=" + width + "&orientation=" + display + "";
                const response = await fetch(urlUnsplash);
                const unsplash = await response.json();
                if (response.ok) {
                    var string = "![](" + unsplash.urls.regular + ")\n Image by [[" + unsplash.user.name + "]] at [Unsplash](" + unsplash.user.links.html + ")";
                    return [{ text: string },];
                } else {
                    console.log(data);
                }
            }
        };
    }
}

async function fetchPexels({ extensionAPI }) {
    var display, mode, key, urlPexels;
    breakme: {
        if (!extensionAPI.settings.get("pexels-apiKey")) {
            key = "APIP";
            sendConfigAlert(key);
        } else {
            const accessKey = extensionAPI.settings.get("pexels-apiKey");
            display = extensionAPI.settings.get("pexels-orientation");
            mode = extensionAPI.settings.get("pexels-mode");

            urlPexels = "https://api.pexels.com/v1/search";
            document.pexelsURL = "";
            var thisBlock = await window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];

            var myHeaders = new Headers();
            myHeaders.append("Authorization", accessKey);
            var requestOptions = {
                method: 'GET',
                headers: myHeaders,
                redirect: 'follow'
            };

            if (mode == "prompt") {
                iziToast.question({
                    theme: 'light',
                    color: 'black',
                    layout: 2,
                    drag: false,
                    timeout: false,
                    close: false,
                    overlay: true,
                    displayMode: 2,
                    id: "question",
                    title: "Pexel Image Embed",
                    message: "What mood | mode | theme do you want?",
                    position: "center",
                    inputs: [
                        [
                            '<input type="text" placeholder="relaxed">',
                            "keyup",
                            function (instance, toast, input, e) {
                                if (e.code === "Enter") {
                                    getPromptImageP(e.srcElement.value, urlPexels, thisBlock, display, requestOptions);
                                    instance.hide({ transitionOut: "fadeOut" }, toast, "button");
                                }
                            },
                            true,
                        ],
                    ],
                    buttons: [
                        [
                            "<button><b>Confirm</b></button>",
                            async function (instance, toast, button, e, inputs) {
                                instance.hide({ transitionOut: "fadeOut" }, toast, "button");
                                getPromptImageP(inputs[0].value, urlPexels, thisBlock, display, requestOptions);
                            },
                            false,
                        ],
                        [
                            "<button>Cancel</button>",
                            async function (instance, toast, button, e) {
                                instance.hide({ transitionOut: "fadeOut" }, toast, "button");
                            },
                        ],
                    ],
                    onClosing: function (instance, toast, closedBy) { },
                    onClosed: function (instance, toast, closedBy) { },
                });
            } else {
                urlPexels = "https://api.pexels.com/v1/curated?per_page=1";
                urlPexels += "&orientation=" + display + "";
                const response = await fetch(urlPexels, requestOptions);
                const pexels = await response.json();
                if (response.ok) {
                    var string = "![](" + pexels.photos[0].src.original + ")\n Image by [[" + pexels.photos[0].photographer + "]] at [Pexels](" + pexels.photos[0].photographer_url + ")";
                    return [{ text: string },];
                } else {
                    console.log(data);
                }
            }
        };
    }
}

async function fetchPixabay({ extensionAPI }) {
    var display, mode, key, urlPixabay, urlPixabay2, safe, editor, lang;
    breakme: {
        if (!extensionAPI.settings.get("pixabay-apiKey")) {
            key = "APIPix";
            sendConfigAlert(key);
        } else {
            const accessKey = extensionAPI.settings.get("pixabay-apiKey");
            display = extensionAPI.settings.get("pixabay-orientation");
            safe = extensionAPI.settings.get("pixabay-safesearch");
            editor = extensionAPI.settings.get("pixabay-editors_choice");
            lang = extensionAPI.settings.get("pixabay-lang");
            mode = extensionAPI.settings.get("pixabay-mode");

            urlPixabay = "https://pixabay.com/api/?key=" + accessKey;
            urlPixabay2 = urlPixabay + "&image_type=photo&safesearch=" + safe + "&editors_choice=" + editor + "&orientation=" + display + "&lang=" + lang + "";
            var thisBlock = await window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];

            if (mode == "prompt") {
                iziToast.question({
                    theme: 'light',
                    color: 'black',
                    layout: 2,
                    drag: false,
                    timeout: false,
                    close: false,
                    overlay: true,
                    displayMode: 2,
                    id: "question",
                    title: "Pixabay Image Embed",
                    message: "What mood | mode | theme do you want?",
                    position: "center",
                    inputs: [
                        [
                            '<input type="text" placeholder="relaxed">',
                            "keyup",
                            function (instance, toast, input, e) {
                                if (e.code === "Enter") {
                                    getPromptImagePix(e.srcElement.value, urlPixabay2, thisBlock);
                                    instance.hide({ transitionOut: "fadeOut" }, toast, "button");
                                }
                            },
                            true,
                        ],
                    ],
                    buttons: [
                        [
                            "<button><b>Confirm</b></button>",
                            async function (instance, toast, button, e, inputs) {
                                instance.hide({ transitionOut: "fadeOut" }, toast, "button");
                                getPromptImagePix(inputs[0].value, urlPixabay2, thisBlock);
                            },
                            false,
                        ],
                        [
                            "<button>Cancel</button>",
                            async function (instance, toast, button, e) {
                                instance.hide({ transitionOut: "fadeOut" }, toast, "button");
                            },
                        ],
                    ],
                    onClosing: function (instance, toast, closedBy) { },
                    onClosed: function (instance, toast, closedBy) { },
                });
            } else {
                const response = await fetch(urlPixabay2);
                const pixabayTotal = await response.json();
                var pixabayTotalImages = undefined;
                if (response.ok) {
                    pixabayTotalImages = parseInt(pixabayTotal.totalHits);
                } else {
                    console.log(data);
                }

                if (pixabayTotalImages != undefined) {
                    let pageNum = Math.ceil(pixabayTotalImages / 20) + 1;
                    pageNum = randomIntFromInterval(1, pageNum);
                    let urlPixabay3 = urlPixabay2 + "&page=" + pageNum + "";
                    const response2 = await fetch(urlPixabay3);
                    const pixabay = await response2.json();
                    if (response2.ok) {
                        var ranNum = randomIntFromInterval(1, pixabay.hits.length) - 1;
                        var usrURL = "https://pixabay.com/users/" + pixabay.hits[ranNum].user + "-" + pixabay.hits[ranNum].user_id + "";
                        var lgURL = "[Large Image](" + pixabay.hits[ranNum].largeImageURL + ")";
                        var string = "![](" + pixabay.hits[ranNum].webformatURL + ")\n Image by [[" + pixabay.hits[ranNum].user + "]] at [Pixabay](" + usrURL + ")";
                        return [{
                            text: string,
                            children: [
                                { text: lgURL },
                            ]
                        }];
                    } else {
                        console.log(data);
                    }
                }
            }
        };
    }
}

async function getPromptImage(val, urlUnsplash, thisBlock, display, width) {
    urlUnsplash += "&query=" + val + "&w=" + width + "&orientation=" + display + "";
    const response = await fetch(urlUnsplash);
    const unsplash = await response.json();
    if (response.ok) {
        var string = "![](" + unsplash.urls.regular + ")\n'" + val + "' image by [[" + unsplash.user.name + "]] at [Unsplash](" + unsplash.user.links.html + ")";
        await window.roamAlphaAPI.updateBlock(
            { block: { uid: thisBlock, string: string.toString(), open: true } });
    } else {
        console.log(data);
    }
}

async function getPromptImageP(val, urlPexels, thisBlock, display, requestOptions) {
    urlPexels += "?query=" + val + "&orientation=" + display + "&per_page=1";
    const response = await fetch(urlPexels, requestOptions);
    const pexels = await response.json();
    if (response.ok) {
        var string = "![](" + pexels.photos[0].src.original + ")\n'" + val + "' image by [[" + pexels.photos[0].photographer + "]] at [Pexels](" + pexels.photos[0].photographer_url + ")";
        await window.roamAlphaAPI.updateBlock(
            { block: { uid: thisBlock, string: string.toString(), open: true } });
    } else {
        console.log(data);
    }
}

async function getPromptImagePix(val, url, thisBlock) {
    url += "&q=" + encodeURIComponent(val) + "";
    const response = await fetch(url);
    const pixabayTotal = await response.json();
    var pixabayTotalImages = undefined;
    if (response.ok) {
        pixabayTotalImages = parseInt(pixabayTotal.totalHits);
    } else {
        console.log(data);
    }

    var urlPixabay3, pageNum;
    if (pixabayTotalImages != undefined) {
        pageNum = Math.ceil(pixabayTotalImages / 20);
        pageNum = randomIntFromInterval(1, pageNum);
        urlPixabay3 = url + "&page=" + pageNum + "";
    }

    const response2 = await fetch(urlPixabay3);
    const pixabay = await response2.json();
    if (response2.ok) {
        if (pixabay.hits.length > 0) {
            var ranNum = randomIntFromInterval(1, pixabay.hits.length) - 1;
            var usrURL = "https://pixabay.com/users/" + pixabay.hits[ranNum].user + "-" + pixabay.hits[ranNum].user_id + "";
            var lgURL = "[Large Image](" + pixabay.hits[ranNum].largeImageURL + ")";
            var string = "![](" + pixabay.hits[ranNum].webformatURL + ")\n Image by [[" + pixabay.hits[ranNum].user + "]] at [Pixabay](" + usrURL + ")";
            await window.roamAlphaAPI.updateBlock(
                { block: { uid: thisBlock, string: string.toString(), open: true } });
            var newBlock = window.roamAlphaAPI.util.generateUID();
            await window.roamAlphaAPI.createBlock({
                location: { "parent-uid": thisBlock, order: 1 },
                block: { string: lgURL.toString(), uid: newBlock }
            });
        } else {
            alert("There were no images available using your search term and settings!")
        }
    } else {
        console.log(data);
    }
}

export default {
    onload: onload,
    onunload: onunload
};

function sendConfigAlert(key) {
    if (key == "APIU") {
        alert("Please set your Unsplash Access key in the configuration settings via the Roam Depot tab.");
    } else if (key == "APIP") {
        alert("Please set your Pexels API key in the configuration settings via the Roam Depot tab.");
    } else if (key == "width") {
        alert("Please set the width as an integer in the configuration settings via the Roam Depot tab.");
    } else if (key == "display") {
        alert("Please set the display mode to either landscape, portrait or squarish in the configuration settings via the Roam Depot tab.");
    } else if (key == "mode") {
        alert("Please set the import mode to either random or prompt in the configuration settings via the Roam Depot tab.");
    } else if (key == "APIPix") {
        alert("Please set your Pixabay API key in the configuration settings via the Roam Depot tab.");
    }
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}