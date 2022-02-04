//##########################
//      BATTLE SCENE      //
//##########################
var BattleScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function BattleScene ()
    {
        Phaser.Scene.call(this, { key: "BattleScene" });
    },
    create: function ()
    {    
        // Fade in
        this.cameras.main.fadeIn(500);
        this.cameras.main.shake(300);

        // change the background to green
        this.cameras.main.setBackgroundColor("rgba(0, 200, 0, 0.5)");
        this.startBattle();
        // on wake event we call startBattle too
        this.sys.events.on('wake', this.startBattle, this);             
    },
    startBattle: function() {
        // player character - warrior
        var warrior = new PlayerCharacter(this, 250, 50, "player", 33, "Warrior", 100, 20);        
        this.add.existing(warrior);
        
        // player character - mage
        var mage = new PlayerCharacter(this, 250, 100, "player", 33, "Mage", 80, 8);
        this.add.existing(mage);            
        
        var enemy1 = new Enemy(this, 50, 50, "enemy1", null, "Dragon", 50, 3);
        this.add.existing(enemy1);
        
        var enemy2 = new Enemy(this, 50, 100, "enemy2", null,"Dragon2", 50, 3);
        this.add.existing(enemy2);
        
        // array with heroes
        this.heroes = [ warrior, mage ];
        // array with enemies
        this.enemies = [ enemy1, enemy2 ];
        // array with both parties, who will attack
        this.units = this.heroes.concat(this.enemies);
        
        this.index = -1; // currently active unit
        
        this.scene.run("UIScene");        
    },
    nextTurn: function() {  
        // if we have victory or game over
        if(this.checkEndBattle()) {           
            this.endBattle();
            return;
        }
        do {
            // currently active unit
            this.index++;
            // if there are no more units, we start again from the first one
            if(this.index >= this.units.length) {
                this.index = 0;
            }            
        } while(!this.units[this.index].living);
        // if its player hero
        if(this.units[this.index] instanceof PlayerCharacter) {
            // we need the player to select action and then enemy
            this.events.emit("PlayerSelect", this.index);
        } else { // else if its enemy unit
            // pick random living hero to be attacked
            var r;
            do {
                r = Math.floor(Math.random() * this.heroes.length);
            } while(!this.heroes[r].living) 
            // call the enemy's attack function 
            this.units[this.index].attack(this.heroes[r]);  
            // add timer for the next turn, so will have smooth gameplay
            this.time.addEvent({ delay: 3000, callback: this.nextTurn, callbackScope: this });
        }
    },     
    // check for game over or victory
    checkEndBattle: function() {        
        var victory = true;
        // if all enemies are dead we have victory
        for(var i = 0; i < this.enemies.length; i++) {
            if(this.enemies[i].living)
                victory = false;
        }
        var gameOver = true;
        // if all heroes are dead we have game over
        for(var i = 0; i < this.heroes.length; i++) {
            if(this.heroes[i].living)
                gameOver = false;
        }
        return victory || gameOver;
    },
    // when the player have selected the enemy to be attacked
    receivePlayerSelection: function(action, target) {
        if(action == "attack") {            
            this.units[this.index].attack(this.enemies[target]);              
        }
        // next turn in 3 seconds
        this.time.addEvent({ delay: 3000, callback: this.nextTurn, callbackScope: this });        
    },    
    endBattle: function() {       
        // clear state, remove sprites
        this.heroes.length = 0;
        this.enemies.length = 0;
        for(var i = 0; i < this.units.length; i++) {
            // link item
            this.units[i].destroy();            
        }
        this.units.length = 0;
        // sleep the UI
        this.scene.sleep('UIScene');
        // return to WorldScene and sleep current BattleScene
        this.scene.switch('WorldScene');
    }
});

