const { CommandoClient } = require('discord.js-commando');
const Discord = require('discord.js') // required for message embedding.
const fs = require("fs")

const path = require('path')

const loginToken = require(path.join(__dirname, "settings/logintoken.JSON"))

const client = new CommandoClient({
	commandPrefix: "-",
	owner: "139279634796773376",
	disableEveryone: false,
	unknownCommandResponse: false
})

client.registry
	.registerDefaultTypes()
	.registerGroups([
		["general", "General Commands"],
		["modmail", "Anonymous ModMail Commands"],
		["verification", "Verification Commands"],
        ["moderation", "Moderation Commands"]
		])
	.registerDefaultGroups()
	.registerDefaultCommands()
	.registerCommandsIn(path.join(__dirname, "commands"));



    client.on("ready", () => {
        // Notification to the console that we're online.
        console.log("Ready to go.")
        let self = this // this fixes things, thanks JS.

        // Check if we had any message collectors (for modmail) that we need to reinstigate.
        var fileLocation = path.join(__dirname, "servers/", "571462276930863117" + ".JSON")
        if (!fs.existsSync(fileLocation)){
                fs.writeFileSync( fileLocation, '{"guild": {}}', {encoding: "utf8", flag: "wx" } ) // create the file if it doesn't already exist and write some JSON to it to stop errors.
        }
        var server = JSON.parse(fs.readFileSync(fileLocation, "utf8")); // read the file.
        let serverInfo = server.guild

        // Iterate over the modMailChannels (userIDs by channel) and recreate any lost message collectors.
        let mailChannels = serverInfo.modMailChannels || {}
        if (Object.keys(mailChannels).length == 0){ return }
        for (var channel in mailChannels){
            // the userID is the value, so we want to get their DM channel and create the collector there.
            client.guilds.get("571462276930863117").members.get(mailChannels[channel]).createDM() // we have to create a DM because .dmChannel doesn't work at all.
                .then( dmChannel => {
                    const messageFilter = m => m.content.charAt(0) !== "-"  // not a command
                    const messageCollector = dmChannel.createMessageCollector(messageFilter)
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
                            let message = "**[User ???]:** " + m.content

                            let messageOptions = {}
                            if (m.attachments.size !== 0){ // check if we have attachments, if so add them.
                                let attachments = []
                                m.attachments.forEach( (attachment, key) => {
                                    attachments.push(attachment.url)
                                })
                                messageOptions.files = attachments
                            }
                            client.guilds.get("571462276930863117").channels.get(channel).send(message, messageOptions)
                        }
                    })
                })


        }


    })

/*

	BAN MANAGEMENT

*/



function checkBanList(){
	// We need to do a check on a per-server basis, in case we use the bot in more than one server.

	this.guilds.forEach( (value, key) => {
		// Retrieve the still-banned list.
		var fileLocation = path.join(__dirname, "servers/", key + ".JSON")
		if (!fs.existsSync(fileLocation)){
			fs.writeFileSync( fileLocation, '{"guild": {}}', {encoding: "utf8", flag: "wx" } ) // create the file if it doesn't already exist and write some JSON to it to stop errors.
		}
		var server = JSON.parse(fs.readFileSync(fileLocation, "utf8")); // read the file.
		let serverInfo = server.guild
		let banTimers = serverInfo.banTimers || {}

		// Iterate over all the objects to see if anyone needs to be unbanned.
		/*
		{
		userID: endDate1,
		userID1: endDate1
		}
		*/

		for (userID in banTimers) {
			if (banTimers[userID] < (new Date()).getTime()) { // the user's ban has expired (the current time is greater than the ban time)
				this.guilds.get(key).unban(userID, "(AUTO:) Temporary ban expired.")

                this.fetchUser(userID)
                .then( user => {
                    user.createDM()
                    .then( dmChannel => {
                        const unbanEmbed = new Discord.RichEmbed()
                            .setTitle("**You have been unbanned from " + this.guilds.get(key).name + ".**")
                            .setFooter("Please read the rules once you rejoin.")
                            .setTimestamp(new Date())
                            .setColor(0x00FF00)

                        dmChannel.send({embed: unbanEmbed})
                    })
                })

				// Then delete the value from the table.
				delete banTimers[userID]
			}
		}

		fs.writeFile(fileLocation, JSON.stringify({"guild": serverInfo}, null, 2), (err) => {
        if (err){
            console.error(error)
            console.log("ERROR")
        }
        else{
            console.log("Updated ban list successfully.")
        }
    })

	})


}

// Create a timer that fires every 5 minutes, checking if anyone needs to be unbanned.

client.setInterval(checkBanList.bind(client), 300000)

/*

	STARBOARD / CURSED BOARD

*/

// Rip starboard.
var starredMessages = {} // messageID: starboardMessageID
var cursedMessages = {}


