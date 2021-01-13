const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

const path = require("path")

const botConfig = require(path.join(__dirname, "../../settings/botConfig.json"))
const base = require(path.join(__dirname, "../../custom_modules/base.js"))

module.exports = class ViewNotes extends Command {
	constructor(client) {
		super(client, {
			name: "viewnotes",
			group: "modnotes",
			memberName: "viewnotes",
			description: "Views all notes for a given user.",
			guildOnly: true,
      args: [
          {
            key: "user",
            prompt: "which user would you look to view mod-notes for?",
            type: "member"
          }
      ]
		})
	}


	run(msg, args){
        const {user} = args;

        // Manually handle user permissions, because commando has terrible formatting.
        if (!msg.member.hasPermission("KICK_MEMBERS")){
            const errorEmbed = new RichEmbed()
                .setTitle("**You do not have permission to use this command!**")
                .setDescription("This command requires the 'Kick Members' permission.")
                .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
        }

        let serverInfo = base.getServerInfo(msg)
        var userID = user.id
        if (!("modNotes" in serverInfo)){
            serverInfo.modNotes = {}
        }

        let modNotes = serverInfo.modNotes

        let userNotes = modNotes[userID]
        if (userNotes == undefined){
            const errorEmbed = new RichEmbed()
                .setTitle("**That user has no associated mod-notes!**")
                .setAuthor( (user.nickname || user.user.username), user.user.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
        }


        const infoEmbed = new RichEmbed()
            .setTitle("**Mod Logs for " + (user.nickname || user.user.username) + ":**")
            .setColor(0x800080)
            .setAuthor( (user.nickname || user.user.username), user.user.avatarURL)

		const infoEmbed1 = new RichEmbed()
			.setColor(0x800080)

		const infoEmbed2 = new RichEmbed()
			.setColor(0x800080)

		const infoEmbed3 = new RichEmbed()
			.setColor(0x800080)

		// A few sketchy things so that we can display more than 20 results.
		let lastSent = false
        for (var i = 0; i < userNotes.length; i++){ // need to use this for loop to make sure we are in order:
			lastSent = false
            let logObj = userNotes[i]

			// Check which embed we want to add to.
			var currentEmbed
			if (i < 20){
				currentEmbed = infoEmbed
			}
			if ( i >= 20 && i < 40){
				currentEmbed = infoEmbed1
			}
			if (i >= 40 && i < 60){
				currentEmbed = infoEmbed2
			}
			if (i >= 60 && i < 80){
				currentEmbed = infoEmbed3
			}



            if ("edited" in logObj){
                if (logObj.edited){
                    currentEmbed.addField("**Note " + (i+1).toString() + ":** (EDITED)", logObj.note + " - " + msg.guild.members.get(logObj.mod) + " (Last Edit Date: " + (new Date(logObj.timestamp)).toUTCString() + ")")
                }
                else{
                    currentEmbed.addField("**Note " + (i+1).toString() + ":**", logObj.note + " - " + msg.guild.members.get(logObj.mod) + " (" + (new Date(logObj.timestamp)).toUTCString() + ")")
                }
            }
            else{
                currentEmbed.addField("**Note " + (i+1).toString() + ":**", logObj.note + " - " + msg.guild.members.get(logObj.mod) + " (" + (new Date(logObj.timestamp)).toUTCString() + ")")
            }

            // See if we need to send it.
			if (i == 19 || i == 39 || i == 59){
				lastSent = true
				msg.embed(currentEmbed)
			}
        }
		if (!lastSent){
			msg.embed(currentEmbed)
		}

	 }
}