// base class for heroes and enemies
var Unit = new Phaser.Class({
    Extends: Phaser.GameObjects.Sprite,

    initialize:

    function Unit(scene, x, y, texture, frame, type, hp, damage) {
        Phaser.GameObjects.Sprite.call(this, scene, x, y, texture, frame)
        this.type = type;
        this.maxHp = this.hp = hp;
        this.damage = damage; // default damage     
        this.living = true;         
        this.battleMenuItem = null;
    },
    // we will use this to notify the menu item when the unit is dead
    setBattleMenuItem: function(item) {
        this.battleMenuItem = item;
    },
    // attack the target unit
    attack: function(target) {
        if(target.living) {
            target.takeDamage(this.damage);
            this.scene.events.emit("Message", this.type + " attacks " + target.type + " for " + this.damage + " damage");
        }
    },    
    takeDamage: function(damage) {
        this.hp -= damage;
        if(this.hp <= 0) {
            this.hp = 0;
            this.battleMenuItem.unitKilled();
            this.living = false;
            this.visible = false;   
            this.battleMenuItem = null;
        }
    }    
});

var Enemy = new Phaser.Class({
    Extends: Unit,

    initialize:
    function Enemy(scene, x, y, texture, frame, type, hp, damage) {
        Unit.call(this, scene, x, y, texture, frame, type, hp, damage);
    }
});

var PlayerCharacter = new Phaser.Class({
    Extends: Unit,

    initialize:
    function PlayerCharacter(scene, x, y, texture, frame, type, hp, damage) {
        Unit.call(this, scene, x, y, texture, frame, type, hp, damage);
        // flip the image so I don"t have to edit it manually
        this.flipX = false;
        
        this.setScale(2);
    }
});

var BattleMenuItem = new Phaser.Class({
    Extends: Phaser.GameObjects.Text,
    
    initialize:
            
    function BattleMenuItem(x, y, text, scene) {
        Phaser.GameObjects.Text.call(this, scene, x, y, text, { color: "#ffffff", align: "left", fontSize: 15});
    },
    
    select: function() {
        this.setColor("#39ff14");
    },
    
    deselect: function() {
        this.setColor("#ffffff");
    },
    // when the associated enemy or player unit is killed
    unitKilled: function() {
        this.active = false;
        this.visible = false;
    }
    
});

// base menu class, container for menu items
var BattleMenu = new Phaser.Class({
    Extends: Phaser.GameObjects.Container,
    
    initialize:
            
    function BattleMenu(x, y, scene, heroes) {
        Phaser.GameObjects.Container.call(this, scene, x, y);
        this.battleMenuItems = [];
        this.battleMenuItemIndex = 0;
        this.x = x;
        this.y = y;        
        this.selected = false;
    },     
    addBattleMenuItem: function(unit) {
        var battleMenuItem = new BattleMenuItem(0, this.battleMenuItems.length * 20, unit, this.scene);
        this.battleMenuItems.push(battleMenuItem);
        this.add(battleMenuItem); 
        return battleMenuItem;
    },  
    // menu navigation 
    moveSelectionUp: function() {
        this.battleMenuItems[this.battleMenuItemIndex].deselect();
        do {
            this.battleMenuItemIndex--;
            if(this.battleMenuItemIndex < 0)
                this.battleMenuItemIndex = this.battleMenuItems.length - 1;
        } while(!this.battleMenuItems[this.battleMenuItemIndex].active);
        this.battleMenuItems[this.battleMenuItemIndex].select();
    },
    moveSelectionDown: function() {
        this.battleMenuItems[this.battleMenuItemIndex].deselect();
        do {
            this.battleMenuItemIndex++;
            if(this.battleMenuItemIndex >= this.battleMenuItems.length)
                this.battleMenuItemIndex = 0;
        } while(!this.battleMenuItems[this.battleMenuItemIndex].active);
        this.battleMenuItems[this.battleMenuItemIndex].select();
    },
    // select the menu as a whole and highlight the choosen element
    select: function(index) {
        if(!index)
            index = 0;       
        this.battleMenuItems[this.battleMenuItemIndex].deselect();
        this.battleMenuItemIndex = index;
        while(!this.battleMenuItems[this.battleMenuItemIndex].active) {
            this.battleMenuItemIndex++;
            if(this.battleMenuItemIndex >= this.battleMenuItems.length)
                this.battleMenuItemIndex = 0;
            if(this.battleMenuItemIndex == index)
                return;
        }        
        this.battleMenuItems[this.battleMenuItemIndex].select();
        this.selected = true;
    },
    // deselect this menu
    deselect: function() {        
        this.battleMenuItems[this.battleMenuItemIndex].deselect();
        this.battleMenuItemIndex = 0;
        this.selected = false;
    },
    confirm: function() {
        // when the player confirms his slection, do the action
    },
    // clear menu and remove all menu items
    clear: function() {
        for(var i = 0; i < this.battleMenuItems.length; i++) {
            this.battleMenuItems[i].destroy();
        }
        this.battleMenuItems.length = 0;
        this.battleMenuItemIndex = 0;
    },
    // recreate the menu items
    remap: function(units) {
        this.clear();        
        for(var i = 0; i < units.length; i++) {
            var unit = units[i];
            unit.setBattleMenuItem(this.addBattleMenuItem(
                (unit.type == "Warrior" || unit.type == "Mage") ?
                    unit.type + " (" + unit.hp + ")" :
                    unit.type
            ));            
        }
        this.battleMenuItemIndex = 0;
    }
});

