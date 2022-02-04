//###################################
//   WORLD SCENE (Handles Maps)    //
//###################################
var WorldScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:

    function WorldScene ()
    {
        Phaser.Scene.call(this, { key: 'WorldScene' });
    },

    preload: function () {},

    create: function ()
    {
        // create the map
        var map = this.make.tilemap({ key: 'map' });
        
        // first parameter is the name of the tilemap in tiled
        var tiles = map.addTilesetImage('spritesheet', 'tiles');
        
        // creating the layers
        var grass = map.createStaticLayer('Grass', tiles, 0, 0);
        var obstacles = map.createStaticLayer('Obstacles', tiles, 0, 0);
        
        // make all tiles in obstacles collidable
        obstacles.setCollisionByExclusion([-1]);
        
        //  animation with key 'left', we don't need left and right as we will use one and flip the sprite
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('player', { start: 22, end: 24 }),
            frameRate: 10,
            repeat: -1
        });
        
        // animation with key 'right'
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { start: 22, end: 24  }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'up',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 2  }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'down',
            frames: this.anims.generateFrameNumbers('player', { start: 11, end: 13}),
            frameRate: 10,
            repeat: -1
        });        

        // our player sprite created through the phycis system
        this.player = this.physics.add.sprite(50, 100, 'player', 12);
        this.player.scale = 1.5;
        
        // don't go out of the map
        this.physics.world.bounds.width = map.widthInPixels;
        this.physics.world.bounds.height = map.heightInPixels;
        this.player.setCollideWorldBounds(true);
        
        // don't walk on trees
        this.physics.add.collider(this.player, obstacles);

        // limit camera to map
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.roundPixels = true; // avoid tile bleed
    
        // user input
        //this.cursors = this.input.keyboard.createCursorKeys();
        this.cursors = this.input.keyboard.addKeys({
            a: 65, s: 83, d: 68, w: 87, 
            up: 38, down: 40, left: 37, right: 39, 
            space: 32, shift:  16, enter: 13
        });
        
        // where the enemies will be
        this.spawns = this.physics.add.group({ classType: Phaser.GameObjects.Zone });
        for(var i = 0; i < 30; i++) {
            var x = Phaser.Math.RND.between(0, this.physics.world.bounds.width);
            var y = Phaser.Math.RND.between(0, this.physics.world.bounds.height);
            // parameters are x, y, width, height
            this.spawns.create(x, y, 20, 20);            
        }        
        // add collider
        this.physics.add.overlap(this.player, this.spawns, this.onMeetEnemy, false, this);
        // we listen for 'wake' event
        this.sys.events.on('wake', this.wake, this);

        // Add main menu
        this.dialog = new dialog(this, this.events);
        this.add.existing(this.dialog);

        // listen for keyboard events
        this.input.keyboard.on("keydown", this.toggleMainMenu, this);
    },
    wake: function() {
        this.cursors.left.reset();
        this.cursors.right.reset();
        this.cursors.up.reset();
        this.cursors.down.reset();
    },
    onMeetEnemy: function(player, zone) {        
        // we move the zone to some other location
        zone.x = Phaser.Math.RND.between(0, this.physics.world.bounds.width);
        zone.y = Phaser.Math.RND.between(0, this.physics.world.bounds.height);
    
        //!! BUG: when switching scene, both here and in toggleMainMenu, the
        // input stopPropogation doesnt work, somehow it isnt called before the
        // scene switch (seems to have stopped?)

        // start battle 
        this.input.stopPropagation();
        this.scene.switch('BattleScene');                
    },
    toggleMainMenu: function(event) {
        if(event.code === "Enter") {
            this.input.stopPropagation();
            this.scene.switch('MainMenuScene');  
        }
    },
    update: function (time, delta)
    {             
        this.player.body.setVelocity(0);
        
        // Horizontal movement
        if (this.cursors.left.isDown || this.cursors.a.isDown)
        {
            this.player.body.setVelocityX(-80);
        }
        else if (this.cursors.right.isDown || this.cursors.d.isDown)
        {
            this.player.body.setVelocityX(80);
        }
        // Vertical movement
        if (this.cursors.up.isDown || this.cursors.w.isDown)
        {
            this.player.body.setVelocityY(-80);
        }
        else if (this.cursors.down.isDown || this.cursors.s.isDown)
        {
            this.player.body.setVelocityY(80);
        }        

        // Update the animation last and give left/right animations precedence over up/down animations
        if (this.cursors.left.isDown || this.cursors.a.isDown)
        {
            this.player.anims.play('left', true);
            this.player.flipX = false;
        }
        else if (this.cursors.right.isDown || this.cursors.d.isDown)
        {
            this.player.anims.play('right', true);
            this.player.flipX = true;
        }
        else if (this.cursors.up.isDown || this.cursors.w.isDown)
        {
            this.player.anims.play('up', true);
        }
        else if (this.cursors.down.isDown || this.cursors.s.isDown)
        {
            this.player.anims.play('down', true);
        }
        else
        {
            this.player.anims.stop();
        }

        // !! when implemented, this should not be called from update function, as it
        // will run multiple times
        // summon dialog box (for testing, later use for talking to someone)
        // if (this.cursors.enter.isDown) {
        //     this.scene.scene.events.emit("dialog", "Someone is talking...");
        // }
    }
    
});


// speech / dialog class
var dialog = new Phaser.Class({
    Extends: Phaser.GameObjects.Container,
    initialize:
    
    function dialog(scene, events) {
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
        events.on("dialog", this.showDialog, this);
        this.visible = false;
    },
    showDialog: function(text) {
        this.text.setText(text);
        this.visible = true;
        if(this.hideEvent)
            this.hideEvent.remove(false);
        this.hideEvent = this.scene.time.addEvent({ delay: 2000, callback: this.hideDialog, callbackScope: this });
    },
    hideDialog: function() {
        this.hideEvent = null;
        this.visible = false;
    }
});