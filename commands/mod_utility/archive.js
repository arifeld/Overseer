const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.
const fs = require("fs")

const path = require('path')
module.exports = class ArchiveChannel extends Command {
	constructor(client) {
		super(client, {
			name: "archive",
			group: "mod_utility",
			memberName: "archive",
			description: "Archives all messages in a given channel.",
            ownerOnly: true

		})
	}

	async run(msg){

		var messageCollection = await msg.channel.fetchMessages();

        let saveString = ""

        // Save the first message so we can refer to it.
        let firstMessage = messageCollection.first()


        messageCollection.forEach( (message, snowflake) => {
            // USERNAME#DISCRIMINATOR (timestamp) - SNOWFLAKE
            let appendString = "-------------------\n" + message.author.username + message.author.discriminator + " - " + snowflake.toString() + ":\n" + message.content + "\n"
            // We also need to handle embeds
            if (message.embeds.length !== 0){
                if (message.embeds[0].type == "rich"){
                    appendString += ("EMBED: Author - " + message.author.name + "| Title - " + message.embeds[0].title + " | Description - " + message.embeds[0].description + "\n")
                    if (message.embeds[0].fields.length !== 0){ appendString += "CONTENT:\n"}
                    for (var field in message.embeds[0].fields) {
                        appendString += "Field Title: " + field.name + " | Field Content: " + field.value + "\n"
                    }
                }
            }
            appendString += "-------------------\n"

            saveString = appendString + saveString
        })

        // Now save the file.
        let fileLocation = path.join(__dirname, "../../guildArchive.txt")

        fs.writeFile(fileLocation, saveString, (err) => {
            if (err){
                console.error(error)
            }

            // Now send with the attachment.
            return this.client.guilds.get("670371258516504578").channels.get("695804860259500092").send("**" + msg.channel.name + "**", {files: [{ attachment: fileLocation, name: "guildArchive.txt"}]})
						.then( __ => {
							msg.channel.delete()
						})
        })

	}
}