var HeroesMenu = new Phaser.Class({
    Extends: BattleMenu,
    
    initialize:
            
    function HeroesMenu(x, y, scene) {
        BattleMenu.call(this, x, y, scene);                    
    }
});

var ActionsMenu = new Phaser.Class({
    Extends: BattleMenu,
    
    initialize:
            
    function ActionsMenu(x, y, scene) {
        BattleMenu.call(this, x, y, scene);   
        this.addBattleMenuItem("Attack");
    },
    confirm: function() { 
        // we select an action and go to the next menu and choose from the enemies to apply the action
        this.scene.events.emit("SelectedAction");        
    }
    
});

var EnemiesMenu = new Phaser.Class({
    Extends: BattleMenu,
    
    initialize:
            
    function EnemiesMenu(x, y, scene) {
        BattleMenu.call(this, x, y, scene);        
    },       
    confirm: function() {      
        // the player has selected the enemy and we send its id with the event
        this.scene.events.emit("Enemy", this.battleMenuItemIndex);
    }
});

// User Interface scene
var UIScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function UIScene ()
    {
        Phaser.Scene.call(this, { key: "UIScene" });
    },

    create: function ()
    {    
        // Sounds Declaration
        this.move = new Audio(); //Variable of Audio kind to store and use move sound.
        this.move.src ="./assets/sounds/FF7CursorMove.mp3";

        // draw some background for the menu
        this.graphics = this.add.graphics();
        this.graphics.lineStyle(1, 0xffffff);
        this.graphics.fillStyle(0x031f4c, 1);

        this.graphics.strokeRect(2, 150, 90, 89);
        this.graphics.fillRect(2, 150, 90, 89);
        
        this.graphics.strokeRect(95, 150, 90, 89);
        this.graphics.fillRect(95, 150, 90, 89);
        
        this.graphics.strokeRect(188, 150, 130, 89);
        this.graphics.fillRect(188, 150, 130, 89);
        
        // basic container to hold all menus
        this.menus = this.add.container();
                
        this.heroesMenu = new HeroesMenu(195, 153, this);           
        this.actionsMenu = new ActionsMenu(100, 153, this);            
        this.enemiesMenu = new EnemiesMenu(8, 153, this);   
        
        // the currently selected menu 
        this.currentMenu = this.actionsMenu;
        
        // add menus to the container
        this.menus.add(this.heroesMenu);
        this.menus.add(this.actionsMenu);
        this.menus.add(this.enemiesMenu);
                
        this.battleScene = this.scene.get("BattleScene");                                
        
        // listen for keyboard events
        this.input.keyboard.on("keydown", this.onKeyInput, this);   
        
        // when its player cunit turn to move
        this.battleScene.events.on("PlayerSelect", this.onPlayerSelect, this);
        
        // when the action on the menu is selected
        // for now we have only one action so we dont send and action id
        this.events.on("SelectedAction", this.onSelectedAction, this);
        
        // an enemy is selected
        this.events.on("Enemy", this.onEnemy, this);
        
        // when the scene receives wake event
        this.sys.events.on('wake', this.createMenu, this);
        
        // the message describing the current action
        this.message = new Message(this, this.battleScene.events);
        this.add.existing(this.message);        
        
        this.createMenu();     
    },
    createMenu: function() {
        // map hero menu items to heroes
        this.remapHeroes();
        // map enemies menu items to enemies
        this.remapEnemies();
        // first move
        this.battleScene.nextTurn(); 
    },
    onEnemy: function(index) {
        // when the enemy is selected, we deselect all menus and send event with the enemy id
        this.heroesMenu.deselect();
        this.actionsMenu.deselect();
        this.enemiesMenu.deselect();
        this.currentMenu = null;
        this.battleScene.receivePlayerSelection("attack", index);   
    },
    onPlayerSelect: function(id) {
        // when its player turn, we select the active hero item and the first action
        // then we make actions menu active
        this.heroesMenu.select(id);
        this.actionsMenu.select(0);
        this.currentMenu = this.actionsMenu;
    },
    // we have action selected and we make the enemies menu active
    // the player needs to choose an enemy to attack
    onSelectedAction: function() {
        this.currentMenu = this.enemiesMenu;
        this.enemiesMenu.select(0);
    },
    remapHeroes: function() {
        var heroes = this.battleScene.heroes;
        this.heroesMenu.remap(heroes);
    },
    remapEnemies: function() {
        var enemies = this.battleScene.enemies;
        this.enemiesMenu.remap(enemies);
    },
    onKeyInput: function(event) {
        //console.info(event);
        if(this.currentMenu && this.currentMenu.selected) {
            if(event.code === "ArrowUp") {
                this.currentMenu.moveSelectionUp();
                this.move.play();
            } else if(event.code === "ArrowDown") {
                this.currentMenu.moveSelectionDown();
                this.move.play();
            } else if(event.code === "ArrowRight" || event.code === "Shift") {

            } else if(event.code === "Space" || event.code === "ArrowLeft") {
                this.currentMenu.confirm();
                this.move.play();
            } else if (event.code === "Escape") {
                this.battleScene.endBattle();
            }
        }
    },
});

