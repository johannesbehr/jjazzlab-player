
export class MessageBox {
    constructor(container) {
        this.container = container;
        this.initialized = false;
        this.resolve = null;
    }

    initialize() {
        if (this.initialized) return;

        this.container.className = "message-overlay";
        this.container.hidden = true;
        this.container.innerHTML = `
            <div class="message-box"
                 role="dialog"
                 aria-modal="true"
                 aria-labelledby="messageBoxTitle">
                <h2 id="messageBoxTitle"></h2>
                <div id="messageBoxText"></div>
                <div class="message-box-buttons"></div>
            </div>
        `;

        this.titleElement =
            this.container.querySelector("#messageBoxTitle");
        this.textElement =
            this.container.querySelector("#messageBoxText");
        this.buttonsElement =
            this.container.querySelector(".message-box-buttons");

        this.initialized = true;
    }

    show(firstParam, message, options = [
        { label: "OK", value: true, primary: true }
    ]) {
        if (!this.initialized) this.initialize();

        if (this.resolve) {
            throw new Error("MessageBox ist bereits geöffnet.");
        }

        let title = "";
       
        if (typeof firstParam === "string") {
            title = firstParam;
        } else{
            if(firstParam.title){
                title = firstParam.title;
            }
            if(firstParam.message){
                message = firstParam.message;
            }
            if(firstParam.options){
                options = firstParam.options;
            }
        }

        this.titleElement.textContent = title;
        this.textElement.textContent = message;
        this.buttonsElement.replaceChildren();
        this.container.hidden = false;

        return new Promise(resolve => {
            this.resolve = resolve;

            options.forEach((button, index) => {
                const element =
                    document.createElement("button");

                element.textContent = button.label;

                if (button.primary) {
                    element.classList.add("primary");
                }

                element.addEventListener("click", () => {
                    this.container.hidden = true;

                    const finish = this.resolve;
                    this.resolve = null;
                    finish(button.value);
                });

                this.buttonsElement.appendChild(element);

                if (index === 0) element.focus();
            });
        });
    }
}