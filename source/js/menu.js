//#######################
//      MAIN MENU      //
//#######################

// Base Class for handling the entire Main Menu
var MainMenuScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:

    function MainMenuScene ()
    {
        Phaser.Scene.call(this, { key: "MainMenuScene" });
    },
    create: function ()
    {    
        
        // GLobals
        //console.info(this.registry.list);

        // Sounds Declaration
        this.move = this.registry.get('sounds').FF7CursorMove;

        // Add Cursor
        this.cursor = this.scene.scene.add.sprite(215, 18, "cursor");
        this.cursor.depth = 999;
        this.cursor.setScale(.3);

        // Change the background to blue
        this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0.5)");

        // Add menu background
        this.graphics = this.add.graphics();
        
        // Colors and Style for Menu Window 
        // (figure out gradiant later)
        this.graphics.lineStyle(4, 0xff10f0);
        this.graphics.fillStyle(0x220733, 1);

        // Menu BG
        this.graphics.strokeRect(2, 2, 316, 236);
        this.graphics.fillRect(2, 2, 316, 236);
        
        // Listen for keyboard events
        this.input.keyboard.on("keydown", this.onKeyInput, this);

        // Setup Sub Menu (the template sub menu example)
        this.subMenuContainer = new SubMenuContainer(this, this.events);
        this.add.existing(this.subMenuContainer);
        this.subMenuContainer.depth = 901;

         // Setup Items Menu (following above template)
        this.itemsMenuContainer = new ItemsMenuContainer(this, this.events);
        this.add.existing(this.itemsMenuContainer);
        this.itemsMenuContainer.depth = 901;

        // Handle basic navigation
        this.currentSelection = 0;  // <-- is this still used?
        this.buildMenu();
        this.focusedMenu = this.mainMenu;            
    },

    // Initialize the Main Menu 
    // (Right side only for now)
    buildMenu: function() {
        this.mainMenuItems = [
            { text:"Items",     callback:this.itemsMenuCallback },
            { text:"Equpment",  callback:this.placeholderCallback },
            { text:"Skills",    callback:this.placeholderCallback },
            { text:"Jobs",      callback:this.placeholderCallback },
            { text:"Stats",     callback:this.placeholderCallback },
            { text:"Save",      callback:this.placeholderCallback }
        ];

        // Call the Menu Class
        this.mainMenu = new SubMenu(230, 10, 100, 130, 10, 10, this, 1, undefined, "options");
        this.mainMenu.remap(this.mainMenuItems);
        this.mainMenu.select(0);
    },

    // Handle Cursor Positioning
    moveCursor: function(item, offset) {
        var mult = (!!offset)?offset:0;
        this.cursor.x = item.x - 15;
        this.cursor.y = item.y + (20 * mult) + 8;
    },

    // Template callback function for menu items
    placeholderCallback: function(scene, item) {
        scene.events.emit("SubMenuContainer", item.text);        
    },

    // Callback for opening Items Sub Menu
    itemsMenuCallback: function(scene, item) {
        scene.events.emit("ItemsMenuContainer", item.text);        
    },

    // Handle Key events
    // !! NOTE: Later on, change to switch statement... more efficient
    onKeyInput: function(event) {

        // Simple check for if we are on Main Menu (right)
        var mainMenuFocused = !this.scene.scene.subMenuContainer.visible && 
            !this.scene.scene.itemsMenuContainer.visible;

        // Enter Exits Menu
        if (event.code === "Enter") {
            
            // Reset Menu
            this.focusedMenu = this.mainMenu;
            this.scene.scene.subMenuContainer.hideSubMenuContainer();
            this.scene.scene.itemsMenuContainer.hideItemsMenuContainer();
            this.mainMenu.select(0);
            this.cursor.x = 215;
            this.cursor.y = 18;

            // Do the Switch
            this.cameras.main.fadeIn(250);
            this.scene.sleep();
            this.scene.switch('WorldScene');
        }

        // Menu Navigation
        else if (event.code === "ArrowDown" ||
                 event.code === "KeyS") {
            let loc = this.focusedMenu.moveSelectionDown();
            this.moveCursor(loc);
            this.move.play();
        }
        else if (event.code === "ArrowUp" ||
                 event.code === "KeyW") {
            let loc = this.focusedMenu.moveSelectionUp();
            this.moveCursor(loc);
            this.move.play();
        }
    
        // Confirm (when in menu)
        else if (event.code === "Space") {

            // If the Main Menu is focused, open Sub Menu
            if (mainMenuFocused) {

                // Choose which subMenu to open
                switch (this.focusedMenu.menuItemIndex) {
                    case 0: this.focusedMenu = this.itemsMenuContainer.subMenu; break;
                    case 1: this.focusedMenu = this.subMenuContainer.subMenu; break;
                    case 2: this.focusedMenu = this.subMenuContainer.subMenu; break;
                    case 3: this.focusedMenu = this.subMenuContainer.subMenu; break;
                    case 4: this.focusedMenu = this.subMenuContainer.subMenu; break;
                    case 5: this.focusedMenu = this.subMenuContainer.subMenu; break;
                    default: this.focusedMenu = this.subMenuContainer.subMenu;
                }
                
                // Do the Camera and Cursor handling
                this.cameras.main.fadeIn(250);
                this.move.play();
                this.moveCursor(this.focusedMenu, this.focusedMenu.menuItemIndex);
                this.mainMenu.confirm(this.scene.scene);
            }
            // Else we are in a Sub Menu, therefore should execute those callbacks
            else {
                //should run the confirm function for current menu
                console.log("select");
            }
        }

        // Return to Main Menu (if in Sub Menu)
        else if (event.code === "Escape") {
            if (!mainMenuFocused) {

                // Handle Cameras and Cursor
                this.cameras.main.fadeIn(250);
                this.focusedMenu = this.mainMenu;
                this.move.play();
                this.moveCursor(this.focusedMenu, this.focusedMenu.menuItemIndex);

                // Close Current Menu (TODO: break based on which menu is focused)
                this.scene.scene.subMenuContainer.hideSubMenuContainer();
                this.scene.scene.itemsMenuContainer.hideItemsMenuContainer();
            }
        }
    }
});


