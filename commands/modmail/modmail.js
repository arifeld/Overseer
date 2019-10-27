const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.
// require base
const fs = require("fs")
const path = require('path')
const base    = require(path.join(__dirname, "../../custom_modules/base.js"))

module.exports = class StartModMail extends Command {
	constructor(client) {
		super(client, {
			name: "modmail",
			group: "modmail",
			memberName: "modmail",
			description: "Starts an anonymous modmail with the Teamagers staff. Please do not abuse this system or you will be banned from the feature.",
			args: [
        {
          key: "title",
          prompt: "What would you like the title of the modmail to be?",
          type: "string",
					default: ""
        }
			]
		})
	}



	async run(msg, args){
		const {title} = args;
		// Check if the user is in a DM.
		if (msg.channel.type !== "dm"){
			msg.delete()
			msg.author.createDM()
				.then(channel => {
					const embed = new RichEmbed()
						.setColor(0xFF0000)
						.addField("Cannot start modmail in a non-DM.", "Please start a modmail (type `modmail`) in this DM.")
					channel.send({embed:embed})
				})
			return
		}
		// We can't use getServerInfo from a DM, so:
		var fileLocation = path.join(__dirname, "../../servers/", "571462276930863117" + ".JSON")
		if (!fs.existsSync(fileLocation)){
				fs.writeFileSync( fileLocation, '{"guild": {}}', {encoding: "utf8", flag: "wx" } ) // create the file if it doesn't already exist and write some JSON to it to stop errors.
		}
		var server = JSON.parse(fs.readFileSync(fileLocation, "utf8")); // read the file.
		var serverInfo        = server.guild
		let modMailIndex      = serverInfo.modMailIndex      || 0
		let modMailChannelsID = serverInfo.modMailChannelsID || {} // channels by user id.
		let modMailChannels   = serverInfo.modMailChannels   || {} // userids by channel
		let modMailCollectors = serverInfo.modMailCollectors || {}
		let modMailBanList    = serverInfo.modMailBanList    || []

		// Check if the user is banned.
		if (modMailBanList.includes(msg.author.id)){
			const bannedEmbed = new RichEmbed()
				.setColor(0xFF0000)
				.setTitle("You have been banned from using the anonymous mod-mail system.")
				.addField("Why is this?", "We ban members from using the mod-mail system if they have been found to be abusing the system.")
                .addField("How do I appeal the ban?", "Unfortunately due to the nature of this system, you cannot appeal your ban without revealing your identity.\nIf you wish to appeal your ban, however, please contact one of the admins.")
				.setTimestamp(new Date())
			return msg.embed(bannedEmbed)
		}

		else if (msg.author.id in modMailChannelsID){
			const alreadyStartedEmbed = new RichEmbed()
				.setColor(0xFF0000)
				.setTitle("You can't create a new modmail!")
				.setDescription("You already have one in progress.")
				.setTimestamp(new Date())
			return msg.embed(alreadyStartedEmbed)
		}
        else{
            // We now want to create a new channel in the server and create a message collector.
    		// For now, we only want this feature to work in the Teamagers server.

    		// Increment the modmail counter.
    		modMailIndex = modMailIndex + 1

    		// Create a new channel in Teamagers.
    		await this.client.guilds.get("571462276930863117").createChannel("modmail-" + modMailIndex, {
    			type: "text",
    			parent: this.client.guilds.get("571462276930863117").channels.get("636725786380075008")
    		})
    		.then(channel => {
    			// Log the channel by userID, and then send an initial embed.
    			modMailChannelsID[msg.author.id] = channel.id
    			modMailChannels[channel.id] = msg.author.id

    			const newTicketEmbed = new RichEmbed()
    				.setTitle("New Mod Mail Created!")
    				.addField("Title:", (title == "" ? "No title specified." : title))
    				.setTimestamp(new Date())
                    .setColor(0x00FF00)
    			channel.send({embed: newTicketEmbed})

                // Let the user know the modmail has started.
                const informUserEmbed = new RichEmbed()
                    .setTitle("**Started a new anonymous modmail!**")
                    .setColor(0x00FF00)
                    .addField("**How do I message the moderation team?**", "Any messages (and images) you send to this channel will automatically be forwarded to the team.")
                    .addField("**How long do I need to wait before I get a response?**", "A staff member will respond to your modmail as soon as possible. Please be patient, as we may not be online to handle your modmail immediately.")
                    .addField("**How do I stop the chat?**", "Currently, users cannot end the chat themselves, in order to preserve chat logs. Once the discussion becomes inactive, or by request, the moderation team will close the modmail.")
                msg.embed(informUserEmbed)
    			// Create a message collector.
                const messageFilter = m => m.content.charAt(0) !== "-"  // not a command
    			const messageCollector = msg.channel.createMessageCollector(messageFilter)
    			messageCollector.on("collect", m => {
    				if (m.content.includes("[CHAT ENDED]") && m.author.bot ){
    					messageCollector.stop()
    				}
                    else if (m.author.bot){
                        // do nothing
                    }
    				else{
        				// Send the message.
        				// See if an embed as opposed to an actual message is worthwhile.
        				// For now we will just use a message, because it probably looks better.
        				let message = "**[User " + modMailIndex + "]:** " + m.content

        				let messageOptions = {}
                        if (m.attachments.size !== 0){ // check if we have attachments, if so add them.
                            let attachments = []
                            m.attachments.forEach( (attachment, key) => {
                                attachments.push(attachment.url)
                            })
                            messageOptions.files = attachments
                        }
        				channel.send(message, messageOptions)
                    }
    			})
    		})

            serverInfo.modMailIndex = modMailIndex // maybe this will work?

    		var fileLocation = path.join(__dirname, "../../servers/", "571462276930863117" + ".JSON")

    		fs.writeFile(fileLocation, JSON.stringify({"guild": serverInfo}, null, 2), (err) => {
    				if (err){
    						console.error(error)
    						return msg.reply("an unexpected error occured whilst trying to save. This **will** result in data loss.\nTry repeating the command. If that fails, please contact @Feldma#1776.\nPlease give him the following code: " + msg.guild.id)
    				}
    		})
        }



	}
}
