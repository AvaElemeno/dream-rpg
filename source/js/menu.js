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
        console.info(this.registry.list);

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

        // Left Side Menu
        this.graphics.strokeRect(2, 2, 220, 236);
        this.graphics.fillRect(2, 2, 220, 236);

        // Right Side MEnu
        this.graphics.strokeRect(220, 2, 98, 236);
        this.graphics.fillRect(220, 2, 98, 236);

        // Listen for keyboard events
        this.input.keyboard.on("keydown", this.onKeyInput, this);

        // Setup Sub Menu
        this.subMenu = new subMenu(this, this.events);
        this.add.existing(this.subMenu);
        this.subMenu.depth = 1000;

        // Handle basic navigation
        this.currentSelection = 0;
        this.buildMenu();                  
    },

    // Initialize the Main Menu 
    // (Right side only for now)
    buildMenu: function() {

        this.mainMenuItems = [
            { text:"Items",     callback:this.placeholderCallback },
            { text:"Equpment",  callback:this.placeholderCallback },
            { text:"Skills",    callback:this.placeholderCallback },
            { text:"Jobs",      callback:this.placeholderCallback },
            { text:"Stats",     callback:this.placeholderCallback },
            { text:"Save",      callback:this.placeholderCallback }
        ];

        // Call the Menu Class
        this.mainMenu = new MainMenu(230, 10, this);
        this.mainMenu.remap(this.mainMenuItems);
        this.mainMenu.select(0);
    },

    // Handle Cursor Positioning
    moveCursor: function(item) {
        this.cursor.x = item.x - 15;
        this.cursor.y = item.y + 8;
    },

    // Template callback function for menu items
    placeholderCallback: function(scene, item) {
        //console.info(scene);
        scene.events.emit("subMenu", item.text);        
    },

    // Handle Key events
    onKeyInput: function(event) {

        // Simple
        var mainMenuFocused = !this.scene.scene.subMenu.visible;

        // Enter Exits Menu
        if (event.code === "Enter") {
            this.scene.sleep();
            this.scene.switch('WorldScene');
        }

        // Menu Navigation
        else if ((event.code === "ArrowDown" ||
                  event.code === "KeyS") && mainMenuFocused) {
            let loc = this.mainMenu.moveSelectionDown();
            this.moveCursor(loc);
            this.move.play();
        }
        else if ((event.code === "ArrowUp" ||
                  event.code === "KeyW") && mainMenuFocused) {
            let loc = this.mainMenu.moveSelectionUp();
            this.moveCursor(loc);
            this.move.play();
        }
    
        else if (event.code === "Space") {
            if (!mainMenuFocused) {
                this.scene.scene.subMenu.hideSubMenu();
                this.move.play();
            } else {
                this.mainMenu.confirm(this.scene.scene);
                this.move.play();
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
    }
    
});


// Class Container for Menu Items
var Menu = new Phaser.Class({
    Extends: Phaser.GameObjects.Container,
    initialize:
            
    function Menu(x, y, scene, items) {
        Phaser.GameObjects.Container.call(this, scene, x, y);
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
    }
});

// Class that handles Right Side Menu
// (It will matter when submenus and Left side exists)
var MainMenu = new Phaser.Class({
    Extends: Menu,
    initialize:
            
    function MainMenu(x, y, scene) {
        Menu.call(this, x, y, scene);                    
    }
});

// Sub Menu class
var subMenu = new Phaser.Class({
    Extends: Phaser.GameObjects.Container,
    initialize:
    
    function subMenu(scene, events) {
        Phaser.GameObjects.Container.call(this, scene, 0,0);//160, 30);
        var graphics = this.scene.add.graphics();
        this.add(graphics);
        
        graphics.lineStyle(4, 0xff10f0);
        graphics.fillStyle(0x220733, 1);
        graphics.strokeRect(2, 2, 316, 236);
        graphics.fillRect(2, 2, 316, 236);

        // graphics.lineStyle(1, 0xffffff, 0.8);
        // graphics.fillStyle(0x031f4c, 0.3);        
        // graphics.strokeRect(-90, -15, 180, 30);
        // graphics.fillRect(-90, -15, 180, 30);


        this.text = new Phaser.GameObjects.Text(
            scene, 30, 20, "", { 
                color: "#ffffff", 
                align: "center", 
                fontSize: 13, 
                wordWrap: { width: 170, useAdvancedWrap: true }
            });
        this.add(this.text);
        this.text.setOrigin(0.5);        
        events.on("subMenu", this.showSubMenu, this);
        this.visible = false;
    },
    showSubMenu: function(text) {
        this.text.setText(text);
        this.visible = true;
        // if(this.hideEvent)
        //     this.hideEvent.remove(false);
        //this.hideEvent = this.scene.time.addEvent({ delay: 2000, callback: this.hideSubMenu, callbackScope: this });
    },
    hideSubMenu: function() {
        this.hideEvent = null;
        this.visible = false;
    }
});