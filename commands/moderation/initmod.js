const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.
// require base
const path = require('path')

const base    = require(path.join(__dirname, "../../custom_modules/base.js"))

module.exports = class InitMod extends Command {
	constructor(client) {
		super(client, {
			name: "initmod",
			group: "moderation",
			memberName: "initmod",
			description: "Sets up the required arrays and objects so that moderation module can work, only needs to be run once per server.",
			ownerOnly: true
		})
	}



	run(msg){


		var serverInfo        = base.getServerInfo(msg)
        serverInfo.caseNumber = 0
        serverInfo.modLog = {}
        serverInfo.banTimers = {}
        serverInfo.muteTimers = {}
        serverInfo.mutePersist = []

        msg.say("Done!")
		base.saveServerInfo(msg, serverInfo)


	}
}
