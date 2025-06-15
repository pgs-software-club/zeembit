import kaplay, { AnchorComp, AreaComp, GameObj, PosComp, ScaleComp, TextComp } from "kaplay";

const k = kaplay();
const SPEED = 1000;
k.setGravity(2400);

k.loadRoot("./");
k.loadSprite("bean", "sprites/bean.png");
k.loadSprite("bean1", "sprites/bean1.png");
k.loadSprite("bean2", "sprites/bean2.png");
k.loadSprite("bean3", "sprites/bean3.png");
k.loadSprite("ground", "sprites/ground.png");
k.loadSprite("ground1", "sprites/ground1.png");
k.loadSprite("arc", "sprites/arc.png");
k.loadSprite("fence", "sprites/fence.png");
k.loadSprite("fort_top", "sprites/fort_top.png");
k.loadSprite("fort", "sprites/fort.png");
k.loadSprite("brick", "sprites/brick.png");
k.loadSprite("slope", "sprites/slope.png");
k.loadSprite("hat", "sprites/hat.png");
k.loadSprite("hat1", "sprites/hat1.png");
k.loadSprite("bounce", "sprites/tramp.png");
k.loadSprite("bridge", "sprites/bridge.png");
k.loadSprite("bridge_arc", "sprites/bridge_arc.png");
k.loadSprite("key", "sprites/key.png");
k.loadSprite("chest", "sprites/chest.png");
k.loadSprite("gun1", "sprites/gun1.png");
k.loadSprite("gun2", "sprites/gun2.png");
k.loadSprite("bullet", "sprites/bullet.png");

k.loadFont("retrofont", "fonts/union-soap.regular.ttf");

k.setBackground(237, 237, 237);

const COYOTE_TIME = 0.1;
const ACCELERATION = 2000;
const MAX_HORZ_SPEED = SPEED;
const FRICTION_GROUND = 1000;

const BOUNCE_FORCE = 1700;
const PLAYER_COLLISION_PUSH_FORCE = 600;

const GUN_X_OFFSET = 70;
const GUN_Y_OFFSET = 70;

const MAX_GUN_HOLD_TIME = 30; // seconds


// Gun Stats Definitions
const GUN_STATS = {
    PISTOL: {
        type: "pistol",
        sprite: "gun1",
        damage: 10,
        range: 800,
        fireRate: 0.8,
        bulletSpeed: 2000,
        bulletCount: 1,
        bulletColor: k.rgb(255, 255, 0),
    },
    SHOTGUN: {
        type: "shotgun",
        sprite: "gun2",
        damage: 30,
        range: 600,
        fireRate: 1,
        bulletSpeed: 2000,
        bulletCount: 1,
        bulletSpread: 1500,
        bulletColor: k.rgb(255, 165, 0),
    }
} as const;

const playersConfig = [
    {
        tag: "player1",
        sprite: "bean",
        spawnChar: "@",
        keybinds: {
            jump: "w",
            left: "a",
            right: "d",
        },
        headSprite: "hat",
        playerColor: k.rgb(252, 197, 51),
        hasKey: false,
        health: 50,
    },
    {
        tag: "player2",
        sprite: "bean1",
        spawnChar: "$",
        keybinds: {
            jump: "up",
            left: "left",
            right: "right",
        },
        headSprite: "hat1",
        playerColor: k.rgb(55, 217, 140),
        hasKey: false,
        health: 50,
    },
    {
        tag: "player3",
        sprite: "bean2",
        spawnChar: "%",
        keybinds: {
            jump: "i",
            left: "j",
            right: "l",
        },
        playerColor: k.rgb(145, 121, 255),
        hasKey: false,
        health: 50,
    },
    {
        tag: "player4",
        sprite: "bean3",
        spawnChar: "&",
        keybinds: {
            jump: "t",
            left: "f",
            right: "h",
        },
        playerColor: k.rgb(252, 132, 140),
        hasKey: false,
        health: 50,
    },
];

