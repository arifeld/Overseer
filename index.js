const {
    CommandoClient
} = require('discord.js-commando');
const Discord = require('discord.js') // required for message embedding.
const fs = require("fs")

const path = require('path')

const botConfig = require(path.join(__dirname, "/settings/botConfig.json"))
const loginToken = require(path.join(__dirname, "/settings/logintoken.json"))

const modMailGuild = "670371258516504578"
const staffListChannel = "714992141453099049"
const staffListID = "715090255363178557"
const modRoles = ["621401714754584598", "598951569307729921"]

var schedule = require('node-schedule')


const humanizeDuration = require("humanize-duration")

const Canvas = require("canvas")

const client = new CommandoClient({
    commandPrefix: "/",
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
        ["roles", "Role Commands"],
        ["moderation", "Moderation Commands"],
        ["modnotes", "Mod Note Commands"],
        ["mod_utility", "Moderation Utility Commands"],
        ["fun", "Fun Commands"],
        ["embeds", "Embed Commands"],
        ["qotd", "QOTD Commands"],
        ["misc", "Miscellaneous Commands"]
    ])
    .registerDefaultGroups()
    .registerDefaultCommands()
    .registerCommandsIn(path.join(__dirname, "commands"));



client.on("ready", async function () {
    // Notification to the console that we're online.

    console.log("Ready to go.")

    // Change our activity.
    updateActivity()


    let self = this // this fixes things, thanks JS.

    // Check if we had any message collectors (for modmail) that we need to reinstigate.
    var fileLocation = path.join(__dirname, "servers/", botConfig.guildID + ".JSON")
    if (!fs.existsSync(fileLocation)) {
        fs.writeFileSync(fileLocation, '{"guild": {}}', {
            encoding: "utf8",
            flag: "wx"
        }) // create the file if it doesn't already exist and write some JSON to it to stop errors.
    }
    var server = JSON.parse(fs.readFileSync(fileLocation, "utf8")); // read the file.
    let serverInfo = server.guild

    // Even if we just lost connection and restarted, we can still resave all our data for invite tracking
    client.guilds.get(botConfig.guildID).fetchInvites()
        .then(function (invites) {
            inviteMap = compressInviteInfo(invites)
        })

    var modMailFileLocation = path.join(__dirname, "servers/", modMailGuild + ".JSON")
    if (!fs.existsSync(modMailFileLocation)) {
        fs.writeFileSync(modMailFileLocation, '{"guild": {}}', {
            encoding: "utf8",
            flag: "wx"
        }) // create the file if it doesn't already exist and write some JSON to it to stop errors.
    }
    var modserver = JSON.parse(fs.readFileSync(modMailFileLocation, "utf8")); // read the file.
    let mailserverInfo = modserver.guild

    // Iterate over the modMailChannels (userIDs by channel) and recreate any lost message collectors.
    let mailChannels = mailserverInfo.modMailChannels || {}
    if (Object.keys(mailChannels).length == 0) {
        return
    }
    for (var channel in mailChannels) {
        // the userID is the value, so we want to get their DM channel and create the collector there.
        let refMember = client.guilds.get(botConfig.guildID).members.get(mailChannels[channel])
        if (refMember !== undefined) {
            refMember.createDM() // we have to create a DM because .dmChannel doesn't work at all, and we specifically use feemagers so we can actually create the channel.
                .then(dmChannel => {
                    if (dmChannel == undefined) {
                        return
                    }
                    const messageFilter = m => m.content.charAt(0) !== "-" // not a command
                    const messageCollector = dmChannel.createMessageCollector(messageFilter)
                    messageCollector.on("collect", m => {
                        if (m.content.includes("[CHAT ENDED]") && m.author.bot) {
                            messageCollector.stop()
                        } else if (m.author.bot) {
                            // do nothing
                        } else {
                            // Send the message.
                            // See if an embed as opposed to an actual message is worthwhile.
                            // For now we will just use a message, because it probably looks better.
                            const messageEmbed = new Discord.RichEmbed()
                                .setColor(0xCC6699)
                                .setAuthor("New message from user:")
                                .setDescription(m.content)
                                .setTimestamp(new Date())
                            //let message = "**[User ???]:** " + m.content

                            let messageOptions = {}
                            if (m.attachments.size !== 0) { // check if we have attachments, if so add them.
                                let attachments = []
                                m.attachments.forEach((attachment, key) => {
                                    attachments.push(attachment.url)
                                })
                                messageOptions.files = attachments
                            }
                            messageOptions.embed = messageEmbed
                            client.guilds.get(modMailGuild).channels.get(channel).send(messageOptions)
                                .then(__ => {
                                    m.react("✅")
                                })
                        }
                    })
                })
        }



    }


})

// Activity manager
let activityNum = 0

function updateActivity() {
    if (activityNum == 0) {
        //client.user.setActivity("over " + client.guilds.get(botConfig.guildID).memberCount + " members! | /help", {type: "WATCHING"})
        activityNum++
        return
    } else if (activityNum == 1) {
        client.user.setActivity("Skynet take over! | /help", {
            type: "WATCHING"
        })
        activityNum++
        return
    } else if (activityNum == 2) {
        client.user.setActivity("like Big Brother! | /help", {
            type: "WATCHING"
        })
        activityNum++
        return
    } else if (activityNum == 3) {
        client.user.setActivity("for the /help command!", {
            type: "WATCHING"
        })
        activityNum++
        return
    } else if (activityNum == 4) {
        client.user.setActivity("for new updates by @Feldma#1776!", {
            type: "WATCHING"
        })
        activityNum = 0
    }
}

setInterval(updateActivity, 300000)

/*

	BAN MANAGEMENT

*/