client.on("messageReactionAdd", (reaction, user) => {
    if (reaction.emoji.name == "⭐"){
        if (reaction.message.id in starredMessages){ // we've seen this message, so we want to edit it. Although we could delete messages that fall under 4 stars, that would be spammable, so we won't (for now)
            const embed = generateRichEmbed(reaction, user)
            reaction.message.guild.channels.get("576277421561741324").messages.get(starredMessages[reaction.message.id]).edit(embed)
        }
        else { // we haven't seen it before, so check if it has at least 4 stars.
            if (reaction.count >= 4){
                const embed = generateRichEmbed(reaction, user)
                reaction.message.guild.channels.get("576277421561741324").send(embed)
                    .then( message => {
                        starredMessages[reaction.message.id] = message.id
                    })
            }
        }
    }
	else if (reaction.emoji.name == "😳"){
		if (reaction.message.id in cursedMessages){ // we've seen this message, so we want to edit it. Although we could delete messages that fall under 4 stars, that would be spammable, so we won't (for now)
			const embed = generateCursedRichEmbed(reaction, user)
			reaction.message.guild.channels.get("576277421561741324").messages.get(cursedMessages[reaction.message.id]).edit(embed)
		}
		else { // we haven't seen it before, so check if it has at least 4 stars.
			if (reaction.count >= 4){
				const embed = generateCursedRichEmbed(reaction, user)
				reaction.message.guild.channels.get("576277421561741324").send(embed)
					.then( message => {
							cursedMessages[reaction.message.id] = message.id
					})
			}
		}
	}


})
/*client.on("messageReactionAdd", (reaction, user) => {
    if (reaction.emoji.name == "⭐"){
        if (reaction.count == 4){
            if (!starredMessages.includes(reaction.message.id)){ // we want to add it.
                if (reaction.message.attachments.size == 0){ // it's not an image, we just want text.
                    const embed = new Discord.RichEmbed()
                        .addField("Author:", reaction.message.author, true)
                        .addField("Channel:", reaction.message.channel, true)
                        .addField("Message:", reaction.message.content)
                        .addField("View Message:", "[Jump To Message](" + reaction.message.url + ")")
                        .setColor(0xFFD700)
                        .setTimestamp(new Date())
                    reaction.message.guild.channels.get("576277421561741324").send(embed)
                    starredMessages.push(reaction.message.id)
                }
                else{ // there's an image, so we want to add it.
                    const embed = new Discord.RichEmbed()
                        .addField("Author:", reaction.message.author, true)
                        .addField("Channel:", reaction.message.channel, true)
                        .setColor(0xFFD700)
                        .setTimestamp(new Date())
                    if (reaction.message.content !== ""){
                        embed.addField("**Message**", reaction.message.content)
                    }
                    embed.addField("View Message:", "[Jump To Message](" + reaction.message.url + ")")
                    embed.setImage(reaction.message.attachments.values().next().value.url) // because its a map, and we need to get the first value of the map and then get the url from that.
                    reaction.message.guild.channels.get("576277421561741324").send(embed)
                    starredMessages.push(reaction.message.id)
                }

            }
        }
    }
})
*/