const levelLayout = [
    "b    %                &  b",
    "b   ===              === b",
    "b   @           $        b",
    "b            K           b",
    "b                        b",
    "b           ====         b",
    "b                        b",
    "b                        b",
    "b     ==  w              b",
    "bB        o              b",
    "b=g==\\    afffff    C    b",
    "======g==b=-nnn-==gg======",
];


// setInterval(()=>{
//     k.debug.log(k.debug.fps())
// }, 100)

k.scene("game", () => {
    // k.debug.inspect = true;
    const LEVEL_TILE_WIDTH = 145;
    const LEVEL_TILE_HEIGHT = 145;
    const BEAN_WIDTH = 97;
    const BEAN_HEIGHT = 147;
    const HAT_WIDTH = 115;

    let gameTimer = 30;


    const tilesConfig = {
        "=": () => [
            k.sprite("ground"), k.anchor("bot"), k.area(), k.body({ isStatic: true }),
            "colorable",
        ],
        "g": () => [
            k.sprite("ground1"), k.anchor("bot"), k.area(), k.body({ isStatic: true }),
            "colorable",
        ],
        "b": () => [
            k.sprite("brick"), k.anchor("bot"), k.area(), k.body({ isStatic: true }), k.z(0),
            "colorable",
        ],
        "o": () => [
            k.sprite("fort"), k.anchor("bot"), k.area(), k.body({ isStatic: true }), k.z(0),
            "colorable",
        ],
        "C": () => [
            k.sprite("chest"), k.color(k.rgb(229, 170, 112)), k.anchor("bot"), k.area(), k.body({ isStatic: true }), k.z(0),
            "chest_block"
        ],
        "B": () => [
            k.sprite("bounce"), k.anchor("bot"), k.area({
                shape: new k.Rect(k.vec2(0), LEVEL_TILE_WIDTH, 70)
            }), k.body({ isStatic: true }), k.z(0),
            "colorable",
            "bouncing_block",
        ],
        "-": () => [
            k.sprite("bridge"), k.anchor("bot"), k.area({
                shape: new k.Rect(k.vec2(0, -90), LEVEL_TILE_WIDTH, 60)
            }), k.body({ isStatic: true }), k.z(0),
            "colorable",
        ],
        "n": () => [
            k.sprite("bridge_arc"), k.anchor("bot"), k.area(), k.body({ isStatic: true }), k.z(0),
            "colorable",
        ],
        "K": () => [
            k.sprite("key", { width: 50, height: 50 }),
            k.area(),
            k.body({ isStatic: false }),
            k.z(30),
            k.animate(),
            "colorable",
            "key_item",
        ],
        "/": () => [
            k.sprite("slope", { flipX: true }),
            k.area({
                shape: new k.Polygon([
                    k.vec2(0 - LEVEL_TILE_WIDTH / 2, 0),
                    k.vec2(LEVEL_TILE_WIDTH / 2, 0),
                    k.vec2(LEVEL_TILE_WIDTH / 2, -LEVEL_TILE_HEIGHT)
                ]),
            }),
            k.anchor("bot"),
            k.body({ isStatic: true }),
            k.z(0),
            "colorable",
            "slope_tile",
        ],
        "\\": () => [
            k.sprite("slope"),
            k.area({
                shape: new k.Polygon([
                    k.vec2(0 - LEVEL_TILE_WIDTH / 2, 0),
                    k.vec2(0 + LEVEL_TILE_WIDTH / 2, 0),
                    k.vec2(0 - (LEVEL_TILE_WIDTH / 2), -LEVEL_TILE_HEIGHT - 7)
                ]),
            }),
            k.anchor("bot"),
            k.body({ isStatic: true }),
            k.z(0),
            "colorable",
            "slope_tile_right",
        ],
        "f": () => [
            k.sprite("fence"), k.anchor("bot"), k.body({ isStatic: true }), k.z(0)
        ],
        "a": () => [
            k.sprite("arc"), k.anchor("bot"), k.body({ isStatic: true }), k.z(0)
        ],
        "w": () => [
            k.sprite("fort_top"), k.anchor("bot"), k.body({ isStatic: true }), k.z(20)
        ],
    };


    playersConfig.forEach(player => {
        tilesConfig[player.spawnChar] = () => [
            k.sprite(player.sprite),
            k.area({
                shape: new k.Polygon([
                    k.vec2(-BEAN_WIDTH * 0.2, 0),
                    k.vec2(BEAN_WIDTH * 0.2, 0),
                    k.vec2(BEAN_WIDTH * 0.5, -BEAN_HEIGHT * 0.2),
                    k.vec2(BEAN_WIDTH * 0.4, -BEAN_HEIGHT * 0.95),
                    k.vec2(-BEAN_WIDTH * 0.4, -BEAN_HEIGHT * 0.95),
                    k.vec2(-BEAN_WIDTH * 0.5, -BEAN_HEIGHT * 0.2)
                ]),
            }),
            k.z(10),
            k.anchor("bot"),
            k.body(),
            { playerColor: player.playerColor, health: player.health },
            player.tag,
            "player_entity"
        ];
    });

    const myLevel = k.addLevel(levelLayout, {
        tileWidth: LEVEL_TILE_WIDTH,
        tileHeight: LEVEL_TILE_HEIGHT,
        tiles: tilesConfig,
    });



    const players = [];
    playersConfig.forEach(playerConfig => {
        const playerInstance = myLevel.get(playerConfig.tag)[0];
        if (playerInstance) {
            players.push({
                instance: playerInstance,
                config: playerConfig,
                jumpsUsed: 0,
                coyoteTimer: 0,
                jumpBuffered: false,
                jumpBufferTimer: 0,
                isGroundedPrevFrame: false,
            });

            if (playerConfig.headSprite) {
                playerInstance.add([
                    k.sprite(playerConfig.headSprite, { width: HAT_WIDTH }),
                    k.pos(0, -BEAN_HEIGHT + 35),
                    k.anchor("bot"),
                    "hat",
                ]);
            }
        }
    });

    function setupUI() {
        const timerTextSize = 69; 
        const timerYPos = 0; 

        const minUnitDisp = k.add([
            k.text("0", { size: timerTextSize, font: "retrofont" }),
            k.pos( timerTextSize * 0.5, timerYPos),
            k.anchor("top"),
            k.fixed(),
            k.color(k.BLACK),
            k.outline(4),
            "game_timer_digit",
        ]);

        const colonDisp = k.add([
            k.text(":", { size: timerTextSize, font: "retrofont" }),
            k.pos(timerTextSize + timerTextSize * 0.2, timerYPos),
            k.anchor("top"),
            k.fixed(),
            k.outline(4),
            k.color(k.BLACK),
            "game_timer_colon",
        ]);

        const secTensDisp = k.add([
            k.text("0", { size: timerTextSize, font: "retrofont" }),
            k.pos( timerTextSize + timerTextSize * 0.9, timerYPos),
            k.anchor("top"),
            k.fixed(),
            k.outline(4),
            k.color(k.BLACK),
            "game_timer_digit",
        ]);

        const secUnitDisp = k.add([
            k.text("0", { size: timerTextSize, font: "retrofont" }),
            k.pos( timerTextSize + timerTextSize * 1.6, timerYPos),
            k.anchor("top"),
            k.fixed(),
            k.outline(4),
            k.color(k.BLACK),
            "game_timer_digit",
        ]);

        return { minUnitDisp, colonDisp, secTensDisp, secUnitDisp };
    }

    const uiElements = setupUI(); 

    const resetPlayer = (playerState) => {
        const new_pos = k.vec2(k.rand(k.width() * 2), -(k.height() - k.rand(500, 700)));
        k.debug.log(new_pos)
        playerState.pos.x = new_pos.x;
        playerState.pos.y = new_pos.y;
        playerState.vel.x = 0;
        playerState.vel.y = 0;

        if (playerState.keyIconInstance) {
            playerState.keyIconInstance.destroy();
            playerState.keyIconInstance = null;
            playerState.hasKey = false;
        }
        if (playerState.gunIconInstance) {
            playerState.gunIconInstance.destroy();
            playerState.gunIconInstance = null;
            playerState.currentGun = null;
        }

        playerState.health = 50;

        playerState.jumpsUsed = 0;
        playerState.coyoteTimer = 0;
        playerState.jumpBuffered = false;
        playerState.jumpBufferTimer = 0;
        playerState.lastShotTime = 0;
    };


    players.forEach(player => {
        const { instance, config } = player;
        k.onKeyPress(config.keybinds.jump, () => {
            const isCurrentlyGrounded = instance.isGrounded();
            const canCoyoteJump = instance.coyoteTimer > 0;

            if (isCurrentlyGrounded || canCoyoteJump) {
                instance.jumpsUsed = 0;
                instance.jump(1300);
                instance.coyoteTimer = 0;
                instance.jumpBuffered = false;
            } else if (instance.jumpsUsed < 1) {
                instance.jumpsUsed++;
                instance.jump(1000);
                instance.jumpBuffered = false;
            }
        });

        k.onKeyPress(config.keybinds.left, () => {
            const gun = instance.get("gun_icon")[0];
            instance.flipX = true;
            if (gun) {
                gun.flipX = true
                gun.pos.x = -GUN_X_OFFSET;
            }
        });

        k.onKeyPress(config.keybinds.right, () => {
            const gun = instance.get("gun_icon")[0];
            instance.flipX = false;
            if (gun) {
                gun.flipX = false
                gun.pos.x = GUN_X_OFFSET;
            }
        });

        // might need later
        // k.onKeyRelease(config.keybinds.left, () => {
        //     if (!k.isKeyDown(config.keybinds.right)) {
        //         instance.flipX = false;
        //     }
        // });

    });

    k.onCollide("player_entity", "*", (playerObj, other) => {
        if (!other.is("player_entity") && !other.is("chest_block") && !other.is("bullet_obj")) {
            if (playerObj.playerColor) {
                other.color = playerObj.playerColor;
            }
        }
    });

    k.onCollide("bullet_obj", "colorable", (bullet, blockHit) => {
        blockHit.color = bullet.color;
        bullet.destroy();
    })

    k.onCollide("bullet_obj", "player_entity", (bullet, player) => {
        k.debug.log(player.health, bullet.damage)
        player.health -= bullet.damage;
        if (player.health <= 0) {
            player.health = 0;
            resetPlayer(player);
        }

        bullet.destroy();
    })

    function spawnBullet(shooter, gunStats, directionAngle) {
        const bulletVel = k.vec2(
            gunStats.bulletSpeed * Math.cos(directionAngle),
            gunStats.bulletSpeed * Math.sin(directionAngle)
        );

        const bulletLifespan = gunStats.range / gunStats.bulletSpeed;

        const bul = k.add([
            k.sprite("bullet"),
            k.pos(directionAngle == 0 ? shooter.pos.x + (BEAN_WIDTH) : shooter.pos.x - (BEAN_WIDTH), shooter.pos.y - 90),
            k.color(shooter.playerColor),
            k.area(),
            k.body({ isStatic: false, gravityScale: 0 }),
            k.lifespan(bulletLifespan),
            k.opacity(1),
            k.z(5),
            {
                damage: gunStats.damage,
                shooterId: shooter.tag,
            },
            "bullet_obj",
        ]);

        bul.applyImpulse(bulletVel);

    }


    k.onCollide("player_entity", "player_entity", (p1, p2) => {
        if (p1 === p2) return;
        const relativeVelocity = p1.vel.sub(p2.vel);

        const collisionSpeed = relativeVelocity.len();

        console.log(`Collision Speed: ${collisionSpeed.toFixed(2)}`);

        const minSpeedForImpulse = 10;

        let calculatedStrength = 0;
        calculatedStrength = k.map(collisionSpeed, minSpeedForImpulse, 500, 50, PLAYER_COLLISION_PUSH_FORCE);
        calculatedStrength = Math.min(calculatedStrength, PLAYER_COLLISION_PUSH_FORCE);

        console.log(`Calculated Strength: ${calculatedStrength.toFixed(2)}`);

        if (calculatedStrength > 0) {
            if (calculatedStrength < 300) calculatedStrength = 300;
            const dirAAway = p1.pos.sub(p2.pos).unit();
            const impulseA = dirAAway.scale(calculatedStrength);
            const dirBAway = p2.pos.sub(p1.pos).unit();
            const impulseB = dirBAway.scale(calculatedStrength);

            p1.vel.x = 0;
            p1.vel.y = 0;
            p2.vel.y = 0;
            p2.vel.y = 0;


            p1.applyImpulse(impulseA);
            p2.applyImpulse(impulseB);

            console.log(`Impulse Applied to ${p1.id}: x=${impulseA.x.toFixed(2)}, y=${impulseA.y.toFixed(2)}`);
            console.log(`Impulse Applied to ${p2.id}: x=${impulseB.x.toFixed(2)}, y=${impulseB.y.toFixed(2)}`);
        } else {
            console.log("Collision too slow, no impulse applied.");
        }
    });

    k.onCollide("player_entity", "bouncing_block", (playerObj, block, collision) => {
        if (!collision.isTop()) {
            playerObj.jump(BOUNCE_FORCE);
            playerObj.jumpsUsed = 0;
            playerObj.coyoteTimer = 0;
        }
    });

    k.onCollide("player_entity", "gun_item", (playerObj, gunItem) => {
        const playerGameState = players.find(p => p.instance === playerObj);

        if (playerGameState) {
            if (playerGameState.gunIconInstance) {
                playerGameState.gunIconInstance.destroy();
                playerGameState.gunIconInstance = null;
            }

            playerGameState.currentGun = gunItem.gunType;
            playerGameState.gotGun = k.time();
            gunItem.destroy();

            const initialGunXOffset = playerObj.flipX ? -GUN_X_OFFSET : GUN_X_OFFSET;

            const gunIcon = playerObj.add([
                k.sprite(playerGameState.currentGun.sprite, {
                    height: 60,
                    flipX: playerObj.flipX
                }),
                k.pos(initialGunXOffset, -GUN_Y_OFFSET),
                k.anchor("center"),
                k.color(playerObj.playerColor),
                "gun_icon",
            ]);
            playerGameState.gunIconInstance = gunIcon;
            playerGameState.lastShotTime = k.time();
        }
    });

    k.onCollide("player_entity", "chest_block", (playerObj, other) => {
        if (playerObj.hasKey) {
            other.destroy();
            playerObj.keyIconInstance.destroy();
            playerObj.hasKey = false;
            dropGun(other.pos.x, other.pos.y)
        }
    });

    k.onCollide("player_entity", "key_item", (playerObj, keyItem) => {
        if (!playerObj.hasKey) {
            playerObj.hasKey = true;
            keyItem.destroy();

            const keyIcon = playerObj.add([
                k.sprite("key", { width: 50, height: 50 }),
                k.pos(0, -BEAN_HEIGHT - 40),
                k.anchor("bot"),
                k.color(playerObj.playerColor),
                "key_icon",
            ]);
            playerObj.keyIconInstance = keyIcon;
        }
    });


    k.onUpdate(() => {
        if (players.length === 0) return;

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        players.forEach(player => {
            const { instance, config } = player;
            const dt = k.dt();
            const isCurrentlyGrounded = instance.isGrounded();

            let desiredXVel = 0;
            if (k.isKeyDown(config.keybinds.left)) {
                desiredXVel = -MAX_HORZ_SPEED;
            } else if (k.isKeyDown(config.keybinds.right)) {
                desiredXVel = MAX_HORZ_SPEED;
            }

            const currentXVel = instance.vel.x;
            const accelerationAmount = ACCELERATION * dt;
            const frictionAmount = FRICTION_GROUND * dt;

            if (currentXVel < desiredXVel) {
                instance.vel.x = Math.min(currentXVel + accelerationAmount, desiredXVel);
            } else if (currentXVel > desiredXVel) {
                instance.vel.x = Math.max(currentXVel - accelerationAmount, desiredXVel);
            }


            if (desiredXVel === 0 && isCurrentlyGrounded) {
                if (currentXVel > 0) {
                    instance.vel.x = Math.max(currentXVel - frictionAmount, 0);
                } else if (currentXVel < 0) {
                    instance.vel.x = Math.min(currentXVel + frictionAmount, 0);
                }

                if (Math.abs(instance.vel.x) < 5) {
                    instance.vel.x = 0;
                }
            }

            if (!isCurrentlyGrounded && player.isGroundedPrevFrame) {

                player.coyoteTimer = COYOTE_TIME;
            } else if (player.coyoteTimer > 0) {

                player.coyoteTimer -= dt;
            }

            player.isGroundedPrevFrame = isCurrentlyGrounded;


            if (player.jumpBuffered && isCurrentlyGrounded) {
                instance.jumpsUsed = 0;
                instance.jump(1000);
                player.jumpBuffered = false;
                player.jumpBufferTimer = 0;
                player.coyoteTimer = 0;
            }


            if (player.jumpBuffered && player.jumpBufferTimer > 0) {
                player.jumpBufferTimer -= dt;
                if (player.jumpBufferTimer <= 0) {
                    player.jumpBuffered = false;
                }
            }

            if (player.currentGun) {
                const now = k.time();
                if (now - player.gotGun >= MAX_GUN_HOLD_TIME) {
                    if (player.gunIconInstance) {
                        player.gunIconInstance.destroy();
                        player.gunIconInstance = null;
                    }
                    player.currentGun = null;
                    return
                }
                if (now - player.lastShotTime >= player.currentGun.fireRate) {
                    player.lastShotTime = now;

                    const baseAngle = instance.flipX ? Math.PI : 0;

                    for (let i = 0; i < player.currentGun.bulletCount; i++) {
                        let spreadAngle = 0;
                        if (player.currentGun.bulletCount > 1) {
                            spreadAngle = k.map(i, 0, player.currentGun.bulletCount - 1, -player.currentGun.bulletSpread / 2, player.currentGun.bulletSpread / 2);
                        }
                        spawnBullet(instance, player.currentGun, baseAngle + spreadAngle);
                    }

                }
            }

            const p = instance.pos;
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        });

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        k.setCamPos(centerX, centerY);

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        const buffer = 300;

        const requiredScaleX = k.width() / (contentWidth + buffer);
        const requiredScaleY = k.height() / (contentHeight + buffer);

        let targetScale = Math.min(requiredScaleX, requiredScaleY);

        const minCamScale = 0.3;
        const maxCamScale = 0.6;

        targetScale = Math.max(minCamScale, Math.min(maxCamScale, targetScale));

        k.setCamScale(targetScale, targetScale);




        gameTimer -= k.dt();
        gameTimer = Math.max(0, gameTimer);
    
        const minutes = Math.floor(gameTimer / 60);
        const seconds = Math.floor(gameTimer % 60);
    
        const secTens = Math.floor(seconds / 10);
        const secUnits = seconds % 10;
    
        uiElements.minUnitDisp.text = `${minutes % 10}`;
        uiElements.secTensDisp.text = `${secTens}`;
        uiElements.secUnitDisp.text = `${secUnits}`;
    
        const timerColor = gameTimer <= 10 ? k.RED : k.BLACK;
        uiElements.minUnitDisp.color = timerColor;
        uiElements.colonDisp.color = timerColor;
        uiElements.secTensDisp.color = timerColor;
        uiElements.secUnitDisp.color = timerColor;
    
    
        if (gameTimer <= 0) {
            k.add([
                k.text("GAME OVER!", { size: 64, font: "retrofont" }),
                k.pos(k.width() / 2, k.height() / 2),
                k.fixed(),
                k.opacity(1),
                k.color(k.RED),
                k.lifespan(1),
                k.anchor("center"),
                "game_over_text"
            ]);
        }
    });



});


k.go("game");


function dropGun(x: number, y: number) {
    const gunr = k.randi() ? GUN_STATS.PISTOL : GUN_STATS.SHOTGUN;
    k.add([
        k.sprite(gunr.sprite, { height: 70 }),
        k.pos(k.vec2(x, y - 75)),
        k.area(),
        k.body({ isStatic: false }),
        k.z(30),
        k.animate(),
        { gunType: gunr },
        "gun_item",
    ])
}