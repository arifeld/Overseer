const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

const path = require("path")

const base = require(path.join(__dirname, "../../custom_modules/base.js"))

module.exports = class Verify extends Command {
	constructor(client) {
		super(client, {
			name: "verify",
			group: "verification",
			memberName: "verify",
			description: ""
		})
	}


	run(msg, args){
		let serverInfo = base.getServerInfo(msg)
    let verifyChannel = serverInfo.verifyChannel || "620136214380675082"
    let unverifiedRole = serverInfo.unverifiedRoleID || "620135189208629248"
    if (msg.channel.id !== verifyChannel){
      return
    }
    // Check if the user has the "Unverified Role"
    if (!msg.member.roles.has(unverifiedRole)){
      return
    }

    // Delete the verified role.
    msg.member.removeRole(unverifiedRole)
    msg.channel.send("Successfully verified.")
	 }
}
