import kaplay, { AnchorComp, AreaComp, GameObj, PosComp, ScaleComp, TextComp } from "kaplay";
import { map } from "./maps";

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

k.loadSprite("bar", "sprites/bar.png");



k.loadFont("retrofont", "fonts/union-soap.regular.ttf");

k.setBackground(237, 237, 237);



const log = (v)=>{}

const COYOTE_TIME = 0.1;
const ACCELERATION = 2000;
const MAX_HORZ_SPEED = SPEED;
const FRICTION_GROUND = 1000;

const BOUNCE_FORCE = 1700;
const PLAYER_COLLISION_PUSH_FORCE = 600;

const GUN_X_OFFSET = 70;
const GUN_Y_OFFSET = 70;

const MAX_GUN_HOLD_TIME = 30; // seconds

const COLOR_YELLOW = k.rgb(252, 197, 51);
const COLOR_GREEN = k.rgb(55, 217, 140);
const COLOR_BLUE = k.rgb(145, 121, 255);
const COLOR_RED = k.rgb(252, 132, 140);
const COLOR_RED_DARK = k.rgb(235, 27, 41);


const BAR_GAP = 20;


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
        id: 1,
        tag: "player1",
        sprite: "bean",
        spawnChar: "@",
        keybinds: {
            jump: "w",
            left: "a",
            right: "d",
        },
        headSprite: "hat",
        playerColor: COLOR_YELLOW,
        hasKey: false,
        health: 50,
    },
    {
        id: 2,
        tag: "player2",
        sprite: "bean1",
        spawnChar: "$",
        keybinds: {
            jump: "up",
            left: "left",
            right: "right",
        },
        headSprite: "hat1",
        playerColor: COLOR_GREEN,
        hasKey: false,
        health: 50,
    },
    {
        id: 3,
        tag: "player3",
        sprite: "bean2",
        spawnChar: "%",
        keybinds: {
            jump: "i",
            left: "j",
            right: "l",
        },
        headSprite: "",
        playerColor: COLOR_BLUE,
        hasKey: false,
        health: 50,
    },
    {
        id: 4,
        tag: "player4",
        sprite: "bean3",
        spawnChar: "&",
        keybinds: {
            jump: "t",
            left: "f",
            right: "h",
        },
        headSprite: "",
        playerColor: COLOR_RED,
        hasKey: false,
        health: 50,
    },
] as const;

