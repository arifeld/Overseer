const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

const path = require("path")

const base = require(path.join(__dirname, "../../custom_modules/base.js"))

// Time interpreter.
const convertTime = require("parse-duration")
const humanizeDuration = require("humanize-duration")

module.exports = class Moderations extends Command {
	constructor(client) {
		super(client, {
			name: "moderations",
			group: "moderation",
			memberName: "moderations",
			description: "Displays all active bans and mutes, as well as the duration remaining on them.",
			guildOnly: true
		})
	}


	async run(msg){

		if (!msg.member.hasPermission("KICK_MEMBERS")){
			const errorEmbed = new RichEmbed()
				.setTitle("**You do not have permission to use this command!**")
				.setDescription("This command requires the 'Kick Members' permission.")
				.setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
				.setColor(0xFF0000)
			return msg.embed(errorEmbed)
		}

	    let serverInfo = base.getServerInfo(msg)
        // We want to look at the banTimers and muteTimers objects, and just .fetchUser() on anyone we find.
        let currentBans = serverInfo.banTimers
        let currentMutes = serverInfo.muteTimers

        const banEmbed = new RichEmbed()
            .setColor(0xFF0000)
            .setAuthor(msg.member.displayName, msg.author.avatarURL)
            .setTitle("Active Bans:")

        const muteEmbed = new RichEmbed()
            .setTitle("Active Mutes:")
            .setColor(0xFF0000)
            .setTimestamp(new Date())

        for (let banID in currentBans){
            // Check if the ban has actually expired, but just not been deleted yet.
            // They're banned, so they're not on the server. Fetch their user:
            await this.client.fetchUser(banID)
                .then( user => {
                    if (user == undefined){ return }
                    // Ban may have expired but we haven't removed it yet, so check:

                    banEmbed.addField("**" + user.username + "#" + user.discriminator + "**", "Remaining Duration: " + humanizeDuration(currentBans[banID] - (new Date()).getTime()))
                })
        }

        for (let muteID in currentMutes){
            if (currentMutes[muteID] < (new Date()).getTime()){ continue }
            // They *could* be on the server, but it won't format properly anyway. Just fetchUser.
            await this.client.fetchUser(muteID)
                .then( user => {
                    if (user == undefined){ return }
                    muteEmbed.addField("**" + user.username + "#" + user.discriminator + "**", "Remaining Duration: " + humanizeDuration(currentMutes[muteID] - (new Date()).getTime()))
                })
        }

        // Verify the embeds aren't empty:
        if (banEmbed.fields.length == 0){
            banEmbed.setDescription("There are no active bans!")
        }
        if (muteEmbed.fields.length == 0){
            muteEmbed.setDescription("There are no active mutes!")
        }
        // Now send.
        return msg.embed(banEmbed)
            .then( _msg => {
                msg.embed(muteEmbed)
            })

    }
}