// Class handling each individual Menu Entry
var MenuItem = new Phaser.Class({
    Extends: Phaser.GameObjects.Text,
    initialize:
            
    function MenuItem(x, y, item, scene) {
        Phaser.GameObjects.Text.call(
            this, scene, x, y, item.text, 
            { color: "#ffffff", align: "left", fontSize: 15});

        this.text = this.scene.add.text(
            x, y, item.text, { 
            color: "#ffffff", 
            fontSize: 11,
            align: "center",
            wordWrap: { width: 170, useAdvancedWrap: true }
        });
        this.item = item;
    },
    
    select: function() {
        this.text.setColor("#39ff14");
    },
    
    deselect: function() {
        this.text.setColor("#ffffff");
    },

    visibility: function(visible) {
        this.text.visible = visible;
    },
    assignDepth: function(d) {
        this.text.depth = d;
    }
});


// Class Container for Menu Items
var Menu = new Phaser.Class({
    Extends: Phaser.GameObjects.Container,
    initialize:
            
    function Menu(x, y, w, h, scene, depth, options) {

        // Initial Declarations
        Phaser.GameObjects.Container.call(this, scene, x, y);
        this.options = options;
        this.width = w;
        this.height = h;
        this.menuItems = [];
        this.menuItemIndex = 0;
        this.x = x;
        this.y = y;        
        this.selected = false;

    },     
    addMenuItem: function(item) {
        var menuItem = new MenuItem(this.x, this.y + this.menuItems.length * 20, item, this.scene);
        this.menuItems.push(menuItem);
        this.add(menuItem); 
        return menuItem;
    },  
    // menu navigation 
    moveSelectionUp: function() {
        this.menuItems[this.menuItemIndex].deselect();
        do {
            this.menuItemIndex--;
            if(this.menuItemIndex < 0)
                this.menuItemIndex = this.menuItems.length - 1;
        } while(!this.menuItems[this.menuItemIndex].active);
        this.menuItems[this.menuItemIndex].select();
        return this.menuItems[this.menuItemIndex];
    },
    moveSelectionDown: function() {
        this.menuItems[this.menuItemIndex].deselect();
        do {
            this.menuItemIndex++;
            if(this.menuItemIndex >= this.menuItems.length)
                this.menuItemIndex = 0;
        } while(!this.menuItems[this.menuItemIndex].active);
        this.menuItems[this.menuItemIndex].select();
        return this.menuItems[this.menuItemIndex];
    },
    // select the menu as a whole and highlight the choosen element
    select: function(index) {
        if(!index)
            index = 0;       
        this.menuItems[this.menuItemIndex].deselect();
        this.menuItemIndex = index;
        while(!this.menuItems[this.menuItemIndex].active) {
            this.menuItemIndex++;
            if(this.menuItemIndex >= this.menuItems.length)
                this.menuItemIndex = 0;
            if(this.menuItemIndex == index)
                return;
        }        
        this.menuItems[this.menuItemIndex].select();
        this.selected = true;
    },
    // deselect this menu
    deselect: function() {        
        this.menuItems[this.menuItemIndex].deselect();
        this.menuItemIndex = 0;
        this.selected = false;
    },
    confirm: function(scene) {
        // run the callback
        this.menuItems[this.menuItemIndex].item.callback(scene, this.menuItems[this.menuItemIndex].item);
    },
    // clear menu and remove all menu items
    clear: function() {
        for(var i = 0; i < this.menuItems.length; i++) {
            this.menuItems[i].destroy();
        }
        this.menuItems.length = 0;
        this.menuItemIndex = 0;
    },
    // recreate the menu items
    remap: function(items) {
        this.clear();        
        for(var i = 0; i < items.length; i++) {
            var item = items[i];

            this.addMenuItem(item);
                   
        }
        this.menuItemIndex = 0;
    },
    // Helpful for visibility toggling
    visibility: function(val) {
        for(var i = 0; i < this.menuItems.length; i++) {
            this.menuItems[i].visibility(val);
        }
    },
    assignDepth: function(val){
        for(var i = 0; i < this.menuItems.length; i++) {
            this.menuItems[i].assignDepth(val);
        }
    }
});

