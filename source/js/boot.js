//########################
//    BOOT / GLOBALS    //
//########################
var BootScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:

    function BootScene ()
    {
        Phaser.Scene.call(this, { key: 'BootScene' });
    },

    preload: function ()
    {
        // map tiles
        this.load.image('tiles', 'assets/map/spritesheet.png');
        
        // map in json format
        this.load.tilemapTiledJSON('map', 'assets/map/map.json');

        // cursor
        this.load.image("cursor", "assets/sprites/cursor.png");

        // enemies
        this.load.image("enemy1", "assets/sprites/enemy1.png");
        this.load.image("enemy2", "assets/sprites/enemy2.png");
        
        // our two characters
        this.load.spritesheet('player', 'assets/sprites/Mog_edited.png', { 
            frameWidth: 17, 
            frameHeight: 24,
            margin: 6,
            spacing: 0, 
        });
    },

    create: function ()
    {

        // Declare Globals
        this.registry.set("characters", ["warrior", "mage"]);

        // Setup Sounds to be added to Global Registry "sounds" obj
        this.FF7CursorMove = new Audio();
        this.FF7CursorMove.src ="./assets/sounds/FF7CursorMove.mp3";

        // Add the sounds to the Global Registry
        this.registry.set("sounds", {
            "FF7CursorMove": this.FF7CursorMove
        });


        // start the WorldScene
        this.scene.start('WorldScene');
    }
});