// the message class extends containter 
var Message = new Phaser.Class({

    Extends: Phaser.GameObjects.Container,

    initialize:
    function Message(scene, events) {
        Phaser.GameObjects.Container.call(this, scene, 160, 30);
        var graphics = this.scene.add.graphics();
        this.add(graphics);
        graphics.lineStyle(1, 0xffffff, 0.8);
        graphics.fillStyle(0x031f4c, 0.3);        
        graphics.strokeRect(-90, -15, 180, 30);
        graphics.fillRect(-90, -15, 180, 30);
        this.text = new Phaser.GameObjects.Text(
            scene, 0, 0, "", { 
                color: "#ffffff", 
                align: "center", 
                fontSize: 13, 
                wordWrap: { width: 170, useAdvancedWrap: true }
            });
        this.add(this.text);
        this.text.setOrigin(0.5);        
        events.on("Message", this.showMessage, this);
        this.visible = false;
    },
    showMessage: function(text) {
        this.text.setText(text);
        this.visible = true;
        if(this.hideEvent)
            this.hideEvent.remove(false);
        this.hideEvent = this.scene.time.addEvent({ delay: 2000, callback: this.hideMessage, callbackScope: this });
    },
    hideMessage: function() {
        this.hideEvent = null;
        this.visible = false;
    }
});