let gameState = {
    player4: 90,
    player3: 40,
    player2: 86,
    player1: 10,
    NumberOfBlocks: 200,
    totalPlayers: 4,
}



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

    let gameTimer = 80;

    gameState = {
        NumberOfBlocks: 0,
        player4: 0,
        player3: 0,
        player2: 0,
        player1: 0,
        totalPlayers: gameState.totalPlayers
    }


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

    const levelLayout = map[Math.floor(Math.random() * map.length)];
    const myLevel = k.addLevel(levelLayout, {
        tileWidth: LEVEL_TILE_WIDTH,
        tileHeight: LEVEL_TILE_HEIGHT,
        tiles: tilesConfig,
    });

    gameState.NumberOfBlocks = myLevel.get("colorable").length;


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
            playerInstance.add([
                k.text(String(playerConfig.id), { size: 100, font: "retrofont" }),
                k.pos(0, -BEAN_HEIGHT - 70),
                k.color(k.BLACK),
                k.anchor("bot"),
                "id",
            ]);
        }
    });

    function setupUI() {
        const timerTextSize = 69;
        const timerYPos = 0;

        const minUnitDisp = k.add([
            k.text("0", { size: timerTextSize, font: "retrofont" }),
            k.pos(timerTextSize * 0.5, timerYPos),
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
            k.pos(timerTextSize + timerTextSize * 0.9, timerYPos),
            k.anchor("top"),
            k.fixed(),
            k.outline(4),
            k.color(k.BLACK),
            "game_timer_digit",
        ]);

        const secUnitDisp = k.add([
            k.text("0", { size: timerTextSize, font: "retrofont" }),
            k.pos(timerTextSize + timerTextSize * 1.6, timerYPos),
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
        // k.debug.log(new_pos)
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

    });

    k.onCollide("player_entity", "*", (playerObj, other) => {
        if (!other.is("player_entity") && !other.is("chest_block") && !other.is("bullet_obj")) {
            if (playerObj.playerColor) {
                updateBlockColor(other.color, playerObj.playerColor)
                other.color = playerObj.playerColor;
            }
        }
    });

    k.onCollide("bullet_obj", "colorable", (bullet, blockHit) => {
        updateBlockColor(blockHit.color, bullet.color)

        blockHit.color = bullet.color;
        bullet.destroy();
    });

    k.onCollide("bullet_obj", "player_entity", (bullet, player) => {
        // k.debug.log(player.health, bullet.damage)
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

        let timerColor = k.BLACK;


        if (gameTimer <= 10) {
            timerColor = k.RED;
            uiElements.minUnitDisp.hidden = true;
            uiElements.colonDisp.hidden = true;
            uiElements.secTensDisp.hidden = true;

            uiElements.secUnitDisp.pos.x = k.width() / 2;
            uiElements.secUnitDisp.pos.y = k.height() / 2;

        }

        uiElements.minUnitDisp.color = timerColor;
        uiElements.colonDisp.color = timerColor;
        uiElements.secTensDisp.color = timerColor;
        uiElements.secUnitDisp.color = timerColor;

        if (gameTimer <= 0) {
            k.go("gameover")
        }
    });
});

// game over scene
k.scene("gameover", () => {
    k.onKeyPress("space", () => {
        k.go("title");
    });

    playersConfig
        .slice(0, gameState.totalPlayers)
        .map((player, index) => ({
            blocksColored: gameState[player.tag],
            playerIndex: index,
        }))
        .sort((a, b) => b.blocksColored - a.blocksColored)
        .forEach((playerScore, rank) => {
            const scorePercentage = Math.floor(
                (playerScore.blocksColored / gameState.NumberOfBlocks) * 100
            );
            if(scorePercentage >= 4) {
                addBeanOnGameOver(
                    playerScore.playerIndex,
                    scorePercentage,
                    gameState.totalPlayers,
                    rank === 0,
                    rank
                );    
            } 
        });



    k.add([
        k.text("GAME OVER!", { size: 64, font: "retrofont" }),
        k.pos(k.width() / 2, k.height() - k.height() / 9),
        k.fixed(),
        k.color(k.BLACK),
        k.anchor("center"),
        k.z(10),
        "game_over_text"
    ]);
});


k.scene("title", () => {
    k.add([
        k.rect(k.width(), k.height()),
        k.color(200, 200, 200),
        k.pos(0, 0),
        k.fixed(),
        k.z(0),
    ]);

    // Add some decorative elements for blur effect
    for (let i = 0; i < 20; i++) {
        k.add([
            k.circle(k.rand(20, 60)),
            k.pos(k.rand(k.width()), k.rand(k.height())),
            k.color(k.rand(100, 255), k.rand(100, 255), k.rand(100, 255)),
            k.opacity(0.3),
            k.fixed(),
            k.z(1),
        ]);
    }

    // Colorful animated title - each letter in different color
    const titleLetters = "ZEEMBIT";
    const colors = [COLOR_YELLOW, COLOR_GREEN, COLOR_BLUE, COLOR_RED];
    
    titleLetters.split('').forEach((letter, i) => {
        const letterObj = k.add([
            k.text(letter, { size: 120, font: "retrofont" }),
            k.pos(k.width() / 2 - 300 + i * 100, k.height() / 2 - 100),
            k.anchor("center"),
            k.color(colors[i % colors.length]),
            k.fixed(),
            k.z(10),
            "title_letter",
        ]);
        
        // Add floating animation to each letter
        letterObj.onUpdate(() => {
            letterObj.pos.y += Math.sin(k.time() * 2 + i * 0.5) * 0.5;
        });
    });

    // Start button
     k.add([
        k.rect(500, 50),
        k.pos(k.width() / 2, k.height() / 2 + 160),
        k.anchor("center"),
        k.color(COLOR_GREEN),
        k.outline(3, k.BLACK),
        k.area(),
        k.fixed(),
        k.z(10),
        "start_button",
    ]);

    k.add([
        k.text("Press SPACE to START GAME", { size: 24, font: "retrofont" }),
        k.pos(k.width() / 2, k.height() / 2 + 160),
        k.anchor("center"),
        k.color(k.BLACK),
        k.fixed(),
        k.z(11),
    ]);



    // Start game handler
    k.onClick("start_button", () => {
        k.go("game");
    });

    

    k.onKeyPress("space", () => {
        k.go("game");
    });

    // Add some sparkle effects
    k.onUpdate(() => {
        if (k.rand(100) < 0.02) {
            k.add([
                k.circle(3),
                k.pos(k.rand(k.width()), k.rand(k.height())),
                k.color(colors[Math.floor(k.rand(100) * colors.length)]),
                k.opacity(0.8),
                k.lifespan(2),
                k.fixed(),
                k.z(5),
            ]);
        }
    });
});

