const config = {
    tabTitle: "Unsplash import",
    settings: [
        {
            id: "unsplash-accessKey",
            name: "Unsplash Access key *",
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

export default {
    onload: ({ extensionAPI }) => {
        extensionAPI.settings.panel.create(config);

        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Unsplash import",
            callback: () => fetchUnsplash().then(string =>
                window.roamAlphaAPI.updateBlock({
                    block: {
                        uid: window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"],
                        string: string,
                    }
                })
            ),
        });

        const args = {
            text: "UNSPLASH",
            help: "Import an image from Unsplash",
            handler: (context) => fetchUnsplash,
        };

        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.registerCommand(args);
        } else {
            document.body.addEventListener(
                `roamjs:smartblocks:loaded`,
                () =>
                    window.roamjs?.extension.smartblocks &&
                    window.roamjs.extension.smartblocks.registerCommand(args)
            );
        }

        async function fetchUnsplash() {
            var width, display, mode, key, urlUnsplash;
            breakme: {
                if (!extensionAPI.settings.get("unsplash-accessKey")) {
                    key = "API";
                    sendConfigAlert(key);
                } else {
                    const accessKey = extensionAPI.settings.get("unsplash-accessKey");
                    if (!extensionAPI.settings.get("unsplash-width")) {
                        width = "600";
                        console.log("width set to default");
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
                        console.log("display mode set to default");
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
                        console.log("import mode set to default");
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
                    const defaultQuery = "relaxed";
                    urlUnsplash = "https://api.unsplash.com/photos/random?client_id=" + accessKey + "";
                    document.unsplashURL = "";

                    if (mode == "prompt") {
                        var query = prompt("What mood | mode | theme do you want?", defaultQuery);
                        urlUnsplash += "&query=" + query + "";
                    }
                    urlUnsplash += "&w=" + width + "&orientation=" + display + "";

                    const response = await fetch(urlUnsplash);
                    const unsplash = await response.json();
                    if (response.ok) {
                        if (typeof query == 'undefined') {
                            var string = "![](" + unsplash.urls.regular + ")\n Image by [[" + unsplash.user.name + "]] at [Unsplash](" + unsplash.user.links.html + ")";
                        } else {
                            var string = "![](" + unsplash.urls.regular + ")\n'" + query + "' Image by [[" + unsplash.user.name + "]] at [Unsplash](" + unsplash.user.links.html + ")";
                        }
                        return (string);
                    } else {
                        console.log(data);
                    }
                };
            }
        }
    },
    onunload: () => {
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'Unsplash import'
        });
        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.unregisterCommand("UNSPLASH");
        }
    }
}

function sendConfigAlert(key) {
    if (key == "API") {
        alert("Please set the API key in the configuration settings via the Roam Depot tab.");
    } else if (key == "width") {
        alert("Please set the width as an integer in the configuration settings via the Roam Depot tab.");
    } else if (key == "display") {
        alert("Please set the display mode to either landscape, portrait or squarish in the configuration settings via the Roam Depot tab.");
    } else if (key == "mode") {
        alert("Please set the import mode to either random or prompt in the configuration settings via the Roam Depot tab.");
    }
}