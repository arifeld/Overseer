const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

module.exports = class ThinkPortal extends Command {
	constructor(client) {
		super(client, {
			name: "tp",
			group: "fun",
			memberName: "tp",
			description: "",
            ownerOnly: true
		})
	}


	run(msg, args){
        msg.delete()
        msg.say(msg.guild.emojis.get("668646825343057943").toString())
    }
}