/*

	INVITE TRACKER

*/
var inviteMap = new Map()
client.on("guildMemberAdd", async function(member) {
    if (member.guild.id !== "571462276930863117"){
        return
    }
	var fileLocation = path.join(__dirname, "servers/", member.guild.id + ".JSON")
	if (!fs.existsSync(fileLocation)){
			fs.writeFileSync( fileLocation, '{"guild": {}}', {encoding: "utf8", flag: "wx" } ) // create the file if it doesn't already exist and write some JSON to it to stop errors.
	}
	var server = JSON.parse(fs.readFileSync(fileLocation, "utf8")); // read the file.
	let serverInfo = server.guild

	// Automatically give the unverified role to people who join.
	let unverifiedRole = serverInfo.unverifiedRoleID || "620135189208629248"
	member.addRole(unverifiedRole)


    // We want to iterate over the invite lists to see which one has incremented.
    // If one has incremented since the last update, we know it was that invite.
    // If none have incremented, then we want to iterate over all the invites, see which ones have not been added to our list, then see which one of those has a use of 1.
    // If no results are found, then the invite was a one-use, or it reached a cap.



    serverInfo.scoreTable = serverInfo.scoreTable || {}
    serverInfo.seenIDTable = serverInfo.seenIDTable || []
	var scoreTable = serverInfo.scoreTable
	var seenTable = serverInfo.seenIDTable


    await member.guild.fetchInvites()
        .then((invites) => {
            let relevantInvite = null
            newInviteData = compressInviteInfo(invites)
            for (var inviteInfo of newInviteData){ // returns an array, key first index, invite second index.
                // See if the current key exists within our saved  data.
                var associatedData = inviteMap.get(inviteInfo[0])
                // If we know info about this key:
                if (associatedData !== undefined){
                    if (inviteInfo[1].uses == (associatedData.uses + 1)){
                        relevantInvite = inviteInfo
                        break
                    }
                }
                // We don't know anything about this key, so it's new:
                else{
                    // Check to see if it has a use of 1:
                    if (inviteInfo[1].uses == 1){
                        relevantInvite = inviteInfo
                    }
                }
            }
            // At this point, we should either know which invite it was, or know that we CANT know.
            // So, let's print some info!
            if (relevantInvite !== null){
                embedMessage = member.user + " was invited by " + relevantInvite[1].inviter + ". Invite code: " + relevantInvite[1].code + "."
            }
            else{
                embedMessage = member.user + " was invited with an unknown invite (likely a one-time use invite.)"
            }
            const embed = new Discord.RichEmbed()
                .setColor(0x00FF00)
                .setTimestamp(new Date())
                .addField("Member Joined!", embedMessage)

            member.guild.channels.get("617520845744635906").send(embed)

            // Lastly, update our invite info.
            inviteMap = newInviteData

            // We now need to see if we already know about this person. If we do, then we need to subtract one from the inviters amount so that they don't change score.
			let alreadyInvited = false
			if (seenTable.includes(member.id) && relevantInvite !== null) {
				alreadyInvited = true
                if (relevantInvite[1].inviter.id in scoreTable){
                    scoreTable[relevantInvite[1].inviter.id] += -1
                }
                else{
                    scoreTable[relevantInvite[1].inviter.id] = -1
                }
			}
			else{ // we want to add to the table.
				seenTable.push(member.id)
			}


            // Next step, see if anyone has just hit 10 or 50 or 250 invites, and if so give them a cool kids role.
            let inviteData = new Map()
            // Iterate over each invite, adding the # of uses per person.
			if (!alreadyInvited){
				inviteMap.forEach( (value, key) => {
	                if (inviteData.has(value.inviter.id)){
	                    let newVal = value.uses + inviteData.get(value.inviter.id)
	                    inviteData.set(value.inviter.id, newVal)
	                }
	                else{
	                    inviteData.set(value.inviter.id, value.uses)
	                }
	            })

	            // Now iterate over inviteData to see if anyone has 10 or 50 or 250
	            console.log("Invite Data: " + inviteData)
	            inviteData.forEach( (value, key) => {
	                if ( (value + (key in scoreTable ? scoreTable[key] : 0)) == 10 && !member.guild.members.get(key).roles.has("617503809832222732")){ // novice inviter
	                    console.log("10 members: " + key)
	                    member.guild.members.get(key).addRole("617503809832222732", "Invited 10 members to the server.")
	                }
	                if ((value + (key in scoreTable ? scoreTable[key] : 0)) == 50 && !member.guild.members.get(key).roles.has("617536735307366410")){ // awesome inviter
	                    console.log("50 members: " + key)
	                    member.guild.members.get(key).addRole("617536735307366410", "Invited 50 members to the server.")
	                }
	                if ((value + (key in scoreTable ? scoreTable[key] : 0)) == 150 && !member.guild.members.get(key).roles.has("617536735307366410")){ // surreal inviter
	                    member.guild.members.get(key).addRole("617536735307366410", "Invited 150 members to the server.")
	                }
	            })

			}

        })
    fs.writeFile(fileLocation, JSON.stringify({"guild": serverInfo}, null, 2), (err) => {
        if (err){
            console.error(error)
            console.log("ERROR")
        }
        else{
            console.log("saved!")
        }
    })



})

function compressInviteInfo(invites){
    let compressedInfo = []
    invites.forEach( (invite, key) => {
        // Build up a condensed map.
        var keyInfo = {
            code: key,
            inviter: invite.inviter,
            uses: invite.uses,
            maxUses: invite.maxUses,
            maxAge: invite.maxAge
        }
        compressedInfo.push([key, keyInfo])
    })
    return new Map(compressedInfo)
}

// Helper function to generate an embed so we can declutter code.
function generateRichEmbed(reaction, user){
    const embed = new Discord.RichEmbed()
        .addField("Author:", reaction.message.author, true)
        .addField("Channel:", reaction.message.channel, true)
        .setColor(0xFFD700)
        .setTimestamp(new Date())
        .setFooter(reaction.count + "⭐")
    if (reaction.message.content !== ""){
        embed.addField("Message:", reaction.message.content)
    }
    embed.addField("View Message:", "[Jump To Message](" + reaction.message.url + ")")
    if (reaction.message.attachments.size !== 0){
        embed.setImage(reaction.message.attachments.values().next().value.url) // because its a map, and we need to get the first value of the map and then get the url from that.
    }

    return embed
}

function generateCursedRichEmbed(reaction, user){
	const embed = new Discord.RichEmbed()
			.addField("Author:", reaction.message.author, true)
			.addField("Channel:", reaction.message.channel, true)
			.setColor(0xFF0000)
			.setTimestamp(new Date())
			.setFooter(reaction.count + "😳")
	if (reaction.message.content !== ""){
			embed.addField("Message:", reaction.message.content)
	}
	embed.addField("View Message:", "[Jump To Message](" + reaction.message.url + ")")
	if (reaction.message.attachments.size !== 0){
			embed.setImage(reaction.message.attachments.values().next().value.url) // because its a map, and we need to get the first value of the map and then get the url from that.
	}

	return embed
}

client.on("error", (err) => console.error(err))


client.login(loginToken.loginToken)
