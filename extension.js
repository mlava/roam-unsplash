const config = {
    tabTitle: "Unsplash import",
    settings: [
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
            action: { type: "input", placeholder: "width in pixels" },
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
            if (!extensionAPI.settings.get("unsplash-accessKey")) {
                sendConfigAlert();
            } else if (!extensionAPI.settings.get("unsplash-width")) {
                sendConfigAlert();
            } else if (!extensionAPI.settings.get("unsplash-display")) {
                sendConfigAlert();
            } else if (!extensionAPI.settings.get("unsplash-mode")) {
                sendConfigAlert();
            } else {
                const accessKey = extensionAPI.settings.get("unsplash-accessKey");
                const width = extensionAPI.settings.get("unsplash-width");
                const display = extensionAPI.settings.get("unsplash-display");
                const mode = extensionAPI.settings.get("unsplash-mode");
                const defaultQuery = "relaxed";
                var urlUnsplash = "https://api.unsplash.com/photos/random?client_id=" + accessKey + "";

                document.unsplashURL = "";

                if (mode == "prompt") {
                    var query = prompt("What mood | mode | theme do you want?", defaultQuery);
                    urlUnsplash += "&query=" + query + "";
                }
                urlUnsplash += "&w=" + width + "&orientation=" + display + "";
                /*const settings = {
                    "url": urlUnsplash,
                    "method": "GET",
                    "timeout": 0,
                };*/

                const response = await fetch(urlUnsplash);
                const unsplash = await response.json();
                console.error(unsplash);
                if (response.ok) {
                    var string = "![](" + unsplash.urls.regular + ")\n'" + query + "' Image by [[" + unsplash.user.name + "]] at [Unsplash](" + unsplash.user.links.html + ")";
                    return (string);
                } else {
                    console.log(data);
                }
                /*
                                return new Promise((resolve) => $.ajax(settings).done(async function (response) {
                                    var jsonUnsplash = JSON.stringify(response);
                                    var unsplash = JSON.parse(jsonUnsplash);
                                    var string = "![](" + unsplash.urls.regular + ")\n'" + query + "' Image by [[" + unsplash.user.name + "]] at [Unsplash](" + unsplash.user.links.html + ")";
                                    resolve(string);
                                }));*/
            };
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