async function checkBanList() {
    // We need to do a check on a per-server basis, in case we use the bot in more than one server.

    // Retrieve the still-banned list.
    var fileLocation = path.join(__dirname, "servers/", botConfig.guildID + ".JSON")
    if (!fs.existsSync(fileLocation)) {
        fs.writeFileSync(fileLocation, '{"guild": {}}', {
            encoding: "utf8",
            flag: "wx"
        }) // create the file if it doesn't already exist and write some JSON to it to stop errors.
    }
    var server = JSON.parse(fs.readFileSync(fileLocation, "utf8")); // read the file.
    let serverInfo = server.guild
    let banTimers = serverInfo.banTimers || {}
    let muteTimers = serverInfo.muteTimers || {}
    let restrictTimers = serverInfo.restrictTimers || {}
    let boardTimers = serverInfo.boardTimers || {}

    let currentTime = (new Date()).getTime()

    // Iterate over all the objects to see if anyone needs to be unbanned.
    /*
    {
    userID: endDate1,
    userID1: endDate1
    }
    */

    for (userID in banTimers) {
        if (banTimers[userID] < currentTime) { // the user's ban has expired (the current time is greater than the ban time)
            this.guilds.get(botConfig.guildID).unban(userID, "(AUTO:) Temporary ban expired.")

            this.fetchUser(userID)
                .then(user => {
                    user.createDM()
                        .then(dmChannel => {
                            const unbanEmbed = new Discord.RichEmbed()
                                .setTitle("**You have been unbanned from " + this.guilds.get(botConfig.guildID).name + ".**")
                                .setFooter("Please read the rules once you rejoin.")
                                .setTimestamp(new Date())
                                .setColor(0x00FF00)

                            dmChannel.send({
                                    embed: unbanEmbed
                                })
                                .catch(err => {
                                    // realistically, this ain't gonna work because they're not in the same server.
                                    // so just catch the error.
                                })
                        })
                })

            // Then delete the value from the table.
            delete banTimers[userID]
        }
    }

    // Check for mutes as well.
    for (userID in serverInfo.muteTimers) {
        if (muteTimers[userID] < currentTime) { // mute has expired.
            let member = undefined
            await this.guilds.get(botConfig.guildID).fetchMember(userID)
                .then(_member => {
                    member = _member
                })
                .catch(err => {
                    console.log("USER ID " + userID + " is meant to be unmuted but is not part of the server anymore!")
                })

            if (member !== undefined) { // if it's undefined, then they've left. We just remove the timer, and then we're cool.
                // remove the role from them.
                member.removeRole(botConfig.muteRole, "(OVERSEER) - mute expired.")
                this.guilds.get(botConfig.guildID).channels.forEach((value, key) => {
                    if (value.permissionOverwrites.has(userID)) {
                        value.permissionOverwrites.get(userID).delete()
                    }
                })
                // We can let them know that they've been unmuted.
                member.createDM()
                    .then(dmChannel => {
                        const unbanEmbed = new Discord.RichEmbed()
                            .setTitle("**You have been unmuted from " + this.guilds.get(botConfig.guildID).name + ".**")
                            .setFooter("Please read the rules to ensure you do not get muted again.")
                            .setTimestamp(new Date())
                            .setColor(0x00FF00)

                        dmChannel.send({
                                embed: unbanEmbed
                            })
                            .catch(err => {
                                console.log("This shouldn't happen!")
                            })
                    })
            }

            delete muteTimers[userID]
            // Get rid of mute persist
            for (let i = 0; i < serverInfo.mutePersist; i++) {
                if (serverInfo.mutePersist[i] == userID) {
                    serverInfo.mutePersist.splice(i, 1)
                }
            }
        }
    }

    // Check for restrictions as well.
    for (userID in serverInfo.restrictTimers) {
        if (restrictTimers[userID] < currentTime) { // mute has expired.
            let member = this.guilds.get(botConfig.guildID).members.get(userID)

            if (member !== undefined) { // if it's undefined, then they've left. We just remove the timer, and then we're cool.
                // remove the role from them.
                member.removeRole(botConfig.restrictRole, "(OVERSEER) - restriction expired.")
                /*this.guilds.get(botConfig.guildID).channels.forEach( (value, key) => {
                    if (value.permissionOverwrites.has(userID)){
                        value.permissionOverwrites.get(userID).delete()
                    }
                })*/
                // We can let them know that they've been unmuted.
                member.createDM()
                    .then(dmChannel => {
                        const unbanEmbed = new Discord.RichEmbed()
                            .setTitle("**You have been unrestricted from " + this.guilds.get(botConfig.guildID).name + ".**")
                            .setFooter("Please read the rules to ensure you do not get restricted again.")
                            .setTimestamp(new Date())
                            .setColor(0x00FF00)

                        dmChannel.send({
                                embed: unbanEmbed
                            })
                            .catch(err => {
                                console.log("This shouldn't happen!")
                            })
                    })
            }

            delete restrictTimers[userID]
            // Get rid of mute persist
            for (let i = 0; i < serverInfo.restrictPersist; i++) {
                if (serverInfo.restrictPersist[i] == userID) {
                    serverInfo.restrictPersist.splice(i, 1)
                }
            }
        }
    }

    // Check for board people as well.
    for (userID in serverInfo.boardTimers) {
        if (boardTimers[userID] < currentTime) {
            await this.guilds.get(botConfig.guildID).fetchMembers()

            var member1 = undefined
            await this.guilds.get(botConfig.guildID).fetchMember(userID)
                .then(_member => {
                    member1 = _member
                })
                .catch(err => {
                    // they've left so just remove them from the list
                    delete boardTimers[userID]
                })

            if (member1 !== undefined) {
                member1.removeRole(botConfig.boardMemberRole, "(OVERSEER) - 24 hour trial period expired")
                member1.addRole(botConfig.memberRole)

                member1.createDM()
                    .then(dmChannel => {
                        const boardEmbed = new Discord.RichEmbed()
                            .setTitle("**You now have access to all channels in " + this.guilds.get(botConfig.guildID).name + "!**")
                            .setFooter("Thanks for your understanding and have a great day :)")
                            .setTimestamp(new Date())
                            .setColor(0x00FF00)

                        dmChannel.send({
                                embed: boardEmbed
                            })
                            .catch(err => {
                                console.log("This shouldn't happen!")
                            })
                    })
            }

            delete boardTimers[userID]
        }


    }

    fs.writeFile(fileLocation, JSON.stringify({
        "guild": serverInfo
    }, null, 2), (err) => {
        if (err) {
            console.error(error)
            console.log("ERROR")
        } else {
            //console.log("Updated ban and mute list successfully.")
        }
    })



}

// Create a timer that fires every 5 minutes, checking if anyone needs to be unbanned.

client.setInterval(checkBanList.bind(client), 60000)

/*

	STARBOARD / CURSED BOARD

*/

// Rip starboard.
var starredMessages = {} // messageID: starboardMessageID
var cursedMessages = {}


