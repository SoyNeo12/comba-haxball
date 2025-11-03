module.exports = function (API) {
    const { Plugin, Utils, AllowFlags, VariableType } = API;

    Object.setPrototypeOf(this, Plugin.prototype);
    Plugin.call(this, "comba", true, {
        version: "0.1",
        author: "neo",
        description: "Implementation of a curved shot",
        allowFlags: AllowFlags.CreateRoom
    });

    // The value and the minimum, maximum, and step range can be modified.
    this.defineVariable({
        name: "gravityStrength",
        type: VariableType.Number,
        value: 0.05,
        range: {
            min: 0,
            max: 0.10,
            step: 0.01
        },
        description: "Force for gravity"
    });

    this.defineVariable({
        name: "speed",
        type: VariableType.Number,
        value: 2,
        range: {
            min: 0,
            max: 10,
            step: 1
        },
        description: "Speed for gravity"
    });

    this.defineVariable({
        name: "combaColor",
        type: VariableType.Color,
        value: 0xFF0000,
        description: "Color of the ball when gravity is activated"
    });

    this.defineVariable({
        name: "timeToLoad",
        type: VariableType.Integer,
        value: 2000,
        description: "Time to load the curveball"
    });

    let that = this,
        ticks = 0,
        heldBy = null,
        originalBallColor = null,
        combaActive = false,
        timeout = null;

    this.initialize = function () {
        ticks = 0;
        heldBy = null;
        originalBallColor = null;
        combaActive = false;
        timeout = null;
    };

    this.onGameStart = function () {
        ticks = 0;
        heldBy = null;
        combaActive = false;

        if (timeout) clearTimeout(timeout);
        timeout = null;

        if (!originalBallColor) {
            const ball = that.room.getBall();
            if (ball) {
                originalBallColor = ball.color;
            }
        }
    };

    function pointDistance(ball, player) {
        const dx = ball.pos.x - player.pos.x;
        const dy = ball.pos.y - player.pos.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function getClosestPlayer() {
        const players = that.room.players.filter(p => p.team.id !== 0);
        if (players.length === 0) return;

        const ball = that.room.getBall();
        if (!ball) return;

        let closestPlayer = null;
        for (const player of players) {
            const playerProps = player.disc;
            if (!playerProps) continue;

            const distance = pointDistance(ball, playerProps);
            const triggerDistance = playerProps.radius + ball.radius + 0.1;
            if (distance <= triggerDistance) {
                closestPlayer = player;
            }
        }

        return closestPlayer;
    }

    function setDiscProps(playerId) {
        const ball = that.room.getBall();
        const playerProps = that.room.getPlayerDisc(playerId);
        if (!playerProps || !ball) return;

        const ygravity = playerProps.pos.y > ball.pos.y ? -that.gravityStrength : that.gravityStrength;
        const newProperties = {
            xspeed: ball.speed.x * that.speed,
            yspeed: ball.speed.y * that.speed,
            color: originalBallColor,
            ygravity
        };

        Utils.runAfterGameTick(() => {
            that.room.setDiscProperties(0, newProperties);
        });
    }

    function resetGravity() {
        combaActive = false;
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        Utils.runAfterGameTick(() =>
            that.room.setDiscProperties(0, {
                color: originalBallColor ?? 0xFFFFFF,
                ygravity: 0
            })
        );
    }

    function applyGravity() {
        const closest = getClosestPlayer();
        if (closest) {
            if (!heldBy) {
                heldBy = closest.id;
                resetGravity();

                timeout = setTimeout(() => {
                    Utils.runAfterGameTick(() =>
                        that.room.setDiscProperties(0, { color: that.combaColor })
                    );

                    combaActive = true;
                }, that.timeToLoad);
            }
        } else if (heldBy) {
            resetGravity();
            heldBy = null;
        }
    }

    this.onPlayerBallKick = function (playerId) {
        if (combaActive && heldBy === playerId) {
            setDiscProps(playerId);
        }
    };

    this.onGameTick = function () {
        ticks++;

        if (ticks % 30 === 0) {
            applyGravity();
        }
    };

    this.onCollisionDiscVsDisc = function (discId) {
        const ball = that.room.getBall();
        if (!ball) return;

        if (discId === 0 && ball.gravity.y !== 0) {
            resetGravity();
        }
    };

    this.onCollisionDiscVsPlane = function (discId) {
        const ball = that.room.getBall();
        if (!ball) return;

        if (discId === 0 && ball.gravity.y !== 0) {
            resetGravity();
        }
    };

    this.onCollisionDiscVsSegment = function (discId) {
        const ball = that.room.getBall();
        if (!ball) return;

        if (discId === 0 && ball.gravity.y !== 0) {
            resetGravity();
        }
    };
}