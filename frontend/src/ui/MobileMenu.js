export class MobileMenu {

    constructor(container, items = [], onMenuAction = null) {

        this.container = container;
        this.items = items;
        this.onMenuAction = onMenuAction;

        this.render();
    }


    render() {

        this.container.innerHTML = "";

        this.menuButton = this.createMenuButton();
        this.menu = this.createMenu();

        this.container.appendChild(this.menuButton);
        this.container.appendChild(this.menu);
    }


    createMenuButton() {

        const button = document.createElement("button");

        button.className = "mobile-menu-button";
        button.setAttribute("aria-label", "Menü öffnen");

        button.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;

        button.addEventListener("click", () => {
            this.toggle();
        });

        return button;
    }


    createMenu() {

        const menu = document.createElement("nav");

        menu.className = "mobile-menu";

        for (const item of this.items) {
            menu.appendChild(this.createItem(item));
        }

        return menu;
    }


    createItem(item) {

        // Untergruppe
        if (item.children) {
            return this.createGroup(item);
        }

        // Einzelner Menüpunkt
        if (item.action) {
            return this.createAction(item);
        }

        throw new Error(
            "Ungültiger Menüeintrag: " + item.label
        );
    }


    createGroup(item) {

        const group = document.createElement("div");

        group.className = "mobile-menu-group";


        const button = document.createElement("button");

        button.className = "mobile-menu-item";

        button.innerHTML = `
            <span>${item.label}</span>
            <span class="mobile-menu-arrow">▶</span>
        `;


        const submenu = document.createElement("div");

        submenu.className = "mobile-menu-submenu";


        button.addEventListener("click", () => {

            const open = group.classList.toggle("open");

            const arrow =
                button.querySelector(".mobile-menu-arrow");

            arrow.textContent = open ? "▼" : "▶";
        });


        for (const child of item.children) {

            submenu.appendChild(
                this.createItem(child)
            );
        }


        group.appendChild(button);
        group.appendChild(submenu);

        return group;
    }


    createAction(item) {

        const button = document.createElement("button");

        button.className = "mobile-menu-item";

        button.textContent = item.label;


        button.addEventListener("click", () => {

            if (this.onMenuAction) {
                this.onMenuAction(item.action);
            }
            this.close();
        });


        return button;
    }


    toggle() {

        this.menu.classList.toggle("open");
        this.menuButton.classList.toggle("open");
    }


    close() {

        this.menu.classList.remove("open");
        this.menuButton.classList.remove("open");
    }
}