client.on("messageReactionAdd", (reaction, user) => {
    /*if (reaction.emoji.name == "⭐"){
        if (reaction.message.id in starredMessages){ // we've seen this message, so we want to edit it. Although we could delete messages that fall under 4 stars, that would be spammable, so we won't (for now)
            const embed = generateRichEmbed(reaction, user)
            reaction.message.guild.channels.get(botConfig.starboardID).messages.get(starredMessages[reaction.message.id]).edit(embed)
        }
        else { // we haven't seen it before, so check if it has at least 4 stars.
            if (reaction.count >= 6 && reaction.message.channel.id !== botConfig.starboardID){
                const embed = generateRichEmbed(reaction, user)
                reaction.message.guild.channels.get(botConfig.starboardID).send(embed)
                    .then( message => {
                        starredMessages[reaction.message.id] = message.id
                    })
            }
        }
    }
	/*else if (reaction.emoji.name == "😳"){
		if (reaction.message.id in cursedMessages){ // we've seen this message, so we want to edit it. Although we could delete messages that fall under 4 stars, that would be spammable, so we won't (for now)
			const embed = generateCursedRichEmbed(reaction, user)
			reaction.message.guild.channels.get(botConfig.cursedboardID).messages.get(cursedMessages[reaction.message.id]).edit(embed)
		}
		else { // we haven't seen it before, so check if it has at least 4 stars.
			if (reaction.count >= 4){
				const embed = generateCursedRichEmbed(reaction, user)
				reaction.message.guild.channels.get(botConfig.cursedboardID).send(embed)
					.then( message => {
							cursedMessages[reaction.message.id] = message.id
					})
			}
		}
	}*/

    // Prevent people from reacting to their own suggestion.
    if (reaction.message.channel.id == botConfig.suggestionChannel) {
        if (reaction.emoji.id == botConfig.upvoteEmoji || reaction.emoji.id == botConfig.downvoteEmoji) {
            // Iterate over all the reactions in the message, removing any from the person that created them.
            reaction.fetchUsers()
                .then(users => {
                    users.forEach((user, id) => {
                        if (id == reaction.message.author.id) {
                            reaction.remove(user)
                        }
                    })
                })
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

	INVITE TRACKER + PERSISTANT MUTES + WELCOME EMBED

*/

// Find the correct suffix (from stackoverflow)
function ordinal_suffix_of(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}

// Dynamically change text size.
const applyText = (canvas, text) => {
    const ctx = canvas.getContext("2d")

    // Declare a base (max) font size.
    let fontSize = 70

    do {
        // Assign the font to the context and decrement it so it can be measured again.
        ctx.font = `bold ${fontSize -= 10}px roboto`
        // Compare pixel width of the text to the canvas minus the approximate avatar size
    } while (ctx.measureText(text).width > canvas.width - 300)

    // Return the font to use in the actual canvas.
    return ctx.font
}



var inviteMap = new Map()
client.on("guildMemberAdd", async function (member) {
    console.log("Hello?")
    if (member.guild.id !== botConfig.guildID) {
        return
    }
    console.log("tesT")

    // Embed time
    const welcomeChannel = member.guild.channels.get(botConfig.welcomeChannel)


    // 700x250 pixels
    const canvas = Canvas.createCanvas(700, 250)

    const ctx = canvas.getContext('2d') // ctx = context

    // The wallpaper takes a bit of time to load, so await:

    const background = await Canvas.loadImage("./welcomeBG.jpg")
    // Stretch the background across the entire image.

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height)

    // Change the colour of our stroke
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 5
    // Draw a stroke rectangle (which only has a border) around the entire canvas.
    ctx.strokeRect(0.1, 0.1, canvas.width - 1, canvas.height - 1)

    // Do some weird things to make it a circle.
    // arc(x, y, radius, startingAngle(r), endAngle(r), counter-clockwise?)

    // Welcome text:
    // Smaller welcome text above the members display name

    // We want to create an anchor point and align around that.
    // Anchor at canvas.width/1.2

    //ctx.strokeStyle = "red"
    //ctx.moveTo(5, canvas.height/2)
    //ctx.lineTo(700, canvas.height/2)
    //ctx.stroke()

    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = 'bold 35px roboto'
    ctx.fillStyle = "#000000"
    ctx.fillText("Welcome", canvas.width / 1.5, canvas.height / 3.5)


    ctx.font = applyText(canvas, member.displayName)
    ctx.fillStyle = "#000000"
    ctx.fillText(member.displayName, canvas.width / 1.5, canvas.height / 2)

    ctx.font = "25px roboto"
    ctx.fillText("You are the " + ordinal_suffix_of(member.guild.memberCount) + " member!", canvas.width / 1.5, canvas.height / 1.35)

    // Start drawing a path.
    ctx.beginPath()
    // Create a circle using arc to create a clipping mask.
    ctx.arc(125, 125, 100, 0, Math.PI * 2, true)
    // Put the pen down
    ctx.closePath()
    // Draw a stroke circle.
    ctx.strokeStyle = "#FFFFFF"
    ctx.lineWidth = 8
    ctx.stroke()
    // Create a clipping mask, which will affect the next things to be drawn.
    ctx.clip()

    // Await the avatar loading.
    const avatar = await Canvas.loadImage(member.user.displayAvatarURL)
    // Draw the shape onto the main canvas.
    ctx.drawImage(avatar, 25, 25, 200, 200)



    const attachment = new Discord.Attachment(canvas.toBuffer(), "welcome-image.png")

    welcomeChannel.send(attachment)


    var fileLocation = path.join(__dirname, "servers/", member.guild.id + ".JSON")
    if (!fs.existsSync(fileLocation)) {
        fs.writeFileSync(fileLocation, '{"guild": {}}', {
            encoding: "utf8",
            flag: "wx"
        }) // create the file if it doesn't already exist and write some JSON to it to stop errors.
    }
    var server = JSON.parse(fs.readFileSync(fileLocation, "utf8")); // read the file.
    let serverInfo = server.guild



    // Check if the user is meant to be muted, if so mute them.
    let muteTimers = serverInfo.muteTimers || {}

    if (member.id in muteTimers) {
        member.addRole(botConfig.muteRole)
    }



    // We want to iterate over the invite lists to see which one has incremented.
    // If one has incremented since the last update, we know it was that invite.
    // If none have incremented, then we want to iterate over all the invites, see which ones have not been added to our list, then see which one of those has a use of 1.
    // If no results are found, then the invite was a one-use, or it reached a cap.



    serverInfo.scoreTable = serverInfo.scoreTable || {}
    serverInfo.seenIDTable = serverInfo.seenIDTable || []
    var scoreTable = serverInfo.scoreTable
    var seenTable = serverInfo.seenIDTable
    let boardIDList = ["302050872383242240", '712159616141623357', '705876500175519856', '546999467887427604', '481810078031282176', '478290034773196810', '572842779374518283', '581722486115270656', '415773861486002186', '599012354767847443', '389604896606781440', '668457636601004034', '543821218726281247', '669981037144702997', '368486558346772480', '697475034146537594', '614970561977909251']

    let giveNormalUnverified = true

    await member.guild.fetchInvites()
        .then((invites) => {
            let relevantInvite = null

            newInviteData = compressInviteInfo(invites)
            for (var inviteInfo of newInviteData) { // returns an array, key first index, invite second index.
                // See if the current key exists within our saved  data.
                var associatedData = inviteMap.get(inviteInfo[0])
                // If we know info about this key:
                if (associatedData !== undefined) {
                    if (inviteInfo[1].uses == (associatedData.uses + 1)) {
                        relevantInvite = inviteInfo
                        break
                    }
                }
                // We don't know anything about this key, so it's new:
                else {
                    // Check to see if it has a use of 1:
                    if (inviteInfo[1].uses == 1) {
                        relevantInvite = inviteInfo
                    }
                }
            }
            // At this point, we should either know which invite it was, or know that we CANT know.
            // So, let's print some info!
            if (relevantInvite !== null) {
                embedMessage = member.user + " was invited by " + relevantInvite[1].inviter + ". Invite code: " + relevantInvite[1].code + "."

                // Give them the disboard role if it's a disboard invite.
                if (relevantInvite[1].inviter !== undefined) {
                    if (boardIDList.includes(relevantInvite[1].inviter.id)) {
                        if (member.guild.roles.has("751666210013184081")) {
                            giveNormalUnverified = false
                            member.addRole("751666210013184081", "(OVERSEER) - Joined via Discord Board List invite.")
                        }
                    }
                }
            } else {
                embedMessage = member.user + " was invited with an untrackable invite (either a one-time-use invite, or the vanity invite)."
            }
            const embed = new Discord.RichEmbed()
                .setAuthor(member.displayName, member.user.avatarURL)
                .setTimestamp(new Date())
                .addField("**Member Joined!**", embedMessage)

            // Check if the account was created within recently:
            let userCreationDate = member.user.createdTimestamp

            let accountDuration = Date.now() - userCreationDate // milliseconds since the account creation.
            // Less than a week, orange, less than a day, dark red, less than an hour, bright red.
            if (accountDuration < 3600000) { // less than an hour.
                embed.setColor(0xFF0000)
                embed.addField("**WARNING:**", "Account was created " + humanizeDuration(accountDuration) + " ago!")
            } else if (accountDuration < 86400000) { // less than a day
                embed.setColor(0x8B0000)
                embed.addField("**Warning:**", "Account was created " + humanizeDuration(accountDuration) + " ago!")
            } else if (accountDuration < 604800000) { // less than a week
                embed.setColor(0xFFA500)
                embed.addField("**Alert:**", "Account was created " + humanizeDuration(accountDuration) + " ago!")
            } else { // account created a while ago
                embed.setColor(0x00FF00)
                embed.addField("**Account Age:**", "Acount was created " + humanizeDuration(accountDuration) + " ago.")
            }

            member.guild.channels.get(botConfig.inviteTrackerID).send(embed)



            // Lastly, update our invite info.
            inviteMap = newInviteData

            // We now need to see if we already know about this person. If we do, then we need to subtract one from the inviters amount so that they don't change score.
            let alreadyInvited = false
            if (seenTable.includes(member.id) && relevantInvite !== null) {
                alreadyInvited = true
                if (relevantInvite[1].inviter.id in scoreTable) {
                    scoreTable[relevantInvite[1].inviter.id] += -1
                } else {
                    scoreTable[relevantInvite[1].inviter.id] = -1
                }
            } else { // we want to add to the table.
                seenTable.push(member.id)
            }


            // Next step, see if anyone has just hit 10 or 50 or 250 invites, and if so give them a cool kids role.
            let inviteData = new Map()
            // Iterate over each invite, adding the # of uses per person.
            if (!alreadyInvited) {
                inviteMap.forEach((value, key) => {
                    if (inviteData.has(value.inviter.id)) {
                        let newVal = value.uses + inviteData.get(value.inviter.id)
                        inviteData.set(value.inviter.id, newVal)
                    } else {
                        inviteData.set(value.inviter.id, value.uses)
                    }
                })


            }

        })

    // Send message depending on how they joined
    const welcomeEmbed = new Discord.RichEmbed()

    // Automatically give the unverified role to people who join.
    let unverifiedRole = serverInfo.unverifiedRoleID || botConfig.unverifiedRole
    if (giveNormalUnverified) {
        member.addRole(unverifiedRole)

        welcomeEmbed.setColor(0xFFC0CB)
        welcomeEmbed.setAuthor(member.displayName, member.user.avatarURL)
        welcomeEmbed.setDescription("Welcome to the r/teamagers discord " + member + "!\n\nPlease check out " + member.guild.channels.get("714992141453099049") + " before typing `/verify` in the " + member.guild.channels.get(botConfig.verificationChannel) + " channel to see all the channels.\n\nYou'll also get access to the " + member.guild.channels.get("715100538814988369") + " channel, which you can use to assign yourself roles!\n\nIf you have any questions, please contact one of the moderators, and enjoy your time here!")
    } else {
        welcomeEmbed.setColor(0xFFC0CB)
        welcomeEmbed.setAuthor(member.displayName, member.user.avatarURL)
        welcomeEmbed.setDescription("Welcome to the r/teamagers discord " + member + "!\n\nSince you have joined from a discord server list, you'll have to fill out a short message before getting access to the rest of the server.\n\nPlease check out " + member.guild.channels.get("714992141453099049") + " before reading the instructions in " + member.guild.channels.get("751666079323127838") + ". If you have any questions, please feel free to contact one of the moderators, and enjoy your time here!")
    }

    member.createDM()
        .then(dmChannel => {
            dmChannel.send({
                embed: welcomeEmbed
            })
        })

    fs.writeFile(fileLocation, JSON.stringify({
        "guild": serverInfo
    }, null, 2), (err) => {
        if (err) {
            console.error(error)
        } else {}
    })



})

function compressInviteInfo(invites) {
    let compressedInfo = []
    invites.forEach((invite, key) => {
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
function generateRichEmbed(reaction, user) {
    const embed = new Discord.RichEmbed()
        .addField("Author:", reaction.message.author, true)
        .addField("Channel:", reaction.message.channel, true)
        .setColor(0xFFD700)
        .setTimestamp(new Date())
        .setFooter(reaction.count + "⭐")
    if (reaction.message.content !== "") {
        embed.addField("Message:", reaction.message.content)
    }
    embed.addField("View Message:", "[Jump To Message](" + reaction.message.url + ")")
    if (reaction.message.attachments.size !== 0) {
        embed.setImage(reaction.message.attachments.values().next().value.url) // because its a map, and we need to get the first value of the map and then get the url from that.
    }

    return embed
}

function generateCursedRichEmbed(reaction, user) {
    const embed = new Discord.RichEmbed()
        .addField("Author:", reaction.message.author, true)
        .addField("Channel:", reaction.message.channel, true)
        .setColor(0xFF0000)
        .setTimestamp(new Date())
        .setFooter(reaction.count + "😳")
    if (reaction.message.content !== "") {
        embed.addField("Message:", reaction.message.content)
    }
    embed.addField("View Message:", "[Jump To Message](" + reaction.message.url + ")")
    if (reaction.message.attachments.size !== 0) {
        embed.setImage(reaction.message.attachments.values().next().value.url) // because its a map, and we need to get the first value of the map and then get the url from that.
    }

    return embed
}


/*

    LOGGING

*/

// User joins or leaves VC.
client.on("voiceStateUpdate", (oldMember, newMember) => {
    if (oldMember.guild.id !== botConfig.guildID) {
        return
    }
    // See if the person joined a VC.
    if (newMember.voiceChannel !== undefined) {
        // voiceStateUpdate is called whenever someone changes anything about their voiceStatus - including muting, deafening.
        // Check if they switched channels.
        if (oldMember.voiceChannel == newMember.voiceChannel) {
            return
        } // they haven't switched, so ignore.

        // See if the person just switched channels:
        if (oldMember.voiceChannel !== undefined) {
            // They've switched channels, create an embed:
            let logEmbed = generateVoiceLogEmbed("**User Switched Voice Channels:**", newMember + " switched from " + oldMember.voiceChannel + " to " + newMember.voiceChannel + ".", newMember, 0xADD8E6)
            return client.guilds.get(botConfig.guildID).channels.get(botConfig.logChannel).send({
                embed: logEmbed
            })
        } else {
            // They just connected to the first channel.
            let logEmbed = generateVoiceLogEmbed("**User Joined Voice Channel**", newMember + " joined " + newMember.voiceChannel + ".", newMember, 0XADD8E6)
            return client.guilds.get(botConfig.guildID).channels.get(botConfig.logChannel).send({
                embed: logEmbed
            })
        }
    } else { // they left voice.
        // Check if they changed channel states (shouldn't happen, but anyway)
        if (oldMember.voiceChannel == newMember.voiceChannel) {
            return
        }

        // They should have left voice at this point:
        let logEmbed = generateVoiceLogEmbed("**User Left Voice Channel**", newMember + " left " + oldMember.voiceChannel + ".", newMember, 0XADD8E6)
        return client.guilds.get(botConfig.guildID).channels.get(botConfig.logChannel).send({
            embed: logEmbed
        })
    }
})

// Message is updated (i.e. edited)
client.on("messageUpdate", (oldMessage, newMessage) => {
    if (oldMessage.channel.type !== "text") {
        return
    }
    if (newMessage.guild.id !== botConfig.guildID) {
        return
    }
    // Ignore messages that come from the bot.
    if (newMessage.author.bot) {
        return
    }
    // First, just see if the messsage has no embeds and was just edited:
    // We could just check with .embeds.some(), but since it's faster to just compare length, and we expect this to be the norm, just do this and do another check later.
    if (oldMessage.embeds.length == 0 && newMessage.embeds.length == 0) {
        // No embeds, so just compares messages:
        const messageEmbed = new Discord.RichEmbed()
            .setColor(0x228B22)
            .setDescription("**Message Edit: " + newMessage.channel + "** ([View Message](" + newMessage.url + "))")
            .setTimestamp(new Date())
        if (newMessage.member == undefined) {
            messageEmbed.setAuthor(oldMessage.member.displayName, oldMessage.member.user.avatarURL)
        } else {
            messageEmbed.setAuthor(newMessage.member.displayName, newMessage.member.user.avatarURL)
        }
        if (oldMessage.content !== "") {
            if (oldMessage.content.length > 1024) {
                // We need to split the message up.
                // Message can't be bigger than 2000 characters, I think.
                messageEmbed.addField("**Before (Part 1):**", oldMessage.content.substring(0, 1000))
                messageEmbed.addField("**Before (Part 2):**", oldMessage.content.substring(1000, oldMessage.content.length))
            } else {
                messageEmbed.addField("**Before:**", oldMessage.content)
            }
        }
        if (newMessage.content !== "") {
            if (newMessage.content.length > 1024) {
                messageEmbed.addField("**After (Part 1):**", newMessage.content.substring(0, 1000))
                messageEmbed.addField("**After (Part 2):**", newMessage.content.substring(1000, newMessage.content.length))
            } else {
                messageEmbed.addField("**After:**", newMessage.content)
            }
        }
        return client.guilds.get(botConfig.guildID).channels.get(botConfig.logChannel).send({
                embed: messageEmbed
            })
            .catch(e => {
                const errorEmbed = new Discord.RichEmbed()
                    .setColor(0x228B22)
                    .setDescription("**Message Edit: " + newMessage.channel + "** ([View Message](" + newMessage.url + "))")
                    .addField("**ERROR:**", "Something went wrong, and the message edit cannot be sent. Please report this to @Feldma#1776.")
                if (newMessage.member == undefined) {
                    messageEmbed.setAuthor(oldMessage.member.displayName, oldMessage.member.user.avatarURL)
                } else {
                    messageEmbed.setAuthor(newMessage.member.displayName, newMessage.member.user.avatarURL)
                }
                client.guilds.get(botConfig.guildID).channels.get(botConfig.logChannel).send({
                    embed: errorEmbed
                })
            })
    } else { // there are embeds. Now the issue is that youtube links, twitter links, etc count as embeds and we want to deal with them.
        // See if any of the embeds are "rich" - if so we need to deal with them, otherwise forget about it.
        if (oldMessage.embeds.some(isEmbedRich) || newMessage.embeds.some(isEmbedRich)) {
            // There are embeds, handle them:
            const messageEmbed = new Discord.RichEmbed()
                .setColor(0x228B22)
                .setAuthor(newMessage.member.displayName, newMessage.member.user.avatarURL)
                .setDescription("**Message Edit: " + newMessage.channel + "** ([View Message](" + newMessage.url + "))")

            // Add message content if there was.
            if (oldMessage.content !== "") {
                messageEmbed.addField("**(Before) Content:**", oldMessage.content)
            }

            // Now iterate over the embeds.
            oldMessage.embeds.forEach((embed, key) => {
                if (embed.type !== "rich") {
                    return
                } // only handle rich embeds.
                for (let i = 0; i < embed.fields.length; i++) {
                    messageEmbed.addField("**(Before) " + embed.fields[i].name + "**", embed.fields[i].value, embed.fields[i].inline)
                }
            })

            // Now repeat for the new message.
            if (newMessage.content !== "") {
                messageEmbed.addField("**(After) Content:**", newMessage.content)
            }

            newMessage.embeds.forEach((embed, key) => {
                if (embed.type !== "rich") {
                    return
                } // only handle rich embeds.
                for (let i = 0; i < embed.fields.length; i++) {
                    messageEmbed.addField("**(Before) " + embed.fields[i].name + "**", embed.fields[i].value, embed.fields[i].inline)
                }
            })

            // Now send! There's a pretty decent chance the embed won't be able to send because it's too big, so catch that:
            // If there are too many fields, ABORT!
            if (messageEmbed.fields.length >= 25) {
                const errorEmbed = new Discord.RichEmbed()
                    .setColor(0x228B22)
                    .setAuthor(newMessage.member.displayName, newMessage.member.user.avatarURL)
                    .setDescription("**Message Edit: " + newMessage.channel + "** ([View Message](" + newMessage.url + "))")
                    .addField("**ERROR:**", "Too many fields to note the message edit - this was likely because of large embeds being edited.")

                return client.guilds.get(botConfig.guildID).channels.get(botConfig.logChannel).send({
                    embed: errorEmbed
                })
            }
            return client.guilds.get(botConfig.guildID).channels.get(botConfig.logChannel).send({
                    embed: messageEmbed
                })
                .catch(e => {
                    // Shouldn't happen.
                })


        } else { // there are embeds, but we don't care because they aren't richembeds. Just do the same as no embeds.
            const messageEmbed = new Discord.RichEmbed()
                .setColor(0x228B22)
                .setDescription("**Message Edit: " + newMessage.channel + "** ([View Message](" + newMessage.url + "))")
                .setTimestamp(new Date())
            if (newMessage.member == undefined) {
                messageEmbed.setAuthor(oldMessage.member.displayName, oldMessage.member.user.avatarURL)
            } else {
                messageEmbed.setAuthor(newMessage.member.displayName, newMessage.member.user.avatarURL)
            }

            if (oldMessage.content !== "") {
                if (oldMessage.content.length > 1024) {
                    // We need to split the message up.
                    // Message can't be bigger than 2000 characters, I think.
                    messageEmbed.addField("**Before (Part 1):**", oldMessage.content.substring(0, 1000))
                    messageEmbed.addField("**Before (Part 2):**", oldMessage.content.substring(1000, oldMessage.content.length))
                } else {
                    messageEmbed.addField("**Before:**", oldMessage.content)
                }
            }
            if (newMessage.content !== "") {
                if (newMessage.content.length > 1024) {
                    messageEmbed.addField("**After (Part 1):**", newMessage.content.substring(0, 1000))
                    messageEmbed.addField("**After (Part 2):**", newMessage.content.substring(1000, newMessage.content.length))
                } else {
                    messageEmbed.addField("**After:**", newMessage.content)
                }
            }
            return client.guilds.get(botConfig.guildID).channels.get(botConfig.logChannel).send({
                    embed: messageEmbed
                })
                .catch(e => {
                    const errorEmbed = new Discord.RichEmbed()
                        .setColor(0x228B22)
                        .setDescription("**Message Edit: " + newMessage.channel + "** ([View Message](" + newMessage.url + "))")
                        .addField("**ERROR:**", "Something went wrong, and the message edit cannot be sent. Please report this to @Feldma#1776.")
                    if (newMessage.member == undefined) {
                        messageEmbed.setAuthor(oldMessage.member.displayName, oldMessage.member.user.avatarURL)
                    } else {
                        messageEmbed.setAuthor(newMessage.member.displayName, newMessage.member.user.avatarURL)
                    }
                    client.guilds.get(botConfig.guildID).channels.get(botConfig.logChannel).send({
                        embed: errorEmbed
                    })
                })
        }

    }
})

// Message is deleted.
client.on("messageDelete", (message) => {
    if (message.guild == undefined) {
        return
    }
    if (message.guild.id !== botConfig.guildID) {
        return
    }

    if (message.author.bot) {
        return
    }
    // Shouldn't be too much of an issue, but handle images as well.
    const messageEmbed = new Discord.RichEmbed()
        .setColor(0x8B0000)
        .setAuthor(message.member && message.member.displayName || message.author.username, message.author.avatarURL)
        .setDescription("**Message by " + message.member + " deleted in " + message.channel + ".**")

    if (message.content !== "") {
        messageEmbed.addField("**Message Contents:**", message.content)
    }

    // Check if there is an image.
    if (message.attachments.size !== 0) {
        // We can't actually get images that have been deleted, but make a note of it.
        messageEmbed.addField("**Note:**", "There was an image in the message, but it cannot be displayed due to Discord restrictions.")
    }

    // And send!
    return client.guilds.get(botConfig.guildID).channels.get(botConfig.logChannel).send({
        embed: messageEmbed
    })

})

// Bulk message delete - let's save this to a file!
client.on("messageDeleteBulk", (messageCollection) => {
    // messageCollection -> Collection <Snowflake, Message>
    // Create a string that we are going to add everything to.
    let saveString = ""

    // Save the first message so we can refer to it.
    let firstMessage = messageCollection.first()
    if (firstMessage.guild.id !== botConfig.guildID) {
        return
    }


    messageCollection.forEach((message, snowflake) => {
        // USERNAME#DISCRIMINATOR (timestamp) - SNOWFLAKE
        let appendString = message.author.username + message.author.discriminator + message.createdAt.toString() + " - " + snowflake.toString() + ":\n" + message.content + "\n"
        saveString = appendString + saveString
    })

    // Now save the file.
    let fileLocation = path.join(__dirname, "guildBulkDelete.txt")

    fs.writeFile(fileLocation, saveString, (err) => {
        if (err) {
            console.error(error)
            return client.guilds.get(botConfig.guildID).channels.get(botConfig.logChannel).send("**Error occured whilst trying to save the bulk delete file. Should not happen. Contact @Feldma#1776.")
        }
        // now we want to send the file.
        const messageEmbed = new Discord.RichEmbed()
            .setColor(0xFF0000)
            .setDescription("**Bulk message delete occured in " + firstMessage.channel + " - " + messageCollection.size.toString() + " message deleted.**")
            .setTimestamp(new Date())

        // Now send with the attachment.
        return client.guilds.get(botConfig.guildID).channels.get(botConfig.logChannel).send({
                embed: messageEmbed
            })
            .then(_msg => { // send the text file after the embed.
                client.guilds.get(botConfig.guildID).channels.get(botConfig.logChannel).send({
                    files: [{
                        attachment: fileLocation,
                        name: "bulkDelete.txt"
                    }]
                })
            })
            .catch(console.error)

    })


})


// User update - if they change their nickname or are assigned a new role.
client.on("guildMemberUpdate", (oldMember, newMember) => {
    if (newMember.guild.id !== botConfig.guildID) {
        return
    }
    // Check for a username change.
    if (oldMember.nickname !== newMember.nickname) {
        // Nickname changed, let's display that:
        const nameEmbed = new Discord.RichEmbed()
            .setColor(0xADD8E6)
            .setAuthor(newMember.displayName, newMember.user.avatarURL)
            .setTimestamp(new Date())
            .setDescription(newMember + " changed their nickname:")
            .addField("**Before:**", oldMember.displayName, true)
            .addField("**After:**", newMember.displayName, true)
        return client.guilds.get(botConfig.guildID).channels.get(botConfig.logChannel).send({
                embed: nameEmbed
            })
            .catch(console.error)
    }

    // Check for role change.
    if (oldMember.roles.size !== newMember.roles.size) {

        // Figure out who changed their roles:
        oldMember.guild.fetchAuditLogs({
                limit: 1,
                type: 25
            })
            .then(log => {
                let executor = log.entries.first().executor

                const infoEmbed = new Discord.RichEmbed()
                    .setColor(0x90ee90)
                    .setAuthor(newMember.displayName, newMember.user.avatarURL)
                    .setTimestamp(new Date())


                // Figure out which role has changed.
                // Iterate through the oldMember role list, removing any item that is common to both roles.
                let oldRoles = oldMember.roles
                let newRoles = newMember.roles

                let oldRolesFiltered = oldRoles.filter(function (element) {
                    return !newRoles.has(element.id)
                })


                // If we have a role, we found it. If not, we have to go the other way:
                if (oldRolesFiltered.size == 1) {
                    infoEmbed.setDescription("**" + newMember + " was removed from the role " + oldRolesFiltered.first() + " by " + executor + ".**")

                    // check for staff list update
                    if (modRoles.includes(oldRolesFiltered.first().id)) {
                        updateStaffList(newMember)
                    }
                } else {
                    let newRolesFiltered = newRoles.filter(function (element) {
                        return !oldRoles.has(element.id)
                    })

                    if (newRolesFiltered.size !== 1) {
                        infoEmbed.setDescription("**Unknown role change for " + newMember + " - this should not happen!**\n\nPlease contact @Feldma#1776.")
                    } else {
                        infoEmbed.setDescription("**" + newMember + " was assigned the role " + newRolesFiltered.first() + " by " + executor + " .**")
                        if (modRoles.includes(newRolesFiltered.first().id)) {
                            updateStaffList(newMember)
                        }
                    }

                }

                return client.guilds.get(botConfig.guildID).channels.get(botConfig.logChannel).send({
                        embed: infoEmbed
                    })
                    .catch(console.error)
                console.log(oldRolesFiltered)
            })
    }
})

// When a member leaves the guild:
client.on("guildMemberRemove", async function (member) {
    if (member.guild.id !== botConfig.guildID) {
        return
    }

    // Embed time
    const welcomeChannel = member.guild.channels.get(botConfig.welcomeChannel)


    // 700x250 pixels
    const canvas = Canvas.createCanvas(700, 250)

    const ctx = canvas.getContext('2d') // ctx = context

    // The wallpaper takes a bit of time to load, so await:

    const background = await Canvas.loadImage("./goodbyeBG.jpg")
    // Stretch the background across the entire image.

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height)

    // Change the colour of our stroke
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 5
    // Draw a stroke rectangle (which only has a border) around the entire canvas.
    ctx.strokeRect(0.1, 0.1, canvas.width - 1, canvas.height - 1)

    // Do some weird things to make it a circle.
    // arc(x, y, radius, startingAngle(r), endAngle(r), counter-clockwise?)

    // Welcome text:
    // Smaller welcome text above the members display name

    // We want to create an anchor point and align around that.
    // Anchor at canvas.width/1.2

    //ctx.strokeStyle = "red"
    //ctx.moveTo(5, canvas.height/2)
    //ctx.lineTo(700, canvas.height/2)
    //ctx.stroke()

    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = 'bold 35px roboto'
    ctx.fillStyle = "#FFFFFF"
    ctx.fillText("Goodbye", canvas.width / 1.5, canvas.height / 3.5)


    ctx.font = applyText(canvas, member.displayName)
    ctx.fillStyle = "#FFFFFF"
    ctx.fillText(member.displayName, canvas.width / 1.5, canvas.height / 2)

    ctx.font = "25px roboto"
    ctx.fillText("We will miss you :(", canvas.width / 1.5, canvas.height / 1.35)

    // Start drawing a path.
    ctx.beginPath()
    // Create a circle using arc to create a clipping mask.
    ctx.arc(125, 125, 100, 0, Math.PI * 2, true)
    // Put the pen down
    ctx.closePath()
    // Draw a stroke circle.
    ctx.strokeStyle = "#FFFFFF"
    ctx.lineWidth = 8
    ctx.stroke()
    // Create a clipping mask, which will affect the next things to be drawn.
    ctx.clip()

    // Await the avatar loading.
    const avatar = await Canvas.loadImage(member.user.displayAvatarURL)
    // Draw the shape onto the main canvas.
    ctx.drawImage(avatar, 25, 25, 200, 200)



    const attachment = new Discord.Attachment(canvas.toBuffer(), "goodbye-image.png")

    welcomeChannel.send(attachment)

    // Send a goodbye message to the welcome channel.
    //member.guild.channels.get(botConfig.welcomeChannel).send(member.displayName + "#" + member.user.discriminator + " has left the server :((")

    const messageEmbed = new Discord.RichEmbed()
        .setColor(0x00008B)
        .setAuthor(member.displayName, member.user.avatarURL)
        .setDescription(member + " left the server.")
        .setTimestamp(new Date())
    return client.guilds.get(botConfig.guildID).channels.get(botConfig.logChannel).send({
            embed: messageEmbed
        })
        .catch(console.error)
})


// Suggestion/feedback upvote time.
client.on("message", msg => {
    if (msg.channel.type !== "text") {
        return
    }
    if (msg.guild.id !== botConfig.guildID && msg.guild.id !== "670371258516504578") {
        return
    }

    // TESTING WELCOME FEATURE
    //if (msg.content == "/debugboard"){
    //  checkBanList()
    //}
    /*if (msg.content === "!join"){
        client.emit('guildMemberAdd', msg.member)
    }*/

    if (msg.channel.id == botConfig.suggestionChannel || msg.channel.id == "704461149336502302" || msg.channel.id == "695329016692867192" || msg.channel.id == "792760191341821972" || msg.channel.id == "792790813984686092") {
        // Upvote downvote time!
        if (msg.guild.id == botConfig.guildID) {
            msg.react(msg.guild.emojis.get(botConfig.upvoteEmoji))
                .then(react => {
                    msg.react(msg.guild.emojis.get(botConfig.downvoteEmoji))
                })
        } else {
            msg.react(msg.guild.emojis.get("795786917802541057"))
                .then(_react => {
                    msg.react(msg.guild.emojis.get("795786957191643176"))
                })
        }
    }


    // purge discord links
    const regexExp = /\b(?<!cdn\.)discord(app)?\.(gg|com)\/(invite\/)?(?!channels\/).*\b/

    if (regexExp.test(msg.content) == true) {
        if ((msg.member !== undefined) && !msg.member.hasPermission("MANAGE_MESSAGES") && !msg.member.roles.has("719907708559687730")) {
            msg.delete()
        }
    }
})

function generateVoiceLogEmbed(title, content, user, colour) {
    const embed = new Discord.RichEmbed()
        .setColor(colour)
        .setTimestamp(new Date())
        .setAuthor((user.nickname || user.user.username), user.user.avatarURL)
        .addField(title, content)
    return embed
}

function isEmbedRich(element) {
    return element.type == "rich"
}


/*

    MORE LOGGING: CHANNEL CREATION AND DELETION.

*/

client.on("channelCreate", channel => {

    // Can't really get much information from the channel variable, so let's have a look at the audit log.
    if (channel.guild == undefined || channel.guild == null) {
        return
    }
    if (channel.guild.id !== botConfig.guildID) {
        return
    }

    channel.guild.fetchAuditLogs({
            limit: 1,
            type: 10
        }) // channel create
        .then(log => {
            const infoEmbed = new Discord.RichEmbed()
                .setColor(0x8c00ff)
                .setTimestamp(new Date())
                .setFooter("Channel ID: " + channel.id)
            // Figure out who did it.
            let executor = log.entries.first().executor
            infoEmbed.setAuthor(executor.username, executor.avatarURL)
            infoEmbed.setDescription("**Channel " + channel + " created by " + executor + ".**")

            return client.guilds.get(botConfig.guildID).channels.get(botConfig.modLogChannel).send({
                    embed: infoEmbed
                })
                .catch(console.error)
        })
})

client.on("channelDelete", channel => {
    if (channel.guild == undefined) {
        return
    }
    if (channel.guild.id !== botConfig.guildID) {
        return
    }
    // Can't really get much information from the channel variable, so let's have a look at the audit log.
    channel.guild.fetchAuditLogs({
            limit: 1,
            type: 12
        }) // channel create
        .then(log => {
            const infoEmbed = new Discord.RichEmbed()
                .setColor(0x8c00ff)
                .setTimestamp(new Date())
                .setFooter("Channel ID: " + channel.id)
            // Figure out who did it.
            let executor = log.entries.first().executor
            infoEmbed.setAuthor(executor.username, executor.avatarURL)
            infoEmbed.setDescription("**Channel " + channel.name + " deleted by " + executor + ".**")

            return client.guilds.get(botConfig.guildID).channels.get(botConfig.modLogChannel).send({
                    embed: infoEmbed
                })
                .catch(console.error)
        })
})

client.on("channelUpdate", (oldChannel, newChannel) => {
    if (oldChannel.guild.id !== botConfig.guildID) {
        return
    }
    // Figure out who ran the command first
    oldChannel.guild.fetchAuditLogs({
            limit: 1,
            type: 11
        })
        .then(log => {
            let executor = log.entries.first().executor

            const infoEmbed = new Discord.RichEmbed()
                .setColor(0x8c00ff)
                .setTimestamp(new Date())
                .setFooter("Channel ID: " + newChannel.id)
                .setAuthor(executor.username, executor.avatarURL)
                .setDescription("**" + executor + " made the following changes to " + newChannel + ":**")

            if (oldChannel.name !== undefined && newChannel.name !== undefined) { // because it could be
                if (oldChannel.name !== newChannel.name) {
                    infoEmbed.addField("**Name Changed:**", `Channel name was changed from \`${oldChannel.name}\` to \`${newChannel.name}\`.`)
                }
            }
            if (oldChannel.type !== newChannel.type) {
                infoEmbed.addField("**Type Changed:**", `Channel type was changed from \`${oldChannel.type}\` to \`${newChannel.type}\`.`)
            }
            if (oldChannel.topic !== undefined && newChannel.topic !== undefined) {
                if (oldChannel.topic !== newChannel.topic) {
                    infoEmbed.addField("**Topic Changed:**", `Channel topic was changed from \`${oldChannel.topic}\` to \`${newChannel.topic}\`.`)
                }
            }
            if (oldChannel.parent !== newChannel.parent) {
                infoEmbed.addField("**Parent Changed:**", `Channel parent was changed from \`${oldChannel.parent}\` to \`${newChannel.parent}\`.`)
            }
            if (oldChannel.calculatedPosition !== newChannel.calculatedPosition) {
                infoEmbed.addField("**Position Changed:**", `Channel position was changed from \`${oldChannel.calculatedPosition}\` to \`${newChannel.calculatedPosition}\`.`)
            }
            if (oldChannel.rateLimitPerUser !== undefined && newChannel.rateLimitPerUser !== undefined) {
                if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
                    infoEmbed.addField("**Slowmode Changed:**", `Channel slowmode was changed from \`${oldChannel.rateLimitPerUser}\` second(s) to \`${newChannel.rateLimitPerUser}\` second(s).`)
                }
            }

            if (infoEmbed.fields.length == 0) {
                return
            } else {
                infoEmbed.addField("**Note:**", "Not all channel changes are tracked by Overseer. Check the audit log for more information!")
                return client.guilds.get(botConfig.guildID).channels.get(botConfig.modLogChannel).send({
                        embed: infoEmbed
                    })
                    .catch(console.error)
            }

        })

})

client.on("roleCreate", role => {
    if (role.guild.id !== botConfig.guildID) {
        return
    }
    role.guild.fetchAuditLogs({
            limit: 1,
            type: 30
        })
        .then(log => {
            let executor = log.entries.first().executor

            const infoEmbed = new Discord.RichEmbed()
                .setColor(0x90ee90)
                .setAuthor(executor.username, executor.avatarURL)
                .setTimestamp(new Date())
                .setDescription("**" + executor + " created a new role (" + role + ") with ID " + role.id + "**.")
                .setFooter("Role ID: " + role.id)
            return client.guilds.get(botConfig.guildID).channels.get(botConfig.modLogChannel).send({
                    embed: infoEmbed
                })
                .catch(console.error)

        })
})

client.on("roleDelete", role => {
    if (role.guild.id !== botConfig.guildID) {
        return
    }
    role.guild.fetchAuditLogs({
            limit: 1,
            type: 32
        })
        .then(log => {
            let executor = log.entries.first().executor

            const infoEmbed = new Discord.RichEmbed()
                .setColor(0x90ee90)
                .setAuthor(executor.username, executor.avatarURL)
                .setTimestamp(new Date())
                .setDescription("**" + executor + " deleted the role " + role.name + " with ID " + role.id + "**.")
                .setFooter("Role ID: " + role.id)
            return client.guilds.get(botConfig.guildID).channels.get(botConfig.modLogChannel).send({
                    embed: infoEmbed
                })
                .catch(console.error)
        })
})

const permissionTypes = [
    "ADMINISTRATOR",
    "VIEW_AUDIT_LOG",
    "MANAGE_GUILD",
    "MANAGE_ROLES",
    "MANAGE_CHANNELS",
    "KICK_MEMBERS",
    "BAN_MEMBERS",
    "CREATE_INSTANT_INVITE",
    "CHANGE_NICKNAME",
    "MANAGE_NICKNAMES",
    "MANAGE_EMOJIS",
    "MANAGE_WEBHOOKS",
    "VIEW_CHANNEL",
    "SEND_MESSAGES",
    "SEND_TTS_MESSAGES",
    "MANAGE_MESSAGES",
    "EMBED_LINKS",
    "ATTACH_FILES",
    "READ_MESSAGE_HISTORY",
    "MENTION_EVERYONE",
    "USE_EXTERNAL_EMOJIS",
    "ADD_REACTIONS",
    "CONNECT",
    "SPEAK",
    "MUTE_MEMBERS",
    "DEAFEN_MEMBERS",
    "MOVE_MEMBERS",
    "USE_VAD"
]
const permissions = {
    ADMINISTRATOR: 'Administrator (all permissions)',
    VIEW_AUDIT_LOG: 'View audit log',
    MANAGE_GUILD: 'Manage server',
    MANAGE_ROLES: 'Manage roles',
    MANAGE_CHANNELS: 'Manage channels',
    KICK_MEMBERS: 'Kick members',
    BAN_MEMBERS: 'Ban members',
    CREATE_INSTANT_INVITE: 'Create instant invite',
    CHANGE_NICKNAME: 'Change nickname',
    MANAGE_NICKNAMES: 'Manage nicknames',
    MANAGE_EMOJIS: 'Manage emojis',
    MANAGE_WEBHOOKS: 'Manage webhooks',
    VIEW_CHANNEL: 'Read text channels and see voice channels',
    SEND_MESSAGES: 'Send messages',
    SEND_TTS_MESSAGES: 'Send TTS messages',
    MANAGE_MESSAGES: 'Manage messages',
    EMBED_LINKS: 'Embed links',
    ATTACH_FILES: 'Attach files',
    READ_MESSAGE_HISTORY: 'Read message history',
    MENTION_EVERYONE: 'Mention everyone',
    USE_EXTERNAL_EMOJIS: 'Use external emojis',
    ADD_REACTIONS: 'Add reactions',
    CONNECT: 'Connect',
    SPEAK: 'Speak',
    MUTE_MEMBERS: 'Mute members',
    DEAFEN_MEMBERS: 'Deafen members',
    MOVE_MEMBERS: 'Move members',
    USE_VAD: 'Use voice activity'
};

client.on("roleUpdate", (oldRole, newRole) => {
    if (oldRole.guild.id !== botConfig.guildID) {
        return
    }
    oldRole.guild.fetchAuditLogs({
            limit: 1,
            type: 31
        })
        .then(log => {
            let executor = log.entries.first().executor

            const infoEmbed = new Discord.RichEmbed()
                .setColor(0x90ee90)
                .setAuthor(executor.username, executor.avatarURL)
                .setDescription("Role ID: " + newRole.id)
                .setTimestamp(new Date())
                .setDescription("**" + executor + " made the following changes to " + newRole + ":**")

            if (oldRole.name !== newRole.name) {
                infoEmbed.addField("**Name Changed:**", `Role name was changed from \`${oldRole.name}\` to \`${newRole.name}\`.`)
            }

            if (oldRole.hoist !== newRole.hoist) {
                infoEmbed.addField("**Hoist Changed:**", `Role hoisting was switched from \`${oldRole.hoist}\` to \`${newRole.hoist}\`.`)
            }

            if (oldRole.hexColor !== newRole.hexColor) {
                infoEmbed.addField("**Color Changed:**", `Role color was changed from \`${oldRole.hexColor}\` to \`${newRole.hexColor}\`.`)
            }

            if (oldRole.mentionable !== newRole.mentionable) {
                infoEmbed.addField("**@Mention-able Change:**", `Role mention was switched from \`${oldRole.mentionable}\` to \`${newRole.mentionable}\`.`)
            }

            if (oldRole.permissions !== newRole.permissions) {
                // Make it look good.
                let oldSer = oldRole.serialize()
                let newSer = newRole.serialize()

                let oldPermissions = ""
                let newPermissions = ""
                for (let i = 0; i < permissionTypes.length; i++) {
                    oldPermissions += (permissions[permissionTypes[i]] + ": " + (oldSer[permissionTypes[i]] ? "✅" : "❌") + "\n")
                    newPermissions += (permissions[permissionTypes[i]] + ": " + (newSer[permissionTypes[i]] ? "✅" : "❌") + "\n")
                }

                infoEmbed.addField("**Previous Role Permissions:**", oldPermissions, true)
                infoEmbed.addField("**New Role Permissions:**", newPermissions, true)
            }

            if (infoEmbed.fields.length !== 0) {
                return client.guilds.get(botConfig.guildID).channels.get(botConfig.modLogChannel).send({
                        embed: infoEmbed
                    })
                    .catch(console.error)
            } else {
                return
            }


        })

})


function updateStaffList(member) {
    console.log("running!")
    // we need to develop a new table of values
    // find everyone that has one of the roles.
    let modInfo = {}
    // iterate over every member of the server
    member.guild.members.forEach((member, id) => {
        for (let i = 0; i < modRoles.length; i++) {
            if (member.roles.has(modRoles[i])) {
                if (modRoles[i] in modInfo) {
                    modInfo[modRoles[i]].push(member)
                } else {
                    modInfo[modRoles[i]] = [member]
                }
            }
        }
    })

    // we should now have all the info saved per role.
    // roles should be saved in the modRoles in order.
    // now generate the embed
    let seenMods = []
    const staffEmbed = new Discord.RichEmbed()
        .setColor(0xf39ab5)
        .setTitle("Staff List")
    for (let i = 0; i < modRoles.length; i++) {
        let currentInfo = ""
        if (!(modRoles[i] in modInfo)) {
            continue
        }
        for (let j = 0; j < modInfo[modRoles[i]].length; j++) {
            let currentMod = modInfo[modRoles[i]][j]
            if (!(seenMods.includes(currentMod))) {
                currentInfo += currentMod + "\n"
                seenMods.push(currentMod)
            }
        }
        let roleName = member.guild.roles.get(modRoles[i]).name
        staffEmbed.addField("**" + roleName + "**", currentInfo)
    }

    // now edit the message
    member.guild.channels.get(staffListChannel).fetchMessage(staffListID)
        .then(message => {
            message.edit({
                embed: staffEmbed
            })
        })
}

// SERVER FILE BACKUP
schedule.scheduleJob('0 0 * * *', () => {

    // see what file we should update (so we only have to deal with two files not 1000)
    // retrieve both files
    var fileLocation = path.join(__dirname, "servers/", botConfig.guildID + ".JSON")
    fs.stat(path.join(__dirname, "backups/backup1.JSON"), (err, stats) => {
        let firstBackup = stats.mtimeMs

        fs.stat(path.join(__dirname, "backups/backup2.JSON"), (err1, stats1) => {
            let secondBackup = stats1.mtimeMs

            if (firstBackup > secondBackup) { // modify the second file
                fs.copyFile(fileLocation, path.join(__dirname, "backups/backup2.JSON"), (err) => {
                    if (err) {
                        console.log(err)
                    }
                })
            } else {
                fs.copyFile(fileLocation, path.join(__dirname, "backups/backup1.JSON"), (err) => {
                    if (err) {
                        console.log(err)
                    }
                })
            }
        })
    })

})

client.on("error", (err) => console.error(err))


client.login("code removed for obvious reasons")
