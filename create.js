const comba = require("./scripts/method1/comba");


const API = require("node-haxball")();
const { Room, Errors } = API;

/* 

See the documentation at 
https://github.com/wxyz-abcd/node-haxball
and 
https://github.com/wxyz-abcd/node-haxball/blob/main/examples/api_structure/createRoom.js 
to learn how to create a room.

*/

Room.create({
    name: "comba-haxball",
    showInRoomList: true,
    noPlayer: true,
    maxPlayerCount: 30,
    geo: null,
    token: "" // https://www.haxball.com/headlesstoken
}, {
    plugins: [
        new comba(API)
    ],
    onOpen: (room) => {
        room.onAfterRoomLink = (link) => console.log(link);

        function updateAdmins() {
            const players = room.players;
            const admins = players.filter(p => p.isAdmin);
            if (admins.length > 0) return;

            room.setPlayerAdmin(players[0].id, true);
        }

        room.onPlayerJoin = function (player) {
            updateAdmins();
        };
    },
    onClose: (msg) => {
        if (msg.code === Errors.ErrorCodes.MissingRecaptchaCallbackError) {
            console.error("Invalid Token");
        } else {
            console.error("Bot has left the room:", msg.code);
        }

        process.exit(0);
    }
});