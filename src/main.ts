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



k.setBackground(237, 237, 237);

const COYOTE_TIME = 0.1;
const ACCELERATION = 2000;
const MAX_HORZ_SPEED = SPEED;
const FRICTION_GROUND = 1000;



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
    },
];

const levelLayout = [
    "b    %                &   ",
    "b   ===              ===  ",
    "b   @           $         ",
    "b                         ",
    "b                         ",
    "b           ====          ",
    "b                         ",
    "b                         ",
    "b     ==  w               ",
    "b         o               ",
    "b=-==\\    affff           ",
    "======-==b=====--========",
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


    const tilesConfig = {
        "=": () => [
            k.sprite("ground"), k.anchor("bot"), k.area(), k.body({ isStatic: true }),
        ],
        "-": () => [
            k.sprite("ground1"), k.anchor("bot"), k.area(), k.body({ isStatic: true }),
        ],
        "b": () => [
            k.sprite("brick"), k.anchor("bot"), k.area(), k.body({ isStatic: true }), k.z(0)
        ],
        "o": () => [
            k.sprite("fort"), k.anchor("bot"), k.area(), k.body({ isStatic: true }), k.z(0)
        ],
        "/": () => [
            k.sprite("slope", {flipX: true}),
            k.area({
               shape: new k.Polygon([
                    k.vec2(0 - LEVEL_TILE_WIDTH / 2, 0),
                    k.vec2(LEVEL_TILE_WIDTH /2, 0),
                    k.vec2(LEVEL_TILE_WIDTH / 2, -LEVEL_TILE_HEIGHT) 
                ]),
            }),
            k.anchor("bot"),
            k.body({ isStatic: true }),
            "slope_tile",
        ],
        "\\": () => [
            k.sprite("slope"), 
            k.area({
                shape: new k.Polygon([
                    k.vec2(0  - LEVEL_TILE_WIDTH / 2, 0),
                    k.vec2( 0 + LEVEL_TILE_WIDTH / 2, 0),
                    k.vec2(0 - (LEVEL_TILE_WIDTH / 2), -LEVEL_TILE_HEIGHT - 7) 
                ]),
            }),
            k.anchor("bot"), 
            k.body({ isStatic: true }),
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
                    k.pos(0, -BEAN_HEIGHT + 35 ),
                    k.anchor("bot"), 
                    "hat",
                ]);
            }
        }
    });


    players.forEach(player => { // Changed back to player instead of destructuring for clarity
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

        k.onKeyDown(config.keybinds.left, () => {
            instance.flipX = true;
        });

        k.onKeyDown(config.keybinds.right, () => {
            instance.flipX = false;
        });

        // might need later
        // k.onKeyRelease(config.keybinds.left, () => {
        //     if (!k.isKeyDown(config.keybinds.right)) {
        //         instance.flipX = false;
        //     }
        // });

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
        const maxCamScale = 0.7;

        targetScale = Math.max(minCamScale, Math.min(maxCamScale, targetScale));

        k.setCamScale(targetScale, targetScale);
    });
});


k.go("game");