k.go("title");


function addBeanOnGameOver(playerIndex: number, percent: number, totalPlayers: number, hasCrown: boolean, position: number) {
    const playerInfo = playersConfig[playerIndex]
    const cur_x_pos = ((k.width() / 2) - 150 * (totalPlayers - playerIndex)) + ((200 * totalPlayers) / 2);

    k.add([
        k.rect(80, 100),
        k.pos(cur_x_pos, 250 + k.height() / 2),
        k.color(playerInfo.playerColor),
        k.fixed(),
        k.anchor("bot"),
        k.z(10),
        "bar_red_filled"
    ]);

    k.add([
        k.sprite("bar"),
        k.pos(cur_x_pos, 250 + k.height() / 2),
        k.color(k.BLACK),
        k.fixed(),
        k.anchor("bot"),
        k.z(20),
        "bar_red"
    ]);

    k.add([
        k.text((position + 1).toString(), { size: 69, font: "retrofont" }),
        k.pos(cur_x_pos, 200 + k.height() / 2),
        k.z(30),
        k.anchor("center"),
        k.color(k.BLACK)
    ]);

    k.add([
        k.text(percent.toString() + "%", { size: 40, font: "retrofont" }),
        k.pos((cur_x_pos) + 20, 300 + k.height() / 2),
        k.z(30),
        k.anchor("center"),
        k.color(playerInfo.playerColor)
    ]);

    if (hasCrown) {
        k.add([
            k.text("👑", { size: 64, }),
            k.pos(cur_x_pos, (k.height() / 2) - 20),
            k.fixed(),
            k.anchor("center"),
            k.z(40),
            "game_over_text"
        ]);
    }

    k.add([
        k.sprite(playerInfo.sprite),
        k.pos(cur_x_pos, 0 + ((k.height() / 2) + (90))),
        k.scale(0.7),
        k.anchor("bot")
    ]);
}


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

function updateBlockColor(prev, newColor) {
    if (prev == newColor) return;
    switch (prev) {
        case COLOR_RED:
            gameState.player4 -= 1
            break;
        case COLOR_BLUE:
            gameState.player3 -= 1
            break;
        case COLOR_YELLOW:
            gameState.player1 -= 1
            break;
        case COLOR_GREEN:
            gameState.player2 -= 1
            break;
    }

    switch (newColor) {
        case COLOR_RED:
            gameState.player4 += 1
            break;
        case COLOR_BLUE:
            gameState.player3 += 1
            break;
        case COLOR_YELLOW:
            gameState.player1 += 1
            break;
        case COLOR_GREEN:
            gameState.player2 += 1
            break;
    }

    // log(JSON.stringify(gameState))
}