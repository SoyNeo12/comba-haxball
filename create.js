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
    geo: null
}, {
    plugins: [ // if you use method 1
        new comba(API)
    ],
    onOpen: (room) => {
        room.onAfterRoomLink = function (link) {
            console.log(link);
        };

        toggleComba(room) // if you use method 2
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