// Class to handle Sub Menus
// !! NOTE : This class is confusingly named but is essentially a container
// for the specific calling of a menu. Maybe should be combined with the menu Class
var SubMenu = new Phaser.Class({
    Extends: Menu,
    initialize:
            
    function SubMenu(x, y, w, h, x_padding, y_padding, scene, depth, parent, options) {
        
        // BG setup
        var graphics = scene.add.graphics();
        var lineWidth = 2;

        // This toggles whether there should be a 
        // background hiding the previous menu layer
        if (!!parent) { parent.add(graphics); }
        
        // Menu BG
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.x_padding = x_padding;
        this.y_padding = y_padding;

        graphics.lineStyle(4, 0xff10f0);
        graphics.fillStyle(0x220733, 1);
        graphics.strokeRect(
            ((this.x + lineWidth) - this.x_padding), 
            ((this.y + lineWidth) - this.y_padding), 
            (this.width - (lineWidth * 2)),
            (this.height - (lineWidth * 2))
        );
        graphics.fillRect(
            ((this.x + lineWidth) - this.x_padding), 
            ((this.y + lineWidth) - this.y_padding), 
            (this.width - (lineWidth * 2)),
            (this.height - (lineWidth * 2))
        );

        Menu.call(this, x, y, w, h, scene, depth, options);                    
    }
});

// Container for anything unique for a specific sub menu
// This is essentially a template, there should be a container
// for each subMenu selected from the main menu
var SubMenuContainer = new Phaser.Class({
    Extends: Phaser.GameObjects.Container,
    initialize:
    
    function SubMenuContainer(scene, events) {
        Phaser.GameObjects.Container.call(this, scene, 0,0);
        var graphics = this.scene.add.graphics();
        this.add(graphics);
        
        // Setup a sub menu
        // !! this is sample data, should pull from global inventory
        this.subMenuItems = [
            { text:"Example 1",   callback:null },
            { text:"Example 2",   callback:null },
            { text:"Example 3",   callback:null }
        ];

        // Call the SubMenu Class
        this.subMenu = new SubMenu(20, 10, 320, 240, 20, 10, this.scene, 902, this, "hello world");
        this.subMenu.remap(this.subMenuItems);
        this.subMenu.select(0);
        this.subMenu.depth = 902;
        
        // Add a call event
        events.on("SubMenuContainer", this.showSubMenuContainer, this);
        this.subMenu.visibility(false);
        this.subMenu.assignDepth(902);
        this.visible = false;
    },
    showSubMenuContainer: function(text) {
        this.subMenu.visibility(true);
        this.visible = true;
    },
    hideSubMenuContainer: function() {
        this.subMenu.visibility(false);
        this.visible = false;
    }
});

// Container for the Items Menu
var ItemsMenuContainer = new Phaser.Class({
    Extends: Phaser.GameObjects.Container,
    initialize:
    
    function ItemsMenuContainer(scene, events) {
        Phaser.GameObjects.Container.call(this, scene, 0,0);
        var graphics = this.scene.add.graphics();
        this.add(graphics);
        
        // Setup a sub menu
        // !! this is sample data, should pull from global inventory
        this.subMenuItems = [
            { text:"Med Pack (S)",   callback:null },
            { text:"Med Pack (M)",   callback:null },
            { text:"Med Pack (L)",   callback:null }
        ];

        // Call the SubMenu Class
        this.subMenu = new SubMenu(20, 10, 320, 240, 20, 10, this.scene, 902, this, "hello world");
        this.subMenu.remap(this.subMenuItems);
        this.subMenu.select(0);
        this.subMenu.depth = 902;
        
        // Add a call event
        events.on("ItemsMenuContainer", this.showItemsMenuContainer, this);
        this.subMenu.visibility(false);
        this.subMenu.assignDepth(902);
        this.visible = false;
    },
    showItemsMenuContainer: function(text) {
        this.subMenu.visibility(true);
        this.visible = true;
    },
    hideItemsMenuContainer: function() {
        this.subMenu.visibility(false);
        this.visible = false;
    }
});
