const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.
// require base
const path = require('path')

const base    = require(path.join(__dirname, "../../custom_modules/base.js"))

module.exports = class InitMail extends Command {
	constructor(client) {
		super(client, {
			name: "initmail",
			group: "modmail",
			memberName: "initmail",
			description: "Sets up the required arrays and objects so that modmail can work, only needs to be run once per server.",
			ownerOnly: true
		})
	}



	run(msg){


		var serverInfo        = base.getServerInfo(msg)

        serverInfo.modMailIndex = 0
        serverInfo.modMailChannelsID = {}
        serverInfo.modMailChannels = {}
        serverInfo.modMailCollectors = {}
        serverInfo.modMailBanList = []

        msg.say("Done!")
		base.saveServerInfo(msg, serverInfo)


	}
}
