import iziToast from "izitoast";

const config = {
    tabTitle: "Unsplash & Pexels Embed",
    settings: [
        {
            id: "unsplash-accessKey",
            name: "Unsplash Access key",
            description: "Your Access Key from https://unsplash.com/oauth/applications",
            action: { type: "input", placeholder: "Add Unsplash Access key here" },
        },
        {
            id: "pexels-apiKey",
            name: "Pexels API key",
            description: "Your API Key from https://www.pexels.com/api/new/",
            action: { type: "input", placeholder: "Add Pexels API key here" },
        },
        {
            id: "unsplash-width",
            name: "Image width",
            description: "Preferred width of image in pixels",
            action: { type: "input", placeholder: "600" },
        },
        {
            id: "unsplash-display",
            name: "Display mode",
            description: "portrait, landscape or squarish",
            action: { type: "input", placeholder: "landscape" },
        },
        {
            id: "unsplash-mode",
            name: "Import mode",
            description: "random or prompt",
            action: { type: "input", placeholder: "random" },
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
                const parentUid = uid || await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
                await window.roamAlphaAPI.updateBlock(
                    { block: { uid: parentUid, string: blocks[0].text.toString(), open: true } });
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
                const parentUid = uid || await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
                await window.roamAlphaAPI.updateBlock(
                    { block: { uid: parentUid, string: blocks[0].text.toString(), open: true } });
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
                    timeout: 20000,
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
                    return [{text: string},];
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
            if (!extensionAPI.settings.get("unsplash-display")) {
                display = "landscape";
            } else {
                const regexD = /^landscape|portrait|squarish$/;
                if (extensionAPI.settings.get("unsplash-display").match(regexD)) {
                    if (extensionAPI.settings.get("unsplash-display") == "squarish") {
                        display = "square";
                    } else {
                        display = extensionAPI.settings.get("pexels-orientation");
                    }
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
                    timeout: 20000,
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
                    return [{text: string},];
                } else {
                    console.log(data);
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
    //console.info(response);
    const pexels = await response.json();
    console.info(pexels);
    if (response.ok) {
        var string = "![](" + pexels.photos[0].src.original + ")\n'" + val + "' image by [[" + pexels.photos[0].photographer + "]] at [Pexels](" + pexels.photos[0].photographer_url + ")";
        await window.roamAlphaAPI.updateBlock(
            { block: { uid: thisBlock, string: string.toString(), open: true } });
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
    }
}