// Discord.js modules
const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.
// Node modules
const path = require("path")
// Custom modules.
const base    = require(path.join(__dirname, "../../custom_modules/base.js"))
const modBase = require(path.join(__dirname, "../../custom_modules/modBase.js"))
const botConfig = require(path.join(__dirname, "../../settings/botConfig.json"))


module.exports = class MergeWarns extends Command {
	constructor(client) {
		super(client, {
			name: "mergewarns",
			group: "mod_utility",
			memberName: "mergewarns",
      description: "",
			guildOnly: true,
      ownerOnly: true

		})
	}


	async run(msg){
        msg.guild.channels.get("666943376024797185").fetchMessages({limit: 13})
            .then( messages => {
                messages.forEach( (message, key) => {
                    let content = message.content
                    const regexSearch = /\d{18}/g;
                    //console.log(content)
                    console.log(content.match(regexSearch))
                })
            })

    }
}
