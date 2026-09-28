export class XmlEditor {

    constructor(
        container,
        textarea,
        toggleButton,
        fileInput
    ) {

        this.container = container;
        this.textarea = textarea;
        this.toggleButton = toggleButton;
        this.fileInput = fileInput;

        this.onChanged = null;
    }


    setXml(xml) {

        this.textarea.value = xml;
    }


    getXml() {

        return this.textarea.value;
    }


    show() {

        this.container.style.display =
            "block";

        this.toggleButton.textContent =
            "Raw XML ausblenden";
    }


    hide() {

        this.container.style.display =
            "none";

        this.toggleButton.textContent =
            "Raw XML";
    }


    toggle() {

        

        const visible =
            this.container.style.display !== "none";
    
        console.log("Toogle:" + visible);
    
        if (visible) {
            this.hide();
        } else {
            this.show();
        }
    }


    async readLocalFile(file) {

        return await file.text();
    }


    setModified(modified) {

        this.textarea.classList.toggle(
            "modified",
            modified
        );
    }


    onChange(callback) {

        this.onChanged = callback;
    }


    initialize() {

        this.textarea.addEventListener(
            "input",
            () => {

                this.setModified(true);

                if (this.onChanged) {
                    this.onChanged(
                        this.getXml()
                    );
                }
            }
        );

        this.toggleButton.addEventListener(
            "click",
            () => this.toggle()
        );
    }
}